import { Statistics } from './useStatistics';

interface KeyInsightsProps {
	stats: Statistics;
}

export function KeyInsights({ stats }: KeyInsightsProps) {
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
			</ul>
		</div>
	);
}
