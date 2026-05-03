"use client";
import React, { useState, useMemo } from "react";
import { ChevronLeft, User, MessageSquare, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

const StudentDetailPage = ({ params }: { params: { id: string } }) => {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [activities, setActivities] = useState(studentData);
    const [filter, setFilter] = useState("All");
    const [activitySearch, setActivitySearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");
    const [studentFilter, setStudentFilter] = useState<"all" | "online" | "offline">("all");
    const [showFilterMenu, setShowFilterMenu] = useState(false);


    const handleMarkAnswered = (id: number) => {
        setActivities((prev) => prev.map((item) => item.id === id ? { ...item, status: "ANSWERED" } : item));
    };

    const handleUnmarked = (id: number) => {
        setActivities((prev) => prev.map((item) => item.id === id ? { ...item, status: "UNANSWERED" } : item));
    };

    const handlePostReply = (id: number, text: string) => {
        setActivities((prev) => prev.map((item) => {
            if (item.id === id) {
                return { ...item, status: "ANSWERED", professorReplies: [...(item.professorReplies || []), text], replies: (item.replies || 0) + 1 };
            }
            return item;
        }));
    };

    const handleDeleteReply = (activityId: number, replyIndex: number) => {
        setActivities((prev) => prev.map((item) => {
            if (item.id === activityId) {
                const filteredReplies = item.professorReplies.filter((_: any, i: number) => i !== replyIndex);
                return { ...item, professorReplies: filteredReplies, replies: Math.max(0, (item.replies || 0) - 1), status: filteredReplies.length > 0 ? "ANSWERED" : "UNANSWERED" };
            }
            return item;
        }));
    };

    const handleDelete = (id: number) => {
        setActivities((prev) => prev.filter((item) => item.id !== id));
    };


    const studentData = {
        id: params.id,
        name: "สมปอง อยากรวย",
        studentNumber: "6700000000",
        email: "sompong.yak@dome.tu.ac.th",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=shiba",
        stats: {
            pending: 8,
            answered: 12,
            participating: "88%",
            totalQuestions: 20
        },
        questions: [
            {
                id: 101,
                courseCode: "CS232-54001",
                time: "1 sec ago",
                content: "ไก่กับไข่อะไรเกิดก่อนกัน",
                replies: 3,
                status: "UNANSWERED"
            },
            {
                id: 102,
                courseCode: "CS232-54001",
                time: "1 sec ago",
                content: "ทำแลปไม่ได้ค่ะ",
                status: "ANSWERED",
                professorReply: "ติดปัญหาส่วนไหนคะ ลองดู....ใหม่ค่ะ"
            }
        ]
    };

    //  Mini Stats 
    const miniStats = [
        { label: "PENDING", value: studentData.stats.pending, color: "#AE2466", icon: <Clock size={20} className="text-[#FD64A4] " /> },
        { label: "ANSWERED", value: studentData.stats.answered, color: "#513FDF", icon: <CheckCircle2 size={20} className="text-[#22C55E]" /> },
        { label: "PARTICIPATING", value: studentData.stats.participating, color: "#1B1C1B", icon: <TrendingUp size={20} className="text-[#513FDF]" /> },
        { label: "TOTAL QUESTIONS", value: studentData.stats.totalQuestions, color: "#1B1C1B", icon: <MessageSquare size={20} className="text-[#513FDF]" /> },
    ];

    const filteredQuestions = useMemo(() => {
        return studentData.questions.filter((q) => {
            if (filter === "All") return true;
            return q.status.toUpperCase() === filter.toUpperCase();
        });
    }, [filter, studentData.questions]);

    return (
        <div className="min-h-screen bg-[#F6F3F2] p-6 md:p-10 font-sans">
            <div className="max-w-5xl mx-auto bg-white rounded-[40px] shadow-sm border border-slate-50 p-8 md:p-12">

                {/* HEADER & BACK BUTTON */}
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft size={28} className="text-slate-700" />
                    </button>
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-600">
                        <User size={20} />
                        <span className="font-bold">รายละเอียดนักเรียน</span>
                    </div>
                </div>

                {/* PROFILE SECTION */}
                <div className="flex flex-col lg:flex-row gap-10 mb-16">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                            <img src={studentData.avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Student Profile</span>
                    </div>

                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoBox label="Full Name" value={studentData.name} />
                        <InfoBox label="Student Number" value={studentData.studentNumber} />
                        <div className="md:col-span-2">
                            <InfoBox label="Email" value={studentData.email} />
                        </div>
                    </div>

                    {/* MINI STATS GRID */}
                    <div className="grid grid-cols-2 gap-2.5">
                        {miniStats.map(({ label, value, color, icon }) => (
                            <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-default">
                                <div>
                                    <div className="text-[12px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                                    <div className="text-3xl font-medium" style={{ color }}>{value}</div>
                                </div>
                                {icon}
                            </div>
                        ))}
                    </div>
                </div>

                {/* QUESTIONS SECTION */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Question from them</h3>
                        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-400">
                            {["All", "Answered", "Unanswered"].map((btnLabel) => (
                                <button
                                    key={btnLabel}
                                    onClick={() => setFilter(btnLabel)}
                                    className={`px-5 py-2 rounded-lg transition-all ${filter === btnLabel
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "hover:text-slate-600"
                                        }`}
                                >
                                    {btnLabel}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredQuestions.map((q) => (
                            <div key={q.id} className={`p-6 rounded-[30px] border transition-all ${q.status === 'ANSWERED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={studentData.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700 text-sm">{studentData.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">· {q.time} · {q.courseCode}</span>
                                            </div>
                                            <p className="text-slate-600 font-medium mt-1">{q.content}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${q.status === 'ANSWERED' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-50 text-orange-400 border border-orange-100'}`}>
                                        {q.status === 'ANSWERED' ? '● ANSWERED' : '⚙ UNANSWERED'}
                                    </span>
                                </div>

                                {q.status === 'UNANSWERED' ? (
                                    <div className="mt-4 ml-0 md:ml-12">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative">
                                            <textarea placeholder="Reply as Instructor..." className="w-full bg-transparent border-none focus:ring-0 text-sm min-h-[100px] resize-none focus:outline-none"></textarea>
                                            <button className="absolute bottom-3 right-3 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-transform">Post Reply</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 ml-0 md:ml-12 bg-white/60 border border-emerald-100 rounded-2xl p-4">
                                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Professor Reply</span>
                                        <p className="text-slate-600 text-sm mt-2 font-medium">{q.professorReply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// HELPER COMPONENTS
const InfoBox = ({ label, value }: { label: string, value: string }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#AE2466] rounded-full"></div>
            <label className="text-sm font-bold text-slate-800">{label}</label>
        </div>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-600 font-medium">{value}</div>
    </div>
);

export default StudentDetailPage;