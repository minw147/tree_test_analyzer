import type { UploadedData } from "./types";
import { calculateOverviewStats, calculateTaskStats } from "./stats";

/**
 * Generate a comprehensive HTML report with all views expanded
 * Includes all tabs and charts
 */
export function generateHtmlReport(data: UploadedData): string {
  const stats = calculateOverviewStats(data);
  const tree = data.treeStructure || [];
  const taskStats = calculateTaskStats(data, tree);
  
  // Calculate task results data for stacked bar chart
  const taskResultsData = data.tasks.map((task) => {
    const taskResults = {
      directSuccess: 0,
      indirectSuccess: 0,
      directFail: 0,
      indirectFail: 0,
      directSkip: 0,
      indirectSkip: 0,
    };

    data.participants.forEach((p) => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (result) {
        if (result.skipped) {
          if (result.directPathTaken) taskResults.directSkip++;
          else taskResults.indirectSkip++;
        } else if (result.successful) {
          if (result.directPathTaken) taskResults.directSuccess++;
          else taskResults.indirectSuccess++;
        } else {
          if (result.directPathTaken) taskResults.directFail++;
          else taskResults.indirectFail++;
        }
      }
    });

    const total = taskResults.directSuccess + taskResults.indirectSuccess +
      taskResults.directFail + taskResults.indirectFail +
      taskResults.directSkip + taskResults.indirectSkip;

    const getPct = (val: number) => total > 0 ? (val / total) * 100 : 0;

    return {
      name: `Task ${task.index}`,
      index: task.index,
      "Direct Success": getPct(taskResults.directSuccess),
      "Direct Success_count": taskResults.directSuccess,
      "Indirect Success": getPct(taskResults.indirectSuccess),
      "Indirect Success_count": taskResults.indirectSuccess,
      "Direct Fail": getPct(taskResults.directFail),
      "Direct Fail_count": taskResults.directFail,
      "Indirect Fail": getPct(taskResults.indirectFail),
      "Indirect Fail_count": taskResults.indirectFail,
      "Direct Skip": getPct(taskResults.directSkip),
      "Direct Skip_count": taskResults.directSkip,
      "Indirect Skip": getPct(taskResults.indirectSkip),
      "Indirect Skip_count": taskResults.indirectSkip,
      total,
    };
  });

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getMetricColor = (value: number): string => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricColorValue = (value: number): string => {
    if (value >= 80) return '#16a34a'; // green-600
    if (value >= 60) return '#ca8a04'; // yellow-600
    return '#dc2626'; // red-600
  };

  // Generate tree structure HTML
  const renderTree = (items: any[], level = 0): string => {
    if (!items || items.length === 0) return '<div class="text-sm text-gray-500 italic">No tree structure available.</div>';
    
    let html = '<div class="space-y-1">';
    items.forEach((item) => {
      const indent = level * 20;
      html += `<div class="flex items-start gap-2" style="margin-left: ${indent}px;">`;
      html += `<div class="flex-1 py-1 text-sm text-gray-700">${escapeHtml(item.name)}</div>`;
      html += '</div>';
      if (item.children && item.children.length > 0) {
        html += renderTree(item.children, level + 1);
      }
    });
    html += '</div>';
    return html;
  };

  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Generate stacked bar chart SVG with data labels
  const generateStackedBarChart = (): string => {
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 100, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const maxValue = 100; // Percentage
    const barHeight = chartHeight / taskResultsData.length;
    const barSpacing = 5;
    const actualBarHeight = barHeight - barSpacing;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${margin.left},${margin.top})">`;

    // Draw bars
    taskResultsData.forEach((task, taskIndex) => {
      const y = taskIndex * barHeight;
      let x = 0;
      
      const categories = [
        { key: 'Direct Success', color: '#22c55e', count: task['Direct Success_count'] },
        { key: 'Indirect Success', color: '#86efac', count: task['Indirect Success_count'] },
        { key: 'Direct Fail', color: '#ef4444', count: task['Direct Fail_count'] },
        { key: 'Indirect Fail', color: '#fca5a5', count: task['Indirect Fail_count'] },
        { key: 'Direct Skip', color: '#64748b', count: task['Direct Skip_count'] },
        { key: 'Indirect Skip', color: '#cbd5e1', count: task['Indirect Skip_count'] },
      ];

      categories.forEach((cat) => {
        const taskValue = task[cat.key as keyof typeof task] as number;
        const width = (taskValue / maxValue) * chartWidth;
        if (width > 0) {
          svg += `<rect x="${x}" y="${y}" width="${width}" height="${actualBarHeight}" fill="${cat.color}" />`;
          
          // Add data label if segment is large enough
          if (width > 30 && taskValue > 5) {
            const labelX = x + width / 2;
            const labelY = y + actualBarHeight / 2;
            svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="white" font-weight="bold">${Math.round(taskValue)}%</text>`;
            svg += `<text x="${labelX}" y="${labelY + 12}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="white">(${cat.count})</text>`;
          }
          
          x += width;
        }
      });

      // Task label
      svg += `<text x="-10" y="${y + actualBarHeight / 2}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="#374151">Task ${task.index}</text>`;
    });

    // X-axis
    svg += `<line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#e5e7eb" stroke-width="1" />`;
    for (let i = 0; i <= 5; i++) {
      const value = (i * 20);
      const x = (value / maxValue) * chartWidth;
      svg += `<line x1="${x}" y1="${chartHeight}" x2="${x}" y2="${chartHeight + 5}" stroke="#9ca3af" stroke-width="1" />`;
      svg += `<text x="${x}" y="${chartHeight + 20}" text-anchor="middle" font-size="10" fill="#6b7280">${value}%</text>`;
    }

    svg += '</g>';
    svg += '</svg>';
    return svg;
  };

  // Generate pie chart SVG
  const generatePieChart = (pieData: Array<{name: string; value: number; color: string}>, total: number): string => {
    const width = 192;
    const height = 192;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.5;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<g transform="translate(${width / 2},${height / 2})">`;
    
    const colorMap: Record<string, string> = {
      "bg-green-500": "#22c55e",
      "bg-green-300": "#86efac",
      "bg-red-500": "#ef4444",
      "bg-red-300": "#fca5a5",
      "bg-gray-500": "#6b7280",
      "bg-gray-300": "#d1d5db",
    };
    
    let currentAngle = -Math.PI / 2; // Start at top
    
    pieData.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;
      
      // Create arc path
      const x1 = Math.cos(currentAngle) * radius;
      const y1 = Math.sin(currentAngle) * radius;
      const x2 = Math.cos(endAngle) * radius;
      const y2 = Math.sin(endAngle) * radius;
      const x1Inner = Math.cos(currentAngle) * innerRadius;
      const y1Inner = Math.sin(currentAngle) * innerRadius;
      const x2Inner = Math.cos(endAngle) * innerRadius;
      const y2Inner = Math.sin(endAngle) * innerRadius;
      
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      
      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x2Inner} ${y2Inner} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner} Z`;
      
      const color = colorMap[item.color] || item.color;
      svg += `<path d="${path}" fill="${color}" stroke="white" stroke-width="2" />`;
      
      // Add label if slice is large enough
      if (sliceAngle > 0.1) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = (radius + innerRadius) / 2;
        const labelX = Math.cos(labelAngle) * labelRadius;
        const labelY = Math.sin(labelAngle) * labelRadius;
        const percent = Math.round((item.value / total) * 100);
        if (percent > 0) {
          svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="10" font-weight="bold">${percent}%</text>`;
        }
      }
      
      currentAngle = endAngle;
    });
    
    svg += '</g></svg>';
    return svg;
  };

  // Generate box plot SVG
  const generateBoxPlot = (data: {min: number; q1: number; median: number; q3: number; max: number; displayMax: number}): string => {
    const width = 800;
    const height = 128;
    const margin = { left: 40, right: 40 };
    const plotWidth = width - margin.left - margin.right;
    
    const range = data.displayMax - Math.min(data.min, 0);
    const getPosition = (value: number) => {
      const clampedValue = Math.min(value, data.displayMax);
      return margin.left + ((clampedValue - Math.min(data.min, 0)) / range) * plotWidth;
    };
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Main horizontal line
    svg += `<line x1="${getPosition(data.min)}" y1="${height / 2}" x2="${getPosition(Math.min(data.max, data.displayMax))}" y2="${height / 2}" stroke="#d1d5db" stroke-width="2" />`;
    
    // Box (Q1 to Q3)
    const boxLeft = getPosition(data.q1);
    const boxRight = getPosition(data.q3);
    const boxHeight = 48;
    svg += `<rect x="${boxLeft}" y="${height / 2 - boxHeight / 2}" width="${boxRight - boxLeft}" height="${boxHeight}" fill="#dbeafe" stroke="#93c5fd" stroke-width="1" />`;
    
    // Median line
    svg += `<line x1="${getPosition(data.median)}" y1="${height / 2 - boxHeight / 2}" x2="${getPosition(data.median)}" y2="${height / 2 + boxHeight / 2}" stroke="#2563eb" stroke-width="2" />`;
    
    // Whiskers
    svg += `<line x1="${getPosition(data.min)}" y1="${height / 2 - 24}" x2="${getPosition(data.min)}" y2="${height / 2 + 24}" stroke="#9ca3af" stroke-width="1" />`;
    svg += `<line x1="${getPosition(Math.min(data.max, data.displayMax))}" y1="${height / 2 - 24}" x2="${getPosition(Math.min(data.max, data.displayMax))}" y2="${height / 2 + 24}" stroke="#9ca3af" stroke-width="1" />`;
    
    // Connecting lines
    svg += `<line x1="${getPosition(data.min)}" y1="${height / 2}" x2="${getPosition(data.q1)}" y2="${height / 2}" stroke="#d1d5db" stroke-width="2" />`;
    svg += `<line x1="${getPosition(data.q3)}" y1="${height / 2}" x2="${getPosition(Math.min(data.max, data.displayMax))}" y2="${height / 2}" stroke="#d1d5db" stroke-width="2" />`;
    
    // Labels
    const labels = [
      { value: data.min, label: 'Min', y: height - 16 },
      { value: data.q1, label: 'Q1', y: 16 },
      { value: data.median, label: 'Median', y: height - 16 },
      { value: data.q3, label: 'Q3', y: 16 },
      { value: Math.min(data.max, data.displayMax), label: data.max > data.displayMax ? `Max (${data.max}s ▶)` : 'Max', y: height - 16 },
    ];
    
    labels.forEach(({ value, label, y }) => {
      const x = getPosition(value);
      svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="#6b7280" font-weight="600">${label}</text>`;
      svg += `<text x="${x}" y="${y + 12}" text-anchor="middle" font-size="10" fill="#6b7280">${value}s</text>`;
    });
    
    svg += '</svg>';
    return svg;
  };


  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tree Test Analysis Report - ${escapeHtml(data.name || 'Untitled Study')}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #111827;
      background: #ffffff;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    .header-meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 22px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }
    .chart-container {
      margin: 20px 0;
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }
    td {
      font-size: 14px;
      color: #111827;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      margin: 16px 0;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 2px;
    }
    .task-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 10px;
      }
      .section {
        page-break-inside: avoid;
      }
      .card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${escapeHtml(data.name || 'Untitled Study')}</h1>
      <div class="header-meta">
        <span>Creator: ${escapeHtml(data.creator || 'Unknown')}</span>
        <span>•</span>
        <span>Participants: ${data.participants.length}</span>
        <span>•</span>
        <span>Tasks: ${data.tasks.length}</span>
        <span>•</span>
        <span>Generated: ${formatDate(new Date())}</span>
      </div>
    </div>

    <!-- Overview Section -->
    <div class="section">
      <h2 class="section-title">Overview</h2>
      
      <!-- Tree Structure -->
      ${data.treeStructure && data.treeStructure.length > 0 ? `
      <div class="card">
        <div class="card-title">Tree Structure</div>
        ${renderTree(data.treeStructure)}
      </div>
      ` : ''}

      <!-- Key Metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value ${getMetricColor(stats.completionRate)}">${stats.completionRate}%</div>
          <div class="stat-label">Completion Rate</div>
          <div class="stat-label" style="margin-top: 4px;">${stats.completedParticipants} / ${stats.totalParticipants} participants</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${getMetricColor(stats.successRate)}">${stats.successRate}%</div>
          <div class="stat-label">Success Rate</div>
          <div class="stat-label" style="margin-top: 4px;">Average across all tasks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${getMetricColor(stats.directnessRate)}">${stats.directnessRate}%</div>
          <div class="stat-label">Directness</div>
          <div class="stat-label" style="margin-top: 4px;">Average across all tasks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(() => {
            const totalSeconds = Math.round(stats.medianCompletionTime);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          })()}</div>
          <div class="stat-label">Median Time</div>
          <div class="stat-label" style="margin-top: 4px;">Range: ${Math.round(stats.shortestCompletionTime)}s - ${Math.round(stats.longestCompletionTime)}s</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${getMetricColor(stats.overallScore)}">${stats.overallScore}</div>
          <div class="stat-label">Overall Score</div>
          <div class="stat-label" style="margin-top: 4px;">Weighted average (70% success, 30% directness)</div>
        </div>
      </div>

      <!-- Task Results Breakdown Chart -->
      <div class="card">
        <div class="card-title">Task Results Breakdown</div>
        <div class="legend">
          <div class="legend-item"><div class="legend-color" style="background: #22c55e;"></div><span>Direct Success</span></div>
          <div class="legend-item"><div class="legend-color" style="background: #86efac;"></div><span>Indirect Success</span></div>
          <div class="legend-item"><div class="legend-color" style="background: #ef4444;"></div><span>Direct Fail</span></div>
          <div class="legend-item"><div class="legend-color" style="background: #fca5a5;"></div><span>Indirect Fail</span></div>
          <div class="legend-item"><div class="legend-color" style="background: #64748b;"></div><span>Direct Skip</span></div>
          <div class="legend-item"><div class="legend-color" style="background: #cbd5e1;"></div><span>Indirect Skip</span></div>
        </div>
        <div class="chart-container">
          ${generateStackedBarChart()}
        </div>
      </div>
    </div>

    <!-- Tasks Section -->
    <div class="section">
      <h2 class="section-title">Tasks Analysis</h2>
      ${taskStats.map((task) => {
        const totalParticipants = task.stats.breakdown.total;
        const pieData = [
          { name: "Direct Success", value: task.stats.breakdown.directSuccess, color: "bg-green-500" },
          { name: "Indirect Success", value: task.stats.breakdown.indirectSuccess, color: "bg-green-300" },
          { name: "Direct Fail", value: task.stats.breakdown.directFail, color: "bg-red-500" },
          { name: "Indirect Fail", value: task.stats.breakdown.indirectFail, color: "bg-red-300" },
          { name: "Skip", value: task.stats.breakdown.directSkip + task.stats.breakdown.indirectSkip, color: "bg-gray-500" },
        ].filter((d) => d.value > 0);

        // Get participant paths for this task
        const pathMap = new Map<string, {path: string; count: number; resultType: string; resultColor: string}>();
        data.participants.forEach(p => {
          const result = p.taskResults.find(r => r.taskId === task.id || r.taskIndex === task.index);
          if (!result) return;
          const path = result.pathTaken || "";
          let resultType = "";
          let resultColor = "";
          if (result.skipped) {
            resultType = result.directPathTaken ? "Direct Skip" : "Indirect Skip";
            resultColor = result.directPathTaken ? "#9ca3af" : "#6b7280";
          } else if (result.successful) {
            resultType = result.directPathTaken ? "Direct Success" : "Indirect Success";
            resultColor = result.directPathTaken ? "#22c55e" : "#86efac";
          } else {
            resultType = result.directPathTaken ? "Direct Fail" : "Indirect Fail";
            resultColor = result.directPathTaken ? "#ef4444" : "#fca5a5";
          }
          const key = path + "||" + resultType;
          if (!pathMap.has(key)) {
            pathMap.set(key, { path, count: 0, resultType, resultColor });
          }
          pathMap.get(key)!.count++;
        });
        const participantPaths = Array.from(pathMap.values()).sort((a, b) => b.count - a.count);

        return `
        <div class="task-section">
          <div class="card">
            <div class="card-title">Task ${task.index}: ${escapeHtml(task.description)}</div>
            <p style="margin-bottom: 16px; color: #6b7280; font-size: 14px;">
              <strong>Expected Path${task.expectedAnswer.includes(",") ? "s" : ""}:</strong> ${escapeHtml(task.expectedAnswer)}
            </p>
            
            ${task.stats.parentNodeStats ? `
            <!-- Parent Node Success Rates -->
            <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <div class="card-title" style="font-size: 16px; margin-bottom: 12px;">Parent Node Success Rates</div>
              <table>
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Expected Path</th>
                    <th>Success Rate</th>
                    <th>Participants</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  ${task.stats.parentNodeStats.level1 ? (() => {
                    const margin = Math.sqrt((task.stats.parentNodeStats!.level1.rate * (100 - task.stats.parentNodeStats!.level1.rate)) / task.stats.parentNodeStats!.level1.total) * 1.96;
                    return `
                    <tr>
                      <td>1st Level</td>
                      <td style="font-family: monospace; font-size: 12px;">${escapeHtml(task.expectedAnswer.split('->')[0]?.trim() || task.stats.parentNodeStats!.level1.nodeName)}</td>
                      <td style="font-weight: bold; color: ${getMetricColorValue(task.stats.parentNodeStats!.level1.rate)}">${task.stats.parentNodeStats!.level1.rate.toFixed(1)}%</td>
                      <td>${task.stats.parentNodeStats!.level1.count} / ${task.stats.parentNodeStats!.level1.total}</td>
                      <td style="color: #6b7280; font-size: 12px;">±${margin.toFixed(1)}%</td>
                    </tr>
                    `;
                  })() : ''}
                  ${task.stats.parentNodeStats.level2 ? (() => {
                    const margin = Math.sqrt((task.stats.parentNodeStats!.level2!.rate * (100 - task.stats.parentNodeStats!.level2!.rate)) / task.stats.parentNodeStats!.level2!.total) * 1.96;
                    return `
                    <tr>
                      <td>2nd Level</td>
                      <td style="font-family: monospace; font-size: 12px;">${escapeHtml(task.expectedAnswer.split('->').slice(0, 2).join(' -> ').trim())}</td>
                      <td style="font-weight: bold; color: ${getMetricColorValue(task.stats.parentNodeStats!.level2!.rate)}">${task.stats.parentNodeStats!.level2!.rate.toFixed(1)}%</td>
                      <td>${task.stats.parentNodeStats!.level2!.count} / ${task.stats.parentNodeStats!.level2!.total}</td>
                      <td style="color: #6b7280; font-size: 12px;">±${margin.toFixed(1)}%</td>
                    </tr>
                    `;
                  })() : ''}
                  ${task.stats.parentNodeStats.level3 ? (() => {
                    const margin = Math.sqrt((task.stats.parentNodeStats!.level3!.rate * (100 - task.stats.parentNodeStats!.level3!.rate)) / task.stats.parentNodeStats!.level3!.total) * 1.96;
                    return `
                    <tr>
                      <td>3rd Level</td>
                      <td style="font-family: monospace; font-size: 12px;">${escapeHtml(task.expectedAnswer.split('->').slice(0, 3).join(' -> ').trim())}</td>
                      <td style="font-weight: bold; color: ${getMetricColorValue(task.stats.parentNodeStats!.level3!.rate)}">${task.stats.parentNodeStats!.level3!.rate.toFixed(1)}%</td>
                      <td>${task.stats.parentNodeStats!.level3!.count} / ${task.stats.parentNodeStats!.level3!.total}</td>
                      <td style="color: #6b7280; font-size: 12px;">±${margin.toFixed(1)}%</td>
                    </tr>
                    `;
                  })() : ''}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Task results</h3>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">Success and failure metrics from this task.</p>
            </div>

            <!-- Pie Chart and Stats Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
              <!-- Pie Chart -->
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="margin-bottom: 16px;">
                  ${generatePieChart(pieData, totalParticipants)}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 12px;">
                  ${pieData.map((item) => {
                    const colorMap: Record<string, string> = {
                      "bg-green-500": "#22c55e",
                      "bg-green-300": "#86efac",
                      "bg-red-500": "#ef4444",
                      "bg-red-300": "#fca5a5",
                      "bg-gray-500": "#6b7280",
                    };
                    return `
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="width: 12px; height: 12px; border-radius: 2px; background: ${colorMap[item.color] || item.color};"></div>
                      <span>${item.name}: ${item.value} (${Math.round((item.value / totalParticipants) * 100)}%)</span>
                    </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Stats Cards -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: ${getMetricColorValue(task.stats.success.rate)}">${task.stats.success.rate}%</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Success Rate</div>
                  <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">${task.stats.breakdown.directSuccess + task.stats.breakdown.indirectSuccess} / ${totalParticipants} participants</div>
                  <div style="font-size: 10px; color: #9ca3af;">±${task.stats.success.margin}%</div>
                </div>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: ${getMetricColorValue(task.stats.directness.rate)}">${task.stats.directness.rate}%</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Directness</div>
                  <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">${task.stats.breakdown.directSuccess + task.stats.breakdown.directFail} / ${totalParticipants} participants</div>
                  <div style="font-size: 10px; color: #9ca3af;">±${task.stats.directness.margin}%</div>
                </div>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #111827">${task.stats.time.median}s</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Median Time</div>
                </div>
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: ${getMetricColorValue(task.stats.score)}">${task.stats.score}</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Overall Score</div>
                </div>
              </div>
            </div>

            <!-- Box Plot -->
            <div style="margin-bottom: 32px;">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 16px;">Time Distribution</h4>
              ${generateBoxPlot({
                min: task.stats.time.min,
                q1: task.stats.time.q1,
                median: task.stats.time.median,
                q3: task.stats.time.q3,
                max: task.stats.time.max,
                displayMax: Math.max(task.stats.time.max, 60),
              })}
            </div>

            <!-- Participant Paths -->
            <div style="margin-bottom: 32px;">
              <div class="card-title" style="margin-bottom: 16px;">Participant Paths</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 160px;">Result</th>
                    <th style="width: 160px; text-align: center;"># of Participants</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  ${participantPaths.length > 0 ? participantPaths.map((item) => `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${item.resultColor};"></div>
                        <span style="font-weight: 600; color: #374151;">${item.resultType}</span>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <span style="font-weight: 600;">${item.count}</span>
                      <span style="color: #6b7280; margin-left: 4px;">(${Math.round((item.count / totalParticipants) * 100)}%)</span>
                    </td>
                    <td>
                      <div style="font-family: monospace; font-size: 12px; color: #4b5563; word-break: break-all;">
                        ${escapeHtml(item.path.split('/').filter(Boolean).join(' > ') || "(No path taken)")}
                      </div>
                    </td>
                  </tr>
                  `).join('') : `
                  <tr>
                    <td colspan="3" style="text-align: center; color: #6b7280; padding: 16px;">No paths recorded.</td>
                  </tr>
                  `}
                </tbody>
              </table>
            </div>

            <!-- First-Clicked Parent Labels -->
            ${task.stats.parentClicks && task.stats.parentClicks.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <div class="card-title" style="margin-bottom: 16px;">First-Clicked Parent Labels</div>
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th style="text-align: center;">Correct First Click</th>
                    <th style="text-align: center;">Clicked First</th>
                    <th style="text-align: center;">Clicked During Task</th>
                  </tr>
                </thead>
                <tbody>
                  ${task.stats.parentClicks.map((click) => `
                  <tr>
                    <td style="font-family: monospace; font-size: 12px;">${escapeHtml(click.path)}</td>
                    <td style="text-align: center;">
                      <span style="color: ${click.isCorrect ? '#16a34a' : '#dc2626'}; font-weight: 600;">${click.isCorrect ? 'Yes' : 'No'}</span>
                    </td>
                    <td style="text-align: center;">${click.firstClickCount} (${click.firstClickPercentage}%)</td>
                    <td style="text-align: center;">${click.totalClickCount} (${click.totalClickPercentage}%)</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Correct Path Distribution -->
            ${task.stats.pathDistribution && task.stats.pathDistribution.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <div class="card-title" style="margin-bottom: 16px;">Correct Path Distribution</div>
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th style="text-align: center;">Count</th>
                    <th style="text-align: center;">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${task.stats.pathDistribution.map((dest) => `
                  <tr>
                    <td style="font-family: monospace; font-size: 12px;">${escapeHtml(dest.path)}</td>
                    <td style="text-align: center;">${dest.count}</td>
                    <td style="text-align: center;">${dest.percentage}%</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Incorrect Destinations -->
            ${task.stats.incorrectDestinations && task.stats.incorrectDestinations.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <div class="card-title" style="margin-bottom: 16px;">Incorrect Destinations</div>
              <table>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th style="text-align: center;">Count</th>
                    <th style="text-align: center;">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${task.stats.incorrectDestinations.map((dest) => `
                  <tr>
                    <td style="font-family: monospace; font-size: 12px;">${escapeHtml(dest.path)}</td>
                    <td style="text-align: center;">${dest.count}</td>
                    <td style="text-align: center;">${dest.percentage}%</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : '<div style="margin-bottom: 32px;"><div class="card-title" style="margin-bottom: 16px;">Incorrect Destinations</div><p style="text-align: center; color: #6b7280; padding: 16px;">No incorrect destinations recorded.</p></div>'}

            <!-- Confidence Ratings -->
            ${task.stats.confidenceRatings && task.stats.confidenceRatings.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <div class="card-title" style="margin-bottom: 16px;">Confidence Ratings</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 200px;">Answer</th>
                    <th>Outcome Breakdown</th>
                    <th style="width: 100px; text-align: center;">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  ${task.stats.confidenceRatings.sort((a, b) => b.value - a.value).map((rating) => {
                    const total = rating.count;
                    const hasData = total > 0;
                    const getConfidenceLabel = (val: number) => {
                      if (val === 7) return "Very Confident";
                      if (val === 6) return "Confident";
                      if (val === 5) return "Somewhat Confident";
                      if (val === 4) return "Neutral";
                      if (val === 3) return "Somewhat Not Confident";
                      if (val === 2) return "Not Confident";
                      return "Not Confident At All";
                    };
                    return `
                    <tr>
                      <td style="font-weight: 600;">${getConfidenceLabel(rating.value)}</td>
                      <td>
                        ${hasData ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="flex: 1; display: flex; height: 32px; overflow: hidden; border-radius: 4px;">
                            ${rating.breakdown.directSuccess > 0 ? `
                            <div style="background: #22c55e; width: ${rating.breakdown.directSuccessPercentage}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">
                              ${rating.breakdown.directSuccessPercentage >= 15 ? `${rating.breakdown.directSuccess} (${rating.breakdown.directSuccessPercentage}%)` : ''}
                            </div>
                            ` : ''}
                            ${rating.breakdown.indirectSuccess > 0 ? `
                            <div style="background: #86efac; width: ${rating.breakdown.indirectSuccessPercentage}%; display: flex; align-items: center; justify-content: center; color: #374151; font-size: 11px; font-weight: 600;">
                              ${rating.breakdown.indirectSuccessPercentage >= 15 ? `${rating.breakdown.indirectSuccess}` : ''}
                            </div>
                            ` : ''}
                            ${rating.breakdown.directFail > 0 ? `
                            <div style="background: #ef4444; width: ${rating.breakdown.directFailPercentage}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">
                              ${rating.breakdown.directFailPercentage >= 15 ? `${rating.breakdown.directFail}` : ''}
                            </div>
                            ` : ''}
                            ${rating.breakdown.indirectFail > 0 ? `
                            <div style="background: #fca5a5; width: ${rating.breakdown.indirectFailPercentage}%; display: flex; align-items: center; justify-content: center; color: #374151; font-size: 11px; font-weight: 600;">
                              ${rating.breakdown.indirectFailPercentage >= 15 ? `${rating.breakdown.indirectFail}` : ''}
                            </div>
                            ` : ''}
                          </div>
                        </div>
                        ` : '<span style="color: #9ca3af; font-size: 12px;">No data</span>'}
                      </td>
                      <td style="text-align: center; font-weight: 600;">${rating.count}</td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 2px; background: #22c55e;"></div>
                  <span>Direct Success</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 2px; background: #86efac;"></div>
                  <span>Indirect Success</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 2px; background: #ef4444;"></div>
                  <span>Direct Fail</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 2px; background: #fca5a5;"></div>
                  <span>Indirect Fail</span>
                </div>
              </div>
            </div>
            ` : '<div style="margin-bottom: 32px;"><div class="card-title" style="margin-bottom: 16px;">Confidence Ratings</div><p style="text-align: center; color: #6b7280; padding: 16px;">No confidence ratings recorded.</p></div>'}
          </div>
        </div>
        `;
      }).join('')}
    </div>

    <!-- Participants Section -->
    <div class="section">
      <h2 class="section-title">Participants</h2>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Status</th>
              <th>Started</th>
              <th>Duration</th>
              <th style="text-align: center;">Success Rate</th>
              <th style="text-align: center;">Directness</th>
            </tr>
          </thead>
          <tbody>
            ${data.participants.map((p, index) => {
              const completedTasks = p.taskResults.filter(r => !r.skipped);
              const successfulTasks = completedTasks.filter(r => r.successful);
              const directTasks = completedTasks.filter(r => r.directPathTaken);
              const successRate = completedTasks.length > 0 ? Math.round((successfulTasks.length / completedTasks.length) * 100) : 0;
              const directnessRate = completedTasks.length > 0 ? Math.round((directTasks.length / completedTasks.length) * 100) : 0;
              
              const formatDuration = (seconds: number | null) => {
                if (!seconds) return "N/A";
                const mins = Math.floor(seconds / 60);
                const secs = Math.round(seconds % 60);
                return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
              };

              const formatDate = (date: Date | null) => {
                if (!date) return "N/A";
                return new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              };

              const getResultBadge = (result: any) => {
                if (result.skipped) {
                  return '<span style="font-size: 12px; color: #6b7280;">Skipped</span>';
                }
                if (result.successful && result.directPathTaken) {
                  return '<span style="font-size: 12px; font-weight: 600; color: #16a34a;">✓ Direct Success</span>';
                }
                if (result.successful && !result.directPathTaken) {
                  return '<span style="font-size: 12px; font-weight: 600; color: #22c55e;">✓ Indirect Success</span>';
                }
                if (!result.successful && result.directPathTaken) {
                  return '<span style="font-size: 12px; font-weight: 600; color: #dc2626;">✗ Direct Fail</span>';
                }
                return '<span style="font-size: 12px; font-weight: 600; color: #ef4444;">✗ Indirect Fail</span>';
              };
              
              return `
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <td style="font-weight: 600;">Participant ${index + 1}</td>
                <td>
                  ${p.status === "Completed" ? '<span style="color: #16a34a; font-size: 14px;">✓ Completed</span>' : '<span style="color: #6b7280; font-size: 14px;">○ Abandoned</span>'}
                </td>
                <td style="font-size: 14px; color: #4b5563;">${formatDate(p.startedAt)}</td>
                <td style="font-size: 14px; color: #4b5563;">${formatDuration(p.durationSeconds)}</td>
                <td style="text-align: center; font-weight: 600;">${successRate}%</td>
                <td style="text-align: center; font-weight: 600;">${directnessRate}%</td>
              </tr>
              <tr>
                <td colspan="6" style="background: #f9fafb; padding: 20px;">
                  <div style="margin-bottom: 16px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
                      <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Participant ID</div>
                        <div style="font-family: monospace; font-size: 14px; font-weight: 600;">${escapeHtml(p.id)}</div>
                      </div>
                      <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Duration</div>
                        <div style="font-size: 14px; font-weight: 600;">${formatDuration(p.durationSeconds)}</div>
                      </div>
                      <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Timeline</div>
                        <div style="font-size: 12px;">
                          <div>Started ${formatDate(p.startedAt)}</div>
                          ${p.completedAt ? `<div style="color: #16a34a; margin-top: 4px;">Completed ${formatDate(p.completedAt)}</div>` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; background: white;">
                    <table style="width: 100%; font-size: 14px;">
                      <thead style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                        <tr>
                          <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Task</th>
                          <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Result</th>
                          <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Path Taken</th>
                          <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Confidence</th>
                          <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${p.taskResults.map((result) => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 12px; font-weight: 600;">T${result.taskIndex}</td>
                          <td style="padding: 12px;">${getResultBadge(result)}</td>
                          <td style="padding: 12px;">
                            <span style="font-family: monospace; font-size: 12px; color: #4b5563;">
                              ${escapeHtml(result.pathTaken || "N/A")}
                            </span>
                          </td>
                          <td style="padding: 12px;">
                            ${result.confidenceRating ? `
                            <span style="font-size: 12px;">
                              ${result.confidenceRating}/7 
                              <span style="color: #6b7280;">
                                ${result.confidenceRating >= 6 ? "High" : result.confidenceRating >= 4 ? "Med" : "Low"}
                              </span>
                            </span>
                            ` : '<span style="font-size: 12px; color: #9ca3af;">N/A</span>'}
                          </td>
                          <td style="padding: 12px; font-size: 12px; color: #4b5563;">${result.completionTimeSeconds}s</td>
                        </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Download the HTML report as a file
 */
export function downloadHtmlReport(data: UploadedData): void {
  const html = generateHtmlReport(data);
  const filename = `tree-test-report-${data.name ? data.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'untitled'}-${new Date().toISOString().split('T')[0]}.html`;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

