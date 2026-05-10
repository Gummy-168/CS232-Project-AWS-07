"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, CornerDownLeft, MessageSquarePlus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import CreateCourse from "../../../components/createcourse";
import { useAuthSession } from "../../../hooks/useAuthSession";
import {
  createProfessorQuestionReply,
  deleteProfessorQuestion,
  getProfessorQuestions,
  type ProfessorBoardSession,
  type ProfessorQuestionsData,
  type ProfessorStudentQuestion,
  updateProfessorQuestionStatus,
} from "../../../lib/api";

function formatTimeAgo(dateString: string | null) {
  if (!dateString) {
    return "just now";
  }

  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

function buildQuestionSummary(questions: ProfessorStudentQuestion[]) {
  const answered = questions.filter((question) => question.status === "ANSWERED").length;
  return {
    total: questions.length,
    answered,
    pending: Math.max(questions.length - answered, 0),
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NA";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function studentBadgeClasses(studentId: string) {
  const palette = [
    "bg-rose-100 text-rose-600",
    "bg-violet-100 text-violet-600",
    "bg-sky-100 text-sky-600",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-600",
  ];
  const hash = Array.from(studentId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function BoardQuestionCard({
  question,
  replyDraft,
  repliesOpen,
  onReplyDraftChange,
  onToggleReplies,
  onReply,
  onToggleAnswered,
  onDelete,
}: {
  question: ProfessorStudentQuestion;
  replyDraft: string;
  repliesOpen: boolean;
  onReplyDraftChange: (value: string) => void;
  onToggleReplies: () => void;
  onReply: () => void;
  onToggleAnswered: () => void;
  onDelete: () => void;
}) {
  const isAnswered = question.status === "ANSWERED";

  return (
    <article
      className={`rounded-[28px] border p-6 shadow-sm transition ${
        isAnswered ? "border-emerald-100 bg-[#F3FFF9]" : "border-rose-100 bg-[#FFF7FA]"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                isAnswered ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
              }`}
            >
              {isAnswered ? "Answered" : "Pending"}
            </span>
            <span className="text-xs text-slate-400">{formatTimeAgo(question.created_at)}</span>
            {question.section_code ? (
              <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#D97706]">
                {question.section_code}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 text-xl font-medium text-[#1B1B1B]">
            {question.title || question.content}
          </h2>
          {question.title && question.content && question.title !== question.content ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {question.content}
            </p>
          ) : null}

          {question.replies.length > 0 ? (
            <button
              type="button"
              onClick={onToggleReplies}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#7D70B0] transition hover:text-[#5B41FF]"
            >
              <CornerDownLeft size={16} />
              {repliesOpen ? "Hide replies" : `Show replies (${question.replies.length})`}
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleAnswered}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isAnswered
                ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {isAnswered ? "Mark Unanswered" : "Mark Answered"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {repliesOpen && question.replies.length > 0 ? (
        <div className="mt-5 space-y-3 border-t border-white/80 pt-5">
          {question.replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-[22px] px-4 py-4 ${
                reply.is_professor ? "bg-[#EFFFF6] text-[#275E47]" : "bg-white text-slate-700"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em]">
                  {reply.is_professor ? "Professor Reply" : reply.author_name}
                </span>
                <span className="text-xs opacity-70">{formatTimeAgo(reply.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{reply.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 rounded-[24px] bg-white/80 p-4">
        <textarea
          rows={3}
          value={replyDraft}
          onChange={(event) => onReplyDraftChange(event.target.value)}
          placeholder="Reply as instructor..."
          className="w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${studentBadgeClasses(
                question.student_id,
              )}`}
            >
              {initials(question.student_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">{question.student_name}</p>
              <p className="text-xs text-slate-500">{question.student_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReply}
            disabled={!replyDraft.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquarePlus size={16} />
            Post Reply
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProfessorBoardReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const selectedCourseCode = searchParams.get("course_code")?.trim().toUpperCase() ?? "";
  const selectedBoardId = searchParams.get("board_id")?.trim() ?? "";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const [questions, setQuestions] = useState<ProfessorStudentQuestion[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode || !selectedBoardId) {
      Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    Promise.resolve().then(() => setIsLoading(true));
    getProfessorQuestions(session.userId, { courseCode: selectedCourseCode })
      .then((response) => {
        setData(response);
        setQuestions(
          response.student_questions.filter(
            (question) =>
              question.board_id === selectedBoardId && question.status !== "DELETED",
          ),
        );
        setError("");
      })
      .catch((err: unknown) => {
        setData(null);
        setQuestions([]);
        setError(err instanceof Error ? err.message : "Failed to load board review");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [refreshToken, selectedBoardId, selectedCourseCode, session?.userId]);

  const selectedBoard = useMemo<ProfessorBoardSession | null>(() => {
    return data?.board_sessions.find((board) => board.board_id === selectedBoardId) ?? null;
  }, [data, selectedBoardId]);

  const stats = useMemo(() => buildQuestionSummary(questions), [questions]);
  const uniqueStudentIds = useMemo(() => {
    return Array.from(new Set(questions.map((question) => question.student_id)));
  }, [questions]);

  const boardTitle =
    selectedBoard?.board_title?.trim() || selectedBoard?.board_id || selectedBoardId || "Board Review";
  const courseTitle =
    data?.course.title || (selectedCourseCode ? `${selectedCourseCode} Board Review` : "Board Review");
  const extraStudentCount = Math.max(uniqueStudentIds.length - 4, 0);

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
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply failed");
    }
  };

  const handleToggleAnswered = async (questionId: string, isAnswered: boolean) => {
    if (!session?.userId) {
      return;
    }

    try {
      await updateProfessorQuestionStatus(
        session.userId,
        questionId,
        isAnswered ? "unanswered" : "answered",
      );
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!session?.userId || !window.confirm("Delete this question?")) {
      return;
    }

    try {
      await deleteProfessorQuestion(session.userId, questionId);
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Loading board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-slate-700">
      <Header
        professorName={session?.fullName || data?.professor.full_name || data?.professor.name || "Professor"}
        onJoinCourse={() => setIsCreateModalOpen(true)}
        courseTitle={courseTitle}
        mode="course"
      />

      <CreateCourse isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <main className="pb-12 pt-40 xl:pt-32">
        <div className="mx-auto w-full max-w-[1360px] space-y-8 px-6 xl:px-8">
          <section className="flex flex-col gap-6 rounded-[32px] bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => router.back()}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
                Back
              </button>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#D1388D]">
                Live Board Review
              </p>
              <h1 className="mt-3 break-words text-3xl font-bold text-[#1B1B1B]">
                {boardTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {selectedBoard?.created_at
                  ? `Opened ${formatTimeAgo(selectedBoard.created_at)}`
                  : selectedCourseCode || "Board Review"}
              </p>
            </div>

            <div className="flex w-full flex-col gap-4 lg:max-w-[420px]">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex min-w-0 items-center">
                  {uniqueStudentIds.slice(0, 4).map((studentId, index) => (
                    <div
                      key={studentId}
                      className={`-ml-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold first:ml-0 ${studentBadgeClasses(
                        `${studentId}-${index}`,
                      )}`}
                    >
                      {initials(studentId)}
                    </div>
                  ))}
                  {extraStudentCount > 0 ? (
                    <div className="-ml-2 flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-white bg-[#FFD6E8] px-2 text-xs font-bold text-[#FF4D94]">
                      +{extraStudentCount}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] bg-[#FFF6EC] p-4">
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="mt-2 text-3xl font-medium text-[#EA580C]">{stats.pending}</p>
                </div>
                <div className="rounded-[22px] bg-[#ECFDF5] p-4">
                  <p className="text-sm text-slate-500">Answered</p>
                  <p className="mt-2 text-3xl font-medium text-[#059669]">{stats.answered}</p>
                </div>
                <div className="rounded-[22px] bg-[#F4F0FF] p-4">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="mt-2 text-3xl font-medium text-[#513FDF]">{stats.total}</p>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {!selectedBoardId ? (
            <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
              <h2 className="text-3xl font-medium text-[#1B1B1B]">Missing board_id</h2>
              <p className="mt-3 text-lg text-slate-500">
                Open this page from a board link that includes `board_id`.
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
              <h2 className="text-3xl font-medium text-[#1B1B1B]">No questions yet</h2>
              <p className="mt-3 text-lg text-slate-500">
                ยังไม่มีคำถามในขณะนี้ คำถามจากนักศึกษาจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {questions.map((question) => (
                <BoardQuestionCard
                  key={question.id}
                  question={question}
                  replyDraft={replyDrafts[question.id] ?? ""}
                  repliesOpen={openReplies[question.id] ?? question.replies.length > 0}
                  onReplyDraftChange={(value) =>
                    setReplyDrafts((prev) => ({ ...prev, [question.id]: value }))
                  }
                  onToggleReplies={() =>
                    setOpenReplies((prev) => ({
                      ...prev,
                      [question.id]: !(prev[question.id] ?? question.replies.length > 0),
                    }))
                  }
                  onReply={() => handleReply(question.id)}
                  onToggleAnswered={() =>
                    handleToggleAnswered(question.id, question.status === "ANSWERED")
                  }
                  onDelete={() => handleDelete(question.id)}
                />
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
