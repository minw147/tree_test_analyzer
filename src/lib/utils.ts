import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function sanitizeTreeTestLink(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function getMetricColor(value: number): string {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-orange-500";
    return "text-red-600";
}
