"use client";

export function parseApiDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    /([zZ]|[+\-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
