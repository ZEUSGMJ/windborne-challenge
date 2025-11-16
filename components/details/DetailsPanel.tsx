'use client';
import { BalloonTrack } from '@/lib/types';
import { BalloonMetadata } from './BalloonMetadata';
import { AltitudeChart } from './AltitudeChart';
import { WeatherChart } from './WeatherChart';
import { BalloonDataQuality } from './BalloonDataQuality';
import { StatisticsView } from './statistics';
import { TimeSlider } from '@/components/ui/TimeSlider';

interface DetailsPanelProps {
	selectedBalloon: BalloonTrack | null;
	balloons: BalloonTrack[];
	trackHours: number;
	onTrackHoursChange: (hours: number) => void;
	onClose: () => void;
	viewMode: '2d' | '3d';
}

export function DetailsPanel({ selectedBalloon, balloons, trackHours, onTrackHoursChange, onClose, viewMode }: DetailsPanelProps) {
	const effectiveTrackHours = viewMode === '3d' ? 24 : trackHours;

	if (!selectedBalloon) {
		return (
			<div className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
				<div className="p-6 border-b border-zinc-800">
					<h2 className="text-xl font-bold text-white">Global Statistics</h2>
					<p className="text-sm text-gray-400 mt-1">Overview of all {balloons.length} balloons</p>
				</div>

				<div className="flex-1 overflow-y-auto">
					<div className="p-6">
						<StatisticsView balloons={balloons} />
					</div>
				</div>

				{viewMode === '2d' && (
					<div className="p-6 border-t border-zinc-800">
						<TimeSlider
							trackHours={trackHours}
							onTrackHoursChange={onTrackHoursChange}
						/>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
			<div className="border-b border-zinc-800">
				<div className="flex items-center justify-between p-6">
					<h2 className="text-xl font-bold text-white">Balloon #{selectedBalloon.id}</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
						aria-label="Close details"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="p-6 space-y-6">
					<BalloonMetadata balloon={selectedBalloon} />

					<BalloonDataQuality balloon={selectedBalloon} />

					<AltitudeChart balloon={selectedBalloon} trackHours={effectiveTrackHours} />

					<WeatherChart
						lat={selectedBalloon.latest.lat}
						lon={selectedBalloon.latest.lon}
						trackHours={effectiveTrackHours}
					/>
				</div>
			</div>

			{viewMode === '2d' && (
				<div className="p-6 border-t border-zinc-800 bg-zinc-900">
					<TimeSlider
						trackHours={trackHours}
						onTrackHoursChange={onTrackHoursChange}
					/>
				</div>
			)}
		</div>
	);
}
