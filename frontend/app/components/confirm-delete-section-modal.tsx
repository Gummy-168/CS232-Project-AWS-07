"use client";

import { ShieldAlert, X } from "lucide-react";

interface ConfirmDeleteSectionModalProps {
  isOpen: boolean;
  courseCode: string;
  sectionLabel: string;
  enrolledCount: number;
  boardCount: number;
  confirmationValue: string;
  error?: string;
  isSubmitting?: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteSectionModal({
  isOpen,
  courseCode,
  sectionLabel,
  enrolledCount,
  boardCount,
  confirmationValue,
  error = "",
  isSubmitting = false,
  onChange,
  onClose,
  onConfirm,
}: ConfirmDeleteSectionModalProps) {
  if (!isOpen) {
    return null;
  }

  const expectedValue = sectionLabel.trim().toUpperCase();
  const isConfirmed = confirmationValue.trim().toUpperCase() === expectedValue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F163F]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-[0_28px_80px_rgba(74,48,147,0.28)]">
        <div className="flex items-start justify-between gap-4 px-7 pb-4 pt-7 sm:px-8 sm:pt-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
              <ShieldAlert size={14} />
              Delete Section
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#241B47]">
              Delete {sectionLabel}?
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-[#7B719D]">
              This will remove the section from {courseCode}. Students currently
              enrolled: {enrolledCount}. Board sessions in this section: {boardCount}.
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

        <div className="space-y-4 px-7 pb-2 sm:px-8">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#FFF2F5_0%,#FFF8FB_100%)] p-5">
            <p className="text-sm font-semibold text-[#261F46]">
              Type <span className="text-rose-600">{sectionLabel}</span> to confirm
            </p>
            <p className="mt-2 text-sm leading-7 text-[#7B719D]">
              This extra step helps prevent accidentally deleting the wrong section.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4B426D]">
              Confirmation
            </label>
            <input
              type="text"
              value={confirmationValue}
              onChange={(event) => onChange(event.target.value)}
              disabled={isSubmitting}
              placeholder={`Type ${sectionLabel}`}
              className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-[#241B47] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
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
            Keep Section
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#F45B87] to-[#D33D86] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,61,134,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Deleting..." : "Delete Sec"}
          </button>
        </div>
      </div>
    </div>
  );
}
