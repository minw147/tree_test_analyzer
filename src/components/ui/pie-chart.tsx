import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface PieChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
}

const colorMap = {
    "bg-green-500": "#22c55e",
    "bg-green-300": "#86efac",
    "bg-red-500": "#ef4444",
    "bg-red-300": "#fca5a5",
    "bg-gray-500": "#6b7280",
    "bg-gray-300": "#d1d5db",
};

export function PieChart({ data }: PieChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data.length) return;

        const width = 192;
        const height = 192;
        const radius = Math.min(width, height) / 2;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const pie = d3
            .pie<(typeof data)[0]>()
            .value((d) => d.value)
            .sort(null);

        const arc = d3
            .arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

        // Calculate total for percentages
        const total = data.reduce((acc, curr) => acc + curr.value, 0);

        const arcs = g.selectAll("arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .attr("d", arc as any)
            .attr("fill", (d) => colorMap[d.data.color as keyof typeof colorMap] || d.data.color)
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        // Add labels
        arcs.append("text")
            .attr("transform", (d) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return `translate(${arc.centroid(d as any)})`;
            })
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .text((d) => {
                const percent = (d.data.value / total) * 100;
                return Math.round(percent) > 0 ? `${Math.round(percent)}%` : "";
            })
            .style("fill", "white")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("pointer-events", "none");
    }, [data]);

    return <svg ref={svgRef} viewBox="0 0 192 192" className="h-full w-full" />;
}
