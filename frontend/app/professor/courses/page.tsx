"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import CreateCourse from "../../components/createcourse";
import Header from "@/app/components/Header";
import {
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from 'next/link';


/*  MOCK API - */

const fetchProfessorData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        professor: { name: "อาจารย์สะปุกนิก", id: "PRF000001" },
        course: { title: "CS232: Intro to Cloud Computing" },
      });
    }, 600);
  });
};

/* MOCK DATA */

const stats = [
  { value: 12, label: "New Questions", bg: "bg-[#EEF0FF]", text: "text-[#5B41FF]" },
  { value: 4, label: "Pending Review", bg: "bg-[#FDE8F6]", text: "text-[#C042A0]" },
  { value: 48, label: "Participation", bg: "bg-[#FFF3E8]", text: "text-[#D46B16]" },
];

const boardStats = [
  { label: "Average Sentiment", value: "84%" },
  { label: "Response Rate", value: "92%" },
  { label: "Active Students", value: "42/48" },
];

const miniStats = [
  { label: "ANSWERED", value: "942", color: "#513FDF", icon: <CheckCircle size={28} color="#10b981" strokeWidth={1.5} /> },
  { label: "PENDING", value: "342", color: "#AE2466", icon: <Clock size={28} color="#f472b6" strokeWidth={1.5} /> },
  { label: "TOTAL QUESTIONS", value: "1,284", color: "#1B1C1B", icon: <MessageSquare size={28} color="#513FDF" strokeWidth={1.5} /> },
  { label: "PARTICIPATING", value: "88%", color: "#1B1C1B", icon: <Users size={28} color="#513FDF" strokeWidth={1.5} /> },
];

