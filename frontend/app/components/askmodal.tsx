"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface AskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: any) => void;
  courseTitle?: string;
}

export default function AskModal({ isOpen, onClose, onAdd, courseTitle }: AskModalProps) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState(false);

  const tags = ["Midterm", "Final", "Project", "Homework"];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePost = () => {
    if (!title.trim()) return;
    onAdd({ title, detail, tags: selectedTags, anonymous });
    setTitle("");
    setDetail("");
    setSelectedTags([]);
    setAnonymous(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#1B1B1B]">Create a Post</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Course badge */}
        {courseTitle && (
          <div className="bg-[#EEF0FF] text-[#5B41FF] text-xs font-medium px-4 py-2 rounded-xl mb-5">
            Posting to {courseTitle}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            หัวข้อคำถาม <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น ไก่กับไข่อะไรเกิดก่อนกัน"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 transition"
          />
        </div>

        {/* Detail */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 mb-1 block">
            รายละเอียดเพิ่มเติม{" "}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="อธิบายคำถามเพิ่มเติม"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#5B41FF] focus:ring-2 focus:ring-[#5B41FF]/10 transition resize-none"
          />
        </div>


        {/* Anonymous toggle */}
        <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>👁</span>
            <span>แสดงชื่อแบบไม่ระบุตัวตน</span>
          </div>
          <button
            onClick={() => setAnonymous((v) => !v)}
            className={`w-11 h-6 rounded-full transition-all relative ${
              anonymous ? "bg-[#5B41FF]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                anonymous ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={!title.trim()}
            className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-[#6443D9] to-[#EA60AB] text-white text-sm font-medium shadow-md disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}