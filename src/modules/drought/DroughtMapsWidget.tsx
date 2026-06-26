/**
 * DroughtMapsWidget Component
 *
 * Displays 2 ArcGIS maps for drought monitoring:
 * 1. HUGEO Groundwater Level Map (map.hugeo.hu - MapServer)
 * 2. Drought Index Map (ovfgis2.vizugy.hu - ImageServer with HDI raster data)
 *
 * Features:
 * - Dynamic Leaflet + esri-leaflet loading
 * - Progress tracking for image loading
 * - Auto-refresh every 10 minutes
 * - Color legends overlaid on each map
 *
 * Technical Notes:
 * - WMS endpoints don't work (HTTP 400 errors)
 * - Using ArcGIS REST API (MapServer + ImageServer) instead
 * - ImageServer provides real-time raster data (HDI values)
 */

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Maximize2, X } from 'lucide-react';
import { useRegion } from '../../contexts/RegionContext';
import { CollapsibleLegend } from '../../components/UI/CollapsibleLegend';

// Map service URLs

// HUGEO WMS - Try direct access first (user's original working approach)
// If CORS error occurs in production, we'll need to use server-side proxy
const WMS_HUGEO = 'https://map.hugeo.hu/arcgis/services/tvz/tvz100_all/MapServer/WMSServer';

// Aszályindex ImageServer (CORS OK)
const IMAGE_DROUGHT_INDEX = 'https://ovfgis2.vizugy.hu/arcgis/rest/services/Aszalymon/mosaic_hdis/ImageServer';

// Map center / zoom — region-dependent.
// Duna: country view (good for the southern-Duna monitoring area).
// Dráva: focus the Dráva corridor (Felsőszentmárton–Berzence–Kálmáncsa).
const MAP_CENTER_DUNA: [number, number] = [47.1625, 19.5033];
const MAP_ZOOM_DUNA = 7;
const MAP_CENTER_DRAVA: [number, number] = [46.03, 17.42];
const MAP_ZOOM_DRAVA = 8;
const AUTO_REFRESH_INTERVAL = 600000; // 10 minutes
const TILE_LOAD_TIMEOUT = 8000; // 8 seconds

interface MapState {
  loading: boolean;
  progress: number;
  error: string | null;
}

