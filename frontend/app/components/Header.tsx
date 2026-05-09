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
  codeId,
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
      <div className="flex items-center gap-3">
        {showPinkBar && <div className="w-4 h-8 bg-[#FD64A4]" />}
        <div>
          <h1 className="text-3xl font-regular text-[#1B1B1B]">{title}</h1>
          <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
        </div>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-64 right-0 flex items-center justify-between px-8 z-10 py-10 bg-[#F9F9F9]">
      <div className="space-y-1">{renderLeft()}</div>

      <div className="flex items-center gap-4">
        <button
          onClick={onJoinCourse}
          className="border border-dashed border-[#C4B5FD] px-6 py-2.5 rounded-2xl text-[#513FDF] bg-[#FAF5FF] hover:bg-[#513FDF] hover:text-white transition text-base font-regular"
        >
          {resolvedLabel}
        </button>

        <button
          ref={notiRef}
          onClick={() => setShowNoti((v) => !v)}
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
        >
          <Bell size={20} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D1388D] rounded-full" />
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

        <div className="w-9 h-9 rounded-full bg-[#513FDF] flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
          N
        </div>
      </div>
    </header>
  );
}
