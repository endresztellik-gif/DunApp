/**
 * WeatherMapsWidget Component
 *
 * Unified 4-tab weather map section replacing the old RadarMap.
 * All modes share the same base map, marker, and GeoJSON border overlay
 * for a consistent look across tabs.
 *
 * Tabs:
 *   Radar       - RainViewer tile layer, animated (~13 frames, 5-min intervals)
 *   Műhold      - OMSZ MSG InfraCloud satellite PNG, animated (6 frames, 15-min intervals)
 *   Szél        - OpenWeatherMap wind_new tile layer (via Netlify Edge proxy)
 *   Hőmérséklet - OpenWeatherMap temp_new tile layer (via Netlify Edge proxy)
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
import { icon as leafletIcon } from 'leaflet';
import type { LatLngBoundsExpression, StyleFunction } from 'leaflet';
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
}

const TABS: Tab[] = [
  { mode: 'radar',       label: 'Radar',        Icon: CloudRain,   source: 'RainViewer' },
  { mode: 'satellite',   label: 'Műhold',       Icon: Globe2,      source: 'OMSZ'       },
  { mode: 'wind',        label: 'Szél',         Icon: Wind,        source: 'OWM'        },
  { mode: 'temperature', label: 'Hőmérséklet',  Icon: Thermometer, source: 'OWM'        },
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
        {TABS.map(({ mode: tabMode, label, Icon }) => (
          <button
            key={tabMode}
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
          center={mapCenter}
          zoom={7}
          className="h-full w-full rounded-lg"
          scrollWheelZoom={false}
          preferCanvas={true}
          touchZoom={true}
          bounceAtZoomLimits={false}
          maxZoom={10}
          minZoom={6}
          maxBounds={MAP_BOUNDS}
          maxBoundsViscosity={0.3}
          style={{ borderRadius: '8px' }}
        >
          <InvalidateMapSize />

          {/* Base map */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Radar: RainViewer tile layers (opacity-based frame switching, smooth animation) */}
          {mode === 'radar' && radarTimestamps.map((ts, idx) => (
            <TileLayer
              key={`rv-${ts}`}
              url={`https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/0_0.png`}
              opacity={idx === frameIndex ? 0.75 : 0}
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
              opacity={0.75}
              attribution='<a href="https://openweathermap.org">OpenWeatherMap</a>'
            />
          )}
          {mode === 'temperature' && (
            <TileLayer
              key="temperature"
              url="/owm-tiles/temp_new/{z}/{x}/{y}.png"
              opacity={0.75}
              attribution='<a href="https://openweathermap.org">OpenWeatherMap</a>'
            />
          )}

          {/* GeoJSON country borders - always on top of weather data */}
          <GeoJSON
            data={bordersData as GeoJsonObject}
            style={BORDER_STYLE}
          />

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
              <span>OMSZ Műhold {formatSatelliteTime(currentFrame.timestamp)}</span>
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
    </div>
  );
});

WeatherMapsWidget.displayName = 'WeatherMapsWidget';
