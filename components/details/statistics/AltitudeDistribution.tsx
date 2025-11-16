import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AltitudeBin } from './useStatistics';

interface AltitudeDistributionProps {
	altitudeBins: AltitudeBin[];
}

const CustomTooltip = ({ active, payload, label }: {
	active?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any[];
	label?: string;
}) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 shadow-lg">
				<p className="text-sm font-semibold text-white mb-1">{label}</p>
				<p className="text-xs text-gray-400">Balloons: <span className="text-white font-semibold">{payload[0].value}</span></p>
			</div>
		);
	}
	return null;
};

export function AltitudeDistribution({ altitudeBins }: AltitudeDistributionProps) {
	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<h4 className="text-base font-semibold text-gray-300 mb-3">Altitude Distribution</h4>
			<ResponsiveContainer width="100%" height={200}>
				<BarChart data={altitudeBins}>
					<defs>
						<linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="rgba(0, 166, 244, 0.7)" />
							<stop offset="50%" stopColor="rgba(0, 166, 244, 0.3)" />
							<stop offset="100%" stopColor="rgba(0, 166, 244, 0.1)" />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
					<XAxis
						dataKey="range"
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 11 }}
					/>
					<YAxis
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 11 }}
						label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 11 } }}
					/>
					<Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
					<Bar dataKey="count" fill="url(#altitudeGradient)" radius={[4, 4, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
