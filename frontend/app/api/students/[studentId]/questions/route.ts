import { NextRequest, NextResponse } from "next/server";
import { normalizeSectionCode } from "../../../../lib/section-code";
import {
  ServerApiError,
  buildForwardHeaders,
  ensureBoardAccessibleForStudent,
  fetchBackend,
} from "../../../../lib/server-api";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await context.params;

  try {
    const search = request.nextUrl.searchParams.toString();
    const suffix = search ? `?${search}` : "";
    const response = await fetchBackend<unknown>(
      `/students/${encodeURIComponent(studentId)}/questions${suffix}`,
      { method: "GET" },
      request,
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Failed to load student questions." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await context.params;

  try {
    const payload = (await request.json()) as {
      course_code?: string;
      board_id?: string | null;
      section_code?: string | null;
      title?: string;
      detail?: string;
      tags?: string[];
      is_anonymous?: boolean;
    };

    const courseCode = payload.course_code?.trim().toUpperCase() ?? "";
    const boardId = payload.board_id?.trim() ?? "";
    const sectionCode = normalizeSectionCode(payload.section_code);

    if (!courseCode) {
      return NextResponse.json(
        { detail: "course_code is required." },
        { status: 400 },
      );
    }

    if (boardId) {
      const board = await ensureBoardAccessibleForStudent(
        request,
        studentId,
        courseCode,
        boardId,
        sectionCode,
      );

      if ((board.status || "").trim().toLowerCase() === "closed") {
        return NextResponse.json(
          { detail: "This board has already been closed." },
          { status: 409 },
        );
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/students/${encodeURIComponent(studentId)}/questions`,
      {
        method: "POST",
        headers: buildForwardHeaders(request, true),
        body: JSON.stringify({
          ...payload,
          course_code: courseCode,
          board_id: boardId || null,
          section_code: sectionCode || undefined,
        }),
      },
    );

    if (!response.ok) {
      let message = "Failed to create question.";
      try {
        const errorPayload = (await response.json()) as {
          detail?: string;
          message?: string;
        };
        message = errorPayload.detail || errorPayload.message || message;
      } catch {}

      return NextResponse.json({ detail: message }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error: unknown) {
    if (error instanceof ServerApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Failed to create student question." },
      { status: 500 },
    );
  }
}
