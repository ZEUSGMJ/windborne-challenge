'use client';
import { Polyline } from 'react-leaflet';
import { BalloonTrack as BalloonTrackType } from '@/lib/types';
import { WindSegment } from '@/lib/data/windMisalignment';

interface BalloonTrackProps {
  balloon: BalloonTrackType;
  isHovered: boolean;
  windSegments?: WindSegment[];
}

export function BalloonTrack({ balloon, isHovered, windSegments }: BalloonTrackProps) {
  const visibleSamples = balloon.samples;

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

  const getSegmentColor = (segmentIndex: number): string => {
    if (isHovered) return '#fbbf24';
    if (!windSegments || windSegments.length === 0) return '#00a5ef';

    if (segmentIndex < windSegments.length && windSegments[segmentIndex].color) {
      return windSegments[segmentIndex].color;
    }

    return '#00a5ef';
  };

  return (
    <>
      {trackSegments.map((segment, index) => {
        const pathOptions = {
          color: getSegmentColor(index),
          weight: isHovered ? 4 : 2,
          opacity: isHovered ? 1 : 0.7,
        };

        return (
          segment.length >= 2 && (
            <Polyline
              key={`segment-${balloon.id}-${index}`}
              positions={segment}
              pathOptions={pathOptions}
            />
          )
        );
      })}
    </>
  );
}
