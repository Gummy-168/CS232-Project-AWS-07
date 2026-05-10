"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import { useAuthSession } from "../../hooks/useAuthSession";
import {
  getProfessorQuestions,
  type ProfessorBoardSession,
  type ProfessorCourseResponse,
  type ProfessorQuestionsData,
  type ProfessorStudentQuestion,
} from "../../lib/api";

type QuestionFilter = "all" | "answered" | "unanswered" | "board";

type TimelineItem =
  | {
      type: "question";
      id: string;
      createdAt: string | null;
      question: ProfessorStudentQuestion;
    }
  | {
      type: "board";
      id: string;
      createdAt: string | null;
      board: ProfessorBoardSession;
    };

const avatarFor = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function formatSectionLabel(sectionCode: string) {
  const normalized = sectionCode.trim().toUpperCase();
  if (normalized.startsWith("SEC")) {
    return normalized;
  }
  return `SEC ${normalized}`;
}

function initialsFromSeed(seed: string) {
  const normalized = seed.trim();
  if (!normalized) {
    return "?";
  }
  const chunks = normalized.split(/[\s\-_]+/).filter(Boolean);
  if (chunks.length >= 2) {
    return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
  }
  return normalized.slice(0, 2).toUpperCase();
}

function buildCourseQuery(courseCode: string, sectionCode?: string) {
  const query = new URLSearchParams();
  query.set("course_code", courseCode.trim().toUpperCase());
  if (sectionCode?.trim()) {
    query.set("sec", sectionCode.trim().toUpperCase());
  }
  return query.toString();
}

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function statusClasses(status: ProfessorStudentQuestion["status"]) {
  return status === "ANSWERED"
    ? "bg-emerald-50 text-emerald-600"
    : "bg-orange-50 text-orange-500";
}

