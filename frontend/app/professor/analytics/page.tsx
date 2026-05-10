"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  GraduationCap,
  Layers3,
  MessageSquare,
  Users,
} from "lucide-react";
import Header from "@/app/components/Header";
import { useAuthSession } from "@/app/hooks/useAuthSession";
import {
  getProfessorQuestions,
  type ProfessorQuestionsData,
  type ProfessorSectionResponse,
  type ProfessorStudentQuestion,
} from "@/app/lib/api";

type DateRangeFilter = "week" | "month" | "all";
type StatusFilter = "all" | "answered" | "pending";

type TrendPoint = {
  label: string;
  total: number;
};

type SectionSummary = {
  id: string;
  label: string;
  students: number;
  questions: number;
  answered: number;
  pending: number;
  boards: number;
  participation: number;
};

type StudentRankingItem = {
  id: string;
  name: string;
  sectionLabel: string;
  totalQuestions: number;
  answeredQuestions: number;
  boardsJoined: number;
  participation: number;
};

function formatSectionLabel(sectionCode?: string | null) {
  const normalized = sectionCode?.trim().toUpperCase() || "";
  if (!normalized) {
    return "No Section";
  }
  if (normalized.startsWith("SEC")) {
    return normalized;
  }
  return `SEC ${normalized}`;
}

function getSectionValue(questionOrBoard: {
  section_code?: string | null;
  section_id?: string | null;
}) {
  return (
    questionOrBoard.section_code?.trim().toUpperCase() ||
    questionOrBoard.section_id?.trim() ||
    ""
  );
}

