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
  nickname: string;
}

interface RegisterResponse {
  id: string;
  email: string;
  role: UserRole;
  nickname: string;
  message: string;
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
    nickname: derivedNickname,
  };
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
