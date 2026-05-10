"use client";
import React, { useEffect, useState } from "react";
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
import {
  getStudentAnalytics,
  getStudentDashboard,
  type StudentAnalyticsData,
} from "../../lib/api";
import { useAuthSession } from "../../hooks/useAuthSession";

type AnalyticsViewData = StudentAnalyticsData & {
  session: {
    course_code: string;
    title: string;
    time: string;
    instructor: string;
  };
};

const Dashboard = () => {
  const [data, setData] = useState<AnalyticsViewData | null>(null);
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

  if (loading || !data)
    return <div className="p-8 text-center">Loading Dashboard...</div>;

  const openedBoards = Number(
    data?.stats?.opened_boards ?? data?.stats?.board ?? 0,
  );
  const participatedBoards = Number(data?.stats?.participated_boards ?? 0);
  const courseActivity = Array.isArray(data?.course_activity)
    ? data.course_activity
    : [];
  const maxInteractions = courseActivity.reduce(
    (max: number, course: { total_interactions?: number }) =>
      Math.max(max, Number(course?.total_interactions ?? 0)),
    0,
  );

  const pieData = [
    { name: "Answered", value: data.stats.answered, color: "#4F46E5" },
    { name: "Unanswered", value: data.stats.unanswered, color: "#C7D2FE" },
  ];
  const totalQuestionStatus = data.stats.answered + data.stats.unanswered;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ">
          <StatCard
            label="PARTICIPATION RATE"
            value={`${data.stats.participation}%`}
            subValue={`${participatedBoards}/${openedBoards} joined scopes`}
          />
          <StatCard label="TOTAL QUESTIONS" value={data.stats.questions} />
          <StatCard label="ANSWERED QUESTIONS" value={data.stats.answered} />
          <StatCard
            label="ACTIVE COURSES"
            value={data.stats.active_courses}
            subValue="Counted from enrollments"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Participation Trend (Bar Chart) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-medium mb-6">Participation Trend</h3>
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
                      content={(props) => {
                        const { x, y, width, value, index } = props;

                        if (index !== activeIndex) return null;
                        if (
                          typeof x !== "number" ||
                          typeof y !== "number" ||
                          typeof width !== "number"
                        ) {
                          return null;
                        }

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
                    {data.chart.map((_, index: number) => (
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
            <h3 className="text-xl font-medium self-start mb-4">
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
                  {totalQuestionStatus}
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
          <h3 className="text-xl font-medium mb-4">Course Activity</h3>
          {courseActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No enrolled courses yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {courseActivity.map(
                (course: {
                  course_code: string;
                  course_name?: string;
                  section_code?: string | null;
                  title: string;
                  total_questions?: number;
                  answered_questions?: number;
                  unanswered_questions?: number;
                  general_questions?: number;
                  board_questions?: number;
                  boards_joined?: number;
                  board_sessions_joined?: number;
                  replies_count?: number;
                  total_replies?: number;
                  interaction_count?: number;
                  total_interactions: number;
                }) => {
                  const interactions = Number(
                    course.interaction_count ?? course.total_interactions ?? 0,
                  );
                  const totalQuestions = Number(course.total_questions ?? 0);
                  const answeredQuestions = Number(
                    course.answered_questions ?? 0,
                  );
                  const unansweredQuestions = Number(
                    course.unanswered_questions ??
                      Math.max(totalQuestions - answeredQuestions, 0),
                  );
                  const generalQuestions = Number(
                    course.general_questions ?? 0,
                  );
                  const boardQuestions = Number(course.board_questions ?? 0);
                  const boardSessionsJoined = Number(
                    course.boards_joined ?? course.board_sessions_joined ?? 0,
                  );
                  const totalReplies = Number(
                    course.replies_count ?? course.total_replies ?? 0,
                  );
                  const widthPercent =
                    maxInteractions > 0
                      ? (interactions / maxInteractions) * 100
                      : interactions > 0
                        ? 100
                        : 0;

                  return (
                    <div
                      key={course.course_code}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center text-sm mb-1">
                        <div>
                          <span className="font-medium">{course.title}</span>
                          <p className="text-xs text-slate-400">
                            {course.section_code
                              ? `${course.course_name || course.course_code} • ${course.section_code}`
                              : course.course_name || course.course_code}
                          </p>
                        </div>
                        <span className="text-indigo-600 font-semibold text-xs">
                          {interactions} interactions
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {totalQuestions} questions
                        </span>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                          {answeredQuestions} answered
                        </span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-600">
                          {unansweredQuestions} pending
                        </span>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-600">
                          {generalQuestions} general
                        </span>
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-600">
                          {boardQuestions} board
                        </span>
                        <span className="rounded-full bg-pink-50 px-3 py-1 text-pink-600">
                          {boardSessionsJoined} boards joined
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                          {totalReplies} replies
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

//  Sub-components
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
}
const StatCard = ({ label, value, subValue }: StatCardProps) => {
  const defaultLabelClasses =
    "text-[12px] font-medium text-slate-400 transition-colors duration-300 tracking-wider uppercase group-hover:text-pink-500";
  const defaultBorderClasses = "border-slate-100 transition-all duration-300";
  const hoverBorderClasses =
    "group-hover:border-pink-400 group-hover:shadow-lg group-hover:scale-105";

  return (
    <div
      className={`relative overflow-hidden p-6 rounded-3xl border bg-white shadow-sm flex flex-col group ${defaultBorderClasses} ${hoverBorderClasses}`}
    >
      {/* Pink line on top */}
      <div className="absolute top-0 left-6 right-6 h-1 bg-pink-500 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Top Section (Label) */}
      <div className="mb-2 relative z-10">
        <p className={defaultLabelClasses}>{label}</p>
      </div>

      {/* Value Section */}
      <p className="text-4xl font-bold text-slate-800 relative z-10">{value}</p>

      {/* Bottom Right Section (subValue) */}
      {subValue && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-[12px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-medium">
            {subValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
