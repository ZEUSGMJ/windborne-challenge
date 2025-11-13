/**
 * Load WindBorne balloon position snapshots.
 *
 * Downloads hourly files (00.json–23.json) from WindBorne's treasure endpoint.
 * Each file is an array of [latitude, longitude, altitude_km] entries for all balloons at that hour. This module validates points, fetches the files (server directly, client via an API route to avoid CORS), and assembles per-balloon tracks with timestamped samples.
 */

import { RawWbPoint, BalloonTrack, BalloonSample } from '@/lib/types';

const BASE_URL = 'https://a.windbornesystems.com/treasure';
const NUM_FILES = 24; // 00.json through 23.json

const isServer = typeof window === 'undefined';

// Validates a raw data point from the WindBorne API
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
    point[0] <= 90 &&      // Valid latitude
    point[1] >= -180 &&
    point[1] <= 180 &&     // Valid longitude
    point[2] >= 0          // Altitude should be positive
  );
}


// Fetches a single hourly file (e.g., 00.json) and returns valid points
async function fetchHourFile(hourAgo: number): Promise<RawWbPoint[] | null> {
  const fileNum = hourAgo.toString().padStart(2, '0');

  // On server, fetch directly; on client, use API route to avoid CORS
  const url = isServer
    ? `${BASE_URL}/${fileNum}.json`
    : `/api/windborne/${fileNum}`;

  try {
    console.log(`Fetching hour ${fileNum}...`);
    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // Cache for 1 hour to reduce load as data changes hourly
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

    // Validate and filter data points
    const validPoints = data.filter((point, idx) => {
      if (!isValidPoint(point)) {
        console.warn(`Invalid point at index ${idx} in ${fileNum}.json:`, point);
        return false;
      }
      return true;
    });

    console.log(`✓ Fetched ${fileNum}.json: ${validPoints.length} valid balloons`);
    return validPoints;

  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

// Fetches all 24 hourly files and returns an array of valid points for each hour
async function fetchAllHourFiles(): Promise<(RawWbPoint[] | null)[]> {
  const promises = Array.from({ length: NUM_FILES }, (_, i) => fetchHourFile(i));
  return Promise.all(promises);
}

/**
 * Reconstructs balloon tracks from hourly snapshots
 *
 * Logic:
 * - Files 00.json to 23.json represent hours 0 to 23 (0 = latest, 23 = oldest)
 * - I am assuming index i in every file corresponds to the same balloon as skimming throught the files shows small changes in position for each balloon across hours.
 * - Build array of BalloonTrack where each has 24 samples
 */
export async function loadBalloonData(): Promise<BalloonTrack[]> {
  console.log('🎈 Loading WindBorne balloon data...');

  const hourlyData = await fetchAllHourFiles();

  // Determine how many balloons we have (use first valid file)
  const firstValidFile = hourlyData.find(data => data && data.length > 0);
  if (!firstValidFile) {
    throw new Error('No valid balloon data found in any file');
  }

  const numBalloons = firstValidFile.length;
  console.log(`Found ${numBalloons} balloons across 24 hours`);

  // Build tracks
  const tracks: BalloonTrack[] = [];

  for (let balloonId = 0; balloonId < numBalloons; balloonId++) {
    const samples: BalloonSample[] = [];

    // Collect samples for this balloon from each hour
    for (let hourAgo = 0; hourAgo < NUM_FILES; hourAgo++) {
      const hourData = hourlyData[hourAgo];

      if (!hourData || !hourData[balloonId]) {
        // Missing data for this hour - skip this sample
		// Todo: could add a placeholder sample with nulls if desired
        console.warn(`Missing data for balloon ${balloonId} at hour ${hourAgo}`);
        continue;
      }

      const [lat, lon, altKm] = hourData[balloonId];

      samples.push({
        hourAgo,
        lat,
        lon,
        altKm,
        timestamp: new Date(Date.now() - hourAgo * 60 * 60 * 1000), // Approximate
      });
    }

    // Only include balloons with at least some valid data
    if (samples.length > 0) {
      samples.sort((a, b) => a.hourAgo - b.hourAgo);

      const latest = samples[0]; // Most recent sample (hourAgo = 0)

      tracks.push({
        id: balloonId,
        samples,
        latest,
      });
    }
  }

  console.log(`✓ Successfully loaded ${tracks.length} balloon tracks`);
  return tracks;
}

// Utility function to get visible samples based on trackHours
export function getVisibleSamples(
  track: BalloonTrack,
  trackHours: number
): BalloonSample[] {
  return track.samples.filter(sample => sample.hourAgo < trackHours);
}
