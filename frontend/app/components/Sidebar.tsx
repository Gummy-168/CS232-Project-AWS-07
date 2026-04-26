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
  const [isCourseOpen, setIsCourseOpen] = useState(true);

  // Active
  const activeStyle = "bg-gradient-to-r from-[#7B61FF] to-[#FD64A4] text-white shadow-lg shadow-purple-100";
  // Inactive
  const inactiveStyle = "text-slate-500 hover:bg-slate-50";

  return (
    <aside className="w-64 min-h-screen bg-white p-6 rounded-r-[2rem] flex flex-col justify-between shadow-sm border-r border-slate-50">
      
      <div>
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 mt-4">
          <Image src="/logo/logo.png" alt="logo" width={80} height={80} priority />
          <p className="text-[10px] text-pink-400 mt-2 tracking-[0.2em] font-bold">
            PLAYFUL ACADEMIC
          </p>
        </div>

        <nav className="space-y-2">
          
          {/* Dashboard */}
          <Link 
            href="/student/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${pathname === '/dashboard' ? activeStyle : inactiveStyle}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          {/* My Courses (Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => setIsCourseOpen(!isCourseOpen)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all font-semibold ${pathname.includes('/courses') ? activeStyle : inactiveStyle}`}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl w-full text-sm font-medium transition-all ${pathname === '/student/courses' ? 'text-[#7B61FF] bg-purple-50' : 'text-slate-400 hover:text-[#7B61FF]'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${pathname === '/student/courses' ? 'bg-[#7B61FF]' : 'bg-slate-300'}`}></div>
                  CS232 - Cloud
                </Link>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl w-full text-slate-400 hover:bg-slate-50 hover:text-emerald-500 transition text-sm font-medium">
                  <PlusCircle size={16} />
                  Join Course
                </button>
              </div>
            )}
          </div>

          {/* Feed */}
          <Link 
            href="/feed" 
            className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-semibold ${pathname === '/feed' ? activeStyle : inactiveStyle}`}
          >
            <div className="flex items-center gap-3">
              <Rss size={20} />
              Feed
            </div>
            {pathname !== '/feed' && <ChevronRight size={16} className="text-slate-300" />}
          </Link>

          {/* Analytics */}
          <Link 
            href="/analytics" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${pathname === '/analytics' ? activeStyle : inactiveStyle}`}
          >
            <BarChart2 size={20} />
            <span>Analytics</span>
          </Link>

          {/* Settings */}
          <Link 
            href="/settings" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${pathname === '/settings' ? activeStyle : inactiveStyle}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>

        </nav>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-600 font-bold transition-colors w-full">
          <LogOut size={20} />
          Logout
        </button>
      </div>

    </aside>
  );
}