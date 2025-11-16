import { RawWbPoint, BalloonTrack, BalloonSample } from '@/lib/types';

const BASE_URL = 'https://a.windbornesystems.com/treasure';
const NUM_FILES = 24;

const isServer = typeof window === 'undefined';

function isValidPoint(point: unknown): point is RawWbPoint {
  return (
    Array.isArray(point) &&
    point.length === 3 &&
    typeof point[0] === 'number' &&
    typeof point[1] === 'number' &&
    typeof point[2] === 'number' &&
    !isNaN(point[0]) &&
    !isNaN(point[1]) &&
    !isNaN(point[2]) &&
    point[0] >= -90 &&
    point[0] <= 90 &&
    point[1] >= -180 &&
    point[1] <= 180 &&
    point[2] >= 0
  );
}

async function fetchHourFile(hourAgo: number): Promise<RawWbPoint[] | null> {
  const fileNum = hourAgo.toString().padStart(2, '0');

  const url = isServer
    ? `${BASE_URL}/${fileNum}.json`
    : `/api/windborne/${fileNum}`;

  try {
    console.log(`Fetching hour ${fileNum}...`);
    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn(`Invalid data format from ${url}`);
      return null;
    }

    const validPoints = data.filter((point, idx) => {
      if (!isValidPoint(point)) {
        console.warn(`Invalid point at index ${idx} in ${fileNum}.json:`, point);
        return false;
      }
      return true;
    });

    console.log(`Fetched ${fileNum}.json: ${validPoints.length} valid balloons`);
    return validPoints;

  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

async function fetchAllHourFiles(): Promise<(RawWbPoint[] | null)[]> {
  const promises = Array.from({ length: NUM_FILES }, (_, i) => fetchHourFile(i));
  return Promise.all(promises);
}

export async function loadBalloonData(): Promise<BalloonTrack[]> {
  console.log('Loading WindBorne balloon data...');

  const hourlyData = await fetchAllHourFiles();

  const firstValidFile = hourlyData.find(data => data && data.length > 0);
  if (!firstValidFile) {
    throw new Error('No valid balloon data found in any file');
  }

  const numBalloons = firstValidFile.length;
  console.log(`Found ${numBalloons} balloons across 24 hours`);

  const tracks: BalloonTrack[] = [];

  for (let balloonId = 0; balloonId < numBalloons; balloonId++) {
    const samples: BalloonSample[] = [];

    for (let hourAgo = 0; hourAgo < NUM_FILES; hourAgo++) {
      const hourData = hourlyData[hourAgo];

      if (!hourData || !hourData[balloonId]) {
        console.warn(`Missing data for balloon ${balloonId} at hour ${hourAgo}`);
        continue;
      }

      const [lat, lon, altKm] = hourData[balloonId];

      samples.push({
        hourAgo,
        lat,
        lon,
        altKm,
        timestamp: new Date(Date.now() - hourAgo * 60 * 60 * 1000),
      });
    }

    if (samples.length > 0) {
      samples.sort((a, b) => a.hourAgo - b.hourAgo);

      const latest = samples[0];

      tracks.push({
        id: balloonId,
        samples,
        latest,
      });
    }
  }

  console.log(`Successfully loaded ${tracks.length} balloon tracks`);
  return tracks;
}

export function getVisibleSamples(
  track: BalloonTrack,
  trackHours: number
): BalloonSample[] {
  return track.samples.filter(sample => sample.hourAgo < trackHours);
}
