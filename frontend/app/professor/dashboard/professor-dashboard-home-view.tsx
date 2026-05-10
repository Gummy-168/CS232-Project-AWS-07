"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, CornerDownLeft, Eye, Search } from "lucide-react";
import Header from "@/app/components/Header";
import CreateCourse from "@/app/components/createcourse";
import { useAuthSession } from "@/app/hooks/useAuthSession";
import {
  createProfessorBoard,
  createProfessorQuestionReply,
  deleteProfessorQuestion,
  getProfessorQuestions,
  updateProfessorQuestionStatus,
  type ProfessorBoardSession,
  type ProfessorCourseResponse,
  type ProfessorQuestionsData,
  type ProfessorStudentQuestion,
} from "@/app/lib/api";

type DashboardFilter = "all" | "answered" | "unanswered" | "board";
type ReplyDrafts = Record<string, string>;

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

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
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

function buildCourseQuery(courseCode: string, sectionCode?: string) {
  const query = new URLSearchParams();
  query.set("course_code", courseCode.trim().toUpperCase());
  if (sectionCode?.trim()) {
    query.set("sec", sectionCode.trim().toUpperCase());
  }
  return query.toString();
}

function formatSectionLabel(sectionCode: string) {
  const normalized = sectionCode.trim().toUpperCase();
  if (normalized.startsWith("SEC")) {
    return normalized;
  }
  return `SEC ${normalized}`;
}

