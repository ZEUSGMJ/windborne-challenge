import { Statistics } from './useStatistics';
import { WindAlignmentInsights } from '@/lib/data/windMisalignment';

interface KeyInsightsProps {
	stats: Statistics;
	windInsights?: WindAlignmentInsights | null;
	isLoadingWindData?: boolean;
}

export function KeyInsights({ stats, windInsights, isLoadingWindData }: KeyInsightsProps) {
	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<h4 className="text-base font-semibold text-gray-300 mb-3">Key Insights</h4>
			<ul className="space-y-2 text-sm text-gray-400">
				<li>Maximum recorded speed: <span className="text-green-500 font-semibold">{stats.maxSpeed.toFixed(1)} km/h</span></li>
				<li>Most balloons operate in the <span className="text-blue-400 font-semibold">{stats.dominantAltitudeBin.range}</span> altitude range ({stats.dominantAltitudeBin.count} balloons)</li>
				{stats.hasJetStreamActivity && (
					<li>Jet stream activity detected - some balloons experiencing high-speed winds (&gt;80 km/h)</li>
				)}
				<li>Highest concentration in <span className="text-green-500 font-semibold">{stats.mostPopulatedRegion[0]}</span> with {stats.mostPopulatedRegion[1]} balloon{stats.mostPopulatedRegion[1] > 1 ? 's' : ''}</li>
				<li>Average altitude of <span className="text-orange-400 font-semibold">{stats.avgAltitude.toFixed(1)} km</span> with speeds averaging {stats.avgSpeed.toFixed(1)} km/h</li>

				{isLoadingWindData && (
					<li className="pt-2 border-t border-zinc-700 mt-2">
						<div className="flex items-center gap-2">
							<div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
							<div>
								<span className="text-blue-300">Calculating wind misalignment for 50 balloons...</span>
								<div className="text-xs text-blue-400/70 mt-0.5">
									Using a representative sample to avoid API rate limits while maintaining statistical accuracy
								</div>
							</div>
						</div>
					</li>
				)}

				{windInsights && windInsights.avgMisalignment > 0 && (
					<>
						<li className="pt-2 border-t border-zinc-700 mt-2">Average wind misalignment: <span className="text-yellow-500 font-semibold">{windInsights.avgMisalignment.toFixed(1)}°</span></li>
						{windInsights.worstBalloon && (
							<li>Balloon #{windInsights.worstBalloon.id} has largest misalignment: <span className="text-red-500 font-semibold">{windInsights.worstBalloon.misalignment.toFixed(1)}°</span></li>
						)}
						{windInsights.worstAltitudeBand && (
							<li>Altitude band {windInsights.worstAltitudeBand.range} shows most misalignment: <span className="text-orange-500 font-semibold">{windInsights.worstAltitudeBand.misalignment.toFixed(1)}°</span></li>
						)}
						<li className="text-xs text-gray-500 mt-2">
							Based on deterministic sample of 50 balloons to avoid API rate limits while maintaining statistical accuracy
						</li>
					</>
				)}
			</ul>
		</div>
	);
}
