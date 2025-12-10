import type { UploadedData, TaskStats, TreeTestOverviewStats, Item, Participant } from "./types";

export function generateMarkdownReport(
    data: UploadedData,
    taskStats: TaskStats[],
    overviewStats: TreeTestOverviewStats
): string {
    const sections = [
        generateHeader(),
        generateAIInstructions(),
        generateStudyOverview(overviewStats, data),
        generateTreeStructure(data.treeStructure),
        ...taskStats.map(task => generateTaskSection(task, data)),
        generateFooter()
    ];

    return sections.filter(Boolean).join("\n\n");
}

function generateHeader(): string {
    const date = new Date().toLocaleString();
    return `# Tree Test Results Report
Generated: ${date}

---`;
}

function generateAIInstructions(): string {
    return `## Instructions for AI Analysis

You are an expert UX researcher specializing in tree testing and information architecture. Your role is to analyze the tree test results provided below and deliver actionable insights that inform product development, navigation improvements, and user experience optimization.

### Your Expertise
- **Tree Testing Methodology**: Deep understanding of how users navigate hierarchical information structures
- **Information Architecture**: Expertise in organizing content, labeling, and navigation patterns
- **User Behavior Analysis**: Ability to interpret navigation paths, backtracking patterns, and user decision-making
- **UX Research Synthesis**: Skilled at translating quantitative metrics into qualitative insights and recommendations

### Analysis Framework

When analyzing these results, please:

1. **Assess Overall Performance**
   - Evaluate success rates, directness, and completion times against industry benchmarks
   - Identify patterns across tasks (e.g., are certain areas consistently problematic?)
   - Consider the relationship between confidence ratings and task outcomes

2. **Identify Navigation Issues**
   - Analyze incorrect destinations to find common misrouting patterns
   - Examine backtracking behavior (indicated by ⟲) to identify confusing decision points
   - Review first-click parent labels to understand initial user mental models
   - Look for tasks where indirect success is high (users eventually succeed but take longer paths)

3. **Examine Path Distribution**
   - When multiple correct paths exist, determine if users are evenly distributed or clustering on one path
   - Assess whether alternative paths are discoverable or if users are defaulting to obvious routes
   - Consider if path distribution reveals labeling or categorization issues

4. **Synthesize Insights**
   - Connect quantitative metrics to potential qualitative issues (e.g., low success rate + high backtracking = confusing navigation)
   - Identify root causes, not just symptoms (e.g., "users clicked wrong category" → "category labels are ambiguous or don't match user mental models")
   - Prioritize issues by impact (affecting many users) and severity (blocking critical tasks)

5. **Provide Actionable Recommendations**
   - Suggest specific improvements to information architecture (e.g., relabeling, restructuring, adding wayfinding)
   - Recommend further research when data is inconclusive
   - Consider both quick wins and longer-term strategic changes
   - Explain the rationale behind each recommendation with evidence from the data

### Key Metrics to Interpret

- **Success Rate**: Percentage of users who completed the task correctly. <60% indicates significant problems.
- **Directness**: Percentage of users who took the most direct path. Low directness suggests users are exploring or confused.
- **Overall Score**: Weighted combination (70% success + 30% directness). Use this for quick health checks.
- **Backtracking (⟲)**: When users return to previous nodes, it indicates confusion or wrong initial choices.
- **Confidence Ratings**: High confidence with low success suggests overconfidence; low confidence with high success suggests uncertainty despite correct choices.

### Output Format

Please structure your analysis as:
1. **Executive Summary**: 2-3 sentence overview of key findings
2. **Critical Issues**: Top 3-5 problems requiring immediate attention
3. **Detailed Analysis**: Task-by-task breakdown with specific insights
4. **Recommendations**: Prioritized list of actionable improvements with rationale
5. **Next Steps**: Suggested follow-up research or validation methods

---

**Begin your analysis of the tree test results below:**

---`;
}

function generateStudyOverview(stats: TreeTestOverviewStats, data: UploadedData): string {
    return `## Study Overview

### Overall Metrics
- **Total Participants:** ${stats.totalParticipants}
- **Total Tasks:** ${data.tasks.length}
- **Completion Rate:** ${stats.completionRate}% (${stats.completedParticipants} completed / ${stats.totalParticipants} total)
- **Overall Success Rate:** ${stats.successRate}%
- **Overall Directness:** ${stats.directnessRate}%
- **Overall Score:** ${stats.overallScore}
- **Median Completion Time:** ${stats.medianCompletionTime}s

### Score Interpretation
- ✅ **Excellent:** ≥ 80%
- ⚠️ **Average:** 60% - 79%
- ❌ **Poor:** < 60%

---`;
}

