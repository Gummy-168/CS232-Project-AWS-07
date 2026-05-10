"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  createProfessorSection,
  type ProfessorSectionResponse,
} from "../lib/api";
import { useAuthSession } from "../hooks/useAuthSession";

interface CreateSectionProps {
  isOpen: boolean;
  courseCode: string;
  onClose: () => void;
  onSectionCreated?: (section: ProfessorSectionResponse) => void;
}

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialForm = {
  sectionCode: "",
  startTime: "13:00",
  endTime: "16:00",
};

export default function CreateSection({
  isOpen,
  courseCode,
  onClose,
  onSectionCreated,
}: CreateSectionProps) {
  const { session } = useAuthSession();
  const [form, setForm] = useState(initialForm);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const reset = () => {
    setForm(initialForm);
    setSelectedDays([]);
    setError("");
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    reset();
    onClose();
  };

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  };

  const handleCreate = async () => {
    if (!courseCode.trim()) {
      setError("Course code is required");
      return;
    }
    if (!form.sectionCode.trim()) {
      setError("กรุณากรอกรหัส Sec");
      return;
    }
    if (selectedDays.length === 0) {
      setError("กรุณาเลือกวันเรียนอย่างน้อย 1 วัน");
      return;
    }
    if (!session?.userId || session.role !== "professor") {
      setError("กรุณา login ด้วยบัญชีอาจารย์ก่อนสร้าง Sec");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdSection = await createProfessorSection(
        session.userId,
        courseCode,
        {
          section_code: form.sectionCode.trim().toUpperCase(),
          meeting_days: selectedDays,
          start_time: form.startTime,
          end_time: form.endTime,
          is_active: true,
        },
      );

      window.dispatchEvent(
        new CustomEvent("askademy-section-created", { detail: createdSection }),
      );
      onSectionCreated?.(createdSection);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create section failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-8 pb-4 pt-8">
          <div>
            <h2 className="text-xl font-medium text-[#1B1B1B]">Create Sec</h2>
            <p className="mt-1 text-sm text-[#8F86B6]">
              Add a new section under this course
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5 px-8 pb-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              รหัสวิชา
            </label>
            <input
              type="text"
              value={courseCode}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              รหัส Sec <span className="font-normal text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น 100001 หรือ SEC-A"
              value={form.sectionCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sectionCode: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#5B41FF] focus:outline-none focus:ring-2 focus:ring-[#5B41FF]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              วันเรียน
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dayOptions.map((day) => {
                const checked = selectedDays.includes(day);
                return (
                  <label
                    key={day}
                    className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                      checked
                        ? "border-[#5B41FF] bg-[#F5F2FF] text-[#4D3AE8]"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(day)}
                      className="h-4 w-4 rounded border-slate-300 text-[#5B41FF] focus:ring-[#5B41FF]"
                    />
                    <span>{day}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                เวลาเริ่ม
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#5B41FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#5B41FF] focus:outline-none"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 px-8 py-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!form.sectionCode.trim() || selectedDays.length === 0 || isSubmitting}
            className="flex-1 rounded-2xl bg-[#5B41FF] py-3 text-sm font-medium text-white transition hover:bg-[#4a34e0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Creating..." : "Create Sec"}
          </button>
        </div>
      </div>
    </div>
  );
}
