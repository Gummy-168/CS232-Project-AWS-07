"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Clock3, Eye, MessageSquareText, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionNoticeModal from "../../components/action-notice-modal";
import AskModal from "../../components/askmodal";
import Header from "../../components/Header";
import JoinCourse from "../../components/joincourse";
import { useAuthSession } from "../../hooks/useAuthSession";
import { parseApiDate } from "../../lib/date-time";
import {
  createStudentQuestion,
  type StudentCourse,
  type StudentActivityTimelineResponse,
  type StudentBoardSession,
  type StudentCourseBoardData,
  type StudentQuestion,
  getStudentActivityTimeline,
  getStudentCourseBoard,
  getStudentCourses,
} from "../../lib/api";
import {
  buildCourseQueryString,
  formatSectionLabel,
  normalizeSectionCode,
  sectionCodesMatch,
} from "../../lib/section-code";

type TimelineFilter = "All" | "Answered" | "Unanswered" | "Board";

type NoticeState = {
  badge: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "danger" | "success";
} | null;

function formatRelativeTime(value: string | null) {
  if (!value) return "just now";
  try {
    const parsed = parseApiDate(value);
    if (!parsed) return "just now";
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return "just now";
  }
}

const avatarFor = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function initialsFromSeed(seed: string) {
  const normalized = seed.trim();
  if (!normalized) return "?";
  const chunks = normalized.split(/[\s\-_]+/).filter(Boolean);
  if (chunks.length >= 2) {
    return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
  }
  return normalized.slice(0, 2).toUpperCase();
}

