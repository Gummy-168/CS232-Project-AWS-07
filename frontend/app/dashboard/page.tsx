"use client";
import { useEffect, useState } from "react";
import AskModal from "../components/askmodal";

// mock data
const fetchDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        student: {
          name: "John",
          id: "670000000",
        },
        session: {
          title: "CS232: Intro to Cloud Computing",
          time: "13:30 - 16:30",
          instructor: "Aj. Noon",
        },
        stats: {
          participation: 72,
          questions: 12,
          answered: 8,
          pending: 4,
        },
        chart: [40, 60, 50, 70, 90, 30, 50],
        recentQuestion:
          "ทำไมต้องตั้ง Source เป็น Web Security Group...",
      });
    }, 800); // simulate delay
  });
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData().then((res) => setData(res));
  }, []);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#FCF9F8]">
      <main className="flex-1 p-8 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-[#1B1B1B] text-2xl font-semibold">
              Hello, {data.student.name}
            </h2>
            <p className="text-gray-500">
              Student ID: {data.student.id}
            </p>
          </div>

          <button className="border border-dashed border-[#E3DFFF] px-4 py-2 rounded-xl text-[#513FDF] bg-[#FAF5FF] hover:bg-[#513FDF] hover:text-white transition">
            Join Course
          </button>
        </div>

        {/* Card Section */}
        <div className="grid grid-cols-3 gap-6">

          {/* Current Session */}
          <div className="col-span-2 bg-white p-6 rounded-2xl shadow">
            <p className="mt-3 text-[#AE2466] text-sm mb-2">
              🛜 CURRENTLY IN SESSION
            </p>

            <h3 className="text-xl text-[#1B1B1B] font-semibold mb-4">
              {data.session.title}
            </h3>

            <div className="flex gap-4">
              <div className="flex-1 bg-[#F6F3F2] px-4 py-2 rounded-2xl text-sm">
                <p className="text-xs">🕑 Time</p>
                {data.session.time}
              </div>
              <div className="flex-1 bg-[#F6F3F2] px-4 py-2 rounded-2xl text-sm">
                <p className="text-xs">👨‍🏫 Instructor</p>
                {data.session.instructor}
              </div>
            </div>

            <button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white px-6 py-2 rounded-full mt-6"
            >
              Ask Now
            </button>

      <AskModal isOpen={open} onClose={() => setOpen(false)} />
          </div>

          {/* Stats */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="mb-4">My Activity Stats</h3>

            <div className="grid grid-cols-2 gap-4">
              <StatBox value={`${data.stats.participation}%`} label="Participation" />
              <StatBox value={data.stats.questions} label="Questions" />
              <StatBox value={data.stats.answered} label="Answered" />
              <StatBox value={data.stats.pending} label="Pending" />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-2 gap-6">

          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="mb-4">Participation Overview</h3>

            <div className="flex items-end gap-3 h-40">
              {data.chart.map((h, i) => (
                <div
                  key={i}
                  className="bg-purple-400 w-6 rounded"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="mb-4">Recent Questions</h3>

            <div className="bg-gray-100 p-4 rounded-xl text-sm">
              {data.recentQuestion}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// reusable component
function StatBox({ value, label }) {
  return (
    <div className="bg-gray-100 p-4 rounded-xl text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}