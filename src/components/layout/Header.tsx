import { Link } from "react-router-dom";
import { Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src="/src/assets/logo.png" alt="TreePath Logo" className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900">TreePath</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Link to="/">
                        <Button variant="ghost" size="icon" title="Home">
                            <Home className="h-5 w-5 text-gray-500" />
                        </Button>
                    </Link>
                    <Link to="/help">
                        <Button variant="ghost" size="icon" title="Help">
                            <HelpCircle className="h-5 w-5 text-gray-500" />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
