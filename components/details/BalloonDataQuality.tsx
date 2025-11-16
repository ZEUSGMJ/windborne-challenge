'use client';
import { useMemo } from 'react';
import { BalloonTrack } from '@/lib/types';
import { MdOutlineWarningAmber, MdOutlineErrorOutline, MdCheckCircleOutline } from "react-icons/md";

interface BalloonDataQualityProps {
	balloon: BalloonTrack;
}

interface DataQualityIssue {
	issue: string;
	severity: 'warning' | 'error';
}

export function BalloonDataQuality({ balloon }: BalloonDataQualityProps) {
	const issues = useMemo<DataQualityIssue[]>(() => {
		const problems: DataQualityIssue[] = [];

		if (balloon.samples.length < 24) {
			problems.push({
				issue: `Incomplete data: only ${balloon.samples.length}/24 hourly samples available`,
				severity: 'warning',
			});
		}

		const expectedHours = Array.from({ length: 24 }, (_, i) => i);
		const actualHours = balloon.samples.map(s => s.hourAgo).sort((a, b) => a - b);
		const missingHours = expectedHours.filter(h => !actualHours.includes(h));

		if (missingHours.length > 0 && missingHours.length < 24) {
			const hoursLabel = missingHours.length === 1 ? 'hour' : 'hours';
			problems.push({
				issue: `Missing ${missingHours.length} ${hoursLabel} of data (gaps in trajectory)`,
				severity: 'warning',
			});
		}

		const unrealisticAlt = balloon.samples.find(s => s.altKm < 5 || s.altKm > 40);
		if (unrealisticAlt) {
			problems.push({
				issue: `Unusual altitude detected: ${unrealisticAlt.altKm.toFixed(1)} km (typical range: 15-30 km)`,
				severity: 'warning',
			});
		}

		const sortedSamples = [...balloon.samples].sort((a, b) => a.hourAgo - b.hourAgo);
		for (let i = 0; i < sortedSamples.length - 1; i++) {
			const curr = sortedSamples[i];
			const next = sortedSamples[i + 1];

			const latDiff = Math.abs(curr.lat - next.lat);
			let lonDiff = Math.abs(curr.lon - next.lon);

			if (lonDiff > 180) {
				lonDiff = 360 - lonDiff;
			}

			const hourGap = next.hourAgo - curr.hourAgo;

			if ((latDiff > 30 || lonDiff > 30) && hourGap === 1) {
				problems.push({
					issue: `Unrealistic position jump detected (${latDiff.toFixed(1)}° lat, ${lonDiff.toFixed(1)}° lon in ${hourGap} hour)`,
					severity: 'error',
				});
				break;
			}

			if ((latDiff > 15 || lonDiff > 15) && hourGap === 1) {
				problems.push({
					issue: `Large position jump: moved ${latDiff.toFixed(1)}° lat, ${lonDiff.toFixed(1)}° lon in 1 hour`,
					severity: 'warning',
				});
				break;
			}
		}

		const positions = balloon.samples.map(s => `${s.lat.toFixed(4)},${s.lon.toFixed(4)}`);
		const uniquePositions = new Set(positions);
		if (uniquePositions.size === 1 && balloon.samples.length > 1) {
			problems.push({
				issue: `Stationary balloon: no movement detected across ${balloon.samples.length} samples`,
				severity: 'error',
			});
		}

		const altitudes = balloon.samples.map(s => s.altKm);
		const minAlt = Math.min(...altitudes);
		const maxAlt = Math.max(...altitudes);
		const altVariance = maxAlt - minAlt;

		if (altVariance < 0.5 && balloon.samples.length > 5) {
			problems.push({
				issue: `Very stable altitude: only ${altVariance.toFixed(2)} km variation (may indicate sensor issue)`,
				severity: 'warning',
			});
		}

		return problems;
	}, [balloon]);

	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-700">
			<h3 className="text-sm font-semibold text-gray-200 mb-3">Data Quality</h3>

			{issues.length === 0 ? (
				<div className="flex items-center gap-2 text-sm text-green-400">
					<MdCheckCircleOutline className="w-5 h-5" />
					<span>All data is complete and valid</span>
				</div>
			) : (
				<div className="space-y-2">
					{issues.map((issue, idx) => (
						<div
							key={idx}
							className={`flex items-start gap-2 p-2 rounded text-xs ${
								issue.severity === 'error'
									? 'bg-red-950/30 border border-red-900/50'
									: 'bg-yellow-950/30 border border-yellow-900/50'
							}`}
						>
							{issue.severity === 'error' ? (
								<MdOutlineErrorOutline className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
							) : (
								<MdOutlineWarningAmber className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
							)}
							<div className="flex-1 text-gray-300 leading-relaxed">
								{issue.issue}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
