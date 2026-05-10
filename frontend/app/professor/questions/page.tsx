import { Suspense } from "react";
import ProfessorQuestionsClientPage from "./client-page";

export const dynamic = "force-dynamic";

export default function ProfessorQuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading questions...</div>}>
      <ProfessorQuestionsClientPage />
    </Suspense>
  );
}
