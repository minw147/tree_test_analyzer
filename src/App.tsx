import { useState } from "react";
import type { UploadedData } from "@/lib/types";
import { UploadView } from "@/components/dashboard/UploadView";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function App() {
  const [data, setData] = useState<UploadedData | null>(null);

  if (!data) {
    return <UploadView onDataLoaded={setData} />;
  }

  return <DashboardLayout data={data} onReset={() => setData(null)} />;
}

export default App;
