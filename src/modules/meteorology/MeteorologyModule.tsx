/**
 * MeteorologyModule Component
 *
 * Main component for the Meteorology module.
 * Displays weather data for 4 cities with:
 * - City selector (module-specific)
 * - 6 data cards (temperature, precipitation, wind speed, pressure, humidity, wind direction)
 * - Precipitation summary card (7-day, 30-day, YTD from Open-Meteo Historical API)
 * - 3-day forecast chart (Yr.no)
 * - Radar map (OMSZ met.hu ODP)
 */

import React, { useState } from 'react'
import {
  Thermometer,
  CloudRain,
  Wind,
  Gauge,
  Droplets,
  Navigation,
  AlertCircle,
} from 'lucide-react'
import { CitySelector } from '../../components/selectors/CitySelector'
import { DataCard } from '../../components/UI/DataCard'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { Footer } from '../../components/Layout/Footer'
import { ForecastChart } from './ForecastChart'
import { RadarMap } from './RadarMap'
import { PrecipitationSummaryCard } from './PrecipitationSummaryCard'
import { useWeatherData } from '../../hooks/useWeatherData'
import type { City, DataSource } from '../../types'

interface MeteorologyModuleProps {
  cities: City[]
  initialCity?: City
}

export const MeteorologyModule: React.FC<MeteorologyModuleProps> = ({ cities, initialCity }) => {
  const [selectedCity, setSelectedCity] = useState<City | null>(initialCity || cities[0] || null)

  // Fetch weather data from Supabase
  const { weatherData, isLoading, error: weatherError } = useWeatherData(selectedCity?.id || null)

  // Data sources for footer
  const dataSources: DataSource[] = [
    {
      name: 'OpenWeatherMap',
      url: 'https://openweathermap.org',
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'OMSZ Radar',
      url: 'https://odp.met.hu',
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Open-Meteo',
      url: 'https://open-meteo.com',
      lastUpdate: new Date().toISOString(),
    },
    {
      name: 'Yr.no',
      url: 'https://www.yr.no',
      lastUpdate: new Date().toISOString(),
    },
  ]

  // Format wind direction
  const getWindDirectionLabel = (degrees: number): string => {
    const directions = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy']
    const index = Math.round(degrees / 45) % 8
    return `${directions[index]} (${degrees}°)`
  }

  if (isLoading) {
    return (
      <div className="main-container">
        <LoadingSpinner message="Időjárási adatok betöltése..." />
      </div>
    )
  }

  return (
    <div className="main-container">
      {/* City Selector */}
      <div className="mb-6 flex justify-end">
        <CitySelector cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} />
      </div>

      {/* Error State */}
      {weatherError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="mb-1 text-base font-semibold text-red-900">
              Hiba az adatok betöltésekor
            </h3>
            <p className="text-sm text-red-700">
              {weatherError.message || 'Nem sikerült betölteni az időjárási adatokat.'}
            </p>
          </div>
        </div>
      )}

      {/* No City Selected State */}
      {!selectedCity && !weatherError && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <Thermometer className="mx-auto mb-3 h-12 w-12 text-blue-600" />
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Válassz várost</h3>
          <p className="text-sm text-blue-700">
            Válassz egy várost a fenti listából az időjárási adatok megtekintéséhez.
          </p>
        </div>
      )}

      {/* No Data Available State */}
      {selectedCity && !weatherData && !isLoading && !weatherError && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <Thermometer className="mx-auto mb-3 h-12 w-12 text-blue-600" />
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Nincs elérhető adat</h3>
          <p className="text-sm text-blue-700">
            Jelenleg nincs időjárási adat ehhez a városhoz: {selectedCity.name}
          </p>
        </div>
      )}

      {/* Weather Data Cards - 2x3 Grid - Only show when we have data */}
      {weatherData && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Precipitation Summary */}
          <div className="mb-6">
            <PrecipitationSummaryCard cityId={selectedCity?.id || null} />
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
        </>
      )}

      {/* Footer with data source */}
      <Footer dataSources={dataSources} />
    </div>
  )
}
