"use client";
import React, { useState, useMemo, useEffect } from "react";
import CreateCourse from "../../components/createcourse";
import { Search } from "lucide-react";
import Header from "@/app/components/Header";
import Link from "next/link";

/* ---------------- MOCK API ---------------- */

const fetchProfessorData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        professor: { name: "อาจารย์สะปุกนิก", id: "PRF000001" },
        course: {
          title: "CS232: Intro to Cloud Computing",
        },
      });
    }, 600);
  });
};

/* ---------------- MOCK DATA ---------------- */

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
    user: "ทุงทุงทุง",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    replies: [],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung",
  },
  {
    id: 3,
    subject: "CS232",
    section: "100001",
    user: "CS232 Course Bot",
    time: "1d ago",
    content: "Lab 5 : RDS",
    subContent: "สามารถดูคำถามย้อนหลังได้ที่นี่ ทั้งหมด 5 คำถาม",
    status: "BOARD",
    type: "board",
    replies: [],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot",
  },
  {
    id: 4,
    subject: "CS232",
    section: "100002",
    user: "มะพร้าว ส้มโอ",
    time: "2h ago",
    content:
      "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้ มีใครสามารถทำได้บ้างไหมครับ",
    status: "ANSWERED",
    type: "question",
    replies: [
      {
        user: "อาจารย์สะปุกนิก",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PRF000001",
        time: "1h ago",
        text: "ติดปัญหาส่วนไหนคะ ลองดู...ใหม่ค่ะ",
        isProfessor: true,
      },
    ],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coconut",
  },
];

/* ---------------- MAIN COMPONENT ---------------- */

