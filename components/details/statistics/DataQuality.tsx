'use client';
import { useState } from 'react';
import { DataQualityIssue } from './useStatistics';
import { MdOutlineWarningAmber, MdOutlineErrorOutline, MdCheckCircleOutline } from "react-icons/md";

interface DataQualityProps {
	issues: DataQualityIssue[];
}

export function DataQuality({ issues }: DataQualityProps) {
	const [visibleIssuesCount, setVisibleIssuesCount] = useState(20);
	const [showWarnings, setShowWarnings] = useState(true);
	const [showErrors, setShowErrors] = useState(true);

	const filteredIssues = issues.filter(issue => {
		if (issue.severity === 'warning' && !showWarnings) return false;
		if (issue.severity === 'error' && !showErrors) return false;
		return true;
	});

	return (
		<div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-600">
			<div className="flex items-center justify-between mb-3">
				<h4 className="text-base font-semibold text-gray-300">Data Quality</h4>

				{issues.length > 0 && (
					<div className="flex gap-2">
						<button
							onClick={() => setShowWarnings(!showWarnings)}
							className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
								showWarnings
									? 'bg-yellow-950/50 text-yellow-400 border border-yellow-900/50'
									: 'bg-zinc-800/50 text-gray-500 border border-zinc-700/50'
							}`}
						>
							<MdOutlineWarningAmber className="w-3.5 h-3.5" />
							{showWarnings ? 'Hide' : 'Show'} Warnings
						</button>
						<button
							onClick={() => setShowErrors(!showErrors)}
							className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
								showErrors
									? 'bg-red-950/50 text-red-400 border border-red-900/50'
									: 'bg-zinc-800/50 text-gray-500 border border-zinc-700/50'
							}`}
						>
							<MdOutlineErrorOutline className="w-3.5 h-3.5" />
							{showErrors ? 'Hide' : 'Show'} Errors
						</button>
					</div>
				)}
			</div>

			{issues.length === 0 ? (
				<div className="flex items-center gap-2 text-sm text-green-400">
					<MdCheckCircleOutline className="w-5 h-5" />
					<span>All balloon data is complete and valid</span>
				</div>
			) : filteredIssues.length === 0 ? (
				<div className="text-sm text-gray-500 text-center py-8">
					No issues to display with current filters
				</div>
			) : (
				<>
					<div className="mb-3 text-xs text-gray-400">
						Showing {filteredIssues.length} issue{filteredIssues.length > 1 ? 's' : ''} across {new Set(filteredIssues.map(i => i.balloonId)).size} balloon{new Set(filteredIssues.map(i => i.balloonId)).size > 1 ? 's' : ''}
					</div>
					<div className="max-h-96 overflow-y-auto space-y-2 mb-3">
						{filteredIssues.slice(0, visibleIssuesCount).map((issue, idx) => (
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
								<div className="flex-1">
									<div className="font-semibold text-gray-200">Balloon #{issue.balloonId}</div>
									<div className="text-gray-400 mt-1">{issue.issue}</div>
								</div>
							</div>
						))}
					</div>

					{/* Load More / Show Less buttons */}
					{filteredIssues.length > 20 && (
						<div className="flex justify-center gap-2">
							{visibleIssuesCount < filteredIssues.length && (
								<button
									onClick={() => setVisibleIssuesCount(prev => Math.min(prev + 20, filteredIssues.length))}
									className="px-4 py-2 text-xs font-medium text-blue-400 hover:text-blue-300 border border-blue-400/30 hover:border-blue-400/50 rounded-md transition-colors"
								>
									Load More ({filteredIssues.length - visibleIssuesCount} remaining)
								</button>
							)}
							{visibleIssuesCount > 20 && (
								<button
									onClick={() => setVisibleIssuesCount(20)}
									className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-300 border border-gray-600/30 hover:border-gray-600/50 rounded-md transition-colors"
								>
									Show Less
								</button>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}