function sortTimeline(items: TimelineItem[]) {
  return items.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function Avatar({ seed, alt }: { seed: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6A5BFF] to-[#E34BA9] text-white font-semibold flex items-center justify-center text-xs">
        {initialsFromSeed(seed)}
      </div>
    );
  }

  return (
    <img
      src={avatarFor(seed)}
      alt={alt}
      className="w-12 h-12 rounded-full bg-slate-100 object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProfessorQuestionsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QuestionFilter>("all");
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";
  const selectedSectionCode =
    searchParams.get("sec")?.trim().toUpperCase() || undefined;
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const handleCourseCreated = (event: Event) => {
      const createdCourse = (event as CustomEvent<ProfessorCourseResponse>).detail;
      if (!createdCourse?.course_code) {
        return;
      }
      setLoading(true);
      router.replace(
        `${pathname}?${buildCourseQuery(
          createdCourse.course_code.trim().toUpperCase(),
        )}`,
      );
      setRefreshToken((prev) => prev + 1);
    };

    window.addEventListener("askademy-course-created", handleCourseCreated);
    return () => {
      window.removeEventListener("askademy-course-created", handleCourseCreated);
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    const status = filter === "board" ? "all" : filter;

    getProfessorQuestions(session.userId, {
      courseCode: selectedCourseCode || undefined,
      sectionCode: selectedSectionCode,
      status,
      search: search || undefined,
    })
      .then((response) => {
        setError("");
        setData(response);
        if (!selectedCourseCode && response.selected_course_code) {
          router.replace(
            `${pathname}?course_code=${encodeURIComponent(
              response.selected_course_code.trim().toUpperCase(),
            )}`,
          );
        }
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load professor questions";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    pathname,
    router,
    session?.userId,
    selectedCourseCode,
    selectedSectionCode,
    filter,
    search,
    refreshToken,
  ]);

  const timelineItems = useMemo(() => {
    if (!data) {
      return [];
    }

    const questions: TimelineItem[] =
      filter === "board"
        ? []
        : data.student_questions.map((question) => ({
            type: "question",
            id: question.id,
            createdAt: question.created_at,
            question,
          }));

    const boards: TimelineItem[] =
      filter === "answered" || filter === "unanswered"
        ? []
        : data.board_sessions.map((board) => ({
            type: "board",
            id: board.board_id,
            createdAt: board.created_at,
            board,
          }));

    return sortTimeline([...questions, ...boards]);
  }, [data, filter]);

  return (
    <div className="h-full bg-[#FCF9F8] font-sans text-slate-700 overflow-y-auto">
      <Header
        professorName={session?.nickname || data?.professor?.name}
        codeId={data?.course?.code}
        onJoinCourse={() => {
          const suffix = selectedCourseCode
            ? `?${buildCourseQuery(selectedCourseCode, selectedSectionCode)}`
            : "";
          router.push(`/professor/analytics${suffix}`);
        }}
        buttonLabel="Open Analytics"
        mode="questions"
      />

      <main className="px-6 pt-[126px] pb-12 w-full">
        <section className="bg-white rounded-[28px] shadow-sm border border-slate-100 mb-8 p-8 max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D1388D]">
              Professor Feed
            </p>
            <h2 className="mt-3 text-3xl text-[#1B1B1B]">
              Overall activity timeline for your courses
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              This page is read-only and only shows timeline activity from courses
              assigned to you. Use it to monitor board openings and student
              questions across your classes.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <select
              value={selectedCourseCode}
              onChange={(event) => {
                setLoading(true);
                const nextCourseCode = event.target.value.trim().toUpperCase();
                if (nextCourseCode) {
                  router.replace(`${pathname}?${buildCourseQuery(nextCourseCode)}`);
                } else {
                  router.replace(pathname);
                }
              }}
              className="min-w-[280px] max-w-full px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none"
            >
              <option value="">All courses</option>
              {data?.courses.map((course) => (
                <option key={course.course_code} value={course.course_code}>
                  {course.course_code}: {course.course_name}
                </option>
              ))}
            </select>

            <select
              value={selectedSectionCode || ""}
              onChange={(event) => {
                setLoading(true);
                const nextSectionCode = event.target.value.trim().toUpperCase();
                if (selectedCourseCode) {
                  router.replace(
                    `${pathname}?${buildCourseQuery(
                      selectedCourseCode,
                      nextSectionCode || undefined,
                    )}`,
                  );
                }
              }}
              disabled={!selectedCourseCode}
              className="min-w-[220px] max-w-full px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none disabled:opacity-40"
            >
              <option value="">All Sections</option>
              {data?.sections.map((section) => (
                <option key={section.section_id} value={section.section_code}>
                  {formatSectionLabel(section.section_code)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          <h3 className="text-2xl text-[#1B1B1B] mb-4">Activity Timeline</h3>
          {selectedSectionCode ? (
            <p className="mb-4 text-sm text-slate-500">
              Showing activity for {formatSectionLabel(selectedSectionCode)} only.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 mb-7">
            {[
              { label: "All", value: "all" },
              { label: "Answered", value: "answered" },
              { label: "Unanswered", value: "unanswered" },
              { label: "Board", value: "board" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setFilter(item.value as QuestionFilter);
                }}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  filter === item.value
                    ? "bg-[#5B41FF] text-white border-[#5B41FF] shadow-sm"
                    : "text-slate-400 border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                {item.label}
              </button>
            ))}

            <select
              value={selectedCourseCode}
              onChange={(event) => {
                setLoading(true);
                const nextCourseCode = event.target.value.trim().toUpperCase();
                if (nextCourseCode) {
                  router.replace(`${pathname}?${buildCourseQuery(nextCourseCode)}`);
                } else {
                  router.replace(pathname);
                }
              }}
              className="h-9 rounded-full border border-slate-200 bg-white px-4 pr-8 text-sm text-slate-500 focus:outline-none"
            >
              <option value="">By Course</option>
              {data?.courses.map((course) => (
                <option key={course.course_code} value={course.course_code}>
                  {course.course_code}
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[230px] max-w-sm ml-auto">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                placeholder="Search activity timeline..."
                className="w-full bg-white border border-slate-200 py-2 pl-9 pr-4 rounded-full text-sm focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
              Loading timeline...
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl p-8 text-center text-rose-500">
              {error}
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400">
              No activities found
            </div>
          ) : (
            <div className="space-y-6">
              {timelineItems.map((item) =>
                item.type === "board" ? (
                  <BoardActivityCard key={`board-${item.id}`} board={item.board} />
                ) : (
                  <QuestionActivityCard
                    key={`question-${item.id}`}
                    question={item.question}
                  />
                ),
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function BoardActivityCard({ board }: { board: ProfessorBoardSession }) {
  const isActive = board.status.trim().toUpperCase() === "ACTIVE";
  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      <div
        className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
          isActive ? "bg-violet-50 text-violet-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full inline-block ${
            isActive ? "bg-violet-500" : "bg-slate-400"
          }`}
        />
        {isActive ? "BOARD SESSION · ACTIVE" : "BOARD SESSION · CLOSED"}
      </div>

      <div className="flex gap-4">
        <Avatar seed={board.board_id} alt={`${board.course_code} board avatar`} />
        <div className="flex-1 pr-20">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="font-bold text-slate-800">{board.course_code} Course Bot</span>
            {board.section_code ? (
              <span className="rounded-full bg-[#FFF3E8] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D97706]">
                {formatSectionLabel(board.section_code)}
              </span>
            ) : null}
            <span className="text-xs text-slate-400">
              {formatRelativeTime(board.created_at)}
            </span>
          </div>

          <div className="bg-[#F7F1FB] rounded-2xl p-5">
            <p className="text-[#513FDF] font-bold text-lg mb-1">
              {board.board_title || board.board_id}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {board.total_questions} questions / {board.answered_questions} answered
            </p>
            <Link
              href={`/professor/courses/boardreview?course_code=${encodeURIComponent(
                board.course_code,
              )}&board_id=${encodeURIComponent(board.board_id)}${
                board.section_code ? `&sec=${encodeURIComponent(board.section_code)}` : ""
              }`}
              className="inline-flex items-center gap-2 bg-[#513FDF] text-white px-5 py-2 rounded-full text-sm hover:scale-105 active:scale-95 transition-all"
            >
              <Eye size={15} />
              Review Session
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function QuestionActivityCard({
  question,
}: {
  question: ProfessorStudentQuestion;
}) {
  const isAnswered = question.status === "ANSWERED";
  const repliesCount = question.replies.length;
  const isBoardQuestion = Boolean(question.board_id);
  const questionKindLabel = isBoardQuestion ? "Board Question" : "General Question";

  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      <div
        className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${statusClasses(
          question.status,
        )}`}
      >
        <span
          className={`w-2 h-2 rounded-full inline-block ${
            isAnswered ? "bg-emerald-400" : "bg-orange-400"
          }`}
        />
        {question.status}
      </div>

      <div className="flex gap-4">
        <Avatar seed={question.student_id} alt={`${question.student_name} avatar`} />

        <div className="flex-1 pr-20">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-bold text-slate-800">{question.student_name}</span>
            <span className="rounded-full bg-[#F1ECFF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6F5CE5]">
              {question.course_code}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {questionKindLabel}
            </span>
            {question.section_code ? (
              <span className="rounded-full bg-[#FFF3E8] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D97706]">
                {formatSectionLabel(question.section_code)}
              </span>
            ) : null}
            {question.board_title ? (
              <span className="rounded-full bg-[#F7F1FB] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#513FDF]">
                {question.board_title}
              </span>
            ) : null}
            <span className="text-xs text-slate-400">
              {formatRelativeTime(question.created_at)}
            </span>
          </div>

          <p className="text-slate-800 font-semibold mb-1">{question.title}</p>
          <p className="text-slate-700 mb-4">{question.content}</p>

          {question.tags?.length ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
            <span>{repliesCount} replies in this thread</span>
            <div className="flex items-center gap-3">
              {isBoardQuestion && question.board_id ? (
                <Link
                  href={`/professor/courses/boardreview?${buildCourseQuery(
                    question.course_code,
                    question.section_code || undefined,
                  )}&board_id=${encodeURIComponent(question.board_id)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E7E0FC] px-4 py-1.5 text-[#5B41FF] hover:bg-[#F8F6FF] transition-all"
                >
                  View Board
                </Link>
              ) : null}
              <Link
                href={`/professor/courses?${buildCourseQuery(
                  question.course_code,
                  question.section_code || undefined,
                )}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#E7E0FC] px-4 py-1.5 text-[#5B41FF] hover:bg-[#F8F6FF] transition-all"
              >
                View Course Activity
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
