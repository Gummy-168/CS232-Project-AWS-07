"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CornerDownLeft, Eye, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import CreateCourse from "../../components/createcourse";
import { useAuthSession } from "../../hooks/useAuthSession";
import {
  createProfessorBoard,
  createProfessorQuestionReply,
  deleteProfessorQuestion,
  getProfessorQuestions,
  type ProfessorBoardSession,
  type ProfessorCourseResponse,
  type ProfessorQuestionReply,
  type ProfessorQuestionsData,
  type ProfessorStudentQuestion,
  updateProfessorQuestionStatus,
} from "../../lib/api";

type QuestionFilter = "all" | "answered" | "unanswered" | "board";
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

function formatSectionLabel(sectionCode: string) {
  const normalized = sectionCode.trim().toUpperCase();
  if (normalized.startsWith("SEC")) {
    return normalized;
  }
  return `SEC ${normalized}`;
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

export default function ProfessorQuestionsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [filter, setFilter] = useState<QuestionFilter>("all");
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";
  const selectedSectionCode =
    searchParams.get("sec")?.trim().toUpperCase() || undefined;
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<ReplyDrafts>({});

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
      tag: selectedTag === "all" ? undefined : selectedTag,
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
    selectedTag, 
    refreshToken,
  ]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    data?.student_questions.forEach((question) => {
      question.tags?.forEach((tag) => {
        if (tag.trim()) {
          tags.add(tag.trim());
        }
      });
    });
    return ["all", ...Array.from(tags)];
  }, [data]);

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

  const refresh = () => {
    setLoading(true);
    setRefreshToken((prev) => prev + 1);
  };

  const handleCreateBoard = async () => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }
    if (!selectedSectionCode) {
      alert("Please select a section before opening a board.");
      return;
    }
    const title = window.prompt("Board title (e.g. Week 6 - AWS Deployment)");
    if (title === null) {
      return;
    }
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      alert("Please enter a board title.");
      return;
    }
    try {
      await createProfessorBoard(
        session.userId,
        selectedCourseCode,
        selectedSectionCode,
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
            selectedSectionCode,
            {
              boardTitle: normalizedTitle,
              forceCloseExisting: true,
            },
          );
          refresh();
          return;
        } catch (forceErr) {
          alert(forceErr instanceof Error ? forceErr.message : "Create board failed");
          return;
        }
      }
      alert(message);
    }
  };

  const handleMarkAnswered = async (questionId: string, isAnswered: boolean) => {
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
      alert(err instanceof Error ? err.message : "Update status failed");
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
      alert(err instanceof Error ? err.message : "Delete failed");
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
      alert(err instanceof Error ? err.message : "Reply failed");
    }
  };

  return (
    <div className="h-full bg-[#FCF9F8] font-sans text-slate-700 overflow-y-auto">
      <Header
        professorName={session?.nickname || data?.professor?.name}
        codeId={data?.course?.code}
        onJoinCourse={() => setIsModalOpen(true)}
        mode="questions"
      />
      <CreateCourse
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <main className="px-6 pt-[126px] pb-12 w-full">
        <section className="bg-white rounded-[28px] shadow-sm border border-slate-100 mb-8 p-8 max-w-5xl mx-auto text-center">
          <h2 className="text-2xl text-[#1B1B1B] mb-5">
            {data?.course
              ? `${data.course.code}: ${data.course.title}`
              : "No active course"}
          </h2>
          {selectedSectionCode ? (
            <p className="mb-5 text-sm font-semibold text-[#7B68E5]">
              Filtering by {formatSectionLabel(selectedSectionCode)}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-3">
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

            <button
              onClick={handleCreateBoard}
              disabled={!selectedCourseCode}
              className="bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] text-white px-10 py-3 rounded-full text-sm shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-40"
            >
              Create Board
            </button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          <h3 className="text-2xl text-[#1B1B1B] mb-4">ActivityTimeline</h3>
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
                  setLoading(true);
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

            <select
              value={selectedTag}
              onChange={(event) => {
                setLoading(true);
                setSelectedTag(event.target.value);
              }}
              className="h-9 rounded-full border border-slate-200 bg-white px-4 pr-8 text-sm text-slate-500 focus:outline-none"
            >
              <option value="all">All Tags</option>
              {availableTags
                .filter((tag) => tag !== "all")
                .map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
            </select>

            <div className="relative flex-1 min-w-[230px] max-w-sm ml-auto">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setSearch(event.target.value);
                }}
                placeholder="Search my questions..."
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
                    isOpen={Boolean(openReplies[item.id])}
                    replyDraft={replyDrafts[item.id] || ""}
                    onToggleReplies={() =>
                      setOpenReplies((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                    onReplyDraftChange={(value) =>
                      setReplyDrafts((prev) => ({ ...prev, [item.id]: value }))
                    }
                    onPostReply={() => handleReply(item.id)}
                    onMarkAnswered={() =>
                      handleMarkAnswered(
                        item.id,
                        item.question.status === "ANSWERED",
                      )
                    }
                    onDelete={() => handleDelete(item.id)}
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
  return (
    <article className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        BOARD
      </div>

      <div className="flex gap-4">
        <img
          src={avatarFor(board.board_id)}
          alt=""
          className="w-12 h-12 rounded-full bg-slate-100"
        />
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
  isOpen,
  replyDraft,
  onToggleReplies,
  onReplyDraftChange,
  onPostReply,
  onMarkAnswered,
  onDelete,
}: {
  question: ProfessorStudentQuestion;
  isOpen: boolean;
  replyDraft: string;
  onToggleReplies: () => void;
  onReplyDraftChange: (value: string) => void;
  onPostReply: () => void;
  onMarkAnswered: () => void;
  onDelete: () => void;
}) {
  const isAnswered = question.status === "ANSWERED";
  const professorReplies = question.replies.filter((reply) => reply.is_professor);
  const discussionReplies = question.replies.filter((reply) => !reply.is_professor);

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
        <img
          src={avatarFor(question.student_id)}
          alt=""
          className="w-12 h-12 rounded-full bg-slate-100"
        />

        <div className="flex-1 pr-20">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-bold text-slate-800">{question.student_name}</span>
            {question.section_code ? (
              <span className="rounded-full bg-[#FFF3E8] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D97706]">
                {formatSectionLabel(question.section_code)}
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

          {professorReplies.length > 0 && (
            <div className="space-y-2 mb-3">
              {professorReplies.map((reply) => (
                <ProfessorReply key={reply.id} reply={reply} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-[13px] mb-2">
            <button
              onClick={onToggleReplies}
              className="text-slate-400 hover:text-[#5B41FF] flex items-center gap-1 transition-colors"
            >
              <CornerDownLeft size={14} />
              {discussionReplies.length} {isOpen ? "hide replies" : "Reply"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={onMarkAnswered}
                className={`px-3 py-1 rounded-md transition-colors ${
                  isAnswered
                    ? "text-orange-500 border border-orange-100 bg-orange-50 hover:bg-orange-100"
                    : "text-emerald-500 border border-emerald-100 hover:bg-emerald-50"
                }`}
              >
                {isAnswered ? "Unmarked" : "Mark Answered"}
              </button>
              <button
                onClick={onDelete}
                className="text-rose-400 border border-rose-100 px-3 py-1 rounded-md hover:bg-rose-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="pt-3 border-t border-slate-100 space-y-3 mb-3">
              {discussionReplies.map((reply) => (
                <DiscussionReply key={reply.id} reply={reply} />
              ))}

              <div className="mt-2 bg-[#F8F9FE] rounded-xl p-4 border border-slate-100">
                <textarea
                  value={replyDraft}
                  onChange={(event) => onReplyDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onPostReply();
                    }
                  }}
                  placeholder="Reply as Instructor..."
                  rows={2}
                  className="w-full bg-transparent border-none resize-none text-sm focus:outline-none text-slate-600"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={onToggleReplies}
                    className="text-slate-400 border border-slate-200 px-4 py-1.5 rounded-xl text-[13px] hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onPostReply}
                    disabled={!replyDraft.trim()}
                    className="bg-[#5B41FF] disabled:opacity-40 text-white px-6 py-1.5 rounded-xl text-[13px] hover:shadow-md transition-all active:scale-95"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ProfessorReply({ reply }: { reply: ProfessorQuestionReply }) {
  return (
    <div className="flex gap-3">
      <img
        src={avatarFor(reply.author_id)}
        alt=""
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-1 border border-emerald-100 rounded-xl p-3 bg-[#F0FDF4]">
        <span className="bg-emerald-400 text-white text-[10px] px-2 py-0.5 rounded uppercase">
          Professor Reply
        </span>
        <p className="text-sm text-slate-700 mt-1">{reply.content}</p>
      </div>
    </div>
  );
}

function DiscussionReply({ reply }: { reply: ProfessorQuestionReply }) {
  return (
    <div className="flex gap-3">
      <img
        src={avatarFor(reply.author_id)}
        alt=""
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
        <span className="text-sm font-semibold text-slate-700">
          {reply.author_name}
        </span>
        <span className="text-xs text-slate-400 ml-2">
          {formatRelativeTime(reply.created_at)}
        </span>
        <p className="text-sm text-slate-600 mt-0.5">{reply.content}</p>
      </div>
    </div>
  );
}
