"use client";

import { useEffect, useState } from "react";
import { Copy, RefreshCw, Timer, X } from "lucide-react";
import type { ProfessorJoinCodeResponse } from "../lib/api";

const JOIN_CODE_TIME_ZONE = "Asia/Bangkok";

interface GenerateJoinCodeProps {
  isOpen: boolean;
  courseCode: string;
  sectionCode?: string | null;
  joinCode: ProfessorJoinCodeResponse | null;
  isLoading?: boolean;
  error?: string;
  onClose: () => void;
  onGenerate: () => void;
}

function formatTarget(courseCode: string, sectionCode?: string | null) {
  if (sectionCode?.trim()) {
    return `${courseCode} / ${sectionCode.trim().toUpperCase()}`;
  }
  return `${courseCode} / COURSE`;
}

function parseApiDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatRemaining(expiresAt: string, nowMs: number) {
  const expiresAtDate = parseApiDate(expiresAt);
  if (!expiresAtDate) {
    return "Unavailable";
  }

  const diffMs = expiresAtDate.getTime() - nowMs;
  if (diffMs <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}

function getRemainingMs(expiresAt?: string | null, nowMs?: number) {
  if (!expiresAt || !nowMs) {
    return 0;
  }

  const expiresAtDate = parseApiDate(expiresAt);
  if (!expiresAtDate) {
    return 0;
  }

  return Math.max(expiresAtDate.getTime() - nowMs, 0);
}

function getLifetimeMs(joinCode: ProfessorJoinCodeResponse | null) {
  if (!joinCode?.created_at || !joinCode.expires_at) {
    return 15 * 60 * 1000;
  }

  const createdAtDate = parseApiDate(joinCode.created_at);
  const expiresAtDate = parseApiDate(joinCode.expires_at);
  if (!createdAtDate || !expiresAtDate) {
    return 15 * 60 * 1000;
  }

  const createdAtMs = createdAtDate.getTime();
  const expiresAtMs = expiresAtDate.getTime();
  if (expiresAtMs <= createdAtMs) {
    return 15 * 60 * 1000;
  }

  return expiresAtMs - createdAtMs;
}

function formatExpiresAt(expiresAt?: string | null) {
  if (!expiresAt) {
    return "Expires 15 minutes after generation";
  }

  const parsed = parseApiDate(expiresAt);
  if (!parsed) {
    return "Expires 15 minutes after generation";
  }

  return `Expires at ${parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: JOIN_CODE_TIME_ZONE,
  })} (${JOIN_CODE_TIME_ZONE})`;
}

function formatGeneratedAt(createdAt?: string | null) {
  const parsed = parseApiDate(createdAt);
  if (!parsed) {
    return null;
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: JOIN_CODE_TIME_ZONE,
  });
}

export default function GenerateJoinCode({
  isOpen,
  courseCode,
  sectionCode,
  joinCode,
  isLoading = false,
  error = "",
  onClose,
  onGenerate,
}: GenerateJoinCodeProps) {
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isOpen || !joinCode?.expires_at) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen, joinCode?.expires_at]);

  const remainingText = !joinCode?.expires_at
    ? "Valid for 15 minutes after generation"
    : formatRemaining(joinCode.expires_at, now);
  const remainingMs = getRemainingMs(joinCode?.expires_at, now);
  const lifetimeMs = getLifetimeMs(joinCode);
  const countdownPercent =
    lifetimeMs > 0 ? Math.max(0, Math.min((remainingMs / lifetimeMs) * 100, 100)) : 0;
  const isExpired = Boolean(joinCode?.expires_at) && remainingMs <= 0;

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    if (!joinCode?.code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(joinCode.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-8 pb-4 pt-8">
          <div>
            <h2 className="text-xl font-medium text-[#1B1B1B]">Generate Join Code</h2>
            <p className="mt-1 text-sm text-[#8F86B6]">
              Code จะใช้ได้ 15 นาที และหมดเวลาแล้วต้อง generate ใหม่
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5 px-8 pb-8">
          <div className="rounded-2xl bg-[#F7F4FF] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F86B6]">
              Target
            </p>
            <p className="mt-2 text-lg font-semibold text-[#352E53]">
              {formatTarget(courseCode, sectionCode)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F86B6]">
              Current Join Code
            </p>

            <div className="mt-4 rounded-[24px] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F86B6]">
                    Time Remaining
                  </p>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      isExpired ? "text-rose-500" : "text-[#513FDF]"
                    }`}
                  >
                    {remainingText}
                  </p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isExpired
                      ? "bg-rose-50 text-rose-500"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {isExpired ? "Expired" : "Active"}
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEE9FF]">
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ${
                    isExpired
                      ? "bg-gradient-to-r from-rose-400 to-rose-500"
                      : "bg-gradient-to-r from-[#5B41FF] to-[#D94FA2]"
                  }`}
                  style={{ width: `${countdownPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-[#8F86B6]">
                {formatExpiresAt(joinCode?.expires_at)}
              </p>
              {joinCode?.created_at ? (
                <p className="mt-1 text-xs text-[#B0A7D5]">
                  Generated at {formatGeneratedAt(joinCode.created_at)}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.2em] text-[#4A3BE0] shadow-sm">
                {joinCode?.code || "No active code"}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!joinCode?.code}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#CFC2F7] hover:text-[#5B41FF] disabled:opacity-40"
              >
                <Copy size={18} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-[#8F86B6]">
              <Timer size={16} />
              <span>{copied ? "Copied" : isExpired ? "This code is no longer valid" : "Share this code before the timer runs out"}</span>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={isLoading || !courseCode.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5B41FF] to-[#D94FA2] py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-40"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              {joinCode ? "Generate New Code" : "Generate Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
