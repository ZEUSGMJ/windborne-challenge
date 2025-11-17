'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import dynamic from 'next/dynamic';
import { BalloonTrack as BalloonTrackType, BalloonSample } from '@/lib/types';
import { BalloonMarker } from './BalloonMarker';
import { BalloonTrack } from './BalloonTrack';
import { FutureTrajectory } from './FutureTrajectory';
import { WindMisalignmentData } from '@/lib/data/windMisalignment';
import 'leaflet/dist/leaflet.css';

const MarkerClusterGroup = dynamic(() => import('./MarkerClusterGroup'), {
  ssr: false,
});

interface MapViewProps {
  balloons: BalloonTrackType[];
  trackHours: number;
  selectedBalloonId: number | null;
  hoveredBalloonId: number | null;
  onSelectBalloon: (id: number) => void;
  onHoverBalloon: (id: number | null) => void;
  windMisalignmentData?: WindMisalignmentData[];
}

export function MapView({ balloons, trackHours, selectedBalloonId, hoveredBalloonId, onSelectBalloon, onHoverBalloon, windMisalignmentData }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const getBalloonPositionAtTime = useMemo(() => {
    return (balloon: BalloonTrackType): BalloonSample => {
      const sample = balloon.samples.find(s => s.hourAgo === trackHours);
      return sample || balloon.latest;
    };
  }, [trackHours]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <p className="text-gray-500">Initializing map...</p>
      </div>
    );
  }

  const visibleBalloons = selectedBalloonId !== null
    ? balloons.filter(b => b.id === selectedBalloonId)
    : balloons;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
        worldCopyJump={true}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={0.5}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
          noWrap={false}
        />

        {selectedBalloonId !== null && visibleBalloons.map((balloon) => {
          const balloonWindData = windMisalignmentData?.find(w => w.balloonId === balloon.id);
          const currentPosition = getBalloonPositionAtTime(balloon);
          return (
            <React.Fragment key={balloon.id}>
              <BalloonTrack
                balloon={balloon}
                isHovered={hoveredBalloonId === balloon.id}
                windSegments={balloonWindData?.segments}
              />
              <FutureTrajectory
                balloon={balloon}
                startPosition={currentPosition}
              />
            </React.Fragment>
          );
        })}

        {selectedBalloonId === null ? (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {visibleBalloons.map((balloon) => (
              <BalloonMarker
                key={`marker-${balloon.id}`}
                balloon={balloon}
                isSelected={false}
                onSelect={() => onSelectBalloon(balloon.id)}
                onHover={() => onHoverBalloon(balloon.id)}
                onHoverEnd={() => onHoverBalloon(null)}
              />
            ))}
          </MarkerClusterGroup>
        ) : (
          visibleBalloons.map((balloon) => {
            const currentPosition = getBalloonPositionAtTime(balloon);
            return (
              <BalloonMarker
                key={`marker-${balloon.id}`}
                balloon={balloon}
                isSelected={selectedBalloonId === balloon.id}
                onSelect={() => onSelectBalloon(balloon.id)}
                onHover={() => onHoverBalloon(balloon.id)}
                onHoverEnd={() => onHoverBalloon(null)}
                position={currentPosition}
              />
            );
          })
        )}
      </MapContainer>
    </div>
  );
}
