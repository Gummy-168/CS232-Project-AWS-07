"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import JoinCourse from "../../../components/joincourse";
import Header from "../../../components/Header";
import { createStudentQuestionReply, getStudentQuestions } from "../../../lib/api";
import { useAuthSession } from "../../../hooks/useAuthSession";
import { buildCourseQueryString } from "../../../lib/section-code";

type FeedFilter = "All" | "Answered" | "Unanswered" | "Board Questions" | "General Questions";

type Reply = {
  user: string;
  avatar: string;
  time: string;
  text: string;
  isProfessor: boolean;
};

type Activity = {
  id: string;
  subject: string;
  section: string;
  boardId?: string | null;
  boardTitle?: string | null;
  questionKind: "board" | "general";
  user: string;
  time: string;
  content: string;
  title?: string;
  tags: string[];
  status: "UNANSWERED" | "ANSWERED" | "DELETED";
  type: "question";
  replies: Reply[];
  showReplies: boolean;
  professorReply?: string;
  avatar: string;
  subContent?: string;
};
/* ---------------- MAIN COMPONENT ---------------- */

export default function Allquestions() {
  const { session } = useAuthSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("All");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedTag, setSelectedTag] = useState("All Tags");
  const [subjects, setSubjects] = useState<string[]>(["All Subjects"]);
  const [tags, setTags] = useState<string[]>(["All Tags"]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

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
    getStudentQuestions(session.userId, {
      scope: "mine",
      courseCode:
        selectedSubject === "All Subjects" ? undefined : selectedSubject,
      status,
      search: activitySearch || undefined,
      tag: selectedTag === "All Tags" ? undefined : selectedTag,
    }).then((response) => {
      setActivities(
        response.questions
          .filter((item) => item.status !== "DELETED")
          .map((item) => ({
            id: item.id,
            subject: item.course_code,
            section: item.section_code ? `SEC ${item.section_code}` : "",
            boardId: item.board_id ?? null,
            boardTitle: item.board_title ?? null,
            questionKind: item.board_id ? "board" : "general",
            user: item.author_name,
            time: item.created_at
              ? formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })
              : "just now",
            title: item.title,
            content: item.content,
            tags: item.tags ?? [],
            status: item.status,
            type: "question",
            replies: (item.replies ?? []).map((reply) => ({
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
            professorReply: item.reply_content || undefined,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}`,
          })),
      );
      setSubjects((prev) => [
        "All Subjects",
        ...new Set([
          ...prev.filter((subject) => subject !== "All Subjects"),
          ...response.questions.map((item) => item.course_code),
        ]),
      ]);
      setTags((prev) => [
        "All Tags",
        ...new Set([
          ...prev.filter((tag) => tag !== "All Tags"),
          ...response.questions.flatMap((item) => item.tags ?? []),
        ]),
      ]);
    });
  }, [session?.userId, filter, selectedSubject, selectedTag, activitySearch]);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const status = item.status?.toUpperCase().trim();
      const matchesFilter =
        filter === "All" ||
        (filter === "Board Questions" && item.questionKind === "board") ||
        (filter === "General Questions" && item.questionKind === "general") ||
        (filter === "Answered" && status === "ANSWERED") ||
        (filter === "Unanswered" && status === "UNANSWERED");
      const matchesSubject =
        selectedSubject === "All Subjects" || item.subject === selectedSubject;

      const searchLower = activitySearch.toLowerCase().trim();
      const matchesSearch =
        item.user.toLowerCase().includes(searchLower) ||
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        item.content.toLowerCase().includes(searchLower) ||
        (item.boardTitle && item.boardTitle.toLowerCase().includes(searchLower)) ||
        (item.subContent &&
          item.subContent.toLowerCase().includes(searchLower));

      return matchesFilter && matchesSearch && matchesSubject;
    });
  }, [activities, filter, activitySearch, selectedSubject]);

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FCF9F8] min-h-screen font-sans text-slate-700">
      <Header
        studentName={session?.nickname}
        studentId={session?.userId}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        mode="myquestions"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <main className="p-8 pt-[250px] space-y-6 h-full overflow-y-auto pb-10">
        {/* ACTIVITY TIMELINE */}
        <section className="max-w-6xl mx-auto mt-10">
          <div className="fixed top-[120px] left-64 right-0 z-10 bg-[#FCF9F8] pt-2 pb-4 px-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                {["All", "Answered", "Unanswered", "Board Questions", "General Questions"].map((btnLabel) => (
                  <button
                    key={btnLabel}
                    onClick={() => setFilter(btnLabel as FeedFilter)}
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
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <span className="text-sm text-slate-500 mr-2">Tag:</span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    selectedTag === tag
                      ? "bg-[#D1388D] text-white"
                      : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {tag}
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
function StudentActivityCard({
  data,
  onToggleReplies,
  onPostReply,
}: {
  data: Activity;
  onToggleReplies: (id: string) => void;
  onPostReply: (id: string, text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const isAnswered = data.status?.toUpperCase().trim() === "ANSWERED";
  const isBoardQuestion = data.questionKind === "board";

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
            : isBoardQuestion
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
        ) : isBoardQuestion ? (
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
        <img src={data.avatar} alt="" className="w-12 h-12 rounded-full" />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {(data.subject || data.section) && (
              <span className="text-[11px] font-medium bg-gray-100 text-gray-400 px-2.5 py-1 rounded-lg tracking-wide uppercase">
                {[data.subject, data.section].filter(Boolean).join(" | ")}
              </span>
            )}
            <span className="text-[11px] font-medium bg-[#F4F0FF] text-[#6F63A8] px-2.5 py-1 rounded-lg tracking-wide uppercase">
              {isBoardQuestion ? "Board Question" : "General Question"}
            </span>
            {data.boardTitle ? (
              <span className="text-[11px] font-medium bg-[#FFF6EC] text-[#D97706] px-2.5 py-1 rounded-lg tracking-wide uppercase">
                {data.boardTitle}
              </span>
            ) : null}
            <span className="font-bold text-slate-800">{data.user}</span>
            <span className="text-xs text-slate-400">{data.time}</span>
          </div>

          <div>
              {data.title && data.title !== data.content ? (
                <h3 className="mb-2 text-lg font-semibold text-slate-800">{data.title}</h3>
              ) : null}
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
              {data.replies?.some((r) => r.isProfessor) && (
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
                  {data.replies?.filter((r) => !r.isProfessor).length > 0
                    ? data.replies.filter((r) => !r.isProfessor).length
                    : ""}{" "}
                  {data.showReplies ? "ซ่อน replies" : "reply"}
                </button>
                {isBoardQuestion && data.boardId ? (
                  <Link
                    href={`/student/courses/board?${buildCourseQueryString(
                      data.subject,
                      data.section,
                    )}&board_id=${encodeURIComponent(data.boardId)}`}
                    className="text-[#5B41FF] hover:text-[#4338CA] font-medium transition-colors"
                  >
                    View Board
                  </Link>
                ) : null}
              </div>

              {/* Student replies*/}
              {data.showReplies && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {data.replies
                    ?.filter((r) => !r.isProfessor)
                    .map((r, i: number) => (
                      <div key={i} className="flex gap-3">
                        <img
                          src={r.avatar}
                          alt=""
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
                      alt=""
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
        </div>
      </div>
    </div>
  );
}
