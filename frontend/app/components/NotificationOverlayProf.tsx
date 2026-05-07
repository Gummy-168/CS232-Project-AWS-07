"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    question: {
      user: "สมปอง กุ๊กกิ๊ก",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
      time: "2m ago",
      course: "CS232 · INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY",
      content:
        "ทำไมต้องตั้ง Source เป็น Web Security Group แทนที่จะใส่ IP หรือ 0.0.0.0/0 แล้วมันส่งผลกับการเข้าถึง DB ยังไง?",
      status: "UNANSWERED",
    },
    read: false,
  },
  {
    id: 2,
    question: {
      user: "ทุงทุงทุง",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung",
      time: "5m ago",
      course: "CS232 · INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY",
      content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
      status: "UNANSWERED",
    },
    read: false,
  },
  {
    id: 3,
    question: {
      user: "มะพร้าว ส้มโอ",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coconut",
      time: "1h ago",
      course: "CS232 · INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY",
      content: "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้",
      status: "ANSWERED",
    },
    read: true,
  },
];

interface NotificationOverlayProfProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function NotificationOverlayProf({
  isOpen,
  onClose,
  anchorRef,
}: NotificationOverlayProfProps) {
  const [filter, setFilter] = useState<"All" | "Answered" | "Unanswered">(
    "All",
  );
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(e.target as Node) &&
        !anchorRef?.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const filtered = notifications.filter((n) => {
    if (filter === "All") return true;
    if (filter === "Answered") return n.question.status === "ANSWERED";
    if (filter === "Unanswered") return n.question.status === "UNANSWERED";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAnswered = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              read: true,
              question: { ...n.question, status: "ANSWERED" },
            }
          : n,
      ),
    );
    setReplyingId(null);
    setReplyText("");
  };

  const handlePostReply = (id: number) => {
    if (!replyText.trim()) return;
    handleMarkAnswered(id);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed top-[80px] right-8 z-[100] w-[580px] max-h-[80vh] bg-white rounded-[28px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] flex items-center justify-center text-lg">
            <Bell size={20} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1B1B1B]">Notification</h2>
          {unreadCount > 0 && (
            <span className="bg-[#5B41FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-full px-1 py-1">
            {(["All", "Answered", "Unanswered"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === f
                    ? "bg-white text-[#5B41FF] shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            ไม่มีการแจ้งเตือน
          </div>
        ) : (
          filtered.map((n) => {
            const isAnswered = n.question.status === "ANSWERED";
            const isReplying = replyingId === n.id;

            return (
              <div
                key={n.id}
                className={`rounded-2xl border transition-all ${
                  n.read
                    ? "bg-white border-slate-100"
                    : "bg-[#F5F3FF] border-[#E0DBFF]"
                }`}
              >
                {/* Question card */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={n.question.avatar}
                        className="w-8 h-8 rounded-full bg-slate-100"
                        alt=""
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700">
                          {n.question.user}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">
                            {n.question.time}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-tight">
                            · {n.question.course}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isAnswered
                          ? "text-emerald-500 bg-emerald-50"
                          : "text-orange-400 bg-orange-50"
                      }`}
                    >
                      {isAnswered ? (
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <circle cx="5" cy="5" r="5" fill="#34d399" />
                          <path
                            d="M2.5 5l1.8 1.8L7.5 3.5"
                            stroke="white"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
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
                      {n.question.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {n.question.content}
                  </p>

                  {/* Action buttons */}
                  {!isAnswered && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReplyingId(isReplying ? null : n.id);
                          setReplyText("");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isReplying
                            ? "text-[#5B41FF] border-[#5B41FF] bg-purple-50"
                            : "text-slate-500 border-slate-200 hover:border-[#5B41FF] hover:text-[#5B41FF]"
                        }`}
                      >
                        💬 ตอบคำถาม
                      </button>
                      <button
                        onClick={() => handleMarkAnswered(n.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 text-emerald-500 hover:bg-emerald-50 transition-all"
                      >
                        ✓ Mark Answered
                      </button>
                    </div>
                  )}
                </div>

                {/* Reply Box */}
                {isReplying && (
                  <div className="mx-4 mb-4 bg-[#F8F9FE] rounded-xl p-3 border border-slate-100">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="พิมพ์คำตอบในฐานะอาจารย์..."
                      className="w-full bg-transparent border-none resize-none text-sm focus:outline-none h-16 text-slate-600 placeholder:text-slate-400"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText("");
                        }}
                        className="text-slate-400 border border-slate-200 px-3 py-1 rounded-lg text-xs hover:bg-slate-50 transition-all"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => handlePostReply(n.id)}
                        disabled={!replyText.trim()}
                        className="bg-[#5B41FF] text-white px-4 py-1 rounded-lg text-xs hover:bg-[#4a34e0] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ส่งคำตอบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

