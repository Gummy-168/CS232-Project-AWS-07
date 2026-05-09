import type { AuthSession, UserRole } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterPayload {
  id: string;
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  nickname: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: UserRole;
  redirect_to: string;
  full_name: string;
  nickname: string;
}

interface RegisterResponse {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  nickname: string;
  message: string;
}

export interface CreateProfessorCoursePayload {
  course_code: string;
  course_name: string;
  professor_id: string;
  is_active?: boolean;
}

export interface ProfessorCourseResponse {
  course_code: string;
  course_name: string;
  professor_id: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateProfessorSectionPayload {
  section_code: string;
  meeting_days: string[];
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface ProfessorSectionResponse {
  section_id: string;
  course_code: string;
  section_code: string;
  meeting_days: string[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  full_name: string;
  nickname: string;
  email: string;
  role: UserRole;
  enrolled_courses: number;
}

export interface StudentCourse {
  course_code: string;
  course_name: string;
  is_active: boolean;
  professor_id: string;
  professor_name: string;
  professor_full_name?: string;
  section_id?: string | null;
  section_code?: string | null;
  join_date: string | null;
}

export interface StudentQuestion {
  id: string;
  course_code: string;
  course_name: string;
  board_id?: string;
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
  replies?: StudentQuestionReply[];
}

export interface StudentQuestionReply {
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

export interface StudentDashboardData {
  student: {
    id: string;
    name: string;
  };
  session: {
    course_code: string;
    title: string;
    time: string;
    instructor: string;
  };
  stats: {
    participation: number;
    on_class_participation: number;
    opened_boards: number;
    participated_boards: number;
    questions: number;
    answered: number;
    pending: number;
  };
  recent_question: string;
}

export interface StudentAnalyticsData {
  student: {
    id: string;
    name: string;
  };
  stats: {
    participation: number;
    on_class_participation: number;
    opened_boards: number;
    participated_boards: number;
    questions: number;
    answered: number;
    unanswered: number;
    board: number;
    active_courses: number;
  };
  chart: Array<{
    day: string;
    value: number;
  }>;
}

interface StudentCoursesResponse {
  courses: StudentCourse[];
}

export interface StudentCourseBoardData {
  student: {
    id: string;
    name: string;
  };
  course: {
    course_code: string;
    course_name: string;
    professor_name: string;
    professor_full_name?: string;
    section_id?: string | null;
    section_code?: string | null;
  };
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
  general_board?: {
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
  live_board?: {
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

interface StudentQuestionsResponse {
  questions: StudentQuestion[];
}

interface JoinCourseResponse {
  message: string;
  course_code: string;
  course_name: string;
  section_id?: string | null;
  section_code?: string | null;
}

export interface ProfessorJoinCodeResponse {
  join_code_id: string;
  code: string;
  course_code: string;
  section_id: string | null;
  section_code: string | null;
  professor_id: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface UpdateNicknameResponse {
  message: string;
  user_id: string;
  nickname: string;
}

export interface CreateStudentQuestionPayload {
  course_code: string;
  board_id?: string;
  section_code?: string;
  title: string;
  detail?: string;
  tags?: string[];
  is_anonymous?: boolean;
}

export interface UpdateStudentQuestionPayload {
  title: string;
  detail?: string;
}

export interface CreateStudentReplyPayload {
  content: string;
}

export interface ProfessorCourseOption {
  course_code: string;
  course_name: string;
}

export interface ProfessorQuestionReply {
  id: string;
  question_id: string;
  author_id: string;
  author_name: string;
  is_professor: boolean;
  content: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfessorStudentQuestion {
  id: string;
  title: string;
  content: string;
  status: "UNANSWERED" | "ANSWERED" | "DELETED";
  tags?: string[];
  student_id: string;
  student_name: string;
  course_code: string;
  course_name: string;
  section_id?: string | null;
  section_code?: string | null;
  board_id: string;
  created_at: string | null;
  updated_at: string | null;
  replies: ProfessorQuestionReply[];
}

export interface ProfessorBoardSession {
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

export interface ProfessorQuestionsData {
  professor: {
    id: string;
    name: string;
    full_name: string;
  };
  courses: ProfessorCourseOption[];
  selected_course_code: string;
  course: {
    code: string;
    title: string;
  };
  sections: ProfessorSectionResponse[];
  enrolled_students: Array<{
    student_id: string;
    student_name: string;
    section_id?: string | null;
    section_code?: string | null;
  }>;
  student_questions: ProfessorStudentQuestion[];
  board_sessions: ProfessorBoardSession[];
}

async function apiRequest<TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      errorMessage = payload.detail || payload.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status);
  }

  return (await response.json()) as TResponse;
}

function buildRoleHeaders(token: string, role?: UserRole) {
  return {
    Authorization: `Bearer ${token}`,
    "X-Role": role ?? "student",
    "X-User-Role": role ?? "student",
  };
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  return apiRequest<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStudentProfile(studentId: string) {
  return apiRequest<StudentProfile>(`/students/${studentId}/profile`, {
    method: "GET",
  });
}

export async function updateStudentNickname(studentId: string, nickname: string) {
  return apiRequest<UpdateNicknameResponse>(`/students/${studentId}/nickname`, {
    method: "PATCH",
    body: JSON.stringify({ nickname }),
  });
}

export async function getStudentCourses(studentId: string) {
  return apiRequest<StudentCoursesResponse>(`/students/${studentId}/courses`, {
    method: "GET",
  });
}

export async function getStudentCourseBoard(studentId: string, courseCode: string) {
  return apiRequest<StudentCourseBoardData>(
    `/students/${studentId}/courses/${courseCode.trim().toUpperCase()}/board`,
    {
      method: "GET",
    },
  );
}

export async function joinStudentCourse(studentId: string, joinCode: string) {
  return apiRequest<JoinCourseResponse>(`/students/${studentId}/courses/join`, {
    method: "POST",
    body: JSON.stringify({ join_code: joinCode }),
  });
}

export async function getStudentQuestions(
  studentId: string,
  params?: {
    scope?: "all" | "mine";
    courseCode?: string;
    boardId?: string;
    sectionCode?: string;
    status?: "all" | "answered" | "unanswered";
    search?: string;
    tag?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.scope) {
    query.set("scope", params.scope);
  }
  if (params?.courseCode?.trim()) {
    query.set("course_code", params.courseCode.trim().toUpperCase());
  }
  if (params?.boardId?.trim()) {
    query.set("board_id", params.boardId.trim());
  }
  if (params?.sectionCode?.trim()) {
    query.set("section_code", params.sectionCode.trim().toUpperCase());
  }
  if (params?.status?.trim() && params.status !== "all") {
    query.set("status", params.status.trim().toLowerCase());
  }
  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params?.tag?.trim()) {
    query.set("tag", params.tag.trim());
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<StudentQuestionsResponse>(
    `/students/${studentId}/questions${suffix}`,
    {
      method: "GET",
    },
  );
}

export async function createStudentQuestion(
  studentId: string,
  payload: CreateStudentQuestionPayload,
) {
  return apiRequest<StudentQuestion>(`/students/${studentId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getBoardQuestions(
  boardId: string,
  token: string,
  role?: UserRole,
) {
  const response = await apiRequest<unknown>(`/boards/${boardId.trim()}/questions`, {
    method: "GET",
    headers: buildRoleHeaders(token, role),
  });

  if (Array.isArray(response)) {
    return { questions: response as StudentQuestion[] };
  }

  if (
    response &&
    typeof response === "object" &&
    "questions" in response &&
    Array.isArray((response as { questions?: unknown }).questions)
  ) {
    return response as { questions: StudentQuestion[] };
  }

  return { questions: [] as StudentQuestion[] };
}

export async function updateStudentQuestion(
  studentId: string,
  questionId: string,
  payload: UpdateStudentQuestionPayload,
) {
  return apiRequest<StudentQuestion>(
    `/students/${studentId}/questions/${questionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function createStudentQuestionReply(
  studentId: string,
  questionId: string,
  payload: CreateStudentReplyPayload,
) {
  return apiRequest<StudentQuestionReply>(
    `/students/${studentId}/questions/${questionId}/replies`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function getStudentDashboard(studentId: string) {
  return apiRequest<StudentDashboardData>(`/students/${studentId}/dashboard`, {
    method: "GET",
  });
}

export async function getStudentAnalytics(studentId: string) {
  return apiRequest<StudentAnalyticsData>(`/students/${studentId}/analytics`, {
    method: "GET",
  });
}

export async function createProfessorCourse(payload: CreateProfessorCoursePayload) {
  return apiRequest<ProfessorCourseResponse>("/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createProfessorSection(
  professorId: string,
  courseCode: string,
  payload: CreateProfessorSectionPayload,
) {
  return apiRequest<ProfessorSectionResponse>(
    `/professors/${professorId}/courses/${courseCode.trim().toUpperCase()}/sections`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function getProfessorJoinCode(
  professorId: string,
  courseCode: string,
  sectionCode?: string,
) {
  const query = new URLSearchParams();
  if (sectionCode?.trim()) {
    query.set("section_code", sectionCode.trim().toUpperCase());
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<ProfessorJoinCodeResponse | null>(
    `/professors/${professorId}/courses/${courseCode.trim().toUpperCase()}/join-code${suffix}`,
    {
      method: "GET",
    },
  );
}

export async function createProfessorJoinCode(
  professorId: string,
  courseCode: string,
  payload?: { section_code?: string },
) {
  return apiRequest<ProfessorJoinCodeResponse>(
    `/professors/${professorId}/courses/${courseCode.trim().toUpperCase()}/join-code`,
    {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    },
  );
}

export async function getProfessorQuestions(
  professorId: string,
  params?: {
    courseCode?: string;
    sectionCode?: string;
    status?: "all" | "answered" | "unanswered";
    search?: string;
    tag?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.courseCode?.trim()) {
    query.set("course_code", params.courseCode.trim().toUpperCase());
  }
  if (params?.sectionCode?.trim()) {
    query.set("section_code", params.sectionCode.trim().toUpperCase());
  }
  if (params?.status?.trim()) {
    query.set("status", params.status.trim().toLowerCase());
  }
  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }
  if (params?.tag?.trim()) {
    query.set("tag", params.tag.trim());
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<ProfessorQuestionsData>(
    `/professors/${professorId}/questions${suffix}`,
    {
      method: "GET",
    },
  );
}

export async function createProfessorBoard(
  professorId: string,
  courseCode: string,
  sectionCode?: string,
  payload?: { boardTitle?: string; forceCloseExisting?: boolean },
) {
  return apiRequest<{
    board_id: string;
    course_code: string;
    course_name: string;
    section_code?: string | null;
    board_title?: string | null;
    status: string;
  }>(`/professors/${professorId}/courses/${courseCode}/boards`, {
    method: "POST",
    body: JSON.stringify({
      section_code: sectionCode?.trim().toUpperCase(),
      board_title: payload?.boardTitle ?? "",
      force_close_existing: payload?.forceCloseExisting ?? false,
    }),
  });
}

export async function closeProfessorBoard(
  professorId: string,
  boardId: string,
) {
  return apiRequest<{
    board_id: string;
    course_code: string;
    section_code?: string | null;
    board_title?: string | null;
    status: string;
  }>(`/professors/${professorId}/boards/${boardId}/close`, {
    method: "PATCH",
  });
}

export async function updateProfessorQuestionStatus(
  professorId: string,
  questionId: string,
  statusValue: "answered" | "pending" | "unanswered",
) {
  return apiRequest<{ question_id: string; status: "ANSWERED" | "UNANSWERED" }>(
    `/professors/${professorId}/questions/${questionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: statusValue }),
    },
  );
}

export async function deleteProfessorQuestion(
  professorId: string,
  questionId: string,
) {
  return apiRequest<{ message: string; question_id: string }>(
    `/professors/${professorId}/questions/${questionId}`,
    {
      method: "DELETE",
    },
  );
}

export async function createProfessorQuestionReply(
  professorId: string,
  questionId: string,
  payload: { content: string },
) {
  return apiRequest<ProfessorQuestionReply>(
    `/professors/${professorId}/questions/${questionId}/replies`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function buildSessionFromLogin(
  login: LoginResponse,
  payload: LoginPayload,
): AuthSession {
  const derivedNickname =
    login.nickname?.trim() || payload.email.split("@")[0] || login.access_token;

  return {
    accessToken: login.access_token,
    tokenType: login.token_type,
    role: login.role,
    userId: login.user_id,
    email: payload.email,
    fullName: login.full_name?.trim() || derivedNickname,
    nickname: derivedNickname,
  };
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function fetchQuestionsWithFilters(
  courseCode: string,
  token: string,
  filters: { keyword?: string; status?: string; tag?: string }
) {
  const queryParams = new URLSearchParams();
  if (filters.keyword) queryParams.append("q", filters.keyword);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.tag) queryParams.append("tag", filters.tag);

  const res = await fetch(`${API_BASE_URL}/api/courses/${courseCode}/questions/search?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let message = "Failed to fetch questions";
    try {
      const payload = (await res.json()) as ApiErrorPayload;
      message = payload.detail || payload.message || message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export async function createQuestion(
  payload: {
    title: string;
    content: string;
    tags: string[];
    is_anonymous: boolean;
    course_code: string;
    board_id: string;
  },
  token: string,
  studentId: string,
  role?: UserRole,
) {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildRoleHeaders(token, role),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to post question");
  }

  return await response.json();
}
