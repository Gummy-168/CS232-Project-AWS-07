"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Tooltip,
  Pie,
  LabelList,
} from "recharts";
import Header from "../../components/Header";
import JoinCourse from "../../components/joincourse";
import { getStudentAnalytics, getStudentDashboard } from "../../lib/api";
import { useAuthSession } from "../../hooks/useAuthSession";

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { session } = useAuthSession();

  useEffect(() => {
    if (!session?.userId) {
      return;
    }
    Promise.all([
      getStudentAnalytics(session.userId),
      getStudentDashboard(session.userId),
    ])
      .then(([analytics, dashboard]) => {
        setData({
          ...analytics,
          session: dashboard.session,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session?.userId]);

  if (loading)
    return <div className="p-8 text-center">Loading Dashboard...</div>;

  const pieData = [
    { name: "Answered", value: data.stats.answered, color: "#4F46E5" },
    { name: "Unanswered", value: data.stats.unanswered, color: "#C7D2FE" },
    { name: "Board", value: data.stats.board, color: "#EC4899" },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-8 font-sans text-slate-700">
      <Header
        studentName={data?.student?.name}
        studentId={data?.student?.id}
        onJoinCourse={() => setIsJoinModalOpen(true)}
        mode="analysis"
      />
      <JoinCourse
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
      <main className="p-8 pt-[120px] space-y-6 h-full overflow-y-auto pb-10 ">
        {/*  Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="PARTICIPATION RATE"
            value={`${data.stats.participation}%`}
            subValue="+4%"
          />
          <StatCard
            label="TOTAL QUESTIONS"
            value={data.stats.questions}
            isActive
          />
          <StatCard label="ANSWERED QUESTIONS" value={data.stats.answered} />
          <StatCard label="ACTIVE COURSES" value={data.stats.active_courses} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Participation Trend (Bar Chart) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold mb-6">Participation Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.chart}
                  onMouseLeave={() => setActiveIndex(null)}
                  margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />

                  <Tooltip cursor={false} content={() => null} />

                  <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={50}>
                    <LabelList
                      dataKey="value"
                      position="top"
                      content={(props: any) => {
                        const { x, y, width, value, index } = props;

                        if (index !== activeIndex) return null;

                        return (
                          <text
                            x={x + width / 2}
                            y={y - 10}
                            fill="#4F46E5"
                            textAnchor="middle"
                            className="font-bold text-sm transition-opacity duration-300"
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                    {data.chart.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === activeIndex
                            ? "url(#colorGradient)"
                            : "#E2E8F0"
                        }
                        onMouseEnter={() => setActiveIndex(index)}
                        className="transition-all duration-300 cursor-pointer"
                      />
                    ))}
                  </Bar>

                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/*  Question Status  */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
            <h3 className="text-xl font-bold self-start mb-4">
              Question Status
            </h3>
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">
                  {data.stats.unanswered +
                    data.stats.answered +
                    data.stats.board}
                </span>
                <span className="text-xs text-slate-400 uppercase">Total</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 w-full">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-500">{item.name}</span>
                  </div>
                  <span className="font-semibold">({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Activity */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4">Course Activity</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-medium">{data.session.title}</span>
              <span className="text-indigo-600 font-semibold text-xs">
                1 interactions
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                style={{ width: "10%" }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

//  Sub-components
const StatCard = ({ label, value, subValue }: any) => {
  const defaultLabelClasses =
    "text-[10px] font-bold text-slate-400 transition-colors duration-300 tracking-wider uppercase group-hover:text-pink-500";
  const defaultBorderClasses = "border-slate-100 transition-all duration-300";
  const hoverBorderClasses =
    "group-hover:border-pink-400 group-hover:shadow-lg group-hover:scale-105";

  return (
    <div
      className={`relative overflow-hidden p-6 rounded-3xl border bg-white shadow-sm flex flex-col group ${defaultBorderClasses} ${hoverBorderClasses}`}
    >
      <div className="absolute top-0 left-6 right-6 h-1 bg-pink-500 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex justify-between items-start mb-2 relative z-10">
        <p className={defaultLabelClasses}>{label}</p>

        {subValue && (
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
            {subValue}
          </span>
        )}
      </div>
      <p className="text-4xl font-bold text-slate-800 relative z-10">{value}</p>
    </div>
  );
};

export default Dashboard;
