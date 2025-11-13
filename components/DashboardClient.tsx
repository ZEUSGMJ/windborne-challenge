'use client';
import { useState } from 'react';
import { BalloonTrack } from '@lib/types';
import { TimeSlider } from '@/components/ui/TimeSlider';

interface DashboardClientProps {
  initialBalloons: BalloonTrack[];
}

export function DashboardClient({ initialBalloons }: DashboardClientProps) {
  const [trackHours, setTrackHours] = useState<number>(3); // Default: show last 3 hours

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 shrink-0">
        <nav className='flex flex-col items-center py-6'>
          <span className="text-2xl font-bold text-white">WindBorne Balloon Tracker</span>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Map */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 relative">
            {/* MapView */}
			<div className="w-full h-full bg-zinc-950 flex items-center justify-center">
				<p className="text-gray-500">MapView Placeholder</p>
			</div>
          </div>

          {/* Time Slider - Positioned at bottom of map */}
          <div className="absolute bottom-6 left-6 right-6 z-1000">
            <TimeSlider
              trackHours={trackHours}
              onTrackHoursChange={setTrackHours}
            />
          </div>
        </div>

        {/* Right Panel: Details */}
        <div className="w-5/12 shrink-0">
          <div className="w-full h-full bg-zinc-900 p-4">
            <p className="text-gray-400">Details Panel Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
