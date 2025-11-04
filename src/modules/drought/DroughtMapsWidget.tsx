/**
 * DroughtMapsWidget Component
 *
 * Displays 3 WMS (Web Map Service) maps for drought monitoring:
 * 1. HUGEO Groundwater Level Map (map.hugeo.hu)
 * 2. Drought Monitoring Map (geoportal.vizugy.hu - drought severity)
 * 3. Water Deficit Map (geoportal.vizugy.hu - monitoring stations)
 *
 * Features:
 * - Dynamic Leaflet loading
 * - Progress tracking for tile loading
 * - Auto-refresh every 10 minutes
 * - Color legends for each map
 */

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

// WMS server URLs (use Vite proxy in development to avoid CORS issues)
const IS_DEV = import.meta.env.DEV;
const WMS_HUGEO = IS_DEV
  ? '/wms/hugeo'
  : 'https://map.hugeo.hu/arcgis/services/tvz/tvz100_all/MapServer/WMSServer';
const WMS_DROUGHT_SEVERITY = IS_DEV
  ? '/wms/vizugy/aszaly'
  : 'https://geoportal.vizugy.hu/arcgis/services/Aszalymon/Aszaly_fokozatok/MapServer/WMSServer';
const WMS_MONITORING_STATIONS = IS_DEV
  ? '/wms/vizugy/monitoring'
  : 'https://geoportal.vizugy.hu/arcgis/services/Aszalymon/Aszaly_monitoring_allomasok/MapServer/WMSServer';

// Map center (Hungary)
const MAP_CENTER: [number, number] = [47.1625, 19.5033];
const MAP_ZOOM = 7;
const AUTO_REFRESH_INTERVAL = 600000; // 10 minutes
const TILE_LOAD_TIMEOUT = 8000; // 8 seconds

interface MapState {
  loading: boolean;
  progress: number;
  error: string | null;
}

