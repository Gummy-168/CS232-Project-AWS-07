"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Header from "@/app/components/Header";
import CreateCourse from "@/app/components/createcourse";

const fetchProfessorData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        professor: { name: "อาจารย์สะปุกนิก", id: "PRF000001" },
        course: { title: "CS232: Intro to Cloud Computing", code: "7A3456" },
      });
    }, 600);
  });
};

const formatTimeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
};

const MOCK_STUDENTS = [
  {
    id: 1,
    name: "สมปอง อยากรวย",
    questions: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    status: "online",
  },
  {
    id: 2,
    name: "พาที ณ พารัก",
    questions: 4,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    status: "online",
  },
  {
    id: 3,
    name: "ญาญ่า อยากนอน",
    questions: 2,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    status: "offline",
  },
  {
    id: 4,
    name: "สมหญิง อุอุอะ",
    questions: 0,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    status: "online",
  },
];

const INITIAL_QUESTIONS = [
  {
    id: 1,
    courseId: "100001",
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
    courseId: "100001",
    user: "ทุงทุงทุง",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    replies: [],
    showReplies: false,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung",
  },
];

export default function BoardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);

  const filteredStudents = MOCK_STUDENTS.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()),
  );

  const handleMarkAnswered = (id: number) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "ANSWERED" } : q)),
    );

  const handleUnmarked = (id: number) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "UNANSWERED" } : q)),
    );

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const toggleReplies = (id: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, showReplies: !q.showReplies } : q,
      ),
    );
  };

  const handlePostReply = (id: number, text: string) => {
    if (!text.trim()) return;
    setQuestions((prev) =>
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
    setQuestions((prev) =>
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

  const handleCreateCourse = () => {};

  if (!data)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="h-full bg-[#FCF9F8] font-sans text-slate-700 overflow-y-auto">
      <Header
        professorName={data?.professor?.name}
        onJoinCourse={() => setIsModalOpen(true)}
        courseTitle={data?.course?.title}
        codeId={data?.course?.code}
        mode="course"
      />
      <CreateCourse
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateCourse={handleCreateCourse}
      />
      <main className="px-8 pt-[140px] pb-10 w-full">
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-medium text-[#1B1B1B]">
              Board : Aws 31/03/2026
            </h1>
          </div>
          <button className="bg-[#EF4444] text-white px-5 py-2 rounded-2xl flex items-center gap-2 font-medium hover:bg-red-600 transition-colors shadow-sm">
            <XCircle size={20} />
            Close Board
          </button>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-50">
            <h3 className="text-base font-semibold text-[#1B1B1B] mb-5 flex items-center gap-2">
              <Users size={18} color="#6B57FF" />
              รายชื่อนักเรียน
            </h3>
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={15}
                />
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
                <tr className="border-b border-slate-50">
                  <th className="text-left pb-3 text-slate-500 font-medium">
                    Name
                  </th>
                  <th className="text-right pb-3 text-slate-500 font-medium">
                    Total Questions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() =>
                      router.push(`/professor/courses/${student.id}`)
                    }
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          className="w-9 h-9 rounded-full bg-slate-100"
                        />
                        <span className="text-slate-700 font-medium group-hover:text-[#6B57FF]">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-semibold text-[#6B57FF] text-base">
                        {student.questions}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Question Feed */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 min-h-[600px]">
            <div className="flex items-center gap-2 mb-8">
              <MessageSquare size={20} className="text-[#E91E63]" />
              <h2 className="text-lg font-medium text-[#1B1B1B]">
                Board Question Feed
              </h2>
            </div>
            <div className="space-y-4">
              {questions.map((q) => (
                <ActivityCard
                  key={q.id}
                  data={q}
                  onToggleReplies={toggleReplies}
                  onMarkAnswered={() => handleMarkAnswered(q.id)}
                  onUnmarked={() => handleUnmarked(q.id)}
                  onPostReply={(text: string) => handlePostReply(q.id, text)}
                  onDelete={() => handleDelete(q.id)}
                  onDeleteReply={handleDeleteReply}
                />
              ))}
            </div>
          </div>
        </div>
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
        {isAnswered ? "ANSWERED" : isBoard ? "BOARD" : "UNANSWERED"}
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

              {/* Professor replies — แสดงตลอด */}
              {data.replies?.some((r: any) => r.isProfessor) && (
                <div className="space-y-2 mb-3">
                  {data.replies
                    .map((r: any, realIndex: number) => ({ r, realIndex }))
                    .filter(({ r }) => r.isProfessor)
                    .map(({ r, realIndex }) => (
                      <div key={realIndex} className="flex gap-3">
                        <img
                          src={r.avatar}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
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

              {/* Reply toggle + Mark/Delete ในบรรทัดเดียวกัน */}
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

              {/* Student replies + compose box */}
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

                  {/* Compose box */}
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
