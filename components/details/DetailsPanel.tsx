'use client';
import { BalloonTrack } from '@/lib/types';
import { BalloonMetadata } from './BalloonMetadata';
import { AltitudeChart } from './AltitudeChart';
import { WeatherChart } from './WeatherChart';
import { BalloonDataQuality } from './BalloonDataQuality';
import { StatisticsView } from './statistics';
import { TimeSlider } from '@/components/ui/TimeSlider';
import { WindAlignmentInsights, WindMisalignmentData } from '@/lib/data/windMisalignment';
import { MdClose } from "react-icons/md";

interface DetailsPanelProps {
	selectedBalloon: BalloonTrack | null;
	balloons: BalloonTrack[];
	trackHours: number;
	onTrackHoursChange: (hours: number) => void;
	onClose: () => void;
	viewMode: '2d' | '3d';
	windInsights?: WindAlignmentInsights | null;
	isLoadingWindData?: boolean;
	windMisalignmentData?: WindMisalignmentData[];
}

export function DetailsPanel({ selectedBalloon, balloons, trackHours, onTrackHoursChange, onClose, viewMode, windInsights, isLoadingWindData, windMisalignmentData }: DetailsPanelProps) {
	const effectiveTrackHours = viewMode === '3d' ? 24 : trackHours;

	const getCurrentPosition = (balloon: BalloonTrack) => {
		if (viewMode === '3d') {
			return balloon.latest;
		}
		const sample = balloon.samples.find(s => s.hourAgo === trackHours);
		return sample || balloon.latest;
	};

	if (!selectedBalloon) {
		return (
			<div className="w-full h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
				<div className="p-6 border-b border-zinc-800">
					<h2 className="text-xl font-bold text-white">Global Statistics</h2>
					<p className="text-sm text-gray-400 mt-1">Overview of all {balloons.length} balloons</p>
				</div>

				<div className="flex-1 overflow-y-auto">
					<div className="p-6">
						<StatisticsView balloons={balloons} windInsights={windInsights} isLoadingWindData={isLoadingWindData} />
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
						className="text-gray-400 hover:text-white hover:cursor-pointer transition-colors"
						title='Close details'
						aria-label="Close details"
					>
						<MdClose size={24} />
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="p-6 space-y-6">
					<BalloonMetadata
						balloon={selectedBalloon}
						currentPosition={getCurrentPosition(selectedBalloon)}
						windMisalignmentData={windMisalignmentData?.find(w => w.balloonId === selectedBalloon.id)}
					/>

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