function isWithinDateRange(value: string | null, range: DateRangeFilter) {
  if (!value || range === "all") {
    return true;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (range === "week") {
    return diffDays <= 7;
  }

  return diffDays <= 30;
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfWeek(value: Date) {
  const day = value.getDay();
  const diff = (day + 6) % 7;
  const result = startOfDay(value);
  result.setDate(result.getDate() - diff);
  return result;
}

function buildTrendData(
  questions: ProfessorStudentQuestion[],
  dateRange: DateRangeFilter,
) {
  const now = new Date();

  if (dateRange === "week") {
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = startOfDay(new Date(now));
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toDateString(),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        total: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    questions.forEach((question) => {
      if (!question.created_at) {
        return;
      }
      const parsed = startOfDay(new Date(question.created_at));
      const bucket = bucketMap.get(parsed.toDateString());
      if (bucket) {
        bucket.total += 1;
      }
    });

    return buckets;
  }

  if (dateRange === "month") {
    const buckets = Array.from({ length: 4 }, (_, index) => {
      const start = startOfWeek(new Date(now));
      start.setDate(start.getDate() - (3 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return {
        key: `${start.toISOString()}-${end.toISOString()}`,
        label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
        start,
        end,
        total: 0,
      };
    });

    questions.forEach((question) => {
      if (!question.created_at) {
        return;
      }
      const parsed = new Date(question.created_at);
      const bucket = buckets.find(
        (item) => parsed >= item.start && parsed <= item.end,
      );
      if (bucket) {
        bucket.total += 1;
      }
    });

    return buckets.map(({ key, label, total }) => ({ key, label, total }));
  }

  const buckets = Array.from({ length: 6 }, (_, index) => {
    const start = startOfWeek(new Date(now));
    start.setDate(start.getDate() - (5 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      key: `${start.toISOString()}-${end.toISOString()}`,
      label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
      start,
      end,
      total: 0,
    };
  });

  questions.forEach((question) => {
    if (!question.created_at) {
      return;
    }
    const parsed = new Date(question.created_at);
    const bucket = buckets.find((item) => parsed >= item.start && parsed <= item.end);
    if (bucket) {
      bucket.total += 1;
    }
  });

  return buckets.map(({ key, label, total }) => ({ key, label, total }));
}

function getInitials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return "NA";
  }
  return tokens
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join("");
}

function getAvatarTone(seed: string) {
  const tones = [
    "bg-[#FFE6F2] text-[#D5488D]",
    "bg-[#EEE8FF] text-[#6A55E9]",
    "bg-[#E8F6FF] text-[#247BA0]",
    "bg-[#FDF0E1] text-[#D97706]",
    "bg-[#EAFBF2] text-[#14805E]",
  ];
  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

function buildAnalyticsQuery(
  courseCode: string,
  sectionCode: string,
  dateRange: DateRangeFilter,
  status: StatusFilter,
) {
  const query = new URLSearchParams();
  if (courseCode.trim()) {
    query.set("course_code", courseCode.trim().toUpperCase());
  }
  if (sectionCode !== "ALL") {
    query.set("sec", sectionCode.trim().toUpperCase());
  }
  query.set("range", dateRange);
  query.set("status", status);
  return query.toString();
}

export default function ProfessorAnalyticsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";
  const selectedSectionCode =
    searchParams.get("sec")?.trim().toUpperCase() || "ALL";
  const selectedDateRange =
    (searchParams.get("range")?.trim().toLowerCase() as DateRangeFilter) || "week";
  const selectedStatus =
    (searchParams.get("status")?.trim().toLowerCase() as StatusFilter) || "all";

  useEffect(() => {
    if (!session?.userId || session.role !== "professor") {
      return;
    }

    getProfessorQuestions(session.userId, {
      courseCode: selectedCourseCode || undefined,
      sectionCode:
        selectedSectionCode === "ALL" ? undefined : selectedSectionCode,
      status: "all",
    })
      .then((response) => {
        setData(response);
        setError("");
        if (!selectedCourseCode && response.selected_course_code) {
          router.replace(
            `${pathname}?${buildAnalyticsQuery(
              response.selected_course_code,
              "ALL",
              selectedDateRange,
              selectedStatus,
            )}`,
          );
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics data",
        );
      });
  }, [
    pathname,
    router,
    selectedCourseCode,
    selectedSectionCode,
    selectedDateRange,
    selectedStatus,
    session?.role,
    session?.userId,
  ]);

  const isSwitchingCourse =
    !!selectedCourseCode &&
    !!data &&
    data.selected_course_code.trim().toUpperCase() !== selectedCourseCode;
  const loading = (!data && !error) || isSwitchingCourse;

  const professorName =
    session?.fullName || session?.nickname || data?.professor.full_name || "Professor";

  const sectionOptions = useMemo(() => {
    const sections = data?.sections || [];
    return [
      { value: "ALL", label: "All Sec" },
      ...sections.map((section) => ({
        value: section.section_code.trim().toUpperCase(),
        label: formatSectionLabel(section.section_code),
      })),
    ];
  }, [data?.sections]);

  const courseOptions = data?.courses || [];

  const filteredQuestionsByScope = useMemo(() => {
    const questions = data?.student_questions || [];
    return questions.filter((question) => {
      const matchesSection =
        selectedSectionCode === "ALL" ||
        getSectionValue(question) === selectedSectionCode;
      const matchesDate = isWithinDateRange(question.created_at, selectedDateRange);
      return matchesSection && matchesDate;
    });
  }, [data?.student_questions, selectedDateRange, selectedSectionCode]);

  const filteredBoards = useMemo(() => {
    const boards = data?.board_sessions || [];
    return boards.filter((board) => {
      const matchesSection =
        selectedSectionCode === "ALL" ||
        getSectionValue(board) === selectedSectionCode;
      const matchesDate = isWithinDateRange(board.created_at, selectedDateRange);
      return matchesSection && matchesDate;
    });
  }, [data?.board_sessions, selectedDateRange, selectedSectionCode]);

  const displayedQuestions = useMemo(() => {
    if (selectedStatus === "all") {
      return filteredQuestionsByScope;
    }
    return filteredQuestionsByScope.filter((question) =>
      selectedStatus === "answered"
        ? question.status === "ANSWERED"
        : question.status === "UNANSWERED",
    );
  }, [filteredQuestionsByScope, selectedStatus]);

  const enrolledStudents = useMemo(() => {
    const students = data?.enrolled_students || [];
    return students.filter((student) => {
      if (selectedSectionCode === "ALL") {
        return true;
      }
      return getSectionValue(student) === selectedSectionCode;
    });
  }, [data?.enrolled_students, selectedSectionCode]);

  const activeStudentIds = useMemo(() => {
    return new Set(filteredQuestionsByScope.map((question) => question.student_id));
  }, [filteredQuestionsByScope]);

  const totalStudents = enrolledStudents.length;
  const totalQuestions = filteredQuestionsByScope.length;
  const answeredQuestions = filteredQuestionsByScope.filter(
    (question) => question.status === "ANSWERED",
  ).length;
  const pendingQuestions = filteredQuestionsByScope.filter(
    (question) => question.status === "UNANSWERED",
  ).length;
  const hiddenQuestions = filteredQuestionsByScope.filter(
    (question) => question.status === "DELETED",
  ).length;
  const answeredRate =
    filteredQuestionsByScope.length > 0
      ? Math.round((answeredQuestions / filteredQuestionsByScope.length) * 100)
      : 0;
  const participationRate =
    totalStudents > 0 ? Math.round((activeStudentIds.size / totalStudents) * 100) : 0;

  const trendData: TrendPoint[] = useMemo(() => {
    return buildTrendData(displayedQuestions, selectedDateRange).map((item) => ({
      label: item.label,
      total: item.total,
    }));
  }, [displayedQuestions, selectedDateRange]);

  const maxTrendValue = trendData.reduce(
    (max, item) => Math.max(max, item.total),
    0,
  );

  const sectionComparison = useMemo<SectionSummary[]>(() => {
    const sections = (data?.sections || []).filter((section) => {
      if (selectedSectionCode === "ALL") {
        return true;
      }
      return section.section_code.trim().toUpperCase() === selectedSectionCode;
    });
    const students = data?.enrolled_students || [];
    const questions = filteredQuestionsByScope;
    const boards = filteredBoards;

    return sections.map((section: ProfessorSectionResponse) => {
      const sectionKey = section.section_code.trim().toUpperCase();
      const sectionStudents = students.filter(
        (student) => getSectionValue(student) === sectionKey,
      );
      const sectionQuestions = questions.filter(
        (question) => getSectionValue(question) === sectionKey,
      );
      const sectionBoards = boards.filter((board) => getSectionValue(board) === sectionKey);
      const sectionActiveStudents = new Set(
        sectionQuestions.map((question) => question.student_id),
      );
      const answered = sectionQuestions.filter(
        (question) => question.status === "ANSWERED",
      ).length;
      const pending = sectionQuestions.filter(
        (question) => question.status === "UNANSWERED",
      ).length;

      return {
        id: section.section_id,
        label: formatSectionLabel(section.section_code),
        students: sectionStudents.length,
        questions: sectionQuestions.length,
        answered,
        pending,
        boards: sectionBoards.length,
        participation:
          sectionStudents.length > 0
            ? Math.round((sectionActiveStudents.size / sectionStudents.length) * 100)
            : 0,
      };
    });
  }, [
    data?.enrolled_students,
    data?.sections,
    filteredBoards,
    filteredQuestionsByScope,
    selectedSectionCode,
  ]);

  const boardAnalytics = useMemo(() => {
    return filteredBoards.map((board) => {
      const boardQuestions = filteredQuestionsByScope.filter(
        (question) => question.board_id === board.board_id,
      );
      const participatingStudents = new Set(
        boardQuestions.map((question) => question.student_id),
      );
      return {
        ...board,
        totalQuestions: boardQuestions.length,
        answeredQuestions: boardQuestions.filter(
          (question) => question.status === "ANSWERED",
        ).length,
        pendingQuestions: boardQuestions.filter(
          (question) => question.status === "UNANSWERED",
        ).length,
        participatingStudents: participatingStudents.size,
      };
    });
  }, [filteredBoards, filteredQuestionsByScope]);

  const studentRanking = useMemo<StudentRankingItem[]>(() => {
    return enrolledStudents
      .map((student) => {
        const studentQuestions = filteredQuestionsByScope.filter(
          (question) => question.student_id === student.student_id,
        );
        const boardsJoined = new Set(
          studentQuestions
            .map((question) => question.board_id)
            .filter((boardId): boardId is string => Boolean(boardId)),
        );
        const participation =
          filteredBoards.length > 0
            ? Math.round((boardsJoined.size / filteredBoards.length) * 100)
            : 0;

        return {
          id: student.student_id,
          name: student.student_name,
          sectionLabel: formatSectionLabel(student.section_code),
          totalQuestions: studentQuestions.length,
          answeredQuestions: studentQuestions.filter(
            (question) => question.status === "ANSWERED",
          ).length,
          boardsJoined: boardsJoined.size,
          participation,
        };
      })
      .sort((a, b) => {
        if (b.totalQuestions !== a.totalQuestions) {
          return b.totalQuestions - a.totalQuestions;
        }
        if (b.participation !== a.participation) {
          return b.participation - a.participation;
        }
        return a.name.localeCompare(b.name);
      });
  }, [enrolledStudents, filteredBoards.length, filteredQuestionsByScope]);

  const recentPendingQuestions = useMemo(() => {
    return filteredQuestionsByScope
      .filter((question) => question.status === "UNANSWERED")
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [filteredQuestionsByScope]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF9F8] px-8 py-16 text-center text-[#8D84B6]">
        Loading professor analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FCF9F8] px-8 py-16 text-center text-rose-500">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FCF9F8] px-8 py-16 text-center text-[#8D84B6]">
        No analytics data available yet.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-slate-700">
      <Header
        professorName={professorName}
        mode="questions"
        buttonLabel="Open Feed"
        onJoinCourse={() => {
          const suffix = selectedCourseCode
            ? `?course_code=${encodeURIComponent(selectedCourseCode)}`
            : "";
          router.push(`/professor/questions${suffix}`);
        }}
      />

      <main className="pb-16 pt-44 xl:pt-32">
        <div className="mx-auto w-full max-w-[1360px] px-6 xl:px-8 2xl:px-10">
          <section className="rounded-[34px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)] xl:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F8F2FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8B5CF6]">
                  <BarChart3 size={14} />
                  Professor Analytics
                </div>
                <h1 className="mt-4 text-3xl font-bold text-[#1F1838] xl:text-4xl">
                  Course and section participation overview
                </h1>
                <p className="mt-3 text-sm leading-7 text-[#7C739D] xl:text-base">
                  Review engagement across courses, sections, board sessions, and
                  student participation. This page currently aggregates from the
                  existing course/question feed so it is ready to connect to a
                  dedicated analytics API later.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[560px]">
                <FilterSelect
                  label="Course"
                  value={selectedCourseCode}
                  icon={<GraduationCap size={16} />}
                  options={courseOptions.map((course) => ({
                    value: course.course_code,
                    label: `${course.course_code} - ${course.course_name}`,
                  }))}
                  onChange={(nextValue) => {
                    router.replace(
                      `${pathname}?${buildAnalyticsQuery(
                        nextValue,
                        "ALL",
                        selectedDateRange,
                        selectedStatus,
                      )}`,
                    );
                  }}
                />
                <FilterSelect
                  label="Section"
                  value={selectedSectionCode}
                  icon={<Layers3 size={16} />}
                  options={sectionOptions}
                  onChange={(nextValue) => {
                    router.replace(
                      `${pathname}?${buildAnalyticsQuery(
                        selectedCourseCode,
                        nextValue,
                        selectedDateRange,
                        selectedStatus,
                      )}`,
                    );
                  }}
                />
                <FilterSelect
                  label="Date Range"
                  value={selectedDateRange}
                  icon={<CalendarRange size={16} />}
                  options={[
                    { value: "week", label: "This week" },
                    { value: "month", label: "This month" },
                    { value: "all", label: "All time" },
                  ]}
                  onChange={(nextValue) => {
                    router.replace(
                      `${pathname}?${buildAnalyticsQuery(
                        selectedCourseCode,
                        selectedSectionCode,
                        nextValue as DateRangeFilter,
                        selectedStatus,
                      )}`,
                    );
                  }}
                />
                <FilterSelect
                  label="Question Status"
                  value={selectedStatus}
                  icon={<MessageSquare size={16} />}
                  options={[
                    { value: "all", label: "All" },
                    { value: "answered", label: "Answered" },
                    { value: "pending", label: "Pending" },
                  ]}
                  onChange={(nextValue) => {
                    router.replace(
                      `${pathname}?${buildAnalyticsQuery(
                        selectedCourseCode,
                        selectedSectionCode,
                        selectedDateRange,
                        nextValue as StatusFilter,
                      )}`,
                    );
                  }}
                />
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Total Students"
              value={totalStudents}
              helper="Counted from enrollments"
              accent="from-[#F063AC] to-[#D94FA2]"
              icon={<Users size={20} />}
            />
            <SummaryCard
              label="Total Questions"
              value={totalQuestions}
              helper="Filtered by course / section / range"
              accent="from-[#6B5BFF] to-[#8C72FF]"
              icon={<MessageSquare size={20} />}
            />
            <SummaryCard
              label="Answered Rate"
              value={`${answeredRate}%`}
              helper={`${answeredQuestions} answered`}
              accent="from-[#00A98F] to-[#4BC9A1]"
              icon={<CheckCircle2 size={20} />}
            />
            <SummaryCard
              label="Board Sessions"
              value={filteredBoards.length}
              helper="Boards in selected scope"
              accent="from-[#FF9D4D] to-[#FF6B6B]"
              icon={<Eye size={20} />}
            />
            <SummaryCard
              label="Average Participation"
              value={`${participationRate}%`}
              helper={`${activeStudentIds.size} active students`}
              accent="from-[#5D71F5] to-[#EE57A7]"
              icon={<BarChart3 size={20} />}
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.7fr)]">
            <article className="rounded-[32px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#21183A]">
                    Question Trend
                  </h2>
                  <p className="mt-1 text-sm text-[#8479A7]">
                    Based on `questions.created_at` in the selected date range
                  </p>
                </div>
                <span className="rounded-full bg-[#F5F1FF] px-3 py-1 text-xs font-semibold text-[#735DE8]">
                  {selectedDateRange === "week"
                    ? "Daily view"
                    : "Weekly buckets"}
                </span>
              </div>

              <div className="mt-8 grid h-[290px] grid-cols-[repeat(auto-fit,minmax(52px,1fr))] items-end gap-3">
                {trendData.map((point) => {
                  const barHeight =
                    maxTrendValue > 0 ? Math.max((point.total / maxTrendValue) * 100, 8) : 0;
                  return (
                    <div key={point.label} className="flex h-full flex-col items-center gap-3">
                      <span className="text-xs font-semibold text-[#786D9D]">
                        {point.total}
                      </span>
                      <div className="flex h-full w-full items-end rounded-full bg-[#F1F3FA] p-1">
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-[#5B41FF] via-[#8A5CF6] to-[#F063AC] transition-all duration-500"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="text-center text-[11px] leading-4 text-[#9A92BA]">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[32px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
              <h2 className="text-2xl font-semibold text-[#21183A]">
                Question Status Breakdown
              </h2>
              <p className="mt-1 text-sm text-[#8479A7]">
                Answered, pending, and moderated visibility
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    label: "Answered",
                    value: answeredQuestions,
                    color: "from-[#5C4CF3] to-[#6D71FF]",
                    bg: "bg-[#F1EFFF]",
                  },
                  {
                    label: "Pending",
                    value: pendingQuestions,
                    color: "from-[#F97316] to-[#FB7185]",
                    bg: "bg-[#FFF1E9]",
                  },
                  {
                    label: "Hidden / Moderated",
                    value: hiddenQuestions,
                    color: "from-[#B6BBC8] to-[#8F96A8]",
                    bg: "bg-[#F3F5F9]",
                  },
                ].map((item) => {
                  const totalBase = Math.max(filteredQuestionsByScope.length, 1);
                  const width = (item.value / totalBase) * 100;
                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#2A2340]">{item.label}</span>
                        <span className="font-semibold text-[#6A5EDB]">{item.value}</span>
                      </div>
                      <div className={`h-3 overflow-hidden rounded-full ${item.bg}`}>
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <article className="rounded-[32px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#21183A]">
                    Section Comparison
                  </h2>
                  <p className="mt-1 text-sm text-[#8479A7]">
                    All sections stay visible even when activity is zero
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F0ECFB] text-left text-xs uppercase tracking-[0.14em] text-[#9B93BC]">
                      <th className="pb-3 pr-4">Section</th>
                      <th className="pb-3 pr-4">Students</th>
                      <th className="pb-3 pr-4">Questions</th>
                      <th className="pb-3 pr-4">Answered</th>
                      <th className="pb-3 pr-4">Pending</th>
                      <th className="pb-3 pr-4">Boards</th>
                      <th className="pb-3">Participation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionComparison.map((section) => (
                      <tr key={section.id} className="border-b border-[#F7F3FD] last:border-b-0">
                        <td className="py-4 pr-4 font-semibold text-[#241B47]">
                          {section.label}
                        </td>
                        <td className="py-4 pr-4 text-[#6F658F]">{section.students}</td>
                        <td className="py-4 pr-4 text-[#6F658F]">{section.questions}</td>
                        <td className="py-4 pr-4 text-emerald-600">{section.answered}</td>
                        <td className="py-4 pr-4 text-orange-500">{section.pending}</td>
                        <td className="py-4 pr-4 text-[#6F658F]">{section.boards}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2EEFF]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#5B41FF] to-[#F063AC]"
                                style={{ width: `${section.participation}%` }}
                              />
                            </div>
                            <span className="w-12 text-right font-semibold text-[#5F55E6]">
                              {section.participation}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-[32px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
              <h2 className="text-2xl font-semibold text-[#21183A]">
                Recent Pending Questions
              </h2>
              <p className="mt-1 text-sm text-[#8479A7]">
                Latest unanswered questions in the current scope
              </p>

              <div className="mt-6 space-y-4">
                {recentPendingQuestions.length === 0 ? (
                  <div className="rounded-[24px] bg-[#FBF9FF] px-5 py-10 text-center text-sm text-[#8E84B2]">
                    No pending questions in this filter set.
                  </div>
                ) : (
                  recentPendingQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-[26px] border border-[#F2ECFF] bg-[#FCFBFF] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F1ECFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F5CE5]">
                              {formatSectionLabel(question.section_code)}
                            </span>
                            <span className="rounded-full bg-[#FFF1F6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D5488D]">
                              Pending
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-[#231B44]">
                            {question.title}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#746A96]">
                            {question.content}
                          </p>
                        </div>

                        <Link
                          href={`/professor/questions?${buildAnalyticsQuery(
                            selectedCourseCode,
                            selectedSectionCode,
                            selectedDateRange,
                            "pending",
                          )}`}
                          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#E5DBFD] bg-white px-4 py-2 text-sm font-semibold text-[#6D59E7] transition hover:bg-[#FBF8FF]"
                        >
                          Answer
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-[32px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#21183A]">
                  Board Session Analytics
                </h2>
                <p className="mt-1 text-sm text-[#8479A7]">
                  Review every board in the selected course and section scope
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {boardAnalytics.length === 0 ? (
                <div className="rounded-[24px] bg-[#FBF9FF] px-5 py-10 text-center text-sm text-[#8E84B2] xl:col-span-2">
                  No board sessions found for this filter set.
                </div>
              ) : (
                boardAnalytics.map((board) => (
                  <article
                    key={board.board_id}
                    className="rounded-[28px] border border-[#F2ECFF] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFAFF_100%)] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#F2ECFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F5CE5]">
                            {formatSectionLabel(board.section_code)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                              board.status === "ACTIVE"
                                ? "bg-[#EEF7F5] text-[#13836D]"
                                : "bg-[#F4F5F8] text-[#7F8798]"
                            }`}
                          >
                            {board.status.toLowerCase()}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-[#231B44]">
                          {board.board_title || board.board_id}
                        </h3>
                        <p className="mt-1 text-sm text-[#857CA6]">
                          Opened {board.created_at ? new Date(board.created_at).toLocaleString() : "-"}
                        </p>
                        <p className="mt-1 text-sm text-[#857CA6]">
                          Closed {board.closed_at ? new Date(board.closed_at).toLocaleString() : "-"}
                        </p>
                      </div>

                      <Link
                        href={`/professor/courses/boardreview?course_code=${encodeURIComponent(
                          board.course_code,
                        )}&board_id=${encodeURIComponent(board.board_id)}${
                          board.section_code
                            ? `&sec=${encodeURIComponent(board.section_code)}`
                            : ""
                        }`}
                        className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#E5DBFD] bg-white px-4 py-2 text-sm font-semibold text-[#6D59E7] transition hover:bg-[#FBF8FF]"
                      >
                        View Board Details
                        <ChevronRight size={16} />
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <MiniMetric label="Total Questions" value={board.totalQuestions} />
                      <MiniMetric
                        label="Answered"
                        value={board.answeredQuestions}
                        tone="text-emerald-600"
                      />
                      <MiniMetric
                        label="Pending"
                        value={board.pendingQuestions}
                        tone="text-orange-500"
                      />
                      <MiniMetric
                        label="Participating Students"
                        value={board.participatingStudents}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[32px] bg-white p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
            <h2 className="text-2xl font-semibold text-[#21183A]">
              Student Participation Ranking
            </h2>
            <p className="mt-1 text-sm text-[#8479A7]">
              Participation is based on distinct board sessions joined within the
              selected scope.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0ECFB] text-left text-xs uppercase tracking-[0.14em] text-[#9B93BC]">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 pr-4">Section</th>
                    <th className="pb-3 pr-4">Questions</th>
                    <th className="pb-3 pr-4">Answered</th>
                    <th className="pb-3 pr-4">Boards Joined</th>
                    <th className="pb-3">Participation</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRanking.map((student) => (
                    <tr key={student.id} className="border-b border-[#F7F3FD] last:border-b-0">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${getAvatarTone(
                              student.id,
                            )}`}
                          >
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#241B47]">{student.name}</p>
                            <p className="text-xs text-[#958CB5]">{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-[#6F658F]">{student.sectionLabel}</td>
                      <td className="py-4 pr-4 text-[#6F658F]">{student.totalQuestions}</td>
                      <td className="py-4 pr-4 text-emerald-600">
                        {student.answeredQuestions}
                      </td>
                      <td className="py-4 pr-4 text-[#6F658F]">{student.boardsJoined}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2EEFF]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#5B41FF] to-[#F063AC]"
                              style={{ width: `${student.participation}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-semibold text-[#5F55E6]">
                            {student.participation}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  icon,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  icon: React.ReactNode;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="rounded-[24px] border border-[#F1EAFE] bg-[#FCFAFF] px-4 py-3">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A195C3]">
        {icon}
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none truncate bg-transparent pr-8 text-sm font-medium text-[#30264B] outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#6F658F]"
        />
      </div>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A90BD]">
            {label}
          </p>
          <p className="mt-3 text-4xl font-bold text-[#20173B]">{value}</p>
          <p className="mt-2 text-sm text-[#8177A2]">{helper}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function MiniMetric({
  label,
  value,
  tone = "text-[#241B47]",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_10px_24px_rgba(116,90,198,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A197C2]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
