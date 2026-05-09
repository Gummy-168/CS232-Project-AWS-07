"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft, Clock3, MessageCircleMore, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import JoinCourse from "../../../components/joincourse";
import { useAuthSession } from "../../../hooks/useAuthSession";
import {
  type StudentCourseBoardData,
  type StudentQuestion,
  getStudentCourseBoard,
  getStudentQuestions,
} from "../../../lib/api";

type BoardFilter = "All" | "Answered" | "Unanswered";

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

function BoardQuestionCard({ question }: { question: StudentQuestion }) {
  const replies = question.replies ?? [];
  const isAnswered = question.status === "ANSWERED";

  return (
    <article className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-[#F4F0FF] px-3 py-1 font-medium text-[#6F63A8]">
              {question.is_anonymous ? "Anonymous" : question.author_name}
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
                <span className="font-medium text-slate-700">{reply.author_name}</span>
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

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BoardFilter>("All");
  const [courseBoard, setCourseBoard] = useState<StudentCourseBoardData | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    Promise.all([
      getStudentCourseBoard(session.userId, selectedCourseCode),
      getStudentQuestions(session.userId, {
        scope: "all",
        courseCode: selectedCourseCode,
      }),
    ])
      .then(([boardResponse, questionResponse]) => {
        setCourseBoard(boardResponse);
        setQuestions(
          questionResponse.questions.filter((question) => question.status !== "DELETED"),
        );
      })
      .catch(() => {
        setCourseBoard(null);
        setQuestions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedCourseCode, session?.userId]);

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

  if (!selectedCourseCode || !session?.userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FCF9F8] text-lg text-slate-500">
        Select a course first.
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

  const activeBoard = courseBoard?.active_board ?? null;
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

      <main className="pb-10 pt-40">
        <div className="mx-auto w-full max-w-[1360px] space-y-8 px-6 xl:px-8">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  router.push(
                    `/student/courses?course_code=${encodeURIComponent(selectedCourseCode)}`,
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
                  {activeBoard ? activeBoard.board_id : "No active board"}
                </h1>
                <p className="mt-2 text-lg text-slate-500">
                  {courseBoard?.course.course_name || "Select a course"}
                </p>
              </div>
            </div>

            {activeBoard && (
              <div className="flex flex-wrap items-center gap-4 rounded-[26px] border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock3 size={16} />
                  {formatRelativeTime(activeBoard.created_at)}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MessageCircleMore size={16} />
                  {activeBoard.total_questions} questions
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                  Active
                </span>
              </div>
            )}
          </section>

          {activeBoard ? (
            <>
              <section className="grid gap-6 md:grid-cols-3">
                <div className="rounded-[26px] bg-[#F4F0FF] p-6">
                  <p className="text-sm text-slate-500">Unanswered</p>
                  <p className="mt-3 text-4xl font-semibold text-[#513FDF]">
                    {activeBoard.unanswered_questions}
                  </p>
                </div>
                <div className="rounded-[26px] bg-[#ECFDF5] p-6">
                  <p className="text-sm text-slate-500">Answered</p>
                  <p className="mt-3 text-4xl font-semibold text-[#059669]">
                    {activeBoard.answered_questions}
                  </p>
                </div>
                <div className="rounded-[26px] bg-[#FFF8EF] p-6">
                  <p className="text-sm text-slate-500">Total Questions</p>
                  <p className="mt-3 text-4xl font-semibold text-[#EA580C]">
                    {activeBoard.total_questions}
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

                <label className="relative ml-auto w-full max-w-[460px]">
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
              </section>

              <section className="space-y-5">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question) => (
                    <BoardQuestionCard key={question.id} question={question} />
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
                ยังไม่มี Board ที่ใช้งานอยู่
              </h2>
              <p className="mt-3 text-lg text-slate-500">
                หากอาจารย์ยังไม่ได้เปิด board ระบบจะแสดงสถานะนี้ และนักศึกษายังสามารถกลับไปหน้า course home ได้
              </p>
              <Link
                href={`/student/courses?course_code=${encodeURIComponent(selectedCourseCode)}`}
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
