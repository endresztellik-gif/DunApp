/**
 * GroundwaterMap Component
 *
 * Displays 15 groundwater wells on a Leaflet map with color-coded markers.
 * Clicking a marker selects that well.
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '../../components/UI/EmptyState';
import { MapPin } from 'lucide-react';
import type { GroundwaterWell } from '../../types';

interface GroundwaterMapProps {
  wells: GroundwaterWell[];
  selectedWell: GroundwaterWell | null;
  onWellSelect: (well: GroundwaterWell) => void;
}

// Create custom colored marker
const createWellIcon = (isSelected: boolean, waterLevel: number | null) => {
  // Color based on water level (green = high, orange = medium, red = low)
  let color = '#9ca3af'; // gray default
  if (waterLevel !== null) {
    if (waterLevel > 5) color = '#43a047'; // green
    else if (waterLevel > 3) color = '#ffa500'; // orange
    else color = '#ff4500'; // red
  }

  const size = isSelected ? 30 : 20;

  return divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid ${isSelected ? '#ff9800' : 'white'};
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Map center for Hungary south (between all wells)
const MAP_CENTER: [number, number] = [46.25, 18.85];
const MAP_ZOOM = 9;

export const GroundwaterMap: React.FC<GroundwaterMapProps> = ({
  wells,
  selectedWell,
  onWellSelect,
}) => {
  if (wells.length === 0) {
    return (
      <div className="map-container-standard">
        <EmptyState
          icon={MapPin}
          message="Nincs talajvízkút adat"
          description="15 talajvízkút adatai szükségesek a térkép megjelenítéséhez"
        />
      </div>
    );
  }

  // Mock water levels for display (will be replaced with real data)
  const getWellWaterLevel = (_wellId: string): number | null => {
    // Randomly return null to simulate missing data (10% chance)
    if (Math.random() < 0.1) return null;
    return 3 + Math.random() * 4; // Random between 3-7m
  };

  return (
    <div className="map-container-standard relative">
      <div className="map-header">
        <h3 className="map-title">Aktuális talajvízszint</h3>
        <p className="text-xs text-gray-600">HUGEO adatok</p>
      </div>

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Well Markers */}
        {wells.map((well) => {
          const isSelected = selectedWell?.id === well.id;
          const waterLevel: number | null = getWellWaterLevel(well.id);

          return (
            <Marker
              key={well.id}
              position={[well.latitude, well.longitude]}
              icon={createWellIcon(isSelected, waterLevel)}
              eventHandlers={{
                click: () => onWellSelect(well),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900">{well.wellName}</h4>
                  <p className="text-sm font-mono text-orange-600">#{well.wellCode}</p>
                  <p className="text-xs text-gray-600 mt-1">{well.cityName}</p>
                  {waterLevel !== null && (
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      {(-waterLevel).toFixed(2)} m
                    </p>
                  )}
                  {waterLevel !== null && (
                    <p className="text-xs text-gray-500">
                      ({waterLevel.toFixed(2)} m a felszín alatt)
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Mélység (m)</h4>
        <div className="space-y-1">
          <div className="map-legend-item">
            <div className="map-legend-color bg-red-600" />
            <span>&lt; -5m (Mély)</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color bg-orange-500" />
            <span>-3 to -5m (Közepes)</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color bg-green-600" />
            <span>&gt; -3m (Sekély)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
