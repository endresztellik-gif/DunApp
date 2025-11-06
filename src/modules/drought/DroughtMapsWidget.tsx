/**
 * DroughtMapsWidget Component
 *
 * Displays 3 ArcGIS maps for drought monitoring:
 * 1. HUGEO Groundwater Level Map (map.hugeo.hu - MapServer)
 * 2. Drought Index Map (ovfgis2.vizugy.hu - ImageServer with HDI raster data)
 * 3. Monitoring Stations Map (geoportal.vizugy.hu - MapServer with identify popups)
 *
 * Features:
 * - Dynamic Leaflet + esri-leaflet loading
 * - Progress tracking for image loading
 * - Auto-refresh every 10 minutes
 * - Color legends overlaid on each map
 * - Interactive popups on monitoring stations (click to view details)
 *
 * Technical Notes:
 * - WMS endpoints don't work (HTTP 400 errors)
 * - Using ArcGIS REST API (MapServer + ImageServer) instead
 * - ImageServer provides real-time raster data (HDI values)
 */

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

// Map service URLs
const IS_DEV = import.meta.env.DEV;

// HUGEO WMS - Try direct access first (user's original working approach)
// If CORS error occurs in production, we'll need to use server-side proxy
const WMS_HUGEO = 'https://map.hugeo.hu/arcgis/services/tvz/tvz100_all/MapServer/WMSServer';

// Aszályindex ImageServer (CORS OK)
const IMAGE_DROUGHT_INDEX = 'https://ovfgis2.vizugy.hu/arcgis/rest/services/Aszalymon/mosaic_hdis/ImageServer';

