'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BalloonTrack } from '@/lib/types';
import { DetailsPanel } from '@/components/details/DetailsPanel';
import { Navbar } from '@/components/Navbar';
import { calculateWindMisalignment, WindMisalignmentData, calculateWindAlignmentInsights, WindAlignmentInsights } from '@/lib/data/windMisalignment';

const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }
);

const GlobeView = dynamic(
  () => import('@/components/globe/GlobeView'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading globe...</p>
      </div>
    )
  }
);

interface DashboardClientProps {
  initialBalloons: BalloonTrack[];
}

export function DashboardClient({ initialBalloons }: DashboardClientProps) {
  const [selectedBalloonId, setSelectedBalloonId] = useState<number | null>(null);
  const [hoveredBalloonId, setHoveredBalloonId] = useState<number | null>(null);
  const [trackHours, setTrackHours] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [windMisalignmentData, setWindMisalignmentData] = useState<WindMisalignmentData[]>([]);
  const [windInsights, setWindInsights] = useState<WindAlignmentInsights | null>(null);
  const [isLoadingWindData, setIsLoadingWindData] = useState(true);

  const selectedBalloon = initialBalloons.find(b => b.id === selectedBalloonId) || null;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedBalloonId !== null) {
        setSelectedBalloonId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedBalloonId]);

  useEffect(() => {
    if (windMisalignmentData.length === 0 && isLoadingWindData) {
      let cancelled = false;

      calculateWindMisalignment(initialBalloons)
        .then((data) => {
          if (!cancelled) {
            setWindMisalignmentData(data);
            const insights = calculateWindAlignmentInsights(data);
            setWindInsights(insights);
            setIsLoadingWindData(false);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error('Failed to calculate wind misalignment:', error);
            setIsLoadingWindData(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }
  }, [initialBalloons, windMisalignmentData.length, isLoadingWindData]);

  return (
    <>
      <Navbar
        showViewToggle={true}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          {viewMode === '2d' ? (
            <MapView
              balloons={initialBalloons}
              trackHours={trackHours}
              selectedBalloonId={selectedBalloonId}
              hoveredBalloonId={hoveredBalloonId}
              onSelectBalloon={setSelectedBalloonId}
              onHoverBalloon={setHoveredBalloonId}
              windMisalignmentData={windMisalignmentData}
            />
          ) : (
            <GlobeView
              balloons={initialBalloons}
              selectedBalloonId={selectedBalloonId}
              onBalloonSelect={setSelectedBalloonId}
            />
          )}
        </div>

        <div className="w-5/12 shrink-0">
          <DetailsPanel
            selectedBalloon={selectedBalloon}
            balloons={initialBalloons}
            trackHours={trackHours}
            onTrackHoursChange={setTrackHours}
            onClose={() => setSelectedBalloonId(null)}
            viewMode={viewMode}
            windInsights={windInsights}
            isLoadingWindData={isLoadingWindData}
            windMisalignmentData={windMisalignmentData}
          />
        </div>
      </main>
    </>
  );
}
