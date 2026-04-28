"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  GraduationCap,
  ChevronDown,
  PlusCircle,
  Settings,
  LogOut,
} from "lucide-react";

export default function ProfessorSidebar() {
  const pathname = usePathname();

  const [isCourseOpen, setIsCourseOpen] = useState(true);

  // Active
  const activeStyle =
    "bg-gradient-to-r from-[#F063AC] to-[#895EE7] text-white shadow-lg shadow-purple-100 ";

  // Inactive
  const inactiveStyle = "text-[#1B1B1B] hover:bg-slate-50";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white p-6 rounded-r-[40px] flex flex-col justify-between shadow-sm border-r border-slate-50 z-40">
      {" "}
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 mt-0">
          <Image
            src="/logo/logo.png"
            alt="logo"
            width={140}
            height={100}
            priority
          />
          <p className="text-[10px] text-gray-400 mt-0 tracking-[0.2em] font-regular">
            PLAYFUL ACADEMIC
          </p>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2.5">
          {/* Questions */}
          <Link
            href="/professor/questions"
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${pathname === "/professor/questions" ? activeStyle : inactiveStyle}`}
          >
            <FileText size={20} />
            <span className="text-base">Questions</span>
          </Link>

          {/* Courses (Dropdown) */}
          <div className="space-y-1.5">
            <div
              onClick={() => setIsCourseOpen(!isCourseOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all  ${pathname.includes("/professor/courses") ? activeStyle : inactiveStyle}`}
            >
              <div className="flex items-center gap-3.5">
                <GraduationCap size={20} />
                <span className="text-base">Courses</span>
              </div>
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ${isCourseOpen ? "rotate-180" : ""}`}
              />
            </div>

            {/* Sub-menu */}
            {isCourseOpen && (
              <div className="ml-5 mt-3 space-y-1.5 overflow-hidden transition-all">
                {/* sub */}
                <Link
                  href="/professor/courses"
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl w-full text-sm font-medium transition-all ${pathname === "/professor/courses" ? "text-[#7B61FF] bg-purple-50" : "text-slate-400 hover:text-[#7B61FF]"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${pathname === "/professor/courses" ? "bg-[#7B61FF]" : "bg-slate-300"}`}
                  ></div>
                  <span className="leading-tight">CS232 - Cloud</span>
                </Link>
              </div>
            )}
          </div>

          {/* Settings */}
          <Link
            href="/professor/settings"
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-[#1B1B1B] ${pathname === "/professor/settings" ? activeStyle : inactiveStyle}`}
          >
            <Settings size={20} />
            <span className="text-base">Settings</span>
          </Link>
        </nav>
      </div>
      {/* Bottom Section */}
      <div className="pt-6 border-t border-slate-100 mb-2">
        <button className="flex items-center gap-3.5 px-4 py-3 text-[#FF7EB3] hover:text-rose-600 font-extrabold transition-colors w-full group rounded-2xl">
          <LogOut
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-base">Logout</span>
        </button>
      </div>
    </aside>
  );
}