export const DroughtMapsWidget: React.FC = () => {
  // Map refs
  const map1Ref = useRef<HTMLDivElement>(null);
  const map2Ref = useRef<HTMLDivElement>(null);
  const map3Ref = useRef<HTMLDivElement>(null);

  // Map states
  const [map1State, setMap1State] = useState<MapState>({ loading: true, progress: 0, error: null });
  const [map2State, setMap2State] = useState<MapState>({ loading: true, progress: 0, error: null });
  const [map3State, setMap3State] = useState<MapState>({ loading: true, progress: 0, error: null });

  // Leaflet loaded flag
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Check if Leaflet is already loaded
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    // Load Leaflet JS
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.async = true;

    leafletScript.onload = () => {
      setLeafletLoaded(true);
    };

    leafletScript.onerror = () => {
      setMap1State(prev => ({ ...prev, loading: false, error: 'Leaflet betöltési hiba' }));
      setMap2State(prev => ({ ...prev, loading: false, error: 'Leaflet betöltési hiba' }));
      setMap3State(prev => ({ ...prev, loading: false, error: 'Leaflet betöltési hiba' }));
    };

    document.head.appendChild(leafletScript);

    return () => {
      // Cleanup is handled by Leaflet
    };
  }, []);

  useEffect(() => {
    if (!leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Create map widget with WMS layer
    const createWidget = (
      mapRef: React.RefObject<HTMLDivElement>,
      wmsUrl: string,
      wmsLayer: string,
      setState: React.Dispatch<React.SetStateAction<MapState>>
    ) => {
      if (!mapRef.current) return null;

      try {
        // Create map
        const map = L.map(mapRef.current, {
          center: MAP_CENTER,
          zoom: MAP_ZOOM,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        // Base layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // WMS layer
        const wms = L.tileLayer.wms(wmsUrl, {
          layers: wmsLayer,
          format: 'image/png',
          transparent: true,
          version: '1.3.0',
          opacity: 0.7,
        }).addTo(map);

        // Progress tracking
        let loading = 0;
        let loaded = 0;

        const updateProgress = () => {
          const total = Math.max(1, loading);
          const percent = Math.round((loaded / total) * 100);
          setState(prev => ({ ...prev, progress: percent }));

          if (loaded >= loading && loading > 0) {
            setTimeout(() => {
              setState(prev => ({ ...prev, loading: false }));
            }, 250);
          }
        };

        // Tile events
        wms.on('tileloadstart', () => {
          loading++;
          updateProgress();
        });

        wms.on('tileload', () => {
          loaded++;
          updateProgress();
        });

        wms.on('tileerror', () => {
          loaded++;
          updateProgress();
        });

        // Timeout after 8 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, loading: false }));
        }, TILE_LOAD_TIMEOUT);

        // Auto-refresh every 10 minutes
        const refreshInterval = setInterval(() => {
          wms.setParams({ _ts: Date.now() });
          setState(prev => ({ ...prev, loading: true, progress: 0 }));
          loading = 0;
          loaded = 0;
        }, AUTO_REFRESH_INTERVAL);

        return { map, wms, refreshInterval };
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Térkép létrehozási hiba'
        }));
        return null;
      }
    };

    // Create all 3 maps
    const widget1 = createWidget(map1Ref, WMS_HUGEO, '0', setMap1State);
    const widget2 = createWidget(map2Ref, WMS_DROUGHT_SEVERITY, 'WMS', setMap2State);
    const widget3 = createWidget(map3Ref, WMS_MONITORING_STATIONS, 'WMS', setMap3State);

    // Cleanup
    return () => {
      if (widget1) {
        widget1.map.remove();
        clearInterval(widget1.refreshInterval);
      }
      if (widget2) {
        widget2.map.remove();
        clearInterval(widget2.refreshInterval);
      }
      if (widget3) {
        widget3.map.remove();
        clearInterval(widget3.refreshInterval);
      }
    };
  }, [leafletLoaded]);

  // Render map with loading state
  const renderMap = (
    ref: React.RefObject<HTMLDivElement>,
    state: MapState,
    title: string,
    subtitle: string,
    legend?: React.ReactNode
  ) => (
    <div className="map-container-standard relative">
      <div className="map-header">
        <h3 className="map-title">{title}</h3>
        <p className="text-xs text-gray-600">{subtitle}</p>
      </div>

      {/* Loading Overlay */}
      {state.loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-10 rounded-lg">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-2" />
          <p className="text-sm text-gray-600">Térkép betöltése... {state.progress}%</p>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center z-10 rounded-lg p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-red-700 text-center">{state.error}</p>
        </div>
      )}

      {/* Map Container */}
      <div ref={ref} className="w-full h-96 rounded-lg" />

      {/* Legend */}
      {legend && !state.loading && !state.error && (
        <div className="map-legend">
          {legend}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid-drought-maps">
      {/* Map 1: HUGEO Groundwater Level */}
      {renderMap(
        map1Ref,
        map1State,
        'Aktuális talajvízszint (HUGEO)',
        'HUGEO adatok',
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Szint (m)</h4>
          <div className="space-y-1 text-xs">
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ff4500' }} />
              <span>&lt; 3m (Alacsony)</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ffa500' }} />
              <span>3-5m (Közepes)</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#43a047' }} />
              <span>&gt; 5m (Magas)</span>
            </div>
          </div>
        </div>
      )}

      {/* Map 2: Drought Severity */}
      {renderMap(
        map2Ref,
        map2State,
        'Aszálymonitoring',
        'OVF aszálymonitoring',
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Aszály</h4>
          <div className="space-y-1 text-xs">
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#90ee90' }} />
              <span>Alacsony aszály</span>
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

      {/* Map 3: Water Deficit */}
      {renderMap(
        map3Ref,
        map3State,
        'Vízhiány térkép',
        'OVF adatok',
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Vízhiány (mm)</h4>
          <div className="space-y-1 text-xs">
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#90ee90' }} />
              <span>&lt; 20mm</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ffd700' }} />
              <span>20-40mm</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ffa500' }} />
              <span>40-60mm</span>
            </div>
            <div className="map-legend-item">
              <div className="map-legend-color" style={{ backgroundColor: '#ff4500' }} />
              <span>&gt; 60mm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
