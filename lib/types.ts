/**
 * Raw data point from WindBorne API files (00.json - 23.json)
 * Format: [latitude, longitude, altitude_km]
 */
export type RawWbPoint = [number, number, number];

// Open-Meteo API response structure
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
}

// ============================================================================
// Processed Data Types
// ============================================================================

// Reconstructed balloon position for a specific hour
export interface BalloonSample {
  hourAgo: number;      // 0 = latest, 23 = oldest (24 hours ago)
  lat: number;
  lon: number;
  altKm: number;
  timestamp?: Date;     // Optional: reconstructed time
}

// Complete track for a single balloon
export interface BalloonTrack {
  id: number;            			// Index in the arrays (balloon identifier)
  samples: BalloonSample[];  		// All 24 hour samples (newest to oldest)
  latest: BalloonSample;     		// Most recent position (convenience)
}

// Weather data for a specific location
export interface WeatherData {
  location: {
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;      // °C
    windSpeed: number;        // km/h
    windDirection: number;    // degrees
    time: Date;
  };
  hourly: Array<{
    time: Date;
    temperature: number;
    windSpeed: number;
    windDirection: number;
  }>;
}

// ============================================================================
// UI State Types
// ============================================================================

// Global data state managed by BalloonDataContext
export interface BalloonDataState {
  balloons: BalloonTrack[];
  isLoading: boolean;
  error: string | null;
  selectedBalloonId: number | null;
  trackHours: number;  // How many hours of track to display (1-24)
}

// Actions for BalloonDataContext
export interface BalloonDataActions {
  selectBalloon: (id: number | null) => void;
  setTrackHours: (hours: number) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

// Geographic coordinate pair
export interface LatLng {
  lat: number;
  lon: number;
}

// Cache key for Open-Meteo API (rounded coords for efficient caching)
export interface WeatherCacheKey {
  lat: number;  // Rounded to 1 decimal
  lon: number;  // Rounded to 1 decimal
}
