import { normalizeSectionCode, sectionCodesMatch } from "./section-code";

const API_BASE_URL =
  process.env.BACKEND_API_URL?.replace(/\/$/, "") ||
  process.env.API_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export interface ServerStudentCourse {
  course_code: string;
  course_name?: string;
  section_id?: string | null;
  section_code?: string | null;
}

export interface ServerStudentQuestionReply {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  author_full_name?: string;
  is_professor: boolean;
  content: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ServerStudentQuestion {
  id: string;
  course_code: string;
  course_name: string;
  board_id?: string | null;
  section_id?: string | null;
  section_code?: string | null;
  title: string;
  content: string;
  reply_content: string | null;
  status: "UNANSWERED" | "ANSWERED" | "DELETED";
  is_anonymous: boolean;
  tags?: string[];
  created_at: string | null;
  updated_at: string | null;
  author_id: string;
  author_name: string;
  replies?: ServerStudentQuestionReply[];
}

export interface ServerStudentBoardSession {
  board_id: string;
  course_code: string;
  course_name: string;
  section_id?: string | null;
  section_code?: string | null;
  board_title?: string | null;
  status: string;
  created_at: string | null;
  closed_at?: string | null;
  total_questions: number;
  answered_questions: number;
  unanswered_questions: number;
}

interface ServerStudentCourseBoardData {
  active_board: {
    board_id: string;
    board_title?: string | null;
    section_id?: string | null;
    section_code?: string | null;
    status: string;
    created_at: string | null;
    total_questions: number;
    answered_questions: number;
    unanswered_questions: number;
  } | null;
}

export class ServerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
  }
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.detail || payload.message || response.statusText || "Request failed";
  } catch {
    return response.statusText || "Request failed";
  }
}

export function buildForwardHeaders(request: Request, contentType = false) {
  const headers = new Headers();

  if (contentType) {
    headers.set("Content-Type", "application/json");
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const role = request.headers.get("x-role");
  if (role) {
    headers.set("X-Role", role);
  }

  const userRole = request.headers.get("x-user-role");
  if (userRole) {
    headers.set("X-User-Role", userRole);
  }

  return headers;
}

export async function fetchBackend<TResponse>(
  path: string,
  init: RequestInit,
  request: Request,
) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...Object.fromEntries(buildForwardHeaders(request).entries()),
        ...Object.fromEntries(new Headers(init.headers).entries()),
      },
    });
  } catch {
    throw new ServerApiError("Cannot reach backend API.", 502);
  }

  if (!response.ok) {
    throw new ServerApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as TResponse;
}

export async function getStudentEnrollments(request: Request, studentId: string) {
  const response = await fetchBackend<
    { courses?: ServerStudentCourse[] } | ServerStudentCourse[]
  >(`/students/${encodeURIComponent(studentId)}/courses`, { method: "GET" }, request);

  if (Array.isArray(response)) {
    return response;
  }

  return response.courses ?? [];
}

export async function ensureStudentEnrollment(
  request: Request,
  studentId: string,
  courseCode: string,
  sectionCode?: string | null,
) {
  const normalizedCourseCode = courseCode.trim().toUpperCase();
  const normalizedSectionCode = normalizeSectionCode(sectionCode);
  const courses = await getStudentEnrollments(request, studentId);

  const enrollment = courses.find((course) => {
    if (course.course_code.trim().toUpperCase() !== normalizedCourseCode) {
      return false;
    }

    if (!normalizedSectionCode) {
      return true;
    }

    return sectionCodesMatch(course.section_code, normalizedSectionCode);
  });

  if (!enrollment) {
    throw new ServerApiError(
      "You are not enrolled in the requested course section.",
      403,
    );
  }

  return enrollment;
}

export async function getStudentBoardSessions(
  request: Request,
  studentId: string,
  courseCode: string,
  sectionCode?: string | null,
) {
  const query = new URLSearchParams();
  const normalizedSectionCode = normalizeSectionCode(sectionCode);
  if (normalizedSectionCode) {
    query.set("section_code", normalizedSectionCode);
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetchBackend<
    { board_sessions?: ServerStudentBoardSession[]; boards?: ServerStudentBoardSession[] } |
      ServerStudentBoardSession[]
  >(
    `/students/${encodeURIComponent(studentId)}/courses/${encodeURIComponent(
      courseCode.trim().toUpperCase(),
    )}/boards${suffix}`,
    { method: "GET" },
    request,
  );

  if (Array.isArray(response)) {
    return response;
  }

  return response.board_sessions ?? response.boards ?? [];
}

export async function getStudentActiveBoard(
  request: Request,
  studentId: string,
  courseCode: string,
  sectionCode?: string | null,
) {
  const query = new URLSearchParams();
  const normalizedSectionCode = normalizeSectionCode(sectionCode);
  if (normalizedSectionCode) {
    query.set("section_code", normalizedSectionCode);
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetchBackend<ServerStudentCourseBoardData>(
    `/students/${encodeURIComponent(studentId)}/courses/${encodeURIComponent(
      courseCode.trim().toUpperCase(),
    )}/board${suffix}`,
    { method: "GET" },
    request,
  );

  return response.active_board;
}

export async function getStudentQuestionsFromBackend(
  request: Request,
  studentId: string,
  params: URLSearchParams,
) {
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetchBackend<
    { questions?: ServerStudentQuestion[] } | ServerStudentQuestion[]
  >(
    `/students/${encodeURIComponent(studentId)}/questions${suffix}`,
    { method: "GET" },
    request,
  );

  if (Array.isArray(response)) {
    return response;
  }

  return response.questions ?? [];
}

export async function ensureBoardAccessibleForStudent(
  request: Request,
  studentId: string,
  courseCode: string,
  boardId: string,
  sectionCode?: string | null,
) {
  await ensureStudentEnrollment(request, studentId, courseCode, sectionCode);

  const [boardSessions, activeBoard] = await Promise.all([
    getStudentBoardSessions(request, studentId, courseCode, sectionCode),
    getStudentActiveBoard(request, studentId, courseCode, sectionCode).catch(() => null),
  ]);

  const matchedBoard =
    boardSessions.find((board) => board.board_id === boardId) ||
    (activeBoard?.board_id === boardId
      ? {
          board_id: activeBoard.board_id,
          board_title: activeBoard.board_title,
          course_code: courseCode.trim().toUpperCase(),
          course_name: "",
          section_id: activeBoard.section_id,
          section_code: activeBoard.section_code,
          status: activeBoard.status,
          created_at: activeBoard.created_at,
          total_questions: activeBoard.total_questions,
          answered_questions: activeBoard.answered_questions,
          unanswered_questions: activeBoard.unanswered_questions,
        }
      : null);

  if (!matchedBoard) {
    throw new ServerApiError(
      "This board is not available in your enrolled course section.",
      404,
    );
  }

  if (
    normalizeSectionCode(sectionCode) &&
    !sectionCodesMatch(matchedBoard.section_code, sectionCode)
  ) {
    throw new ServerApiError("This board belongs to a different section.", 403);
  }

  return matchedBoard;
}