export default function ProfessorDashboard() {
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    setActivities((prev) => prev.filter((item) => item.id !== deleteTarget));
    setDeleteTarget(null);
  };

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);

  const handleMarkAnswered = (id: number) => {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "ANSWERED" } : item,
      ),
    );
  };

  const handleUnmarked = (id: number) => {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "UNANSWERED" } : item,
      ),
    );
  };
  const toggleReplies = (id: number) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, showReplies: !a.showReplies } : a,
      ),
    );
  };

  const handlePostReply = (id: number, text: string) => {
    if (!text.trim()) return;
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "ANSWERED",
              showReplies: true,
              replies: [
                ...item.replies,
                {
                  user: data.professor.name,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.professor.id}`,
                  time: "just now",
                  text,
                  isProfessor: true,
                },
              ],
            }
          : item,
      ),
    );
  };

  const handleDeleteReply = (activityId: number, replyIndex: number) => {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id === activityId) {
          const filtered = item.replies.filter(
            (_: any, i: number) => i !== replyIndex,
          );
          return {
            ...item,
            replies: filtered,
            status: filtered.some((r: any) => r.isProfessor)
              ? "ANSWERED"
              : "UNANSWERED",
          };
        }
        return item;
      }),
    );
  };

  const filteredActivities = useMemo(() => {
    let result = activities;

    // filter tab
    if (filter !== "All") {
      result = result.filter((item) => item.status === filter.toUpperCase());
    }

    // search
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();

      result = result.filter(
        (item) =>
          item.content.toLowerCase().includes(q) ||
          item.user.toLowerCase().includes(q),
      );
    }

    return result;
  }, [activities, filter, activitySearch]);

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full bg-[#FCF9F8] font-sans text-slate-700 overflow-y-auto">
      {/* Header */}
      <Header
        professorName={data?.professor?.name}
        codeId={data?.course?.code}
        onJoinCourse={() => setIsModalOpen(true)}
        mode="questions"
      />
      <CreateCourse
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <main className="px-8 pt-[130px] pb-10 w-full">
        {/* Course Card */}

        <section className="bg-white rounded-3xl shadow-sm border border-slate-50 text-center mb-10 p-10 max-w-6xl mx-auto">
          <h2 className="text-2xl font-regular text-[#1B1B1B] mb-6">
            {data?.course?.title}
          </h2>
          <button className="bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] text-white px-10 py-2.5 rounded-full text-lg shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all">
            Create Board
          </button>
        </section>

        {/* Activity Timeline */}
        <section className="max-w-6xl mx-auto mt-10">
          <h3 className="text-2xl font-regular mb-4 text-[#1B1B1B]">
            ActivityTimeline
          </h3>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              {["All", "Answered", "Unanswered", "Board"].map((btnLabel) => (
                <button
                  key={btnLabel}
                  onClick={() => setFilter(btnLabel)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    filter === btnLabel
                      ? "bg-[#5B41FF] text-white border-[#5B41FF]"
                      : "text-slate-400 border-slate-200 hover:border-slate-300 bg-white"
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

          <div className="space-y-6 min-h-[60vh]">
            {filteredActivities.map((item) => (
              <ActivityCard
                key={item.id}
                data={item}
                onToggleReplies={toggleReplies}
                onMarkAnswered={() => handleMarkAnswered(item.id)}
                onUnmarked={() => handleUnmarked(item.id)}
                onPostReply={(text: string) => handlePostReply(item.id, text)}
                onDelete={() => handleDelete(item.id)}
                onDeleteReply={handleDeleteReply}
              />
            ))}
          </div>
        </section>
      </main>
      {/* Delete Confirm Modal */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-80 text-center">
            <p className="text-slate-700 font-medium mb-1">ลบคำถามนี้?</p>
            <p className="text-sm text-slate-400 mb-6">
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-500 text-white text-sm hover:bg-rose-600 transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function ActivityCard({
  data,
  onToggleReplies,
  onMarkAnswered,
  onUnmarked,
  onPostReply,
  onDelete,
  onDeleteReply,
}: any) {
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const isBoard = data.type === "board";
  const isAnswered = data.status === "ANSWERED";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      {/* Badge */}
      <div
        className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
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
        {isAnswered ? "ANSWERED" : isBoard ? "BOARD" : "UNANSWERED"}
      </div>

      <div className="flex gap-4">
        <img
          src={data.avatar}
          alt="avatar"
          className="w-12 h-12 rounded-full bg-slate-100"
        />
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
            <div className="bg-[#F0EEFF] rounded-2xl p-4 mt-2">
              <p className="text-[#513FDF] font-bold text-lg mb-1">
                {data.content}
              </p>
              {data.subContent && (
                <p className="text-sm text-slate-500 mb-4">{data.subContent}</p>
              )}
              <Link
                href="/professor/courses/boardreview"
                className="flex items-center gap-2 bg-[#513FDF] text-white px-5 py-2 rounded-full text-sm hover:scale-105 active:scale-95 transition-all w-fit"
              >
                <span>👁</span> Review Session
              </Link>
            </div>
          ) : (
            <>
              <p className="text-slate-700 mb-4">{data.content}</p>

              {/* Professor replies — แสดงตลอด */}
              {data.replies?.some((r: any) => r.isProfessor) && (
                <div className="space-y-2 mb-3">
                  {data.replies
                    .map((r: any, realIndex: number) => ({ r, realIndex }))
                    .filter(({ r }) => r.isProfessor)
                    .map(({ r, realIndex }) => (
                      <div key={realIndex} className="flex gap-3">
                        <div className="flex-1 border border-emerald-100 rounded-xl p-3 bg-[#F0FDF4]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="bg-emerald-400 text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                              Professor Reply
                            </span>
                            <button
                              onClick={() => onDeleteReply(data.id, realIndex)}
                              className="text-rose-400 hover:text-rose-600 transition-colors text-xs font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 mt-1">
                            {r.text}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Reply toggle + Mark/Delete*/}
              <div className="flex items-center justify-between text-[13px] mb-2">
                <button
                  onClick={() => onToggleReplies(data.id)}
                  className="text-slate-400 hover:text-[#5B41FF] flex items-center gap-1 transition-colors"
                >
                  ↩{" "}
                  {data.replies?.filter((r: any) => !r.isProfessor).length || 0}{" "}
                  {data.showReplies ? "ซ่อน replies" : "replies"}
                </button>

                <div className="flex gap-2">
                  {isAnswered ? (
                    <button
                      onClick={onUnmarked}
                      className="text-orange-500 border border-orange-100 px-3 py-1 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      Unmarked
                    </button>
                  ) : (
                    <button
                      onClick={onMarkAnswered}
                      className="text-emerald-500 border border-emerald-100 px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      Mark Answered
                    </button>
                  )}
                  <button
                    onClick={onDelete}
                    className="text-rose-400 border border-rose-100 px-3 py-1 rounded-md hover:bg-rose-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Student replies + compose box*/}
              {data.showReplies && (
                <div className="pt-3 border-t border-slate-100 space-y-3 mb-3">
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

                  {/* Compose box อยู่ใน toggle */}
                  <div className="mt-2 bg-[#F8F9FE] rounded-xl p-4 border border-slate-100">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (replyText.trim()) {
                            onPostReply(replyText);
                            setReplyText("");
                          }
                        }
                      }}
                      placeholder="Add a new reply as Instructor... (Enter เพื่อส่ง)"
                      rows={2}
                      className="w-full bg-transparent border-none resize-none text-sm focus:outline-none text-slate-600"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          onToggleReplies(data.id);
                          setReplyText("");
                        }}
                        className="text-slate-400 border border-slate-200 px-4 py-1.5 rounded-xl text-[13px] hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (replyText.trim()) {
                            onPostReply(replyText);
                            setReplyText("");
                          }
                        }}
                        disabled={!replyText.trim()}
                        className="bg-[#5B41FF] disabled:opacity-40 text-white px-6 py-1.5 rounded-xl text-[13px] hover:shadow-md transition-all active:scale-95"
                      >
                        Post Reply
                      </button>
                    </div>
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
