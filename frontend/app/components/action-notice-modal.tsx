"use client";

import { AlertTriangle, BellRing, ShieldAlert, Sparkles, X } from "lucide-react";

type NoticeTone = "info" | "warning" | "danger" | "success";

interface ActionNoticeModalProps {
  isOpen: boolean;
  tone?: NoticeTone;
  badge?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

function toneStyles(tone: NoticeTone) {
  if (tone === "warning") {
    return {
      badge: "bg-[#FFF4E8] text-[#D97706]",
      iconWrap: "bg-[#FFF4E8] text-[#D97706]",
      panel: "bg-[linear-gradient(135deg,#FFF8EF_0%,#FFF6FB_100%)]",
      button: "from-[#F59E0B] to-[#EC4899]",
      icon: AlertTriangle,
    };
  }

  if (tone === "danger") {
    return {
      badge: "bg-rose-50 text-rose-600",
      iconWrap: "bg-rose-50 text-rose-600",
      panel: "bg-[linear-gradient(135deg,#FFF2F5_0%,#FFF8FB_100%)]",
      button: "from-[#F45B87] to-[#D33D86]",
      icon: ShieldAlert,
    };
  }

  if (tone === "success") {
    return {
      badge: "bg-emerald-50 text-emerald-600",
      iconWrap: "bg-emerald-50 text-emerald-600",
      panel: "bg-[linear-gradient(135deg,#F1FFF7_0%,#F7FFFB_100%)]",
      button: "from-[#10B981] to-[#34D399]",
      icon: Sparkles,
    };
  }

  return {
    badge: "bg-[#F3EEFF] text-[#6C56EC]",
    iconWrap: "bg-[#F3EEFF] text-[#6C56EC]",
    panel: "bg-[linear-gradient(135deg,#F8F4FF_0%,#FFF7FB_100%)]",
    button: "from-[#5B41FF] to-[#D94FA2]",
    icon: BellRing,
  };
}

export default function ActionNoticeModal({
  isOpen,
  tone = "info",
  badge = "Notice",
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  hideCancel = false,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ActionNoticeModalProps) {
  if (!isOpen) {
    return null;
  }

  const styles = toneStyles(tone);
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F163F]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-[0_28px_80px_rgba(74,48,147,0.28)]">
        <div className="flex items-start justify-between gap-4 px-7 pb-4 pt-7 sm:px-8 sm:pt-8">
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${styles.badge}`}
            >
              <Icon size={14} />
              {badge}
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#241B47]">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-[#7B719D]">
              {description}
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
          <div className={`rounded-[28px] p-5 ${styles.panel}`}>
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}
              >
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#261F46]">
                  AskAdemy action notice
                </p>
                <p className="mt-2 text-sm leading-7 text-[#7B719D]">
                  Please review this action before continuing. You can safely close
                  this message and return later if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 px-7 py-6 sm:flex-row sm:justify-end sm:px-8">
          {!hideCancel ? (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm ?? onClose}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(122,89,205,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
