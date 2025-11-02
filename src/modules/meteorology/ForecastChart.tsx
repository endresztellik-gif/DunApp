/**
 * ForecastChart Component
 *
 * Displays 3-day weather forecast with 6-hour breakdown.
 * Uses Recharts for visualization with temperature and precipitation.
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

export const ForecastChart: React.FC<ForecastChartProps> = ({ cityId }) => {
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
      <div className="w-full h-96 bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 flex items-center justify-center">
        <LoadingSpinner message="Előrejelzés betöltése..." />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <h3 className="mb-1 text-base font-semibold text-red-900">
            Hiba az előrejelzés betöltésekor
          </h3>
          <p className="text-sm text-red-700">{error.message}</p>
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
    <div className="w-full h-96 bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={350}>
        <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ed" />
          <XAxis
            dataKey="time"
            stroke="#607d8b"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="temp"
            stroke="#00a8cc"
            style={{ fontSize: '12px' }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="precip"
            orientation="right"
            stroke="#1e88e5"
            style={{ fontSize: '12px' }}
            label={{ value: 'mm', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e0e7ed',
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
            stroke="#00a8cc"
            strokeWidth={2}
            dot={{ fill: '#00a8cc', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="precip"
            type="monotone"
            dataKey="precipitation"
            stroke="#1e88e5"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#1e88e5', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
