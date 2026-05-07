"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Contact, Clock } from "lucide-react";
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
    subject: "CS232",
    section: "100001",
    user: "สมปอง กุ๊กกิ๊ก",
    time: "1 sec ago",
    content: "ไก่กับไข่อะไรเกิดก่อนกัน",
    status: "UNANSWERED",
    type: "question",
    replies: [],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
  {
    id: 2,
    subject: "CS232",
    section: "100001",
    user: "สมปอง กุ๊กกิ๊ก",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    replies: [],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
 
];
/* ---------------- MAIN COMPONENT ---------------- */

export default function Allquestions() {
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const toggleReplies = (id: number) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, showReplies: !a.showReplies } : a,
      ),
    );
  };

  const postReply = (id: number, text: string) => {
    if (!text.trim()) return;
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              showReplies: true,
              replies: [
                ...a.replies,
                {
                  user: data.student.name,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.student.id}`,
                  time: "just now",
                  text,
                },
              ],
            }
          : a,
      ),
    );
  };

  const subjects = useMemo(() => {
    const allSubjectsFromData = INITIAL_ACTIVITIES.map((item) => item.subject);
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
      const matchesSubject =
        selectedSubject === "All Subjects" || item.subject === selectedSubject;

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
        mode="myquestions"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <main className="p-8 pt-[200px] space-y-6 h-full overflow-y-auto pb-10">
        {/* ACTIVITY TIMELINE */}
        <section className="max-w-6xl mx-auto mt-10">
          <div className="fixed top-[120px] left-64 right-0 z-10 bg-[#FCF9F8] pt-2 pb-4 px-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
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
          </div>
          <div className="space-y-6 min-h-[60vh] transition-all duration-200">
            {filteredActivities.map((item) => (
              <StudentActivityCard
                key={item.id}
                data={item}
                onToggleReplies={toggleReplies}
                onPostReply={postReply}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
/* ---------------- SUB COMPONENT ---------------- */
function StudentActivityCard({ data, onToggleReplies, onPostReply }: any) {
  const [draft, setDraft] = useState("");
  const isBoard = data.status?.toUpperCase().trim() === "BOARD";
  const isAnswered = data.status?.toUpperCase().trim() === "ANSWERED";

  const handleSend = () => {
    onPostReply(data.id, draft);
    setDraft("");
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      {/* Badge มุมขวาบน — เหมือนเดิม */}
      <div
        className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-regular ${
          isAnswered
            ? "bg-emerald-50 text-emerald-500"
            : isBoard
              ? "bg-red-50 text-red-400"
              : "bg-orange-50 text-orange-400"
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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {(data.subject || data.section) && (
              <span className="text-[11px] font-medium bg-gray-100 text-gray-400 px-2.5 py-1 rounded-lg tracking-wide uppercase">
                {[data.subject, data.section].filter(Boolean).join(" | ")}
              </span>
            )}
            <span className="font-bold text-slate-800">{data.user}</span>
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

              {/* Professor reply string*/}
              {data.professorReply && (
                <div className="border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4] mb-3">
                  <div className="flex items-center mb-2">
                    <span className="bg-emerald-400 text-white text-[11px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Professor Reply
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">
                    {data.professorReply}
                  </p>
                </div>
              )}

              {/* Professor replies*/}
              {data.replies?.some((r: any) => r.isProfessor) && (
                <div className="space-y-2 mb-3">
                  {data.replies
                    .filter((r: any) => r.isProfessor)
                    .map((r: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex-1 border border-emerald-100 rounded-xl p-3 bg-[#F0FDF4]">
                          <span className="bg-emerald-400 text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                            Professor Reply
                          </span>
                          <p className="text-sm text-slate-700 mt-1">
                            {r.text}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Reply button */}
              <div className="flex items-center gap-4 text-[13px]">
                <button
                  onClick={() => onToggleReplies(data.id)}
                  className="text-slate-400 hover:text-[#5B41FF] flex items-center gap-1 transition-colors"
                >
                  ↩{" "}
                  {data.replies?.filter((r: any) => !r.isProfessor).length > 0
                    ? data.replies.filter((r: any) => !r.isProfessor).length
                    : ""}{" "}
                  {data.showReplies ? "ซ่อน replies" : "reply"}
                </button>
              </div>

              {/* Student replies*/}
              {data.showReplies && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {data.replies
                    ?.filter((r: any) => !r.isProfessor)
                    .map((r: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <img
                          src={r.avatar}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                          <span className="text-sm font-semibold text-slate-700">
                            {r.user}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {r.time}
                          </span>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {r.text}
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* Compose box */}
                  <div className="flex gap-3 items-end pt-1">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=me`}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="เขียน reply... (Enter เพื่อส่ง)"
                      rows={1}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#5B41FF] transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="bg-[#5B41FF] disabled:opacity-40 text-white rounded-lg w-9 h-9 flex items-center justify-center hover:opacity-85 transition-opacity flex-shrink-0"
                    >
                      ↑
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
