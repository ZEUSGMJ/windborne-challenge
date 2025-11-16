'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import type { BalloonTrack } from '@/lib/types';

const GlobeGL = dynamic(() => import('react-globe.gl'), { ssr: false });

interface BalloonPoint {
  id: number;
  lat: number;
  lng: number;
  alt: number;
  altKm: number;
}

interface PathPoint {
  lat: number;
  lng: number;
  alt: number;
}

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  endAlt: number;
}

interface GlobeViewProps {
  balloons: BalloonTrack[];
  selectedBalloonId: number | null;
  onBalloonSelect: (id: number | null) => void;
}

export default function GlobeView({
  balloons,
  selectedBalloonId,
  onBalloonSelect,
}: GlobeViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl = useRef<any>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [balloonColor] = useState('#00a5ef');
  const [arcColor] = useState('#e60076');
  const [pathColor] = useState('#10b981');
  const [altitudeScale, setAltitudeScale] = useState(300);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = autoRotate;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotate]);

  const balloonPoints = useMemo<BalloonPoint[]>(() => {
    return balloons.map((balloon) => ({
      id: balloon.id,
      lat: balloon.latest.lat,
      lng: balloon.latest.lon,
      alt: balloon.latest.altKm / altitudeScale,
      altKm: balloon.latest.altKm,
    }));
  }, [balloons, altitudeScale]);

  const visibleBalloons = useMemo(() => {
    if (selectedBalloonId === null) {
      return balloonPoints;
    }
    return balloonPoints.filter((b) => b.id === selectedBalloonId);
  }, [balloonPoints, selectedBalloonId]);

  const trajectoryPath = useMemo<PathPoint[][] | null>(() => {
    if (selectedBalloonId === null) return null;

    const selectedBalloon = balloons.find((b) => b.id === selectedBalloonId);
    if (!selectedBalloon || !selectedBalloon.samples) return null;

    const sortedSamples = [...selectedBalloon.samples].sort((a, b) => b.hourAgo - a.hourAgo);

    const validSamples = sortedSamples.filter(sample => {
      return (
        sample.lat >= -90 && sample.lat <= 90 &&
        sample.lon >= -180 && sample.lon <= 180 &&
        sample.altKm >= 0 && sample.altKm <= 50 &&
        !isNaN(sample.lat) && !isNaN(sample.lon) && !isNaN(sample.altKm)
      );
    });

    if (validSamples.length === 0) return null;

    const pathSegments: PathPoint[][] = [];
    let currentSegment: PathPoint[] = [];

    for (let i = 0; i < validSamples.length; i++) {
      const sample = validSamples[i];
      const point: PathPoint = {
        lat: sample.lat,
        lng: sample.lon,
        alt: sample.altKm / altitudeScale,
      };

      if (i === 0) {
        currentSegment.push(point);
        continue;
      }

      const prevSample = validSamples[i - 1];

      let lonDiff = Math.abs(sample.lon - prevSample.lon);
      const latDiff = Math.abs(sample.lat - prevSample.lat);

      if (lonDiff > 180) {
        lonDiff = 360 - lonDiff;
      }

      const isJump = lonDiff > 15 || latDiff > 10;

      const hourGap = Math.abs(sample.hourAgo - prevSample.hourAgo);
      const hasMissingData = hourGap > 1;

      if (isJump || hasMissingData) {
        if (currentSegment.length > 1) {
          pathSegments.push(currentSegment);
        }
        currentSegment = [point];
      } else {
        currentSegment.push(point);
      }
    }

    if (currentSegment.length > 1) {
      pathSegments.push(currentSegment);
    }

    return pathSegments.length > 0 ? pathSegments : null;
  }, [balloons, selectedBalloonId, altitudeScale]);

  const balloonArcs = useMemo<ArcData[]>(() => {
    if (selectedBalloonId === null) {
      return balloonPoints.map((balloon) => ({
        startLat: balloon.lat,
        startLng: balloon.lng,
        endLat: balloon.lat,
        endLng: balloon.lng,
        endAlt: balloon.alt,
      }));
    }

    if (!trajectoryPath || trajectoryPath.length === 0) return [];

    const arcs: ArcData[] = [];

    trajectoryPath.forEach(segment => {
      segment.forEach(point => {
        arcs.push({
          startLat: point.lat,
          startLng: point.lng,
          endLat: point.lat,
          endLng: point.lng,
          endAlt: point.alt * 0.833,
        });
      });
    });

    return arcs;
  }, [balloonPoints, selectedBalloonId, trajectoryPath]);

  const hourlyMarkers = useMemo<BalloonPoint[]>(() => {
    if (selectedBalloonId === null || !trajectoryPath) return [];

    const selectedBalloon = balloons.find((b) => b.id === selectedBalloonId);
    if (!selectedBalloon || !selectedBalloon.samples) return [];

    const validPositions = new Set<string>();
    trajectoryPath.forEach(segment => {
      segment.forEach(point => {
        const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
        validPositions.add(key);
      });
    });

    return selectedBalloon.samples
      .filter(sample => {
        const isValid = (
          sample.lat >= -90 && sample.lat <= 90 &&
          sample.lon >= -180 && sample.lon <= 180 &&
          sample.altKm >= 0 && sample.altKm <= 50 &&
          !isNaN(sample.lat) && !isNaN(sample.lon) && !isNaN(sample.altKm)
        );

        if (!isValid) return false;

        const posKey = `${sample.lat.toFixed(6)},${sample.lon.toFixed(6)}`;
        return validPositions.has(posKey);
      })
      .map((sample) => ({
        id: selectedBalloon.id,
        lat: sample.lat,
        lng: sample.lon,
        alt: sample.altKm / altitudeScale,
        altKm: sample.altKm,
      }));
  }, [balloons, selectedBalloonId, altitudeScale, trajectoryPath]);

  const handleBalloonClick = useCallback(
    (obj: object) => {
      const balloon = obj as BalloonPoint;
      onBalloonSelect(balloon.id);
    },
    [onBalloonSelect]
  );

  const handleGlobeClick = useCallback(() => {
    onBalloonSelect(null);
  }, [onBalloonSelect]);

  const balloonObject = useCallback(() => {
    const geometry = new THREE.SphereGeometry(0.8, 16, 16);
    const color = new THREE.Color(balloonColor);
    const emissive = new THREE.Color(balloonColor).multiplyScalar(2);

    const material = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: 5,
    });
    return new THREE.Mesh(geometry, material);
  }, [balloonColor]);

  const hourlyMarkerObject = useCallback(() => {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const color = new THREE.Color('#fbbf24');
    const emissive = new THREE.Color('#fbbf24').multiplyScalar(1.2);

    const material = new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: 2,
    });
    return new THREE.Mesh(geometry, material);
  }, []);

  const createAltitudeLabel = useCallback((d: object) => {
    const balloon = d as BalloonPoint;
    const el = document.createElement('div');
    el.className = 'altitude-label';
    el.innerHTML = `${balloon.altKm.toFixed(1)} km`;
    el.style.color = 'var(--color-yellow-500)';
    el.style.fontSize = '11px';
    el.style.fontWeight = '600';
    el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    el.style.pointerEvents = 'none';
    el.style.userSelect = 'none';
    el.style.textShadow = '0 0 4px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 1)';
    el.style.whiteSpace = 'nowrap';
    el.style.background = 'rgba(0, 0, 0, 0.8)';
    el.style.padding = '2px 6px';
    el.style.borderRadius = '4px';
    return el;
  }, []);

  const getBalloonTooltip = useCallback(
    (d: object) => {
      const balloon = d as BalloonPoint;
      return `
      <div style="
        background: rgba(17, 17, 17, 0.95);
        border: 1px solid #00a5ef;
        border-radius: 8px;
        padding: 12px 16px;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, sans-serif;
        min-width: 200px;
      ">
        <div style="
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #00a5ef;
          border-bottom: 1px solid rgba(59, 130, 246, 0.3);
          padding-bottom: 6px;
        ">
          Balloon #${balloon.id}
        </div>
        <div style="font-size: 12px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #9ca3af;">Latitude:</span>
            <span style="font-weight: 500; color: #f1f5f9;">${balloon.lat.toFixed(4)}°</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #9ca3af;">Longitude:</span>
            <span style="font-weight: 500; color: #f1f5f9;">${balloon.lng.toFixed(4)}°</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #9ca3af;">Altitude:</span>
            <span style="font-weight: 500; color: #10b981;">${balloon.altKm.toFixed(2)} km</span>
          </div>
        </div>
        <div style="
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid rgba(59, 130, 246, 0.3);
          font-size: 11px;
          color: #00a5ef;
        ">
          Click to view trajectory
        </div>
      </div>
    `;
    },
    []
  );

  const getPathColor = useCallback(() => pathColor, [pathColor]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 w-64">
        <h3 className="text-sm font-semibold text-white mb-3">Globe Controls</h3>

        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500"
          />
          <span className="text-sm text-gray-300">Auto-Rotate</span>
        </label>

        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">
            Altitude Scale: {altitudeScale}x
          </label>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={altitudeScale}
            onChange={(e) => setAltitudeScale(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>100</span>
            <span>1000</span>
          </div>
        </div>

        {selectedBalloonId !== null ? (
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <div className="text-xs text-gray-400 mb-2">Selected:</div>
            <div className="text-sm font-semibold text-yellow-500">
              Balloon #{selectedBalloonId}
            </div>
            <div className="text-xs text-gray-400 mt-2">Click globe to deselect</div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-zinc-700 text-xs text-gray-400">
            Click a balloon to view its trajectory
          </div>
        )}
      </div>

      <GlobeGL
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,1)"
        width={dimensions.width}
        height={dimensions.height}
        objectsData={visibleBalloons}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectThreeObject={balloonObject}
        objectLabel={getBalloonTooltip}
        onObjectClick={handleBalloonClick}
        arcsData={balloonArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcAltitude={(d: object) => (d as ArcData).endAlt}
        arcAltitudeAutoScale={0}
        arcStroke={0.1}
        arcColor={() => arcColor}
        arcDashLength={1}
        arcDashGap={0}
        pathsData={trajectoryPath || []}
        pathPoints={(d: object) => d as PathPoint[]}
        pathPointLat={(p: object) => (p as PathPoint).lat}
        pathPointLng={(p: object) => (p as PathPoint).lng}
        pathPointAlt={(p: object) => (p as PathPoint).alt}
        pathColor={getPathColor}
        pathStroke={3}
        pathDashLength={0.01}
        pathDashGap={0.005}
        pathDashAnimateTime={10000}
        customLayerData={hourlyMarkers}
        customThreeObject={hourlyMarkerObject}
        customThreeObjectUpdate={(obj, d: object) => {
          const balloon = d as BalloonPoint;
          Object.assign(obj.position, globeEl.current.getCoords(balloon.lat, balloon.lng, balloon.alt));
        }}
        htmlElementsData={hourlyMarkers}
        htmlElement={createAltitudeLabel}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude="alt"
        onGlobeClick={handleGlobeClick}
      />
    </div>
  );
}