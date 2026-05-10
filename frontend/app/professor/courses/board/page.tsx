import { Suspense } from "react";
import ProfessorBoardReviewPage from "../boardreview/page";

export const dynamic = "force-dynamic";

export default function ProfessorBoardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading board...</div>}>
      <ProfessorBoardReviewPage />
    </Suspense>
  );
}
