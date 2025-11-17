import { BalloonTrack, BalloonSample } from '@/lib/types';

export interface FuturePosition {
  lat: number;
  lon: number;
  altKm: number;
  hoursAhead: number;
  predictionType: 'velocity' | 'wind';
}

// Cache for trajectory predictions
const trajectoryCache = new Map<string, { predictions: FuturePosition[]; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

function calculateVelocity(from: BalloonSample, to: BalloonSample): { latPerHour: number; lonPerHour: number; altPerHour: number } {
  const timeDiff = from.hourAgo - to.hourAgo;

  if (timeDiff === 0) {
    return { latPerHour: 0, lonPerHour: 0, altPerHour: 0 };
  }

  return {
    latPerHour: (to.lat - from.lat) / timeDiff,
    lonPerHour: (to.lon - from.lon) / timeDiff,
    altPerHour: (to.altKm - from.altKm) / timeDiff,
  };
}

async function fetchWindVelocity(lat: number, lon: number, altKm: number): Promise<{ u: number; v: number } | null> {
  try {
    const pressureLevels = [1000, 975, 950, 925, 900, 875, 850, 825, 800, 775, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100, 70, 50, 30];

    const altMeters = altKm * 1000;
    const pressureHPa = 1013.25 * Math.pow(1 - (0.0065 * altMeters) / 288.15, 5.255);

    const closestLevel = pressureLevels.reduce((prev, curr) =>
      Math.abs(curr - pressureHPa) < Math.abs(prev - pressureHPa) ? curr : prev
    );

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_${closestLevel}hPa,wind_direction_${closestLevel}hPa&forecast_days=1`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const windSpeed = data.hourly?.[`wind_speed_${closestLevel}hPa`]?.[0]; // m/s
    const windDir = data.hourly?.[`wind_direction_${closestLevel}hPa`]?.[0]; // degrees

    if (windSpeed === undefined || windDir === undefined) {
      return null;
    }

    const dirRadians = (windDir * Math.PI) / 180;
    const u = -windSpeed * Math.sin(dirRadians);
    const v = -windSpeed * Math.cos(dirRadians);

    return { u, v };
  } catch (error) {
    console.error(`Failed to fetch wind velocity for ${lat},${lon},${altKm}:`, error);
    return null;
  }
}

export function predictFutureTrajectory(balloon: BalloonTrack, hoursAhead: number = 3): FuturePosition[] {
  if (balloon.samples.length < 3) {
    return [];
  }

  const recentSamples = balloon.samples.slice(0, 3);

  const velocities = [];
  for (let i = 0; i < recentSamples.length - 1; i++) {
    velocities.push(calculateVelocity(recentSamples[i + 1], recentSamples[i]));
  }

  const avgVelocity = {
    latPerHour: velocities.reduce((sum, v) => sum + v.latPerHour, 0) / velocities.length,
    lonPerHour: velocities.reduce((sum, v) => sum + v.lonPerHour, 0) / velocities.length,
    altPerHour: velocities.reduce((sum, v) => sum + v.altPerHour, 0) / velocities.length,
  };

  const futurePositions: FuturePosition[] = [];
  const latest = balloon.latest;

  for (let h = 1; h <= hoursAhead; h++) {
    let futureLat = latest.lat + (avgVelocity.latPerHour * h);
    let futureLon = latest.lon + (avgVelocity.lonPerHour * h);
    const futureAlt = latest.altKm + (avgVelocity.altPerHour * h);

    if (futureLon > 180) futureLon -= 360;
    if (futureLon < -180) futureLon += 360;

    futureLat = Math.max(-85, Math.min(85, futureLat));

    futurePositions.push({
      lat: futureLat,
      lon: futureLon,
      altKm: Math.max(5, Math.min(40, futureAlt)),
      hoursAhead: h,
      predictionType: 'velocity',
    });
  }

  return futurePositions;
}

export async function predictHybridTrajectory(balloon: BalloonTrack, includeWindForecast: boolean = true): Promise<FuturePosition[]> {
  // Create cache key based on balloon ID and position
  const cacheKey = `${balloon.id}-${balloon.latest.lat.toFixed(4)}-${balloon.latest.lon.toFixed(4)}-${balloon.latest.altKm.toFixed(2)}-${includeWindForecast}`;

  // Check cache
  const cached = trajectoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    console.log(`Using cached trajectory for balloon ${balloon.id}`);
    return cached.predictions;
  }

  const velocityPredictions = predictFutureTrajectory(balloon, 3);

  if (velocityPredictions.length === 0) {
    return [];
  }

  const allPredictions = [...velocityPredictions];

  // Only fetch wind forecast if explicitly requested (for current position)
  if (!includeWindForecast) {
    trajectoryCache.set(cacheKey, { predictions: allPredictions, timestamp: Date.now() });
    return allPredictions;
  }

  let lastPosition = velocityPredictions[velocityPredictions.length - 1];

  for (let h = 4; h <= 9; h++) {
    const windData = await fetchWindVelocity(lastPosition.lat, lastPosition.lon, lastPosition.altKm);

    if (!windData) {
      const timeSinceLatest = h;
      const recentSamples = balloon.samples.slice(0, 3);
      const velocities = [];
      for (let i = 0; i < recentSamples.length - 1; i++) {
        velocities.push(calculateVelocity(recentSamples[i + 1], recentSamples[i]));
      }
      const avgVelocity = {
        latPerHour: velocities.reduce((sum, v) => sum + v.latPerHour, 0) / velocities.length,
        lonPerHour: velocities.reduce((sum, v) => sum + v.lonPerHour, 0) / velocities.length,
        altPerHour: velocities.reduce((sum, v) => sum + v.altPerHour, 0) / velocities.length,
      };

      let futureLat = balloon.latest.lat + (avgVelocity.latPerHour * timeSinceLatest);
      let futureLon = balloon.latest.lon + (avgVelocity.lonPerHour * timeSinceLatest);
      const futureAlt = balloon.latest.altKm + (avgVelocity.altPerHour * timeSinceLatest);

      if (futureLon > 180) futureLon -= 360;
      if (futureLon < -180) futureLon += 360;
      futureLat = Math.max(-85, Math.min(85, futureLat));

      lastPosition = {
        lat: futureLat,
        lon: futureLon,
        altKm: Math.max(5, Math.min(40, futureAlt)),
        hoursAhead: h,
        predictionType: 'wind',
      };
      allPredictions.push(lastPosition);
      continue;
    }

    const latDisplacement = (windData.v * 3600) / 111000;
    const lonDisplacement = (windData.u * 3600) / (111000 * Math.cos((lastPosition.lat * Math.PI) / 180));

    let newLat = lastPosition.lat + latDisplacement;
    let newLon = lastPosition.lon + lonDisplacement;

    if (newLon > 180) newLon -= 360;
    if (newLon < -180) newLon += 360;
    newLat = Math.max(-85, Math.min(85, newLat));

    const newAlt = lastPosition.altKm;

    lastPosition = {
      lat: newLat,
      lon: newLon,
      altKm: Math.max(5, Math.min(40, newAlt)),
      hoursAhead: h,
      predictionType: 'wind',
    };

    allPredictions.push(lastPosition);

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Cache the result
  trajectoryCache.set(cacheKey, { predictions: allPredictions, timestamp: Date.now() });
  console.log(`Cached trajectory for balloon ${balloon.id}`);

  return allPredictions;
}