function Avatar({ seed, alt }: { seed: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6A5BFF] to-[#E34BA9] text-xs font-medium text-white shadow-sm">
        {initialsFromSeed(seed)}
      </div>
    );
  }
  return (
    <img
      src={avatarFor(seed)}
      alt={alt}
      className="h-11 w-11 rounded-full bg-slate-100 object-cover shadow-sm"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

// ─── Board card (matches professor BoardTimelineCard) ────────────────────────
function BoardTimelineCard({
  board,
  courseCode,
  sectionCode,
}: {
  board: StudentBoardSession;
  courseCode: string;
  sectionCode?: string | null;
}) {
  const isActive = board.status.trim().toUpperCase() === "ACTIVE";
  const boardQuery = `${buildCourseQueryString(courseCode, sectionCode)}&board_id=${encodeURIComponent(board.board_id)}`;

  return (
    <article className="rounded-[28px] bg-white px-5 py-5 shadow-[0_14px_32px_rgba(104,74,191,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <Avatar
            seed={board.board_id}
            alt={`${board.course_code} board avatar`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-medium text-[#1F1838]">
                {board.course_code} Course Board
              </span>
              {board.section_code ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase text-gray-500">
                  {formatSectionLabel(board.section_code)}
                </span>
              ) : null}
              <span className="text-xs text-[#A39ACB]">
                {formatRelativeTime(board.created_at)}
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-[#5B41FF]">
              {board.board_title || board.board_id}
            </p>
            <p className="mt-2 text-sm text-[#7E75A4]">
              {board.total_questions} questions / {board.answered_questions}{" "}
              answered
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
              isActive
                ? "bg-violet-100 text-violet-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isActive ? "ACTIVE" : "CLOSED"}
          </span>
          <Link
            href={`/student/courses/board?${boardQuery}`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] px-5 py-2.5 text-sm font-medium text-white hover:opacity-80 transition"
          >
            <Eye size={16} />
            {isActive ? "View Board" : "Review Session"}
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Question card (matches professor QuestionTimelineCard) ──────────────────
function QuestionTimelineCard({
  question,
  professorName,
}: {
  question: StudentQuestion;
  professorName?: string;
}) {
  const isAnswered = question.status === "ANSWERED";
  const resolvedProfessorName = professorName?.trim() || "Professor";

  return (
    <article className="rounded-[28px] bg-white px-5 py-5 shadow-[0_14px_32px_rgba(104,74,191,0.06)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar
            seed={question.id ?? question.id}
            alt={`${question.author_name} avatar`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-lg font-medium text-slate-800">
                {question.is_anonymous ? "Anonymous" : question.author_name}
              </span>
              <span className="text-xs text-slate-400">
                {formatRelativeTime(question.created_at)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {question.section_code ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {formatSectionLabel(question.section_code)}
                </span>
              ) : null}
              {question.course_code ? (
                <span className="rounded-full bg-[#F4F0FF] px-2.5 py-0.5 text-xs font-medium text-[#6F63A8]">
                  {question.course_code}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Status pill */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
            isAnswered
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {isAnswered ? "● ANSWERED" : "● UNANSWERED"}
        </span>
      </div>

      {/* Content */}
      <div className="ml-14 mt-2">
        {question.title ? (
          <p className="mt-5 text-xl font-bold text-slate-800">
            {question.title}
          </p>
        ) : null}
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {question.content}
        </p>

        {/* Replies */}
        {question.reply_content || (question.replies ?? []).length > 0 ? (
          <div className="mt-5 space-y-3 border-t border-[#F1ECFF] pt-5">
            {question.reply_content ? (
              <div className="rounded-[22px] px-4 py-4 bg-[#EFFFF6] text-[#275E47]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">
                    Professor Reply
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {question.reply_content}
                </p>
              </div>
            ) : null}

            {(question.replies ?? []).map((reply) => (
              <div
                key={reply.id}
                className={`rounded-[22px] px-4 py-4 ${
                  reply.is_professor
                    ? "bg-[#EFFFF6] text-[#275E47]"
                    : "bg-[#F6F4FF] text-[#4B4170]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">
                    {reply.is_professor
                      ? reply.author_full_name?.trim() || resolvedProfessorName
                      : reply.author_name}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatRelativeTime(reply.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────
export default function StudentCourseHomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();

  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() ?? "";
  const selectedSectionCode = normalizeSectionCode(searchParams.get("sec"));

  const buildCourseQuery = (code: string, sec?: string | null) =>
    buildCourseQueryString(code, sec);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [courseBoard, setCourseBoard] = useState<StudentCourseBoardData | null>(
    null,
  );
  const [timeline, setTimeline] =
    useState<StudentActivityTimelineResponse | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TimelineFilter>("All");
  const [notice, setNotice] = useState<NoticeState>(null);

  const selectedCourse =
    courses.find((c) => {
      const matchesCourse =
        c.course_code.trim().toUpperCase() === selectedCourseCode;
      const matchesSection =
        selectedSectionCode.length === 0 ||
        sectionCodesMatch(c.section_code, selectedSectionCode);
      return matchesCourse && matchesSection;
    }) ?? null;

  const resolvedSectionCode =
    selectedCourse?.section_code || selectedSectionCode || undefined;
  const sectionLabel = formatSectionLabel(resolvedSectionCode);

  const resolvedProfessorName =
    selectedCourse?.professor_full_name?.trim() ||
    courseBoard?.course.professor_full_name?.trim() ||
    selectedCourse?.professor_name ||
    courseBoard?.course.professor_name ||
    "Professor";

  const currentCourseTitle =
    selectedCourse?.course_name ||
    courseBoard?.course.course_code ||
    selectedCourseCode ||
    "No course selected";

  const activeBoard = courseBoard?.active_board ?? null;

  // ── load data ─────────────────────────────────────────────────────────────
  const loadCourseData = useCallback(
    async (showLoading = true) => {
      if (!session?.userId || !selectedCourseCode) return;
      if (showLoading) setIsLoading(true);
      try {
        const [boardResponse, timelineResponse] = await Promise.all([
          getStudentCourseBoard(
            session.userId,
            selectedCourseCode,
            selectedCourse?.section_code || selectedSectionCode || undefined,
          ),
          getStudentActivityTimeline(session.userId, selectedCourseCode, {
            sectionCode: resolvedSectionCode,
            token: session.accessToken,
            role: session.role,
          }),
        ]);
        setCourseBoard(boardResponse);
        setTimeline(timelineResponse);
      } catch {
        if (showLoading) {
          setCourseBoard(null);
          setTimeline(null);
        }
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [
      resolvedSectionCode,
      selectedCourse?.section_code,
      selectedCourseCode,
      selectedSectionCode,
      session?.accessToken,
      session?.role,
      session?.userId,
    ],
  );

  useEffect(() => {
    if (!session?.userId) return;
    getStudentCourses(session.userId)
      .then((response) => {
        setCourses(response.courses);
        if (response.courses.length === 0) {
          setIsLoading(false);
          return;
        }

        const matching = response.courses.filter(
          (c) => c.course_code.trim().toUpperCase() === selectedCourseCode,
        );
        const exact = matching.find((c) =>
          sectionCodesMatch(c.section_code, selectedSectionCode),
        );

        if (!selectedCourseCode) {
          router.replace(
            `/student/courses?${buildCourseQuery(
              response.courses[0].course_code,
              response.courses[0].section_code,
            )}`,
          );
          return;
        }
        if (matching.length === 0) {
          router.replace(
            `/student/courses?${buildCourseQuery(
              response.courses[0].course_code,
              response.courses[0].section_code,
            )}`,
          );
          return;
        }
        if (
          (!selectedSectionCode && Boolean(matching[0].section_code?.trim())) ||
          (selectedSectionCode && !exact)
        ) {
          router.replace(
            `/student/courses?${buildCourseQuery(
              matching[0].course_code,
              matching[0].section_code,
            )}`,
          );
        }
      })
      .catch(() => {
        setCourses([]);
        setIsLoading(false);
      });
  }, [router, selectedCourseCode, selectedSectionCode, session?.userId]);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode) return;
    void loadCourseData();
  }, [loadCourseData, selectedCourseCode, session?.userId]);

  // poll every 10 s
  useEffect(() => {
    if (!session?.userId || !selectedCourseCode) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void loadCourseData(false);
    };
    const id = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadCourseData, selectedCourseCode, session?.userId]);

  // ── timeline items ────────────────────────────────────────────────────────
  const timelineItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sourceItems = timeline?.items ?? [];

    const questions = sourceItems
      .filter(
        (item): item is Extract<typeof item, { type: "question" }> =>
          item.type === "question",
      )
      .map((item) => item.question)
      .filter((q) => {
        const matchesFilter =
          filter === "All" ||
          (filter === "Answered" && q.status === "ANSWERED") ||
          (filter === "Unanswered" && q.status === "UNANSWERED");
        const matchesSearch =
          query.length === 0 ||
          q.title.toLowerCase().includes(query) ||
          q.content.toLowerCase().includes(query) ||
          q.author_name.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
      })
      .map((q) => ({
        type: "question" as const,
        id: q.id,
        createdAt: q.created_at,
        question: q,
      }));

    const boards =
      filter === "Answered" || filter === "Unanswered"
        ? []
        : sourceItems
            .filter(
              (item): item is Extract<typeof item, { type: "board" }> =>
                item.type === "board",
            )
            .map((item) => item.board)
            .filter((b) => {
              const matchesSearch =
                query.length === 0 ||
                (b.board_title || b.board_id).toLowerCase().includes(query) ||
                b.course_code.toLowerCase().includes(query) ||
                (b.section_code || "").toLowerCase().includes(query);
              return matchesSearch && (filter === "All" || filter === "Board");
            })
            .map((b) => ({
              type: "board" as const,
              id: b.board_id,
              createdAt: b.created_at,
              board: b,
            }));

    return [...boards, ...questions].sort((a, b) => {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    });
  }, [filter, search, timeline]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const showQuestionErrorNotice = (message: string) => {
    if (message.toLowerCase().includes("different section")) {
      setNotice({
        badge: "Section mismatch",
        title: "You can only post in your enrolled section",
        description:
          "This question was blocked because the current board belongs to a different section.",
        tone: "warning",
      });
      return;
    }
    setNotice({
      badge: "Question not sent",
      title: "We could not post your question",
      description: message,
      tone: "danger",
    });
  };

  const handleCreateQuestion = async (payload: {
    title: string;
    detail: string;
    tags: string[];
    anonymous: boolean;
  }) => {
    if (!session?.userId || !selectedCourse) return;
    try {
      await createStudentQuestion(
        session.userId,
        {
          course_code: selectedCourse.course_code,
          board_id: null,
          section_code:
            normalizeSectionCode(selectedCourse.section_code) || undefined,
          title: payload.title,
          detail: payload.detail,
          tags: payload.tags,
          is_anonymous: payload.anonymous,
        },
        session.accessToken,
        session.role,
      );
      await loadCourseData(false);
      setIsAskModalOpen(false);
    } catch (err) {
      showQuestionErrorNotice(
        err instanceof Error ? err.message : "Failed to post question",
      );
    }
  };

  const questions = useMemo(
    () =>
      (timeline?.items ?? [])
        .filter(
          (item): item is Extract<typeof item, { type: "question" }> =>
            item.type === "question",
        )
        .map((item) => item.question),
    [timeline],
  );
  const answeredCount = questions.filter((q) => q.status === "ANSWERED").length;
  const unansweredCount = questions.filter(
    (q) => q.status === "UNANSWERED",
  ).length;

  if (isLoading && !courseBoard && courses.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Loading course...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-slate-700">
      <Header
        studentName={
          session?.fullName || courseBoard?.student.name || "Student"
        }
        studentId={session?.userId || courseBoard?.student.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        courseTitle={
          selectedCourse
            ? `${selectedCourse.course_code}: ${selectedCourse.course_name}`
            : "My Courses"
        }
        mode="courses"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
      <ActionNoticeModal
        isOpen={Boolean(notice)}
        tone={notice?.tone}
        badge={notice?.badge}
        title={notice?.title || "Notice"}
        description={notice?.description || ""}
        confirmLabel="Got it"
        hideCancel
        onClose={() => setNotice(null)}
      />
      <AskModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onAdd={handleCreateQuestion}
        courseTitle={
          selectedCourse
            ? `${selectedCourse.course_code}${sectionLabel ? ` · ${sectionLabel}` : ""}`
            : undefined
        }
      />

      <main className="pb-10 pt-40">
        <div className="mx-auto w-full max-w-[1360px] space-y-8 px-6 xl:px-8">
          {selectedCourse ? (
            <>
              {/* ── Two-card grid: Course Home + Current Board ── */}
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.9fr)]">
                {/* Course Home card */}
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_20px_60px_rgba(129,104,192,0.12)]">
                  <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-medium uppercase tracking-[0.22em] text-[#D1388D]">
                    <BookOpen size={18} />
                    Course Home
                  </div>
                  <h2 className="text-4xl font-medium text-[#1B1B1B]">
                    {selectedCourse.course_code}
                  </h2>
                  <p className="mt-2 max-w-3xl text-2xl text-[#6F63A8]">
                    {selectedCourse.course_name}
                  </p>
                  <p className="mt-3 inline-flex rounded-full bg-[#F4F0FF] px-4 py-2 text-sm font-medium text-[#5B41FF]">
                    {sectionLabel
                      ? `Enrolled in ${sectionLabel}`
                      : "Section not assigned"}
                  </p>
                  <p className="mt-2 text-base text-slate-500">
                    Instructor: {resolvedProfessorName}
                  </p>
                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] bg-[#F4F0FF] p-5">
                      <p className="text-sm font-medium text-slate-500">
                        Active Board
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[#513FDF]">
                        {activeBoard
                          ? activeBoard.board_title || activeBoard.board_id
                          : "None"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {sectionLabel || "No section"}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[#FFF6EC] p-5">
                      <p className="text-sm font-medium text-slate-500">
                        Questions
                      </p>
                      <p className="mt-2 text-2xl font-medium text-[#D97706]">
                        {questions.length}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[#ECFDF5] p-5">
                      <p className="text-sm font-medium text-slate-500">
                        Answered
                      </p>
                      <p className="mt-2 text-2xl font-medium text-[#059669]">
                        {answeredCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Board card */}
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_20px_60px_rgba(129,104,192,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#D1388D]">
                        Current Board
                      </p>
                      <h3 className="mt-3 text-3xl font-bold text-[#1B1B1B]">
                        {activeBoard
                          ? activeBoard.board_title || activeBoard.board_id
                          : "No board open"}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        activeBoard
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {activeBoard ? "Active" : "Closed"}
                    </span>
                  </div>

                  {activeBoard ? (
                    <>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[22px] bg-[#F4F0FF] p-4">
                          <p className="text-sm text-slate-500">Unanswered</p>
                          <p className="mt-2 text-3xl font-medium text-[#513FDF]">
                            {activeBoard.unanswered_questions}
                          </p>
                        </div>
                        <div className="rounded-[22px] bg-[#FFF6EC] p-4">
                          <p className="text-sm text-slate-500">Total</p>
                          <p className="mt-2 text-3xl font-medium text-[#D97706]">
                            {activeBoard.total_questions}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-4 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock3 size={16} />
                          {formatRelativeTime(activeBoard.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquareText size={16} />
                          {activeBoard.answered_questions} answered
                        </div>
                      </div>
                      <Link
                        href={`/student/courses/board?${buildCourseQuery(
                          selectedCourse.course_code,
                          selectedCourse.section_code,
                        )}&board_id=${encodeURIComponent(activeBoard.board_id)}`}
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] px-7 py-3 text-base font-medium text-white shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
                      >
                        View Course Board
                        <MessageSquareText size={18} />
                      </Link>
                    </>
                  ) : (
                    <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                      <p className="text-xl font-medium text-slate-600">
                        No board is currently active.
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        เมื่ออาจารย์เปิด board แล้ว
                        นักศึกษาจะสามารถเข้ามาดูคำถามและคำตอบได้ที่นี่
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
              <h2 className="text-3xl font-medium text-[#1B1B1B]">
                No enrolled courses yet
              </h2>
              <p className="mt-3 text-lg text-slate-500">
                เข้าร่วมรายวิชาก่อน แล้วระบบจะแสดง course home และ board
                ของวิชานั้นให้ทันที
              </p>
            </section>
          )}

          {/* ── Activity Timeline ── */}
          <div className="mx-auto max-w-[1220px] px-0">
            {/* ── Activity Timeline (matches professor layout exactly) ── */}
            <section className="mt-10">
              <h3 className="text-3xl font-medium text-[#1B1B1B]">
                Activity Timeline
              </h3>

              <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
                {/* Filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      { label: "All", value: "All" },
                      { label: "Answered", value: "Answered" },
                      { label: "Unanswered", value: "Unanswered" },
                      { label: "Board", value: "Board" },
                    ] as { label: string; value: TimelineFilter }[]
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={`px-5 py-1.5 rounded-full text-sm font-regular transition-all border ${
                        filter === item.value
                          ? "bg-[#5B41FF] text-white border-[#5B41FF]"
                          : "text-slate-400 border-slate-200 hover:bg-slate-200 bg-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs ml-auto">
                  <Search
                    size={15}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search questions or boards..."
                    className="w-full bg-white border border-slate-200 py-2 pl-9 pr-4 rounded-full text-sm focus:outline-none"
                  />
                </div>
              </div>

              {sectionLabel ? (
                <p className="mt-4 text-sm text-[#8D84B6]">
                  Showing {sectionLabel} only.
                </p>
              ) : null}

              {/* Timeline list */}
              <div className="mt-6 space-y-5">
                {!timeline && isLoading ? (
                  <div className="rounded-[28px] bg-white px-6 py-14 text-center text-sm font-medium text-[#9B91C7] shadow-sm">
                    Loading timeline...
                  </div>
                ) : timelineItems.length === 0 ? (
                  <div className="rounded-[28px] bg-white px-6 py-14 text-center text-sm font-medium text-[#9B91C7] shadow-sm">
                    No activity found for this course yet.
                  </div>
                ) : (
                  timelineItems.map((item) =>
                    item.type === "board" ? (
                      <BoardTimelineCard
                        key={item.id}
                        board={item.board}
                        courseCode={
                          selectedCourse?.course_code ?? selectedCourseCode
                        }
                        sectionCode={selectedCourse?.section_code}
                      />
                    ) : (
                      <QuestionTimelineCard
                        key={item.id}
                        question={item.question}
                        professorName={resolvedProfessorName}
                      />
                    ),
                  )
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FAB — ask question */}
      {selectedCourse ? (
        <button
          type="button"
          onClick={() => setIsAskModalOpen(true)}
          aria-label="Ask a question"
          title="Ask a question"
          className="fixed bottom-10 right-8 z-[120] inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#5B41FF] via-[#9A4FD4] to-[#F05CA8] text-white shadow-[0_16px_34px_rgba(120,73,210,0.45)] transition hover:scale-105 hover:shadow-[0_20px_40px_rgba(120,73,210,0.55)] active:scale-95"
        >
          <MessageSquareText size={22} />
        </button>
      ) : null}
    </div>
  );
}
