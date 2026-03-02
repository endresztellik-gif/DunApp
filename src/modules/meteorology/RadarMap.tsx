/**
 * RadarMap Component
 *
 * Displays weather radar using Leaflet with Met.hu ODP radar overlay.
 * API: https://odp.met.hu/weather/radar/composite/png/refl2D/
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay, useMap } from 'react-leaflet';
import { icon as leafletIcon } from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '../../components/UI/EmptyState';
import { MapPin, Play, Pause } from 'lucide-react';
import type { City } from '../../types';

const defaultIcon = leafletIcon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Bounds derived from met.hu NetCDF metadata:
// La1=50.5, Lo1=13.5, Dy=0.008 (813 rows), Dx=0.0125 (961 cols)
// South = 50.5 - 813*0.008 = 44.0, East = 13.5 + 961*0.0125 = 25.5
const RADAR_BOUNDS: LatLngBoundsExpression = [
  [44.0, 13.5], // Southwest
  [50.5, 25.5], // Northeast
];

interface RadarMapProps {
  city: City | null;
}

interface RadarFrame {
  timestamp: string;
  url: string;
}

const FRAME_COUNT = 13;
const FRAME_INTERVAL_MS = 800;

function generateRadarFrameUrls(): RadarFrame[] {
  const frames: RadarFrame[] = [];
  const now = new Date();

  for (let i = FRAME_COUNT - 1; i >= 0; i--) {
    const frameTime = new Date(now.getTime() - i * 5 * 60 * 1000);
    const minutes = Math.floor(frameTime.getUTCMinutes() / 5) * 5;
    frameTime.setUTCMinutes(minutes, 0, 0);

    const year = frameTime.getUTCFullYear();
    const month = String(frameTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(frameTime.getUTCDate()).padStart(2, '0');
    const hours = String(frameTime.getUTCHours()).padStart(2, '0');
    const mins = String(frameTime.getUTCMinutes()).padStart(2, '0');

    const timestamp = `${year}${month}${day}_${hours}${mins}`;
    frames.push({
      timestamp,
      url: `/met-radar/radar_composite-refl2D-${timestamp}.png`,
    });
  }

  return frames;
}

function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = url;
  });
}

export const RadarMap = React.memo<RadarMapProps>(({ city }) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load frames on mount, refresh every 5 min
  const loadFrames = useCallback(async () => {
    setIsLoading(true);
    const newFrames = generateRadarFrameUrls();
    setFrames(newFrames);

    // Preload all frames in parallel, start after first 3 load or 5s timeout
    let loaded = 0;
    const promises = newFrames.map((f) =>
      preloadImage(f.url)
        .then(() => { loaded++; })
        .catch(() => {})
    );

    await Promise.race([
      Promise.all(promises.slice(0, 3)),
      new Promise<void>((r) => setTimeout(r, 5000)),
    ]);

    setFrameIndex(newFrames.length - 1);
    setIsLoading(false);

    // Continue preloading rest in background
    Promise.all(promises).catch(() => {});
  }, []);

  useEffect(() => {
    loadFrames();
    const refresh = setInterval(loadFrames, 5 * 60 * 1000);
    return () => clearInterval(refresh);
  }, [loadFrames]);

  // Simple interval animation
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, FRAME_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, frames.length]);

  if (!city) {
    return (
      <EmptyState
        icon={MapPin}
        message="Nincs kiválasztott város"
        description="Válasszon várost a radarkép megtekintéséhez"
      />
    );
  }

  const mapCenter: [number, number] = [city.latitude, city.longitude];
  const currentFrame = frames[frameIndex];

  const formatTime = (ts: string): string => {
    if (!ts || ts.length < 13) return '';
    return `${ts.substring(9, 11)}:${ts.substring(11, 13)}`;
  };

  return (
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
        style={{ borderRadius: '8px' }}
      >
        <InvalidateMapSize />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {currentFrame && (
          <ImageOverlay
            url={currentFrame.url}
            bounds={RADAR_BOUNDS}
            opacity={0.7}
          />
        )}

        <Marker position={mapCenter} icon={defaultIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">{city.name}</h3>
              <p className="text-sm text-gray-600">{city.county} megye</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 z-[1000]">
        <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              Betöltés...
            </span>
          ) : currentFrame ? (
            <span>OMSZ Radar {formatTime(currentFrame.timestamp)}</span>
          ) : (
            <span>Radarkép nem elérhető</span>
          )}
        </div>

        {frames.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 font-medium">
              {frameIndex + 1} / {frames.length}
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
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

      <div className="absolute top-2 right-2 z-[1000]">
        <a
          href="https://www.met.hu"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/80 rounded px-2 py-1 text-xs text-gray-500 hover:text-cyan-600"
        >
          Forrás: OMSZ
        </a>
      </div>
    </div>
  );
});

RadarMap.displayName = 'RadarMap';
