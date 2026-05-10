"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import JoinCourse from "./joincourse";
import { getStudentCourses, type StudentCourse } from "../lib/api";
import { clearStoredSession } from "../lib/auth";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  LayoutDashboard,
  BookOpen,
  Rss,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  PlusCircle,
  User,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const [isFeedOpen, setIsFeedOpen] = useState(pathname.includes("/feed"));
  const [isCourseOpen, setIsCourseOpen] = useState(pathname.includes("/courses"));
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const selectedCourseCode =
    searchParams.get("course_code")?.trim().toUpperCase() || "";
  const selectedSectionCode = searchParams.get("sec")?.trim().toUpperCase() || "";

  const buildStudentCourseQuery = (courseCode: string, sectionCode?: string | null) => {
    const query = new URLSearchParams();
    query.set("course_code", courseCode.trim().toUpperCase());
    if (sectionCode?.trim()) {
      query.set("sec", sectionCode.trim().toUpperCase());
    }
    return query.toString();
  };

  useEffect(() => {
    if (!session?.userId) {
      return;
    }
    getStudentCourses(session.userId)
      .then((response) => {
        setCourses(response.courses);
      })
      .catch(() => {
        setCourses([]);
      });
  }, [session?.userId]);

  const handleLogout = () => {
    clearStoredSession();
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    router.replace("/login");
  };

  // Active
  const activeStyle =
    "bg-gradient-to-r from-[#F063AC] to-[#895EE7] text-white shadow-lg shadow-purple-100 ";
  // Inactive
  const inactiveStyle =
    "text-[#1B1B1B] hover:bg-gradient-to-r from-[#F9D4E5] to-[#E1D3F3] ";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white p-6 rounded-r-[40px] flex flex-col justify-between shadow-sm border-r border-slate-50 z-40">
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

        <nav className="space-y-2">
          {/* Dashboard */}
          <Link
            href="/student/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === "/student/dashboard" ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {/* My Courses (Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => setIsCourseOpen(!isCourseOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all  ${pathname.includes("/courses") ? activeStyle : inactiveStyle}`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} />
                My Courses
              </div>
              <ChevronRight
                size={18}
                className={`transition-transform ${isCourseOpen ? "rotate-90" : ""}`}
              />
            </div>

            {isCourseOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {courses.length === 0 ? (
                  <Link
                    href="/student/courses"
                    className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                      pathname === "/student/courses" ||
                      pathname.startsWith("/student/courses/")
                        ? "text-[#7B61FF] bg-[#FAF8FF]"
                        : "text-slate-400 hover:text-[#7B61FF]"
                    }`}
                  >
                    {(pathname === "/student/courses" ||
                      pathname.startsWith("/student/courses/")) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3 pl-4">No Courses</div>
                  </Link>
                ) : (
                  courses.map((course) => (
                    <Link
                      key={`${course.course_code}-${course.section_code || "no-section"}`}
                      href={`/student/courses?${buildStudentCourseQuery(
                        course.course_code,
                        course.section_code,
                      )}`}
                      className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                        (pathname === "/student/courses" ||
                          pathname.startsWith("/student/courses/")) &&
                        selectedCourseCode === course.course_code &&
                        (selectedSectionCode || "") ===
                          (course.section_code?.trim().toUpperCase() || "")
                          ? "text-[#7B61FF] bg-[#FAF8FF]"
                          : "text-slate-400 hover:text-[#7B61FF]"
                      }`}
                    >
                      {(pathname === "/student/courses" ||
                        pathname.startsWith("/student/courses/")) &&
                        selectedCourseCode === course.course_code &&
                        (selectedSectionCode || "") ===
                          (course.section_code?.trim().toUpperCase() || "") && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                      )}
                      <div className="flex items-center gap-3 pl-4">
                        {course.course_code}
                        {course.section_code ? ` · SEC ${course.section_code}` : ""}
                      </div>
                    </Link>
                  ))
                )}

                <button
                  onClick={() => setIsJoinOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full w-full text-[#A1A1AA] bg-slate-100 hover:bg-slate-200 transition text-sm font-regular"
                >
                  <PlusCircle size={16} />
                  Join Course
                </button>

                <JoinCourse
                  isOpen={isJoinOpen}
                  onClose={() => setIsJoinOpen(false)}
                  onJoined={() => {
                    if (!session?.userId) {
                      return;
                    }
                    getStudentCourses(session.userId)
                      .then((response) => {
                        setCourses(response.courses);
                      })
                      .catch(() => {
                        setCourses([]);
                      });
                  }}
                />
              </div>
            )}
          </div>

          {/* Feed */}
          <div className="space-y-1">
            <div
              onClick={() => setIsFeedOpen(!isFeedOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${pathname.includes("/feed") ? activeStyle : inactiveStyle}`}
            >
              <div className="flex items-center gap-3">
                <Rss size={20} />
                Feed
              </div>
              <ChevronRight
                size={18}
                className={`transition-transform ${isFeedOpen ? "rotate-90" : ""}`}
              />
            </div>

            {isFeedOpen && (
              <div className="ml-4 mt-2 space-y-1">
                <Link
                  href="/student/feed/allquestions"
                  className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                    pathname === "/student/feed/allquestions"
                      ? "text-[#7B61FF] bg-[#FAF8FF]"
                      : "text-slate-400 hover:text-[#7B61FF]"
                  }`}
                >
                  {pathname === "/student/feed/allquestions" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                  )}
                  <BarChart2 size={16} className="ml-4 shrink-0" />
                  <span>All Questions</span>
                </Link>

                <Link
                  href="/student/feed/myquestions"
                  className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                    pathname === "/student/feed/myquestions"
                      ? "text-[#7B61FF] bg-[#FAF8FF]"
                      : "text-slate-400 hover:text-[#7B61FF]"
                  }`}
                >
                  {pathname === "/student/feed/myquestions" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                  )}
                  <User size={16} className="ml-4 shrink-0" />
                  <span>My Questions</span>
                </Link>
              </div>
            )}
          </div>

          {/* Analytics */}

          <Link
            href="/student/analytics"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === "/student/analytics" ? activeStyle : inactiveStyle}`}
          >
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>

          {/* Settings */}
          <Link
            href="/student/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === "/student/settings" ? activeStyle : inactiveStyle}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-600 font-semibold transition-colors w-full"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
