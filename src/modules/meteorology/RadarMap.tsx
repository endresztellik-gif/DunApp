/**
 * RadarMap Component
 *
 * Displays weather radar map using Leaflet with Met.hu ODP radar overlay.
 * Shows real-time rain/precipitation radar data for Hungary.
 *
 * Features:
 * - OpenStreetMap base layer
 * - Met.hu radar composite overlay (5-minute resolution)
 * - CSS crossfade animation for smooth transitions
 * - City marker with popup info
 *
 * API: https://odp.met.hu/weather/radar/composite/png/refl2D/
 *
 * PERFORMANCE: Memoized to prevent re-renders during radar animation.
 * Leaflet rendering is expensive - memoization has high impact.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay } from 'react-leaflet';
import { icon as leafletIcon } from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '../../components/UI/EmptyState';
import { MapPin, Play, Pause } from 'lucide-react';
import type { City } from '../../types';

// Fix Leaflet default icon path issue with Vite
const defaultIcon = leafletIcon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Hungary radar composite bounds (approximate)
// Based on met.hu radar coverage area
const HUNGARY_RADAR_BOUNDS: LatLngBoundsExpression = [
  [45.5, 13.5], // Southwest corner
  [49.5, 25.0], // Northeast corner
];

interface RadarMapProps {
  city: City | null;
}

interface RadarFrame {
  timestamp: string; // YYYYMMDD_HHMM format
  url: string;
}

/**
 * Generate radar frame URLs for the last 2 hours (24 frames at 5-minute intervals)
 * Met.hu updates radar images every 5 minutes
 */
function generateRadarFrameUrls(): RadarFrame[] {
  const frames: RadarFrame[] = [];
  const now = new Date();

  // Go back 2 hours and generate 24 frames (5-minute intervals)
  for (let i = 24; i >= 0; i--) {
    const frameTime = new Date(now.getTime() - i * 5 * 60 * 1000);

    // Round down to nearest 5 minutes
    const minutes = Math.floor(frameTime.getMinutes() / 5) * 5;
    frameTime.setMinutes(minutes, 0, 0);

    // Format: YYYYMMDD_HHMM
    const year = frameTime.getFullYear();
    const month = String(frameTime.getMonth() + 1).padStart(2, '0');
    const day = String(frameTime.getDate()).padStart(2, '0');
    const hours = String(frameTime.getHours()).padStart(2, '0');
    const mins = String(frameTime.getMinutes()).padStart(2, '0');

    const timestamp = `${year}${month}${day}_${hours}${mins}`;
    const url = `/met-radar/radar_composite-refl2D-${timestamp}.png`;

    frames.push({ timestamp, url });
  }

  return frames;
}

