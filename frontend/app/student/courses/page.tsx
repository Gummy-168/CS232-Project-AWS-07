"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Contact, Clock, PenLine } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import JoinCourse from "../../components/joincourse";
import Header from "../../components/Header";
import {
  createStudentQuestionReply,
  createStudentQuestion,
  getStudentDashboard,
  getStudentQuestions,
  updateStudentQuestion,
} from "../../lib/api";
import { useAuthSession } from "../../hooks/useAuthSession";

type DashboardData = {
  student: {
    name: string;
    id: string;
  };
  session: {
    course_code: string;
    title: string;
    time: string;
    instructor: string;
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
  id: string | number;
  authorId?: string;
  canEdit?: boolean;
  user: string;
  time: string;
  content: string;
  subContent?: string;
  tags?: string[];
  status: "UNANSWERED" | "ANSWERED" | "BOARD";
  type: "question" | "board";
  replies: Reply[];
  showReplies: boolean;
  avatar: string;
  professorReply?: string;
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function StudentClass() {
  const { session } = useAuthSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All Tags");
  const [availableTags, setAvailableTags] = useState<string[]>(["All Tags"]);
  const [filter, setFilter] = useState<
    "All" | "Answered" | "Unanswered" | "Board"
  >("All");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const filterOptions = ["All", "Answered", "Unanswered", "Board"] as const;

  useEffect(() => {
    if (!session?.userId) {
      return;
    }
    const status: "all" | "answered" | "unanswered" =
      filter === "Answered"
        ? "answered"
        : filter === "Unanswered"
          ? "unanswered"
          : "all";
    Promise.all([
      getStudentDashboard(session.userId),
      getStudentQuestions(session.userId, {
        scope: "all",
        status,
        search: activitySearch || undefined,
        tag: selectedTag === "All Tags" ? undefined : selectedTag,
      }),
    ]).then(([dashboard, questions]) => {
      setData(dashboard);
      setActivities(
        questions.questions
          .filter((question) => question.status !== "DELETED")
          .map((question) => ({
            id: question.id,
            authorId: question.author_id,
            canEdit: question.author_id === session.userId,
            user: question.is_anonymous ? "ไม่ระบุตัวตน" : question.author_name,
            time: question.created_at
              ? formatDistanceToNow(new Date(question.created_at), {
                  addSuffix: true,
                })
              : "just now",
            content: question.title || question.content,
            subContent: question.title ? question.content : undefined,
            tags: question.tags ?? [],
            status: question.status === "ANSWERED" ? "ANSWERED" : "UNANSWERED",
            type: "question",
            replies: (question.replies ?? []).map((reply) => ({
              user: reply.author_name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author_id}`,
              time: reply.created_at
                ? formatDistanceToNow(new Date(reply.created_at), {
                    addSuffix: true,
                  })
                : "just now",
              text: reply.content,
              isProfessor: reply.is_professor,
            })),
            showReplies: false,
            professorReply: question.reply_content || undefined,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${question.author_id}`,
          })),
      );
      setAvailableTags((prev) => [
        "All Tags",
        ...new Set([
          ...prev.filter((tag) => tag !== "All Tags"),
          ...questions.questions.flatMap((question) => question.tags ?? []),
        ]),
      ]);
    });
  }, [session?.userId, filter, activitySearch, selectedTag]);

  const toggleReplies = (id: string | number) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, showReplies: !a.showReplies } : a,
      ),
    );
  };

  const postReply = async (id: string | number, text: string) => {
    if (!text.trim() || !session?.userId) return;
    try {
      const reply = await createStudentQuestionReply(session.userId, String(id), {
        content: text.trim(),
      });
      setActivities((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                showReplies: true,
                replies: [
                  ...a.replies,
                  {
                    user: reply.author_name,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author_id}`,
                    time: reply.created_at
                      ? formatDistanceToNow(new Date(reply.created_at), {
                          addSuffix: true,
                        })
                      : "just now",
                    text: reply.content,
                    isProfessor: reply.is_professor,
                  },
                ],
              }
            : a,
        ),
      );
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
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
    tags,
    anonymous,
  }: {
    title: string;
    detail: string;
    tags: string[];
    anonymous: boolean;
  }) => {
    if (!data || !session?.userId || !data.session.course_code) return;

    createStudentQuestion(session.userId, {
      course_code: data.session.course_code,
      title,
      detail,
      tags,
      is_anonymous: anonymous,
    })
      .then((question) => {
        const newPost: Activity = {
          id: question.id,
          authorId: session.userId,
          canEdit: true,
          user: question.is_anonymous ? "ไม่ระบุตัวตน" : question.author_name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.userId}`,
          time: "just now",
          content: question.title || question.content,
          subContent: question.content,
          tags: question.tags ?? tags,
          status: "UNANSWERED",
          type: "question",
          replies: [],
          showReplies: false,
        };
        setActivities((prev) => [newPost, ...prev]);
        setFilter("All");
        setIsPostOpen(false);
      })
      .catch(() => {
        setIsPostOpen(false);
      });
  };

  const handleEditPost = (activity: Activity) => {
    if (!session?.userId || activity.authorId !== session.userId) {
      return;
    }
    setEditingActivity(activity);
    setEditTitle(activity.content || "");
    setEditDetail(activity.subContent || "");
    setEditError("");
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!session?.userId || !editingActivity) {
      return;
    }
    if (!editTitle.trim()) {
      setEditError("หัวข้อคำถามห้ามว่าง");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    updateStudentQuestion(session.userId, String(editingActivity.id), {
      title: editTitle.trim(),
      detail: editDetail.trim(),
    })
      .then((updated) => {
        setActivities((prev) =>
          prev.map((item) =>
            item.id === editingActivity.id
              ? {
                  ...item,
                  content: updated.title || editTitle.trim(),
                  subContent:
                    updated.content && updated.content !== updated.title
                      ? updated.content
                      : undefined,
                  time: "just now",
                }
              : item,
          ),
        );
        setIsEditOpen(false);
        setEditingActivity(null);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "แก้ไขคำถามไม่สำเร็จ";
        setEditError(message);
      })
      .finally(() => {
        setIsSavingEdit(false);
      });
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

          <div className="flex flex-wrap items-center gap-4">
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

            <select
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              className="h-9 rounded-full border border-slate-200 bg-white px-4 pr-8 text-sm text-slate-500 focus:outline-none"
            >
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-6 min-h-[60vh] transition-all duration-200">
            {filteredActivities.map((item) => (
              <StudentActivityCard
                key={item.id}
                data={item}
                onToggleReplies={toggleReplies}
                onPostReply={postReply}
                onEditPost={handleEditPost}
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
      <EditPostModal
        isOpen={isEditOpen}
        onClose={() => {
          if (isSavingEdit) return;
          setIsEditOpen(false);
          setEditingActivity(null);
          setEditError("");
        }}
        title={editTitle}
        detail={editDetail}
        onTitleChange={setEditTitle}
        onDetailChange={setEditDetail}
        onSave={handleSaveEdit}
        error={editError}
        isSaving={isSavingEdit}
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

function EditPostModal({
  isOpen,
  onClose,
  title,
  detail,
  onTitleChange,
  onDetailChange,
  onSave,
  error,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  detail: string;
  onTitleChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onSave: () => void;
  error?: string;
  isSaving?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1B1B1B]">Edit Question</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">
              หัวข้อคำถาม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="เช่น ไก่กับไข่อะไรเกิดก่อนกัน"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 transition"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={detail}
              onChange={(e) => onDetailChange(e.target.value)}
              placeholder="อธิบายคำถามเพิ่มเติม"
              rows={4}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 transition resize-none"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !title.trim()}
            className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-[#6443D9] to-[#EA60AB] text-white text-sm font-medium shadow-md disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            {isSaving ? "Saving..." : "Save Changes"}
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
  onEditPost,
}: {
  data: Activity;
  onToggleReplies: (id: string | number) => void;
  onPostReply: (id: string | number, text: string) => void;
  onEditPost: (activity: Activity) => void;
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

              {data.tags?.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

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
                {data.canEdit ? (
                  <button
                    onClick={() => onEditPost(data)}
                    className="text-slate-400 hover:text-[#D1388D] transition-colors"
                  >
                    edit
                  </button>
                ) : null}
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
