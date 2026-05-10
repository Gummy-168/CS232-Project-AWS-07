import { Suspense } from "react";
import StudentCourseHomeView from "./student-course-home-view";

export const dynamic = "force-dynamic";

export default function StudentCoursesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading courses...</div>}>
      <StudentCourseHomeView />
    </Suspense>
  );
}
