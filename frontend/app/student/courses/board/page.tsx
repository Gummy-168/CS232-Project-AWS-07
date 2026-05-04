"use client";
import React, { useEffect, useState } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import AskModal from "../../../components/askmodal";
import Header from "../../../components/Header";

const formatTimeAgo = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
    });
  } catch (error) {
    return dateString;
  }
};

const LabDiscussionPage = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  //  Mock Data
  const data = {
    student: { name: "สมชาย ใจดี", id: "6700000000" },
    session: { title: "CS232: Intro to Cloud Computing" },
  };
  const labInfo = {
    title: "Lab 5 : RDS",
    date: "30/03/2026",
    members: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    ],
    totalMembers: 15,
  };
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDiscussion = (payload: any) => {
    const newCard = {
      id: Date.now(),
      status: payload.status || "IN DISCUSSION",
      createdAt: new Date().toISOString(),
      content: payload.detail || payload.title,
      user: payload.anonymous ? "Anonymous" : "สมชาย",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=shiba",
      isSolved: false,
    };

    setDiscussions([newCard, ...discussions]);
  };

  //  Mock Data
  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      status: "IN DISCUSSION",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      content: "ไก่กับไข่อะไรเกิดก่อนกัน",
      user: "สมปอง กุ๊กกิ๊ก",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=1",
      isSolved: false,
    },
    {
      id: 2,
      status: "IN DISCUSSION",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      content:
        "ทำไมต้องตั้ง Source เป็น Web Security Group แทนที่จะใส่ IP หรือ 0.0.0.0/0 แล้วมันส่งผลกับการเข้าถึง DB ยังไง?",
      user: "สมปอง กุ๊กกิ๊ก",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=1",
      isSolved: false,
    },
    {
      id: 3,
      status: "IN DISCUSSION",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      content:
        "ทำไม RDS ต้องใช้ Subnet อย่างน้อย 2 Availability Zones และถ้าเลือกผิด subnet จะเกิดอะไรขึ้น?",
      user: "นิลมังกร",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=5",
      isSolved: false,
    },
    {
      id: 4,
      status: "ANSWERED",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      content:
        "Multi-AZ ที่เปิดไว้ใน lab นี้ มีผลแค่ High Availability หรือมีผลกับ performance / cost ยังไง?",
      user: "ทวิตตี้",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=9",
      isSolved: true,
    },
    {
      id: 5,
      status: "ANSWERED",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      content:
        "Endpoint ที่ได้ (เช่น lab-db.xxxx.rds.amazonaws.com) ต่างจาก IP ยังไง และทำไมต้องใช้ endpoint แทน IP?",
      user: "สิงหามาครับ",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=12",
      isSolved: true,
    },
    {
      id: 6,
      status: "ANSWERED",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      content:
        "ถ้าใส่ endpoint + user + password ถูกแล้วแต่ connect ไม่ได้ ควรเช็คอะไรเป็นลำดับแรก?",
      user: "วันนี้วันจันทร์",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=20",
      isSolved: true,
    },
  ]);

  return (
    <div className="h-full bg-[#FCF9F8] flex flex-col overflow-hidden font-sans">
      {/* Fixed Top Header (ชื่อ course) */}
      <Header
        studentName={data.student.name}
        studentId={data.student.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        courseTitle={data.session.title}
        mode="course"
      />

      {/* Sub-header: Lab title + members — ไม่ scroll */}
      <div className="shrink-0 px-8 pt-[140px] pb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={32} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-regular text-[#1B1B1B]">
              {labInfo.title}
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Date : {labInfo.date}
            </p>
          </div>
        </div>

        <div className="flex items-center -space-x-3">
          {labInfo.members.map((url, i) => (
            <img
              key={i}
              src={url}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              alt="member"
            />
          ))}
          <div className="w-10 h-10 rounded-full bg-[#FFD6E8] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#FF4D94] shadow-sm">
            +{labInfo.totalMembers}
          </div>
        </div>
      </div>

      {/* Grid — scroll เฉพาะส่วนนี้ */}
      <div className="flex-1 overflow-y-auto px-8 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {discussions.map((item) => (
            <DiscussionCard key={item.id} data={item} />
          ))}
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-[#6D54D7] to-[#E35F97] shadow-lg shadow-purple-300 hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none"
      >
        <span className="text-white text-4xl font-extralight -mt-1">+</span>
      </button>

      <AskModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onAdd={handleAddDiscussion}
      />
    </div>
  );
};

function DiscussionCard({ data }: { data: any }) {
  const status = data?.status || "IN DISCUSSION";
  const isInDiscussion = data.status === "IN DISCUSSION";

  return (
    <div
      className={`relative flex flex-col justify-between p-7 rounded-[40px] h-[280px] shadow-sm border transition-all hover:shadow-md ${
        isInDiscussion
          ? "bg-[#FFF5F8] border-[#FFEBF2]"
          : "bg-[#F2FFF7] border-[#E6F9EE]"
      }`}
    >
      <div>
        {/* Status Tag & Time */}
        <div className="flex justify-between items-center mb-5">
          <span
            className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-wider ${
              isInDiscussion
                ? "bg-[#FFD6E8] text-[#FF4D94]"
                : "bg-[#D6FFE6] text-[#2ECC71]"
            }`}
          >
            {status}
          </span>
          <span className="text-slate-400 text-[11px] font-medium">
            {formatTimeAgo(data.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p
          className={`text-sm leading-relaxed font-medium line-clamp-5 ${
            isInDiscussion ? "text-[#5A5A5A]" : "text-[#5A8A6A]"
          }`}
        >
          {data.content}
        </p>
      </div>

      {/* Footer User Info */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/50">
        <div className="flex items-center gap-2">
          <img
            src={data.avatar}
            className="w-7 h-7 rounded-full bg-white shadow-sm"
            alt="user"
          />
          <span className="text-xs font-bold text-slate-500">{data.user}</span>
        </div>

        {data.isSolved && (
          <div className="flex items-center gap-1.5 text-[#2ECC71]">
            <CheckCircle2 size={16} />
            <span className="text-[11px] font-bold uppercase">Solved</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default LabDiscussionPage;
