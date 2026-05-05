"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  User,
  MessageSquare,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

const StudentDetailPage = ({ params }: { params: { id: string } }) => {
  const { id } = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);

  const studentData = {
    id: params.id,
    name: "สมปอง อยากรวย",
    studentNumber: "6700000000",
    email: "sompong.yak@dome.tu.ac.th",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=shiba",
    stats: {
      pending: 8,
      answered: 12,
      participating: "88%",
      totalQuestions: 20,
    },
  };

  const [activities, setActivities] = useState([
    {
      id: 101,
      user: studentData.name,
      avatar: studentData.avatar,
      courseCode: "CS232-54001",
      time: "1 sec ago",
      content: "ไก่กับไข่อะไรเกิดก่อนกัน",
      replies: [],
      showReplies: false,
      status: "UNANSWERED",
      type: "question",
    },

    {
      id: 102,
      user: studentData.name,
      avatar: studentData.avatar,
      courseCode: "CS232-54001",
      time: "2 hours ago",
      content: "ทำแลปไม่ได้ค่ะ ตรงส่วนเชื่อมต่อ Database",
      status: "ANSWERED",
      replies: [
        {
          user: "อาจารย์สะปุกนิก",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PRF000001",
          time: "1h ago",
          text: "ลองเช็คไฟล์ .env อีกรอบนะคะว่าใส่พอร์ตถูกไหม",
          isProfessor: true,
        },
      ],
      showReplies: false,
      type: "question",
    },
  ]);

  const [filter, setFilter] = useState("All");

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

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    setActivities((prev) => prev.filter((q) => q.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((q) => {
      if (filter === "All") return true;
      if (filter === "Board") return q.type === "board";
      return q.status.toUpperCase() === filter.toUpperCase();
    });
  }, [filter, activities]);

  const miniStats = [
    {
      label: "PENDING",
      value: studentData.stats.pending,
      color: "#AE2466",
      icon: <Clock size={20} className="text-[#FD64A4]" />,
    },
    {
      label: "ANSWERED",
      value: studentData.stats.answered,
      color: "#513FDF",
      icon: <CheckCircle2 size={20} className="text-[#22C55E]" />,
    },
    {
      label: "PARTICIPATING",
      value: studentData.stats.participating,
      color: "#1B1C1B",
      icon: <TrendingUp size={20} className="text-[#513FDF]" />,
    },
    {
      label: "TOTAL QUESTIONS",
      value: studentData.stats.totalQuestions,
      color: "#1B1C1B",
      icon: <MessageSquare size={20} className="text-[#513FDF]" />,
    },
  ];
  const handleCreateCourse = () => {};
  function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-slate-700 font-medium">{value}</p>
    </div>
  );
}

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
      />
      <main className="px-8 pt-[140px] pb-10 w-full">
        <div className="max-w-6xl mx-auto bg-white rounded-[40px] shadow-sm border border-slate-50 p-8 md:p-12">
          {/* HEADER  */}
          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft size={28} className="text-slate-700" />
            </button>
            <div className="flex items-center gap-2 bg-indigo-50 px-2 py-2 rounded-2xl text-indigo-600">
              <User size={20} />
            </div>
            <span className="font-bold">รายละเอียดนักเรียน</span>
          </div>

          {/* PROFILE SECTION */}
          <div className="flex flex-col lg:flex-row gap-10 mb-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                <img
                  src={studentData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Student Profile
              </span>
            </div>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoBox label="Full Name" value={studentData.name} />
              <InfoBox
                label="Student Number"
                value={studentData.studentNumber}
              />
              <div className="md:col-span-2">
                <InfoBox label="Email" value={studentData.email} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {miniStats.map(({ label, value, color, icon }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="text-[12px] text-slate-400 uppercase tracking-wider mb-1">
                      {label}
                    </div>
                    <div className="text-3xl font-medium" style={{ color }}>
                      {value}
                    </div>
                  </div>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITY TIMELINE SECTION */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h3 className="text-2xl font-regular text-[#1B1B1B]">
                Question from them
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs  text-slate-400">
                {["All", "Answered", "Unanswered"].map((btnLabel) => (
                  <button
                    key={btnLabel}
                    onClick={() => setFilter(btnLabel)}
                    className={`px-5 py-2 rounded-lg transition-all ${
                      filter === btnLabel
                        ? "bg-white text-[#513FDF] shadow-sm"
                        : "hover:text-slate-600"
                    }`}
                  >
                    {btnLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  data={activity}
                  onToggleReplies={toggleReplies}
                  onMarkAnswered={() => handleMarkAnswered(activity.id)}
                  onUnmarked={() => handleUnmarked(activity.id)}
                  onPostReply={(text: string) =>
                    handlePostReply(activity.id, text)
                  }
                  onDelete={() => handleDelete(activity.id)}
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
};
// ActivityCard
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
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
      <div
        className={`absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] ${
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
            <div className="bg-[#F0EEFF] rounded-2xl p-5 mt-2">
              <p className="text-[#513FDF] text-lg mb-1">{data.content}</p>
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
                              className="text-rose-400 hover:text-rose-600 transition-colors text-xs px-1"
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
                <div className="ml-auto flex gap-2">
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

export default StudentDetailPage;
