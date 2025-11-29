import { Link } from "react-router-dom";
import { Home, HelpCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 group transition-all duration-300">
                        <span className="text-2xl font-bold tracking-tight">
                            <span className="text-purple-600">Tree</span>
                            <span className="text-blue-600">Path</span>
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Link to="/">
                        <Button variant="ghost" size="icon" title="Home">
                            <Home className="h-5 w-5 text-gray-500" />
                        </Button>
                    </Link>
                    <Link to="/settings">
                        <Button variant="ghost" size="icon" title="Settings">
                            <Settings className="h-5 w-5 text-gray-500 hover:text-purple-600 transition-colors" />
                        </Button>
                    </Link>
                    <Link to="/help">
                        <Button variant="ghost" size="icon" title="Help">
                            <HelpCircle className="h-5 w-5 text-gray-500 hover:text-purple-600 transition-colors" />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
