"use client";
import React, { useState, useMemo } from 'react';
import CreateCourse from "../../components/createcourse";
import { 
  Search, 
  Bell,
} from 'lucide-react';

// mockmock data
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

export default function ProfessorDashboard() {
  // State สำหรับจัดการข้อมูล ---
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleMarkAnswered = (id: number) => {
    setActivities(prev => prev.map(item => 
      item.id === id ? { ...item, status: "ANSWERED" } : item
    ));
  };

  const handleUnmarked = (id: number) => {
    setActivities(prev => prev.map(item => 
      item.id === id ? { ...item, status: "UNANSWERED" } : item
    ));
  };

  const handlePostReply = (id: number, text: string) => {
  setActivities(prev => prev.map(item => {
    if (item.id === id) {
      const currentReplies = item.professorReplies || [];
      const currentCount = item.replies || 0; 
      
      return { 
        ...item, 
        status: "ANSWERED", 
        professorReplies: [...currentReplies, text],
        replies: currentCount + 1 // บวกเพิ่ม 1 ทุกครั้งที่กดโพสต์
      };
    }
    return item;
  }));
};

const handleDeleteReply = (activityId: number, replyIndex: number) => {
  setActivities(prev => prev.map(item => {
    if (item.id === activityId) {
      const filteredReplies = item.professorReplies.filter((_: any, index: number) => index !== replyIndex);
      
      return { 
        ...item, 
        professorReplies: filteredReplies,
        replies: Math.max(0, (item.replies || 0) - 1), 
        status: filteredReplies.length > 0 ? "ANSWERED" : "UNANSWERED"
      };
    }
    return item;
  }));
};

  const handleDelete = (id: number) => {
    setActivities(prev => prev.filter(item => item.id !== id));
  };

  //filter
  const filteredActivities = useMemo(() => {
    if (filter === "All") return activities;
    return activities.filter(item => item.status === filter.toUpperCase());
  }, [activities, filter]);

  return (
    <div className="flex-1 p-8 bg-[#F8F9FE] min-h-screen font-sans text-slate-700">
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Hello, <span className="text-slate-600">อาจารย์สะปุกนิก</span>
        </h1>
        <div className="flex items-center gap-4">
          <div>
      {/* ปุ่มกดเปิด Modal (จากหน้า Header หรือ Sidebar) */}
            <button 
            onClick={() => setIsModalOpen(true)}
            className="border border-dashed border-[#E3DFFF] px-5 py-2 rounded-xl text-[#513FDF] bg-[#FAF5FF] hover:bg-[#513FDF] hover:text-white transition"
            >
            <span className="text-xl  ">+ </span>Create Course
            </button>

      {/* เรียกใช้ Overlay */}
      <CreateCourse
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
          <div className="relative cursor-pointer">
            <Bell size={24} className="text-slate-400" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-10 h-10 rounded-full border shadow-sm" />
        </div>
      </header>

      {/* upcoming classes */}
      <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-50 text-center mb-10">
        <h2 className="text-2xl font-bold mb-6">CS232: Intro to Cloud Computing</h2>
        <button className="bg-gradient-to-r from-[#7B61FF] to-[#D661FF] text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform">
          Create Board
        </button>
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
            <ActivityCard 
              key={item.id} 
              data={item} 
              onMarkAnswered={() => handleMarkAnswered(item.id)}
              onUnmarked={() => handleUnmarked(item.id)}
              onPostReply={(text: string) => handlePostReply(item.id, text)}
              onDelete={() => handleDelete(item.id)}
              onDeleteReply={handleDeleteReply}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// Sub-components 

function ActivityCard({ data, onMarkAnswered, onUnmarked, onPostReply, onDelete, onDeleteReply }: any) {
  const [replyText, setReplyText] = useState("");
  const isBoard = data.type === 'board';
  const isAnswered = data.status === 'ANSWERED';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
      {/* Status  */}
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
              {/* ข้อความ Professor Reply  */}
              <div className="space-y-3 mb-4">
                {data.professorReplies?.map((reply: string, index: number) => (
                  <div key={index} className="group relative border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4] animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Professor Reply
                      </span>
                      
                      {/* ปุ่มลบ reply */}
                      <button 
                        onClick={() => onDeleteReply(data.id, index)}
                        className="text-rose-400 hover:text-rose-600 transition-colors text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{reply}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <button className="text-slate-400 flex items-center gap-1">💬 {data.replies || "Reply"}</button>
                <div className="ml-auto flex gap-2">
                  {isAnswered ? (
                    <button onClick={onUnmarked} className="text-orange-500 border border-orange-100 px-3 py-1 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors">
                      Unmarked
                    </button>
                  ) : (
                    <button onClick={onMarkAnswered} className="text-emerald-500 border border-emerald-100 px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors">
                      Mark Answered
                    </button>
                  )}
                  <button onClick={onDelete} className="text-rose-400 border border-rose-100 px-3 py-1 rounded-md hover:bg-rose-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 bg-[#F8F9FE] rounded-xl p-4 border border-slate-100">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a new reply as Instructor..." 
                  className="w-full bg-transparent border-none resize-none text-sm focus:outline-none h-16 text-slate-600"
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => { 
                      if(replyText.trim()) { 
                        onPostReply(replyText); 
                        setReplyText(""); 
                      } 
                    }}
                    className="bg-[#5B41FF] text-white px-6 py-1.5 rounded-xl text-xs font-bold hover:shadow-md transition-all active:scale-95"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </>
          )}

          {isBoard && (
            <button className="bg-[#5B41FF] text-white px-6 py-2 rounded-full text-xs font-bold mt-2">
              👁️ Review Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}