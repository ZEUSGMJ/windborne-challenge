'use client';

import { BalloonTrack } from '@/lib/types';

interface BalloonMetadataProps {
	balloon: BalloonTrack;
}

export function BalloonMetadata({ balloon }: BalloonMetadataProps) {
	const { id, latest, samples } = balloon;

	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<h3 className="text-lg font-semibold text-sky-500 mb-3">
				Balloon {id}
			</h3>

			<div className="grid grid-cols-2 gap-3 text-sm">
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
		</div>
	);
}