/**
 * Preload image and return a promise
 */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export const RadarMap = React.memo<RadarMapProps>(({ city }) => {
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoadingRadar, setIsLoadingRadar] = useState(true);
  const [loadedFrames, setLoadedFrames] = useState<Set<string>>(new Set());
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  // Generate radar frame URLs
  const initializeRadarFrames = useCallback(async () => {
    setIsLoadingRadar(true);
    const frames = generateRadarFrameUrls();
    setRadarFrames(frames);

    // Preload the first few frames
    const preloadCount = Math.min(5, frames.length);
    const preloadPromises = frames.slice(0, preloadCount).map((frame) =>
      preloadImage(frame.url)
        .then(() => {
          setLoadedFrames((prev) => new Set([...prev, frame.timestamp]));
        })
        .catch(() => {
          // Silently fail - image might not exist yet
        })
    );

    await Promise.allSettled(preloadPromises);
    setCurrentFrameIndex(frames.length - 1); // Start with latest frame
    setIsLoadingRadar(false);
  }, []);

  // Initialize on mount and refresh every 5 minutes
  useEffect(() => {
    initializeRadarFrames();
    const interval = setInterval(initializeRadarFrames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [initializeRadarFrames]);

  // Preload next frames as animation progresses
  useEffect(() => {
    if (radarFrames.length === 0) return;

    // Preload next 3 frames
    const preloadIndices = [1, 2, 3].map(
      (offset) => (currentFrameIndex + offset) % radarFrames.length
    );

    preloadIndices.forEach((index) => {
      const frame = radarFrames[index];
      if (frame && !loadedFrames.has(frame.timestamp)) {
        preloadImage(frame.url)
          .then(() => {
            setLoadedFrames((prev) => new Set([...prev, frame.timestamp]));
          })
          .catch(() => {
            // Silently fail
          });
      }
    });
  }, [currentFrameIndex, radarFrames, loadedFrames]);

  // Radar animation loop with crossfade
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0) return;

    const animationInterval = setInterval(() => {
      setCurrentFrameIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % radarFrames.length;
        // Toggle active layer for crossfade
        setActiveLayer((prev) => (prev === 0 ? 1 : 0));
        return newIndex;
      });
    }, 700); // Slightly longer for smoother animation

    return () => clearInterval(animationInterval);
  }, [isPlaying, radarFrames.length]);

  if (!city) {
    return (
      <EmptyState
        icon={MapPin}
        message="Nincs kiválasztott város"
        description="Válasszon várost a radarkép megtekintéséhez"
      />
    );
  }

  // Map center on selected city
  const mapCenter: [number, number] = [city.latitude, city.longitude];

  // Current and previous frame for crossfade
  const currentFrame = radarFrames[currentFrameIndex];
  const prevFrameIndex =
    currentFrameIndex === 0 ? radarFrames.length - 1 : currentFrameIndex - 1;
  const prevFrame = radarFrames[prevFrameIndex];

  // Format timestamp for display (YYYYMMDD_HHMM -> HH:MM)
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp || timestamp.length < 13) return '';
    const hours = timestamp.substring(9, 11);
    const mins = timestamp.substring(11, 13);
    return `${hours}:${mins}`;
  };

  return (
    <div className="relative w-full h-96 bg-white rounded-lg shadow-sm border-2 border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={7}
        className="h-full w-full rounded-lg"
        scrollWheelZoom={false}
        style={{ borderRadius: '8px' }}
      >
        {/* Base Map Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Met.hu Radar Overlay - Layer 0 (crossfade) */}
        {prevFrame && activeLayer === 1 && (
          <ImageOverlay
            url={prevFrame.url}
            bounds={HUNGARY_RADAR_BOUNDS}
            opacity={0.7}
            className="radar-layer radar-layer-fade-out"
            zIndex={200}
          />
        )}

        {/* Met.hu Radar Overlay - Layer 1 (crossfade) */}
        {currentFrame && (
          <ImageOverlay
            url={currentFrame.url}
            bounds={HUNGARY_RADAR_BOUNDS}
            opacity={0.7}
            className="radar-layer radar-layer-fade-in"
            zIndex={201}
          />
        )}

        {/* City Marker */}
        <Marker position={mapCenter} icon={defaultIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">{city.name}</h3>
              <p className="text-sm text-gray-600">{city.county} megye</p>
              <p className="text-xs text-gray-500 mt-1">
                {city.latitude.toFixed(4)}°, {city.longitude.toFixed(4)}°
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Radar controls and status */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 z-[1000]">
        {/* Status indicator */}
        <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600">
          {isLoadingRadar ? (
            <span>⏳ Radarkép betöltése...</span>
          ) : radarFrames.length > 0 ? (
            <span>
              🌧️ OMSZ Radar {currentFrame ? formatTimestamp(currentFrame.timestamp) : ''}
            </span>
          ) : (
            <span>❌ Radarkép nem elérhető</span>
          )}
        </div>

        {/* Animation controls */}
        {radarFrames.length > 1 && (
          <div className="flex items-center gap-2">
            {/* Frame counter */}
            <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 font-medium">
              {currentFrameIndex + 1} / {radarFrames.length}
            </div>

            {/* Play/Pause button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-100 transition-colors"
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
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

      {/* Attribution */}
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
