/**
 * RadarMap Component
 *
 * Displays weather radar map using Leaflet with RainViewer API overlay.
 * Shows real-time rain/precipitation radar data for the selected city region.
 *
 * Features:
 * - OpenStreetMap base layer
 * - RainViewer radar overlay (latest frame)
 * - City marker with popup info
 *
 * API: https://www.rainviewer.com/api.html
 *
 * PERFORMANCE: Memoized to prevent re-renders during radar animation.
 * Leaflet rendering is expensive - memoization has high impact.
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { icon as leafletIcon } from 'leaflet';
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

interface RadarMapProps {
  city: City | null;
}

export const RadarMap = React.memo<RadarMapProps>(({ city }) => {
  const [radarFrames, setRadarFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoadingRadar, setIsLoadingRadar] = useState(true);

  // Fetch radar frames from RainViewer API
  useEffect(() => {
    const fetchRadarFrames = async () => {
      try {
        setIsLoadingRadar(true);
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();

        // Get all available radar frames (last 2 hours, typically 8-12 frames)
        if (data.radar?.past && data.radar.past.length > 0) {
          const timestamps = data.radar.past.map((frame: { path: string }) =>
            frame.path.split('/').pop()
          );
          setRadarFrames(timestamps);
          setCurrentFrameIndex(timestamps.length - 1); // Start with latest frame
        }
      } catch (error) {
        console.error('Failed to fetch radar data:', error);
      } finally {
        setIsLoadingRadar(false);
      }
    };

    fetchRadarFrames();
    // Refresh every 10 minutes
    const interval = setInterval(fetchRadarFrames, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Radar animation loop
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0) return;

    const animationInterval = setInterval(() => {
      setCurrentFrameIndex((prevIndex) => (prevIndex + 1) % radarFrames.length);
    }, 500); // Change frame every 500ms

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

  // RainViewer tile URL for current frame
  // Format: https://tilecache.rainviewer.com/v2/radar/{timestamp}/256/{z}/{x}/{y}/2/0_0.png
  // Parameters: 2 = color scheme, 0_0 = smooth_0_snow_0
  const currentTimestamp = radarFrames[currentFrameIndex];
  const radarTileUrl = currentTimestamp
    ? `https://tilecache.rainviewer.com/v2/radar/${currentTimestamp}/256/{z}/{x}/{y}/2/0_0.png`
    : null;

  return (
    <div className="relative w-full h-96 bg-white rounded-lg shadow-sm border-2 border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={10}
        className="h-full w-full rounded-lg"
        scrollWheelZoom={false}
        style={{ borderRadius: '8px' }}
      >
        {/* Base Map Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* RainViewer Radar Overlay */}
        {radarTileUrl && (
          <TileLayer
            key={currentTimestamp}
            url={radarTileUrl}
            opacity={0.6}
            attribution='<a href="https://www.rainviewer.com/api.html">RainViewer</a>'
            zIndex={200}
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
            <span>✅ Radar: {radarFrames.length} frame</span>
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
    </div>
  );
});

RadarMap.displayName = 'RadarMap';
