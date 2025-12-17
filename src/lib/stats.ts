import type { Item, ParentClickStats, TaskStats, TreeTestOverviewStats, UploadedData } from "./types";
import { calculateParentNodeStats } from "./stats/parent-node-stats";
import { parsePath } from "./stats/path-utils";

function computeStatistics(values: number[]): { median: number; min: number; max: number; q1: number; q3: number } {
    if (values.length === 0) {
        return { median: 0, min: 0, max: 0, q1: 0, q3: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];

    return { median, min, max, q1, q3 };
}

export function calculateOverviewStats(data: UploadedData): TreeTestOverviewStats {
    const totalParticipants = data.participants.length;
    const completedParticipants = data.participants.filter(p => p.status === "Completed").length;
    const abandonedParticipants = totalParticipants - completedParticipants;

    const completionTimes = data.participants
        .filter(p => p.status === "Completed" && (p.durationSeconds || 0) > 0)
        .map(p => p.durationSeconds || 0)
        .sort((a, b) => a - b);

    let medianCompletionTime = 0;
    let shortestCompletionTime = 0;
    let longestCompletionTime = 0;

    if (completionTimes.length > 0) {
        const mid = Math.floor(completionTimes.length / 2);
        medianCompletionTime = completionTimes.length % 2 !== 0
            ? completionTimes[mid]
            : (completionTimes[mid - 1] + completionTimes[mid]) / 2;
        shortestCompletionTime = completionTimes[0];
        longestCompletionTime = completionTimes[completionTimes.length - 1];
    }

    let totalTasks = 0;
    let successCount = 0;
    let directnessCount = 0;

    data.participants.forEach(p => {
        p.taskResults.forEach(r => {
            totalTasks++;
            if (r.successful) successCount++;
            if (r.directPathTaken) directnessCount++;
        });
    });

    const successRate = totalTasks > 0 ? (successCount / totalTasks) * 100 : 0;
    const directnessRate = totalTasks > 0 ? (directnessCount / totalTasks) * 100 : 0;
    const completionRate = totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0;
    const overallScore = Math.round(successRate * 0.7 + directnessRate * 0.3);

    return {
        totalParticipants,
        completedParticipants,
        abandonedParticipants,
        completionRate: Math.round(completionRate),
        medianCompletionTime,
        shortestCompletionTime,
        longestCompletionTime,
        successRate: Math.round(successRate),
        directnessRate: Math.round(directnessRate),
        overallScore,
    };
}

export function calculateTaskStats(data: UploadedData, tree: Item[]): TaskStats[] {
    return data.tasks.map(task => {
        // Gather all results for this task
        const rawTaskResults = data.participants.flatMap(p =>
            p.taskResults.filter(r => r.taskIndex === task.index)
        );

        // Determine expected paths first (filter out empties)
        const expectedAnswers = task.expectedAnswer
            .split(",")
            .map(a => a.trim())
            .filter(a => a.length > 0);

        // Calculate parent node stats (safe - wrapped in try-catch)
        let parentNodeStats;
        try {
            parentNodeStats = calculateParentNodeStats(task, data.participants);
        } catch (error) {
            console.error('Error calculating parent node stats for task:', task.index, error);
            parentNodeStats = null;
        }

        if (rawTaskResults.length === 0) {
            return {
                ...task,
                maxTimeSeconds: null,
                parsedTree: JSON.stringify(tree),
                stats: {
                    success: { rate: 0, margin: 0 },
                    directness: { rate: 0, margin: 0 },
                    time: { median: 0, min: 0, max: 0, q1: 0, q3: 0 },
                    score: 0,
                    breakdown: {
                        directSuccess: 0, indirectSuccess: 0, fail: 0,
                        directSkip: 0, indirectSkip: 0, total: 0
                    },
                    parentClicks: [],
                    incorrectDestinations: [],
                    confidenceRatings: [],
                    pathDistribution: [],
                    parentNodeStats: parentNodeStats ? {
                        level1: parentNodeStats.level1,
                        level2: parentNodeStats.level2,
                        level3: parentNodeStats.level3
                    } : undefined,
                }
            };
        }

        // Calculate path distribution
        // Derive from participant paths: group successful (direct or indirect) by final destination node
        const pathDistributionMap = new Map<string, { count: number; shortestPath: string }>();

        // Use original task results without modifying success status
        const taskResults = rawTaskResults;

        // Consider only successful, non-skipped participants
        const successfulResults = taskResults.filter(r => !r.skipped && r.successful);

        successfulResults.forEach(r => {
            const parsedPath = parsePath(r.pathTaken);
            if (parsedPath.length === 0) return;
            const finalDestination = parsedPath[parsedPath.length - 1].toLowerCase();
            const pathLength = parsedPath.length;

            if (pathDistributionMap.has(finalDestination)) {
                const existing = pathDistributionMap.get(finalDestination)!;
                existing.count += 1;
                // Update shortest path if this path is shorter
                const existingLength = parsePath(existing.shortestPath).length;
                if (pathLength < existingLength) {
                    existing.shortestPath = r.pathTaken;
                }
            } else {
                pathDistributionMap.set(finalDestination, {
                    count: 1,
                    shortestPath: r.pathTaken
                });
            }
        });

        const totalCount = taskResults.length;
        const successCount = taskResults.filter(r => r.successful).length;
        const directnessCount = taskResults.filter(r => r.directPathTaken).length;

        const successRate = (successCount / totalCount) * 100;
        const directnessRate = (directnessCount / totalCount) * 100;

        const successMargin = Math.sqrt((successRate * (100 - successRate)) / totalCount) * 1.96;
        const directnessMargin = Math.sqrt((directnessRate * (100 - directnessRate)) / totalCount) * 1.96;

        const timeValues = taskResults
            .filter(r => !r.skipped)
            .map(r => r.completionTimeSeconds); // Note: completionTimeSeconds might be 0 if not parsed correctly

        const timeStats = computeStatistics(timeValues);

        const breakdown = {
            directSuccess: taskResults.filter(r => r.successful && r.directPathTaken && !r.skipped).length,
            indirectSuccess: taskResults.filter(r => r.successful && !r.directPathTaken && !r.skipped).length,
            fail: taskResults.filter(r => !r.successful && !r.skipped).length,
            directSkip: taskResults.filter(r => r.skipped && r.directPathTaken).length,
            indirectSkip: taskResults.filter(r => r.skipped && !r.directPathTaken).length,
            total: totalCount,
        };

        const score = Math.round(successRate * 0.7 + directnessRate * 0.3);

        // Path Distribution Stats
        const totalSuccessfulPaths = successfulResults.length;
        const pathDistribution = Array.from(pathDistributionMap.values())
            .map((data) => ({
                path: data.shortestPath, // Show shortest path to this destination
                count: data.count, // Count all paths ending at this destination
                percentage: totalSuccessfulPaths > 0 ? Math.round((data.count / totalSuccessfulPaths) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count); // Sort by count descending

        // Parent Clicks Analysis
        const nonSkippedResults = taskResults.filter(r => !r.skipped);
        const totalParticipants = nonSkippedResults.length;

        const hasOnlyHomeRoot = tree.length === 1;
        const homeRoot = hasOnlyHomeRoot ? tree[0].name : "";

        const expectedParentPaths = expectedAnswers.map(answer => {
            const expectedParts = answer.split("/").filter(Boolean);
            if (hasOnlyHomeRoot && expectedParts.length > 1) {
                return `/${homeRoot}/${expectedParts[1]}`;
            } else if (expectedParts.length > 0) {
                return `/${expectedParts[0]}`;
            }
            return "";
        }).filter(Boolean);

        // Collect all unique parent names from all paths
        const allParentNames = new Set<string>();
        nonSkippedResults.forEach(r => {
            const pathParts = r.pathTaken.split("/").filter(Boolean);
            if (hasOnlyHomeRoot && pathParts.length > 1) {
                allParentNames.add(`/${homeRoot}/${pathParts[1]}`);
            } else if (pathParts.length > 0) {
                allParentNames.add(`/${pathParts[0]}`);
            }
        });

        // Initialize parent click stats
        const parentClickStats = new Map<string, ParentClickStats>();
        allParentNames.forEach(parentPath => {
            parentClickStats.set(parentPath, {
                path: parentPath,
                isCorrect: expectedParentPaths.includes(parentPath),
                firstClickCount: 0,
                firstClickPercentage: 0,
                totalClickCount: 0,
                totalClickPercentage: 0,
            });
        });

        // Count first clicks and total clicks for each parent
        nonSkippedResults.forEach(r => {
            const pathParts = r.pathTaken.split("/").filter(Boolean);
            let firstParentPath = "";

            if (hasOnlyHomeRoot && pathParts.length > 1) {
                firstParentPath = `/${homeRoot}/${pathParts[1]}`;
            } else if (pathParts.length > 0) {
                firstParentPath = `/${pathParts[0]}`;
            }

            // Increment first click for the first parent in the path
            if (firstParentPath && parentClickStats.has(firstParentPath)) {
                const stats = parentClickStats.get(firstParentPath)!;
                stats.firstClickCount++;
            }

            // Increment total clicks for all parents in the path
            // Properly iterate through each node in the participant's path
            pathParts.forEach((part, index) => {
                let currentPath = "";
                if (hasOnlyHomeRoot && index > 0) {
                    // For single-root trees, format as /Home/NodeName
                    currentPath = `/${homeRoot}/${part}`;
                } else if (index === 0 && !hasOnlyHomeRoot) {
                    // For multi-root trees, format as /NodeName
                    currentPath = `/${part}`;
                }
                
                // Increment count if this is a tracked parent node
                if (currentPath && parentClickStats.has(currentPath)) {
                    const stats = parentClickStats.get(currentPath);
                    if (stats) {
                        stats.totalClickCount++;
                    }
                }
            });
        });

        // Calculate percentages
        parentClickStats.forEach(stats => {
            stats.firstClickPercentage = totalParticipants > 0
                ? Math.round((stats.firstClickCount / totalParticipants) * 100)
                : 0;
            stats.totalClickPercentage = totalParticipants > 0
                ? Math.round((stats.totalClickCount / totalParticipants) * 100)
                : 0;
        });

        // Incorrect Destinations (derived from participant paths)
        // Start from participant task results (same as Participant Paths view)
        // Filter: non-skipped AND failed (direct or indirect)
        const failedResults = taskResults.filter(r => !r.skipped && !r.successful);

        // Prepare set of correct destinations (last segment of expected answers)
        const correctDestinations = new Set(
            expectedAnswers.map(ans => {
                const parsed = parsePath(ans);
                return parsed.length > 0 ? parsed[parsed.length - 1].toLowerCase() : "";
            }).filter(d => d !== "")
        );

        // Group by final destination
        const incorrectDestinationsMap = new Map<string, { count: number; shortestPath: string; name: string }>();
        failedResults.forEach(r => {
            const parsedPath = parsePath(r.pathTaken);
            if (parsedPath.length === 0) return;
            
            const finalDestination = parsedPath[parsedPath.length - 1].toLowerCase();
            const destinationName = parsedPath[parsedPath.length - 1]; // Original case

            // Filter Correct Destinations: Check if it matches one of the expected destinations
            if (correctDestinations.has(finalDestination)) {
                return;
            }

            const pathLength = parsedPath.length;

            if (incorrectDestinationsMap.has(finalDestination)) {
                const existing = incorrectDestinationsMap.get(finalDestination)!;
                existing.count += 1;
                const existingLength = parsePath(existing.shortestPath).length;
                if (pathLength < existingLength) {
                    existing.shortestPath = r.pathTaken;
                }
            } else {
                incorrectDestinationsMap.set(finalDestination, {
                    count: 1,
                    shortestPath: r.pathTaken,
                    name: destinationName
                });
            }
        });

        const totalFilteredIncorrect = Array.from(incorrectDestinationsMap.values()).reduce((sum, d) => sum + d.count, 0);
        
        const incorrectDestinations = Array.from(incorrectDestinationsMap.values())
            .map((data) => ({
                path: data.name, // Display destination name instead of full path
                count: data.count,
                percentage: totalFilteredIncorrect ? Math.round((data.count / totalFilteredIncorrect) * 100) : 0,
            }))
            .sort((a, b) => b.count - a.count);

        // Confidence Ratings
        const confidenceValuesMap = new Map<number, any>();

        // Initialize all 7 confidence levels (1-7)
        for (let i = 1; i <= 7; i++) {
            confidenceValuesMap.set(i, {
                count: 0, directSuccess: 0, indirectSuccess: 0, fail: 0, directSkip: 0, indirectSkip: 0
            });
        }

        // Count actual responses (skip confidence ratings are excluded since participants don't see the question when they skip)
        taskResults.forEach(r => {
            if (!r.skipped && r.confidenceRating !== null && r.confidenceRating >= 1 && r.confidenceRating <= 7) {
                const value = r.confidenceRating;
                const stats = confidenceValuesMap.get(value);
                if (stats) {
                    stats.count++;
                    if (r.successful) {
                        if (r.directPathTaken) stats.directSuccess++; else stats.indirectSuccess++;
                    } else {
                        stats.fail++;
                    }
                }
            }
        });

        const totalRatings = Array.from(confidenceValuesMap.values()).reduce((sum, s) => sum + s.count, 0);
        const confidenceRatings = Array.from(confidenceValuesMap.entries())
            .sort(([a], [b]) => b - a) // Sort by value descending (7 to 1)
            .map(([value, stats]) => ({
                value,
                count: stats.count,
                percentage: totalRatings ? Math.round((stats.count / totalRatings) * 100) : 0,
                breakdown: {
                    directSuccess: stats.directSuccess,
                    directSuccessPercentage: stats.count ? Math.round((stats.directSuccess / stats.count) * 100) : 0,
                    indirectSuccess: stats.indirectSuccess,
                    indirectSuccessPercentage: stats.count ? Math.round((stats.indirectSuccess / stats.count) * 100) : 0,
                    fail: stats.fail,
                    failPercentage: stats.count ? Math.round((stats.fail / stats.count) * 100) : 0,
                    directSkip: stats.directSkip,
                    directSkipPercentage: stats.count ? Math.round((stats.directSkip / stats.count) * 100) : 0,
                    indirectSkip: stats.indirectSkip,
                    indirectSkipPercentage: stats.count ? Math.round((stats.indirectSkip / stats.count) * 100) : 0,
                }
            }));

        return {
            ...task,
            maxTimeSeconds: null,
            parsedTree: JSON.stringify(tree),
            stats: {
                success: { rate: Math.round(successRate), margin: Math.round(successMargin) },
                directness: { rate: Math.round(directnessRate), margin: Math.round(directnessMargin) },
                time: timeStats,
                score,
                breakdown,
                parentClicks: Array.from(parentClickStats.values()).sort((a, b) => b.firstClickCount - a.firstClickCount),
                incorrectDestinations,
                confidenceRatings,
                pathDistribution,
                parentNodeStats: parentNodeStats ? {
                    level1: parentNodeStats.level1,
                    level2: parentNodeStats.level2,
                    level3: parentNodeStats.level3
                } : undefined,
            }
        };
    });
}
