"use client";
import { Bell } from 'lucide-react';

interface HeaderProps {
  studentName?: string;
  studentId?: string;
  onJoinCourse?: () => void;
}

export default function Header({ studentName, studentId, onJoinCourse }: HeaderProps) {
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
    return (
<header className="fixed top-7 left-64 right-0 flex items-center justify-between px-8 z-10 py-5 bg-[#FCF9F8]">      
      {/* Left: Hello */}
    <div className="space-y-1">
        <h1 className="text-3xl font-regular text-[#1B1B1B]">
            Hello,{" "}
            <span className="text-2xl font-bold">{studentName}</span>
        </h1>
        <p className="text-gray-500 text-100 font-medium">
            Student ID: {studentId || "..."}
        </p>
    </div>

      {/* Right: Join Course + Bell + Avatar */}
      <div className="flex items-center gap-4">
        <button
            onClick={onJoinCourse}
            className="border border-dashed border-[#C4B5FD] px-6 py-2.5 rounded-2xl text-[#513FDF] bg-[#FAF5FF] hover:bg-[#513FDF] hover:text-white transition text-base font-regular"
        >
        + Join Course
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