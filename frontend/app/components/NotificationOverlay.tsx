"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "answered",
    message: "อาจารย์ตอบคำถามของคุณในคาบแล้ว!",
    question: {
      user: "สมปอง กุ๊กกิ๊ก",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
      time: "2m ago",
      course: "CS232 · INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY",
      content:
        "ทำไมต้องตั้ง Source เป็น Web Security Group แทนที่จะใส่ IP หรือ 0.0.0.0/0 แล้วมันส่งผลกับการเข้าถึง DB ยังไง?",
      status: ["ANSWERED", "BOARD"],
    },
    read: false,
  },
  {
    id: 2,
    type: "answered",
    message: "อาจารย์ตอบคำถามของคุณแล้ว! สามารถดูคำตอบได้เลย",
    question: {
      user: "สมปอง กุ๊กกิ๊ก",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
      time: "2m ago",
      course: "CS232 · INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY",
      content: "ไก่กับไข่อะไรเกิดก่อนกัน",
      status: ["ANSWERED"],
    },
    read: false,
  },
  {
    id: 3,
    type: "peer",
    message: "มีเพื่อนตอบคำถามของคุณแล้ว! สามารถดูคำตอบได้เลย",
    question: {
      user: "สมปอง กุ๊กกิ๊ก",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong",
      time: "2m ago",
      course: "CS232 · INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY",
      content: "ไก่กับไข่อะไรเกิดก่อนกัน",
      status: ["ANSWERED"],
    },
    read: true,
  },
];

const statusColors: Record<string, string> = {
  ANSWERED: "text-emerald-500 bg-emerald-50",
  UNANSWERED: "text-orange-400 bg-orange-50",
  BOARD: "text-red-400 bg-red-50",
};

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function NotificationOverlay({
  isOpen,
  onClose,
  anchorRef,
}: NotificationOverlayProps) {
  const [filter, setFilter] = useState<"All" | "Answered" | "Unanswered">(
    "All",
  );
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
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
    if (filter === "Answered") return n.question.status.includes("ANSWERED");
    if (filter === "Unanswered")
      return n.question.status.includes("UNANSWERED");
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed top-[80px] right-8 z-[100] w-[560px] max-h-[80vh] bg-white rounded-[28px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
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
          className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none ml-2"
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            ไม่มีการแจ้งเตือน
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 transition-all cursor-pointer ${
                n.read ? "bg-white" : "bg-[#F5F3FF]"
              } hover:bg-slate-50`}
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((item) =>
                    item.id === n.id ? { ...item, read: true } : item,
                  ),
                )
              }
            >
              {/* Notification message */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#5B41FF] flex items-center justify-center text-white text-xs">
                  ✦
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {n.message}
                </p>
                {!n.read && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#5B41FF] flex-shrink-0" />
                )}
              </div>

              {/* Question card */}
              <div className="bg-white border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img
                      src={n.question.avatar}
                      className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0"
                      alt=""
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-700 flex-shrink-0">
                          {n.question.user}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {n.question.time}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-tight truncate">
                        {n.question.course}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {n.question.status.map((s) => (
                      <span
                        key={s}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusColors[s]}`}
                      >
                        {s === "ANSWERED" && (
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
                        )}
                        {s === "BOARD" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        )}
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {n.question.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
