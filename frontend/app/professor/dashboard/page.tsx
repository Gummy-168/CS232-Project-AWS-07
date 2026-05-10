import { Suspense } from "react";
import ProfessorDashboardHomeView from "./professor-dashboard-home-view";

export const dynamic = "force-dynamic";

export default function ProfessorDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <ProfessorDashboardHomeView />
    </Suspense>
  );
}
