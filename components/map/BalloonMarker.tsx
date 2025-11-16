'use client';

import { Marker, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { BalloonTrack } from '@/lib/types';

interface BalloonMarkerProps {
  balloon: BalloonTrack;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

export function BalloonMarker({ balloon, isSelected, onSelect, onHover, onHoverEnd }: BalloonMarkerProps) {
  const { latest, id } = balloon;

  const markerIcon = new DivIcon({
    html: `
      <div class="relative">
        <div class="${isSelected ? 'w-4 h-4' : 'w-3 h-3'} bg-white rounded-full border-2 ${isSelected ? 'border-yellow-400 shadow-yellow-400/50' : 'border-pink-800'} shadow-lg"></div>
        <div class="absolute ${isSelected ? '-top-1.5 -left-1.5 w-7 h-7' : '-top-1 -left-1 w-5 h-5'} ${isSelected ? 'bg-yellow-400/30' : 'bg-pink-800/20'} rounded-full animate-ping"></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: isSelected ? [16, 16] : [12, 12],
    iconAnchor: isSelected ? [8, 8] : [6, 6],
  });

  return (
    <Marker
      position={[latest.lat, latest.lon]}
      icon={markerIcon}
      eventHandlers={{
        click: onSelect,
        mouseover: onHover,
        mouseout: onHoverEnd,
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
        <div className="text-xs">
          <strong>Balloon {id}</strong>
          <br />
          Alt: {latest.altKm.toFixed(2)} km
        </div>
      </Tooltip>
    </Marker>
  );
}
