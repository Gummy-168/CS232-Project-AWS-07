import { NextRequest, NextResponse } from "next/server";
import { normalizeSectionCode } from "../../../../lib/section-code";
import {
  ServerApiError,
  ServerStudentQuestion,
  ensureBoardAccessibleForStudent,
  fetchBackend,
} from "../../../../lib/server-api";

export const dynamic = "force-dynamic";

function normalizeQuestions(response: unknown) {
  if (Array.isArray(response)) {
    return response as ServerStudentQuestion[];
  }

  if (
    response &&
    typeof response === "object" &&
    "questions" in response &&
    Array.isArray((response as { questions?: unknown }).questions)
  ) {
    return (response as { questions: ServerStudentQuestion[] }).questions;
  }

  return [] as ServerStudentQuestion[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await context.params;
  const studentId = request.nextUrl.searchParams.get("student_id")?.trim() ?? "";
  const courseCode = request.nextUrl.searchParams.get("course_code")?.trim() ?? "";
  const sectionCode = normalizeSectionCode(
    request.nextUrl.searchParams.get("section_code"),
  );

  try {
    if (studentId && courseCode) {
      await ensureBoardAccessibleForStudent(
        request,
        studentId,
        courseCode,
        boardId,
        sectionCode,
      );
    }

    const response = await fetchBackend<unknown>(
      `/boards/${encodeURIComponent(boardId)}/questions`,
      { method: "GET" },
      request,
    );
    const questions = normalizeQuestions(response).map((question) => ({
      ...question,
      question_text: question.content || question.title,
      student_display_name: question.is_anonymous ? "Anonymous" : question.author_name,
      answer_text:
        question.reply_content ||
        question.replies?.find((reply) => reply.is_professor)?.content ||
        null,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Failed to load board questions." },
      { status: 500 },
    );
  }
}