function sortByCreatedAt<T extends { createdAt: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
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

function Avatar({ seed, alt }: { seed: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6A5BFF] to-[#E34BA9] text-xs font-semibold text-white shadow-sm">
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

function boardStatusPillClasses(status: string) {
  return status.toUpperCase() === "ACTIVE"
    ? "bg-violet-100 text-violet-700"
    : "bg-slate-100 text-slate-500";
}

function questionStatusPillClasses(status: ProfessorStudentQuestion["status"]) {
  return status === "ANSWERED"
    ? "bg-emerald-50 text-emerald-600"
    : "bg-amber-50 text-amber-600";
}

export default function ProfessorDashboardHomeView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isHydrated } = useAuthSession();

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [search, setSearch] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<ReplyDrafts>({});
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [refreshToken, setRefreshToken] = useState(0);

  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";
  const selectedSectionCode =
    searchParams.get("sec")?.trim().toUpperCase() || undefined;

  useEffect(() => {
    const handleCourseCreated = (event: Event) => {
      const createdCourse = (event as CustomEvent<ProfessorCourseResponse>).detail;
      if (!createdCourse?.course_code) {
        return;
      }

      router.replace(
        `${pathname}?course_code=${encodeURIComponent(
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
    if (!session?.userId || session.role !== "professor") {
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
        setData(response);
        setError("");
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
          err instanceof Error ? err.message : "Failed to load professor dashboard";
        setError(message);
      });
  }, [
    filter,
    pathname,
    refreshToken,
    router,
    search,
    selectedCourseCode,
    selectedSectionCode,
    session?.role,
    session?.userId,
  ]);

  const courseOptions = useMemo(() => data?.courses ?? [], [data?.courses]);
  const sectionOptions = useMemo(() => data?.sections ?? [], [data?.sections]);
  const currentCourse = courseOptions.find(
    (course) => course.course_code.trim().toUpperCase() === (data?.selected_course_code || "").trim().toUpperCase(),
  );
  const currentCourseTitle =
    data?.course.title || currentCourse?.course_name || selectedCourseCode || "No course selected";

  const timelineItems = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();
    const questions: TimelineItem[] =
      filter === "board"
        ? []
        : data.student_questions
            .filter((question) => {
              if (filter === "answered") {
                return question.status === "ANSWERED";
              }
              if (filter === "unanswered") {
                return question.status !== "ANSWERED";
              }
              return true;
            })
            .filter((question) => {
              if (!normalizedSearch) {
                return true;
              }

              return [
                question.student_name,
                question.title,
                question.content,
                question.course_code,
                question.section_code || "",
              ]
                .join(" ")
                .toLowerCase()
                .includes(normalizedSearch);
            })
            .map((question) => ({
              type: "question" as const,
              id: question.id,
              createdAt: question.created_at,
              question,
            }));

    const boards: TimelineItem[] =
      filter === "answered" || filter === "unanswered"
        ? []
        : data.board_sessions
            .filter((board) => {
              if (!normalizedSearch) {
                return true;
              }
              return [
                board.board_title || board.board_id,
                board.course_code,
                board.course_name,
                board.section_code || "",
              ]
                .join(" ")
                .toLowerCase()
                .includes(normalizedSearch);
            })
            .map((board) => ({
              type: "board" as const,
              id: board.board_id,
              createdAt: board.created_at,
              board,
            }));

    return sortByCreatedAt([...questions, ...boards]);
  }, [data, filter, search]);

  const createBoardTargetSection = useMemo(() => {
    if (selectedSectionCode) {
      return selectedSectionCode;
    }
    if (sectionOptions.length === 1) {
      return sectionOptions[0]?.section_code?.trim().toUpperCase();
    }
    return undefined;
  }, [sectionOptions, selectedSectionCode]);

  const refresh = () => {
    setRefreshToken((prev) => prev + 1);
  };

  const handleCreateBoard = async () => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    if (!createBoardTargetSection) {
      router.push(`/professor/courses?course_code=${encodeURIComponent(selectedCourseCode)}`);
      return;
    }

    const title = window.prompt("Board title (e.g. Week 6 - AWS Deployment)");
    if (title === null) {
      return;
    }

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      window.alert("Please enter a board title.");
      return;
    }

    try {
      await createProfessorBoard(
        session.userId,
        selectedCourseCode,
        createBoardTargetSection,
        { boardTitle: normalizedTitle },
      );
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create board failed";
      if (message.toLowerCase().includes("active board")) {
        const forceReplace = window.confirm(
          `${message}\n\nDo you want to close the current board and open a new one?`,
        );
        if (!forceReplace) {
          return;
        }
        try {
          await createProfessorBoard(
            session.userId,
            selectedCourseCode,
            createBoardTargetSection,
            {
              boardTitle: normalizedTitle,
              forceCloseExisting: true,
            },
          );
          refresh();
          return;
        } catch (forceErr) {
          window.alert(
            forceErr instanceof Error ? forceErr.message : "Create board failed",
          );
          return;
        }
      }

      window.alert(message);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!session?.userId) {
      return;
    }

    if (!window.confirm("Delete this question?")) {
      return;
    }

    try {
      await deleteProfessorQuestion(session.userId, questionId);
      refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleToggleAnswered = async (
    questionId: string,
    isAnswered: boolean,
  ) => {
    if (!session?.userId) {
      return;
    }

    try {
      await updateProfessorQuestionStatus(
        session.userId,
        questionId,
        isAnswered ? "unanswered" : "answered",
      );
      refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update status failed");
    }
  };

  const handleReply = async (questionId: string) => {
    if (!session?.userId) {
      return;
    }

    const content = replyDrafts[questionId]?.trim();
    if (!content) {
      return;
    }

    try {
      await createProfessorQuestionReply(session.userId, questionId, { content });
      setReplyDrafts((prev) => ({ ...prev, [questionId]: "" }));
      setOpenReplies((prev) => ({ ...prev, [questionId]: true }));
      refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Reply failed");
    }
  };

  const professorName =
    session?.fullName || session?.nickname || data?.professor?.full_name || data?.professor?.name;

  if (isHydrated && (!session?.userId || session.role !== "professor")) {
    return (
      <div className="min-h-screen bg-[#FCF9F8] px-8 py-16 text-center text-[#8D84B6]">
        Please sign in with a professor account to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-slate-700">
      <Header
        professorName={professorName}
        onJoinCourse={() => setIsCourseModalOpen(true)}
        buttonLabel="Create Course"
        mode="questions"
      />

      <CreateCourse
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
      />

      <main className="pb-14 pt-32">
        <div className="mx-auto max-w-[1220px] px-6">
          <section className="rounded-[36px] bg-white px-8 py-8 shadow-[0_20px_60px_rgba(104,74,191,0.08)]">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold text-[#1B1B1B]">
                {selectedCourseCode ? `${selectedCourseCode}: ${currentCourseTitle}` : currentCourseTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[#8D84B6]">
                {createBoardTargetSection
                  ? `Create a new board for ${formatSectionLabel(createBoardTargetSection)} and start the class conversation.`
                  : "Select a course section in My Courses if you want to open a board for a specific section."}
              </p>
              <button
                type="button"
                onClick={() => void handleCreateBoard()}
                disabled={!selectedCourseCode}
                className="mt-8 rounded-full bg-gradient-to-r from-[#5B41FF] to-[#E355A6] px-12 py-4 text-xl font-semibold text-white shadow-lg shadow-violet-100 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Board
              </button>
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-[2.1rem] font-bold text-[#1B1B1B]">ActivityTimeline</h3>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {[
                { label: "All", value: "all" },
                { label: "Answered", value: "answered" },
                { label: "Unanswered", value: "unanswered" },
                { label: "Board", value: "board" },
              ].map((item) => {
                const active = filter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value as DashboardFilter)}
                    className={`rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition ${
                      active
                        ? "bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] text-white"
                        : "border border-[#ECE6FB] bg-white text-[#7E75A4] hover:border-[#D7CCF6]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <select
                value={selectedCourseCode}
                onChange={(event) => {
                  const nextCourseCode = event.target.value.trim().toUpperCase();
                  if (nextCourseCode) {
                    router.replace(`${pathname}?${buildCourseQuery(nextCourseCode)}`);
                  } else {
                    router.replace(pathname);
                  }
                }}
                className="rounded-full border border-[#ECE6FB] bg-white px-4 py-2.5 text-sm font-medium text-[#6C6297] shadow-sm outline-none"
              >
                <option value="">By Course</option>
                {courseOptions.map((course) => (
                  <option key={course.course_code} value={course.course_code}>
                    {course.course_code}
                  </option>
                ))}
              </select>

              <div className="relative min-w-[260px] flex-1">
                <Search
                  size={18}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#7C739F]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search my questions..."
                  className="w-full rounded-full border border-[#ECE6FB] bg-white px-5 py-3 pr-12 text-sm font-medium text-[#443A66] shadow-sm outline-none placeholder:text-[#A79FC4]"
                />
              </div>
            </div>

            {selectedSectionCode ? (
              <p className="mt-4 text-sm text-[#8D84B6]">
                Showing {formatSectionLabel(selectedSectionCode)} only.
              </p>
            ) : null}

            <div className="mt-6 space-y-5">
              {!data && !error ? (
                <div className="rounded-[28px] bg-white px-6 py-14 text-center text-sm font-medium text-[#9B91C7] shadow-sm">
                  Loading dashboard...
                </div>
              ) : error ? (
                <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-5 text-sm font-medium text-rose-600">
                  {error}
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="rounded-[28px] bg-white px-6 py-14 text-center text-sm font-medium text-[#9B91C7] shadow-sm">
                  No activity found for this dashboard yet.
                </div>
              ) : (
                timelineItems.map((item) =>
                  item.type === "board" ? (
                    <BoardTimelineCard key={item.id} board={item.board} />
                  ) : (
                    <QuestionTimelineCard
                      key={item.id}
                      question={item.question}
                      replyValue={replyDrafts[item.question.id] ?? ""}
                      repliesOpen={
                        openReplies[item.question.id] ?? item.question.replies.length > 0
                      }
                      onReplyDraftChange={(value) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [item.question.id]: value,
                        }))
                      }
                      onToggleReplies={() =>
                        setOpenReplies((prev) => ({
                          ...prev,
                          [item.question.id]:
                            !(prev[item.question.id] ?? item.question.replies.length > 0),
                        }))
                      }
                      onReply={() => void handleReply(item.question.id)}
                      onDelete={() => void handleDelete(item.question.id)}
                      onToggleAnswered={() =>
                        void handleToggleAnswered(
                          item.question.id,
                          item.question.status === "ANSWERED",
                        )
                      }
                    />
                  ),
                )
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function BoardTimelineCard({ board }: { board: ProfessorBoardSession }) {
  return (
    <article className="rounded-[28px] bg-white px-5 py-5 shadow-[0_14px_32px_rgba(104,74,191,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <Avatar seed={board.board_id} alt={`${board.course_code} board avatar`} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-[#1F1838]">
                {board.course_code} Course Bot
              </span>
              {board.section_code ? (
                <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#D97706]">
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
              {board.total_questions} questions / {board.answered_questions} answered
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${boardStatusPillClasses(
              board.status,
            )}`}
          >
            {board.status}
          </span>
          <Link
            href={`/professor/courses/boardreview?course_code=${encodeURIComponent(
              board.course_code,
            )}&board_id=${encodeURIComponent(board.board_id)}${
              board.section_code ? `&sec=${encodeURIComponent(board.section_code)}` : ""
            }`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Eye size={16} />
            Review Session
          </Link>
        </div>
      </div>
    </article>
  );
}

function QuestionTimelineCard({
  question,
  replyValue,
  repliesOpen,
  onReplyDraftChange,
  onToggleReplies,
  onReply,
  onDelete,
  onToggleAnswered,
}: {
  question: ProfessorStudentQuestion;
  replyValue: string;
  repliesOpen: boolean;
  onReplyDraftChange: (value: string) => void;
  onToggleReplies: () => void;
  onReply: () => void;
  onDelete: () => void;
  onToggleAnswered: () => void;
}) {
  const isAnswered = question.status === "ANSWERED";

  return (
    <article className="rounded-[28px] bg-white px-5 py-5 shadow-[0_14px_32px_rgba(104,74,191,0.06)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <Avatar seed={question.student_id} alt={`${question.student_name} avatar`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-[#1F1838]">{question.student_name}</span>
              {question.section_code ? (
                <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#D97706]">
                  {formatSectionLabel(question.section_code)}
                </span>
              ) : null}
              <span className="text-xs text-[#A39ACB]">
                {formatRelativeTime(question.created_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#40375C]">
              {question.title ? `${question.title}\n${question.content}` : question.content}
            </p>
            <button
              type="button"
              onClick={onToggleReplies}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#8B7FC0] transition hover:text-[#5B41FF]"
            >
              <CornerDownLeft size={15} />
              {question.replies.length}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${questionStatusPillClasses(
              question.status,
            )}`}
          >
            {question.status}
          </span>
          <button
            type="button"
            onClick={onToggleAnswered}
            className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100"
          >
            {isAnswered ? "Mark Unanswered" : "Mark Answered"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>

      {repliesOpen && question.replies.length > 0 ? (
        <div className="mt-5 space-y-3 border-t border-[#F1ECFF] pt-5">
          {question.replies.map((reply) => (
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
                  {reply.is_professor ? "Professor Reply" : reply.author_name}
                </span>
                <span className="text-xs opacity-70">
                  {formatRelativeTime(reply.created_at)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{reply.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 rounded-[24px] bg-[#FBFBFE] p-4">
        <textarea
          rows={3}
          value={replyValue}
          onChange={(event) => onReplyDraftChange(event.target.value)}
          placeholder="Reply as Instructor..."
          className="w-full resize-none bg-transparent text-sm leading-6 text-[#463C69] outline-none placeholder:text-[#B0A6D7]"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onReply}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#5B41FF] to-[#6A63F8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-100"
          >
            Post Reply
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
