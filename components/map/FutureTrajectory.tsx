'use client';
import { useEffect, useState } from 'react';
import { Polyline, CircleMarker } from 'react-leaflet';
import { BalloonTrack as BalloonTrackType } from '@/lib/types';
import { predictHybridTrajectory, FuturePosition } from '@/lib/data/trajectory';

interface FutureTrajectoryProps {
  balloon: BalloonTrackType;
  startPosition?: { lat: number; lon: number; altKm: number; hourAgo?: number };
}

export function FutureTrajectory({ balloon, startPosition }: FutureTrajectoryProps) {
  const [futurePredictions, setFuturePredictions] = useState<FuturePosition[]>([]);

  useEffect(() => {
    let cancelled = false;

    const balloonForPrediction = startPosition
      ? {
          ...balloon,
          latest: {
            lat: startPosition.lat,
            lon: startPosition.lon,
            altKm: startPosition.altKm,
            hourAgo: 0,
            timestamp: new Date(),
          },
        }
      : balloon;

    const isCurrentPosition = startPosition ? (startPosition.hourAgo === 0 || startPosition.hourAgo === undefined) : true;

    predictHybridTrajectory(balloonForPrediction, isCurrentPosition).then(predictions => {
      if (!cancelled) {
        setFuturePredictions(predictions);
      }
    }).catch(error => {
      console.error('Failed to predict hybrid trajectory:', error);
      if (!cancelled) {
        setFuturePredictions([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [balloon, startPosition]);

  if (futurePredictions.length === 0) {
    return null;
  }

  const velocityPredictions = futurePredictions.filter(p => p.predictionType === 'velocity');
  const windPredictions = futurePredictions.filter(p => p.predictionType === 'wind');

  const currentPos = startPosition || balloon.latest;
  const velocityPathPositions: [number, number][] = [
    [currentPos.lat, currentPos.lon],
    ...velocityPredictions.map(pos => [pos.lat, pos.lon] as [number, number])
  ];

  const windPathPositions: [number, number][] = velocityPredictions.length > 0
    ? [
        [velocityPredictions[velocityPredictions.length - 1].lat, velocityPredictions[velocityPredictions.length - 1].lon],
        ...windPredictions.map(pos => [pos.lat, pos.lon] as [number, number])
      ]
    : [];

  return (
    <>
      {velocityPathPositions.length > 1 && (
        <Polyline
          positions={velocityPathPositions}
          pathOptions={{
            color: '#a855f7',
            weight: 2,
            opacity: 0.6,
            dashArray: '10, 10',
          }}
        />
      )}

      {windPathPositions.length > 1 && (
        <Polyline
          positions={windPathPositions}
          pathOptions={{
            color: '#f97316',
            weight: 2,
            opacity: 0.6,
            dashArray: '10, 10',
          }}
        />
      )}

      {velocityPredictions.map((pos, index) => (
        <CircleMarker
          key={`velocity-${index}`}
          center={[pos.lat, pos.lon]}
          radius={4}
          pathOptions={{
            fillColor: '#a855f7',
            fillOpacity: 0.6,
            color: '#c084fc',
            weight: 1,
          }}
        />
      ))}

      {windPredictions.map((pos, index) => (
        <CircleMarker
          key={`wind-${index}`}
          center={[pos.lat, pos.lon]}
          radius={4}
          pathOptions={{
            fillColor: '#f97316',
            fillOpacity: 0.6,
            color: '#fb923c',
            weight: 1,
          }}
        />
      ))}
    </>
  );
}
