/**
 * WeatherMapsWidget Component
 *
 * Unified 4-tab weather map section replacing the old RadarMap.
 * All modes share the same marker and GeoJSON border overlay.
 * Wind and temperature modes use CartoDB Positron (light/grey) base map
 * for better contrast; Radar and Felhőtérkép use OSM.
 *
 * Tabs:
 *   Radar        - RainViewer tile layer, animated (~13 frames, 5-min intervals)
 *   Felhőtérkép  - OMSZ MSG InfraCloud IR satellite PNG, animated (6 frames, 15-min intervals)
 *   Szél         - OpenWeatherMap wind_new tile layer (via Netlify Edge proxy)
 *   Hőmérséklet  - OpenWeatherMap temp_new tile layer (via Netlify Edge proxy)
 *
 * Data sources:
 *   Radar:      https://api.rainviewer.com / https://tilecache.rainviewer.com
 *   Satellite:  https://odp.met.hu (proxied via /met-satellite/)
 *   Wind/Temp:  tile.openweathermap.org (proxied via /owm-tiles/ edge function)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ImageOverlay,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L, { icon as leafletIcon } from 'leaflet';
import type { LatLngBoundsExpression, StyleFunction } from 'leaflet';
import { useWindMapData } from '../../hooks/useWindMapData';
import { useTempMapData } from '../../hooks/useTempMapData';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { CloudRain, Globe2, Wind, Thermometer, Play, Pause } from 'lucide-react';
import { EmptyState } from '../../components/UI/EmptyState';
import { MapPin } from 'lucide-react';
import type { City } from '../../types';
import bordersData from '../../data/centralEuropeBorders.json';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const defaultIcon = leafletIcon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default map view — centered on southern Hungary (Pécs–Baja–Mohács triangle)
const DEFAULT_MAP_CENTER: [number, number] = [45.85, 18.5];
const DEFAULT_MAP_ZOOM = 9;

// Map view bounds (all 4 modes use the same view)
const MAP_BOUNDS: LatLngBoundsExpression = [
  [44.0, 13.5],
  [50.5, 25.5],
];

// Satellite image bounds (OMSZ MSG European sector)
// Note: verify exact bounds from OMSZ Leiras_MSG-hu.pdf if image appears misaligned
const SATELLITE_BOUNDS: LatLngBoundsExpression = [
  [27.0, -28.0],
  [70.0, 50.0],
];

const RADAR_INTERVAL_MS = 800;
const SATELLITE_FRAME_COUNT = 6;
const SATELLITE_INTERVAL_MS = 1500;

const BORDER_STYLE: StyleFunction = () => ({
  color: '#444',
  weight: 1.5,
  fillOpacity: 0,
  opacity: 0.8,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MapMode = 'radar' | 'satellite' | 'wind' | 'temperature';

interface WeatherFrame {
  timestamp: string;
  url: string;
}

interface Tab {
  mode: MapMode;
  label: string;
  Icon: React.FC<{ className?: string }>;
  source: string;
  description: string;
  legendType: 'radar' | 'satellite' | 'owm-wind' | 'owm-temp';
}

const TABS: Tab[] = [
  {
    mode: 'radar',
    label: 'Radar',
    Icon: CloudRain,
    source: 'RainViewer',
    description: 'Csapadékintenzitás animált radarképe (RainViewer). Zöld = gyenge, sárga = közepes, narancs/piros = erős csapadék.',
    legendType: 'radar',
  },
  {
    mode: 'satellite',
    label: 'Felhőtérkép',
    Icon: Globe2,
    source: 'OMSZ',
    description: 'OMSZ Meteosat-11 infravörös felvétel. Fehér/világos = vastag magas felhők. Szürke = alacsony/vékony felhők. Sötét = derült ég.',
    legendType: 'satellite',
  },
  {
    mode: 'wind',
    label: 'Szél',
    Icon: Wind,
    source: 'OWM',
    description: 'Szélsebesség (OpenWeatherMap). Alacsony szélsebességnél (< 5 m/s) a réteg szinte átlátszó — ez normális.',
    legendType: 'owm-wind',
  },
  {
    mode: 'temperature',
    label: 'Hőmérséklet',
    Icon: Thermometer,
    source: 'OWM',
    description: 'Léghőmérséklet (OpenWeatherMap). Kék = hideg, zöld = 5–15 °C, sárga = ~20 °C, piros = meleg.',
    legendType: 'owm-temp',
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

async function fetchRainViewerTimestamps(): Promise<number[]> {
  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
  const data = await res.json();
  return (data?.radar?.past ?? []).map((f: { time: number }) => f.time);
}

function generateSatelliteFrames(): WeatherFrame[] {
  const frames: WeatherFrame[] = [];
  const now = new Date();
  for (let i = SATELLITE_FRAME_COUNT - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60 * 1000);
    t.setUTCMinutes(Math.floor(t.getUTCMinutes() / 15) * 15, 0, 0);
    const ts = [
      t.getUTCFullYear(),
      String(t.getUTCMonth() + 1).padStart(2, '0'),
      String(t.getUTCDate()).padStart(2, '0'),
      '_',
      String(t.getUTCHours()).padStart(2, '0'),
      String(t.getUTCMinutes()).padStart(2, '0'),
    ].join('');
    frames.push({ timestamp: ts, url: `/met-satellite/satellite_MSG-InfraCloud-${ts}.png` });
  }
  return frames;
}

function formatSatelliteTime(ts: string): string {
  if (!ts || ts.length < 13) return '';
  return `${ts.substring(9, 11)}:${ts.substring(11, 13)}`;
}

function formatRainViewerTime(ts: number): string {
  const d = new Date(ts * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // resolve even on error to not block animation
    img.src = url;
  });
}

// Base map URLs
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ---------------------------------------------------------------------------
// LegendBar component
// ---------------------------------------------------------------------------

function LegendBar({ legendType }: { legendType: Tab['legendType'] }) {
  if (legendType === 'radar') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 px-1">
        <span className="font-medium text-gray-700">Csapadék:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
          Szitálás
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          Gyenge
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
          Közepes
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
          Erős
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
          Intenzív
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-600" />
          Extrém
        </span>
      </div>
    );
  }

  if (legendType === 'satellite') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 px-1">
        <span className="font-medium text-gray-700">IR felvétel:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-white border border-gray-300" />
          Vastag magas felhő
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-400" />
          Alacsony / vékony felhő
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-800" />
          Derült ég
        </span>
      </div>
    );
  }

  if (legendType === 'owm-wind') {
    return (
      <div className="flex flex-col gap-1 w-full px-1">
        <div className="h-3 rounded" style={{
          background: 'linear-gradient(to right, rgba(148,163,184,0.4), #60a5fa, #22d3ee, #34d399, #fbbf24)'
        }} />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span><span>5</span><span>10</span><span>15</span><span>20+ m/s</span>
        </div>
        <p className="text-xs text-gray-400 italic">Alacsony szélnél (&lt;5 m/s) az overlay szinte átlátszó — ez normális.</p>
      </div>
    );
  }

  if (legendType === 'owm-temp') {
    return (
      <div className="flex flex-col gap-1 w-full px-1">
        <div className="h-3 rounded" style={{
          background: 'linear-gradient(to right, #3b0a6e, #0000d4, #00bfff, #00e676, #ffee58, #ff6f00, #c62828)'
        }} />
        <div className="flex justify-between text-xs text-gray-500">
          <span>-20°C</span><span>-10°C</span><span>0°C</span>
          <span>10°C</span><span>20°C</span><span>30°C</span><span>40°C</span>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Wind arrow DivIcon
// ---------------------------------------------------------------------------

function createWindIcon(windSpeed: number, windDir: number): L.DivIcon {
  const arrowDeg = (windDir + 180) % 360;
  const color =
    windSpeed < 5  ? '#94a3b8' :
    windSpeed < 10 ? '#60a5fa' :
    windSpeed < 20 ? '#22d3ee' :
                     '#fbbf24';

  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
        <svg width="22" height="28" viewBox="0 0 22 28"
             style="transform:rotate(${arrowDeg}deg);overflow:visible">
          <line x1="11" y1="24" x2="11" y2="6"
                stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="11,2 5,12 17,12"
                   fill="${color}" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>
        </svg>
        <div style="font-size:10px;font-weight:700;color:#1e293b;
                    background:rgba(255,255,255,0.85);border-radius:3px;
                    padding:0 3px;line-height:1.4">
          ${Math.round(windSpeed)}
        </div>
      </div>`,
    className: '',
    iconSize: [30, 46],
    iconAnchor: [15, 23],
  });
}

// ---------------------------------------------------------------------------
// Temperature badge DivIcon
// ---------------------------------------------------------------------------

function createTempIcon(temp: number): L.DivIcon {
  const color =
    temp < 0   ? '#6d28d9' :
    temp < 10  ? '#3b82f6' :
    temp < 20  ? '#22c55e' :
    temp < 30  ? '#f97316' :
                 '#ef4444';

  return L.divIcon({
    html: `<div style="
      background:${color};
      color:white;
      border:2px solid rgba(255,255,255,0.8);
      border-radius:50%;
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    ">${Math.round(temp)}°</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// ---------------------------------------------------------------------------
// Inner components
// ---------------------------------------------------------------------------

function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface WeatherMapsWidgetProps {
  city: City | null;
}

export const WeatherMapsWidget = React.memo<WeatherMapsWidgetProps>(({ city }) => {
  const windPoints = useWindMapData();
  const tempPoints = useTempMapData();
  const [mode, setMode] = useState<MapMode>('radar');
  const [frames, setFrames] = useState<WeatherFrame[]>([]);
  const [radarTimestamps, setRadarTimestamps] = useState<number[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAnimated = mode === 'radar' || mode === 'satellite';

  const loadFrames = useCallback(async (currentMode: MapMode) => {
    if (currentMode === 'wind' || currentMode === 'temperature') {
      setFrames([]);
      setRadarTimestamps([]);
      setIsLoading(false);
      return;
    }

    if (currentMode === 'radar') {
      setIsLoading(true);
      const timestamps = await fetchRainViewerTimestamps();
      setRadarTimestamps(timestamps);
      setFrames([]);
      setFrameIndex(timestamps.length - 1);
      setIsLoading(false);
      return;
    }

    // satellite
    setIsLoading(true);
    const newFrames = generateSatelliteFrames();

    await Promise.race([
      Promise.all(newFrames.slice(0, 3).map((f) => preloadImage(f.url))),
      new Promise<void>((r) => setTimeout(r, 4000)),
    ]);

    setFrames(newFrames);
    setRadarTimestamps([]);
    setFrameIndex(newFrames.length - 1);
    setIsLoading(false);

    newFrames.slice(3).forEach((f) => preloadImage(f.url).catch(() => {}));
  }, []);

  useEffect(() => {
    loadFrames(mode);
  }, [mode, loadFrames]);

  // Animation loop for animated modes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const frameCount = mode === 'radar' ? radarTimestamps.length : frames.length;
    if (!isPlaying || frameCount === 0) return;

    const interval = mode === 'satellite' ? SATELLITE_INTERVAL_MS : RADAR_INTERVAL_MS;
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameCount);
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, radarTimestamps.length, frames.length, mode]);

  if (!city) {
    return (
      <EmptyState
        icon={MapPin}
        message="Nincs kiválasztott város"
        description="Válasszon várost a térkép megtekintéséhez"
      />
    );
  }

  const mapCenter: [number, number] = [city.latitude, city.longitude];
  const currentFrame = frames[frameIndex];
  const activeTab = TABS.find((t) => t.mode === mode)!;
  const frameCount = mode === 'radar' ? radarTimestamps.length : frames.length;

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ mode: tabMode, label, Icon, description }) => (
          <button
            key={tabMode}
            title={description}
            onClick={() => {
              setMode(tabMode);
              setFrameIndex(0);
              setIsPlaying(true);
            }}
            className={[
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === tabMode
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="relative w-full h-96 bg-white rounded-lg shadow-sm border-2 border-gray-200">
        <MapContainer
          key={city.id}
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          className="h-full w-full rounded-lg"
          scrollWheelZoom={false}
          preferCanvas={true}
          touchZoom={true}
          bounceAtZoomLimits={false}
          maxZoom={12}
          minZoom={6}
          maxBounds={MAP_BOUNDS}
          maxBoundsViscosity={0.3}
          style={{ borderRadius: '8px' }}
        >
          <InvalidateMapSize />

          {/* Base map — CartoDB Positron for OWM modes (better contrast), OSM otherwise */}
          {(mode === 'wind' || mode === 'temperature') ? (
            <TileLayer
              key="carto"
              url={CARTO_TILE_URL}
              opacity={0.45}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          ) : (
            <TileLayer
              key="osm"
              url={OSM_TILE_URL}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
          )}

          {/* Radar: RainViewer tile layers (opacity-based frame switching, smooth animation) */}
          {mode === 'radar' && radarTimestamps.map((ts, idx) => (
            <TileLayer
              key={`rv-${ts}`}
              url={`https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/0_0.png`}
              opacity={idx === frameIndex ? 0.80 : 0}
              tileSize={256}
              attribution='<a href="https://www.rainviewer.com" target="_blank">RainViewer</a>'
            />
          ))}

          {/* Satellite: OMSZ ImageOverlay */}
          {mode === 'satellite' && currentFrame && (
            <ImageOverlay url={currentFrame.url} bounds={SATELLITE_BOUNDS} opacity={0.85} />
          )}

          {/* Static tile overlays: wind + temperature */}
          {mode === 'wind' && (
            <TileLayer
              key="wind"
              url="/owm-tiles/wind_new/{z}/{x}/{y}.png"
              opacity={0.90}
              attribution='<a href="https://openweathermap.org">OpenWeatherMap</a>'
            />
          )}
          {mode === 'temperature' && (
            <TileLayer
              key="temperature"
              url="/owm-tiles/temp_new/{z}/{x}/{y}.png"
              opacity={0.90}
              attribution='<a href="https://openweathermap.org">OpenWeatherMap</a>'
            />
          )}

          {/* GeoJSON country borders - always on top of weather data */}
          <GeoJSON
            data={bordersData as GeoJsonObject}
            style={BORDER_STYLE}
          />

          {/* Temperature badges (temperature mode only) */}
          {mode === 'temperature' && tempPoints.map((pt) => (
            <Marker
              key={pt.cityId}
              position={[pt.lat, pt.lon]}
              icon={createTempIcon(pt.temp)}
            >
              <Popup>
                <b>{pt.name}</b><br />
                {pt.temp.toFixed(1)} °C
              </Popup>
            </Marker>
          ))}

          {/* Wind direction arrows (wind mode only) */}
          {mode === 'wind' && windPoints.map((pt) => (
            <Marker
              key={pt.cityId}
              position={[pt.lat, pt.lon]}
              icon={createWindIcon(pt.windSpeed, pt.windDir)}
            >
              <Popup>
                <b>{pt.name}</b><br />
                {pt.windSpeed.toFixed(1)} m/s, {pt.windDir}°
              </Popup>
            </Marker>
          ))}

          {/* City marker */}
          <Marker position={mapCenter} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">{city.name}</h3>
                <p className="text-sm text-gray-600">{city.county} megye</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Bottom controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 z-[1000]">
          {/* Status label */}
          <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600">
            {isLoading && isAnimated ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                Betöltés...
              </span>
            ) : mode === 'radar' && radarTimestamps[frameIndex] ? (
              <span>RainViewer Radar {formatRainViewerTime(radarTimestamps[frameIndex])}</span>
            ) : mode === 'satellite' && currentFrame ? (
              <span>OMSZ Felhőtérkép {formatSatelliteTime(currentFrame.timestamp)}</span>
            ) : (
              <span>{activeTab.source} · {activeTab.label}</span>
            )}
          </div>

          {/* Play/pause + frame counter (animated modes only) */}
          {isAnimated && frameCount > 1 && (
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 font-medium">
                {frameIndex + 1} / {frameCount}
              </div>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-100 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-cyan-600" />
                ) : (
                  <Play className="h-4 w-4 text-cyan-600" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Source attribution top-right */}
        <div className="absolute top-2 right-2 z-[1000]">
          <span className="bg-white/80 rounded px-2 py-1 text-xs text-gray-500">
            Forrás:{' '}
            {mode === 'radar' ? (
              <a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer"
                 className="hover:text-cyan-600">RainViewer</a>
            ) : activeTab.source === 'OMSZ' ? (
              <a href="https://www.met.hu" target="_blank" rel="noopener noreferrer"
                 className="hover:text-cyan-600">OMSZ</a>
            ) : (
              <a href="https://openweathermap.org" target="_blank" rel="noopener noreferrer"
                 className="hover:text-cyan-600">OpenWeatherMap</a>
            )}
          </span>
        </div>
      </div>

      {/* Legend bar */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-3 py-2 min-h-[2rem] flex items-center">
        <LegendBar legendType={activeTab.legendType} />
      </div>
    </div>
  );
});

WeatherMapsWidget.displayName = 'WeatherMapsWidget';
