"use client";
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface JoinCourseProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinCourse = ({ isOpen, onClose }: JoinCourseProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-[#2D2D2D]">Join Course</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-10 flex flex-col items-center">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-[#4A4A68] mb-1">Course Code</h3>
            <p className="text-slate-500 text-sm">กรอกโค้ดคลาสเรียนจากอาจารย์</p>
          </div>

          {/* OTP Input Group */}
          <div className="flex gap-2 sm:gap-3 mb-10">
            {code.map((char, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-14 sm:h-16 text-center text-2xl font-bold text-[#4A4A68] bg-[#E2E2E2] rounded-xl border-none focus:ring-2 ring-purple-300 focus:bg-white transition-all outline-none shadow-inner"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button className="w-full max-w-[240px] bg-gradient-to-r from-[#7B61FF] to-[#D661FF] text-white py-4 rounded-full font-bold shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all">
            Join Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinCourse;
