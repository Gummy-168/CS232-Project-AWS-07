"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateCourseProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateCourse = ({ isOpen, onClose }: CreateCourseProps) => {
  if (!isOpen) return null;

  const [selectedDays, setSelectedDays] = useState([]);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-10 pt-10 pb-6">
          <h2 className="text-3xl font-bold text-[#2D2D2D]">Create Course</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-10 space-y-6">
          {/* Course No. */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 ml-1">Course no.</label>
            <input 
              type="text" 
              placeholder="ex. cs232"
              className="w-full bg-[#F3F3F3] border-none rounded-2xl py-4 px-6 text-slate-600 placeholder:text-slate-400 focus:ring-2 ring-purple-200 outline-none transition-all"
            />
          </div>

          {/* Course Name */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 ml-1">
              Course name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input 
              type="text" 
              placeholder="ex. INTRODUCTION TO CLOUD COMPUTING TECHNOLOGY"
              className="w-full bg-[#F3F3F3] border-none rounded-2xl py-4 px-6 text-slate-600 placeholder:text-slate-400 focus:ring-2 ring-purple-200 outline-none transition-all"
            />
          </div>

          {/* Section */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 ml-1">Section</label>
            <input 
              type="text" 
              placeholder="ex. 540001"
              className="w-full bg-[#F3F3F3] border-none rounded-2xl py-4 px-6 text-slate-600 placeholder:text-slate-400 focus:ring-2 ring-purple-200 outline-none transition-all"
            />
          </div>

        {/* Schedule & Time */}
          <div className="space-y-4">
            <label className="block font-bold text-slate-700 ml-1">Schedule</label>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex gap-2">
                {days.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                        isSelected 
                        ? 'bg-[#7B61FF] text-white shadow-lg shadow-purple-200' 
                        : 'bg-[#D9D9D9] text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time Input */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">Start</span>
                <input 
                  type="text" 
                  defaultValue="13:00"
                  className="w-20 bg-[#F3F3F3] rounded-xl py-2 text-center text-sm font-bold text-slate-700 border-none outline-none"
                />
                <span className="text-sm font-bold text-slate-800">to</span>
                <span className="text-sm font-bold text-slate-800 ml-2">End</span>
                <input 
                  type="text" 
                  defaultValue="16:00"
                  className="w-20 bg-[#F3F3F3] rounded-xl py-2 text-center text-sm font-bold text-slate-700 border-none outline-none"
                />
              </div>
            </div>
          </div>
        </div>

      {/* Footer Actions */}  
        <div className="mt-10 p-8 bg-[#F9F9F9]/50 flex justify-end items-center gap-6">
          <button 
            onClick={onClose}
            className="text-slate-600 font-bold hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button className="bg-gradient-to-r from-[#7B61FF] to-[#D661FF] text-white px-10 py-3.5 rounded-full font-bold shadow-xl shadow-purple-200 hover:scale-105 active:scale-95 transition-all">
            Create Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
