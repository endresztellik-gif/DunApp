/**
 * WaterDeficitMap Component
 *
 * Displays water deficit as a heatmap/choropleth overlay.
 * Shows regional water deficit data from OVF.
 */

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_CENTER: [number, number] = [46.35, 18.85];
const MAP_ZOOM = 8;

export const WaterDeficitMap: React.FC = () => {
  return (
    <div className="map-container-standard relative">
      <div className="map-header">
        <h3 className="map-title">Vízhiány térkép</h3>
        <p className="text-xs text-gray-600">OVF adatok</p>
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

        {/* TODO: Add heatmap/choropleth overlay
         * This will be implemented by the Data Engineer
         * Using GeoJSON boundaries for Hungarian regions
         * Color-coded by water deficit index
         */}
      </MapContainer>

      {/* Placeholder note */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 text-xs text-gray-600 z-[1000]">
        Vízhiány hőtérkép: Fejlesztés alatt
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Vízhiány (mm)</h4>
        <div className="space-y-1 text-xs">
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#90ee90' }} />
            <span>&lt; 20mm</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#ffffe0' }} />
            <span>20-40mm</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#ffd700' }} />
            <span>40-60mm</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#ffa500' }} />
            <span>60-80mm</span>
          </div>
          <div className="map-legend-item">
            <div className="map-legend-color" style={{ backgroundColor: '#ff4500' }} />
            <span>&gt; 80mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
