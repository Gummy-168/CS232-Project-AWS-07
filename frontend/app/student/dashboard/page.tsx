"use client";
import { useEffect, useState } from "react";
import AskModal from "../../components/askmodal";
import JoinCourse from "../../components/joincourse";
import Header from "../../components/Header";
import { Contact, Clock } from 'lucide-react';

const fetchDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        student: { name: "สมปอง กุ๊กกิ๊ก", id: "670000000" },
        session: {
          title: "CS232: Intro to Cloud Computing",
          time: "13:30 - 16:30",
          instructor: "Aj. Noon",
        },
        stats: { participation: 72, questions: 12, answered: 8, pending: 4 },
        chart: [40, 60, 50, 70, 90, 30, 50],
        recentQuestion: "ทำไมต้องตั้ง Source เป็น Web Security Group แทนที่จะใส่ IP หรือ 0.0.0.0/0 แล้วมันส่งผลกับการเข้าถึง DB ยังไง?",
        tag: "BOARD"
      });
    }, 800);
  });
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
  fetchDashboardData().then((res) => setData(res));
}, []);

useEffect(() => {
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = "auto";
  };
}, []);

  return (
    <div className="h-screen bg-[#FCF9F8] overflow-hidden">

      <Header
        studentName={data?.student.name}
        studentId={data?.student.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
      />
      <JoinCourse isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />

  <main className="p-8 pt-[80px] space-y-6 h-full">        
  {!data ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Card Section */}
            <div className="grid grid-cols-3 gap-6">

              {/* Current Session */}
              <section className="col-span-2 bg-white rounded-[30px] p-6 shadow border border-slate-50 overflow-hidden relative text-left">
                <div className="flex items-center gap-2 mb-4 text-[#D1388D] text-xs font-semibold tracking-wider uppercase">
                  <span className="text-[10px]">(( ))</span>
                  CURRENTLY IN SESSION
                </div>

                <h2 className="text-2xl mb-6">
                  <span className="text-[#1B1B1B]">{data.session.title.split(':')[0]}: </span>
                  <span className="text-[#513FDF]">Join and ask your questions now!</span>
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-4 bg-[#F9F9F9] p-5 rounded-full">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Clock size={24} className="text-[#513FDF]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Time Remaining</p>
                      <p className="text-lg text-slate-800">{data.session.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-[#F9F9F9] p-5 rounded-full">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Contact size={24} className="text-[#513FDF]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Instructor</p>
                      <p className="text-lg text-slate-800">{data.session.instructor}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setOpen(true)}
                    className="bg-gradient-to-r from-[#6443D9] via-[#A952C0] to-[#EA60AB] text-white px-12 py-3 rounded-full text-lg shadow-xl shadow-purple-100 hover:scale-105 active:scale-95 transition-all"
                  >
                    Ask Now
                  </button>
                  <p className="text-sm text-slate-500 font-medium">
                    <span className="text-slate-700">12</span> students are currently asking questions.
                  </p>
                </div>

                <AskModal isOpen={open} onClose={() => setOpen(false)} />
              </section>

              {/* Stats */}
              <div className="bg-[#F6F3F2]-100 p-6 rounded-2xl shadow">
                <h3 className="mb-4 text-xl">My Activity Stats</h3>
                <div className="grid grid-cols-2 gap-5">
                  <StatBox value={`${data.stats.participation}%`} label="Participation" textColor="text-[#513FDF]" />
                  <StatBox value={data.stats.questions} label="Questions" textColor="text-[#AE2466]" />
                  <StatBox value={data.stats.answered} label="Answered" textColor="text-[#16A34A]" />
                  <StatBox value={data.stats.pending} label="Pending" textColor="text-[#F59E0B]" />
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="grid grid-cols-3 gap-6">

              {/* Chart */}
              <div className="bg-[#F6F3F2] p-6 rounded-2xl shadow col-span-1">
                <h3 className="mb-4">Participation Overview</h3>
                <div className="flex items-end gap-2.5 h-40">
                  {data.chart.map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-10 h-full justify-end">
                      <div className="bg-[#513FDF] w-full rounded-t-3xl" style={{ height: `${h}%` }} />
                      <span className="text-xs text-gray-500 font-medium">{days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="bg-white p-6 rounded-2xl shadow col-span-2">
  
              {/* Header + Tag */}
                <div className="flex items-center justify-between mb-4">
                  <h3>Recent Questions</h3>
                </div>

                {/* Content */}
                <div className="bg-[#F9F9F9] p-4 rounded-3xl text-sm flex items-center justify-between gap-4">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <p className="text-slate-800 pr-4 flex-1">
                    {data.recentQuestion}
                  </p>

                  <span className="text-red-600  bg-red-100 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    {data.tag}
                  </span>

                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatBox({ value, label, textColor }) {
  return (
    <div className="bg-white p-5 rounded-4xl flex flex-col items-start">
      <p className={`text-2xl font-regular ${textColor}`}>{value}</p>
      <p className="text-s text-gray-500">{label}</p>
    </div>
  );
}