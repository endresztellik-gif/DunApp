import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface WindPoint {
  cityId: string;
  name: string;
  lat: number;
  lon: number;
  windSpeed: number;  // m/s
  windDir: number;    // degrees, meteorological (FROM direction)
}

interface CityRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface WindRow {
  wind_speed: number;
  wind_direction: number | null;
}

export function useWindMapData(): WindPoint[] {
  const [data, setData] = useState<WindPoint[]>([]);

  useEffect(() => {
    async function load() {
      const { data: cities } = await supabase
        .from('meteorology_cities')
        .select('id, name, latitude, longitude')
        .eq('is_active', true);

      if (!cities?.length) return;

      const rows = cities as unknown as CityRow[];

      const results = await Promise.all(
        rows.map(async (c) => {
          const { data: row } = await supabase
            .from('meteorology_data')
            .select('wind_speed, wind_direction')
            .eq('city_id', c.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          const r = row as unknown as WindRow | null;
          if (!r?.wind_speed) return null;

          return {
            cityId: c.id,
            name: c.name,
            lat: c.latitude,
            lon: c.longitude,
            windSpeed: r.wind_speed,
            windDir: r.wind_direction ?? 0,
          };
        })
      );

      setData(results.filter(Boolean) as WindPoint[]);
    }

    load();
  }, []);

  return data;
}
