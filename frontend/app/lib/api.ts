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
  join_date: string | null;
}

export interface StudentQuestion {
  id: string;
  course_code: string;
  course_name: string;
  title: string;
  content: string;
  reply_content: string | null;
  status: "UNANSWERED" | "ANSWERED" | "DELETED";
  is_anonymous: boolean;
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

interface StudentQuestionsResponse {
  questions: StudentQuestion[];
}

interface JoinCourseResponse {
  message: string;
  course_code: string;
  course_name: string;
}

interface UpdateNicknameResponse {
  message: string;
  user_id: string;
  nickname: string;
}

export interface CreateStudentQuestionPayload {
  course_code: string;
  title: string;
  detail?: string;
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
  student_id: string;
  student_name: string;
  course_code: string;
  course_name: string;
  board_id: string;
  created_at: string | null;
  updated_at: string | null;
  replies: ProfessorQuestionReply[];
}

export interface ProfessorBoardSession {
  board_id: string;
  course_code: string;
  course_name: string;
  status: string;
  created_at: string | null;
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

export async function joinStudentCourse(studentId: string, courseCode: string) {
  return apiRequest<JoinCourseResponse>(`/students/${studentId}/courses/join`, {
    method: "POST",
    body: JSON.stringify({ course_code: courseCode }),
  });
}

export async function getStudentQuestions(
  studentId: string,
  params?: {
    scope?: "all" | "mine";
    courseCode?: string;
    search?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.scope) {
    query.set("scope", params.scope);
  }
  if (params?.courseCode?.trim()) {
    query.set("course_code", params.courseCode.trim().toUpperCase());
  }
  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
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

export async function getProfessorQuestions(
  professorId: string,
  params?: {
    courseCode?: string;
    status?: "all" | "answered" | "unanswered";
    search?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.courseCode?.trim()) {
    query.set("course_code", params.courseCode.trim().toUpperCase());
  }
  if (params?.status?.trim()) {
    query.set("status", params.status.trim().toLowerCase());
  }
  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
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
) {
  return apiRequest<{
    board_id: string;
    course_code: string;
    course_name: string;
    status: string;
  }>(`/professors/${professorId}/courses/${courseCode}/boards`, {
    method: "POST",
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
