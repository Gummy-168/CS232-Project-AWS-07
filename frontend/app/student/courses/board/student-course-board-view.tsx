"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, Clock3, MessageCircleMore, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionNoticeModal from "../../../components/action-notice-modal";
import AskModal from "../../../components/askmodal";
import Header from "../../../components/Header";
import JoinCourse from "../../../components/joincourse";
import { useAuthSession } from "../../../hooks/useAuthSession";
import {
  createQuestion,
  getBoardQuestions,
  getStudentCourseBoards,
  type StudentBoardSession,
  type StudentBoardQuestion,
  type StudentCourseBoardData,
  type StudentQuestion,
  getStudentCourseBoard,
  getStudentQuestions,
} from "../../../lib/api";
import {
  buildCourseQueryString,
  formatSectionLabel,
  normalizeSectionCode,
} from "../../../lib/section-code";

type BoardFilter = "All" | "Answered" | "Unanswered";

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
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return "just now";
  }
}

function BoardQuestionCard({
  question,
  professorName,
}: {
  question: StudentQuestion;
  professorName?: string;
}) {
  const replies = question.replies ?? [];
  const isAnswered = question.status === "ANSWERED";
  const resolvedProfessorName = professorName?.trim() || "Professor";
  const questionScope = question.board_id ? "Board Question" : "General Question";

  return (
    <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-[#F4F0FF] px-3 py-1 font-medium text-[#6F63A8]">
              {question.is_anonymous ? "Anonymous" : question.author_name}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              {questionScope}
            </span>
            <span>{formatRelativeTime(question.created_at)}</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#1B1B1B]">
            {question.title || question.content}
          </h3>
          {question.title && question.content && question.content !== question.title && (
            <p className="mt-2 text-base leading-7 text-slate-600">{question.content}</p>
          )}
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

      {(question.reply_content || replies.length > 0) && (
        <div className="mt-5 space-y-3">
          {question.reply_content && (
            <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Professor Reply
              </p>
              <p className="text-sm leading-6 text-slate-700">{question.reply_content}</p>
            </div>
          )}

          {replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-3"
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

export default function StudentCourseBoardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() ?? "";
  const selectedSectionCode = normalizeSectionCode(searchParams.get("sec"));
  const selectedBoardId = searchParams.get("board_id")?.trim() ?? "";

  const buildCourseQuery = (courseCode: string, sectionCode?: string | null) =>
    buildCourseQueryString(courseCode, sectionCode);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BoardFilter>("All");
  const [courseBoard, setCourseBoard] = useState<StudentCourseBoardData | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [boardSessions, setBoardSessions] = useState<StudentBoardSession[]>([]);
  const [notice, setNotice] = useState<NoticeState>(null);

  const loadBoardData = useCallback(async (showLoading = true) => {
    if (!session?.userId || !selectedCourseCode || !selectedBoardId) {
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const [boardResult, boardSessionsResult, boardQuestionsResult, questionResult] =
        await Promise.allSettled([
          getStudentCourseBoard(
            session.userId,
            selectedCourseCode,
            selectedSectionCode || undefined,
          ),
          getStudentCourseBoards(
            session.userId,
            selectedCourseCode,
            selectedSectionCode || undefined,
          ),
          getBoardQuestions(selectedBoardId, session.accessToken, session.role, {
            studentId: session.userId,
            courseCode: selectedCourseCode,
            sectionCode: selectedSectionCode || undefined,
          }),
          getStudentQuestions(session.userId, {
            scope: "all",
            courseCode: selectedCourseCode,
            boardId: selectedBoardId,
          }),
        ]);

      const boardResponse =
        boardResult.status === "fulfilled" ? boardResult.value : null;
      const boardSessionsResponse =
        boardSessionsResult.status === "fulfilled" ? boardSessionsResult.value : null;
      const boardQuestionsFromBoardApi =
        boardQuestionsResult.status === "fulfilled"
          ? boardQuestionsResult.value.questions
          : [];
      const boardQuestionsFallback =
        questionResult.status === "fulfilled"
          ? questionResult.value.questions.filter(
              (question) => question.board_id === selectedBoardId,
            )
          : [];
      const resolvedQuestions =
        boardQuestionsFromBoardApi.length > 0
          ? boardQuestionsFromBoardApi
          : boardQuestionsFallback;

      setCourseBoard(boardResponse);
      setBoardSessions(boardSessionsResponse?.board_sessions ?? []);
      setQuestions(
        resolvedQuestions.filter(
          (question): question is StudentBoardQuestion => question.status !== "DELETED",
        ),
      );
      if (boardResult.status === "rejected" && questionResult.status === "rejected") {
        const message =
          boardResult.reason instanceof Error
            ? boardResult.reason.message
            : questionResult.reason instanceof Error
              ? questionResult.reason.message
              : "Failed to load board";
        setError(message);
      } else {
        setError("");
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [
    selectedBoardId,
    selectedCourseCode,
    selectedSectionCode,
    session?.accessToken,
    session?.role,
    session?.userId,
  ]);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode || !selectedBoardId) {
      return;
    }

    void loadBoardData();
  }, [
    loadBoardData,
    selectedBoardId,
    selectedCourseCode,
    selectedSectionCode,
    session?.accessToken,
    session?.role,
    session?.userId,
  ]);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((question) => {
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
    });
  }, [filter, questions, search]);

  const activeBoard = courseBoard?.active_board ?? null;
  const viewedBoard =
    boardSessions.find((board) => board.board_id === selectedBoardId) ||
    (activeBoard?.board_id === selectedBoardId
      ? {
          board_id: activeBoard.board_id,
          board_title: activeBoard.board_title,
          course_code: courseBoard?.course.course_code || selectedCourseCode,
          course_name: courseBoard?.course.course_name || "",
          section_id: activeBoard.section_id,
          section_code: activeBoard.section_code,
          status: activeBoard.status,
          created_at: activeBoard.created_at,
          total_questions: activeBoard.total_questions,
          answered_questions: activeBoard.answered_questions,
          unanswered_questions: activeBoard.unanswered_questions,
        }
      : null);
  const isBoardActive =
    ((viewedBoard?.status ?? activeBoard?.status ?? "").trim().toLowerCase() === "active") &&
    selectedBoardId === (viewedBoard?.board_id || activeBoard?.board_id);
  const canAskQuestion = Boolean(isBoardActive);
  const sectionLabel = formatSectionLabel(viewedBoard?.section_code || selectedSectionCode);

  const showQuestionErrorNotice = (message: string) => {
    if (message.toLowerCase().includes("different section")) {
      setNotice({
        badge: "Section mismatch",
        title: "You can only post in your enrolled section",
        description:
          "This question was blocked because the current board belongs to a different section. Please return to your section board and try again.",
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
    const studentId = session?.userId || "stu001";
    if (!session?.accessToken || !selectedCourseCode || !selectedBoardId) {
      return;
    }

    try {
      await createQuestion(
        {
          title: payload.title,
          content: payload.detail || payload.title,
          tags: payload.tags,
          is_anonymous: payload.anonymous,
          course_code: selectedCourseCode,
          board_id: selectedBoardId,
          section_code: normalizeSectionCode(selectedSectionCode) || undefined,
        },
        session.accessToken,
        studentId,
        session.role,
      );
      await loadBoardData(false);
      setIsAskModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post question";
      setError(message);
      showQuestionErrorNotice(message);
    }
  };

  if (!selectedCourseCode || !session?.userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Select a course first.
      </div>
    );
  }

  if (!selectedBoardId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Missing board_id in the URL.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Loading board...
      </div>
    );
  }
  const resolvedProfessorName =
    courseBoard?.course.professor_full_name?.trim() ||
    courseBoard?.course.professor_name ||
    "Professor";
  const courseTitle = courseBoard
    ? `${courseBoard.course.course_code}: ${courseBoard.course.course_name}`
    : "Course Board";

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-slate-700">
      <Header
        studentName={session?.fullName || courseBoard?.student.name || "Student"}
        studentId={session?.userId || courseBoard?.student.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        courseTitle={courseTitle}
        buttonLabel="Join Course"
        mode="board"
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
          viewedBoard
            ? `${courseBoard?.course.course_code || selectedCourseCode} · ${
                viewedBoard.board_title || viewedBoard.board_id
              }${sectionLabel ? ` · ${sectionLabel}` : ""}`
            : selectedCourseCode
        }
      />

      <main className="pb-10 pt-40">
        <div className="mx-auto w-full max-w-[1360px] space-y-8 px-6 xl:px-8">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  router.push(
                    `/student/courses?${buildCourseQuery(
                      selectedCourseCode,
                      selectedSectionCode,
                    )}`,
                  )
                }
                className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft size={24} />
              </button>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#D1388D]">
                  View Course Board
                </p>
                <h1 className="mt-2 text-4xl font-semibold text-[#1B1B1B]">
                  {viewedBoard ? viewedBoard.board_title || viewedBoard.board_id : "No board found"}
                </h1>
                <p className="mt-2 text-lg text-slate-500">
                  {courseBoard?.course.course_name || "Select a course"}
                  {sectionLabel ? ` · ${sectionLabel}` : ""}
                </p>
              </div>
            </div>

            {viewedBoard && (
              <div className="flex flex-wrap items-center gap-4 rounded-[26px] border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock3 size={16} />
                  {formatRelativeTime(viewedBoard.created_at)}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MessageCircleMore size={16} />
                  {viewedBoard.total_questions} questions
                </div>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    isBoardActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {viewedBoard.status || "Active"}
                </span>
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-600">
              {error}
            </div>
          )}

          {viewedBoard ? (
            <>
              <section className="grid gap-6 md:grid-cols-3">
                <div className="rounded-[26px] bg-[#F4F0FF] p-6">
                  <p className="text-sm text-slate-500">Unanswered</p>
                  <p className="mt-3 text-4xl font-semibold text-[#513FDF]">
                    {viewedBoard.unanswered_questions}
                  </p>
                </div>
                <div className="rounded-[26px] bg-[#ECFDF5] p-6">
                  <p className="text-sm text-slate-500">Answered</p>
                  <p className="mt-3 text-4xl font-semibold text-[#059669]">
                    {viewedBoard.answered_questions}
                  </p>
                </div>
                <div className="rounded-[26px] bg-[#FFF8EF] p-6">
                  <p className="text-sm text-slate-500">Total Questions</p>
                  <p className="mt-3 text-4xl font-semibold text-[#EA580C]">
                    {viewedBoard.total_questions}
                  </p>
                </div>
              </section>

              <section className="flex flex-wrap items-center gap-3">
                {(["All", "Answered", "Unanswered"] as BoardFilter[]).map((option) => (
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
                ))}

                <div className="ml-auto flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-end">
                  {canAskQuestion && (
                    <button
                      type="button"
                      onClick={() => setIsAskModalOpen(true)}
                      className="inline-flex h-16 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] px-6 text-base font-semibold text-white shadow-lg shadow-purple-200 transition hover:scale-[1.01]"
                    >
                      <Plus size={20} />
                      Ask Question
                    </button>
                  )}

                  <label className="relative w-full max-w-[460px]">
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

              <section className="space-y-5">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question) => (
                    <BoardQuestionCard
                      key={question.id}
                      question={question}
                      professorName={resolvedProfessorName}
                    />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                    No questions found for this board.
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
              <h2 className="text-3xl font-semibold text-[#1B1B1B]">
                Board history is not available
              </h2>
              <p className="mt-3 text-lg text-slate-500">
                We could not find this board in your enrolled course and section.
              </p>
              <Link
                href={`/student/courses?${buildCourseQuery(
                  selectedCourseCode,
                  selectedSectionCode,
                )}`}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#C4B5FD] bg-[#FAF5FF] px-6 py-3 text-base font-semibold text-[#513FDF] transition hover:bg-[#F3EEFF]"
              >
                Back to Course Home
              </Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
