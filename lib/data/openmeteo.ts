import { WeatherData, OpenMeteoResponse } from '@/lib/types';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const weatherCache = new Map<string, WeatherData>();

function createCacheKey(lat: number, lon: number): string {
  const roundedLat = Math.round(lat * 10) / 10;
  const roundedLon = Math.round(lon * 10) / 10;
  return `${roundedLat},${roundedLon}`;
}

export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const cacheKey = createCacheKey(lat, lon);
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    console.log(`Using cached weather for ${cacheKey}`);
    return cached;
  }

  console.log(`Fetching weather for ${lat}, ${lon}...`);

  try {
    const url = new URL(OPEN_METEO_BASE);
    url.searchParams.append('latitude', lat.toFixed(6));
    url.searchParams.append('longitude', lon.toFixed(6));
    url.searchParams.append('hourly', 'temperature_2m,wind_speed_10m,wind_direction_10m');
    url.searchParams.append('past_days', '1');
    url.searchParams.append('forecast_days', '1');
    url.searchParams.append('timezone', 'UTC');

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    const hourly = data.hourly.time.map((time, idx) => ({
      time: new Date(time),
      temperature: data.hourly.temperature_2m[idx],
      windSpeed: data.hourly.wind_speed_10m[idx],
      windDirection: data.hourly.wind_direction_10m[idx],
    }));

    const latestIdx = hourly.length - 1;
    const current = {
      temperature: data.hourly.temperature_2m[latestIdx],
      windSpeed: data.hourly.wind_speed_10m[latestIdx],
      windDirection: data.hourly.wind_direction_10m[latestIdx],
      time: new Date(data.hourly.time[latestIdx]),
    };

    const weatherData: WeatherData = {
      location: {
        lat: data.latitude,
        lon: data.longitude,
      },
      current,
      hourly,
    };

    weatherCache.set(cacheKey, weatherData);

    console.log(`Fetched weather for ${cacheKey}`);
    return weatherData;

  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
}

export function clearWeatherCache(): void {
  weatherCache.clear();
  console.log('Weather cache cleared');
}

export function windDirectionToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
