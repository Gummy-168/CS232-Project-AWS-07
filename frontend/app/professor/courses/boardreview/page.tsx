import { Suspense } from "react";
import ProfessorBoardReviewClientPage from "./client-page";

export const dynamic = "force-dynamic";

export default function ProfessorBoardReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading board...</div>}>
      <ProfessorBoardReviewClientPage />
    </Suspense>
  );
}