function generateTreeStructure(tree?: Item[]): string {
    if (!tree || tree.length === 0) return "";

    const renderNode = (item: Item, prefix: string, isLast: boolean): string => {
        const marker = isLast ? "└── " : "├── ";
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        
        let result = `${prefix}${marker}${item.name}\n`;
        
        if (item.children && item.children.length > 0) {
            item.children.forEach((child, index) => {
                result += renderNode(child, childPrefix, index === item.children!.length - 1);
            });
        }
        
        return result;
    };

    // Handle root nodes
    let result = "## Tree Structure\n\n```\n";
    tree.forEach((item) => {
        // Root items usually don't have markers if they are top level, 
        // but standard tree format often implies a single root or multiple roots.
        // We'll render them as top level nodes.
        result += item.name + "\n";
        if (item.children) {
            item.children.forEach((child, cIndex) => {
                result += renderNode(child, "", cIndex === item.children!.length - 1);
            });
        }
    });
    result += "```\n\n---";

    return result;
}

function generateTaskSection(task: TaskStats, data: UploadedData): string {
    const expectedPaths = task.expectedAnswer.split(",").map(p => p.trim()).join("\n");
    const participants = data.participants;

    return `## Task ${task.index}: ${task.description}

### Expected Path(s)
${expectedPaths.split('\n').map((p, i) => `${i + 1}. \`${p}\``).join('\n')}

### Key Metrics
| Metric | Value | Benchmark |
|--------|-------|-----------|
| Success Rate | ${task.stats.success.rate}% | ${getBenchmark(task.stats.success.rate)} |
| Directness | ${task.stats.directness.rate}% | ${getBenchmark(task.stats.directness.rate)} |
| Overall Score | ${task.stats.score} | ${getBenchmark(task.stats.score)} |
| Median Time | ${task.stats.time.median}s | - |
| Time Range | ${task.stats.time.min}s - ${task.stats.time.max}s | - |

${generateParentNodeSection(task)}

### Results Breakdown
| Outcome | Count | Percentage |
|---------|-------|------------|
| Direct Success | ${task.stats.breakdown.directSuccess} | ${calculatePercentage(task.stats.breakdown.directSuccess, task.stats.breakdown.total)}% |
| Indirect Success | ${task.stats.breakdown.indirectSuccess} | ${calculatePercentage(task.stats.breakdown.indirectSuccess, task.stats.breakdown.total)}% |
| Fail | ${task.stats.breakdown.fail} | ${calculatePercentage(task.stats.breakdown.fail, task.stats.breakdown.total)}% |
| Skip | ${task.stats.breakdown.directSkip + task.stats.breakdown.indirectSkip} | ${calculatePercentage(task.stats.breakdown.directSkip + task.stats.breakdown.indirectSkip, task.stats.breakdown.total)}% |

---

### Participant Paths

| Result | # | % | Path |
|--------|---|---|------|
${generateParticipantPaths(task, participants)}

**Notes:**
- ⟲ indicates backtracking (participant returned to a previous node)
- **Bold** nodes indicate where backtracking occurred

---

### First-Clicked Parent Labels

| Path | Correct First Click | Clicked First | Clicked During Task |
|------|---------------------|---------------|---------------------|
${generateParentClicks(task)}

---

### Correct Path Distribution

| Path | Count | % of Total |
|------|-------|------------|
${generatePathDistribution(task)}

---

### Incorrect Destinations

| Path | Count | % |
|------|-------|---|
${generateIncorrectDestinations(task)}

---

### Confidence Ratings

