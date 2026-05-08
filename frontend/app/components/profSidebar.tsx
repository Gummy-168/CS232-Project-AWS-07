"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
} from "lucide-react";
import CreateCourse from "../components/createcourse";
import { clearStoredSession } from "../lib/auth";

export default function ProfessorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCourseOpen, setIsCourseOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    clearStoredSession();
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    router.replace("/");
  };

  const activeStyle =
    "bg-gradient-to-r from-[#F063AC] to-[#895EE7] text-white shadow-lg shadow-purple-100";
  const inactiveStyle = "text-[#1B1B1B] hover:bg-slate-50";

  return (
    <>
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <aside className="fixed left-0 top-0 h-screen w-64 bg-white p-6 rounded-r-[40px] flex flex-col justify-between shadow-sm border-r border-slate-50 z-40">
        <div>
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

          <nav className="space-y-2.5">
            <Link
              href="/professor/questions"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                pathname === "/professor/questions" ? activeStyle : inactiveStyle
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="text-base">Dashboard</span>
            </Link>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsCourseOpen(!isCourseOpen)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all w-full ${
                  pathname.includes("/professor/courses") ? activeStyle : inactiveStyle
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <GraduationCap size={20} />
                  <span className="text-base">My Courses</span>
                </div>
                <ChevronRight
                  size={18}
                  className={`transition-transform ${isCourseOpen ? "rotate-90" : ""}`}
                />
              </button>

              {isCourseOpen && (
                <div className="ml-4 mt-2 space-y-2">
                  <Link
                    href="/professor/courses"
                    className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                      pathname.startsWith("/professor/courses")
                        ? "text-[#7B61FF] bg-[#FAF8FF]"
                        : "text-slate-400 hover:text-[#7B61FF]"
                    }`}
                  >
                    {pathname.startsWith("/professor/courses") && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                    )}
                    <div className="pl-4">CS232 - Cloud</div>
                  </Link>

                  <button
                    type="button"
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
              href="/professor/questions"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${inactiveStyle}`}
            >
              <FileText size={20} />
              <span className="text-base">Feed</span>
            </Link>

            <Link
              href="/professor/questions"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${inactiveStyle}`}
            >
              <BarChart3 size={20} />
              <span className="text-base">Analytics</span>
            </Link>

            <Link
              href="/professor/settings"
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                pathname === "/professor/settings" ? activeStyle : inactiveStyle
              }`}
            >
              <Settings size={20} />
              <span className="text-base">Settings</span>
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100 mb-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 text-[#FF7EB3] hover:text-rose-600 font-extrabold transition-colors w-full group rounded-2xl"
          >
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-base">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
