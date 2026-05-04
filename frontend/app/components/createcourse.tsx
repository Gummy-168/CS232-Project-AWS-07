"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateCourseProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCourse?: (course: {
    courseNo: string;
    courseName: string;
    section: string;
    days: string[];
    startTime: string;
    endTime: string;
  }) => void;
}

const CreateCourse = ({
  isOpen,
  onClose,
  onCreateCourse,
}: CreateCourseProps) => {
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [form, setForm] = useState({
    courseNo: "",
    courseName: "",
    section: "",
    startTime: "13:00",
    endTime: "16:00",
  });

  if (!isOpen) return null;

  const days = [
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
    "อาทิตย์",
  ];
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleCreate = () => {
    if (!form.courseNo) return;
    // ถ้ามี onCreateCourse ก็เรียก ถ้าไม่มีก็ข้าม
    onCreateCourse?.({
      courseNo: form.courseNo,
      courseName: form.courseName,
      section: form.section,
      days: selectedDays,
      startTime: form.startTime,
      endTime: form.endTime,
    });
    setForm({
      courseNo: "",
      courseName: "",
      section: "",
      startTime: "13:00",
      endTime: "16:00",
    });
    setSelectedDays([]);
    onClose();
    router.push("/professor/courses");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          <h2 className="text-xl font-medium text-[#1B1B1B]">Create Course</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-2 space-y-4">
          {/* Course No. */}
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

          {/* Course Name */}
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

          {/* Section */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">
              เลข Section <span className="text-red-500 font-normal">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น 540001"
              value={form.section}
              onChange={(e) =>
                setForm((p) => ({ ...p, section: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 text-sm"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              วันและเวลาที่สอน{" "}
              <span className="text-red-500 font-normal">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {days.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? "bg-[#5B41FF] text-white border-[#5B41FF]"
                        : "text-slate-400 border-slate-200 bg-white hover:border-[#5B41FF] hover:text-[#5B41FF]"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startTime: e.target.value }))
                }
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#5B41FF] text-sm"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endTime: e.target.value }))
                }
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#5B41FF] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-400 text-sm font-medium hover:bg-slate-50 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.courseNo || selectedDays.length === 0}
            className="flex-1 py-3 rounded-2xl bg-[#5B41FF] text-white text-sm font-medium hover:bg-[#4a34e0] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
