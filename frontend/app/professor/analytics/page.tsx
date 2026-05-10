import { Suspense } from "react";
import ProfessorAnalyticsClientPage from "./client-page";

export const dynamic = "force-dynamic";

export default function ProfessorAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading analytics...</div>}>
      <ProfessorAnalyticsClientPage />
    </Suspense>
  );
}
