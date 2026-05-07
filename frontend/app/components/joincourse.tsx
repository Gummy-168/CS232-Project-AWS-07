"use client";
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface JoinCourseProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinCourse = ({ isOpen, onClose }: JoinCourseProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [joinedCourses, setJoinedCourses] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) return;
    setJoinedCourses((prev) => [...prev, fullCode]);
    setSuccessMsg(`เข้าร่วมคอร์ส ${fullCode} สำเร็จ!`);
    setCode(['', '', '', '', '', '']);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
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

          {/* OTP Input */}
          <div className="flex gap-2 sm:gap-3 mb-8">
            {code.map((char, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-13 sm:h-14 text-center text-xl font-bold text-[#4A4A68] bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#5B41FF]/30 focus:border-[#5B41FF] focus:bg-white transition-all outline-none"
              />
            ))}
          </div>

          {/* Success msg */}
          {successMsg && (
            <p className="text-emerald-500 text-sm font-medium mb-4">{successMsg}</p>
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
              disabled={code.join('').length < 6}
              className="flex-1 py-3 rounded-2xl bg-[#5B41FF] text-white text-sm font-medium hover:bg-[#4a34e0] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join Course
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCourse;