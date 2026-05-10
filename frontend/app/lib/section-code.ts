export function normalizeSectionCode(value?: string | null) {
  const raw = value?.trim().toUpperCase().replace(/\s+/g, " ") ?? "";

  if (!raw) {
    return "";
  }

  if (raw.startsWith("SEC ")) {
    return raw.slice(4).trim();
  }

  return raw;
}

export function formatSectionLabel(value?: string | null) {
  const raw = value?.trim().toUpperCase().replace(/\s+/g, " ") ?? "";

  if (!raw) {
    return null;
  }

  if (raw.startsWith("SEC ") || raw.startsWith("SEC-")) {
    return raw;
  }

  return `SEC ${raw}`;
}

export function sectionCodesMatch(
  left?: string | null,
  right?: string | null,
) {
  return normalizeSectionCode(left) === normalizeSectionCode(right);
}

export function buildCourseQueryString(
  courseCode: string,
  sectionCode?: string | null,
) {
  const query = new URLSearchParams();
  query.set("course_code", courseCode.trim().toUpperCase());

  const normalizedSectionCode = normalizeSectionCode(sectionCode);
  if (normalizedSectionCode) {
    query.set("sec", normalizedSectionCode);
  }

  return query.toString();
}
