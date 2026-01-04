/**
 * Weather Service
 *
 * Fetches weather data from Open-Meteo API (free, no API key required).
 * Provides weather information for padel court bookings.
 */

import { cache } from './cache.js';
import type { Coordinates } from '../types/index.js';

// Weather information for a specific time
export interface WeatherInfo {
  temperature_c: number;
  feels_like_c: number;
  condition: string;
  condition_emoji: string;
  precipitation_chance: number;
  wind_speed_kmh: number;
  humidity: number;
  is_playable: boolean;
  playability_note?: string;
}

// Open-Meteo API response types
interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
    windspeed_10m: number[];
  };
  hourly_units: {
    temperature_2m: string;
    windspeed_10m: string;
  };
}

// Weather code to condition mapping
const WEATHER_CODES: Record<number, { condition: string; emoji: string }> = {
  0: { condition: 'Clear sky', emoji: '☀️' },
  1: { condition: 'Mainly clear', emoji: '🌤️' },
  2: { condition: 'Partly cloudy', emoji: '⛅' },
  3: { condition: 'Overcast', emoji: '☁️' },
  45: { condition: 'Foggy', emoji: '🌫️' },
  48: { condition: 'Depositing rime fog', emoji: '🌫️' },
  51: { condition: 'Light drizzle', emoji: '🌦️' },
  53: { condition: 'Moderate drizzle', emoji: '🌦️' },
  55: { condition: 'Dense drizzle', emoji: '🌧️' },
  56: { condition: 'Light freezing drizzle', emoji: '🌧️' },
  57: { condition: 'Dense freezing drizzle', emoji: '🌧️' },
  61: { condition: 'Slight rain', emoji: '🌧️' },
  63: { condition: 'Moderate rain', emoji: '🌧️' },
  65: { condition: 'Heavy rain', emoji: '🌧️' },
  66: { condition: 'Light freezing rain', emoji: '🌧️' },
  67: { condition: 'Heavy freezing rain', emoji: '🌧️' },
  71: { condition: 'Slight snow', emoji: '🌨️' },
  73: { condition: 'Moderate snow', emoji: '🌨️' },
  75: { condition: 'Heavy snow', emoji: '❄️' },
  77: { condition: 'Snow grains', emoji: '🌨️' },
  80: { condition: 'Slight rain showers', emoji: '🌦️' },
  81: { condition: 'Moderate rain showers', emoji: '🌧️' },
  82: { condition: 'Violent rain showers', emoji: '🌧️' },
  85: { condition: 'Slight snow showers', emoji: '🌨️' },
  86: { condition: 'Heavy snow showers', emoji: '❄️' },
  95: { condition: 'Thunderstorm', emoji: '⛈️' },
  96: { condition: 'Thunderstorm with slight hail', emoji: '⛈️' },
  99: { condition: 'Thunderstorm with heavy hail', emoji: '⛈️' },
};

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get weather code info or default
 */
function getWeatherCodeInfo(code: number): { condition: string; emoji: string } {
  return WEATHER_CODES[code] || { condition: 'Unknown', emoji: '❓' };
}

/**
 * Assess if conditions are playable for outdoor padel
 */
function assessPlayability(
  precipChance: number,
  windSpeed: number,
  weatherCode: number
): { is_playable: boolean; note?: string } {
  // Heavy rain, thunderstorm, or snow
  if (weatherCode >= 65 || weatherCode >= 95) {
    return { is_playable: false, note: 'Not recommended - severe weather expected' };
  }

  // High rain chance
  if (precipChance > 60) {
    return { is_playable: false, note: 'High chance of rain - consider indoor court' };
  }

  // Very windy
  if (windSpeed > 40) {
    return { is_playable: false, note: 'Too windy for outdoor play' };
  }

  // Moderate rain chance or wind
  if (precipChance > 30 || windSpeed > 25) {
    return { is_playable: true, note: 'Conditions may be challenging - indoor recommended' };
  }

  // Slight concerns
  if (precipChance > 15 || windSpeed > 15) {
    return { is_playable: true, note: 'Good conditions with slight wind/rain chance' };
  }

  return { is_playable: true, note: 'Perfect conditions for padel!' };
}

/**
 * Fetch weather forecast for a location
 */
async function fetchWeatherForecast(
  coordinates: Coordinates,
  timezone: string = 'auto'
): Promise<OpenMeteoResponse | null> {
  const cacheKey = `weather:${coordinates.latitude.toFixed(2)},${coordinates.longitude.toFixed(2)}`;

  return cache.getOrSet(
    cacheKey,
    async () => {
      const url = new URL(OPEN_METEO_BASE_URL);
      url.searchParams.set('latitude', coordinates.latitude.toString());
      url.searchParams.set('longitude', coordinates.longitude.toString());
      url.searchParams.set(
        'hourly',
        'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weathercode,windspeed_10m'
      );
      url.searchParams.set('timezone', timezone);
      url.searchParams.set('forecast_days', '7');

      try {
        const response = await fetch(url.toString());

        if (!response.ok) {
          console.error(`Weather API error: ${response.status}`);
          return null;
        }

        return (await response.json()) as OpenMeteoResponse;
      } catch (error) {
        console.error('Weather fetch error:', error);
        return null;
      }
    },
    WEATHER_CACHE_TTL
  );
}

