'use client';
import { Polyline } from 'react-leaflet';
import { BalloonTrack as BalloonTrackType } from '@/lib/types';
import { getVisibleSamples } from '@/lib/data/windborne';

interface BalloonTrackProps {
  balloon: BalloonTrackType;
  trackHours: number;
  isHovered: boolean;
}

export function BalloonTrack({ balloon, trackHours, isHovered }: BalloonTrackProps) {
  const visibleSamples = getVisibleSamples(balloon, trackHours);

  if (visibleSamples.length < 2) {
    return null;
  }

  const normalizedSamples = [];
  for (let i = 0; i < visibleSamples.length; i++) {
    const sample = visibleSamples[i];

    if (i === 0) {
      normalizedSamples.push({ ...sample });
      continue;
    }

    const prevLon = normalizedSamples[i - 1].lon;
    let lon = sample.lon;

    const diff = lon - prevLon;
    if (diff > 180) {
      lon -= 360;
    } else if (diff < -180) {
      lon += 360;
    }

    normalizedSamples.push({ ...sample, lon });
  }

  const trackSegments: [number, number][][] = [];
  let currentSegment: [number, number][] = [];

  for (let i = 0; i < normalizedSamples.length; i++) {
    const sample = normalizedSamples[i];
    const position: [number, number] = [sample.lat, sample.lon];

    if (i > 0) {
      const prevSample = normalizedSamples[i - 1];
      const prevLat = prevSample.lat;
      const prevLon = prevSample.lon;
      const currLat = sample.lat;
      const currLon = sample.lon;
      const lonDiff = Math.abs(currLon - prevLon);
      const latDiff = Math.abs(currLat - prevLat);

      if (lonDiff > 20 || latDiff > 15) {
        if (currentSegment.length > 0) {
          trackSegments.push(currentSegment);
        }
        currentSegment = [position];
      } else {
        currentSegment.push(position);
      }
    } else {
      currentSegment.push(position);
    }
  }

  if (currentSegment.length > 0) {
    trackSegments.push(currentSegment);
  }

  const pathOptions = {
    color: isHovered ? '#fbbf24' : '#00a5ef',
    weight: isHovered ? 4 : 2,
    opacity: isHovered ? 1 : 0.7,
  };

  return (
    <>
      {trackSegments.map((segment, index) => (
        segment.length >= 2 && (
          <Polyline
            key={`segment-${balloon.id}-${index}`}
            positions={segment}
            pathOptions={pathOptions}
          />
        )
      ))}
    </>
  );
}
