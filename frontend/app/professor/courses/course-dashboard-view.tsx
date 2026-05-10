"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  CornerDownLeft,
  Eye,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Header from "@/app/components/Header";
import ActionNoticeModal from "@/app/components/action-notice-modal";
import ConfirmCloseBoardModal from "@/app/components/confirm-close-board-modal";
import CreateBoardModal from "@/app/components/create-board-modal";
import SelectSectionModal from "@/app/components/select-section-modal";
import CreateCourse from "../../components/createcourse";
import CreateSection from "../../components/createsection";
import GenerateJoinCode from "../../components/generatejoincode";
import { useAuthSession } from "../../hooks/useAuthSession";
import {
  closeProfessorBoard,
  createProfessorJoinCode,
  createProfessorBoard,
  createProfessorQuestionReply,
  deleteProfessorQuestion,
  getProfessorJoinCode,
  getProfessorQuestions,
  type ProfessorBoardSession,
  type ProfessorCourseResponse,
  type ProfessorJoinCodeResponse,
  type ProfessorQuestionsData,
  type ProfessorSectionResponse,
  type ProfessorStudentQuestion,
  updateProfessorQuestionStatus,
} from "../../lib/api";

type TimelineFilter = "all" | "answered" | "unanswered" | "board";
type ReplyDrafts = Record<string, string>;
type SectionOption = { id: string; label: string };
type NoticeTone = "info" | "warning" | "danger" | "success";
type ActionNoticeState = {
  tone: NoticeTone;
  badge: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  onConfirm?: () => void;
} | null;

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

function statusPillClasses(status: ProfessorStudentQuestion["status"]) {
  return status === "ANSWERED"
    ? "bg-emerald-50 text-emerald-600"
    : "bg-orange-50 text-orange-500";
}

