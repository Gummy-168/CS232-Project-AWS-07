"use client";
import React, { useState, useMemo } from 'react';
import CreateCourse from "../../components/createcourse";
import { 
  Search, 
  Bell,
  Contact,
  Clock,
} from 'lucide-react';

// mockmock data
const MOCK_SESSION = {
  id: "course-001",
  title: "CS232: Intro to Cloud Computing",
  subtitle: "Join and ask your questions now!",
  startTime: "13:30",
  endTime: "16:30",
  timeLeft: "45m left",
  instructor: "Aj. Noon",
  studentCount: 12,
  status: "CURRENTLY IN SESSION"
};
const INITIAL_ACTIVITIES = [
  {
    id: 1,
    user: "สมปอง กุ๊กกิ๊ก",
    time: "1 sec ago",
    content: "ไก่กับไข่อะไรเกิดก่อนกัน",
    status: "UNANSWERED",
    type: "question",
    replies: 0,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sompong"
  },
  {
    id: 2,
    user: "ทุงทุงทุง",
    time: "2m ago",
    content: "อยากทราบว่า EC2 ทำงานยังไงหรอครับ",
    status: "UNANSWERED",
    type: "question",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tung"
  },
  {
    id: 3,
    user: "CS232 Course Bot",
    time: "1d ago",
    content: "Lab 5 : RDS",
    subContent: "สามารถดูคำถามย้อนหลังได้ที่นี่ ทั้งหมด 5 คำถาม",
    status: "BOARD",
    type: "board",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=Bot"
  },
  {
    id: 4,
    user: "มะพร้าว ส้มโอ",
    time: "2h ago",
    content: "ผมติดปัญหา lab6 ครับ ทำขั้นตอนที่ 4 ไม่ได้ มีใครสามารถทำได้บ้างไหมครับ",
    status: "ANSWERED",
    type: "question",
    professorReply: "ติดปัญหาส่วนไหนคะ ลองดู...ใหม่ค่ะ",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Coconut"
  }
];

export default function StudentClass() {
  // State สำหรับจัดการข้อมูล ---
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [filter, setFilter] = useState("All");

  //filter
  const filteredActivities = useMemo(() => {
    if (filter === "All") return activities;
    return activities.filter(item => item.status === filter.toUpperCase());
  }, [activities, filter]);

  return (
    <div className="flex-1 p-8 bg-[#FCF9F8] min-h-screen font-sans text-slate-700">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Hello, <span className="text-slate-600">นักศึกษา</span>
        </h1>
        <div className="flex items-center gap-4">
          <div>

      
    </div>
          <div className="relative cursor-pointer">
            <Bell size={24} className="text-slate-400" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-10 h-10 rounded-full border shadow-sm" />
        </div>
      </header>

      {/* upcoming classes */}
      <section className="bg-white rounded-[30px] p-5 shadow-lg border border-slate-50 mb-8 overflow-hidden relative text-left">
  
    <div className="flex items-center gap-2 mb-4 text-[#D1388D] text-xs font-semibold tracking-wider uppercase">
    <span className="text-[10px]">(( ))</span>
    CURRENTLY IN SESSION
  </div>

  <h2 className="text-2xl mb-5">
    <span className="text-[#1B1B1B]">Board - </span>
    <span className="text-[#513FDF]">Join and ask your questions now!</span>
  </h2>

  <div className="grid grid-cols-2 gap-6 mb-7">
    <div className="flex items-center gap-4 bg-[#F9F9F9] p-6 rounded-full">
        <Clock size={24} className="text-[#513FDF]" />
     
      <div>
        <p className="text-xs text-slate-400 font-medium">Time Remaining</p>
        <p className="text-xl text-slate-800">{MOCK_SESSION.startTime} - {MOCK_SESSION.endTime} ({MOCK_SESSION.timeLeft})</p>
      </div>
    </div>

    <div className="flex items-center gap-4 bg-[#F9F9F9] p-6 rounded-full">
     
        <Contact size={24} className="text-[#513FDF]" />
     
      <div>
        <p className="text-xs text-slate-400 font-medium">Instructor</p>
        <p className="text-xl text-slate-800">{MOCK_SESSION.instructor}</p>
      </div>
    </div>
  </div>

  <div className="flex items-center gap-6">
    <button className="bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] text-white px-10 py-2.5 rounded-full text-lg shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all">
      Join Board
    </button>
    <p className="text-sm text-slate-500 font-medium">
      <span className=" text-slate-700">12</span> students are currently asking questions.
    </p>
  </div>
</section>

      {/* Activity Timeline Section */}
      <section>
        <h3 className="text-xl font-bold mb-6">ActivityTimeline</h3>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-slate-100">
            {["All", "Answered", "Unanswered", "Board"].map((btnLabel) => (
              <button 
                key={btnLabel}
                onClick={() => setFilter(btnLabel)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${filter === btnLabel ? 'bg-[#5B41FF] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {btnLabel}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <input 
              type="text" 
              placeholder="Search my questions..." 
              className="w-full bg-[#EEEEF5] py-2 px-4 pr-10 rounded-full text-sm focus:outline-none"
            />
            <Search className="absolute right-3 top-2 text-slate-400" size={18} />
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-6">
          {filteredActivities.map((item) => (
            <StudentActivityCard 
              key={item.id} 
              data={item} 
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// Sub-components 

function StudentActivityCard({ data }: any) {
  const isBoard = data.type === 'board';
  const isAnswered = data.status === 'ANSWERED';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      {/* Status Badge  */}
      <div className="absolute top-5 right-5 flex items-center gap-1">
         <div className={`w-2 h-2 rounded-full ${isAnswered ? 'bg-emerald-400' : data.status === 'BOARD' ? 'bg-red-400' : 'bg-orange-300'}`}></div>
         <span className={`text-[10px] font-bold ${isAnswered ? 'text-emerald-400' : data.status === 'BOARD' ? 'text-red-400' : 'text-orange-300'}`}>
           {data.status}
         </span>
      </div>

      <div className="flex gap-4">
        <img src={data.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-slate-100" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-800">{data.user}</span>
            <span className="text-xs text-slate-400">{data.time}</span>
          </div>

          <p className="text-slate-700 mb-4">{data.content}</p>
          
          {!isBoard && (
            <>
              {/* รายการ Professor Reply */}
              <div className="space-y-3 mb-4">
                {data.professorReplies?.map((reply: string, index: number) => (
                  <div key={index} className="border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4]">
                    <div className="flex items-center mb-1">
                      <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Professor Reply
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{reply}</p>
                  </div>
                ))}
              </div>

              {/* จำนวน Reply */}
              <div className="flex items-center text-xs font-bold">
                <div className="text-slate-400 flex items-center gap-1">
                  💬 {data.replies || 0} Replies
                </div>
              </div>
            </>
          )}

          {/* ปุ่ม Review Session */}
          {isBoard && (
            <button className="bg-[#5B41FF] text-white px-6 py-2 rounded-full text-xs font-bold mt-2 hover:bg-[#4a32d4] transition-colors">
              👁️ Review Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}