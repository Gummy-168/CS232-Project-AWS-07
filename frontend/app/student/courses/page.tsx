"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Contact, Clock, PenLine } from "lucide-react";
import Link from "next/link";
import JoinCourse from "../../components/joincourse";
import Header from "../../components/Header";

type DashboardData = {
  student: {
    name: string;
    id: string;
  };
  session: {
    title: string;
    time: string;
    instructor: string;
    timeLeft: string;
  };
};

type Reply = {
  user: string;
  avatar: string;
  time: string;
  text: string;
  isProfessor?: boolean;
};

type Activity = {
  id: number;
  user: string;
  time: string;
  content: string;
  subContent?: string;
  status: "UNANSWERED" | "ANSWERED" | "BOARD";
  type: "question" | "board";
  replies: Reply[];
  showReplies: boolean;
  avatar: string;
  professorReply?: string;
};

const fetchDashboardData = async (): Promise<DashboardData> => {
  return new Promise<DashboardData>((resolve) => {
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

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 1,
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
    user: "ทุงทุงทุง",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    replies: [
      {
        user: "มะพร้าว ส้มโอ",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot",
        time: "1m ago",
        text: "EC2 คือ virtual server บน AWS ครับ",
      },
    ],
    showReplies: false,
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
    replies: [],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot",
  },
  {
    id: 4,
    user: "มะพร้าว ส้มโอ",
    time: "2h ago",
    content: "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้",
    status: "ANSWERED",
    type: "question",
    replies: [
      {
        user: "Aj. Noon",
        avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Professor",
        time: "30s ago",
        text: "ถูกต้องค่ะ",
        isProfessor: true,
      },
    ],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coconut",
  },
];

/* ---------------- MAIN COMPONENT ---------------- */

export default function StudentClass() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState<
    "All" | "Answered" | "Unanswered" | "Board"
  >("All");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const filterOptions = ["All", "Answered", "Unanswered", "Board"] as const;

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  const toggleReplies = (id: number) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, showReplies: !a.showReplies } : a,
      ),
    );
  };

  const postReply = (id: number, text: string) => {
    if (!text.trim() || !data) return;
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

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      // 1. ตรวจสอบ Filter ตามสถานะ (All, Answered, Unanswered, Board)
      const status = item.status.toUpperCase().trim();
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

  const handleCreatePost = ({
    title,
    detail,
    anonymous,
  }: {
    title: string;
    detail: string;
    tags: string[];
    anonymous: boolean;
  }) => {
    if (!data) return;

    const newPost: Activity = {
      id: Date.now(),
      user: anonymous ? "ไม่ระบุตัวตน" : data.student.name,
      avatar: anonymous
        ? "https://api.dicebear.com/7.x/identicon/svg?seed=anon"
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.student.id}`,
      time: "just now",
      content: title,
      subContent: detail || undefined,
      status: "UNANSWERED",
      type: "question",
      replies: [],
      showReplies: false,
    };
    setActivities((prev) => [newPost, ...prev]);
    setFilter("All");
    setIsPostOpen(false);
  };

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#FCF9F8]">
      <Header
        studentName={data.student.name}
        studentId={data.student.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        courseTitle={data.session.title}
        mode="courses"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <main className="p-8 pt-[140px] space-y-6 left-30 h-full pb-10 overflow-y-auto">
        {" "}
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
              {filterOptions.map((btnLabel) => (
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
      {/* FAB Button */}
      <button
        onClick={() => setIsPostOpen(true)}
        className="fixed bottom-15 right-15 w-20 h-20 rounded-full bg-gradient-to-br from-[#6443D9] to-[#EA60AB] text-white shadow-lg shadow-purple-300 hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-40"
      >
        <PenLine size={30} />
      </button>

      {/* Create Post Overlay */}
      <CreatePostModal
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        courseTitle={data.session.title}
        onPost={handleCreatePost}
      />
    </div>
  );
}

function CreatePostModal({
  isOpen,
  onClose,
  courseTitle,
  onPost,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
  onPost: (post: {
    title: string;
    detail: string;
    tags: string[];
    anonymous: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);

  const tags = ["Midterm", "Final", "Project", "Homework"];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };
  const handlePost = () => {
    if (!title.trim()) return;
    onPost({ title, detail, tags: selectedTags, anonymous });
    // reset
    setTitle("");
    setDetail("");
    setSelectedTags([]);
    setAnonymous(false);
    onClose();
  };
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1B1B1B]">Create a Post</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Course badge */}
        <div className="bg-[#EEF0FF] text-[#5B41FF] text-xs font-medium px-4 py-2 rounded-xl mb-5">
          Posting to {courseTitle || "My Course"}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            หัวข้อคำถาม <span className="text-red-500 font-regular">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ไก่กับไข่อะไรเกิดก่อนกัน"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 transition"
          />
        </div>

        {/* Detail */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            รายละเอียดเพิ่มเติม{" "}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="อธิบายคำถามเพิ่มเติม"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 transition resize-none"
          />
        </div>

        {/* Tags */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Tag <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-[#5B41FF] text-white border-[#5B41FF]"
                    : "text-slate-500 border-slate-200 bg-white hover:border-[#5B41FF] hover:text-[#5B41FF]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous toggle */}
        <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>👁</span>
            <span>แสดงชื่อแบบไม่ระบุตัวตน</span>
          </div>
          <button
            onClick={() => setAnonymous((v) => !v)}
            className={`w-11 h-6 rounded-full transition-all relative ${
              anonymous ? "bg-[#5B41FF]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                anonymous ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={!title.trim()}
            className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-[#6443D9] to-[#EA60AB] text-white text-sm font-medium shadow-md disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SUB COMPONENT ---------------- */
function StudentActivityCard({
  data,
  onToggleReplies,
  onPostReply,
}: {
  data: Activity;
  onToggleReplies: (id: number) => void;
  onPostReply: (id: number, text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const isBoard = data.status.toUpperCase().trim() === "BOARD";
  const isAnswered = data.status.toUpperCase().trim() === "ANSWERED";

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
                <Link
                  href="/student/courses/boardreview"
                  className="flex items-center gap-2 bg-[#513FDF] text-white px-5 py-2 rounded-full text-sm hover:scale-105 active:scale-95 transition-all w-fit"
                >
                  <span>👁</span> Review Session
                </Link>
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
              {data.replies.some((r) => r.isProfessor) && (
                <div className="space-y-2 mb-3">
                  {data.replies
                    .filter((r) => r.isProfessor)
                    .map((r, i: number) => (
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
                  {data.replies.filter((r) => !r.isProfessor).length > 0
                    ? data.replies.filter((r) => !r.isProfessor).length
                    : ""}{" "}
                  {data.showReplies ? "ซ่อน replies" : "reply"}
                </button>
              </div>

              {/* Student replies*/}
              {data.showReplies && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {data.replies
                    .filter((r) => !r.isProfessor)
                    .map((r, i: number) => (
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
