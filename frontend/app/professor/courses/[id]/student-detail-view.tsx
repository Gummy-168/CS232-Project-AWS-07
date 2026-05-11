"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import CreateCourse from "@/app/components/createcourse";
import { useAuthSession } from "@/app/hooks/useAuthSession";
import {
  ApiError,
  createProfessorQuestionReply,
  deleteProfessorQuestion,
  getProfessorQuestionsByCourse,
  getStudentAnalyticsForProfessor,
  getStudentProfile,
  getStudentQuestionsInCourse,
  type ProfessorStudentQuestion,
  updateProfessorQuestionStatus,
} from "@/app/lib/api";

type FilterValue = "All" | "Answered" | "Unanswered";

type StudentProfileCard = {
  id: string;
  name: string;
  studentNumber: string;
  email: string;
  avatar: string;
  stats: {
    pending: number;
    answered: number;
    participating: string;
    totalQuestions: number;
  };
};

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

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "just now";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "just now";
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#FAFAFD] px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D12D7D]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#1F2430]">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string | number;
  valueClassName: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        {icon}
      </div>
      <p className={`mt-1 text-[32px] leading-none font-semibold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function ActivityCard({
  question,
  isOpen,
  replyDraft,
  onToggleReplies,
  onReplyDraftChange,
  onMarkAnswered,
  onUnmarked,
  onPostReply,
  onDelete,
}: {
  question: ProfessorStudentQuestion;
  isOpen: boolean;
  replyDraft: string;
  onToggleReplies: () => void;
  onReplyDraftChange: (value: string) => void;
  onMarkAnswered: () => void;
  onUnmarked: () => void;
  onPostReply: () => void;
  onDelete: () => void;
}) {
  const isAnswered = question.status === "ANSWERED";

  return (
    <article
      className={`rounded-2xl border p-4 md:p-5 ${
        isAnswered ? "border-emerald-100 bg-[#F2FCF7]" : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${avatarTone(
              question.student_id,
            )}`}
          >
            {initials(question.student_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#23272F]">{question.student_name}</p>
            <p className="text-[11px] text-slate-400">
              {formatRelativeTime(question.created_at)} • {question.course_code}
            </p>
            <p className="mt-1 text-sm text-[#303645]">{question.title || question.content}</p>
            {question.title && question.content && question.title !== question.content ? (
              <p className="mt-1 text-sm text-slate-500">{question.content}</p>
            ) : null}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isAnswered ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAnswered ? "bg-emerald-500" : "bg-orange-400"
            }`}
          />
          {isAnswered ? "ANSWERED" : "UNANSWERED"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleReplies}
          className="rounded-full bg-[#F3EEFF] px-3 py-1 text-[11px] font-medium text-[#5A46E8] hover:bg-[#EAE2FF]"
        >
          ↩ {question.replies.length} {isOpen ? "Hide" : "Reply"}
        </button>
        <div className="flex items-center gap-2">
          {isAnswered ? (
            <button
              type="button"
              onClick={onUnmarked}
              className="rounded-md bg-orange-50 px-2.5 py-1.5 text-[11px] font-medium text-orange-600 hover:bg-orange-100"
            >
              Unmarked
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkAnswered}
              className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-100"
            >
              Mark Answered
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-500 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-[#FAFAFE] p-3">
          {question.replies.length > 0
            ? question.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`rounded-lg px-3 py-2 ${
                    reply.is_professor ? "bg-emerald-50" : "bg-white"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {reply.is_professor ? "Professor Reply" : reply.author_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{reply.content}</p>
                </div>
              ))
            : null}

          <textarea
            value={replyDraft}
            onChange={(event) => onReplyDraftChange(event.target.value)}
            placeholder="Reply as instructor..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-[#2E3440] outline-none focus:border-[#B8A8FF]"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onPostReply}
              disabled={!replyDraft.trim()}
              className="rounded-lg bg-[#5A46E8] px-4 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#4D3DCC]"
            >
              Post Reply
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#5A46E8]" />
        Loading student data...
      </div>
    </div>
  );
}

export default function StudentDetailView() {
  const router = useRouter();
  const routeParams = useParams<{ id: string | string[] }>();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const studentId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id ?? "";
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() ?? "";
  const hasSession = Boolean(session?.userId && session?.accessToken);
  const hasRouteContext = Boolean(studentId && selectedCourseCode);
  const hasRouteMismatch =
    hasRouteContext &&
    studentId.trim().toUpperCase() === selectedCourseCode.trim().toUpperCase();
  const routeError = !studentId
    ? "Student ID not found in route"
    : !selectedCourseCode
      ? "Course code not found in URL"
      : hasRouteMismatch
        ? "Route validation failed: URL id appears to be course_code, not student_id"
        : "";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterValue>("All");
  const [studentProfile, setStudentProfile] = useState<StudentProfileCard | null>(null);
  const [courseTitle, setCourseTitle] = useState("Course Detail");
  const [professorName, setProfessorName] = useState("Professor");
  const [questions, setQuestions] = useState<ProfessorStudentQuestion[]>([]);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [refreshToken, setRefreshToken] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const activeRequestKey =
    hasSession && hasRouteContext && !hasRouteMismatch
      ? `${studentId}:${selectedCourseCode}:${refreshToken}`
      : null;

  useEffect(() => {
    if (!activeRequestKey) {
      return;
    }

    Promise.allSettled([
      getProfessorQuestionsByCourse(session.userId, selectedCourseCode, session.accessToken),
      getStudentAnalyticsForProfessor(
        session.userId,
        selectedCourseCode,
        studentId,
        session.accessToken,
      ),
      getStudentQuestionsInCourse(
        session.userId,
        selectedCourseCode,
        studentId,
        session.accessToken,
      ),
      getStudentProfile(studentId, session.accessToken, "professor"),
    ]).then(([courseResult, analyticsResult, questionResult, profileResult]) => {
      const courseData = courseResult.status === "fulfilled" ? courseResult.value : null;
      const analyticsData =
        analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
      const studentQuestions =
        questionResult.status === "fulfilled" ? questionResult.value : [];
      const profileData = profileResult.status === "fulfilled" ? profileResult.value : null;

      console.log("[StudentDetail] params.id:", studentId);
      console.log(
        "[StudentDetail] enrolled student_id list:",
        courseData?.enrolled_students.map((item) => item.student_id) ?? [],
      );

      if (
        profileResult.status === "rejected" &&
        profileResult.reason instanceof ApiError &&
        (profileResult.reason.status === 401 || profileResult.reason.status === 403)
      ) {
        setError("Permission Denied: Please check professor role header");
        setStudentProfile(null);
        setQuestions([]);
        setLoadedRequestKey(activeRequestKey);
        return;
      }

      if (!analyticsData) {
        if (
          analyticsResult.status === "rejected" &&
          analyticsResult.reason instanceof ApiError &&
          analyticsResult.reason.status === 404
        ) {
          setError("Student data not found");
        } else {
          setError(
            analyticsResult.status === "rejected" && analyticsResult.reason instanceof Error
              ? analyticsResult.reason.message
              : "Failed to load student data",
          );
        }
        setStudentProfile(null);
        setQuestions([]);
        setLoadedRequestKey(activeRequestKey);
        return;
      }

      const displayName = profileData?.full_name?.trim() || analyticsData.student.name;
      const email = profileData?.email?.trim() || "-";

      setStudentProfile({
        id: studentId,
        name: displayName,
        studentNumber: analyticsData.student.id,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          analyticsData.student.id,
        )}`,
        stats: {
          pending: analyticsData.stats.pending,
          answered: analyticsData.stats.answered,
          participating: `${analyticsData.stats.participation}%`,
          totalQuestions: analyticsData.stats.total_questions,
        },
      });
      setQuestions(studentQuestions);
      setCourseTitle(
        courseData?.course.title || `${analyticsData.course.code}: ${analyticsData.course.title}`,
      );
      setProfessorName(courseData?.professor.full_name || courseData?.professor.name || "Professor");
      setError("");
      setLoadedRequestKey(activeRequestKey);
    });
  }, [
    activeRequestKey,
    refreshToken,
    selectedCourseCode,
    session?.accessToken,
    session?.userId,
    studentId,
  ]);

  const isLoading = activeRequestKey !== null && loadedRequestKey !== activeRequestKey;
  const shouldShowLoading = !hasSession || (!routeError && isLoading);

  const filteredQuestions = useMemo(() => {
    if (filter === "Answered") {
      return questions.filter((question) => question.status === "ANSWERED");
    }
    if (filter === "Unanswered") {
      return questions.filter((question) => question.status !== "ANSWERED");
    }
    return questions;
  }, [filter, questions]);

  const refresh = () => setRefreshToken((prev) => prev + 1);

  const handleMarkAnswered = async (questionId: string, isAnswered: boolean) => {
    if (!session?.userId) return;
    try {
      await updateProfessorQuestionStatus(
        session.userId,
        questionId,
        isAnswered ? "pending" : "answered",
      );
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update question status");
    }
  };

  const handleReply = async (questionId: string) => {
    if (!session?.userId) return;
    const content = (replyDrafts[questionId] || "").trim();
    if (!content) return;

    try {
      await createProfessorQuestionReply(session.userId, questionId, { content });
      setReplyDrafts((prev) => ({ ...prev, [questionId]: "" }));
      setOpenReplies((prev) => ({ ...prev, [questionId]: true }));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply failed");
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!session?.userId) return;
    if (!window.confirm("Delete this question?")) return;

    try {
      await deleteProfessorQuestion(session.userId, questionId);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F6F5F8] text-slate-700">
      <Header
        professorName={professorName}
        onJoinCourse={() => setIsModalOpen(true)}
        courseTitle={courseTitle}
        codeId={selectedCourseCode}
        mode="course"
      />
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <main className="w-full px-6 pb-10 pt-[128px] md:px-8">
        <section className="mx-auto max-w-6xl rounded-[28px] border border-[#EFEAFA] bg-white p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ChevronLeft size={22} />
            </button>
            <span className="rounded-xl bg-[#F3EEFF] p-2 text-[#6A53E7]">
              <User size={16} />
            </span>
            <p className="text-sm font-semibold text-[#232735]">Student Detail</p>
          </div>

          {shouldShowLoading ? <LoadingSpinner /> : null}

          {!shouldShowLoading && routeError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
              {routeError}
            </div>
          ) : null}

          {!shouldShowLoading && !routeError && error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          {!shouldShowLoading && !routeError && !error && !studentProfile ? (
            <div className="rounded-2xl border border-slate-100 bg-[#FCFBFF] px-5 py-4 text-sm text-slate-500">
              Student data not found
            </div>
          ) : null}

          {!shouldShowLoading && !routeError && !error && studentProfile ? (
            <div className="rounded-2xl border border-slate-100 bg-[#FCFBFF] p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-2">
                  <div className="mx-auto flex w-full max-w-[120px] flex-col items-center gap-2">
                    <img
                      src={studentProfile.avatar}
                      alt="Student profile"
                      className="h-24 w-24 rounded-3xl object-cover shadow-sm"
                    />
                    <p className="text-[9px] font-semibold tracking-widest text-slate-400">
                      STUDENT PROFILE
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoBox label="Full Name" value={studentProfile.name} />
                    <InfoBox label="Student Number" value={studentProfile.studentNumber} />
                    <div className="md:col-span-2">
                      <InfoBox label="Email" value={studentProfile.email} />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Pending"
                      value={studentProfile.stats.pending}
                      valueClassName="text-[#D13184]"
                      icon={<Clock3 size={14} className="text-[#FD64A4]" />}
                    />
                    <StatBox
                      label="Answered"
                      value={studentProfile.stats.answered}
                      valueClassName="text-[#5A46E8]"
                      icon={<CheckCircle2 size={14} className="text-[#22C55E]" />}
                    />
                    <StatBox
                      label="Participating"
                      value={studentProfile.stats.participating}
                      valueClassName="text-[#1F2531]"
                      icon={<TrendingUp size={14} className="text-[#5A46E8]" />}
                    />
                    <StatBox
                      label="Total Questions"
                      value={studentProfile.stats.totalQuestions}
                      valueClassName="text-[#1F2531]"
                      icon={<MessageSquare size={14} className="text-[#5A46E8]" />}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#232735]">
                    Question From Them
                  </h3>
                  <div className="flex rounded-full bg-[#F2F2F7] p-1 text-[11px]">
                    {(["All", "Answered", "Unanswered"] as const).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFilter(name)}
                        className={`rounded-full px-3 py-1.5 font-medium transition ${
                          filter === name
                            ? "bg-white text-[#5A46E8] shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No questions found for this student in the selected course.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((question) => (
                      <ActivityCard
                        key={question.id}
                        question={question}
                        isOpen={Boolean(openReplies[question.id])}
                        replyDraft={replyDrafts[question.id] || ""}
                        onToggleReplies={() =>
                          setOpenReplies((prev) => ({
                            ...prev,
                            [question.id]: !prev[question.id],
                          }))
                        }
                        onReplyDraftChange={(value) =>
                          setReplyDrafts((prev) => ({ ...prev, [question.id]: value }))
                        }
                        onMarkAnswered={() => handleMarkAnswered(question.id, false)}
                        onUnmarked={() => handleMarkAnswered(question.id, true)}
                        onPostReply={() => handleReply(question.id)}
                        onDelete={() => handleDelete(question.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
