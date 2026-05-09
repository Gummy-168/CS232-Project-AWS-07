"use client";
import { Bell } from "lucide-react";
import { NotificationOverlay } from "@/app/components/NotificationOverlay";
import { NotificationOverlayProf } from "@/app/components/NotificationOverlayProf";
import { useState, useRef } from "react";

interface HeaderProps {
  studentName?: string;
  professorName?: string;
  studentId?: string;
  onJoinCourse?: () => void;
  courseTitle?: string;
  codeId?: string;
  mode?:
    | "dashboard"
    | "course"
    | "courses"
    | "questions"
    | "board"
    | "allquestions"
    | "myquestions"
    | "analysis"
    | "settings"
    | "settingsprof";
  buttonLabel?: string;
}

const PROF_MODES = ["course", "settingsprof", "questions"];
const COURSE_MODES = ["course", "board", "courses"];

const MODE_TITLE: Record<string, string> = {
  allquestions: "All Questions",
  myquestions: "My Questions",
  analysis: "Analytics",
  settings: "Settings",
  settingsprof: "Settings",
};

export default function Header({
  studentName,
  professorName,
  studentId,
  onJoinCourse,
  courseTitle,
  mode = "dashboard",
  buttonLabel,
}: HeaderProps) {
  const notiRef = useRef<HTMLButtonElement>(null);
  const [showNoti, setShowNoti] = useState(false);

  const isProf = PROF_MODES.includes(mode);
  const resolvedLabel =
    buttonLabel ?? (isProf ? "+ Create Course" : "+ Join Course");

  function renderName(name: string) {
    return name.split(/([\u0E00-\u0E7F]+)/).map((part, i) => (
      <span
        key={i}
        className={/[\u0E00-\u0E7F]/.test(part) ? "text-2xl" : "text-3xl"}
      >
        {part}
      </span>
    ));
  }

  const subtitle = isProf
    ? professorName || "Professor not found"
    : `Student ID: ${studentId || "..."}`;

  const renderLeft = () => {
    // Dashboard — greeting
    if (mode === "dashboard")
      return (
        <div className="space-y-1">
          <h1 className="text-3xl font-regular text-[#1B1B1B]">
            Hello,{" "}
            <span className="font-bold">
              {studentName ? renderName(studentName) : "..."}
            </span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Student ID: {studentId || "..."}
          </p>
        </div>
      );

    // Questions (prof) — greeting
    if (mode === "questions")
      return (
        <h1 className="text-3xl font-regular text-[#1B1B1B]">
          Hello,{" "}
          <span className="font-bold">
            {professorName ? renderName(professorName) : "..."}
          </span>
        </h1>
      );

    // Course/board modes — pink bar + course title
    const showPinkBar = COURSE_MODES.includes(mode);
    const title = MODE_TITLE[mode] ?? courseTitle ?? "My Course";

    return (
      <div className="flex min-w-0 items-center gap-3">
        {showPinkBar && <div className="h-8 w-4 shrink-0 bg-[#FD64A4]" />}
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-regular text-[#1B1B1B]">{title}</h1>
          <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
        </div>
      </div>
    );
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-10 bg-[#F9F9F9] px-6 py-6 xl:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4 xl:items-center">
        <div className="min-w-0 flex-1 space-y-1">{renderLeft()}</div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          {onJoinCourse ? (
            <button
              onClick={onJoinCourse}
              className="max-w-full rounded-2xl border border-dashed border-[#C4B5FD] bg-[#FAF5FF] px-5 py-2.5 text-sm font-medium text-[#513FDF] transition hover:bg-[#513FDF] hover:text-white"
            >
              {resolvedLabel}
            </button>
          ) : null}

          <button
            ref={notiRef}
            onClick={() => setShowNoti((v) => !v)}
            className="relative rounded-full p-2 transition hover:bg-gray-100"
          >
            <Bell size={20} className="text-gray-500" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D1388D]" />
          </button>

          {isProf ? (
            <NotificationOverlayProf
              isOpen={showNoti}
              onClose={() => setShowNoti(false)}
              anchorRef={notiRef}
            />
          ) : (
            <NotificationOverlay
              isOpen={showNoti}
              onClose={() => setShowNoti(false)}
              anchorRef={notiRef}
            />
          )}

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#513FDF] text-sm font-semibold text-white">
            N
          </div>
        </div>
      </div>
    </header>
  );
}
