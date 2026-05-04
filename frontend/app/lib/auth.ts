export type UserRole = "student" | "professor";

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  role: UserRole;
  userId: string;
  email: string;
  nickname: string;
}

const AUTH_STORAGE_KEY = "askademy.session";
const AUTH_EVENT_NAME = "askademy-auth-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getDefaultRouteByRole(role: UserRole) {
  return role === "professor" ? "/professor/questions" : "/student/dashboard";
}

export function getDisplayName(session: AuthSession | null) {
  if (!session) {
    return "";
  }

  if (session.nickname.trim()) {
    return session.nickname.trim();
  }

  const emailPrefix = session.email.split("@")[0]?.trim();
  return emailPrefix || session.userId;
}

export function readStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function notifySessionChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function writeStoredSession(session: AuthSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifySessionChange();
}

export function updateStoredSession(
  updater: (current: AuthSession) => AuthSession,
) {
  const current = readStoredSession();
  if (!current) {
    return null;
  }

  const nextSession = updater(current);
  writeStoredSession(nextSession);
  return nextSession;
}

export function clearStoredSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notifySessionChange();
}

export function getAuthEventName() {
  return AUTH_EVENT_NAME;
}