function boardStatusPillClasses(status: string) {
  return status.toUpperCase() === "ACTIVE"
    ? "bg-violet-50 text-violet-600"
    : "bg-slate-100 text-slate-500";
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

function avatarClasses(seed: string) {
  const palette = [
    "bg-rose-100 text-rose-600",
    "bg-violet-100 text-violet-600",
    "bg-sky-100 text-sky-600",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-600",
  ];

  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function sortByCreatedAt<T extends { createdAt: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

function formatSectionLabel(sectionCode: string) {
  const normalized = sectionCode.trim().toUpperCase();
  if (normalized.startsWith("SEC")) {
    return normalized;
  }
  return `SEC ${normalized}`;
}

function buildCourseQuery(courseCode: string, sectionCode?: string | null) {
  const query = new URLSearchParams();
  query.set("course_code", courseCode.trim().toUpperCase());
  if (sectionCode?.trim()) {
    query.set("sec", sectionCode.trim().toUpperCase());
  }
  return query.toString();
}

export default function ProfessorCourseDashboardView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isHydrated } = useAuthSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfessorQuestionsData | null>(null);
  const [joinCode, setJoinCode] = useState<ProfessorJoinCodeResponse | null>(null);
  const [joinCodeError, setJoinCodeError] = useState("");
  const [isJoinCodeLoading, setIsJoinCodeLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<ReplyDrafts>({});
  const [boardToClose, setBoardToClose] = useState<ProfessorBoardSession | null>(null);
  const [closeBoardError, setCloseBoardError] = useState("");
  const [isClosingBoard, setIsClosingBoard] = useState(false);
  const [actionNotice, setActionNotice] = useState<ActionNoticeState>(null);
  const [isSelectSectionModalOpen, setIsSelectSectionModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";
  const selectedSection = searchParams.get("sec")?.trim().toUpperCase() || "ALL";
  const selectedSectionCode = selectedSection === "ALL" ? undefined : selectedSection;

  useEffect(() => {
    const handleCourseCreated = (event: Event) => {
      const createdCourse = (event as CustomEvent<ProfessorCourseResponse>).detail;
      if (!createdCourse?.course_code) {
        return;
      }

      setError("");
      setData(null);
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

    getProfessorQuestions(session.userId, {
      courseCode: selectedCourseCode || undefined,
      sectionCode: selectedSectionCode,
      status: "all",
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
          err instanceof Error ? err.message : "Failed to load course dashboard";
        setError(message);
      });
  }, [
    isHydrated,
    pathname,
    router,
    selectedCourseCode,
    selectedSectionCode,
    session?.role,
    session?.userId,
    refreshToken,
  ]);

  useEffect(() => {
    if (!session?.userId || session.role !== "professor" || !selectedCourseCode) {
      setJoinCode(null);
      setJoinCodeError("");
      return;
    }

    getProfessorJoinCode(session.userId, selectedCourseCode, selectedSectionCode)
      .then((response) => {
        setJoinCode(response);
        setJoinCodeError("");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load join code";
        setJoinCode(null);
        setJoinCodeError(message);
      });
  }, [selectedCourseCode, selectedSectionCode, session?.role, session?.userId, refreshToken]);

  const sortedBoards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.board_sessions].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [data]);

  const latestBoard = sortedBoards[0] ?? null;
  const activeBoard =
    sortedBoards.find((board) => board.status.trim().toUpperCase() === "ACTIVE") ?? null;
  const reviewBoard = activeBoard ?? latestBoard;
  const boardCardTitle = activeBoard
    ? activeBoard.board_title || activeBoard.board_id || "Active board"
    : "No active board";
  const boardCardSubtitle = !activeBoard && latestBoard
    ? `Latest session: ${latestBoard.board_title || latestBoard.board_id || "Untitled board"}`
    : selectedSectionCode
      ? `Open a new board for ${formatSectionLabel(selectedSectionCode)} when class starts.`
      : "Select a section to open a board for that class.";
  const boardCardPending = reviewBoard?.unanswered_questions ?? 0;
  const boardCardQuestions = reviewBoard?.total_questions ?? 0;
  const boardCardStatus = activeBoard ? activeBoard.status : "closed";

  const filteredQuestions = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.student_questions;
  }, [data]);

  const answeredCount = useMemo(
    () => filteredQuestions.filter((question) => question.status === "ANSWERED").length,
    [filteredQuestions],
  );

  const pendingCount = useMemo(
    () => filteredQuestions.filter((question) => question.status !== "ANSWERED").length,
    [filteredQuestions],
  );

  const totalQuestions = filteredQuestions.length;

  const allStudentSummaries = useMemo(() => {
    if (!data) {
      return [];
    }

    const questionStatsByStudent = new Map<
      string,
      { totalQuestions: number; answeredQuestions: number }
    >();

    data.student_questions.forEach((question) => {
      const existing = questionStatsByStudent.get(question.student_id) ?? {
        totalQuestions: 0,
        answeredQuestions: 0,
      };

      existing.totalQuestions += 1;
      if (question.status === "ANSWERED") {
        existing.answeredQuestions += 1;
      }
      questionStatsByStudent.set(question.student_id, existing);
    });

    const byStudent = new Map<
      string,
      { id: string; name: string; totalQuestions: number; answeredQuestions: number }
    >();

    data.enrolled_students.forEach((student) => {
      const stats = questionStatsByStudent.get(student.student_id);
      byStudent.set(student.student_id, {
        id: student.student_id,
        name: student.student_name,
        totalQuestions: stats?.totalQuestions ?? 0,
        answeredQuestions: stats?.answeredQuestions ?? 0,
      });
    });

    return Array.from(byStudent.values()).sort((a, b) => {
        if (b.totalQuestions !== a.totalQuestions) {
          return b.totalQuestions - a.totalQuestions;
        }
        return a.name.localeCompare(b.name);
      });
  }, [data]);

  const sectionOptions = useMemo<SectionOption[]>(() => {
    if (!data) {
      return [{ id: "ALL", label: "All Sec" }];
    }

    const sections = Array.isArray(data.sections) ? data.sections : [];

    return [
      { id: "ALL", label: "All Sec" },
      ...sections.map((section) => ({
        id: section.section_code.trim().toUpperCase(),
        label: formatSectionLabel(section.section_code),
      })),
    ];
  }, [data]);
  const selectableSections = useMemo(
    () => sectionOptions.filter((section) => section.id !== "ALL"),
    [sectionOptions],
  );

  const studentSummaries = useMemo(() => {
    if (!studentSearch.trim()) {
      return allStudentSummaries;
    }

    const normalizedSearch = studentSearch.trim().toLowerCase();
    return allStudentSummaries.filter((student) =>
      student.name.toLowerCase().includes(normalizedSearch),
    );
  }, [allStudentSummaries, studentSearch]);

  const participationCount = allStudentSummaries.length;
  const participationRate =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const timelineItems = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedSearch = activitySearch.trim().toLowerCase();
    const questions: TimelineItem[] = data.student_questions
      .filter((question) => {
        if (filter === "answered") {
          return question.status === "ANSWERED";
        }
        if (filter === "unanswered") {
          return question.status !== "ANSWERED";
        }
        if (filter === "board") {
          return false;
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

    const boards: TimelineItem[] = data.board_sessions
      .filter(() => filter === "all" || filter === "board")
      .filter((board) => {
        if (!normalizedSearch) {
          return true;
        }

        return [board.board_title || board.board_id, board.board_id, board.course_code, board.course_name]
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
  }, [activitySearch, data, filter]);

  const refresh = () => {
    setError("");
    setData(null);
    setRefreshToken((prev) => prev + 1);
  };

  const handleSectionCreated = (section: ProfessorSectionResponse) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("course_code", section.course_code.trim().toUpperCase());
    query.set("sec", section.section_code.trim().toUpperCase());
    setError("");
    setData(null);
    router.replace(`${pathname}?${query.toString()}`);
    setRefreshToken((prev) => prev + 1);
  };

  const handleOpenSectionPicker = () => {
    if (selectableSections.length > 0) {
      setIsSelectSectionModalOpen(true);
      return;
    }
    setIsSectionModalOpen(true);
  };

  const handleCreateBoard = () => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }
    if (!selectedSectionCode) {
      setActionNotice({
        tone: "warning",
        badge: "Section Required",
        title: "Choose a section before opening a board",
        description:
          "Boards are opened per section so students join the right classroom stream. Pick a section first, then try opening the board again.",
        confirmLabel: "Choose Section",
        cancelLabel: selectableSections.length > 0 ? "Not now" : "Create later",
        onConfirm: () => {
          setActionNotice(null);
          handleOpenSectionPicker();
        },
      });
      return;
    }
    setIsCreateBoardModalOpen(true);
  };

  const handleSubmitCreateBoard = async (normalizedTitle: string) => {
    if (!session?.userId || !selectedCourseCode || !selectedSectionCode) {
      return;
    }

    setIsCreatingBoard(true);
    try {
      await createProfessorBoard(
        session.userId,
        selectedCourseCode,
        selectedSectionCode,
        { boardTitle: normalizedTitle },
      );
      setIsCreateBoardModalOpen(false);
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create board failed";
      if (message.toLowerCase().includes("active board")) {
        setIsCreateBoardModalOpen(false);
        setActionNotice({
          tone: "warning",
          badge: "Board Already Active",
          title: "Replace the current active board?",
          description:
            "There is already an active board in this section. If you continue, AskAdemy will close the current one and open a new board for this class session.",
          confirmLabel: "Replace Board",
          cancelLabel: "Keep Current Board",
          onConfirm: async () => {
            setActionNotice(null);
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
            } catch (forceErr) {
              setActionNotice({
                tone: "danger",
                badge: "Create Board Failed",
                title: "We could not open the new board",
                description:
                  forceErr instanceof Error ? forceErr.message : "Create board failed",
                confirmLabel: "Close",
                hideCancel: true,
              });
            }
          },
        });
      } else {
        setActionNotice({
          tone: "danger",
          badge: "Create Board Failed",
          title: "We could not open this board",
          description: message,
          confirmLabel: "Close",
          hideCancel: true,
        });
      }
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleCloseBoard = async (boardId: string) => {
    if (!session?.userId) {
      return;
    }

    setIsClosingBoard(true);
    setCloseBoardError("");
    try {
      await closeProfessorBoard(session.userId, boardId);
      setBoardToClose(null);
      refresh();
    } catch (err) {
      setCloseBoardError(
        err instanceof Error ? err.message : "Close board failed",
      );
    } finally {
      setIsClosingBoard(false);
    }
  };

  const handleRequestCloseBoard = (board: ProfessorBoardSession) => {
    setBoardToClose(board);
    setCloseBoardError("");
  };

  const handleDismissCloseBoard = () => {
    if (isClosingBoard) {
      return;
    }
    setBoardToClose(null);
    setCloseBoardError("");
  };

  const handleGenerateJoinCode = async () => {
    if (!session?.userId || !selectedCourseCode) {
      return;
    }

    setIsJoinCodeLoading(true);
    setJoinCodeError("");
    try {
      const generated = await createProfessorJoinCode(session.userId, selectedCourseCode, {
        section_code: selectedSectionCode,
      });
      setJoinCode(generated);
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      setJoinCodeError(
        err instanceof Error ? err.message : "Generate join code failed",
      );
    } finally {
      setIsJoinCodeLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!session?.userId) {
      return;
    }

    setActionNotice({
      tone: "danger",
      badge: "Delete Question",
      title: "Delete this question permanently?",
      description:
        "This action removes the question from the course activity timeline. Existing replies and the classroom context for this thread may also be lost.",
      confirmLabel: "Delete Question",
      cancelLabel: "Keep Question",
      onConfirm: async () => {
        setActionNotice(null);
        try {
          await deleteProfessorQuestion(session.userId, questionId);
          refresh();
        } catch (err) {
          setActionNotice({
            tone: "danger",
            badge: "Delete Failed",
            title: "We could not delete this question",
            description: err instanceof Error ? err.message : "Delete failed",
            confirmLabel: "Close",
            hideCancel: true,
          });
        }
      },
    });
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
      setActionNotice({
        tone: "danger",
        badge: "Update Failed",
        title: "We could not update the question status",
        description:
          err instanceof Error ? err.message : "Update status failed",
        confirmLabel: "Close",
        hideCancel: true,
      });
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
      setActionNotice({
        tone: "danger",
        badge: "Reply Failed",
        title: "We could not post your reply",
        description: err instanceof Error ? err.message : "Reply failed",
        confirmLabel: "Close",
        hideCancel: true,
      });
    }
  };

  const courseLabel = data?.course.title || selectedCourseCode || "My Courses";
  const professorLabel =
    session?.fullName || session?.nickname || data?.professor.full_name || data?.professor.name;
  const isSwitchingCourse =
    !!selectedCourseCode &&
    !!data &&
    data.selected_course_code.trim().toUpperCase() !== selectedCourseCode;
  const isLoading = (!data && !error) || isSwitchingCourse;

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
        professorName={professorLabel}
        courseTitle={courseLabel}
        codeId={data?.course.code}
        onJoinCourse={() => setIsSectionModalOpen(true)}
        buttonLabel="+ Create Sec"
        mode="course"
      />

      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CreateSection
        isOpen={isSectionModalOpen}
        courseCode={selectedCourseCode}
        onClose={() => setIsSectionModalOpen(false)}
        onSectionCreated={handleSectionCreated}
      />
      <SelectSectionModal
        isOpen={isSelectSectionModalOpen}
        courseCode={selectedCourseCode}
        sections={selectableSections}
        onClose={() => setIsSelectSectionModalOpen(false)}
        onSelect={(sectionId) => {
          setIsSelectSectionModalOpen(false);
          router.replace(
            `${pathname}?${buildCourseQuery(data?.selected_course_code || selectedCourseCode, sectionId)}`,
          );
        }}
      />
      <CreateBoardModal
        key={`${selectedCourseCode}-${selectedSectionCode || "all"}-${isCreateBoardModalOpen ? "open" : "closed"}`}
        isOpen={isCreateBoardModalOpen}
        courseCode={selectedCourseCode}
        sectionCode={selectedSectionCode}
        isSubmitting={isCreatingBoard}
        onClose={() => {
          if (isCreatingBoard) {
            return;
          }
          setIsCreateBoardModalOpen(false);
        }}
        onSubmit={handleSubmitCreateBoard}
      />
      <GenerateJoinCode
        isOpen={isJoinCodeModalOpen}
        courseCode={selectedCourseCode}
        sectionCode={selectedSectionCode}
        joinCode={joinCode}
        isLoading={isJoinCodeLoading}
        error={joinCodeError}
        onClose={() => setIsJoinCodeModalOpen(false)}
        onGenerate={handleGenerateJoinCode}
      />
      <ConfirmCloseBoardModal
        isOpen={!!boardToClose}
        boardTitle={
          boardToClose?.board_title || boardToClose?.board_id || "Active Board"
        }
        courseCode={data?.course.code || selectedCourseCode}
        sectionCode={boardToClose?.section_code || selectedSectionCode}
        questionCount={boardToClose?.total_questions ?? totalQuestions}
        pendingCount={boardToClose?.unanswered_questions ?? pendingCount}
        isSubmitting={isClosingBoard}
        error={closeBoardError}
        onClose={handleDismissCloseBoard}
        onConfirm={() => {
          if (!boardToClose) {
            return;
          }
          void handleCloseBoard(boardToClose.board_id);
        }}
      />
      <ActionNoticeModal
        isOpen={!!actionNotice}
        tone={actionNotice?.tone}
        badge={actionNotice?.badge}
        title={actionNotice?.title || "Notice"}
        description={actionNotice?.description || ""}
        confirmLabel={actionNotice?.confirmLabel}
        cancelLabel={actionNotice?.cancelLabel}
        hideCancel={actionNotice?.hideCancel}
        onClose={() => setActionNotice(null)}
        onConfirm={actionNotice?.onConfirm}
      />

      <main className="pb-16 pt-44 xl:pt-32">
        <div className="mx-auto w-full max-w-[1360px] px-6 xl:px-8 2xl:px-10">
        <section className="mb-8 flex flex-wrap items-center gap-3">
          {sectionOptions.map((section) => {
            const isActive = selectedSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  const query = new URLSearchParams(searchParams.toString());
                  query.set("course_code", selectedCourseCode);
                  if (section.id === "ALL") {
                    query.delete("sec");
                  } else {
                    query.set("sec", section.id);
                  }
                  router.replace(`${pathname}?${query.toString()}`);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-transparent bg-gradient-to-r from-[#F063AC] to-[#895EE7] text-white shadow-md shadow-violet-100"
                    : "border-[#E6DFFD] bg-white text-[#6C6297] hover:border-[#CBBEFF]"
                }`}
              >
                <span
                  className={`max-w-[260px] truncate ${isActive ? "text-white/90" : "text-[#A093C6]"}`}
                >
                  {section.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsSectionModalOpen(true)}
            disabled={!selectedCourseCode}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#D8CFFE] bg-[#FFFBFF] px-4 py-2 text-sm font-semibold text-[#6C56EC] transition hover:bg-white"
          >
            <Plus size={16} />
            Create Sec
          </button>
          <button
            type="button"
            onClick={() => setIsJoinCodeModalOpen(true)}
            disabled={!selectedCourseCode}
            className="inline-flex items-center gap-2 rounded-full border border-[#E6DFFD] bg-white px-4 py-2 text-sm font-semibold text-[#6C56EC] transition hover:border-[#CBBEFF] hover:bg-[#FBF9FF]"
          >
            <Eye size={16} />
            {selectedSectionCode ? "Generate Sec Code" : "Generate Course Code"}
          </button>
        </section>

        {isLoading ? (
          <div className="rounded-[28px] border border-white/70 bg-white/80 px-8 py-16 text-center text-lg font-medium text-[#8578B4] shadow-sm">
            Loading course data...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-5 text-sm font-medium text-rose-600">
            {error}
          </div>
        ) : !data || data.courses.length === 0 ? (
          <div className="rounded-[28px] border border-white/70 bg-white px-8 py-16 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-[#1B1B1B]">No courses yet</h2>
            <p className="mt-2 text-sm text-[#8D84B6]">
              Create your first course and it will appear here immediately.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5B41FF] to-[#D94FA2] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100"
            >
              <Plus size={16} />
              Create Course
            </button>
          </div>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] 2xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
              <div className="space-y-6">
                <div className="rounded-[32px] bg-white p-7 xl:p-8 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D3559D]">
                        Current Course
                      </p>
                      <h2 className="mt-3 text-3xl font-bold text-[#1B1B1B] xl:text-4xl">
                        {data.course.code}
                      </h2>
                      <p className="mt-2 max-w-[420px] text-base font-medium leading-8 text-[#776C9E] xl:text-lg">
                        {data.course.title}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-medium text-[#8C82B4]">
                        <span className="rounded-full bg-[#F5F1FF] px-3 py-1">
                          {participationCount} active students
                        </span>
                        <span className="rounded-full bg-[#FFF1F8] px-3 py-1">
                          {sortedBoards.length} board sessions
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsJoinCodeModalOpen(true)}
                          className="rounded-full border border-[#E6DFFD] bg-white px-3 py-1 text-[#6C56EC] transition hover:bg-[#FBF9FF]"
                        >
                          {joinCode?.code
                            ? `Join Code: ${joinCode.code}`
                            : selectedSectionCode
                              ? "Generate Sec Join Code"
                              : "Generate Course Join Code"}
                        </button>
                      </div>
                    </div>

                    <div className="w-full max-w-[360px] rounded-[28px] bg-[#FBF9FF] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9C91C8]">
                            Latest Board
                          </p>
                          <p className="mt-2 text-lg font-bold text-[#2A2340]">
                            {boardCardTitle}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#8C82B4]">
                            {boardCardSubtitle}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${boardStatusPillClasses(
                            boardCardStatus,
                          )}`}
                        >
                          {boardCardStatus}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#EEF0FF] px-4 py-3">
                          <p className="text-2xl font-bold text-[#5B41FF]">
                            {boardCardPending}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7E73B6]">
                            Pending
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#FFF3E8] px-4 py-3">
                          <p className="text-2xl font-bold text-[#D46B16]">
                            {boardCardQuestions}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#AA8A63]">
                            Questions
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {activeBoard ? (
                          <Link
                            href={`/professor/courses/boardreview?course_code=${encodeURIComponent(
                              data.selected_course_code,
                            )}&board_id=${encodeURIComponent(activeBoard.board_id)}${
                              activeBoard.section_code
                                ? `&sec=${encodeURIComponent(activeBoard.section_code)}`
                                : ""
                            }`}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-[#5B41FF] to-[#D94FA2] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-violet-100"
                          >
                            Review Session
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCreateBoard}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-[#5B41FF] to-[#D94FA2] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-100"
                          >
                            Open Board
                          </button>
                        )}
                        {!activeBoard && reviewBoard ? (
                          <Link
                            href={`/professor/courses/boardreview?course_code=${encodeURIComponent(
                              data.selected_course_code,
                            )}&board_id=${encodeURIComponent(reviewBoard.board_id)}${
                              reviewBoard.section_code
                                ? `&sec=${encodeURIComponent(reviewBoard.section_code)}`
                                : ""
                            }`}
                            className="inline-flex items-center justify-center rounded-2xl border border-[#E1DAFA] px-4 py-3 text-sm font-semibold text-[#6B5AD8] transition hover:bg-[#FBF9FF]"
                          >
                            Review Session
                          </Link>
                        ) : null}
                        {activeBoard ? (
                          <button
                            type="button"
                            onClick={() => handleRequestCloseBoard(activeBoard)}
                            className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Close Board
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Answered",
                      value: answeredCount,
                      icon: <CheckCircle2 size={24} className="text-emerald-500" />,
                      tone: "bg-white",
                    },
                    {
                      label: "Pending",
                      value: pendingCount,
                      icon: <Clock3 size={24} className="text-pink-500" />,
                      tone: "bg-white",
                    },
                    {
                      label: "Total Questions",
                      value: totalQuestions,
                      icon: <MessageSquare size={24} className="text-violet-500" />,
                      tone: "bg-white",
                    },
                    {
                      label: "Participation",
                      value: `${participationRate}%`,
                      icon: <Users size={24} className="text-indigo-500" />,
                      tone: "bg-white",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-[28px] ${stat.tone} p-5 xl:p-6 shadow-[0_16px_36px_rgba(104,74,191,0.06)]`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B91C7]">
                            {stat.label}
                          </p>
                          <p className="mt-3 text-3xl font-bold text-[#2A2340] xl:text-4xl">
                            {stat.value}
                          </p>
                        </div>
                        {stat.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[32px] bg-white p-5 xl:p-6 shadow-[0_18px_40px_rgba(104,74,191,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#5B41FF]">รายชื่อนักเรียน</p>
                    <p className="mt-1 text-xs text-[#9B91C7]">
                      {selectedSection === "ALL"
                        ? `Students active in ${data.course.code}`
                        : `Students in ${formatSectionLabel(selectedSection)}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F5F1FF] px-3 py-1 text-xs font-semibold text-[#6C56EC]">
                    {studentSummaries.length} students
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-full bg-[#F6F5FB] px-5 py-4">
                  <Search size={18} className="text-[#A59ACB]" />
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search students..."
                    className="w-full bg-transparent text-base text-[#40375C] outline-none placeholder:text-[#B4ABD5]"
                  />
                </div>

                <div className="mt-6 space-y-3">
                  {studentSummaries.length === 0 ? (
                    <div className="rounded-3xl bg-[#FBFAFF] px-5 py-10 text-center text-sm text-[#9B91C7]">
                      No students enrolled in this class yet.
                    </div>
                  ) : (
                    studentSummaries.map((student) => (
                      <Link
                        key={student.id}
                        href={`/professor/courses/${encodeURIComponent(
                          student.id,
                        )}?${buildCourseQuery(data.selected_course_code, selectedSectionCode)}`}
                        className="flex items-center justify-between gap-4 rounded-[24px] border border-transparent bg-[#FBFAFF] px-4 py-4 transition hover:border-[#E5DEFF] hover:bg-white"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${avatarClasses(
                              student.id,
                            )}`}
                          >
                            {initials(student.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#2A2340]">
                              {student.name}
                            </p>
                            <p className="mt-1 text-xs text-[#9B91C7]">
                              {student.answeredQuestions}/{student.totalQuestions} answered
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#5B41FF]">
                            {student.totalQuestions}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.14em] text-[#A69CCC]">
                            Questions
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </aside>
            </section>

            <section className="mt-12">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-[#1B1B1B] xl:text-4xl">
                    Activity Timeline
                  </h2>
                  <p className="mt-2 text-sm text-[#8D84B6]">
                    Everything happening in {data.course.code}, in one place.
                  </p>
                </div>

                <div className="flex w-full max-w-2xl items-center gap-3 rounded-full bg-white px-6 py-4 shadow-sm">
                  <Search size={20} className="text-[#A59ACB]" />
                  <input
                    value={activitySearch}
                    onChange={(event) => setActivitySearch(event.target.value)}
                    placeholder="Search questions or board sessions..."
                    className="w-full bg-transparent text-base text-[#40375C] outline-none placeholder:text-[#B4ABD5]"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {(["all", "answered", "unanswered", "board"] as const).map((value) => {
                  const active = filter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] text-white shadow-md shadow-violet-100"
                          : "border border-[#E4DDFB] bg-white text-[#9388BB] hover:border-[#CFC2F7]"
                      }`}
                    >
                      {value === "all"
                        ? "All"
                        : value === "answered"
                          ? "Answered"
                          : value === "unanswered"
                            ? "Unanswered"
                            : "Board"}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-5">
                {timelineItems.length === 0 ? (
                  <div className="rounded-[32px] bg-white px-6 py-14 text-center text-sm font-medium text-[#9B91C7] shadow-sm">
                    No activity found for this course yet.
                  </div>
                ) : (
                  timelineItems.map((item) => {
                    if (item.type === "board") {
                      const board = item.board;
                      return (
                        <article
                          key={board.board_id}
                          className="rounded-[32px] bg-white p-6 shadow-[0_16px_36px_rgba(104,74,191,0.06)]"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex gap-4">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                                <Eye size={24} />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7B68E5]">
                                    {board.course_code}
                                  </span>
                                  {board.section_code ? (
                                    <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#D97706]">
                                      {formatSectionLabel(board.section_code)}
                                    </span>
                                  ) : null}
                                  <span className="text-sm font-semibold text-[#2A2340]">
                                    {board.board_title || board.board_id}
                                  </span>
                                  <span className="text-xs text-[#A39ACB]">
                                    {formatRelativeTime(board.created_at)}
                                  </span>
                                </div>
                                <h3 className="mt-3 text-2xl font-bold text-[#473A7A]">
                                  {board.board_title || `${board.course_code} Course Board`}
                                </h3>
                                <p className="mt-2 text-sm text-[#8D84B6]">
                                  {board.total_questions} questions in this session,{" "}
                                  {board.answered_questions} answered so far.
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
                                  board.section_code
                                    ? `&sec=${encodeURIComponent(board.section_code)}`
                                    : ""
                                }`}
                                className="rounded-full bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] px-5 py-2.5 text-sm font-semibold text-white"
                              >
                                Review Session
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    const question = item.question;
                    const isAnswered = question.status === "ANSWERED";
                    const repliesOpen =
                      openReplies[question.id] ?? question.replies.length > 0;

                    return (
                      <article
                        key={question.id}
                        className={`rounded-[32px] border p-6 shadow-[0_16px_36px_rgba(104,74,191,0.06)] ${
                          isAnswered
                            ? "border-emerald-100 bg-[#F3FFF9]"
                            : "border-white bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div
                              className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold ${avatarClasses(
                                question.student_id,
                              )}`}
                            >
                              {initials(question.student_name)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#7B68E5]">
                                  {question.course_code}
                                </span>
                                {question.section_code ? (
                                  <span className="rounded-full bg-[#FFF3E8] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#D97706]">
                                    {formatSectionLabel(question.section_code)}
                                  </span>
                                ) : null}
                                <span className="text-base font-bold text-[#2A2340]">
                                  {question.student_name}
                                </span>
                                <span className="text-xs text-[#A39ACB]">
                                  {formatRelativeTime(question.created_at)}
                                </span>
                              </div>
                              <h3 className="mt-3 text-2xl font-bold text-[#1E1934]">
                                {question.title}
                              </h3>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5F557F]">
                                {question.content}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenReplies((prev) => ({
                                    ...prev,
                                    [question.id]: !(prev[question.id] ?? question.replies.length > 0),
                                  }))
                                }
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8B7FC0] transition hover:text-[#5B41FF]"
                              >
                                <CornerDownLeft size={16} />
                                {question.replies.length} replies
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusPillClasses(
                                question.status,
                              )}`}
                            >
                              {question.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleAnswered(question.id, isAnswered)}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                isAnswered
                                  ? "bg-orange-50 text-orange-500 hover:bg-orange-100"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              }`}
                            >
                              {isAnswered ? "Unmark" : "Mark Answered"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(question.id)}
                              className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {repliesOpen ? (
                          <div className="mt-5 space-y-3 border-t border-white/80 pt-5">
                            {question.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={`rounded-[24px] px-4 py-4 ${
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
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-5 rounded-[28px] bg-[#FAF9FF] p-4">
                          <textarea
                            rows={3}
                            value={replyDrafts[question.id] ?? ""}
                            onChange={(event) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }))
                            }
                            placeholder="Reply as instructor..."
                            className="w-full resize-none bg-transparent text-sm leading-6 text-[#463C69] outline-none placeholder:text-[#B0A6D7]"
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReply(question.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] px-5 py-2.5 text-sm font-semibold text-white"
                            >
                              Post Reply
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
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
