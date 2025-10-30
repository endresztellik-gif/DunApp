/**
 * MultiStationChart Component
 *
 * Displays water level comparison for 3 stations using dotted lines.
 * Each station has its own color and shows critical level markers (LNV, KKV, NV).
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../../components/UI/EmptyState';
import { TrendingUp } from 'lucide-react';
import type { WaterLevelStation } from '../../types';

interface MultiStationChartProps {
  stations: WaterLevelStation[];
}

// Placeholder forecast data for 3 stations (will be replaced with real data)
const generateMockWaterLevelData = () => {
  const data = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    // 5 days
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
      Szekszárd: 394 - i * 5 + Math.random() * 10,
      Passau: 378 + i * 11 + Math.random() * 10,
      Nagybajcs: 581 + i * 7 + Math.random() * 15,
    });
  }

  return data;
};

// Station colors
const STATION_COLORS = {
  Szekszárd: '#00BCD4', // cyan
  Passau: '#00897B', // teal
  Nagybajcs: '#43A047', // green
};

export const MultiStationChart: React.FC<MultiStationChartProps> = ({ stations }) => {
  const chartData = stations.length === 3 ? generateMockWaterLevelData() : [];

  if (stations.length !== 3 || chartData.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        message="Nincs összehasonlítási adat"
        description="3 állomás adatai szükségesek a grafikon megjelenítéséhez"
      />
    );
  }

  return (
    <div className="chart-container-comparison">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ed" />
          <XAxis
            dataKey="date"
            stroke="#607d8b"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#607d8b"
            style={{ fontSize: '12px' }}
            label={{ value: 'cm', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e0e7ed',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => `${value.toFixed(0)} cm`}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
          />

          {/* Station Lines - Dotted */}
          <Line
            type="monotone"
            dataKey="Szekszárd"
            stroke={STATION_COLORS.Szekszárd}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: STATION_COLORS.Szekszárd, r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="Passau"
            stroke={STATION_COLORS.Passau}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: STATION_COLORS.Passau, r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="Nagybajcs"
            stroke={STATION_COLORS.Nagybajcs}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: STATION_COLORS.Nagybajcs, r: 5 }}
            activeDot={{ r: 7 }}
          />

          {/* TODO: Add critical level reference lines (LNV, KKV, NV)
           * These should be configurable per station
           */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
