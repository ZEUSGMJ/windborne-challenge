'use client';

import { BalloonTrack, BalloonSample } from '@/lib/types';
import { WindMisalignmentData } from '@/lib/data/windMisalignment';
import { predictFutureTrajectory } from '@/lib/data/trajectory';

interface BalloonMetadataProps {
	balloon: BalloonTrack;
	currentPosition: BalloonSample;
	windMisalignmentData?: WindMisalignmentData;
}

export function BalloonMetadata({ balloon, currentPosition, windMisalignmentData }: BalloonMetadataProps) {
	const { id, samples } = balloon;
	const latest = currentPosition;

	const balloonAtCurrentTime = {
		...balloon,
		latest: currentPosition,
	};

	const futurePositions = predictFutureTrajectory(balloonAtCurrentTime, 3);
	const hasFutureTrajectory = futurePositions.length > 0;

	const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const y = Math.sin(Δλ) * Math.cos(φ2);
		const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
		const θ = Math.atan2(y, x);
		const bearing = ((θ * 180) / Math.PI + 360) % 360;

		return bearing;
	};

	const getCompassDirection = (bearing: number): { abbr: string; full: string } => {
		const directions = [
			{ abbr: 'N', full: 'North' },
			{ abbr: 'NNE', full: 'North-Northeast' },
			{ abbr: 'NE', full: 'Northeast' },
			{ abbr: 'ENE', full: 'East-Northeast' },
			{ abbr: 'E', full: 'East' },
			{ abbr: 'ESE', full: 'East-Southeast' },
			{ abbr: 'SE', full: 'Southeast' },
			{ abbr: 'SSE', full: 'South-Southeast' },
			{ abbr: 'S', full: 'South' },
			{ abbr: 'SSW', full: 'South-Southwest' },
			{ abbr: 'SW', full: 'Southwest' },
			{ abbr: 'WSW', full: 'West-Southwest' },
			{ abbr: 'W', full: 'West' },
			{ abbr: 'WNW', full: 'West-Northwest' },
			{ abbr: 'NW', full: 'Northwest' },
			{ abbr: 'NNW', full: 'North-Northwest' }
		];
		const index = Math.round(bearing / 22.5) % 16;
		return directions[index];
	};

	let predictedBearing: number | null = null;
	let compassDirection: { abbr: string; full: string } | null = null;

	if (hasFutureTrajectory && futurePositions.length > 0) {
		predictedBearing = calculateBearing(latest.lat, latest.lon, futurePositions[0].lat, futurePositions[0].lon);
		compassDirection = getCompassDirection(predictedBearing);
	}

	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<h3 className="text-lg font-semibold text-sky-500 mb-3">
				Balloon {id}
			</h3>

			<div className="grid grid-cols-2 gap-3 text-sm mb-4">
				<div>
					<p className="text-gray-400">Latitude</p>
					<p className="text-white font-mono">{latest.lat.toFixed(4)}°</p>
				</div>

				<div>
					<p className="text-gray-400">Longitude</p>
					<p className="text-white font-mono">{latest.lon.toFixed(4)}°</p>
				</div>

				<div>
					<p className="text-gray-400">Altitude</p>
					<p className="text-white font-mono">{latest.altKm.toFixed(2)} km</p>
				</div>

				<div>
					<p className="text-gray-400">Data Points</p>
					<p className="text-white font-mono">{samples.length} / 24</p>
				</div>
			</div>

			<div className="border-t border-zinc-700 pt-3 mb-3">
				<p className="text-xs font-semibold text-gray-400 mb-2">Trajectory Legend:</p>
				<div className="flex gap-3 text-xs">
					<div className="flex items-center gap-2">
						<div className="w-4 h-0.5 bg-sky-500"></div>
						<span className="text-gray-400">Past</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-0.5 bg-purple-500"></div>
						<span className="text-gray-400">Velocity (3h)</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-4 h-0.5 bg-orange-500"></div>
						<span className="text-gray-400">Wind (6h)</span>
					</div>
				</div>
			</div>

			{(hasFutureTrajectory || windMisalignmentData) && (
				<div className="border-t border-zinc-700 pt-3">
					<p className="text-xs font-semibold text-gray-400 mb-2">Movement Insights:</p>
					<ul className="space-y-1.5 text-xs text-gray-300">
						{hasFutureTrajectory && compassDirection && (
							<li>
								Predicted heading: <span className="text-purple-400 font-semibold">{compassDirection.abbr}</span> ({compassDirection.full}, {predictedBearing?.toFixed(1)}°)
							</li>
						)}

						{hasFutureTrajectory && (
							<>
								<li className="text-gray-400 italic mt-2">
									<span className="text-purple-400">Velocity prediction (0-3h):</span> Based on recent balloon movement patterns
								</li>
								<li className="text-gray-400 italic">
									<span className="text-orange-400">Wind forecast (3-9h):</span> Uses atmospheric wind data at current altitude (less accurate, for reference only)
								</li>
							</>
						)}

						{windMisalignmentData && windMisalignmentData.avgMisalignment > 0 && (
							<li className="mt-2">
								Avg wind misalignment: <span className={`font-semibold ${
									windMisalignmentData.avgMisalignment <= 30 ? 'text-green-500' :
									windMisalignmentData.avgMisalignment <= 60 ? 'text-yellow-500' : 'text-red-500'
								}`}>{windMisalignmentData.avgMisalignment.toFixed(1)}°</span>
							</li>
						)}
						{windMisalignmentData && windMisalignmentData.maxMisalignment > 0 && (
							<li>
								Max wind misalignment: <span className={`font-semibold ${
									windMisalignmentData.maxMisalignment <= 30 ? 'text-green-500' :
									windMisalignmentData.maxMisalignment <= 60 ? 'text-yellow-500' : 'text-red-500'
								}`}>{windMisalignmentData.maxMisalignment.toFixed(1)}°</span>
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
