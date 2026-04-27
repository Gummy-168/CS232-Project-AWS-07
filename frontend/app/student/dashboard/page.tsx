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
        recentQuestion: "ทำไมต้องตั้ง Source เป็น Web Security Group...",
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

  return (
    <div className="min-h-screen bg-[#FCF9F8]">

      <Header
        studentName={data?.student.name}
        studentId={data?.student.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
      />
      <JoinCourse isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />

      <main className="p-8 pt-[80px] space-y-6">
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
              <div className="bg-white p-6 rounded-2xl shadow">
                <h3 className="mb-4">My Activity Stats</h3>
                <div className="grid grid-cols-2 gap-4">
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
              <div className="bg-white p-6 rounded-2xl shadow col-span-1">
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
                <h3 className="mb-4">Recent Questions</h3>
                <div className="bg-gray-100 p-4 rounded-xl text-sm">
                  {data.recentQuestion}
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
    <div className="bg-gray-100 p-4 rounded-xl text-center">
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}