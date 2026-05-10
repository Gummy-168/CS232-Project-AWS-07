"use client";

import React, { useState, useMemo, useEffect } from "react";
import { CornerDownLeft, ChevronRight, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import JoinCourse from "../../../components/joincourse";
import Header from "../../../components/Header";
import { createStudentQuestionReply, getStudentQuestions } from "../../../lib/api";
import { parseApiDate } from "../../../lib/date-time";
import { useAuthSession } from "../../../hooks/useAuthSession";
import { buildCourseQueryString, formatSectionLabel } from "../../../lib/section-code";

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

const avatarFor = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function initialsFromSeed(seed: string) {
  const normalized = seed.trim();
  if (!normalized) return "?";
  const chunks = normalized.split(/[\s\-_]+/).filter(Boolean);
  if (chunks.length >= 2) {
    return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
  }
  return normalized.slice(0, 2).toUpperCase();
}

function Avatar({ seed, alt }: { seed: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#6A5BFF] to-[#E34BA9] text-xs font-semibold text-white shadow-sm">
        {initialsFromSeed(seed)}
      </div>
    );
  }
  return (
    <img
      src={avatarFor(seed)}
      alt={alt}
      className="h-11 w-11 rounded-full bg-slate-100 object-cover shadow-sm"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

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
                    avatar: avatarFor(reply.author_id),
                    time: reply.created_at
                      ? formatDistanceToNow(parseApiDate(reply.created_at) ?? new Date(), {
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
    if (!session?.userId) return;
    const status: "all" | "answered" | "unanswered" =
      filter === "Answered"
        ? "answered"
        : filter === "Unanswered"
          ? "unanswered"
          : "all";
    getStudentQuestions(session.userId, {
      scope: "all",
      courseCode: selectedSubject === "All Subjects" ? undefined : selectedSubject,
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
            user: item.is_anonymous ? "Anonymous" : item.author_name,
            time: item.created_at
              ? formatDistanceToNow(parseApiDate(item.created_at) ?? new Date(), {
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
              avatar: avatarFor(reply.author_id),
              time: reply.created_at
                ? formatDistanceToNow(parseApiDate(reply.created_at) ?? new Date(), {
                    addSuffix: true,
                  })
                : "just now",
              text: reply.content,
              isProfessor: reply.is_professor,
            })),
            showReplies: false,
            professorReply: item.reply_content || undefined,
            avatar: avatarFor(item.author_id),
          })),
      );
      setSubjects((prev) => [
        "All Subjects",
        ...new Set([
          ...prev.filter((s) => s !== "All Subjects"),
          ...response.questions.map((item) => item.course_code),
        ]),
      ]);
      setTags((prev) => [
        "All Tags",
        ...new Set([
          ...prev.filter((t) => t !== "All Tags"),
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
        (item.subContent && item.subContent.toLowerCase().includes(searchLower));
      return matchesFilter && matchesSearch && matchesSubject;
    });
  }, [activities, filter, activitySearch, selectedSubject]);

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex-1 bg-[#FCF9F8] min-h-screen font-sans text-slate-700">
      <Header
        studentName={session?.nickname}
        studentId={session?.userId}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        mode="allquestions"
      />

      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <main className="p-8 pt-[250px] space-y-6 h-full overflow-y-auto pb-10">
        <section className="max-w-6xl mx-auto mt-10">
          <div className="fixed top-[120px] left-64 right-0 z-10 bg-[#FCF9F8] pt-2 pb-4 px-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(["All", "Answered", "Unanswered", "Board Questions", "General Questions"] as FeedFilter[]).map(
                  (btnLabel) => (
                    <button
                      key={btnLabel}
                      onClick={() => setFilter(btnLabel)}
                      className={`px-5 py-1.5 rounded-full text-sm transition-all border ${
                        filter === btnLabel
                          ? "bg-[#5B41FF] text-white border-[#5B41FF]"
                          : "text-slate-400 border-slate-200 hover:bg-slate-200 bg-white"
                      }`}
                    >
                      {btnLabel}
                    </button>
                  ),
                )}
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

          <div className="space-y-5 min-h-[60vh] transition-all duration-200">
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

/* ---------------- CARD COMPONENT ---------------- */
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

  const handleSend = () => {
    onPostReply(data.id, draft);
    setDraft("");
  };

  return (
    <article className="rounded-[28px] bg-white px-5 py-5 shadow-[0_14px_32px_rgba(104,74,191,0.06)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar seed={data.avatar} alt={`${data.user} avatar`} />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-lg font-medium text-slate-800">{data.user}</span>
              <span className="text-xs text-slate-400">{data.time}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {data.section ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {data.section}
                </span>
              ) : null}
              {data.subject ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {data.subject}
                </span>
              ) : null}
              <span className="rounded-full bg-[#FFF3E8] px-2.5 py-0.5 text-xs font-medium text-[#D97706]">
                {data.questionKind === "board" ? "Board Question" : "General Question"}
              </span>
              {data.boardTitle ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                  {data.boardTitle}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Status pill */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
            isAnswered
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {isAnswered ? "● ANSWERED" : "● UNANSWERED"}
        </span>
      </div>

      {/* Content */}
      <div className="ml-14 mt-2">

        {data.title ? (
                              <p className="text-xl font-medium text-slate-800 mt-5">
                                {data.title}
                              </p>
                            ) : null}
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {data.content}
                            </p>

        {data.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
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

        {/* Reply button + View Board link */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onToggleReplies(data.id)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-violet-500"
          >
            <CornerDownLeft size={13} />
            {data.replies.length > 0 ? `${data.replies.length} replies` : "Reply"}
          </button>
          {data.questionKind === "board" && data.boardId ? (
            <Link
              href={`/student/courses/board?${buildCourseQueryString(data.subject, data.section)}&board_id=${encodeURIComponent(data.boardId)}`}
              className="text-sm font-medium text-[#5B41FF] hover:opacity-75 transition"
            >
              View Board
            </Link>
          ) : null}
        </div>

        {/* Replies section */}
        {(data.showReplies || data.professorReply || data.replies.some((r) => r.isProfessor)) ? (
          <div className="mt-5 space-y-3 border-t border-[#F1ECFF] pt-5">
            {/* Professor reply (string) */}
            {data.professorReply ? (
              <div className="rounded-[22px] px-4 py-4 bg-[#EFFFF6] text-[#275E47]">
                <span className="text-xs font-bold uppercase tracking-[0.14em]">
                  Professor Reply
                </span>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {data.professorReply}
                </p>
              </div>
            ) : null}

            {/* All replies (professor + student) */}
            {data.replies.map((reply, i) => (
              <div
                key={i}
                className={`rounded-[22px] px-4 py-4 ${
                  reply.isProfessor
                    ? "bg-[#EFFFF6] text-[#275E47]"
                    : "bg-[#F6F4FF] text-[#4B4170]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.14em]">
                    {reply.isProfessor ? "Professor Reply" : reply.user}
                  </span>
                  <span className="text-xs opacity-70">{reply.time}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{reply.text}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Reply compose box */}
        {data.showReplies ? (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a reply..."
              className="w-full resize-none bg-transparent text-sm leading-5 text-slate-700 outline-none placeholder:text-slate-400"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#5B41FF] to-[#8B63F7] px-4 py-1.5 text-sm font-medium text-white hover:opacity-80 transition disabled:opacity-40 cursor-pointer"
              >
                Post Reply
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}