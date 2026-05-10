"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Clock3, MessageSquareText, Search, UserRound } from "lucide-react";
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
  if (!value) {
    return "just now";
  }

  try {
    const parsed = parseApiDate(value);
    if (!parsed) {
      return "just now";
    }
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return "just now";
  }
}

function QuestionCard({
  question,
  professorName,
}: {
  question: StudentQuestion;
  professorName?: string;
}) {
  const isAnswered = question.status === "ANSWERED";
  const resolvedProfessorName = professorName?.trim() || "Professor";
  const questionScope = question.board_id ? "Board Question" : "General Question";

  return (
    <article
      className={`rounded-[28px] border p-6 shadow-sm transition-all ${
        isAnswered
          ? "border-emerald-100 bg-emerald-50/70"
          : "border-orange-100 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-white/80 px-3 py-1 font-medium text-[#6F63A8]">
              {question.course_code}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              {questionScope}
            </span>
            {formatSectionLabel(question.section_code) ? (
              <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-medium text-[#C97316]">
                {formatSectionLabel(question.section_code)}
              </span>
            ) : null}
            <span>{formatRelativeTime(question.created_at)}</span>
            {question.is_anonymous && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                Anonymous
              </span>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-[#1B1B1B]">
              {question.title || question.content}
            </h3>
            {question.title && question.content && question.content !== question.title && (
              <p className="mt-2 text-base leading-7 text-slate-600">
                {question.content}
              </p>
            )}
          </div>
        </div>

        <span
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            isAnswered
              ? "bg-emerald-100 text-emerald-700"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          {isAnswered ? "Answered" : "Unanswered"}
        </span>
      </div>

      {(question.reply_content || (question.replies ?? []).length > 0) && (
        <div className="mt-5 space-y-3 rounded-[22px] border border-white/80 bg-white/80 p-4">
          {question.reply_content && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Professor Reply
              </p>
              <p className="text-sm leading-6 text-slate-700">
                {question.reply_content}
              </p>
            </div>
          )}

          {(question.replies ?? []).map((reply) => (
            <div
              key={reply.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-sm text-slate-500">
                <span className="font-medium text-slate-700">
                  {reply.is_professor
                    ? reply.author_full_name?.trim() || resolvedProfessorName
                    : reply.author_name}
                </span>
                <span>{formatRelativeTime(reply.created_at)}</span>
              </div>
              <p className="text-sm leading-6 text-slate-600">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function BoardHistoryCard({
  board,
  courseCode,
  sectionCode,
}: {
  board: StudentBoardSession;
  courseCode: string;
  sectionCode?: string | null;
}) {
  const boardStatus = board.status.trim().toUpperCase();
  const isActive = boardStatus === "ACTIVE";

  const buildCourseQuery = (code: string, section?: string | null) => {
    return buildCourseQueryString(code, section);
  };

  return (
    <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition-all">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-[#F4F0FF] px-3 py-1 font-medium text-[#6F63A8]">
              {board.course_code}
            </span>
            {formatSectionLabel(board.section_code) ? (
              <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-medium text-[#C97316]">
                {formatSectionLabel(board.section_code)}
              </span>
            ) : null}
            <span>{formatRelativeTime(board.created_at)}</span>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-[#1B1B1B]">
              {board.board_title || board.board_id}
            </h3>
            <p className="mt-2 text-base leading-7 text-slate-600">
              {isActive
                ? "Board is currently active for this section."
                : "Board session has been closed and remains available for review."}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {isActive ? "Active" : "Closed"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] bg-[#F4F0FF] p-4">
          <p className="text-sm text-slate-500">Unanswered</p>
          <p className="mt-2 text-3xl font-semibold text-[#513FDF]">
            {board.unanswered_questions}
          </p>
        </div>
        <div className="rounded-[22px] bg-[#ECFDF5] p-4">
          <p className="text-sm text-slate-500">Answered</p>
          <p className="mt-2 text-3xl font-semibold text-[#059669]">
            {board.answered_questions}
          </p>
        </div>
        <div className="rounded-[22px] bg-[#FFF6EC] p-4">
          <p className="text-sm text-slate-500">Total Questions</p>
          <p className="mt-2 text-3xl font-semibold text-[#D97706]">
            {board.total_questions}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-500">
          {board.closed_at
            ? `Closed ${formatRelativeTime(board.closed_at)}`
            : isActive
              ? "Open for this class session"
              : "Board status available for review"}
        </div>
        <Link
          href={`/student/courses/board?${buildCourseQuery(
            courseCode,
            sectionCode,
          )}&board_id=${encodeURIComponent(board.board_id)}`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:scale-[1.01]"
        >
          {isActive ? "View Board" : "Review Session"}
          <MessageSquareText size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function StudentCourseHomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() ?? "";
  const selectedSectionCode = normalizeSectionCode(searchParams.get("sec"));

  const buildCourseQuery = (courseCode: string, sectionCode?: string | null) =>
    buildCourseQueryString(courseCode, sectionCode);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [courseBoard, setCourseBoard] = useState<StudentCourseBoardData | null>(null);
  const [timeline, setTimeline] = useState<StudentActivityTimelineResponse | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TimelineFilter>("All");
  const [notice, setNotice] = useState<NoticeState>(null);
  const selectedCourse =
    courses.find((course) => {
      const matchesCourse =
        course.course_code.trim().toUpperCase() === selectedCourseCode;
      const matchesSection =
        selectedSectionCode.length === 0 || sectionCodesMatch(course.section_code, selectedSectionCode);
      return matchesCourse && matchesSection;
    }) ?? null;
  const resolvedSectionCode = selectedCourse?.section_code || selectedSectionCode || undefined;
  const sectionLabel = formatSectionLabel(resolvedSectionCode);
  const resolvedProfessorName =
    selectedCourse?.professor_full_name?.trim() ||
    courseBoard?.course.professor_full_name?.trim() ||
    selectedCourse?.professor_name ||
    courseBoard?.course.professor_name ||
    "Professor";

  const loadCourseData = useCallback(async (showLoading = true) => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }

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
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [
    resolvedSectionCode,
    selectedCourse?.section_code,
    selectedCourseCode,
    selectedSectionCode,
    session?.accessToken,
    session?.role,
    session?.userId,
  ]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    getStudentCourses(session.userId)
      .then((response) => {
        setCourses(response.courses);

        if (response.courses.length === 0) {
          setIsLoading(false);
          return;
        }

        const matchingCourses = response.courses.filter(
          (course) => course.course_code.trim().toUpperCase() === selectedCourseCode,
        );
        const exactCourse = matchingCourses.find(
          (course) => sectionCodesMatch(course.section_code, selectedSectionCode),
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

        if (matchingCourses.length === 0) {
          router.replace(
            `/student/courses?${buildCourseQuery(
              response.courses[0].course_code,
              response.courses[0].section_code,
            )}`,
          );
          return;
        }

        if (
          (!selectedSectionCode && Boolean(matchingCourses[0].section_code?.trim())) ||
          (selectedSectionCode && !exactCourse)
        ) {
          router.replace(
            `/student/courses?${buildCourseQuery(
              matchingCourses[0].course_code,
              matchingCourses[0].section_code,
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
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    void loadCourseData();
  }, [
    loadCourseData,
    resolvedSectionCode,
    selectedCourse?.section_code,
    selectedCourseCode,
    selectedSectionCode,
    session?.accessToken,
    session?.role,
    session?.userId,
  ]);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    const refreshTimeline = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void loadCourseData(false);
    };

    const intervalId = window.setInterval(refreshTimeline, 10000);
    window.addEventListener("focus", refreshTimeline);
    document.addEventListener("visibilitychange", refreshTimeline);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshTimeline);
      document.removeEventListener("visibilitychange", refreshTimeline);
    };
  }, [loadCourseData, selectedCourseCode, session?.userId]);

  const timelineItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sourceItems = timeline?.items ?? [];

    const questions = sourceItems
      .filter((item): item is Extract<StudentActivityTimelineResponse["items"][number], { type: "question" }> => item.type === "question")
      .map((item) => item.question);

    const questionItems = questions
      .filter((question) => {
        const matchesFilter =
          filter === "All" ||
          (filter === "Answered" && question.status === "ANSWERED") ||
          (filter === "Unanswered" && question.status === "UNANSWERED");

        const matchesSearch =
          query.length === 0 ||
          question.title.toLowerCase().includes(query) ||
          question.content.toLowerCase().includes(query) ||
          question.author_name.toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
      })
      .map((question) => ({
        type: "question" as const,
        id: question.id,
        createdAt: question.created_at,
        question,
      }));

    const boardItems =
      filter === "Answered" || filter === "Unanswered"
        ? []
        : sourceItems
            .filter((item): item is Extract<StudentActivityTimelineResponse["items"][number], { type: "board" }> => item.type === "board")
            .map((item) => item.board)
            .filter((board) => {
              const matchesSearch =
                query.length === 0 ||
                (board.board_title || board.board_id).toLowerCase().includes(query) ||
                board.course_code.toLowerCase().includes(query) ||
                (board.section_code || "").toLowerCase().includes(query);

              return matchesSearch && (filter === "All" || filter === "Board");
            })
            .map((board) => ({
              type: "board" as const,
              id: board.board_id,
              createdAt: board.created_at,
              board,
            }));

    return [...boardItems, ...questionItems].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [filter, search, timeline]);

  const activeBoard = courseBoard?.active_board ?? null;
  const questions = useMemo(
    () =>
      (timeline?.items ?? [])
        .filter((item): item is Extract<StudentActivityTimelineResponse["items"][number], { type: "question" }> => item.type === "question")
        .map((item) => item.question),
    [timeline],
  );
  const answeredCount = questions.filter((question) => question.status === "ANSWERED").length;
  const unansweredCount = questions.filter(
    (question) => question.status === "UNANSWERED",
  ).length;

  const showQuestionErrorNotice = (message: string) => {
    if (message.toLowerCase().includes("different section")) {
      setNotice({
        badge: "Section mismatch",
        title: "You can only post in your enrolled section",
        description:
          "This question was blocked because the current board belongs to a different section. Please open the board for your own section and try again.",
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
    if (!session?.userId || !selectedCourse) {
      return;
    }

    try {
      await createStudentQuestion(session.userId, {
        course_code: selectedCourse.course_code,
        board_id: null,
        section_code: normalizeSectionCode(selectedCourse.section_code) || undefined,
        title: payload.title,
        detail: payload.detail,
        tags: payload.tags,
        is_anonymous: payload.anonymous,
      }, session.accessToken, session.role);
      await loadCourseData(false);
      setIsAskModalOpen(false);
    } catch (err) {
      showQuestionErrorNotice(
        err instanceof Error ? err.message : "Failed to post question",
      );
    }
  };

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
        studentName={session?.fullName || courseBoard?.student.name || "Student"}
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
            ? `${selectedCourse.course_code}${
                sectionLabel ? ` · ${sectionLabel}` : ""
              }`
            : undefined
        }
      />

      <main className="pb-10 pt-40">
        <div className="mx-auto w-full max-w-[1360px] space-y-8 px-6 xl:px-8">
          {selectedCourse ? (
            <>
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.9fr)]">
                <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_20px_60px_rgba(129,104,192,0.12)]">
                  <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#D1388D]">
                    <BookOpen size={18} />
                    Course Home
                  </div>

                  <h2 className="text-4xl font-semibold text-[#1B1B1B]">
                    {selectedCourse.course_code}
                  </h2>
                  <p className="mt-2 max-w-3xl text-2xl text-[#6F63A8]">
                    {selectedCourse.course_name}
                  </p>
                  <p className="mt-3 inline-flex rounded-full bg-[#F4F0FF] px-4 py-2 text-sm font-semibold text-[#5B41FF]">
                    {sectionLabel ? `Enrolled in ${sectionLabel}` : "Section not assigned"}
                  </p>
                  <p className="mt-2 text-base text-slate-500">
                    Instructor: {resolvedProfessorName}
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] bg-[#F4F0FF] p-5">
                      <p className="text-sm font-medium text-slate-500">Active Board</p>
                      <p className="mt-2 text-2xl font-semibold text-[#513FDF]">
                        {activeBoard ? activeBoard.board_title || activeBoard.board_id : "None"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {sectionLabel || "No section"}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[#FFF6EC] p-5">
                      <p className="text-sm font-medium text-slate-500">Questions</p>
                      <p className="mt-2 text-2xl font-semibold text-[#D97706]">
                        {questions.length}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[#ECFDF5] p-5">
                      <p className="text-sm font-medium text-slate-500">Answered</p>
                      <p className="mt-2 text-2xl font-semibold text-[#059669]">
                        {answeredCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_20px_60px_rgba(129,104,192,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D1388D]">
                        Current Board
                      </p>
                      <h3 className="mt-3 text-3xl font-semibold text-[#1B1B1B]">
                        {activeBoard ? activeBoard.board_title || activeBoard.board_id : "No board open"}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
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
                          <p className="mt-2 text-3xl font-semibold text-[#513FDF]">
                            {activeBoard.unanswered_questions}
                          </p>
                        </div>
                        <div className="rounded-[22px] bg-[#FFF6EC] p-4">
                          <p className="text-sm text-slate-500">Total</p>
                          <p className="mt-2 text-3xl font-semibold text-[#D97706]">
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
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] px-7 py-3 text-base font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
                      >
                        View Course Board
                        <MessageSquareText size={18} />
                      </Link>
                    </>
                  ) : (
                    <div className="mt-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                      <p className="text-xl font-semibold text-slate-600">
                        No board is currently active.
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        เมื่ออาจารย์เปิด board แล้ว นักศึกษาจะสามารถเข้ามาดูคำถามและคำตอบได้ที่นี่
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-5xl font-semibold text-[#1B1B1B]">
                      Activity Timeline
                    </h3>
                    <p className="mt-2 text-xl text-[#8A80B9]">
                      ติดตามกิจกรรมและคำถามในรายวิชา {selectedCourse.course_code}
                      {sectionLabel ? ` · ${sectionLabel}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {(["All", "Answered", "Unanswered", "Board"] as TimelineFilter[]).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => setFilter(option)}
                          className={`rounded-full border px-5 py-2.5 text-base font-medium transition-all ${
                            filter === option
                              ? "border-[#5B41FF] bg-[#5B41FF] text-white"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {option}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="relative w-full">
                    <Search
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A08ECF]"
                      size={22}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search questions or answers..."
                      className="h-16 w-full rounded-full border border-slate-200 bg-white pl-14 pr-6 text-lg text-slate-700 shadow-sm outline-none transition focus:border-[#C4B5FD]"
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-5">
                  {timelineItems.length > 0 ? (
                    timelineItems.map((item) =>
                      item.type === "board" ? (
                        <BoardHistoryCard
                          key={item.id}
                          board={item.board}
                          courseCode={selectedCourse.course_code}
                          sectionCode={selectedCourse.section_code}
                        />
                      ) : (
                        <QuestionCard
                          key={item.id}
                          question={item.question}
                          professorName={resolvedProfessorName}
                        />
                      ),
                    )
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                      No activity in this course yet.
                    </div>
                  )}
                </div>

                <aside className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_20px_60px_rgba(129,104,192,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6F63A8]">
                        Course Snapshot
                      </p>
                      <h4 className="mt-3 text-2xl font-semibold text-[#1B1B1B]">
                        {selectedCourse.course_code}
                      </h4>
                      <p className="mt-2 text-sm font-semibold text-[#6F63A8]">
                        {sectionLabel || "No section"}
                      </p>
                    </div>
                    <UserRound className="text-[#8B5CF6]" size={24} />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[22px] bg-[#F8F5FF] p-5">
                      <p className="text-sm text-slate-500">Answered Questions</p>
                      <p className="mt-2 text-3xl font-semibold text-[#513FDF]">
                        {answeredCount}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[#FFF8EF] p-5">
                      <p className="text-sm text-slate-500">Pending Questions</p>
                      <p className="mt-2 text-3xl font-semibold text-[#EA580C]">
                        {unansweredCount}
                      </p>
                    </div>
                    <div className="rounded-[22px] bg-[#F3FAF7] p-5">
                      <p className="text-sm text-slate-500">Professor</p>
                      <p className="mt-2 text-xl font-semibold text-slate-700">
                        {resolvedProfessorName}
                      </p>
                    </div>
                  </div>
                </aside>
              </section>
            </>
          ) : (
            <section className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
              <h2 className="text-3xl font-semibold text-[#1B1B1B]">
                No enrolled courses yet
              </h2>
              <p className="mt-3 text-lg text-slate-500">
                เข้าร่วมรายวิชาก่อน แล้วระบบจะแสดง course home และ board ของวิชานั้นให้ทันที
              </p>
            </section>
          )}
        </div>
      </main>
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
