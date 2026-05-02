"use client";
import { Bell } from "lucide-react";

interface HeaderProps {
  studentName?: string;
  professorName?: string;
  studentId?: string;
  onJoinCourse?: () => void;
  courseTitle?: string;
  mode?: "dashboard" | "course" | "questions";
  buttonLabel?: string;
}

export default function Header({
  studentName,
  professorName,
  studentId,
  onJoinCourse,
  courseTitle,
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

  const resolvedLabel = buttonLabel ?? (mode === "questions" ? "+ Create Course" : "+ Join Course");

  return (
    <header className="fixed top-0 left-64 right-0 flex items-center justify-between px-8 z-10 py-4 bg-[#F9F9F9]">
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
        ) : (
          <>
            <h1 className="text-3xl font-regular text-[#1B1B1B]">
              {courseTitle || "My Course"}
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Student ID: {studentId || "..."}
            </p>
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

        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell size={20} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D1388D] rounded-full" />
        </button>

        <div className="w-9 h-9 rounded-full bg-[#513FDF] flex items-center justify-center text-white font-semibold text-sm cursor-pointer">
          N
        </div>
      </div>
    </header>
  );
}