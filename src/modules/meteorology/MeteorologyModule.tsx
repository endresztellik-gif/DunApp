/**
 * MeteorologyModule Component
 *
 * Main component for the Meteorology module.
 * Displays weather data for 4 cities with:
 * - City selector (module-specific)
 * - 6 data cards (temperature, precipitation, wind speed, pressure, humidity, wind direction)
 * - 3-day forecast chart
 * - Radar map
 */

import React, { useState } from 'react';
import { Thermometer, CloudRain, Wind, Gauge, Droplets, Navigation } from 'lucide-react';
import { CitySelector } from '../../components/selectors/CitySelector';
import { DataCard } from '../../components/UI/DataCard';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Footer } from '../../components/Layout/Footer';
import { ForecastChart } from './ForecastChart';
import { RadarMap } from './RadarMap';
import type { City, WeatherData, DataSource } from '../../types';

interface MeteorologyModuleProps {
  cities: City[];
  initialCity?: City;
}

export const MeteorologyModule: React.FC<MeteorologyModuleProps> = ({
  cities,
  initialCity,
}) => {
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity || cities[0] || null);
  const [isLoading] = useState(false);

  // Placeholder weather data (will be replaced with real data by Data Engineer)
  const weatherData: WeatherData | null = selectedCity
    ? {
        cityId: selectedCity.id,
        temperature: 15.3,
        feelsLike: 14.1,
        tempMin: 12.0,
        tempMax: 18.5,
        pressure: 1013,
        humidity: 65,
        windSpeed: 4.1,
        windDirection: 270,
        cloudsPercent: 40,
        weatherMain: 'Clouds',
        weatherDescription: 'Részben felhős',
        weatherIcon: '02d',
        rain1h: null,
        rain3h: 26.2,
        snow1h: null,
        snow3h: null,
        visibility: 10000,
        timestamp: new Date().toISOString(),
      }
    : null;

  // Data sources for footer
  const dataSources: DataSource[] = [
    {
      name: 'OMSZ',
      url: 'https://www.met.hu',
      lastUpdate: new Date().toISOString(),
    },
  ];

  // Format wind direction
  const getWindDirectionLabel = (degrees: number): string => {
    const directions = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];
    const index = Math.round(degrees / 45) % 8;
    return `${directions[index]} (${degrees}°)`;
  };

  if (isLoading) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Időjárási adatok betöltése..." />
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* City Selector */}
      <div className="flex justify-end mb-6">
        <CitySelector
          cities={cities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />
      </div>

      {/* Weather Data Cards - 2x3 Grid */}
      <div className="grid-meteorology-cards mb-6">
        <DataCard
          icon={Thermometer}
          label="Hőmérséklet"
          value={weatherData?.temperature?.toFixed(1) ?? null}
          unit="°C"
          moduleColor="meteorology"
        />
        <DataCard
          icon={CloudRain}
          label="Csapadék (3h)"
          value={weatherData?.rain3h?.toFixed(1) ?? null}
          unit="mm"
          moduleColor="meteorology"
        />
        <DataCard
          icon={Wind}
          label="Szélsebesség"
          value={weatherData?.windSpeed?.toFixed(1) ?? null}
          unit="km/h"
          moduleColor="meteorology"
        />
        <DataCard
          icon={Gauge}
          label="Légnyomás"
          value={weatherData?.pressure ?? null}
          unit="hPa"
          moduleColor="meteorology"
        />
        <DataCard
          icon={Droplets}
          label="Páratartalom"
          value={weatherData?.humidity ?? null}
          unit="%"
          moduleColor="meteorology"
        />
        <DataCard
          icon={Navigation}
          label="Szélirány"
          value={
            weatherData?.windDirection !== null && weatherData?.windDirection !== undefined
              ? getWindDirectionLabel(weatherData.windDirection)
              : null
          }
          unit=""
          moduleColor="meteorology"
        />
      </div>

      {/* 3-Day Forecast Chart */}
      <div className="mb-6">
        <h2 className="section-title mb-4">3 napos előrejelzés</h2>
        <ForecastChart cityId={selectedCity?.id || ''} />
      </div>

      {/* Radar Map */}
      <div className="mb-6">
        <h2 className="section-title mb-4">Radarkép</h2>
        <RadarMap city={selectedCity} />
      </div>

      {/* Footer with data source */}
      <Footer dataSources={dataSources} />
    </div>
  );
};
