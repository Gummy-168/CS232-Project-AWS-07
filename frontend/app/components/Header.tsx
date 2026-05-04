"use client";
import { Bell } from "lucide-react";
import { NotificationOverlay } from "@/app/components/NotificationOverlay";
import { NotificationOverlayProf } from "@/app/components/NotificationOverlayProf";
import { useState } from "react";
import { useRef } from "react";
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
    | "questions"
    | "board"
    | "allquestions"
    | "myquestions"
    | "analysis"
    | "settings"
    | "settingsprof";
  buttonLabel?: string;
}

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
  function renderName(name: string) {
    return name.split(/([\u0E00-\u0E7F]+)/).map((part, i) => {
      const isThai = /[\u0E00-\u0E7F]/.test(part);
      return (
        <span key={i} className={isThai ? "text-2xl" : "text-3xl"}>
          {part}
        </span>
      );
    });
  }

  const resolvedLabel =
    buttonLabel ?? (mode === "questions" ? "+ Create Course" : "+ Join Course");
  const notiRef = useRef<HTMLButtonElement>(null);
  const [showNoti, setShowNoti] = useState(false);

  return (
    <header className="fixed top-0 left-67 right-0 flex items-center justify-between px-8 z-10 py-10 bg-[#F9F9F9]">
      {/* Left */}
      <div className="space-y-1 ">
        {mode === "dashboard" ? (
          <>
            <h1 className="text-3xl font-regular text-[#1B1B1B]">
              Hello,{" "}
              <span className="font-bold">
                {studentName ? renderName(studentName) : "..."}
              </span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Student ID: {studentId || "..."}
            </p>
          </>
        ) : mode === "questions" ? (
          <>
            <h1 className="text-3xl font-regular text-[#1B1B1B]">
              Hello,{" "}
              <span className="font-bold">
                {professorName ? renderName(professorName) : "..."}
              </span>
            </h1>
          </>
        ) : mode === "board" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-4 h-8 bg-[#FD64A4]" />
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {courseTitle || "My Course"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Student ID: {studentId || "..."}
                </p>
              </div>
            </div>
          </>
        ) : mode === "allquestions" ? (
          <>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {"All Questions"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Student ID: {studentId || "..."}
                </p>
              </div>
            </div>
          </>
        ) : mode === "myquestions" ? (
          <>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {"My Questions"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Student ID: {studentId || "..."}
                </p>
              </div>
            </div>
          </>
        ) : mode === "analysis" ? (
          <>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {"Analytics"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Student ID: {studentId || "..."}
                </p>
              </div>
            </div>
          </>
        ) : mode === "settings" ? (
          <>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {"Settings"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Student ID: {studentId || "..."}
                </p>
              </div>
            </div>
          </>
        ) : mode === "settingsprof" ? (
          <>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {"Settings"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  {professorName || "Professor not found"}
                </p>
              </div>
            </div>
          </>
        ) : mode === "course" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-4 h-8 bg-[#FD64A4]" />

              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {courseTitle || "My Course"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  {professorName || "Professor not found"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-4 h-8 bg-[#FD64A4]" />
              <div>
                <h1 className="text-3xl font-regular text-[#1B1B1B]">
                  {courseTitle || "My Course"}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                  Student ID: {studentId || "..."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right */}
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
        {mode === "course" ||
        mode === "settingsprof" ||
        mode === "questions" ? (
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
