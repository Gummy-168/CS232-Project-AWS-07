"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createProfessorCourse, type ProfessorCourseResponse } from "../lib/api";
import { useAuthSession } from "../hooks/useAuthSession";

interface LegacyCourseDraft {
  courseNo: string;
  courseName: string;
  section: string;
  days: string[];
  startTime: string;
  endTime: string;
}

interface CreateCourseProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCourse?: (course: LegacyCourseDraft) => void;
  onCourseCreated?: (course: ProfessorCourseResponse) => void;
}

const initialForm = {
  courseNo: "",
  courseName: "",
  section: "",
  startTime: "13:00",
  endTime: "16:00",
};

const CreateCourse = ({
  isOpen,
  onClose,
  onCreateCourse,
  onCourseCreated,
}: CreateCourseProps) => {
  const router = useRouter();
  const { session } = useAuthSession();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setForm(initialForm);
    setSelectedDays([]);
    setError("");
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const courseCode = form.courseNo.trim().toUpperCase();
    const courseName = form.courseName.trim() || courseCode;

    if (!courseCode) {
      setError("กรุณากรอกรหัสวิชา");
      return;
    }
    if (!session?.userId || session.role !== "professor") {
      setError("กรุณา login ด้วยบัญชีอาจารย์ก่อนสร้างวิชา");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const createdCourse = await createProfessorCourse({
        course_code: courseCode,
        course_name: courseName,
        professor_id: session.userId,
        is_active: true,
      });

      onCreateCourse?.({
        courseNo: courseCode,
        courseName,
        section: form.section.trim(),
        days: selectedDays,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      onCourseCreated?.(createdCourse);
      window.dispatchEvent(
        new CustomEvent("askademy-course-created", { detail: createdCourse }),
      );
      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create course failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          <h2 className="text-xl font-medium text-[#1B1B1B]">Create Course</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-8 pb-2 space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">
              รหัสวิชา <span className="text-red-500 font-normal">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น CS232"
              value={form.courseNo}
              onChange={(e) =>
                setForm((p) => ({ ...p, courseNo: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">
              ชื่อวิชา{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น Intro to Cloud Computing"
              value={form.courseName}
              onChange={(e) =>
                setForm((p) => ({ ...p, courseName: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-500">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-8 py-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-400 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!form.courseNo.trim() || isSubmitting}
            className="flex-1 py-3 rounded-2xl bg-[#5B41FF] text-white text-sm font-medium hover:bg-[#4a34e0] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
