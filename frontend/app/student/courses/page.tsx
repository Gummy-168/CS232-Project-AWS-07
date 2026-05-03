"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Contact, Clock,  } from "lucide-react";
import Link from 'next/link';
import JoinCourse from "../../components/joincourse";
import Header from "../../components/Header";

const fetchDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        student: { name: "สมปอง กุ๊กกิ๊ก", id: "670000000" },
        session: {
          title: "CS232: Intro to Cloud Computing",
          time: "13:30 - 16:30",
          instructor: "Aj. Noon",
          timeLeft: "45m left",
        },
      });
    }, 600);
  });
};

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    user: "สมปอง กุ๊กกิ๊ก",
    time: "1 sec ago",
    content: "ไก่กับไข่อะไรเกิดก่อนกัน",
    status: "UNANSWERED",
    type: "question",
    replies: 0,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
  {
    id: 2,
    user: "ทุงทุงทุง",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    replies: 3,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung",
  },
  {
    id: 3,
    user: "CS232 Course Bot",
    time: "1d ago",
    content: "Lab 5 : RDS",
    subContent: "สามารถดูคำถามย้อนหลังได้ที่นี่ ทั้งหมด 5 คำถาม",
    status: "BOARD",
    type: "board",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot",
  },
  {
    id: 4,
    user: "มะพร้าว ส้มโอ",
    time: "2h ago",
    content: "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้",
    status: "ANSWERED",
    type: "question",
    professorReply: "ลองตรวจ step 4 อีกครั้งค่ะ",
    replies: 9,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coconut",
  },
];

/* ---------------- MAIN COMPONENT ---------------- */

export default function StudentClass() {
  const [data, setData] = useState(null);
  const [activities] = useState(INITIAL_ACTIVITIES);
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // 1. ตรวจสอบ Filter ตามสถานะ (All, Answered, Unanswered, Board)
      const status = item.status?.toUpperCase().trim();
      const matchesFilter =
        filter === "All" ||
        (filter === "Board" && status === "BOARD") ||
        (filter === "Answered" && status === "ANSWERED") ||
        (filter === "Unanswered" && status === "UNANSWERED");

      // 2. ตรวจสอบ Search Query (ค้นหาจากชื่อผู้ใช้ หรือ เนื้อหา)
      const searchLower = activitySearch.toLowerCase().trim();
      const matchesSearch =
        item.user.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        (item.subContent &&
          item.subContent.toLowerCase().includes(searchLower));

      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, activitySearch]);

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FCF9F8] min-h-screen font-sans text-slate-700">
      <Header
        studentName={data?.student?.name}
        studentId={data?.student?.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        courseTitle={data?.session?.title}
        mode="course"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <main className="p-8 pt-[100px] space-y-6 left-30 h-full">
        {/* SESSION CARD */}
        <section className="bg-white rounded-[30px] p-5 shadow-lg border border-slate-50 overflow-hidden relative text-left max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-[#D1388D] text-xs font-semibold tracking-wider uppercase">
            <span className="text-[10px]">(( ))</span>
            CURRENTLY IN SESSION
          </div>

          <h2 className="text-2xl mb-5">
            <span className="text-[#1B1B1B]">Board - </span>
            <span className="text-[#513FDF]">
              Join and ask your questions now!
            </span>
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-7">
            <div className="flex items-center gap-4 bg-[#F9F9F9] p-6 rounded-full">
              <Clock size={24} className="text-[#513FDF]" />
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Time Remaining
                </p>
                <p className="text-xl text-slate-800">{data.session.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[#F9F9F9] p-6 rounded-full">
              <Contact size={24} className="text-[#513FDF]" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Instructor</p>
                <p className="text-xl text-slate-800">
                  {data.session.instructor}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link 
                href="/student/courses/board"
                className="inline-block bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] text-white px-10 py-2.5 rounded-full text-lg shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all"
              >
                Join Board
              </Link>
            <p className="text-sm text-slate-500 font-medium">
              <span className="text-slate-700">12</span> students are currently
              asking questions.
            </p>
          </div>
        </section>

        {/* ACTIVITY TIMELINE */}
        <section className="max-w-5xl mx-auto mt-10">
          <h3 className="text-2xl font-regular mb-4 text-[#1B1B1B]">
            ActivityTimeline
          </h3>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              {["All", "Answered", "Unanswered", "Board"].map((btnLabel) => (
                <button
                  key={btnLabel}
                  onClick={() => setFilter(btnLabel)}
                  className={`px-5 py-1.5 rounded-full text-sm font-regular transition-all border ${
                    filter === btnLabel
                      ? "bg-[#5B41FF] text-white border-[#5B41FF]"
                      : "text-slate-400 border-slate-200 hover:bg-slate-200 bg-white"
                  }`}
                >
                  {btnLabel}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs ml-auto">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={15}
              />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search my questions..."
                className="w-full bg-white border border-slate-200 py-2 pl-9 pr-4 rounded-full text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-6 min-h-[60vh] transition-all duration-200">
            {filteredActivities.map((item) => (
              <StudentActivityCard key={item.id} data={item} />
            ))}
          </div>
        </section>
        
      </main>
    </div>
  );
}

/* ---------------- SUB COMPONENT ---------------- */

function StudentActivityCard({ data }: any) {
  const isBoard = data.status?.toUpperCase().trim() === "BOARD";
  const isAnswered = data.status?.toUpperCase().trim() === "ANSWERED";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      <div
        className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-regular ${
          isAnswered
            ? "bg-emerald-50 text-emerald-500 "
            : isBoard
              ? "bg-red-50 text-red-400"
              : "bg-orange-50 text-orange-400 "
        }`}
      >
        {isAnswered ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="5" fill="#34d399" />
            <path
              d="M2.5 5l1.8 1.8L7.5 3.5"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        ) : isBoard ? (
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="5" fill="#fb923c" />
            <path
              d="M5 3v2.5"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="5" cy="7" r="0.6" fill="white" />
          </svg>
        )}
        {data.status}
      </div>

      <div className="flex gap-4">
        <img src={data.avatar} className="w-12 h-12 rounded-full" />

        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold">{data.user}</span>
            <span className="text-xs text-slate-400">{data.time}</span>
          </div>

          {isBoard ? (
            <div className="mt-1">
              <div className="bg-[#F0EEFF] rounded-2xl p-4 mt-2">
                <p className="text-[#513FDF] font-bold text-lg mb-1">
                  {data.content}
                </p>
                {data.subContent && (
                  <p className="text-sm text-slate-500 mb-4">
                    {data.subContent}
                  </p>
                )}
                <button className="flex items-center gap-2 bg-[#513FDF] text-white px-5 py-2 rounded-full text-sm hover:scale-105 active:scale-95 transition-all">
                  <span>👁</span> Review Session
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-700 mb-3">{data.content}</p>

              {data.professorReply && (
                <div className="border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-emerald-400 text-white text-[11px] px-2 py-0.5 rounded font-regular uppercase tracking-wider">
                      Professor Reply
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {data.professorReply}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-[13px]">
                <span className="text-slate-400 flex items-center gap-1">
                  ↩ {data.replies || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
