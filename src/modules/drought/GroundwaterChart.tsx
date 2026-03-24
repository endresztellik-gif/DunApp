/**
 * GroundwaterChart Component - REAL DATA MODE ✅
 *
 * Displays up to 365-day (12-month) water level trend for a selected groundwater well.
 * Uses 5-day sampling to show ~73 data points for optimal trend visualization.
 * Uses Recharts for visualization with responsive design.
 *
 * ✅ NOW USING REAL DATA FROM SUPABASE (2025-11-06+)
 * Data scraped daily from vizugy.hu via incremental fetching
 *
 * NOTE: Database contains 14 months of historical data (Nov 2024 → Jan 2026).
 *       Rolling 365-day window filter ensures chart shows most recent year from latest data.
 *       API fetches 30 days per run every 5 days (cron schedule, updated 2026-01-09).
 *
 * Features:
 * - 365-day historical trend with 5-day sampling
 * - Line chart showing water level over time
 * - Tooltip with formatted dates and values
 * - Loading state with spinner
 * - Empty state when no data available
 * - Well metadata display (name, code, location)
 * - Real-time data from Supabase (hourly cache)
 * - ~73 data points for optimal performance and readability (or less for shorter periods)
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useGroundwaterTimeseries } from '../../hooks/useGroundwaterTimeseries';
import { GroundwaterTimestampTable } from './GroundwaterTimestampTable';
import type { GroundwaterWell } from '../../types';

interface GroundwaterChartProps {
  well: GroundwaterWell;
  onWellSelect?: (wellId: string) => void;
}

export const GroundwaterChart: React.FC<GroundwaterChartProps> = ({ well, onWellSelect }) => {
  // Fetch real data from Supabase
  const { timeseriesData, isLoading, error } = useGroundwaterTimeseries(well.id);

  // Format timestamp for chart display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  // Transform data for Recharts with 5-day sampling
  // This reduces data points for better visualization
  // IMPORTANT: Display values as NEGATIVE because higher value = deeper water
  // This makes the chart intuitive: deeper water appears lower on the chart
  const allData = timeseriesData.map((point) => {
    // Check if water_level_meters is already negative (database inconsistency)
    // If already negative, use as-is. If positive, negate it.
    const rawValue = point.waterLevelMeters;
    const displayLevel = rawValue !== null
      ? (rawValue < 0 ? rawValue : -rawValue)  // Ensure always negative
      : null;

    return {
      timestamp: point.timestamp,
      dateLabel: formatDate(point.timestamp),
      waterLevelMeters: point.waterLevelMeters,
      displayLevel: displayLevel, // ALWAYS negative for display
      waterLevelMasl: point.waterLevelMasl,
      waterTemperature: point.waterTemperature
    };
  });

  // 🆕 Add rolling 365-day window filter from MOST RECENT data point
  // This ensures chart always shows last 365 days from latest data, not from oldest data
  let dataToDisplay = allData;

  if (allData.length > 0) {
    // Find the LATEST timestamp in the dataset
    const latestTimestamp = Math.max(
      ...allData.map(d => new Date(d.timestamp).getTime())
    );

    // Calculate 365 days BACKWARDS from latest data point (not from today!)
    const oneYearAgo = latestTimestamp - (365 * 24 * 60 * 60 * 1000);

    // Filter to last 365 days from most recent data
    dataToDisplay = allData.filter(d =>
      new Date(d.timestamp).getTime() >= oneYearAgo
    );

    // Sort in ASCENDING order for chart display (left to right timeline)
    // Data comes from Supabase in DESCENDING order (newest first)
    dataToDisplay.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  // THEN sample every 5th day for optimal visualization (~73 points for 365 days)
  const chartData = dataToDisplay.filter((_, index) => index % 5 === 0);

  // Calculate Y-axis domain for NEGATIVE values
  // Deeper water (larger positive value) = more negative display value = lower on chart
  const displayLevels = chartData.map((d) => d.displayLevel).filter((v): v is number => v !== null);
  const minDisplayLevel = Math.min(...displayLevels); // Most negative (deepest)
  const maxDisplayLevel = Math.max(...displayLevels); // Least negative (shallowest)
  const range = maxDisplayLevel - minDisplayLevel;

  // Add padding: 30% of range or minimum 0.5m (50cm)
  const padding = Math.max(range * 0.3, 0.5);
  const yDomain = [
    Math.floor((minDisplayLevel - padding) * 10) / 10, // Most negative (bottom)
    Math.ceil((maxDisplayLevel + padding) * 10) / 10   // Least negative (top)
  ];

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const fullDate = new Date(data.timestamp).toLocaleString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return (
        <div className="p-3" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{fullDate}</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-data)', fontFamily: 'var(--font-data)' }}>
            Mélység: {data.displayLevel?.toFixed(2)} m
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ({Math.abs(data.displayLevel || 0).toFixed(2)} m a felszín alatt)
          </p>
          {data.waterLevelMasl !== null && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              tBf: {data.waterLevelMasl.toFixed(2)} m
            </p>
          )}
          {data.waterTemperature !== null && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Hőmérséklet: {data.waterTemperature.toFixed(1)} °C
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Show only every 10th date label to avoid crowding (since we already sample every 5 days)
  // ~73 points / 10 = ~7-8 labels on X-axis
  const tickFormatter = (value: string, index: number) => {
    return index % 10 === 0 ? formatDate(value) : '';
  };

  return (
    <div className="dun-card p-6 mt-6">
      {/* Well Header */}
      <div className="mb-6 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {well.wellName} <span style={{ color: 'var(--color-dun-amber-400)' }}>#{well.wellCode}</span>
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {well.cityName}, {well.county} megye
        </p>
        {well.depthMeters && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Kútmélység: {well.depthMeters} m
          </p>
        )}
      </div>

      {/* Loading State - same min-height as chart to prevent layout shift */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderTopColor: 'var(--color-dun-amber-400)' }}></div>
          <p className="ml-4" style={{ color: 'var(--text-secondary)' }}>Adatok betöltése...</p>
        </div>
      )}

      {/* Error State - same min-height as chart to prevent layout shift */}
      {error && (
        <div className="p-8 text-center min-h-[500px] flex flex-col justify-center" style={{ background: 'var(--status-alert-bg)', border: '0.5px solid var(--status-alert-border)', borderRadius: 'var(--radius-md)' }}>
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--status-alert-text)' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--status-alert-text)' }}>Hiba az adatok betöltésekor</p>
          <p className="text-sm mt-2" style={{ color: 'var(--status-alert-text)' }}>{error.message}</p>
          <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
            Próbáld újra később vagy ellenőrizd az internetkapcsolatot.
          </p>
        </div>
      )}

      {/* Empty State - same min-height as chart to prevent layout shift */}
      {!isLoading && !error && chartData.length === 0 && (
        <div className="p-8 text-center min-h-[500px] flex flex-col justify-center" style={{ background: 'var(--status-warn-bg)', border: '0.5px solid var(--status-warn-border)', borderRadius: 'var(--radius-md)' }}>
          <p className="font-semibold text-lg" style={{ color: 'var(--status-warn-text)' }}>Nincs elérhető adat</p>
          <p className="text-sm mt-2" style={{ color: 'var(--status-warn-text)' }}>
            Nem áll rendelkezésre talajvízszint mérés ehhez a kúthoz.
          </p>
          <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
            A kút adatainak gyűjtése folyamatban lehet. Próbáld újra később.
          </p>
        </div>
      )}

      {/* Chart Display */}
      {!isLoading && !error && chartData.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Talajvízszint alakulása (5 napos mintavétel)
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,95,122,.10)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={tickFormatter}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={yDomain}
                tickCount={8}
                label={{
                  value: 'Mélység a felszíntől (m)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 14, fill: '#7a9eaa' }
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="displayLevel"
                stroke="#2d8a5e"
                strokeWidth={2}
                dot={{ fill: '#2d8a5e', r: 3 }}
                activeDot={{ r: 6 }}
                name="Mélység (m)"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Chart Info Footer */}
          <div className="mt-6 p-4" style={{ background: 'var(--status-ok-bg)', border: '0.5px solid var(--color-dun-ok-200)', borderRadius: 'var(--radius-md)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-3 w-3 rounded-full animate-pulse" style={{ background: 'var(--color-dun-ok-500)' }}></div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-dun-ok-500)' }}>
                ✅ Valós adatok vizugy.hu-ról
              </p>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Automatikus frissítés: 5 naponta 05:00 UTC-kor
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {chartData.length} adatpont (5 napos mintavétel, ~{Math.round(chartData.length * 5)} nap lefedve)
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              Adatforrás: <strong>vizugy.hu</strong> • Utolsó frissítés: {new Date().toLocaleDateString('hu-HU')}
            </p>
          </div>

          {/* Timestamp Table - Last Measurement Dates for All Wells */}
          <GroundwaterTimestampTable onWellSelect={onWellSelect} selectedWellId={well.id} />
        </div>
      )}
    </div>
  );
};
