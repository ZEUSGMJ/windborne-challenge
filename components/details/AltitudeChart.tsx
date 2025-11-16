'use client';
import { BalloonTrack } from '@/lib/types';
import { getVisibleSamples } from '@/lib/data/windborne';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

interface AltitudeChartProps {
	balloon: BalloonTrack;
	trackHours: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { hour: string; altitude: number } }> }) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className="bg-zinc-950 border border-zinc-600 p-2 rounded shadow-lg">
				<p className="text-xs text-gray-400">{data.hour}</p>
				<p className="text-sm text-sky-500 font-semibold">
					{data.altitude} km
				</p>
			</div>
		);
	}
	return null;
};

export function AltitudeChart({ balloon, trackHours }: AltitudeChartProps) {
	const visibleSamples = getVisibleSamples(balloon, trackHours);
	const chartData = [...visibleSamples]
		.reverse()
		.map((sample) => ({
			hour: `${sample.hourAgo}h ago`,
			altitude: parseFloat(sample.altKm.toFixed(2)),
			hourAgo: sample.hourAgo,
		}));

	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<h4 className="text-sm font-semibold text-gray-300 mb-3">
				Altitude History ({trackHours} hours)
			</h4>

			<ResponsiveContainer width="100%" height={200}>
				<LineChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
					<XAxis
						dataKey="hourAgo"
						stroke="#9CA3AF"
						fontSize={10}
						tickFormatter={(value) => `${value}h`}
					/>
					<YAxis
						stroke="#9CA3AF"
						fontSize={10}
						label={{ value: 'Altitude (km)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 10 } }}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Line
						type="monotone"
						dataKey="altitude"
						stroke="#EAB308"
						strokeWidth={2}
						dot={{ fill: '#EAB308', r: 3 }}
						activeDot={{ r: 5 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
