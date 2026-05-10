"use client";

let cognitoAccessToken: string | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function setCognitoAccessToken(token: string | null) {
  cognitoAccessToken = token?.trim() || null;
}

export function clearCognitoAccessToken() {
  cognitoAccessToken = null;
}

export function getCognitoAccessToken() {
  return cognitoAccessToken;
}

export function getAuthorizationHeaderValue() {
  if (!isBrowser()) {
    return undefined;
  }

  const token = getCognitoAccessToken();
  if (!token) {
    return undefined;
  }

  return `Bearer ${token}`;
}
