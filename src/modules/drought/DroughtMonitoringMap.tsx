/**
 * DroughtMonitoringMap Component
 *
 * Displays 5 drought monitoring stations with parameter selector.
 * User can select which parameter to visualize (drought index, soil moisture, etc.).
 */

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '../../components/UI/EmptyState';
import { MapPin } from 'lucide-react';
import type { DroughtLocation, DroughtParameterType } from '../../types';

interface DroughtMonitoringMapProps {
  locations: DroughtLocation[];
  selectedLocation: DroughtLocation | null;
  onLocationSelect: (location: DroughtLocation) => void;
}

// Parameter options
const PARAMETER_OPTIONS: { value: DroughtParameterType; label: string }[] = [
  { value: 'droughtIndex', label: 'Aszályindex' },
  { value: 'soilMoisture', label: 'Talajnedvesség' },
  { value: 'waterDeficit', label: 'Vízhiány' },
  { value: 'precipitation', label: 'Csapadék' },
];

// Create custom colored marker based on parameter value
const createLocationIcon = (isSelected: boolean, paramValue: number | null) => {
  // Color based on parameter value (example for drought index)
  let color = '#9ca3af'; // gray default
  if (paramValue !== null) {
    if (paramValue <= 2) color = '#90ee90'; // light green (none)
    else if (paramValue <= 4) color = '#ffffe0'; // light yellow (mild)
    else if (paramValue <= 6) color = '#ffd700'; // gold (moderate)
    else if (paramValue <= 8) color = '#ffa500'; // orange (severe)
    else color = '#ff4500'; // red (extreme)
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

const MAP_CENTER: [number, number] = [46.35, 19.15];
const MAP_ZOOM = 9;

export const DroughtMonitoringMap: React.FC<DroughtMonitoringMapProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
}) => {
  const [selectedParameter, setSelectedParameter] = useState<DroughtParameterType>('droughtIndex');

  if (locations.length === 0) {
    return (
      <div className="map-container-standard">
        <EmptyState
          icon={MapPin}
          message="Nincs monitoring adat"
          description="5 monitoring állomás adatai szükségesek a térkép megjelenítéséhez"
        />
      </div>
    );
  }

  // Mock parameter values (will be replaced with real data)
  const getLocationParamValue = (_locationId: string, param: DroughtParameterType): number | null => {
    if (param === 'droughtIndex') return 2 + Math.random() * 6;
    if (param === 'soilMoisture') return 20 + Math.random() * 40;
    if (param === 'waterDeficit') return 10 + Math.random() * 50;
    return Math.random() * 100;
  };

  return (
    <div className="map-container-standard relative">
      <div className="map-header">
        <h3 className="map-title">Aszálymonitoring</h3>

        {/* Parameter Selector */}
        <select
          value={selectedParameter}
          onChange={(e) => setSelectedParameter(e.target.value as DroughtParameterType)}
          className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Paraméter választása"
        >
          {PARAMETER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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

        {/* Location Markers */}
        {locations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          const paramValue: number | null = getLocationParamValue(location.id, selectedParameter);

          return (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createLocationIcon(isSelected, paramValue)}
              eventHandlers={{
                click: () => onLocationSelect(location),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900">{location.locationName}</h4>
                  <p className="text-xs text-gray-600">{location.county} megye</p>
                  {paramValue !== null && (
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      {paramValue.toFixed(1)}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend for drought index */}
      {selectedParameter === 'droughtIndex' && (
        <div className="map-legend">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Aszály</h4>
          <div className="space-y-1 text-xs">
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#90ee90' }} />
              <span>Alacsony</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ffffe0' }} />
              <span>Mérsékelt</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ffd700' }} />
              <span>Közepes</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ffa500' }} />
              <span>Magas</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ff4500' }} />
              <span>Extrém</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
