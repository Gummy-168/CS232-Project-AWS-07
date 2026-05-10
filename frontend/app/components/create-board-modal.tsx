"use client";

import { BookOpenText, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface CreateBoardModalProps {
  isOpen: boolean;
  courseCode: string;
  sectionCode?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (boardTitle: string) => Promise<void> | void;
}

export default function CreateBoardModal({
  isOpen,
  courseCode,
  sectionCode,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CreateBoardModalProps) {
  const [boardTitle, setBoardTitle] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const normalizedTitle = boardTitle.trim();
    if (!normalizedTitle) {
      setError("Please enter a board title.");
      return;
    }

    setError("");
    await onSubmit(normalizedTitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F163F]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-[0_28px_80px_rgba(74,48,147,0.28)]">
        <div className="flex items-start justify-between gap-4 px-7 pb-4 pt-7 sm:px-8 sm:pt-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3EEFF] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6C56EC]">
              <Sparkles size={14} />
              Create Board
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#241B47]">
              Open a new board for this section
            </h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#7B719D]">
              Give this board a clear title so students can identify the session and
              you can review it later in the activity timeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-7 pb-2 sm:px-8">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#F8F4FF_0%,#FFF7FB_100%)] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6C56EC] shadow-[0_12px_26px_rgba(122,89,205,0.08)]">
                <BookOpenText size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#261F46]">
                  Session target
                </p>
                <p className="mt-2 text-sm leading-7 text-[#7B719D]">
                  {courseCode}
                  {sectionCode ? ` · SEC ${sectionCode}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="board-title"
              className="mb-2 block text-sm font-semibold text-[#4C456C]"
            >
              Board title
            </label>
            <input
              id="board-title"
              type="text"
              value={boardTitle}
              onChange={(event) => setBoardTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="e.g. Week 6 - AWS Deployment"
              disabled={isSubmitting}
              autoFocus
              className="w-full rounded-2xl border border-[#E6DFFD] bg-white px-4 py-3 text-sm text-[#2B2448] outline-none transition focus:border-[#8B63F7] focus:ring-2 focus:ring-[#8B63F7]/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 px-7 py-6 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#5B41FF] to-[#D94FA2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(122,89,205,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Opening..." : "Open Board"}
          </button>
        </div>
      </div>
    </div>
  );
}
