"use client";
import React, { useState, useMemo, useEffect } from "react";
import CreateCourse from "../../components/createcourse";
import { Search } from "lucide-react";
import Header from "@/app/components/Header";

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
    user: "สมปอง กุ๊กกิ๊ก",
    time: "1 sec ago",
    content: "ไก่กับไข่อะไรเกิดก่อนกัน",
    status: "UNANSWERED",
    type: "question",
    replies: 0,
    professorReplies: [],
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
  },
  {
    id: 2,
    user: "ทุงทุงทุง",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    replies: 0,
    professorReplies: [],
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
    replies: 0,
    professorReplies: [],
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot",
  },
  {
    id: 4,
    user: "มะพร้าว ส้มโอ",
    time: "2h ago",
    content:
      "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้ มีใครสามารถทำได้บ้างไหมครับ",
    status: "ANSWERED",
    type: "question",
    replies: 1,
    professorReplies: ["ติดปัญหาส่วนไหนคะ ลองดู...ใหม่ค่ะ"],
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

  const handlePostReply = (id: number, text: string) => {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: "ANSWERED",
            professorReplies: [...(item.professorReplies || []), text],
            replies: (item.replies || 0) + 1,
          };
        }
        return item;
      }),
    );
  };

  const handleDeleteReply = (activityId: number, replyIndex: number) => {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id === activityId) {
          const filteredReplies = item.professorReplies.filter(
            (_: any, i: number) => i !== replyIndex,
          );
          return {
            ...item,
            professorReplies: filteredReplies,
            replies: Math.max(0, (item.replies || 0) - 1),
            status: filteredReplies.length > 0 ? "ANSWERED" : "UNANSWERED",
          };
        }
        return item;
      }),
    );
  };

  const handleDelete = (id: number) => {
    setActivities((prev) => prev.filter((item) => item.id !== id));
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
    </div>
  );
}

/* ---------------- SUB COMPONENT ---------------- */

function ActivityCard({
  data,
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
        {data.status}
      </div>

      <div className="flex gap-4">
        <img
          src={data.avatar}
          alt="avatar"
          className="w-12 h-12 rounded-full bg-slate-100"
        />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
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
              <button className="flex items-center gap-2 bg-[#513FDF] text-white px-5 py-2 rounded-full text-sm hover:scale-105 active:scale-95 transition-all">
                <span>👁</span> Review Session
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-700 mb-4">{data.content}</p>

              {/* Professor Replies */}
              <div className="space-y-3 mb-4">
                {data.professorReplies?.map((reply: string, index: number) => (
                  <div
                    key={index}
                    className="border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-emerald-400 text-white text-[11px] px-2 py-0.5 rounded font-regular uppercase tracking-wider">
                        Professor Reply
                      </span>
                      <button
                        onClick={() => onDeleteReply(data.id, index)}
                        className="text-rose-400 hover:text-rose-600 transition-colors text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">
                      {reply}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom row */}
              <div className="flex items-center gap-4 text-[13px] font-regular">
                {/* Reply count ซ้าย — กดไม่ได้ */}
                <span className="text-slate-400 flex items-center gap-1">
                  ↩ {data.replies || 0}
                </span>
                {/* ปุ่มขวา */}
                <div className="ml-auto flex gap-2">
                  {/* Reply toggle */}
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className={`px-3 py-1 rounded-md border transition-colors ${
                      showReplyBox
                        ? "text-[#5B41FF] border-[#5B41FF] bg-purple-50"
                        : "text-slate-400 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    Reply
                  </button>

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

              {/* Reply box — แสดงเมื่อกด Reply */}
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
                    <button
                      onClick={() => {
                        setShowReplyBox(false);
                        setReplyText("");
                      }}
                      className="text-slate-400 border border-slate-200 px-4 py-1.5 rounded-xl text-[13px] font-regular hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (replyText.trim()) {
                          onPostReply(replyText);
                          setReplyText("");
                          setShowReplyBox(false);
                        }
                      }}
                      className="bg-[#5B41FF] text-white px-6 py-1.5 rounded-xl text-[13px] font-regular hover:shadow-md transition-all active:scale-95"
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
