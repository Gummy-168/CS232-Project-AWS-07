"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  GraduationCap,
  ChevronRight,
  PlusCircle,
  Settings,
  LogOut,
} from "lucide-react";
import CreateCourse from "../components/createcourse"; // ✅ import modal

export default function ProfessorSidebar() {
  const pathname = usePathname();
  const [isCourseOpen, setIsCourseOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ เพิ่ม

  const activeStyle = "bg-gradient-to-r from-[#F063AC] to-[#895EE7] text-white shadow-lg shadow-purple-100";
  const inactiveStyle = "text-[#1B1B1B] hover:bg-slate-50";

  return (
    <>
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /> 

      <aside className="fixed left-0 top-0 h-screen w-64 bg-white p-6 rounded-r-[40px] flex flex-col justify-between shadow-sm border-r border-slate-50 z-40">

        {/* Top Section */}
        <div>
          <div className="flex flex-col items-center mb-10 mt-0">
            <Image src="/logo/logo.png" alt="logo" width={140} height={100} priority />
            <p className="text-[10px] text-gray-400 mt-0 tracking-[0.2em] font-regular">
              PLAYFUL ACADEMIC
            </p>
          </div>

          <nav className="space-y-2.5">

            <Link
              href="/professor/questions"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${pathname === "/professor/questions" ? activeStyle : inactiveStyle}`}
            >
              <FileText size={20} />
              <span className="text-base">Questions</span>
            </Link>

            <div className="space-y-2">
              <div
                onClick={() => setIsCourseOpen(!isCourseOpen)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${pathname.includes("/professor/courses") ? activeStyle : inactiveStyle}`}
              >
                <div className="flex items-center gap-3.5 ">
                  <GraduationCap size={20} />
                  <span className="text-base">Courses</span>
                </div>
                <ChevronRight
                  size={18}
                  className={`transition-transform ${isCourseOpen ? "rotate-90" : ""}`}
                />
              </div>

              {isCourseOpen && (
                <div className="ml-4 mt-2 space-y-2">
                  <Link
                    href="/professor/courses"
                    className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                      pathname === "/professor/courses"
                        ? "text-[#7B61FF] bg-[#FAF8FF]"
                        : "text-slate-400 hover:text-[#7B61FF]"
                    }`}
                  >
                    {pathname === "/professor/courses" && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                    )}
                    <div className="pl-4">CS232 - Cloud</div>
                  </Link>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full w-full text-[#A1A1AA] bg-slate-100 hover:bg-slate-200 transition text-sm font-regular"
                  >
                    <PlusCircle size={16} />
                    Create Course
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/professor/settings"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${pathname === "/professor/settings" ? activeStyle : inactiveStyle}`}
            >
              <Settings size={20} />
              <span className="text-base">Settings</span>
            </Link>

          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-slate-100 mb-2">
          <button className="flex items-center gap-3.5 px-4 py-3 text-[#FF7EB3] hover:text-rose-600 font-extrabold transition-colors w-full group rounded-2xl">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-base">Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}
