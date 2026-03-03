import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TempPoint {
  cityId: string;
  name: string;
  lat: number;
  lon: number;
  temp: number;   // °C
}

interface CityRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface TempRow {
  temperature: number;
}

export function useTempMapData(): TempPoint[] {
  const [data, setData] = useState<TempPoint[]>([]);

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
            .select('temperature')
            .eq('city_id', c.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          const r = row as unknown as TempRow | null;
          if (r?.temperature == null) return null;

          return {
            cityId: c.id,
            name: c.name,
            lat: c.latitude,
            lon: c.longitude,
            temp: r.temperature,
          };
        })
      );

      setData(results.filter(Boolean) as TempPoint[]);
    }

    load();
  }, []);

  return data;
}
