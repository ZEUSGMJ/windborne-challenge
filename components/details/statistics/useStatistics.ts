import { useMemo } from 'react';
import { BalloonTrack } from '@/lib/types';

export interface AltitudeBin {
	range: string;
	count: number;
	min: number;
	max: number;
}

export interface RegionData {
	region: string;
	count: number;
}

export interface CorrelationPoint {
	altitude: number;
	speed: number;
	balloonName: string;
	id: number;
}

export interface DataQualityIssue {
	balloonId: number;
	issue: string;
	severity: 'warning' | 'error';
}

export interface Statistics {
	avgAltitude: number;
	avgSpeed: number;
	maxSpeed: number;
	altitudeBins: AltitudeBin[];
	regionData: RegionData[];
	correlationData: CorrelationPoint[];
	dominantAltitudeBin: AltitudeBin;
	mostPopulatedRegion: [string, number];
	hasJetStreamActivity: boolean;
	dataQualityIssues: DataQualityIssue[];
}

export function useStatistics(balloons: BalloonTrack[]): Statistics | null {
	return useMemo(() => {
		if (balloons.length === 0) return null;

		const avgAltitude = balloons.reduce((sum, b) => sum + b.latest.altKm, 0) / balloons.length;

		const altitudeBins: AltitudeBin[] = [
			{ range: '5-15 km', count: 0, min: 5, max: 15 },
			{ range: '15-25 km', count: 0, min: 15, max: 25 },
			{ range: '25-35 km', count: 0, min: 25, max: 35 },
		];

		balloons.forEach(balloon => {
			const alt = balloon.latest.altKm;
			const bin = altitudeBins.find(b => alt >= b.min && alt < b.max);
			if (bin) bin.count++;
		});

		const speeds: number[] = [];
		balloons.forEach(balloon => {
			if (balloon.samples.length >= 2) {
				const latest = balloon.samples[0];
				const previous = balloon.samples[1];

				const timeDiffHours = previous.hourAgo - latest.hourAgo;

				if (timeDiffHours <= 0) return;

				const lat1 = previous.lat * Math.PI / 180;
				const lat2 = latest.lat * Math.PI / 180;
				const dLat = (latest.lat - previous.lat) * Math.PI / 180;
				const dLon = (latest.lon - previous.lon) * Math.PI / 180;

				const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
					Math.cos(lat1) * Math.cos(lat2) *
					Math.sin(dLon / 2) * Math.sin(dLon / 2);
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				const distance = 6371 * c;

				const speed = distance / timeDiffHours;
				speeds.push(speed);
			}
		});

		const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
		const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

		const regions: Record<string, number> = {
			'North America': 0,
			'South America': 0,
			'Europe': 0,
			'Africa': 0,
			'Asia': 0,
			'Oceania': 0,
			'Antarctica': 0,
		};

		balloons.forEach(balloon => {
			const { lat, lon } = balloon.latest;

			if (lat < -60) {
				regions['Antarctica']++;
			} else if (lon >= -170 && lon <= -30) {
				if (lat >= 15) {
					regions['North America']++;
				} else {
					regions['South America']++;
				}
			} else if (lon >= -30 && lon <= 60) {
				if (lat >= 35) {
					regions['Europe']++;
				} else {
					regions['Africa']++;
				}
			} else if (lon >= 60 && lon <= 180 || lon >= -180 && lon <= -170) {
				if (lat >= -10 && lon < 110) {
					regions['Asia']++;
				} else if (lat < -10 && lon >= 110) {
					regions['Oceania']++;
				} else if (lon >= 110) {
					regions['Asia']++;
				} else {
					regions['Asia']++;
				}
			}
		});

		const eligibleBalloons = balloons.filter(b => b.samples.length >= 2);
		const sampleSize = Math.min(100, eligibleBalloons.length);

		let sampledBalloons: typeof eligibleBalloons = [];
		if (sampleSize === eligibleBalloons.length) {
			sampledBalloons = eligibleBalloons;
		} else if (sampleSize > 0) {
			const step = Math.max(1, Math.floor(eligibleBalloons.length / sampleSize));
			sampledBalloons = eligibleBalloons.filter((_, idx) => idx % step === 0).slice(0, sampleSize);
		}

		const correlationData = sampledBalloons
			.map((balloon, index) => {
				const latest = balloon.samples[0];
				const previous = balloon.samples[1];

				const timeDiffHours = previous.hourAgo - latest.hourAgo;

				if (timeDiffHours <= 0) return null;

				const lat1 = (previous.lat * Math.PI) / 180;
				const lat2 = (latest.lat * Math.PI) / 180;
				const dLat = ((latest.lat - previous.lat) * Math.PI) / 180;
				const dLon = ((latest.lon - previous.lon) * Math.PI) / 180;

				const a =
					Math.sin(dLat / 2) * Math.sin(dLat / 2) +
					Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				const distance = 6371 * c;

				const speed = distance / timeDiffHours;

				return {
					altitude: parseFloat(balloon.latest.altKm.toFixed(1)),
					speed: parseFloat(speed.toFixed(1)),
					balloonName: `Balloon ${balloon.id}`,
					id: index,
				};
			})
			.filter((d): d is NonNullable<typeof d> => d !== null);


		const regionData = Object.entries(regions)
			.filter(([, count]) => count > 0)
			.map(([region, count]) => ({ region, count }));

		// Find dominant altitude range
		const dominantAltitudeBin = altitudeBins.reduce((prev, current) =>
			(current.count > prev.count) ? current : prev
		);

		// Find most populated region
		const mostPopulatedRegion = Object.entries(regions)
			.reduce((prev, current) =>
				(current[1] > prev[1]) ? current : prev
			);

		const jetStreamSpeeds = speeds.filter(s => s > 80).length;
		const hasJetStreamActivity = jetStreamSpeeds > speeds.length * 0.1;

		const dataQualityIssues: DataQualityIssue[] = [];

		balloons.forEach(balloon => {
			if (balloon.samples.length < 24) {
				dataQualityIssues.push({
					balloonId: balloon.id,
					issue: `Incomplete data: only ${balloon.samples.length}/24 samples`,
					severity: 'warning',
				});
			}

			const expectedHours = Array.from({ length: 24 }, (_, i) => i);
			const actualHours = balloon.samples.map(s => s.hourAgo).sort((a, b) => a - b);
			const missingHours = expectedHours.filter(h => !actualHours.includes(h));
			if (missingHours.length > 0 && missingHours.length < 24) {
				dataQualityIssues.push({
					balloonId: balloon.id,
					issue: `Missing ${missingHours.length} hour(s) of data`,
					severity: 'warning',
				});
			}

			const unrealisticAlt = balloon.samples.find(s => s.altKm < 5 || s.altKm > 40);
			if (unrealisticAlt) {
				dataQualityIssues.push({
					balloonId: balloon.id,
					issue: `Unusual altitude detected: ${unrealisticAlt.altKm.toFixed(1)} km`,
					severity: 'warning',
				});
			}

			for (let i = 0; i < balloon.samples.length - 1; i++) {
				const curr = balloon.samples[i];
				const next = balloon.samples[i + 1];

				const latDiff = Math.abs(curr.lat - next.lat);
				const lonDiff = Math.abs(curr.lon - next.lon);

				if (latDiff > 30 || lonDiff > 30) {
					dataQualityIssues.push({
						balloonId: balloon.id,
						issue: `Unrealistic position jump detected between samples`,
						severity: 'error',
					});
					break;
				}
			}

			const positions = balloon.samples.map(s => `${s.lat.toFixed(4)},${s.lon.toFixed(4)}`);
			const uniquePositions = new Set(positions);
			if (uniquePositions.size === 1 && balloon.samples.length > 1) {
				dataQualityIssues.push({
					balloonId: balloon.id,
					issue: `Stationary balloon: no movement detected`,
					severity: 'error',
				});
			}
		});

		return {
			avgAltitude,
			avgSpeed,
			maxSpeed,
			altitudeBins,
			regionData,
			correlationData,
			dominantAltitudeBin,
			mostPopulatedRegion,
			hasJetStreamActivity,
			dataQualityIssues,
		};
	}, [balloons]);
}