export const DroughtMapsWidget: React.FC = () => {
  const { region } = useRegion();
  const mapCenter = region === 'drava' ? MAP_CENTER_DRAVA : MAP_CENTER_DUNA;
  const mapZoom = region === 'drava' ? MAP_ZOOM_DRAVA : MAP_ZOOM_DUNA;

  // Map refs
  const map1Ref = useRef<HTMLDivElement>(null);
  const map2Ref = useRef<HTMLDivElement>(null);

  // Map states
  const [map1State, setMap1State] = useState<MapState>({ loading: true, progress: 0, error: null });
  const [map2State, setMap2State] = useState<MapState>({ loading: true, progress: 0, error: null });

  // HUGEO layer selector (0: mélység, 1: nyugalmi szint)
  const [selectedHugeoLayer, setSelectedHugeoLayer] = useState<number>(0);

  // Which map (if any) is in fullscreen overlay ('hugeo' | 'drought' | null)
  const [fullscreenKey, setFullscreenKey] = useState<string | null>(null);

  // Leaflet loaded flag
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Escape-to-exit + body scroll-lock while a map is fullscreen
  useEffect(() => {
    if (!fullscreenKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreenKey(null);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreenKey]);

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
      };

      document.head.appendChild(esriLeafletScript);
    };

    leafletScript.onerror = () => {
      setMap1State(prev => ({ ...prev, loading: false, error: 'Leaflet betöltési hiba' }));
      setMap2State(prev => ({ ...prev, loading: false, error: 'Leaflet betöltési hiba' }));
    };

    document.head.appendChild(leafletScript);

    return () => {
      // Cleanup is handled by Leaflet
    };
  }, []);

  // Store map instances (keyed by map id) for invalidateSize on fullscreen toggle
  const mapInstancesRef = useRef<Record<string, any>>({});

  // After a fullscreen toggle the map container changes size — re-measure both maps.
  useEffect(() => {
    const t = setTimeout(() => {
      Object.values(mapInstancesRef.current).forEach((inst: any) => {
        try { inst?.map?.invalidateSize(); } catch { /* map may be torn down */ }
      });
    }, 320);
    return () => clearTimeout(t);
  }, [fullscreenKey]);

  useEffect(() => {
    if (!leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Create map widget (supports WMS, MapServer, and ImageServer)
    const createWidget = (
      mapRef: React.RefObject<HTMLDivElement | null>,
      layerUrl: string,
      layerType: 'wms' | 'mapserver' | 'imageserver',
      layerParam: string,
      setState: React.Dispatch<React.SetStateAction<MapState>>,
      enablePopup: boolean = false,
      mapId: string = ''
    ) => {
      if (!mapRef.current) return null;

      try {
        // Create map
        const map = L.map(mapRef.current, {
          center: mapCenter,
          zoom: mapZoom,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        // Base layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        let dataLayer: any;
        let layerId: number | undefined;

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
          layerId = parseInt(layerParam);
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

        // Store instance (keyed by map id) for fullscreen invalidateSize
        if (mapId) {
          mapInstancesRef.current[mapId] = result;
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

    // Create 2 maps (HUGEO + Aszályindex)
    const widget1 = createWidget(map1Ref, WMS_HUGEO, 'wms', String(selectedHugeoLayer), setMap1State, false, 'hugeo');
    const widget2 = createWidget(map2Ref, IMAGE_DROUGHT_INDEX, 'imageserver', '0', setMap2State, false, 'drought');

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
      mapInstancesRef.current = {};
    };
  }, [leafletLoaded, selectedHugeoLayer, mapCenter, mapZoom]);

  // Render map with loading state
  const renderMap = (
    ref: React.RefObject<HTMLDivElement | null>,
    state: MapState,
    title: string,
    subtitle: string,
    legend?: React.ReactNode,
    layerSelector?: React.ReactNode,
    id: string = ''
  ) => {
    const isFs = !!id && fullscreenKey === id;
    return (
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

      {/* Map Container — becomes a fullscreen overlay when isFs */}
      <div className={isFs ? 'fixed inset-0 z-[9998] bg-white' : 'relative w-full h-96 rounded-lg overflow-hidden'}>
        {/* Loading Overlay */}
        {state.loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-[999]">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-2" />
            <p className="text-sm text-gray-600">Térkép betöltése... {state.progress}%</p>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center z-[999] p-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-700 text-center">{state.error}</p>
          </div>
        )}

        {/* Leaflet Map */}
        <div ref={ref} className="w-full h-full" style={{ position: 'relative', zIndex: 1 }} />

        {/* Enter fullscreen (normal mode) */}
        {id && !isFs && (
          <button
            onClick={() => setFullscreenKey(id)}
            className="absolute top-2 right-2 z-[1000] bg-white/90 rounded-lg shadow-md p-2 hover:bg-white transition-colors"
            aria-label="Teljes képernyő"
            title="Teljes képernyő"
          >
            <Maximize2 className="h-4 w-4 text-gray-700" />
          </button>
        )}

        {/* Fullscreen chrome: layer selector + close, plus collapsible legend */}
        {isFs && (
          <>
            <div className="absolute top-2 right-2 z-[10000] flex items-center gap-2">
              {layerSelector}
              <button
                onClick={() => setFullscreenKey(null)}
                className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-100 transition-colors"
                aria-label="Bezárás"
                title="Bezárás (Esc)"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            {legend && (
              <CollapsibleLegend className="bottom-4 left-4">{legend}</CollapsibleLegend>
            )}
          </>
        )}
      </div>

      {/* Legend (a térkép alatt) — normal mode only */}
      {legend && !isFs && !state.loading && !state.error && (
        <div className="map-legend-below mt-3 px-3 py-2.5" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          {legend}
        </div>
      )}
    </div>
    );
  };

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

  // Dynamic legend based on selected layer (HUGEO official colors)
  const hugeoLegend = selectedHugeoLayer === 0 ? (
    <div>
      <h4 className="text-xs font-semibold text-gray-900 mb-2">Talajvízszint mélysége a felszín alatt (m)</h4>
      <div className="space-y-1 text-xs">
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#0066CC',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>0-1 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#33CCFF',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>1-2 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#66CC66',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>2-4 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#FFCC33',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>4-8 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#FF9933',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>&gt;8 m</span>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <h4 className="text-xs font-semibold text-gray-900 mb-2">Nyugalmi szint a felszín alatt (m)</h4>
      <div className="space-y-1 text-xs">
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#0066CC',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>0-1 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#33CCFF',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>1-2 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#66CC66',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>2-4 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#FFCC33',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>4-8 m</span>
        </div>
        <div className="map-legend-item">
          <div
            className="map-legend-color"
            style={{
              backgroundColor: '#FF9933',
              width: '20px',
              height: '20px',
              border: '1px solid #333',
              borderRadius: '3px'
            }}
          />
          <span>&gt;8 m</span>
        </div>
      </div>
    </div>
  );

  // Drought index legend (HDIs)
  const droughtIndexLegend = (
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
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Map 1: HUGEO Groundwater Level - Blue tint */}
      <div className="bg-blue-50 p-6 rounded-2xl">
        {renderMap(
          map1Ref,
          map1State,
          'Aktuális talajvízszint (HUGEO)',
          'HUGEO adatok',
          hugeoLegend,
          hugeoLayerSelector,
          'hugeo'
        )}
      </div>

      {/* Map 2: Drought Index (HDIs) - Green tint */}
      <div className="bg-green-50 p-6 rounded-2xl">
        {renderMap(
          map2Ref,
          map2State,
          'Aszályindex (HDIs)',
          'OVF aszálymonitoring - aktuális',
          droughtIndexLegend,
          undefined,
          'drought'
        )}
      </div>
    </div>
  );
};