/**
 * Get weather for a specific datetime
 */
export async function getWeatherForSlot(
  coordinates: Coordinates,
  datetime: string // ISO 8601 format
): Promise<WeatherInfo | null> {
  const forecast = await fetchWeatherForecast(coordinates);

  if (!forecast || !forecast.hourly) {
    return null;
  }

  // Parse the datetime and find the matching hour
  const targetDate = new Date(datetime);
  const targetHour = targetDate.toISOString().slice(0, 13) + ':00'; // Format: "2025-01-05T18:00"

  // Find index of the matching hour
  const hourIndex = forecast.hourly.time.findIndex((time) => time.startsWith(targetHour.slice(0, 13)));

  if (hourIndex === -1) {
    // Try to find closest hour within the forecast
    const targetTime = targetDate.getTime();
    let closestIndex = 0;
    let closestDiff = Infinity;

    forecast.hourly.time.forEach((time, index) => {
      const diff = Math.abs(new Date(time).getTime() - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });

    // Only use if within 2 hours
    if (closestDiff > 2 * 60 * 60 * 1000) {
      return null;
    }

    return extractWeatherAtIndex(forecast, closestIndex);
  }

  return extractWeatherAtIndex(forecast, hourIndex);
}

/**
 * Extract weather info at a specific index from the forecast
 */
function extractWeatherAtIndex(forecast: OpenMeteoResponse, index: number): WeatherInfo {
  const weatherCode = forecast.hourly.weathercode[index];
  const precipChance = forecast.hourly.precipitation_probability[index];
  const windSpeed = forecast.hourly.windspeed_10m[index];

  const { condition, emoji } = getWeatherCodeInfo(weatherCode);
  const { is_playable, note } = assessPlayability(precipChance, windSpeed, weatherCode);

  return {
    temperature_c: Math.round(forecast.hourly.temperature_2m[index]),
    feels_like_c: Math.round(forecast.hourly.apparent_temperature[index]),
    condition,
    condition_emoji: emoji,
    precipitation_chance: precipChance,
    wind_speed_kmh: Math.round(windSpeed),
    humidity: forecast.hourly.relative_humidity_2m[index],
    is_playable,
    playability_note: note,
  };
}

/**
 * Get daily weather summary for a date
 */
export async function getDailyWeatherSummary(
  coordinates: Coordinates,
  date: string // YYYY-MM-DD format
): Promise<{ emoji: string; temp_high: number; temp_low: number; condition: string } | null> {
  const forecast = await fetchWeatherForecast(coordinates);

  if (!forecast || !forecast.hourly) {
    return null;
  }

  // Find all hours for the given date
  const dateHours = forecast.hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.startsWith(date));

  if (dateHours.length === 0) {
    return null;
  }

  // Calculate summary
  const temps = dateHours.map(({ index }) => forecast.hourly.temperature_2m[index]);
  const weatherCodes = dateHours.map(({ index }) => forecast.hourly.weathercode[index]);

  // Get the most common/worst weather code during daytime (8am-8pm)
  const daytimeHours = dateHours.filter(({ time }) => {
    const hour = parseInt(time.slice(11, 13));
    return hour >= 8 && hour <= 20;
  });

  const dominantCode =
    daytimeHours.length > 0
      ? weatherCodes[Math.floor(daytimeHours.length / 2)] // Middle of day
      : weatherCodes[Math.floor(weatherCodes.length / 2)];

  const { condition, emoji } = getWeatherCodeInfo(dominantCode);

  return {
    emoji,
    temp_high: Math.round(Math.max(...temps)),
    temp_low: Math.round(Math.min(...temps)),
    condition,
  };
}

/**
 * Format weather info for display
 */
export function formatWeatherLine(weather: WeatherInfo): string {
  const parts = [
    `${weather.condition_emoji} ${weather.temperature_c}°C`,
    `Feels like ${weather.feels_like_c}°C`,
    `💨 ${weather.wind_speed_kmh} km/h`,
    `🌧️ ${weather.precipitation_chance}%`,
  ];

  return parts.join(' | ');
}

/**
 * Format playability status
 */
export function formatPlayabilityStatus(weather: WeatherInfo): string {
  if (weather.is_playable) {
    return `✅ ${weather.playability_note || 'Good conditions'}`;
  }
  return `⚠️ ${weather.playability_note || 'Check conditions'}`;
}
