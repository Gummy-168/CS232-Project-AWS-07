"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, } from "lucide-react";
import JoinCourse from "../../../components/joincourse";
import Header from "../../../components/Header";

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
    subject: "CS242",
    status: "UNANSWERED",
    type: "question",
    replies: 0,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
  {
    id: 2,
    user: "สมปอง กุ๊กกิ๊ก",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    subject: "CS232",
    status: "UNANSWERED",
    type: "question",
    replies: 3,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
  {
    id: 3,
    user: "สมปอง กุ๊กกิ๊ก",
    time: "2h ago",
    content: "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้",
    subject: "CS232",
    status: "ANSWERED",
    type: "question",
    professorReply: "ลองตรวจ step 4 อีกครั้งค่ะ",
    replies: 9,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
];



/* ---------------- MAIN COMPONENT ---------------- */

export default function Myquestions() {
  const [data, setData] = useState(null);
  const [activities] = useState(INITIAL_ACTIVITIES);
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const subjects = useMemo(() => {
      const allSubjectsFromData = INITIAL_ACTIVITIES.map(item => item.subject);
      return ["All Subjects", ...new Set(allSubjectsFromData)];
    }, []);
  
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
      const matchesSubject = selectedSubject === "All Subjects" || item.subject === selectedSubject;

      // 2. ตรวจสอบ Search Query (ค้นหาจากชื่อผู้ใช้ หรือ เนื้อหา)
      const searchLower = activitySearch.toLowerCase().trim();
      const matchesSearch =
        item.user.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        (item.subContent &&
          item.subContent.toLowerCase().includes(searchLower));

      return matchesFilter && matchesSearch && matchesSubject;
    });
  }, [activities, filter, activitySearch, selectedSubject]);

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
        mode="dashboard"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <main className="p-8 pt-[100px] space-y-6 left-30 h-full">
        

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
          
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <span className="text-sm text-slate-500 mr-2">Subject:</span>
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-4 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      selectedSubject === subject
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
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
          <div className="mb-2">
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">
          {data.subject || "No Subject"}
        </span>
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
