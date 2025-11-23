import { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import type { UploadedData } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, ChevronDown } from "lucide-react";

interface PietreeTabProps {
    data: UploadedData;
}

interface NodeStats {
    rightPath: number;
    wrongPath: number;
    back: number;
    nominated: number;
    skipped: number;
    total: number;
}

interface TreeNode extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    path: string;
    stats: NodeStats;
    children?: TreeNode[];
    isCorrectPath?: boolean;
    x?: number;
    y?: number;
    parentId?: string;
}

interface TreeLink extends d3.SimulationLinkDatum<TreeNode> {
    source: string | TreeNode;
    target: string | TreeNode;
    value: number;
    isCorrectPath: boolean;
}

export function PietreeTab({ data }: PietreeTabProps) {
    const [selectedTaskId, setSelectedTaskId] = useState<string>(data.tasks[0]?.id || "");
    const [layoutMode, setLayoutMode] = useState<'force' | 'tree'>('force');
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
    const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // Tooltip state
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState<TreeNode | null>(null);

    const selectedTask = useMemo(() =>
        data.tasks.find(t => t.id === selectedTaskId),
        [data.tasks, selectedTaskId]);

    // Handle resize
    useEffect(() => {
        if (!wrapperRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height || 600
                    });
                }
            }
        });

        resizeObserver.observe(wrapperRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Data Processing Logic
    const graphData = useMemo(() => {
        console.log("PietreeTab: Recalculating graphData", { selectedTaskId });

        if (!selectedTask) {
            return null;
        }

        const nodesMap = new Map<string, TreeNode>();
        const linksMap = new Map<string, TreeLink>();

        // Helper to get or create node
        const getNode = (path: string, name: string): TreeNode => {
            if (!nodesMap.has(path)) {
                // Calculate parent ID from path
                const parts = path.split('/').filter(Boolean);
                let parentId: string | undefined = undefined;
                if (parts.length > 1) {
                    // Reconstruct parent path
                    const parentParts = parts.slice(0, -1);
                    parentId = '/' + parentParts.join('/');
                    // Handle root case if parent is just "/" which might not match logic depending on root naming
                    // But here root is usually /Home. /Home/Products -> parent /Home. Correct.
                }

                nodesMap.set(path, {
                    id: path,
                    name: name,
                    path: path,
                    stats: { rightPath: 0, wrongPath: 0, back: 0, nominated: 0, skipped: 0, total: 0 },
                    x: 0,
                    y: 0,
                    parentId: parentId // Add parentId for tree layout
                } as TreeNode);
            }
            return nodesMap.get(path)!;
        };

        // Initialize root
        const rootPath = data.treeStructure?.[0]?.name ? `/${data.treeStructure[0].name}` : "/Home";
        const rootName = data.treeStructure?.[0]?.name || "Home";
        getNode(rootPath, rootName);

        // Expected path set for quick lookup
        const expectedPath = selectedTask.expectedAnswer || "";
        const normalizedExpected = expectedPath.toLowerCase();

        // Process each participant
        data.participants.forEach(p => {
            const result = p.taskResults.find(r => r.taskId === selectedTask.id);
            if (!result) return;

            const pathStr = result.pathTaken;

            // Handle empty path or immediate skip at root
            if (!pathStr) {
                if (result.skipped) {
                    const root = getNode(rootPath, rootName);
                    root.stats.skipped++;
                    root.stats.total++;
                }
                return;
            }

            const parts = pathStr.split('/').filter(Boolean);

            if (parts.length === 0) {
                if (result.skipped) {
                    const root = getNode(rootPath, rootName);
                    root.stats.skipped++;
                    root.stats.total++;
                }
                return;
            }

            let currentPath = "";
            let prevNode: TreeNode | null = null;

            parts.forEach((part, i) => {
                const name = part;
                currentPath += `/${name}`;
                const node = getNode(currentPath, name);

                node.stats.total++;

                const isLast = i === parts.length - 1;
                const isCorrectSoFar = normalizedExpected.startsWith(currentPath.toLowerCase());

                if (isLast) {
                    if (result.skipped) {
                        node.stats.skipped++;
                    } else {
                        node.stats.nominated++;
                    }
                } else {
                    // Intermediate node
                    if (isCorrectSoFar) {
                        node.stats.rightPath++;
                    } else {
                        node.stats.wrongPath++;
                    }
                }

                // Create Link
                if (prevNode) {
                    const linkId = `${prevNode.path}->${node.path}`;
                    if (!linksMap.has(linkId)) {
                        linksMap.set(linkId, {
                            source: prevNode.id,
                            target: node.id,
                            value: 0,
                            isCorrectPath: isCorrectSoFar
                        });
                    }
                    linksMap.get(linkId)!.value++;
                }

                prevNode = node;
            });
        });

        const nodes = Array.from(nodesMap.values());
        const links = Array.from(linksMap.values());
        console.log("PietreeTab: Graph data generated", { nodesCount: nodes.length, linksCount: links.length });

        return { nodes, links };
    }, [selectedTask, data]);

    // D3 Rendering Logic
    useEffect(() => {
        if (!graphData || !svgRef.current || dimensions.width === 0) return;

        const { width, height } = dimensions;
        const totalParticipants = Math.max(1, data.participants.length);
        const maxLinkThickness = 20;
        const maxNodeRadius = 30;
        const minNodeRadius = 10;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g");

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        zoomBehavior.current = zoom;
        svg.call(zoom);

        // Helper to calculate radius based on traffic
        const getRadius = (d: TreeNode) => {
            // Cap at 1.5x max radius for nodes with heavy backtracking/revisits
            return Math.max(minNodeRadius, Math.min(maxNodeRadius * 1.5, (d.stats.total / totalParticipants) * maxNodeRadius));
        };

        // Manually resolve links to objects for both layouts
        const nodeById = new Map(graphData.nodes.map(n => [n.id, n]));
        graphData.links.forEach(l => {
            if (typeof l.source === 'string') l.source = nodeById.get(l.source) as TreeNode;
            if (typeof l.target === 'string') l.target = nodeById.get(l.target) as TreeNode;
        });

        let simulation: d3.Simulation<TreeNode, TreeLink> | null = null;

        if (layoutMode === 'tree') {
            // TREE LAYOUT
            try {
                const root = d3.stratify<TreeNode>()
                    .id(d => d.id)
                    .parentId(d => d.parentId as string | undefined)
                    (graphData.nodes);

                const treeLayout = d3.tree<TreeNode>()
                    .nodeSize([80, 250]); // [height, width] - swap for horizontal

                treeLayout(root);

                // Apply positions
                root.descendants().forEach(d => {
                    // Swap x and y for left-to-right layout
                    // d.x is vertical index, d.y is depth
                    // We want depth on X axis
                    d.data.x = d.y; // Depth -> X
                    d.data.y = d.x; // Vertical -> Y
                });

                // Center the tree vertically
                const yExtent = d3.extent(graphData.nodes, d => d.y) as [number, number];
                const yCenter = (yExtent[0] + yExtent[1]) / 2;
                const yOffset = height / 2 - yCenter;

                // Start from left with some padding
                const xOffset = 100;

                graphData.nodes.forEach(d => {
                    d.y! += yOffset;
                    d.x! += xOffset;
                });

            } catch (e) {
                console.error("Tree layout failed, likely due to non-tree structure or cycles", e);
                // Fallback or alert? For now just log.
            }
        } else {
            // FORCE LAYOUT
            simulation = d3.forceSimulation<TreeNode>(graphData.nodes)
                .force("link", d3.forceLink<TreeNode, TreeLink>(graphData.links).id(d => d.id).distance(100))
                .force("charge", d3.forceManyBody().strength(-500))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("x", d3.forceX(width / 2).strength(0.05))
                .force("y", d3.forceY(height / 2).strength(0.05))
                .force("collide", d3.forceCollide().radius(d => getRadius(d as TreeNode) + 15)) // Dynamic collision radius
                .stop();

            simulation.tick(300);
        }

        // Render Links
        const link = g.append("g")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(graphData.links)
            .join("line")
            .attr("x1", d => (d.source as TreeNode).x!)
            .attr("y1", d => (d.source as TreeNode).y!)
            .attr("x2", d => (d.target as TreeNode).x!)
            .attr("y2", d => (d.target as TreeNode).y!)
            .attr("stroke-width", d => Math.max(2, (d.value / totalParticipants) * maxLinkThickness)) // Dynamic thickness
            .attr("stroke", d => d.isCorrectPath ? "#22c55e" : "#d1d5db");

        // Render Nodes (Pie Charts)
        const node = g.append("g")
            .selectAll("g")
            .data(graphData.nodes)
            .join("g")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .call(d3.drag<any, any>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Tooltip Events
        node.on("mouseover", (event, d) => {
            setTooltipData(d);
            if (tooltipRef.current) {
                tooltipRef.current.style.display = "block";
                tooltipRef.current.style.opacity = "1";
                const [x, y] = d3.pointer(event, wrapperRef.current);
                tooltipRef.current.style.left = `${x + 20}px`;
                tooltipRef.current.style.top = `${y + 20}px`;
            }
        })
            .on("mousemove", (event) => {
                if (tooltipRef.current) {
                    const [x, y] = d3.pointer(event, wrapperRef.current);
                    tooltipRef.current.style.left = `${x + 20}px`;
                    tooltipRef.current.style.top = `${y + 20}px`;
                }
            })
            .on("mouseout", () => {
                if (tooltipRef.current) {
                    tooltipRef.current.style.opacity = "0";
                    tooltipRef.current.style.display = "none";
                }
            });

        // Draw Pie Slices
        node.each(function (d) {
            const nodeG = d3.select(this);
            const radius = getRadius(d);

            // Pie Chart Generator with dynamic radius
            const arc = d3.arc<d3.PieArcDatum<any>>()
                .innerRadius(0)
                .outerRadius(radius);

            const statsData = [
                { label: "Right Path", value: d.stats.rightPath, color: "#22c55e" },
                { label: "Wrong Path", value: d.stats.wrongPath, color: "#ef4444" },
                { label: "Back", value: d.stats.back, color: "#3b82f6" },
                { label: "Nominated", value: d.stats.nominated, color: "#facc15" },
                { label: "Skipped", value: d.stats.skipped, color: "#d1d5db" }
            ].filter(s => s.value > 0);

            const pieData = d3.pie<any>().value(d => d.value).sort(null)(statsData);

            nodeG.selectAll("path")
                .data(pieData)
                .join("path")
                .attr("d", arc as any)
                .attr("fill", d => d.data.color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);

            // Node Label
            nodeG.append("text")
                .text(d.name)
                .attr("x", radius + 5) // Offset label by radius
                .attr("y", 5)
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("fill", "#374151")
                .style("pointer-events", "none")
                .style("text-shadow", "1px 1px 0 #fff");
        });

        // Restart simulation gently for interactivity
        if (simulation) {
            simulation.restart();
            simulation.on("tick", ticked);
        }

        function ticked() {
            link
                .attr("x1", d => (d.source as TreeNode).x!)
                .attr("y1", d => (d.source as TreeNode).y!)
                .attr("x2", d => (d.target as TreeNode).x!)
                .attr("y2", d => (d.target as TreeNode).y!);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        }

        function dragstarted(event: any, d: TreeNode) {
            if (layoutMode === 'force' && simulation) {
                // if (!event.active) simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: TreeNode) {
            d.fx = event.x;
            d.fy = event.y;

            // Manually update position for immediate feedback without running full simulation
            d.x = event.x;
            d.y = event.y;

            ticked();
        }

        function dragended(event: any, d: TreeNode) {
            if (layoutMode === 'force' && simulation) {
                if (!event.active) simulation.alphaTarget(0);
            }
            // Keep the node pinned where the user dropped it
            // d.fx = null;
            // d.fy = null;
        }

        // Auto-fit immediately
        const bounds = g.node()?.getBBox();
        if (bounds && width && height && bounds.width > 0 && bounds.height > 0) {
            const padding = 40;
            const fullWidth = width - padding * 2;
            const fullHeight = height - padding * 2;

            let scale = 0.85 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);

            // Clamp scale to prevent extreme zooming out or in
            scale = Math.max(0.2, Math.min(2, scale));

            const midX = bounds.x + bounds.width / 2;
            const midY = bounds.y + bounds.height / 2;

            const translate = [
                width / 2 - scale * midX,
                height / 2 - scale * midY
            ];

            console.log("PietreeTab: Auto-fitting", { bounds, scale, translate });

            svg.call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        } else {
            console.warn("PietreeTab: Could not auto-fit, invalid bounds", bounds);
        }

    }, [graphData, dimensions, layoutMode]);

    const handleZoomIn = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 1.2);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 0.8);
        }
    };

    const handleFit = () => {
        if (svgRef.current && wrapperRef.current && zoomBehavior.current) {
            const svg = d3.select(svgRef.current);
            const g = svg.select("g");
            const bounds = (g.node() as SVGGElement)?.getBBox();
            const width = dimensions.width;
            const height = dimensions.height;

            if (bounds && width && height && bounds.width > 0) {
                const padding = 40;
                const fullWidth = width - padding * 2;
                const fullHeight = height - padding * 2;

                const midX = bounds.x + bounds.width / 2;
                const midY = bounds.y + bounds.height / 2;
                let scale = 0.85 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);

                // Clamp scale
                scale = Math.max(0.2, Math.min(2, scale));

                const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

                console.log("PietreeTab: Manual Fit", { scale, translate });

                svg.transition().duration(750).call(
                    zoomBehavior.current.transform,
                    d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                );
            }
        }
    };

    if (!graphData || graphData.nodes.length === 0) {
        return (
            <Card>
                <CardContent className="flex h-[400px] items-center justify-center">
                    <p className="text-muted-foreground">No data available for this task.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Pietree Analysis</CardTitle>
                    <CardDescription>
                        Visualize participant paths and behaviors for a specific task.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
                            <div className="w-full md:w-[300px] relative shrink-0">
                                <select
                                    className="w-full h-10 pl-3 pr-10 text-sm border rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedTaskId}
                                    onChange={(e) => setSelectedTaskId(e.target.value)}
                                >
                                    {data.tasks.map(task => (
                                        <option key={task.id} value={task.id}>
                                            {task.index}. {task.description}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                            {selectedTask && (
                                <div className="text-sm text-muted-foreground break-words min-w-0">
                                    <strong>Expected Path:</strong> {selectedTask.expectedAnswer}
                                </div>
                            )}
                        </div>

                        {/* Layout Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-md border shrink-0 self-start xl:self-center">
                            <button
                                onClick={() => setLayoutMode('force')}
                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${layoutMode === 'force' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Radial (Force)
                            </button>
                            <button
                                onClick={() => setLayoutMode('tree')}
                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${layoutMode === 'tree' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Linear (Tree)
                            </button>
                        </div>
                    </div>

                    <div
                        ref={wrapperRef}
                        className="relative w-full h-[600px] border rounded-lg bg-white overflow-hidden"
                    >
                        <svg ref={svgRef} width="100%" height="100%" className="cursor-move"></svg>

                        {/* Custom Tooltip */}
                        <div
                            ref={tooltipRef}
                            className="absolute z-50 bg-white p-4 rounded-lg shadow-xl border border-slate-200 pointer-events-none transition-opacity duration-150 min-w-[250px]"
                            style={{ display: 'none', opacity: 0 }}
                        >
                            {tooltipData && (
                                <>
                                    <h3 className="font-bold text-lg mb-2 text-slate-800">{tooltipData.name}</h3>
                                    <p className="text-sm text-slate-600 mb-3">
                                        Participants came here <span className="font-semibold">{tooltipData.stats.total}</span> times and clicked:
                                    </p>
                                    <div className="space-y-2">
                                        {[
                                            { label: "Correct path", value: tooltipData.stats.rightPath, color: "bg-green-500" },
                                            { label: "Incorrect path", value: tooltipData.stats.wrongPath, color: "bg-red-500" },
                                            { label: "Nominated Correct", value: tooltipData.stats.nominated, color: "bg-yellow-400" },
                                            { label: "Backtracked", value: tooltipData.stats.back, color: "bg-blue-500" },
                                            { label: "Skip task", value: tooltipData.stats.skipped, color: "bg-gray-300" }
                                        ].filter(item => item.value > 0).map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                                                    <span className="text-slate-700">{item.label}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">{item.value}</span>
                                                    <span className="text-slate-500 w-12 text-right">
                                                        {Math.round((item.value / tooltipData.stats.total) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <Button variant="secondary" size="icon" title="Zoom In" onClick={handleZoomIn}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="icon" title="Zoom Out" onClick={handleZoomOut}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" size="icon" title="Fit to Screen" onClick={handleFit}>
                                <Maximize className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Legend */}
                        <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-sm border text-xs space-y-2 backdrop-blur-sm pointer-events-none">
                            <div className="font-semibold mb-1">Node Segments</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Right Path</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Wrong Path</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Backtracked</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Nominated Correct</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300"></div> Skipped</div>
                            <div className="font-semibold mt-3 mb-1">Links</div>
                            <div className="flex items-center gap-2"><div className="w-8 h-1 bg-green-500/50"></div> Correct Path</div>
                            <div className="flex items-center gap-2"><div className="w-8 h-1 bg-gray-300"></div> Incorrect Path</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
