import { Suspense } from "react";
import StudentCourseBoardView from "./student-course-board-view";

export const dynamic = "force-dynamic";

export default function StudentCourseBoardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading board...</div>}>
      <StudentCourseBoardView />
    </Suspense>
  );
}
