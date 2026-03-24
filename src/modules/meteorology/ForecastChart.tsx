/**
 * ForecastChart Component
 *
 * Displays 3-day weather forecast with 6-hour breakdown.
 * Uses Recharts for visualization with temperature and precipitation.
 *
 * PERFORMANCE: Memoized to prevent re-renders when cityId hasn't changed.
 * Recharts rendering is expensive - memoization has high impact.
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
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Calendar, AlertCircle } from 'lucide-react';
import { useForecastData } from '../../hooks/useForecastData';

interface ForecastChartProps {
  cityId: string;
}

export const ForecastChart = React.memo<ForecastChartProps>(({ cityId }) => {
  // Fetch forecast data using the new hook
  const { forecasts, isLoading, error } = useForecastData(cityId);

  // Transform forecast data for Recharts
  const forecastData = forecasts.map((forecast) => ({
    time: new Date(forecast.forecastTime).toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
    temperature: forecast.temperature,
    precipitation: forecast.precipitationAmount,
  }));

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full h-96 p-4 flex items-center justify-center" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
        <LoadingSpinner message="Előrejelzés betöltése..." />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4" style={{ background: 'var(--status-alert-bg)', color: 'var(--status-alert-text)', border: '0.5px solid var(--status-alert-border)', borderRadius: 'var(--radius-md)' }}>
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: 'var(--status-alert-text)' }} />
        <div>
          <h3 className="mb-1 text-base font-semibold">
            Hiba az előrejelzés betöltésekor
          </h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!cityId || forecastData.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        message="Nincs előrejelzési adat"
        description="Válasszon várost az időjárás előrejelzés megtekintéséhez"
      />
    );
  }

  return (
    <div className="w-full h-96 p-4" style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={350}>
        <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,95,122,.10)" />
          <XAxis
            dataKey="time"
            stroke="#7a9eaa"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="temp"
            stroke="#22a6b3"
            style={{ fontSize: '12px' }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="precip"
            orientation="right"
            stroke="#1a5f7a"
            style={{ fontSize: '12px' }}
            label={{ value: 'mm', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '0.5px solid var(--border-default)',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'temperature') return [`${value.toFixed(1)}°C`, 'Hőmérséklet'];
              if (name === 'precipitation') return [`${value.toFixed(1)} mm`, 'Csapadék'];
              return value;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === 'temperature') return 'Hőmérséklet';
              if (value === 'precipitation') return 'Csapadék';
              return value;
            }}
          />
          {/* Temperature line */}
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            stroke="#22a6b3"
            strokeWidth={2}
            dot={{ fill: '#22a6b3', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="precip"
            type="monotone"
            dataKey="precipitation"
            stroke="#1a5f7a"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#1a5f7a', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

ForecastChart.displayName = 'ForecastChart';
