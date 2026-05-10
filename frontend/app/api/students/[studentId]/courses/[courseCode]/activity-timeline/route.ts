import { NextRequest, NextResponse } from "next/server";
import { normalizeSectionCode } from "../../../../../../lib/section-code";
import {
  ServerApiError,
  ensureStudentEnrollment,
  getStudentBoardSessions,
  getStudentQuestionsFromBackend,
} from "../../../../../../lib/server-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string; courseCode: string }> },
) {
  const { studentId, courseCode } = await context.params;
  const sectionCode = normalizeSectionCode(
    request.nextUrl.searchParams.get("section_code"),
  );

  try {
    await ensureStudentEnrollment(request, studentId, courseCode, sectionCode);

    const questionParams = new URLSearchParams();
    // Course activity timeline should show the course-wide stream for the
    // enrolled section, not only the current student's own questions.
    questionParams.set("scope", "all");
    questionParams.set("course_code", courseCode.trim().toUpperCase());
    if (sectionCode) {
      questionParams.set("section_code", sectionCode);
    }

    const [boardSessions, questions] = await Promise.all([
      getStudentBoardSessions(request, studentId, courseCode, sectionCode),
      getStudentQuestionsFromBackend(request, studentId, questionParams),
    ]);

    const items = [
      ...boardSessions.map((board) => ({
        type: "board" as const,
        created_at: board.created_at,
        board,
      })),
      ...questions
        .filter((question) => question.status !== "DELETED")
        .map((question) => ({
          type: "question" as const,
          created_at: question.created_at,
          question,
        })),
    ].sort((left, right) => {
      const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightTime - leftTime;
    });

    return NextResponse.json({
      course_code: courseCode.trim().toUpperCase(),
      section_code: sectionCode || null,
      items,
    });
  } catch (error) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Failed to load student activity timeline." },
      { status: 500 },
    );
  }
}
