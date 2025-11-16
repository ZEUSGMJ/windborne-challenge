'use client';

import { useState, useEffect } from 'react';
import { WeatherData } from '@/lib/types';
import { fetchWeatherData, windDirectionToCardinal } from '@/lib/data/openmeteo';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

interface WeatherChartProps {
	lat: number;
	lon: number;
	trackHours: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { time: string; windSpeed: number; temperature: number } }> }) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className="bg-zinc-950 border border-zinc-600 p-2 rounded shadow-lg">
				<p className="text-xs text-gray-400">{data.time}</p>
				<p className="text-sm text-blue-400">Wind: {data.windSpeed} km/h</p>
				<p className="text-sm text-orange-400">Temp: {data.temperature}°C</p>
			</div>
		);
	}
	return null;
};

export function WeatherChart({ lat, lon, trackHours }: WeatherChartProps) {
	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadWeather() {
			try {
				setIsLoading(true);
				setError(null);
				const data = await fetchWeatherData(lat, lon);
				setWeather(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load weather');
				console.error('Weather fetch error:', err);
			} finally {
				setIsLoading(false);
			}
		}

		loadWeather();
	}, [lat, lon]);

	if (isLoading) {
		return (
			<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
				<h4 className="text-sm font-semibold text-gray-300 mb-3">Weather Data</h4>
				<div className="flex items-center justify-center h-32">
					<p className="text-sm text-gray-500">Loading weather...</p>
				</div>
			</div>
		);
	}

	if (error || !weather) {
		return (
			<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
				<h4 className="text-sm font-semibold text-gray-300 mb-3">Weather Data</h4>
				<div className="flex items-center justify-center h-32">
					<p className="text-sm text-red-400">Failed to load weather</p>
				</div>
			</div>
		);
	}

	const chartData = weather.hourly
		.slice(-trackHours)
		.map((entry) => ({
			time: entry.time.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'UTC',
				hour12: false
			}),
			windSpeed: parseFloat(entry.windSpeed.toFixed(1)),
			temperature: parseFloat(entry.temperature.toFixed(1)),
		}));

	return (
		<div className="space-y-4">
			{/* Current Weather Summary */}
			<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
				<h4 className="text-sm font-semibold text-gray-300 mb-3">Current Surface Weather</h4>
				<div className="grid grid-cols-3 gap-3 text-sm">
					<div>
						<p className="text-gray-400">Temperature</p>
						<p className="text-white font-semibold">{weather.current.temperature.toFixed(1)}°C</p>
					</div>
					<div>
						<p className="text-gray-400">Wind Speed</p>
						<p className="text-white font-semibold">{weather.current.windSpeed.toFixed(1)} km/h</p>
					</div>
					<div>
						<p className="text-gray-400">Wind Dir</p>
						<p className="text-white font-semibold">
							{windDirectionToCardinal(weather.current.windDirection)} ({weather.current.windDirection.toFixed(0)}°)
						</p>
					</div>
				</div>
			</div>

			{/* Wind Speed History Chart */}
			<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
				<h4 className="text-sm font-semibold text-gray-300 mb-3">
					Wind Speed History ({trackHours}h) <span className="text-xs text-gray-500">UTC</span>
				</h4>
				<ResponsiveContainer width="100%" height={200}>
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
						<XAxis
							dataKey="time"
							stroke="#9CA3AF"
							fontSize={9}
							interval={Math.floor(chartData.length / 6)}
						/>
						<YAxis
							stroke="#9CA3AF"
							fontSize={10}
							label={{ value: 'Wind Speed (km/h)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: 10 } }}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Line
							type="monotone"
							dataKey="windSpeed"
							stroke="#60A5FA"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
