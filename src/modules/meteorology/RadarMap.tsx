/**
 * RadarMap Component
 *
 * Displays weather radar map using Leaflet.
 * Shows rain/precipitation overlay for the selected city.
 * Uses RainViewer API for radar data (placeholder for now).
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { icon as leafletIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '../../components/UI/EmptyState';
import { MapPin } from 'lucide-react';
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

export const RadarMap: React.FC<RadarMapProps> = ({ city }) => {
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

  return (
    <div className="map-container-standard">
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

        {/* TODO: Add RainViewer Radar Overlay
         * RainViewer API: https://www.rainviewer.com/api.html
         * This will be implemented by the Data Engineer
         */}

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

      {/* Placeholder note */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 text-xs text-gray-600 z-[1000]">
        Radarkép: Fejlesztés alatt
      </div>
    </div>
  );
};