| Rating | Direct Success | Indirect Success | Fail | Skip | Total |
|--------|---------------|------------------|------|------|-------|
${generateConfidenceRatings(task)}`;
}

function generateParticipantPaths(task: TaskStats, participants: Participant[]): string {
    // Aggregate paths
    const pathMap = new Map<string, {
        path: string;
        count: number;
        resultType: string;
    }>();

    participants.forEach(p => {
        const result = p.taskResults.find(r => r.taskIndex === task.index);
        if (!result) return;

        const path = result.pathTaken || "(No Path)";
        let resultType = "Skip";
        if (!result.skipped) {
            if (result.successful) {
                resultType = result.directPathTaken ? "Direct Success" : "Indirect Success";
            } else {
                resultType = "Fail";
            }
        } else {
             // Differentiate direct/indirect skip if needed, or just "Skip"
             resultType = result.directPathTaken ? "Direct Skip" : "Indirect Skip";
        }

        // Determine if backtracking occurred and format path
        // This is a simplified check. A robust check needs full tree traversal logic or pre-calculated flag.
        // For this report, we'll format the path string.
        const formattedPath = formatPathWithBacktracking(path);
        
        const key = `${resultType}||${formattedPath}`;
        
        if (!pathMap.has(key)) {
            pathMap.set(key, {
                path: formattedPath,
                count: 0,
                resultType
            });
        }
        pathMap.get(key)!.count++;
    });

    const total = Array.from(pathMap.values()).reduce((sum, item) => sum + item.count, 0);

    return Array.from(pathMap.values())
        .sort((a, b) => b.count - a.count)
        .map(item => {
            const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
            // Ensure markdown table columns alignment
            return `| ${item.resultType} | ${item.count} | ${percent}% | ${item.path} |`;
        })
        .join('\n');
}

function formatPathWithBacktracking(pathString: string): string {
    if (!pathString) return "(No Path)";
    
    const parts = pathString.split('/').filter(Boolean);
    if (parts.length === 0) return pathString;

    // Simple heuristic: if a node appears multiple times, it *might* involve backtracking.
    // A better visualization: Home > Category > **Home** > Other
    // We will just replace '/' with ' > ' for readability
    return parts.join(' > ');
}

function generateParentClicks(task: TaskStats): string {
    return task.stats.parentClicks.map(pc => {
        const correctIcon = pc.isCorrect ? "✅ Yes" : "❌ No";
        return `| \`${pc.path}\` | ${correctIcon} | ${pc.firstClickCount} (${pc.firstClickPercentage}%) | ${pc.totalClickCount} (${pc.totalClickPercentage}%) |`;
    }).join('\n');
}

function generatePathDistribution(task: TaskStats): string {
    if (!task.stats.pathDistribution || task.stats.pathDistribution.length === 0) {
        return "| No data | - | - |";
    }
    return task.stats.pathDistribution.map(pd => {
        return `| \`${pd.path}\` | ${pd.count} | ${pd.percentage}% |`;
    }).join('\n');
}

function generateIncorrectDestinations(task: TaskStats): string {
    if (task.stats.incorrectDestinations.length === 0) {
        return "| No incorrect destinations | - | - |";
    }
    return task.stats.incorrectDestinations.map(id => {
        return `| \`${id.path}\` | ${id.count} | ${id.percentage}% |`;
    }).join('\n');
}

function generateParentNodeSection(task: TaskStats): string {
    if (!task.stats.parentNodeStats) {
        return ""; // No parent node stats available
    }
    
    const { level1, level2, level3 } = task.stats.parentNodeStats;
    
    let rows = `### Parent Node Success Rates\n\n`;
    rows += `| Level | Node Name | Success Rate | Participants Reached |\n`;
    rows += `|-------|-----------|--------------|---------------------|\n`;
    
    rows += `| Level 1 | ${level1.nodeName} | ${level1.rate.toFixed(1)}% | ${level1.count} / ${level1.total} |\n`;
    
    if (level2) {
        rows += `| Level 2 | ${level2.nodeName} | ${level2.rate.toFixed(1)}% | ${level2.count} / ${level2.total} |\n`;
    }
    
    if (level3) {
        rows += `| Level 3 | ${level3.nodeName} | ${level3.rate.toFixed(1)}% | ${level3.count} / ${level3.total} |\n`;
    }
    
    rows += `\n---\n`;
    
    return rows;
}

function generateConfidenceRatings(task: TaskStats): string {
    const ratings = task.stats.confidenceRatings;
    if (ratings.length === 0) {
        return "| No confidence data available | - | - | - | - | - | - |";
    }

    const ratingLabels: Record<number, string> = {
        7: "Very Confident",
        6: "Confident",
        5: "Somewhat Confident",
        4: "Neutral",
        3: "Somewhat Not Confident",
        2: "Not Confident",
        1: "Not Confident At All"
    };

    return ratings.map(r => {
        const label = ratingLabels[r.value] || r.value.toString();
        const b = r.breakdown;
        return `| ${label} | ${b.directSuccess} (${b.directSuccessPercentage}%) | ${b.indirectSuccess} (${b.indirectSuccessPercentage}%) | ${b.fail} (${b.failPercentage}%) | ${b.directSkip + b.indirectSkip} (${b.directSkipPercentage + b.indirectSkipPercentage}%) | ${r.count} |`;
    }).join('\n');
}

function generateFooter(): string {
    const timestamp = new Date().toLocaleString();
    return `---

## Export Information

**Report Generated:** ${timestamp}  
**Tool:** Tree Test Analyzer  
**Data Export:** Use "Export Raw Data" button to download the complete dataset for detailed analysis

---

*This report contains all metrics and participant data from the tree test study. Share this with AI analysis tools along with the raw data export for comprehensive insights.*`;
}

// Helper functions
function getBenchmark(value: number): string {
    if (value >= 80) return "✅ Excellent";
    if (value >= 60) return "⚠️ Average";
    return "❌ Poor";
}

function calculatePercentage(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
}
