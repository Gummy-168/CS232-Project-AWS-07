"use client";

import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import CreateCourse from "../../../components/createcourse";
import { useAuthSession } from "../../../hooks/useAuthSession";
import {
  getBoardQuestions,
  getProfessorQuestions,
  type ProfessorQuestionsData,
  type StudentQuestion,
  type StudentQuestionReply,
} from "../../../lib/api";

type ReviewQuestion = {
  id: string;
  title: string;
  content: string;
  status: "ANSWERED" | "UNANSWERED" | "DELETED";
  created_at: string | null;
  reply_content: string | null;
  replies: StudentQuestionReply[];
  author_id: string;
  author_name: string;
  is_anonymous: boolean;
};

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

function QuestionCard({ data }: { data: ReviewQuestion }) {
  const isAnswered = data.status === "ANSWERED";
  const replies = data.replies ?? [];
  const professorReply =
    data.reply_content || replies.find((reply) => reply.is_professor)?.content || "";

  return (
    <div
      className={`relative flex h-[280px] flex-col justify-between rounded-[40px] border p-7 shadow-sm transition-all hover:shadow-md ${
        isAnswered
          ? "border-[#E6F9EE] bg-[#F2FFF7]"
          : "border-[#FFEBF2] bg-[#FFF5F8]"
      }`}
    >
      <div>
        <div className="mb-5 flex items-center justify-between">
          <span
            className={`rounded-full px-4 py-1 text-[10px] font-bold tracking-wider ${
              isAnswered
                ? "bg-[#D6FFE6] text-[#2ECC71]"
                : "bg-[#FFD6E8] text-[#FF4D94]"
            }`}
          >
            {isAnswered ? "ANSWERED" : "PENDING"}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {formatTimeAgo(data.created_at)}
          </span>
        </div>

        <p
          className={`line-clamp-5 text-sm font-medium leading-relaxed ${
            isAnswered ? "text-[#5A8A6A]" : "text-[#5A5A5A]"
          }`}
        >
          {data.title || data.content}
        </p>

        {data.title && data.content && data.title !== data.content && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {data.content}
          </p>
        )}

        {(professorReply || replies.length > 0) && (
          <div className="mt-4 rounded-[20px] border border-white/50 bg-white/70 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Professor Reply
            </p>
            {professorReply ? (
              <p className="text-sm leading-6 text-slate-700">{professorReply}</p>
            ) : (
              replies.slice(0, 1).map((reply) => (
                <p key={reply.id} className="text-sm leading-6 text-slate-700">
                  {reply.content}
                </p>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/50 pt-4">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
              data.author_id,
            )}`}
            className="h-7 w-7 rounded-full bg-white shadow-sm"
            alt="student"
          />
          <span className="text-xs font-bold text-slate-500">
            {data.is_anonymous ? "Anonymous" : data.author_name}
          </span>
        </div>

        {isAnswered && (
          <div className="flex items-center gap-1.5 text-[#2ECC71]">
            <CheckCircle2 size={16} />
            <span className="text-[11px] font-bold uppercase">Solved</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LabDiscussionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() ?? "";
  const selectedBoardId = searchParams.get("board_id")?.trim() ?? "";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode || !selectedBoardId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Promise.allSettled([
      getProfessorQuestions(session.userId, { courseCode: selectedCourseCode }),
      getBoardQuestions(selectedBoardId, session.accessToken, session.role),
    ]).then(([professorResult, boardResult]) => {
      if (professorResult.status === "fulfilled") {
        setData(professorResult.value);
      } else {
        setData(null);
      }

      const professorData =
        professorResult.status === "fulfilled" ? professorResult.value : null;

      const normalizeBoardQuestion = (question: StudentQuestion): ReviewQuestion => ({
        id: question.id,
        title: question.title,
        content: question.content,
        status: question.status,
        created_at: question.created_at,
        reply_content: question.reply_content,
        replies: question.replies ?? [],
        author_id: question.author_id,
        author_name: question.author_name,
        is_anonymous: question.is_anonymous,
      });

      const normalizeProfessorQuestion = (
        question: ProfessorQuestionsData["student_questions"][number],
      ): ReviewQuestion => ({
        id: question.id,
        title: question.title,
        content: question.content,
        status: question.status,
        created_at: question.created_at,
        reply_content: question.replies.find((reply) => reply.is_professor)?.content ?? null,
        replies: question.replies,
        author_id: question.student_id,
        author_name: question.student_name,
        is_anonymous: false,
      });

      const fallbackQuestions =
        professorData?.student_questions
          .filter((question) => question.board_id === selectedBoardId)
          .map(normalizeProfessorQuestion) ?? [];
      const resolvedQuestions =
        boardResult.status === "fulfilled"
          ? boardResult.value.questions.map(normalizeBoardQuestion)
          : fallbackQuestions;

      setQuestions(resolvedQuestions.filter((question) => question.status !== "DELETED"));
      if (professorResult.status === "rejected" && boardResult.status === "rejected") {
        const message =
          professorResult.reason instanceof Error
            ? professorResult.reason.message
            : boardResult.reason instanceof Error
              ? boardResult.reason.message
              : "Failed to load review session";
        setError(message);
      } else {
        setError("");
      }
      setIsLoading(false);
    });
  }, [selectedBoardId, selectedCourseCode, session?.accessToken, session?.role, session?.userId]);

  const selectedBoard = useMemo(() => {
    return data?.board_sessions.find((board) => board.board_id === selectedBoardId) ?? null;
  }, [data, selectedBoardId]);

  const uniqueStudentIds = useMemo(() => {
    return Array.from(
      new Set(questions.map((question) => question.author_id).filter(Boolean)),
    );
  }, [questions]);

  const boardTitle =
    selectedBoard?.board_title?.trim() || selectedBoard?.board_id || selectedBoardId || "Review Session";
  const courseTitle =
    data?.course.title || (selectedCourseCode ? `${selectedCourseCode} Review` : "Review Session");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Loading review session...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#FCF9F8] font-sans">
      <Header
        professorName={session?.fullName || data?.professor.full_name || data?.professor.name || "Professor"}
        onJoinCourse={() => setIsCreateModalOpen(true)}
        courseTitle={courseTitle}
        mode="course"
      />

      <CreateCourse
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <div className="shrink-0 px-8 pb-4 pt-[140px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft size={32} className="text-slate-700" />
            </button>
            <div>
              <h1 className="text-3xl font-regular text-[#1B1B1B]">{boardTitle}</h1>
              <p className="text-sm font-medium text-gray-500">
                {selectedBoard?.created_at
                  ? `Date : ${selectedBoard.created_at.slice(0, 10)}`
                  : selectedCourseCode || "Review Session"}
              </p>
            </div>
          </div>

          <div className="flex items-center -space-x-3">
            {uniqueStudentIds.slice(0, 4).map((studentId) => (
              <img
                key={studentId}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  studentId,
                )}`}
                className="h-10 w-10 rounded-full border-2 border-white shadow-sm"
                alt="member"
              />
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#FFD6E8] text-[10px] font-bold text-[#FF4D94] shadow-sm">
              +{uniqueStudentIds.length}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-8 mb-4 rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-4 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 pb-28">
        {!selectedBoardId ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
            <h2 className="text-3xl font-semibold text-[#1B1B1B]">Missing board_id</h2>
            <p className="mt-3 text-lg text-slate-500">
              Please open this page from a board link that includes `board_id`.
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
            <h2 className="text-3xl font-semibold text-[#1B1B1B]">No questions yet</h2>
            <p className="mt-3 text-lg text-slate-500">
              Questions for this board will appear here once students start asking.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {questions.map((item) => (
              <QuestionCard key={item.id} data={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
