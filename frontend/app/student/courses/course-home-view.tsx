"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Contact, Eye, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Header from "../../components/Header";
import JoinCourse from "../../components/joincourse";
import { useAuthSession } from "../../hooks/useAuthSession";
import {
  getStudentCourseBoard,
  getStudentCourses,
  getStudentQuestions,
  type StudentCourse,
  type StudentCourseBoardData,
  type StudentQuestion,
} from "../../lib/api";

type FilterValue = "All" | "Answered" | "Unanswered";

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

function initials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return "NA";
  }
  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || "")
    .join("");
}

function avatarTone(seed: string) {
  const palette = [
    "bg-[#FFE7A8] text-[#C97A00]",
    "bg-[#DDFBEA] text-[#099268]",
    "bg-[#E4E0FF] text-[#5B41FF]",
    "bg-[#FFE4EF] text-[#D1388D]",
  ];
  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

export default function StudentCourseHomeView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [boardData, setBoardData] = useState<StudentCourseBoardData | null>(null);
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("All");

  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    getStudentCourses(session.userId)
      .then((response) => {
        setCourses(response.courses);
        if (!selectedCourseCode && response.courses.length > 0) {
          router.replace(
            `${pathname}?course_code=${encodeURIComponent(
              response.courses[0].course_code,
            )}`,
          );
        }
      })
      .catch(() => {
        setCourses([]);
      });
  }, [pathname, router, selectedCourseCode, session?.userId]);

  useEffect(() => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    setLoading(true);
    Promise.all([
      getStudentCourseBoard(session.userId, selectedCourseCode),
      getStudentQuestions(session.userId, {
        scope: "all",
        courseCode: selectedCourseCode,
      }),
    ])
      .then(([courseBoard, questionResponse]) => {
        setBoardData(courseBoard);
        setQuestions(questionResponse.questions.filter((item) => item.status !== "DELETED"));
        setError("");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load course board";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedCourseCode, session?.userId]);

  const filteredQuestions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return questions
      .filter((question) => {
        if (filter === "Answered") {
          return question.status === "ANSWERED";
        }
        if (filter === "Unanswered") {
          return question.status !== "ANSWERED";
        }
        return true;
      })
      .filter((question) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          question.author_name,
          question.title,
          question.content,
          question.course_code,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [filter, questions, search]);

  const selectedCourse =
    courses.find((course) => course.course_code === selectedCourseCode) ?? null;
  const pageTitle = selectedCourse
    ? `${selectedCourse.course_code}: ${selectedCourse.course_name}`
    : "Course Home";

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-slate-700">
      <Header
        studentName={session?.nickname}
        studentId={session?.userId}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        courseTitle={pageTitle}
        mode="courses"
      />

      <JoinCourse isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />

      <main className="pb-16 pt-44 xl:pt-32">
        <div className="mx-auto w-full max-w-[1280px] px-6 xl:px-8">
          {loading ? (
            <div className="rounded-[28px] bg-white px-8 py-16 text-center shadow-sm">
              Loading course board...
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-5 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : !selectedCourseCode ? (
            <div className="rounded-[28px] bg-white px-8 py-16 text-center shadow-sm">
              Please choose a course from My Courses.
            </div>
          ) : (
            <>
              <section className="rounded-[30px] bg-white p-6 shadow-[0_16px_36px_rgba(104,74,191,0.06)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D1388D]">
                      <span>(( ))</span>
                      Current Board
                    </div>
                    <h2 className="text-2xl text-[#1B1B1B]">
                      {boardData?.active_board ? (
                        <>
                          <span className="font-semibold">Board - </span>
                          <span className="font-bold text-[#513FDF]">
                            {boardData.active_board.board_id}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold">No active board right now</span>
                      )}
                    </h2>
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      {boardData?.active_board
                        ? "You can follow the latest questions and answers from this course below."
                        : "There is no board currently open for this course."}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-4 rounded-full bg-[#F9F9F9] px-5 py-4">
                      <Clock3 size={22} className="text-[#513FDF]" />
                      <div>
                        <p className="text-xs font-medium text-slate-400">Board Status</p>
                        <p className="text-lg text-slate-800">
                          {boardData?.active_board?.status || "No board"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-full bg-[#F9F9F9] px-5 py-4">
                      <Contact size={22} className="text-[#513FDF]" />
                      <div>
                        <p className="text-xs font-medium text-slate-400">Instructor</p>
                        <p className="text-lg text-slate-800">
                          {boardData?.course.professor_name || selectedCourse?.professor_name || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {boardData?.active_board ? (
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link
                      href={`/student/courses/board?course_code=${encodeURIComponent(
                        selectedCourseCode,
                      )}&board_id=${encodeURIComponent(boardData.active_board.board_id)}`}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
                    >
                      <Eye size={18} />
                      View Board
                    </Link>
                    <p className="text-sm font-medium text-slate-500">
                      <span className="text-slate-700">
                        {boardData.active_board.total_questions}
                      </span>{" "}
                      questions in the current board.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl bg-[#FBFAFF] px-5 py-4 text-sm font-medium text-[#9388BB]">
                    ยังไม่มี Board ที่ใช้งานอยู่ในรายวิชานี้
                  </div>
                )}
              </section>

              <section className="mt-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-[#1B1B1B]">Activity Timeline</h3>
                    <p className="mt-2 text-sm text-[#8D84B6]">
                      Questions and answers from this course board.
                    </p>
                  </div>

                  <div className="flex w-full max-w-xl items-center gap-3 rounded-full bg-white px-5 py-4 shadow-sm">
                    <Search size={18} className="text-[#A59ACB]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search board questions..."
                      className="w-full bg-transparent text-base text-[#40375C] outline-none placeholder:text-[#B4ABD5]"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {(["All", "Answered", "Unanswered"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        filter === value
                          ? "bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] text-white"
                          : "border border-[#E4DDFB] bg-white text-[#9388BB]"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="rounded-[28px] bg-white px-6 py-14 text-center text-sm font-medium text-[#9B91C7] shadow-sm">
                      {boardData?.active_board
                        ? "No questions in this board yet."
                        : "No board activity for this course yet."}
                    </div>
                  ) : (
                    filteredQuestions.map((question) => (
                      <article
                        key={question.id}
                        className={`rounded-[28px] border p-6 shadow-sm ${
                          question.status === "ANSWERED"
                            ? "border-emerald-100 bg-[#F2FFF7]"
                            : "border-slate-100 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${avatarTone(
                                question.author_id,
                              )}`}
                            >
                              {initials(question.author_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[#2A2340]">
                                  {question.author_name}
                                </span>
                                <span className="text-xs text-[#A39ACB]">
                                  {formatRelativeTime(question.created_at)}
                                </span>
                              </div>
                              <h4 className="mt-2 text-xl font-bold text-[#1E1934]">
                                {question.title}
                              </h4>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5F557F]">
                                {question.content}
                              </p>

                              {(question.replies ?? []).length > 0 ? (
                                <div className="mt-4 space-y-3">
                                  {(question.replies ?? []).map((reply) => (
                                    <div
                                      key={reply.id}
                                      className={`rounded-[20px] px-4 py-3 ${
                                        reply.is_professor
                                          ? "bg-[#EFFFF6] text-[#275E47]"
                                          : "bg-[#F6F4FF] text-[#4B4170]"
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-[0.12em]">
                                          {reply.author_name}
                                        </span>
                                        <span className="text-xs opacity-70">
                                          {formatRelativeTime(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-sm leading-6">
                                        {reply.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                              question.status === "ANSWERED"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-orange-50 text-orange-500"
                            }`}
                          >
                            {question.status}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
