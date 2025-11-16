// Export all statistics components and utilities
export { StatisticsView } from './StatisticsView';
export { useStatistics } from './useStatistics';
export { KeyInsights } from './KeyInsights';
export { DataQuality } from './DataQuality';
export { AltitudeDistribution } from './AltitudeDistribution';
export { RegionDistribution } from './RegionDistribution';
export { AltitudeSpeedCorrelation } from './AltitudeSpeedCorrelation';

// Export types
export type {
	Statistics,
	AltitudeBin,
	RegionData,
	CorrelationPoint,
	DataQualityIssue,
} from './useStatistics';
