import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getMetricColor } from "@/lib/utils";
import type { TaskStats } from "@/lib/types";
import { getPathUpToLevel } from "@/lib/stats/path-utils";

interface ParentNodeSuccessSectionProps {
  task: TaskStats;
}

export function ParentNodeSuccessSection({ task }: ParentNodeSuccessSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no parent node stats available, don't show the section
  if (!task.stats.parentNodeStats) {
    return null;
  }

  const { level1, level2, level3 } = task.stats.parentNodeStats;
  const expectedPath = task.expectedAnswer.split(',')[0]?.trim() || '';

  // Calculate margin of error for each level
  const getMargin = (rate: number, total: number) => {
    return total > 0
      ? Math.sqrt((rate * (100 - rate)) / total) * 1.96
      : 0;
  };

  const rows = [
    {
      level: 1,
      label: "1st Level",
      stats: level1,
      expectedPath: getPathUpToLevel(expectedPath, 1),
    },
    level2 ? {
      level: 2,
      label: "2nd Level",
      stats: level2,
      expectedPath: getPathUpToLevel(expectedPath, 2),
    } : null,
    level3 ? {
      level: 3,
      label: "3rd Level",
      stats: level3,
      expectedPath: getPathUpToLevel(expectedPath, 3),
    } : null,
  ].filter(Boolean) as Array<{
    level: number;
    label: string;
    stats: { rate: number; count: number; total: number; nodeName: string };
    expectedPath: string;
  }>;

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-gray-50/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Parent Node Success Rates
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Success rates for reaching nodes at different hierarchy levels (separate from main success rate)
            </p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t p-4 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Level</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Expected Path</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">Success Rate</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">Participants</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const margin = getMargin(row.stats.rate, row.stats.total);
                  return (
                    <tr key={row.level} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {row.expectedPath || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${getMetricColor(row.stats.rate)}`}>
                          {row.stats.rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {row.stats.count} / {row.stats.total}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        ±{margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

