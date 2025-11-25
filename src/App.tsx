import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { Analyzer } from "@/pages/Analyzer";
import { Creator } from "@/pages/Creator";
import { Help } from "@/pages/Help";
import { ParticipantView } from "@/pages/ParticipantView";
import { Preview } from "@/pages/Preview";
import { Layout } from "@/components/layout/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/analyze" element={<Analyzer />} />
          <Route path="/create" element={<Creator />} />
          <Route path="/help" element={<Help />} />
        </Route>
        <Route path="/test/:studyId" element={<ParticipantView />} />
        <Route path="/preview" element={<Preview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
