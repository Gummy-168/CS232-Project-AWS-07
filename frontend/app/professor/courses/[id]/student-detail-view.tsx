"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import CreateCourse from "@/app/components/createcourse";

type ActivityStatus = "UNANSWERED" | "ANSWERED";

type ProfessorData = {
  professor: { name: string; id: string };
  course: { title: string; code: string };
};

type StudentStats = {
  pending: number;
  answered: number;
  participating: string;
  totalQuestions: number;
};

type StudentInfo = {
  id: string;
  name: string;
  studentNumber: string;
  email: string;
  avatar: string;
  stats: StudentStats;
};

type Reply = {
  user: string;
  avatar: string;
  time: string;
  text: string;
  isProfessor: boolean;
};

type Activity = {
  id: number;
  user: string;
  avatar: string;
  courseCode: string;
  time: string;
  content: string;
  replies: Reply[];
  showReplies: boolean;
  status: ActivityStatus;
};

type ActivityCardProps = {
  data: Activity;
  onToggleReplies: (id: number) => void;
  onMarkAnswered: () => void;
  onUnmarked: () => void;
  onPostReply: (text: string) => void;
  onDelete: () => void;
  onDeleteReply: (activityId: number, replyIndex: number) => void;
};

const fetchProfessorData = async (): Promise<ProfessorData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        professor: { name: "อาจารย์ สะปุกนิก", id: "PRF000001" },
        course: { title: "CS232: Intro to Cloud Computing", code: "3A6572" },
      });
    }, 400);
  });
};

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#FAFAFD] px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D12D7D]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#1F2430]">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string | number;
  valueClassName: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        {icon}
      </div>
      <p className={`mt-1 text-[32px] leading-none font-semibold ${valueClassName}`}>
        {value}
      </p>
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
}: ActivityCardProps) {
  const [replyText, setReplyText] = useState("");
  const isAnswered = data.status === "ANSWERED";

  return (
    <article
      className={`rounded-2xl border p-4 md:p-5 ${
        isAnswered
          ? "border-emerald-100 bg-[#F2FCF7]"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <img
            src={data.avatar}
            alt={`${data.user} avatar`}
            className="mt-0.5 h-8 w-8 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#23272F]">{data.user}</p>
            <p className="text-[11px] text-slate-400">
              {data.time} • {data.courseCode}
            </p>
            <p className="mt-1 text-sm text-[#303645]">{data.content}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isAnswered
              ? "bg-emerald-50 text-emerald-600"
              : "bg-orange-50 text-orange-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAnswered ? "bg-emerald-500" : "bg-orange-400"
            }`}
          />
          {isAnswered ? "ANSWERED" : "UNANSWERED"}
        </span>
      </div>

      {data.replies.some((reply) => reply.isProfessor) ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-[#F8FFFB] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            Professor Reply
          </p>
          {data.replies
            .map((reply, index) => ({ reply, index }))
            .filter(({ reply }) => reply.isProfessor)
            .map(({ reply, index }) => (
              <div key={`${reply.time}-${index}`} className="mt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">{reply.time}</p>
                  <button
                    type="button"
                    onClick={() => onDeleteReply(data.id, index)}
                    className="text-[10px] font-medium text-rose-500 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm text-[#2B3240]">{reply.text}</p>
              </div>
            ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleReplies(data.id)}
          className="rounded-full bg-[#F3EEFF] px-3 py-1 text-[11px] font-medium text-[#5A46E8] hover:bg-[#EAE2FF]"
        >
          ↩ {data.replies.filter((reply) => !reply.isProfessor).length} Reply
        </button>
        <div className="flex items-center gap-2">
          {isAnswered ? (
            <button
              type="button"
              onClick={onUnmarked}
              className="rounded-md bg-orange-50 px-2.5 py-1.5 text-[11px] font-medium text-orange-600 hover:bg-orange-100"
            >
              Unmarked
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkAnswered}
              className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-emerald-100"
            >
              Mark Answered
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-500 hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>

      {data.showReplies ? (
        <div className="mt-3 rounded-xl border border-slate-100 bg-[#FAFAFE] p-3">
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder="Reply as instructor..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-[#2E3440] outline-none focus:border-[#B8A8FF]"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (replyText.trim()) {
                  onPostReply(replyText.trim());
                  setReplyText("");
                }
              }}
              disabled={!replyText.trim()}
              className="rounded-lg bg-[#5A46E8] px-4 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#4D3DCC]"
            >
              Post Reply
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function StudentDetailView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<ProfessorData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [filter, setFilter] = useState<"All" | "Answered" | "Unanswered">("All");

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);

  const studentData: StudentInfo = {
    id: params.id,
    name: "สมปอง อยากสวย",
    studentNumber: "6700000000",
    email: "sompong.yak@dome.tu.ac.th",
    avatar: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=200&h=200&fit=crop",
    stats: {
      pending: 8,
      answered: 12,
      participating: "88%",
      totalQuestions: 20,
    },
  };

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 101,
      user: studentData.name,
      avatar: studentData.avatar,
      courseCode: "CS232-54001",
      time: "1 sec ago",
      content: "ไก่กับไข่อะไรเกิดก่อนกัน",
      replies: [],
      showReplies: true,
      status: "UNANSWERED",
    },
    {
      id: 102,
      user: studentData.name,
      avatar: studentData.avatar,
      courseCode: "CS232-54001",
      time: "2h ago",
      content: "คำถาม2",
      replies: [
        {
          user: "อาจารย์ สะปุกนิก",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PRF000001",
          time: "1h ago",
          text: "เดี๋ยวให้ดูตรงนี้เพิ่มนะคะ ลองดู...",
          isProfessor: true,
        },
      ],
      showReplies: false,
      status: "ANSWERED",
    },
  ]);

  const filteredActivities = useMemo(() => {
    if (filter === "All") {
      return activities;
    }
    if (filter === "Answered") {
      return activities.filter((item) => item.status === "ANSWERED");
    }
    return activities.filter((item) => item.status === "UNANSWERED");
  }, [activities, filter]);

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
      prev.map((item) =>
        item.id === id ? { ...item, showReplies: !item.showReplies } : item,
      ),
    );
  };

  const handlePostReply = (id: number, text: string) => {
    const professorName = data?.professor.name || "Professor";
    const professorId = data?.professor.id || "PRF000001";
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
                  user: professorName,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${professorId}`,
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
        if (item.id !== activityId) {
          return item;
        }
        const replies = item.replies.filter((_, idx) => idx !== replyIndex);
        return {
          ...item,
          replies,
          status: replies.some((reply) => reply.isProfessor)
            ? "ANSWERED"
            : "UNANSWERED",
        };
      }),
    );
  };

  const confirmDelete = () => {
    if (deleteTarget === null) {
      return;
    }
    setActivities((prev) => prev.filter((item) => item.id !== deleteTarget));
    setDeleteTarget(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F6F5F8] text-slate-700">
      <Header
        professorName={data?.professor?.name}
        onJoinCourse={() => setIsModalOpen(true)}
        courseTitle={data?.course?.title}
        codeId={data?.course?.code}
        mode="course"
      />
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <main className="w-full px-6 pb-10 pt-[128px] md:px-8">
        <section className="mx-auto max-w-6xl rounded-[28px] border border-[#EFEAFA] bg-white p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ChevronLeft size={22} />
            </button>
            <span className="rounded-xl bg-[#F3EEFF] p-2 text-[#6A53E7]">
              <User size={16} />
            </span>
            <p className="text-sm font-semibold text-[#232735]">รายละเอียดนักเรียน</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-[#FCFBFF] p-4 md:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-2">
                <div className="mx-auto flex w-full max-w-[120px] flex-col items-center gap-2">
                  <img
                    src={studentData.avatar}
                    alt="Student profile"
                    className="h-24 w-24 rounded-3xl object-cover shadow-sm"
                  />
                  <p className="text-[9px] font-semibold tracking-widest text-slate-400">
                    STUDENT PROFILE
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoBox label="Full Name" value={studentData.name} />
                  <InfoBox label="Student Number" value={studentData.studentNumber} />
                  <div className="md:col-span-2">
                    <InfoBox label="Email" value={studentData.email} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatBox
                    label="Pending"
                    value={studentData.stats.pending}
                    valueClassName="text-[#D13184]"
                    icon={<Clock3 size={14} className="text-[#FD64A4]" />}
                  />
                  <StatBox
                    label="Answered"
                    value={studentData.stats.answered}
                    valueClassName="text-[#5A46E8]"
                    icon={<CheckCircle2 size={14} className="text-[#22C55E]" />}
                  />
                  <StatBox
                    label="Participating"
                    value={studentData.stats.participating}
                    valueClassName="text-[#1F2531]"
                    icon={<TrendingUp size={14} className="text-[#5A46E8]" />}
                  />
                  <StatBox
                    label="Total Questions"
                    value={studentData.stats.totalQuestions}
                    valueClassName="text-[#1F2531]"
                    icon={<MessageSquare size={14} className="text-[#5A46E8]" />}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#232735]">
                  Question From Them
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-full bg-[#F2F2F7] p-1 text-[11px]">
                    {(["All", "Answered", "Unanswered"] as const).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFilter(name)}
                        className={`rounded-full px-3 py-1.5 font-medium transition ${
                          filter === name
                            ? "bg-white text-[#5A46E8] shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-slate-50"
                  >
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    data={activity}
                    onToggleReplies={toggleReplies}
                    onMarkAnswered={() => handleMarkAnswered(activity.id)}
                    onUnmarked={() => handleUnmarked(activity.id)}
                    onPostReply={(text) => handlePostReply(activity.id, text)}
                    onDelete={() => setDeleteTarget(activity.id)}
                    onDeleteReply={handleDeleteReply}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {deleteTarget !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-base font-semibold text-slate-800">ลบคำถามนี้?</p>
            <p className="mt-1 text-sm text-slate-400">
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
