import { Suspense } from "react";
import CourseDashboardView from "./course-dashboard-view";

export const dynamic = "force-dynamic";

export default function ProfessorCoursesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading courses...</div>}>
      <CourseDashboardView />
    </Suspense>
  );
}
