"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <aside className="w-64 min-h-screen bg-white p-6 rounded-r-3xl flex flex-col justify-between">

      {/* Top */}
      <div>
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Image src="/logo/logo.png" alt="logo" width={80} height={80} />
          <p className="text-xs text-gray-400 mt-2 tracking-widest">
            PLAYFUL ACADEMIC
          </p>
        </div>

        {/* Menu */}
        <nav className="space-y-4">

          {/* Dashboard */}
          <Link href="#" className="flex items-center gap-3 text-gray-700">
            <span>📊</span>
            Dashboard
          </Link>

          {/* Dropdown */}
          <div>
            {/* My Courses */}
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center justify-between bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white px-4 py-3 rounded-full shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>🎓</span>
                My Courses
              </div>

              <span
                className={`transition-transform duration-300 ${
                  open ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </div>

            {/* Sub menu */}
            {open && (
              <div className="ml-6 mt-2 space-y-2 text-sm text-gray-400">
                <button className="flex items-center gap-2 px-3 py-2 rounded-full w-full text-[#A1A1AA] hover:bg-[#F6F4F3] hover:text-[#513FDF] transition">
                  CS232 - Cloud
                </button>

                <button className="flex items-center gap-2 bg-[#F6F4F3] px-3 py-2 rounded-full w-full text-[#A1A1AA] hover:bg-gradient-to-r hover:from-[#513FDF] hover:to-[#FD64A4] hover:text-white transition">
                  ➕ Join Course
                </button>
              </div>
            )}
          </div>

          {/* Feed */}
          <Link href="#" className="flex items-center justify-between text-gray-700">
            <div className="flex items-center gap-3">
              <span>📄</span>
              Feed
            </div>
            <span>›</span>
          </Link>

          {/* Analytics */}
          <Link href="#" className="flex items-center gap-3 text-gray-700">
            <span>📊</span>
            Analytics
          </Link>

          {/* Settings */}
          <Link href="#" className="flex items-center gap-3 text-gray-700">
            <span>⚙️</span>
            Settings
          </Link>

        </nav>
      </div>

      {/* Bottom */}
      <div className="pt-6 border-t">
        <button className="flex items-center gap-2 text-pink-500">
          ⎋ Logout
        </button>
      </div>

    </aside>
  );
}