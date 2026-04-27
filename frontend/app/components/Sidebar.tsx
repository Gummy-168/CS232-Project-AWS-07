"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Rss, 
  BarChart2, 
  Settings, 
  LogOut, 
  ChevronRight,
  PlusCircle
} from "lucide-react"; 

export default function Sidebar() {
  const pathname = usePathname(); 
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(true);

  // Active
  const activeStyle = "bg-gradient-to-r from-[#F063AC] to-[#895EE7] text-white shadow-lg shadow-purple-100 ";
  // Inactive
  const inactiveStyle = "text-slate-900 hover:bg-gradient-to-r from-[#F9D4E5] to-[#E1D3F3] ";

  return (
<aside className="fixed left-0 top-0 h-screen w-64 bg-white p-6 rounded-r-[40px] flex flex-col justify-between shadow-sm border-r border-slate-50 z-40">      
      <div>
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 mt-0">
          <Image src="/logo/logo.png" alt="logo" width={140} height={100} priority />
          <p className="text-[10px] text-gray-400 mt-0 tracking-[0.2em] font-regular">
            PLAYFUL ACADEMIC
          </p>
        </div>

        <nav className="space-y-2">
          
          {/* Dashboard */}
          <Link 
            href="/student/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/student/dashboard' ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {/* My Courses (Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => setIsCourseOpen(!isCourseOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all  ${pathname.includes('/courses')  ? activeStyle : inactiveStyle}`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} />
                My Courses
              </div>
              <ChevronRight size={18} className={`transition-transform ${isCourseOpen ? "rotate-90" : ""}`} />
            </div>

            {isCourseOpen && (
              <div className="ml-4 mt-2 space-y-1">
                <Link 
                  href="/student/courses"
                  className={`group relative flex items-center gap-3 py-2 pr-4 rounded-full w-full text-sm font-medium transition-all overflow-hidden ${
                    pathname === '/student/courses' 
                      ? 'text-[#7B61FF] bg-[#FAF8FF]' 
                      : 'text-slate-400 hover:text-[#7B61FF]'
                  }`}
                >
                  {pathname === '/student/courses' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D1388D] rounded-r-full" />
                  )}
                  <div className={`flex items-center gap-3 ${pathname === '/student/courses' ? 'pl-4' : 'pl-4'}`}>
                    CS232 - Cloud
                  </div>
                </Link>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl w-full text-slate-400 hover:bg-slate-50 hover:text-emerald-500 transition text-sm font-medium">
                  <PlusCircle size={16} />
                  Join Course
                </button>
              </div>
            )}
          </div>
          

          {/* Feed */}
          <div className="space-y-1">
          <div
            onClick={() => setIsFeedOpen(!isFeedOpen)}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${pathname.includes('/feed') ? activeStyle : inactiveStyle}`}
          >
            <div className="flex items-center gap-3">
              <Rss size={20} />
              Feed
            </div>
            <ChevronRight size={18} className={`transition-transform ${isFeedOpen ? "rotate-90" : ""}`} />
          </div>

          {isFeedOpen && (
            <div className="ml-4 mt-2 space-y-1">
              <Link 
                href="/student/feed"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl w-full text-sm font-medium transition-all ${pathname === '/feed/all' ? 'text-[#7B61FF] bg-purple-50' : 'text-slate-400 hover:text-[#7B61FF]'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${pathname === '/feed/all' ? 'bg-[#7B61FF]' : 'bg-slate-300'}`}></div>
                All Questions
              </Link>
              <Link 
                href="/student/feed"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl w-full text-sm font-medium transition-all ${pathname === '/feed/all' ? 'text-[#7B61FF] bg-purple-50' : 'text-slate-400 hover:text-[#7B61FF]'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${pathname === '/feed/all' ? 'bg-[#7B61FF]' : 'bg-slate-300'}`}></div>
                My Questions
              </Link>
            </div>
          )}
        </div>

          {/* Analytics */}
          <Link 
            href="/student/analytics" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/analytics' ? activeStyle : inactiveStyle}`}
          >
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>

          {/* Settings */}
          <Link 
            href="/student/settings" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${pathname === '/settings' ? activeStyle : inactiveStyle}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>

        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-600 font-semibold transition-colors w-full">
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </aside>
  );
}