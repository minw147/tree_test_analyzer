import { useState, useEffect } from "react";
import type { UploadedData } from "@/lib/types";
import { UploadView } from "@/components/dashboard/UploadView";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const STORAGE_KEY_ANALYZER_DATA = "tree-test-analyzer-data";

// Load from localStorage on mount
const loadDataFromStorage = (): UploadedData | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_DATA);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Convert date strings back to Date objects
            if (parsed.participants) {
                parsed.participants = parsed.participants.map((p: any) => ({
                    ...p,
                    startedAt: new Date(p.startedAt),
                    completedAt: p.completedAt ? new Date(p.completedAt) : null,
                }));
            }
            return parsed;
        }
    } catch (error) {
        console.error("Failed to load analyzer data from localStorage:", error);
    }
    return null;
};

function App() {
  const [data, setData] = useState<UploadedData | null>(loadDataFromStorage());

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (data) {
      try {
        localStorage.setItem(STORAGE_KEY_ANALYZER_DATA, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save analyzer data to localStorage:", error);
      }
    } else {
      // Clear storage when data is reset
      localStorage.removeItem(STORAGE_KEY_ANALYZER_DATA);
    }
  }, [data]);

  if (!data) {
    return <UploadView onDataLoaded={setData} />;
  }

  return <DashboardLayout data={data} onReset={() => setData(null)} />;
}

export default App;
