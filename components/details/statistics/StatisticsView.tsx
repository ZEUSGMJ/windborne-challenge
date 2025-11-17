'use client';
import { BalloonTrack } from '@/lib/types';
import { useStatistics } from './useStatistics';
import { AltitudeDistribution } from './AltitudeDistribution';
import { RegionDistribution } from './RegionDistribution';
import { AltitudeSpeedCorrelation } from './AltitudeSpeedCorrelation';
import { KeyInsights } from './KeyInsights';
import { DataQuality } from './DataQuality';
import { WindAlignmentInsights } from '@/lib/data/windMisalignment';

interface StatisticsViewProps {
	balloons: BalloonTrack[];
	windInsights?: WindAlignmentInsights | null;
	isLoadingWindData?: boolean;
}

export function StatisticsView({ balloons, windInsights, isLoadingWindData }: StatisticsViewProps) {
	const stats = useStatistics(balloons);

	if (!stats) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500">No data available</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6">
				<AltitudeDistribution altitudeBins={stats.altitudeBins} />
				<RegionDistribution regionData={stats.regionData} />
				<AltitudeSpeedCorrelation correlationData={stats.correlationData} />
			</div>

			<KeyInsights stats={stats} windInsights={windInsights} isLoadingWindData={isLoadingWindData} />

			<DataQuality issues={stats.dataQualityIssues} />
		</div>
	);
}