// Monitoring MapServer (CORS OK)
const REST_MONITORING_STATIONS = 'https://geoportal.vizugy.hu/arcgis/rest/services/Aszalymon/Aszaly_monitoring_allomasok/MapServer';

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

  // HUGEO layer selector (0: mélység, 1: nyugalmi szint)
  const [selectedHugeoLayer, setSelectedHugeoLayer] = useState<number>(0);

  // Leaflet loaded flag
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Check if Leaflet and esri-leaflet are already loaded
    if ((window as any).L && (window as any).L.esri) {
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
      // After Leaflet loads, load esri-leaflet
      const esriLeafletScript = document.createElement('script');
      esriLeafletScript.src = 'https://unpkg.com/esri-leaflet@3.0.12/dist/esri-leaflet.js';
      esriLeafletScript.async = true;

      esriLeafletScript.onload = () => {
        setLeafletLoaded(true);
      };

      esriLeafletScript.onerror = () => {
        setMap1State(prev => ({ ...prev, loading: false, error: 'esri-leaflet betöltési hiba' }));
        setMap2State(prev => ({ ...prev, loading: false, error: 'esri-leaflet betöltési hiba' }));
        setMap3State(prev => ({ ...prev, loading: false, error: 'esri-leaflet betöltési hiba' }));
      };

      document.head.appendChild(esriLeafletScript);
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

  // Store map instances for layer switching
  const map1InstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Create map widget (supports WMS, MapServer, and ImageServer)
    const createWidget = (
      mapRef: React.RefObject<HTMLDivElement>,
      layerUrl: string,
      layerType: 'wms' | 'mapserver' | 'imageserver',
      layerParam: string,
      setState: React.Dispatch<React.SetStateAction<MapState>>,
      enablePopup: boolean = false,
      storeInstance: boolean = false
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

        let dataLayer: any;

        if (layerType === 'wms') {
          // Native Leaflet WMS (HUGEO - proven to work)
          dataLayer = L.tileLayer.wms(layerUrl, {
            layers: layerParam,
            format: 'image/png',
            transparent: true,
            version: '1.3.0',
            opacity: 0.7
          }).addTo(map);
        } else if (layerType === 'imageserver') {
          // ImageServer layer (Aszályindex raster)
          dataLayer = (L as any).esri.imageMapLayer({
            url: layerUrl,
            opacity: 0.7,
            format: 'jpgpng'
          }).addTo(map);
        } else {
          // MapServer layer (Monitoring - esri-leaflet)
          const layerId = parseInt(layerParam);
          dataLayer = (L as any).esri.dynamicMapLayer({
            url: layerUrl,
            opacity: 0.7,
            layers: [layerId],
            format: 'png',
            transparent: true
          }).addTo(map);
        }

        // Add identify on click for monitoring stations
        if (enablePopup) {
          map.on('click', (e: any) => {
            (L as any).esri.identifyFeatures({
              url: layerUrl
            })
              .on(map)
              .at(e.latlng)
              .layers(`visible:${layerId}`)
              .run((error: any, featureCollection: any) => {
                if (!error && featureCollection.features.length > 0) {
                  const feature = featureCollection.features[0];
                  const props = feature.properties;
                  const popupContent = `
                    <div class="p-2" style="min-width: 200px;">
                      <h3 class="font-semibold text-sm mb-1" style="font-weight: 600;">${props.Nevr || 'Monitoring állomás'}</h3>
                      ${props.VOR ? `<p class="text-xs text-gray-500" style="font-size: 0.75rem; color: #6b7280;">Kód: ${props.VOR}</p>` : ''}
                      ${props.Leiras ? `<p class="text-xs text-gray-600 mt-1" style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">${props.Leiras}</p>` : ''}
                      ${props.AdatgazdaNev ? `<p class="text-xs text-gray-500 mt-1" style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">Adatgazda: ${props.AdatgazdaNev}</p>` : ''}
                    </div>
                  `;
                  L.popup()
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(map);
                }
              });
          });
        }

        // Progress tracking (different events for WMS vs esri-leaflet)
        if (layerType === 'wms') {
          // WMS tile tracking (original working method)
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

          dataLayer.on('tileloadstart', () => {
            loading++;
            updateProgress();
          });

          dataLayer.on('tileload', () => {
            loaded++;
            updateProgress();
          });

          dataLayer.on('tileerror', () => {
            loaded++;
            updateProgress();
          });
        } else {
          // esri-leaflet events
          dataLayer.on('loading', () => {
            setState(prev => ({ ...prev, loading: true, progress: 50 }));
          });

          dataLayer.on('load', () => {
            setState(prev => ({ ...prev, loading: false, progress: 100 }));
          });

          dataLayer.on('requesterror', (error: any) => {
            console.error('Map layer error:', error);
            setState(prev => ({ ...prev, loading: false, error: 'Térkép betöltési hiba' }));
          });
        }

        // Timeout after 8 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, loading: false }));
        }, TILE_LOAD_TIMEOUT);

        // Auto-refresh every 10 minutes
        const refreshInterval = setInterval(() => {
          if (layerType === 'wms') {
            // WMS: add timestamp parameter to force refresh
            dataLayer.setParams({ _ts: Date.now() });
          } else {
            // esri-leaflet: use refresh method
            dataLayer.refresh();
          }
          setState(prev => ({ ...prev, loading: true, progress: 0 }));
        }, AUTO_REFRESH_INTERVAL);

        const result = { map, dataLayer, refreshInterval };

        // Store instance if requested (for layer switching)
        if (storeInstance) {
          map1InstanceRef.current = result;
        }

        return result;
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
    const widget1 = createWidget(map1Ref, WMS_HUGEO, 'wms', String(selectedHugeoLayer), setMap1State, false, true);
    const widget2 = createWidget(map2Ref, IMAGE_DROUGHT_INDEX, 'imageserver', '0', setMap2State, false);
    const widget3 = createWidget(map3Ref, REST_MONITORING_STATIONS, 'mapserver', '0', setMap3State, true); // Enable popup

    // Cleanup
    return () => {
      if (widget1) {
        widget1.dataLayer.remove();
        widget1.map.remove();
        clearInterval(widget1.refreshInterval);
      }
      if (widget2) {
        widget2.dataLayer.remove();
        widget2.map.remove();
        clearInterval(widget2.refreshInterval);
      }
      if (widget3) {
        widget3.dataLayer.remove();
        widget3.map.remove();
        clearInterval(widget3.refreshInterval);
      }
    };
  }, [leafletLoaded, selectedHugeoLayer]);

  // Render map with loading state
  const renderMap = (
    ref: React.RefObject<HTMLDivElement>,
    state: MapState,
    title: string,
    subtitle: string,
    legend?: React.ReactNode,
    layerSelector?: React.ReactNode
  ) => (
    <div className="map-container-standard">
      <div className="map-header">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="map-title">{title}</h3>
            <p className="text-xs text-gray-600">{subtitle}</p>
          </div>
          {layerSelector && <div className="ml-2">{layerSelector}</div>}
        </div>
      </div>

      {/* Map Container with Legend Overlay */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden">
        {/* Loading Overlay */}
        {state.loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-[999] rounded-lg">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-2" />
            <p className="text-sm text-gray-600">Térkép betöltése... {state.progress}%</p>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center z-[999] rounded-lg p-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-700 text-center">{state.error}</p>
          </div>
        )}

        {/* Leaflet Map */}
        <div ref={ref} className="w-full h-full rounded-lg" style={{ position: 'relative', zIndex: 1 }} />

        {/* Legend Overlay (inside map container) - HIGH Z-INDEX */}
        {legend && !state.loading && !state.error && (
          <div className="map-legend" style={{ zIndex: 9999 }}>
            {legend}
          </div>
        )}
      </div>

      {/* Legend Below Map (fallback if overlay doesn't show) */}
      {legend && !state.loading && !state.error && (
        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
          {legend}
        </div>
      )}
    </div>
  );

  // HUGEO layer selector
  const hugeoLayerSelector = (
    <select
      value={selectedHugeoLayer}
      onChange={(e) => setSelectedHugeoLayer(Number(e.target.value))}
      className="px-3 py-1.5 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
    >
      <option value={0}>Talajvízszint mélysége</option>
      <option value={1}>Nyugalmi szint</option>
    </select>
  );

  // Dynamic legend based on selected layer
  const hugeoLegend = selectedHugeoLayer === 0 ? (
    <div>
      <h4 className="text-xs font-semibold text-gray-900 mb-2">Mélység (m)</h4>
      <div className="space-y-1 text-xs">
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#ff4500',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>&lt; 3m (Sekély)</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#ffa500',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>3-5m (Közepes)</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#43a047',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>&gt; 5m (Mély)</span>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <h4 className="text-xs font-semibold text-gray-900 mb-2">Nyugalmi szint (m)</h4>
      <div className="space-y-1 text-xs">
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#ff4500',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>&lt; 2m (Alacsony)</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#ffa500',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>2-4m (Közepes)</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#43a047',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>&gt; 4m (Magas)</span>
        </div>
      </div>
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
        hugeoLegend,
        hugeoLayerSelector
      )}

      {/* Map 2: Drought Index (HDIs) */}
      {renderMap(
        map2Ref,
        map2State,
        'Aszályindex (HDIs)',
        'OVF aszálymonitoring - aktuális',
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Aszályindex</h4>
          <div className="space-y-1 text-xs">
            <div className="map-legend-item">
              <div
                style={{
                  backgroundColor: '#4daf4a',
                  width: '20px',
                  height: '20px',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  flexShrink: 0
                }}
              />
              <span>Aszálymentes (&lt; 1,33)</span>
            </div>
            <div className="map-legend-item">
              <div
                style={{
                  backgroundColor: '#90ee90',
                  width: '20px',
                  height: '20px',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  flexShrink: 0
                }}
              />
              <span>Enyhe (1,33 - 1,50)</span>
            </div>
            <div className="map-legend-item">
              <div
                style={{
                  backgroundColor: '#ffff00',
                  width: '20px',
                  height: '20px',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  flexShrink: 0
                }}
              />
              <span>Közepes (1,50 - 2,00)</span>
            </div>
            <div className="map-legend-item">
              <div
                style={{
                  backgroundColor: '#ff7f00',
                  width: '20px',
                  height: '20px',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  flexShrink: 0
                }}
              />
              <span>Erős (2,00 - 3,00)</span>
            </div>
            <div className="map-legend-item">
              <div
                style={{
                  backgroundColor: '#e31a1c',
                  width: '20px',
                  height: '20px',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  flexShrink: 0
                }}
              />
              <span>Rendkívüli (&gt; 3,00)</span>
            </div>
          </div>
        </div>
      )}

      {/* Map 3: Monitoring Stations */}
      {renderMap(
        map3Ref,
        map3State,
        'Mérőállomások',
        'OVF aszálymonitoring hálózat',
        <div>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Állomások</h4>
          <div className="space-y-1 text-xs">
            <div className="map-legend-item">
              <div
                style={{
                  backgroundColor: '#38a800',
                  width: '20px',
                  height: '20px',
                  border: '1px solid #333',
                  borderRadius: '3px',
                  flexShrink: 0
                }}
              />
              <span>Monitoring állomás</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              Kattints az állomásokra további információkért
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
