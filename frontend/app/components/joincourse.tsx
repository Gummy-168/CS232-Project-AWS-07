"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { joinStudentCourse } from "../lib/api";
import { useAuthSession } from "../hooks/useAuthSession";

interface JoinCourseProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined?: (courseCode: string) => void;
}

const JoinCourse = ({ isOpen, onClose, onJoined }: JoinCourseProps) => {
  const [code, setCode] = useState("");
  const [joinedCourses, setJoinedCourses] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = useAuthSession();

  if (!isOpen) return null;

  const handleJoin = () => {
    const fullCode = code.trim().toUpperCase();
    if (fullCode.length < 2 || !session?.userId || loading) return;

    setLoading(true);
    setErrorMsg("");
    joinStudentCourse(session.userId, fullCode)
      .then((response) => {
        setJoinedCourses((prev) => [...prev, response.course_code]);
        setSuccessMsg(`เข้าร่วมคอร์ส ${response.course_code} สำเร็จ!`);
        setCode("");
        onJoined?.(response.course_code);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      })
      .catch((error) => {
        if (error instanceof Error) {
          setErrorMsg(error.message);
        } else {
          setErrorMsg("ไม่สามารถเข้าร่วมคอร์สได้");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          <h2 className="text-xl font-bold text-[#1B1B1B]">Join Course</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-10 flex flex-col items-center">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-[#4A4A68] mb-1">Course Code</h3>
            <p className="text-slate-500 text-sm">กรอกโค้ดคลาสเรียนจากอาจารย์</p>
          </div>

          <div className="w-full mb-8">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="เช่น CS232"
              className="w-full text-center text-lg font-bold tracking-wider text-[#4A4A68] bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-[#5B41FF]/30 focus:border-[#5B41FF] focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Success msg */}
          {successMsg && (
            <p className="text-emerald-500 text-sm font-medium mb-4">{successMsg}</p>
          )}
          {errorMsg && (
            <p className="text-rose-500 text-sm font-medium mb-4">{errorMsg}</p>
          )}

          {/* Joined mock list */}
          {joinedCourses.length > 0 && (
            <div className="w-full mb-6">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">คอร์สที่เข้าร่วมแล้ว</p>
              <div className="flex flex-wrap gap-2">
                {joinedCourses.map((c, i) => (
                  <span key={i} className="bg-[#EEF0FF] text-[#5B41FF] text-xs font-mono font-bold px-3 py-1 rounded-lg tracking-widest">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-400 text-sm font-medium hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleJoin}
              disabled={code.trim().length < 2 || loading}
              className="flex-1 py-3 rounded-2xl bg-[#5B41FF] text-white text-sm font-medium hover:bg-[#4a34e0] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Joining..." : "Join Course"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCourse;
