import { BalloonTrack, BalloonSample } from '@/lib/types';

export interface WindMisalignmentData {
  balloonId: number;
  segments: WindSegment[];
  avgMisalignment: number;
  maxMisalignment: number;
}

export interface WindSegment {
  fromSample: BalloonSample;
  toSample: BalloonSample;
  observedDirection: number;
  modelledDirection: number | null;
  misalignment: number | null;
  color: string;
}

export interface WindAlignmentInsights {
  avgMisalignment: number;
  worstBalloon: { id: number; misalignment: number } | null;
  worstAltitudeBand: { range: string; misalignment: number } | null;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

function calculateAngularDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

function getColorForMisalignment(misalignment: number | null): string {
  if (misalignment === null) return '#gray-500';
  if (misalignment <= 30) return '#10b981';
  if (misalignment <= 60) return '#eab308';
  return '#ef4444';
}

async function fetchWindDirection(lat: number, lon: number, altKm: number): Promise<number | null> {
  try {
    const pressureLevels = [1000, 975, 950, 925, 900, 875, 850, 825, 800, 775, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100, 70, 50, 30];

    const altMeters = altKm * 1000;
    const pressureHPa = 1013.25 * Math.pow(1 - (0.0065 * altMeters) / 288.15, 5.255);

    const closestLevel = pressureLevels.reduce((prev, curr) =>
      Math.abs(curr - pressureHPa) < Math.abs(prev - pressureHPa) ? curr : prev
    );

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_direction_${closestLevel}hPa&forecast_days=1`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const windDir = data.hourly?.[`wind_direction_${closestLevel}hPa`]?.[0];

    return windDir !== undefined ? windDir : null;
  } catch (error) {
    console.error(`Failed to fetch wind direction for ${lat},${lon},${altKm}:`, error);
    return null;
  }
}

export async function calculateWindMisalignment(balloons: BalloonTrack[]): Promise<WindMisalignmentData[]> {
  const eligibleBalloons = balloons.filter(b => b.samples.length >= 2);
  const sampleSize = Math.min(50, eligibleBalloons.length);

  let sampledBalloons: typeof eligibleBalloons = [];
  if (sampleSize === eligibleBalloons.length) {
    sampledBalloons = eligibleBalloons;
  } else if (sampleSize > 0) {
    const step = Math.max(1, Math.floor(eligibleBalloons.length / sampleSize));
    sampledBalloons = eligibleBalloons.filter((_, idx) => idx % step === 0).slice(0, sampleSize);
  }

  console.log(`Calculating wind misalignment for ${sampledBalloons.length} balloons...`);

  const results: WindMisalignmentData[] = [];
  const batchSize = 3;

  for (let i = 0; i < sampledBalloons.length; i += batchSize) {
    const batch = sampledBalloons.slice(i, i + batchSize);

    const batchPromises = batch.map(async (balloon) => {
      const segments: WindSegment[] = [];

      for (let j = 0; j < Math.min(balloon.samples.length - 1, 2); j++) {
        const fromSample = balloon.samples[j + 1];
        const toSample = balloon.samples[j];

        const observedDirection = calculateBearing(
          fromSample.lat,
          fromSample.lon,
          toSample.lat,
          toSample.lon
        );

        const midLat = (fromSample.lat + toSample.lat) / 2;
        const midLon = (fromSample.lon + toSample.lon) / 2;
        const midAlt = (fromSample.altKm + toSample.altKm) / 2;

        const modelledDirection = await fetchWindDirection(midLat, midLon, midAlt);
        const misalignment = modelledDirection !== null
          ? calculateAngularDifference(observedDirection, modelledDirection)
          : null;

        segments.push({
          fromSample,
          toSample,
          observedDirection,
          modelledDirection,
          misalignment,
          color: getColorForMisalignment(misalignment),
        });
      }

      const validMisalignments = segments
        .map(s => s.misalignment)
        .filter((m): m is number => m !== null);

      const avgMisalignment = validMisalignments.length > 0
        ? validMisalignments.reduce((sum, m) => sum + m, 0) / validMisalignments.length
        : 0;

      const maxMisalignment = validMisalignments.length > 0
        ? Math.max(...validMisalignments)
        : 0;

      return {
        balloonId: balloon.id,
        segments,
        avgMisalignment,
        maxMisalignment,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i + batchSize < sampledBalloons.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Wind misalignment calculation complete for ${results.length} balloons`);
  return results;
}

export function calculateWindAlignmentInsights(misalignmentData: WindMisalignmentData[]): WindAlignmentInsights {
  const validData = misalignmentData.filter(d => d.avgMisalignment > 0);

  const avgMisalignment = validData.length > 0
    ? validData.reduce((sum, d) => sum + d.avgMisalignment, 0) / validData.length
    : 0;

  const worstBalloon = validData.length > 0
    ? validData.reduce((prev, curr) =>
        curr.maxMisalignment > prev.maxMisalignment ? curr : prev
      )
    : null;

  const altitudeBands = [
    { range: '5-15 km', min: 5, max: 15, misalignments: [] as number[] },
    { range: '15-25 km', min: 15, max: 25, misalignments: [] as number[] },
    { range: '25-35 km', min: 25, max: 35, misalignments: [] as number[] },
  ];

  misalignmentData.forEach(balloon => {
    balloon.segments.forEach(segment => {
      const avgAlt = (segment.fromSample.altKm + segment.toSample.altKm) / 2;
      const band = altitudeBands.find(b => avgAlt >= b.min && avgAlt < b.max);
      if (band && segment.misalignment !== null) {
        band.misalignments.push(segment.misalignment);
      }
    });
  });

  const bandAverages = altitudeBands
    .map(band => ({
      range: band.range,
      misalignment: band.misalignments.length > 0
        ? band.misalignments.reduce((sum, m) => sum + m, 0) / band.misalignments.length
        : 0,
    }))
    .filter(band => band.misalignment > 0);

  const worstAltitudeBand = bandAverages.length > 0
    ? bandAverages.reduce((prev, curr) =>
        curr.misalignment > prev.misalignment ? curr : prev
      )
    : null;

  return {
    avgMisalignment,
    worstBalloon: worstBalloon ? { id: worstBalloon.balloonId, misalignment: worstBalloon.maxMisalignment } : null,
    worstAltitudeBand,
  };
}
