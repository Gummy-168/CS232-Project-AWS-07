"use client";

import { AlertTriangle, Lock, MessagesSquare, X } from "lucide-react";

interface ConfirmCloseBoardModalProps {
  isOpen: boolean;
  boardTitle: string;
  courseCode: string;
  sectionCode?: string;
  questionCount: number;
  pendingCount: number;
  isSubmitting?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmCloseBoardModal({
  isOpen,
  boardTitle,
  courseCode,
  sectionCode,
  questionCount,
  pendingCount,
  isSubmitting = false,
  error = "",
  onClose,
  onConfirm,
}: ConfirmCloseBoardModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F163F]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-[0_28px_80px_rgba(74,48,147,0.28)]">
        <div className="flex items-start justify-between gap-4 px-7 pb-4 pt-7 sm:px-8 sm:pt-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F7] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#D33D86]">
              <AlertTriangle size={14} />
              Confirm Close Board
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#241B47]">
              Close this board now?
            </h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#7B719D]">
              Students will no longer be able to post new questions to this board
              after it is closed.
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
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#FBF6FF_0%,#FFF6FB_100%)] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8A7CB7]">
                {courseCode}
              </span>
              {sectionCode ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8A7CB7]">
                  {sectionCode}
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 text-xl font-semibold text-[#251D47]">
              {boardTitle}
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-4 shadow-[0_12px_26px_rgba(122,89,205,0.08)]">
                <div className="flex items-center gap-2 text-[#6A56E8]">
                  <MessagesSquare size={18} />
                  <p className="text-xs font-bold uppercase tracking-[0.14em]">
                    Questions
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold text-[#251D47]">
                  {questionCount}
                </p>
                <p className="mt-1 text-sm text-[#8A7CB7]">Total in this board</p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4 shadow-[0_12px_26px_rgba(122,89,205,0.08)]">
                <div className="flex items-center gap-2 text-[#D04B79]">
                  <Lock size={18} />
                  <p className="text-xs font-bold uppercase tracking-[0.14em]">
                    Impact
                  </p>
                </div>
                <p className="mt-3 text-3xl font-bold text-[#251D47]">
                  {pendingCount}
                </p>
                <p className="mt-1 text-sm text-[#8A7CB7]">
                  Pending questions remain open for review
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-600">
            Closing a board stops new submissions only. Existing questions and
            activity history will still remain available for review.
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
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
            Keep Board Open
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#F45B87] to-[#D33D86] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,61,134,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Closing..." : "Close Board"}
          </button>
        </div>
      </div>
    </div>
  );
}
