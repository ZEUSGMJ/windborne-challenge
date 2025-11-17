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
  position?: { lat: number; lon: number; altKm: number };
}

export function BalloonMarker({
  balloon,
  isSelected,
  onSelect,
  onHover,
  onHoverEnd,
  position,
}: BalloonMarkerProps) {
  const { latest, id } = balloon;
  const currentPosition = position || latest;

  const markerIcon = new DivIcon({
    html: `
      <div class="relative">
        <div class="${
          isSelected ? 'w-4 h-4' : 'w-3 h-3'
        } bg-white rounded-full border-2 ${
          isSelected ? 'border-yellow-400 shadow-yellow-400/50' : 'border-pink-800'
        } shadow-lg"></div>
        <div class="absolute ${
          isSelected ? '-top-1.5 -left-1.5 w-7 h-7' : '-top-1 -left-1 w-5 h-5'
        } ${isSelected ? 'bg-yellow-400/30' : 'bg-pink-800/20'} rounded-full animate-ping"></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: isSelected ? [16, 16] : [12, 12],
    iconAnchor: isSelected ? [8, 8] : [6, 6],
  });

  return (
    <Marker
      position={[currentPosition.lat, currentPosition.lon]}
      icon={markerIcon}
      eventHandlers={{
        click: onSelect,
        mouseover: onHover,
        mouseout: onHoverEnd,
      }}
    >
      <Tooltip
        direction="top"
        offset={[0, -10]}
        opacity={1}
        interactive
        className="balloon-tooltip"
      >
        <div
          style={{
            padding: '8px 6px',
            color: '#e2e8f0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minWidth: 200,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
              color: '#00a5ef',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
              paddingBottom: 6,
            }}
          >
            Balloon #{id}
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ color: '#9ca3af' }}>Latitude:</span>
              <span style={{ fontWeight: 500, color: '#f1f5f9' }}>
                {currentPosition.lat.toFixed(4)}°
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ color: '#9ca3af' }}>Longitude:</span>
              <span style={{ fontWeight: 500, color: '#f1f5f9' }}>
                {currentPosition.lon.toFixed(4)}°
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Altitude:</span>
              <span style={{ fontWeight: 500, color: '#10b981' }}>
                {currentPosition.altKm.toFixed(2)} km
              </span>
            </div>
          </div>

          {isSelected ? (
            <div
              style={{
                marginTop: 8,
                paddingTop: 6,
                borderTop: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: 10,
              }}
            >
              <div style={{ fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>
                Trajectory Legend:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 16, height: 2, background: '#00a5ef' }}></div>
                <span style={{ color: '#9ca3af' }}>Past Path</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 16, height: 2, background: '#a855f7' }}></div>
                <span style={{ color: '#9ca3af' }}>Velocity (3h)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 2, background: '#f97316' }}></div>
                <span style={{ color: '#9ca3af' }}>Wind (6h)</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 8,
                paddingTop: 6,
                borderTop: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: 11,
                color: '#00a5ef',
              }}
            >
              Click to view trajectory
            </div>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
}
