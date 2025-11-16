import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CorrelationPoint } from './useStatistics';

interface AltitudeSpeedCorrelationProps {
	correlationData: CorrelationPoint[];
}

const ScatterTooltip = ({ active, payload }: {
	active?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload?: any[];
}) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className="bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 shadow-lg">
				<p className="text-sm font-semibold text-white mb-1">{data.balloonName}</p>
				<p className="text-xs text-gray-400">Altitude: <span className="text-white font-semibold">{data.altitude} km</span></p>
				<p className="text-xs text-gray-400">Speed: <span className="text-white font-semibold">{data.speed} km/h</span></p>
			</div>
		);
	}
	return null;
};

export function AltitudeSpeedCorrelation({ correlationData }: AltitudeSpeedCorrelationProps) {
	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<h4 className="text-base font-semibold text-gray-300 mb-3">Altitude vs Speed Correlation</h4>
			<ResponsiveContainer width="100%" height={250}>
				<ScatterChart>
					<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
					<XAxis
						type="number"
						dataKey="altitude"
						name="Altitude"
						unit=" km"
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 11 }}
						label={{ value: 'Altitude (km)', position: 'insideBottom', offset: -5, style: { fill: '#9CA3AF', fontSize: 11 } }}
					/>
					<YAxis
						type="number"
						dataKey="speed"
						name="Speed"
						unit=" km/h"
						stroke="#9CA3AF"
						tick={{ fill: '#9CA3AF', fontSize: 11 }}
						label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 11 } }}
					/>
					<Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#e60076', strokeWidth: 1 }} />
					<Scatter data={correlationData} fill="#e60076" fillOpacity={0.8} />
				</ScatterChart>
			</ResponsiveContainer>
			<p className="text-sm text-gray-400 mt-2">
				This chart shows the relationship between balloon altitude and movement speed.
				Higher speeds often correlate with jet stream altitudes (~10–15 km).
			</p>

			<p className="text-xs text-gray-500 mt-1">
				Uses a deterministic sample of up to 100 balloons (evenly spaced from the dataset).
			</p>
		</div>
	);
}