const students = [
  { id: 1, name: "สมปอง อยากรวย", questions: 5, online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong2" },
  { id: 2, name: "พาที ณ พารัก", questions: 4, online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Patee" },
  { id: 3, name: "ญาญ่า อยากนอน", questions: 2, online: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yaya" },
  { id: 4, name: "สมหญิง อุอุอะ", questions: 0, online: false, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Somying" },
];

const INITIAL_ACTIVITIES = [
  { id: 1, user: "สมปอง กุ๊กกิ๊ก", time: "1 sec ago", content: "ไก่กับไข่อะไรเกิดก่อนกัน", status: "UNANSWERED", type: "question", replies: 0, professorReplies: [], avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong" },
  { id: 2, user: "ทุงทุงทุง", time: "2m ago", content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ", status: "UNANSWERED", type: "question", replies: 0, professorReplies: [], avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung" },
  { id: 3, user: "CS232 Course Bot", time: "1d ago", content: "Lab 5 : RDS", subContent: "สามารถดูคำถามย้อนหลังได้ที่นี่ ทั้งหมด 5 คำถาม", status: "BOARD", type: "board", replies: 0, professorReplies: [], avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot" },
  { id: 4, user: "มะพร้าว ส้มโอ", time: "2h ago", content: "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้ มีใครสามารถทำได้บ้างไหมครับ", status: "ANSWERED", type: "question", replies: 1, professorReplies: ["ติดปัญหาส่วนไหนคะ ลองดู...ใหม่ค่ะ"], avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coconut" },
];

/* ---------------- MAIN COMPONENT ---------------- */

export default function ProfessorDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [filter, setFilter] = useState("All");
  const [activitySearch, setActivitySearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "online" | "offline">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);

  const handleMarkAnswered = (id: number) => {
    setActivities((prev) => prev.map((item) => item.id === id ? { ...item, status: "ANSWERED" } : item));
  };

  const handleUnmarked = (id: number) => {
    setActivities((prev) => prev.map((item) => item.id === id ? { ...item, status: "UNANSWERED" } : item));
  };

  const handlePostReply = (id: number, text: string) => {
    setActivities((prev) => prev.map((item) => {
      if (item.id === id) {
        return { ...item, status: "ANSWERED", professorReplies: [...(item.professorReplies || []), text], replies: (item.replies || 0) + 1 };
      }
      return item;
    }));
  };

  const handleDeleteReply = (activityId: number, replyIndex: number) => {
    setActivities((prev) => prev.map((item) => {
      if (item.id === activityId) {
        const filteredReplies = item.professorReplies.filter((_: any, i: number) => i !== replyIndex);
        return { ...item, professorReplies: filteredReplies, replies: Math.max(0, (item.replies || 0) - 1), status: filteredReplies.length > 0 ? "ANSWERED" : "UNANSWERED" };
      }
      return item;
    }));
  };

  const handleDelete = (id: number) => {
    setActivities((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchFilter =
        filter === "All" || item.status === filter.toUpperCase();
      const matchSearch =
        activitySearch.trim() === "" ||
        item.content.toLowerCase().includes(activitySearch.toLowerCase()) ||
        item.user.toLowerCase().includes(activitySearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [activities, filter, activitySearch]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
      const matchFilter =
        studentFilter === "all" ||
        (studentFilter === "online" && s.online) ||
        (studentFilter === "offline" && !s.online);
      return matchSearch && matchFilter;
    });
  }, [studentSearch, studentFilter]);

  if (!data) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex-1 p-8 bg-[#FCF9F8] min-h-screen font-sans text-slate-700">
      <Header professorName={data?.professor?.name} onJoinCourse={() => setIsModalOpen(true)} mode="questions" />
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Interaction Board Section */}
      <section className="max-w-5xl mx-auto mt-13 grid grid-cols-2 gap-4">

        {/* Left Column */}
        <div className="flex flex-col gap-3">

          {/* Top white card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-1 text-[#D1388D] text-[11px] font-semibold tracking-widest uppercase">
              <span className="text-[10px]">(( ))</span>
              CURRENTLY IN SESSION
            </div>
            <h2 className="text-2xl font-medium text-[#1B1B1B] mb-0">Interaction Board</h2>
            <p className="text-sm text-slate-400 font-medium mb-5">Lab 5 : RDS</p>

            <div className="flex gap-3 mb-5 flex-wrap">
              {stats.map((item, index) => (
                <div key={index} className={`${item.bg} ${item.text} rounded-2xl px-5 py-3 w-35 font-medium transition-all cursor-default`}>
                  <span className="text-2xl font-semibold block">{item.value}</span>
                  <div className="text-xs opacity-70 mt-0.5 uppercase">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Link href="/professor/courses/board" className="flex-1">
                <button className="w-full flex items-center justify-center gap-3 bg-[#6B57FF] text-white rounded-2xl py-4 text-sm font-medium shadow-lg shadow-[#6B57FF]/30 hover:bg-[#5846ee] hover:shadow-[#6B57FF]/50 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                    <path d="M19 3L3 19M3 19H11M3 19V11M19 3H12M19 3V10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Board is opening
                </button>
              </Link>
              <button className="bg-slate-100 text-slate-500 rounded-2xl px-7 py-4 text-sm font-medium hover:bg-rose-50 hover:text-rose-400 active:scale-95 transition-all duration-200">
                Close Board
              </button>
            </div>
          </div>

          {/* Purple stats card */}
          <div className="bg-[#685AF7] rounded-2xl p-5">
            {boardStats.map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-white/10 last:border-0">
                <span className="text-white/60 text-sm">{label}</span>
                <span className="text-white font-medium text-xl">{value}</span>
              </div>
            ))}
          </div>

          {/* Mini stat grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {miniStats.map(({ label, value, color, icon }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-default">
                <div>
                  <div className="text-[12px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-3xl font-medium" style={{ color }}>{value}</div>
                </div>
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column — Student List */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-[#1B1B1B] mb-5 flex items-center gap-2">
            <Users size={18} color="#6B57FF" />
            รายชื่อนักเรียน
          </h3>

          <div className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#6B57FF] transition-colors"
              />
            </div>

          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pl-4 pb-3 text-[#1B1B1B] font-medium">Name</th>
                <th className="text-right pr-4 pb-3 text-[#1B1B1B] font-medium">Total Questions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-slate-400 text-sm">No students found</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}

                    onClick={() => router.push(`/professor/courses/${student.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <img src={student.avatar} className="w-9 h-9 rounded-full bg-slate-100" alt="" />

                        <span className="text-slate-700 font-medium group-hover:text-[#5B41FF] transition-colors">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right pr-10">
                      <span className={`font-semibold text-base ${student.questions > 0 ? "text-[#5B41FF]" : "text-slate-300"}`}>
                        {student.questions}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity Timeline */}
      <section className="max-w-5xl mx-auto mt-10">
        <h3 className="text-2xl font-regular mb-4 text-[#1B1B1B]">ActivityTimeline</h3>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            {["All", "Answered", "Unanswered", "Board"].map((btnLabel) => (
              <button
                key={btnLabel}
                onClick={() => setFilter(btnLabel)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all border ${filter === btnLabel ? "bg-[#5B41FF] text-white border-[#5B41FF]" : "text-slate-400 border-slate-200 hover:border-slate-300 bg-white"
                  }`}
              >
                {btnLabel}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
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
            <ActivityCard
              key={item.id}
              data={item}
              onMarkAnswered={() => handleMarkAnswered(item.id)}
              onUnmarked={() => handleUnmarked(item.id)}
              onPostReply={(text: string) => handlePostReply(item.id, text)}
              onDelete={() => handleDelete(item.id)}
              onDeleteReply={handleDeleteReply}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- SUB COMPONENT ---------------- */

function ActivityCard({ data, onMarkAnswered, onUnmarked, onPostReply, onDelete, onDeleteReply }: any) {
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const isBoard = data.type === "board";
  const isAnswered = data.status === "ANSWERED";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      <div className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${isAnswered ? "bg-emerald-50 text-emerald-500" : isBoard ? "bg-red-50 text-red-400" : "bg-orange-50 text-orange-400"
        }`}>
        {isAnswered ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="5" fill="#34d399" />
            <path d="M2.5 5l1.8 1.8L7.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ) : isBoard ? (
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="5" fill="#fb923c" />
            <path d="M5 3v2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="5" cy="7" r="0.6" fill="white" />
          </svg>
        )}
        {data.status}
      </div>

      <div className="flex gap-4">
        <img src={data.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-slate-100" />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-slate-800">{data.user}</span>
            <span className="text-xs text-slate-400">{data.time}</span>
          </div>

          {isBoard ? (
            <div className="bg-[#F0EEFF] rounded-2xl p-4 mt-2">
              <p className="text-[#513FDF] font-bold text-lg mb-1">{data.content}</p>
              {data.subContent && <p className="text-sm text-slate-500 mb-4">{data.subContent}</p>}
              <button className="flex items-center gap-2 bg-[#513FDF] text-white px-5 py-2 rounded-full text-sm hover:scale-105 active:scale-95 transition-all">
                <span>👁</span> Review Session
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-700 mb-4">{data.content}</p>

              <div className="space-y-3 mb-4">
                {data.professorReplies?.map((reply: string, index: number) => (
                  <div key={index} className="border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-emerald-400 text-white text-[11px] px-2 py-0.5 rounded font-regular uppercase tracking-wider">
                        Professor Reply
                      </span>
                      <button onClick={() => onDeleteReply(data.id, index)} className="text-rose-400 hover:text-rose-600 transition-colors text-xs font-bold px-1">✕</button>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{reply}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-[13px]">
                <span className="text-slate-400 flex items-center gap-1">↩ {data.replies || 0}</span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className={`px-3 py-1 rounded-md border transition-colors ${showReplyBox ? "text-[#5B41FF] border-[#5B41FF] bg-purple-50" : "text-slate-400 border-slate-200 hover:border-slate-300"}`}
                  >
                    Reply
                  </button>
                  {isAnswered ? (
                    <button onClick={onUnmarked} className="text-orange-500 border border-orange-100 px-3 py-1 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors">Unmarked</button>
                  ) : (
                    <button onClick={onMarkAnswered} className="text-emerald-500 border border-emerald-100 px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors">Mark Answered</button>
                  )}
                  <button onClick={onDelete} className="text-rose-400 border border-rose-100 px-3 py-1 rounded-md hover:bg-rose-50 transition-colors">Delete</button>
                </div>
              </div>

              {showReplyBox && (
                <div className="mt-4 bg-[#F8F9FE] rounded-xl p-4 border border-slate-100">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Add a new reply as Instructor..."
                    className="w-full bg-transparent border-none resize-none text-sm focus:outline-none h-16 text-slate-600"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setShowReplyBox(false); setReplyText(""); }} className="text-slate-400 border border-slate-200 px-4 py-1.5 rounded-xl text-[13px] hover:bg-slate-50 transition-all">
                      Cancel
                    </button>
                    <button
                      onClick={() => { if (replyText.trim()) { onPostReply(replyText); setReplyText(""); setShowReplyBox(false); } }}
                      className="bg-[#5B41FF] text-white px-6 py-1.5 rounded-xl text-[13px] hover:shadow-md transition-all active:scale-95"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}