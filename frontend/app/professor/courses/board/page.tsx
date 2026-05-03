"use client";
import React, { useState } from 'react';
import { Users, Search, Filter, ChevronLeft, XCircle, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

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

const MOCK_STUDENTS = [
    { id: 1, name: 'สมปอง อยากรวย', questions: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', status: 'online' },
    { id: 2, name: 'พาที ณ พารัก', questions: 4, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', status: 'online' },
    { id: 3, name: 'ญาญ่า อยากนอน', questions: 2, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', status: 'offline' },
    { id: 4, name: 'สมหญิง อุอุอะ', questions: 0, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', status: 'online' },
];


const INITIAL_QUESTIONS = [
    {
        id: 1,
        user: 'สมปอง อยากรวย',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        content: 'ไก่กับไข่อะไรเกิดก่อนกัน',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        status: 'UNANSWERED',
        type: 'question',
        replies: 0,
        professorReplies: [],
    },
    {
        id: 2,
        user: 'สมปอง อยากรวย',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        content: 'คำถาม 2',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        status: 'ANSWERED',
        type: 'question',
        replies: 0,
        professorReplies: [],
    },
];

export default function BoardPage() {
    const router = useRouter();
    const [studentSearch, setStudentSearch] = useState('');
        const [now, setNow] = useState(Date.now());

    const [questions, setQuestions] = useState(INITIAL_QUESTIONS);

    const filteredStudents = MOCK_STUDENTS.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const handleMarkAnswered = (id: number) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'ANSWERED' } : q));
    };

    const handleUnmarked = (id: number) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'UNANSWERED' } : q));
    };

    const handleDelete = (id: number) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handlePostReply = (id: number, reply: string) => {
        setQuestions(prev => prev.map(q =>
            q.id === id ? { ...q, professorReplies: [...(q.professorReplies || []), reply] } : q
        ));
    };

    const handleDeleteReply = (id: number, index: number) => {
        setQuestions(prev => prev.map(q =>
            q.id === id ? { ...q, professorReplies: q.professorReplies.filter((_: any, i: number) => i !== index) } : q
        ));
    };

    return (
        <div className="min-h-screen bg-[#FCF9F8] p-6 font-sans">
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-[#1B1B1B]">Board : Aws 31/03/2026</h1>
                </div>
                <button className="bg-[#EF4444] text-white px-5 py-2 rounded-2xl flex items-center gap-2 font-medium hover:bg-red-600 transition-colors shadow-sm">
                    <XCircle size={20} />
                    Close Board
                </button>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

                {/* Left Column */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-50">
                    <h3 className="text-base font-semibold text-[#1B1B1B] mb-5 flex items-center gap-2">
                        <Users size={18} color="#6B57FF" />
                        รายชื่อนักเรียน
                    </h3>
                    <div className="flex gap-2 mb-5">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                            <input
                                placeholder="Search students..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#6B57FF] transition-colors"
                            />
                        </div>
                        <button className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[#6B57FF]">
                            <Filter size={18} />
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="text-left pb-3 text-slate-500 font-medium">Name</th>
                                <th className="text-right pb-3 text-slate-500 font-medium">Total Questions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    onClick={() => router.push(`/professor/courses/${student.id}`)}
                                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group"
                                >
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={student.avatar} className="w-9 h-9 rounded-full bg-slate-100" />
                                            <span className="text-slate-700 font-medium group-hover:text-[#6B57FF]">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="font-semibold text-[#6B57FF] text-base">{student.questions}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* — Question Feed */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[40px] p-8 shadow-sm border border-slate-50 min-h-[600px]">
                    <div className="flex items-center gap-2 mb-8">
                        <MessageSquare size={20} className="text-[#E91E63]" />
                        <h2 className="text-lg font-bold text-[#1B1B1B]">Board Question Feed</h2>
                    </div>

                 
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <ActivityCard
                                key={q.id}
                                data={q}
                                onMarkAnswered={() => handleMarkAnswered(q.id)}
                                onUnmarked={() => handleUnmarked(q.id)}
                                onDelete={() => handleDelete(q.id)}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

function ActivityCard({ data, onMarkAnswered, onUnmarked, onPostReply, onDelete, onDeleteReply }: any) {
    const [replyText, setReplyText] = useState("");
    const [showReplyBox, setShowReplyBox] = useState(false);
    const isBoard = data.type === "board";
    const isAnswered = data.status === "ANSWERED";

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 relative">
            <div className={`absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${isAnswered ? "bg-emerald-50 text-emerald-500" : isBoard ? "bg-red-50 text-red-400" : "bg-orange-50 text-orange-400"}`}>
                {isAnswered ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="5" fill="#34d399" />
                        <path d="M2.5 5l1.8 1.8L7.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                ) : isBoard ? (
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="5" fill="#fb923c" />
                        <path d="M5 3v2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                        <circle cx="5" cy="7" r="0.6" fill="white" />
                    </svg>
                )}
                {data.status}
            </div>

            <div className="flex gap-4">
                <img src={data.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-slate-100" />
                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-slate-800">{data.user}</span>
                        <span className="text-slate-400 text-[11px] font-medium">
                        {formatTimeAgo(data.createdAt)}
                    </span>
                    </div>

                    {isBoard ? (
                        <div className="bg-[#F0EEFF] rounded-2xl p-4 mt-2">
                            <p className="text-[#513FDF] font-bold text-lg mb-1">{data.content}</p>
                            {data.subContent && <p className="text-sm text-slate-500 mb-4">{data.subContent}</p>}
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-700 mb-4">{data.content}</p>

                            <div className="space-y-3 mb-4">
                                {data.professorReplies?.map((reply: string, index: number) => (
                                    <div key={index} className="border border-emerald-100 rounded-xl p-4 bg-[#F0FDF4]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="bg-emerald-400 text-white text-[11px] px-2 py-0.5 rounded uppercase tracking-wider">
                                                Professor Reply
                                            </span>
                                            <button onClick={() => onDeleteReply(data.id, index)} className="text-rose-400 hover:text-rose-600 text-xs font-bold px-1">✕</button>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium">{reply}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 text-[13px]">
                                <span className="text-slate-400 flex items-center gap-1">↩ {data.replies || 0}</span>
                                <div className="ml-auto flex gap-2">

                                    {isAnswered ? (
                                        <button onClick={onUnmarked} className="text-orange-500 border border-orange-100 px-3 py-1 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors">Unmarked</button>
                                    ) : (
                                        <button onClick={onMarkAnswered} className="text-emerald-500 border border-emerald-100 px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors">Mark Answered</button>
                                    )}
                                    <button onClick={onDelete} className="text-rose-400 border border-rose-100 px-3 py-1 rounded-md hover:bg-rose-50 transition-colors">Delete</button>
                                </div>
                            </div>

                            {showReplyBox && (
                                <div className="mt-4 bg-[#F8F9FE] rounded-xl p-4 border border-slate-100">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Add a new reply as Instructor..."
                                        className="w-full bg-transparent border-none resize-none text-sm focus:outline-none h-16 text-slate-600"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => { setShowReplyBox(false); setReplyText(""); }} className="text-slate-400 border border-slate-200 px-4 py-1.5 rounded-xl text-[13px] hover:bg-slate-50 transition-all">
                                            Cancel
                                        </button>

                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}