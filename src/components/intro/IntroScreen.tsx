import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
    Shield, 
    Server, 
    Gift, 
    BarChart3, 
    Sparkles,
    ArrowRight
} from "lucide-react";

interface IntroScreenProps {
    onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
    const navigate = useNavigate();
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        // Entrance animation
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleStart = () => {
        onComplete();
        navigate("/");
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            handleStart();
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    const features = [
        {
            icon: Shield,
            title: "High Data Privacy",
            description: "Private & secure",
            color: "blue"
        },
        {
            icon: Server,
            title: "Self-Hosted Backend",
            description: "Your infrastructure",
            color: "purple"
        },
        {
            icon: Gift,
            title: "Completely Free",
            description: "No hidden costs",
            color: "blue"
        },
        {
            icon: BarChart3,
            title: "Advanced Data Viz",
            description: "Powerful analytics",
            color: "purple"
        },
        {
            icon: Sparkles,
            title: "AI-Ready Summaries",
            description: "AI-formatted data",
            color: "blue"
        }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto overflow-x-hidden relative" style={{
            backgroundImage: 'linear-gradient(to right, rgba(219, 234, 254, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(219, 234, 254, 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
        }}>
            {/* Subtle Background Tree Visualization */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <TreeBackgroundVisualization />
            </div>

            <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 lg:py-8 relative z-10">
                <div className="max-w-4xl w-full mx-auto">
                    {/* Centered Content */}
                    <div className={`space-y-6 sm:space-y-7 lg:space-y-8 text-center ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'} transition-all duration-700`}>
                        {/* Logo */}
                        <div>
                            <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                                <span className="text-purple-600">Tree</span>
                                <span className="text-blue-600">Path</span>
                            </span>
                        </div>

                        {/* Tagline */}
                        <div className="space-y-6">
                            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl leading-relaxed mx-auto">
                                The{' '}
                                <span className="font-bold text-purple-600">private</span>
                                ,{' '}
                                <span className="font-bold text-blue-600">self-hosted</span>
                                {' '}tree testing tool for modern UX research.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 sm:space-y-4">
                            {/* First 3 items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
                                {features.slice(0, 3).map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div
                                            key={feature.title}
                                            className={`group flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-white/50 backdrop-blur-sm border-2 border-gray-200/60 hover:border-blue-300/80 hover:bg-blue-50/20 hover:shadow-lg hover:scale-105 transition-[transform,background-color,border-color,box-shadow] duration-50 cursor-pointer ${
                                                isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                                            }`}
                                            style={{ transitionDelay: `${300 + index * 100}ms` }}
                                        >
                                            <div className={`p-3 rounded-xl mb-3 ${
                                                feature.color === 'blue' 
                                                    ? 'bg-blue-50' 
                                                    : 'bg-purple-50'
                                            }`}>
                                                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${
                                                    feature.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                                                }`} />
                                            </div>
                                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1">{feature.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 leading-tight">{feature.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Last 2 items - centered */}
                            <div className="flex justify-center gap-4 sm:gap-5 max-w-5xl mx-auto">
                                {features.slice(3).map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div
                                            key={feature.title}
                                            className={`group flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-white/50 backdrop-blur-sm border-2 border-gray-200/60 hover:border-blue-300/80 hover:bg-blue-50/20 hover:shadow-lg hover:scale-105 transition-all duration-150 cursor-pointer w-full max-w-sm ${
                                                isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                                            }`}
                                            style={{ transitionDelay: `${300 + (index + 3) * 100}ms` }}
                                        >
                                            <div className={`p-3 rounded-xl mb-3 ${
                                                feature.color === 'blue' 
                                                    ? 'bg-blue-50' 
                                                    : 'bg-purple-50'
                                            }`}>
                                                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${
                                                    feature.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                                                }`} />
                                            </div>
                                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1">{feature.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 leading-tight">{feature.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className={`pt-3 sm:pt-4 ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'} transition-all duration-700 delay-700`}>
                            <Button
                                onClick={handleStart}
                                size="lg"
                                className="px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-xl group"
                            >
                                Start Testing
                                <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:translate-x-1" />
                            </Button>
                            <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to start
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TreeBackgroundVisualization() {
    return (
        <svg
            className="w-full h-full"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.25 }}
        >
            {/* Simplified tree structure - fewer nodes and links */}
            {/* Root node - Blue */}
            <circle cx="600" cy="250" r="20" fill="#3b82f6" />
            
            {/* Level 1 nodes - 3 nodes */}
            <circle cx="450" cy="400" r="18" fill="#9333ea" />
            <circle cx="600" cy="400" r="18" fill="#3b82f6" />
            <circle cx="750" cy="400" r="18" fill="#9333ea" />
            
            {/* Level 2 nodes - 4 nodes */}
            <circle cx="400" cy="550" r="16" fill="#64748b" />
            <circle cx="550" cy="550" r="16" fill="#3b82f6" />
            <circle cx="650" cy="550" r="16" fill="#9333ea" />
            <circle cx="800" cy="550" r="16" fill="#64748b" />
            
            {/* Links from root to level 1 */}
            <line x1="600" y1="270" x2="450" y2="382" stroke="#3b82f6" strokeWidth="3.5" />
            <line x1="600" y1="270" x2="600" y2="382" stroke="#3b82f6" strokeWidth="3.5" />
            <line x1="600" y1="270" x2="750" y2="382" stroke="#3b82f6" strokeWidth="3.5" />
            
            {/* Links from level 1 to level 2 */}
            <line x1="450" y1="418" x2="400" y2="534" stroke="#9333ea" strokeWidth="3" />
            <line x1="450" y1="418" x2="550" y2="534" stroke="#9333ea" strokeWidth="3" />
            <line x1="600" y1="418" x2="650" y2="534" stroke="#3b82f6" strokeWidth="3" />
            <line x1="750" y1="418" x2="800" y2="534" stroke="#9333ea" strokeWidth="3" />
        </svg>
    );
}

