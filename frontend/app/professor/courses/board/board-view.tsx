"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Filter, MessageSquare, Search, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import CreateCourse from "@/app/components/createcourse";

type ProfessorData = {
  professor: { name: string; id: string };
  course: { title: string; code: string };
};

type Student = {
  id: number;
  name: string;
  questions: number;
  avatar: string;
};

type Question = {
  id: number;
  user: string;
  time: string;
  content: string;
  status: "UNANSWERED" | "ANSWERED";
  avatar: string;
};

const fetchProfessorData = async (): Promise<ProfessorData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        professor: { name: "อาจารย์ สะปุกนิก", id: "PRF000001" },
        course: { title: "CS232: Intro to Cloud Computing", code: "3A6572" },
      });
    }, 400);
  });
};

const STUDENTS: Student[] = [
  {
    id: 1,
    name: "สมปอง อยากรวย",
    questions: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=board-1",
  },
  {
    id: 2,
    name: "พาที ณ พารัก",
    questions: 4,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=board-2",
  },
  {
    id: 3,
    name: "ญาญ่า อยากนอน",
    questions: 2,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=board-3",
  },
  {
    id: 4,
    name: "สมหญิง อุอุอะ",
    questions: 0,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=board-4",
  },
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    user: "สมปอง อยากรวย",
    time: "5 sec ago",
    content: "ไก่กับไข่อะไรเกิดก่อนกัน",
    status: "UNANSWERED",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=board-1",
  },
  {
    id: 2,
    user: "สมปอง อยากรวย",
    time: "5 sec ago",
    content: "คำถาม 2",
    status: "ANSWERED",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=board-1",
  },
];

function QuestionCard({
  item,
  onMarkAnswered,
  onUnmarked,
  onDelete,
}: {
  item: Question;
  onMarkAnswered: (id: number) => void;
  onUnmarked: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const isAnswered = item.status === "ANSWERED";

  return (
    <article
      className={`rounded-xl border px-3.5 py-3 ${
        isAnswered ? "border-emerald-100 bg-[#EAF9F2]" : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <img
            src={item.avatar}
            alt={`${item.user} avatar`}
            className="mt-0.5 h-8 w-8 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#212733]">{item.user}</p>
            <p className="text-[11px] text-slate-400">{item.time}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isAnswered
              ? "bg-emerald-50 text-emerald-600"
              : "bg-orange-50 text-orange-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAnswered ? "bg-emerald-500" : "bg-orange-400"
            }`}
          />
          {item.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-[#2C3342]">{item.content}</p>

      {!isAnswered ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onMarkAnswered(item.id)}
            className="rounded-md bg-[#E2F7EC] py-1.5 text-[11px] font-medium text-emerald-600 hover:bg-[#CEF0DF]"
          >
            Mark Answered
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-md bg-[#FBEAF2] py-1.5 text-[11px] font-medium text-rose-500 hover:bg-[#F7DCE8]"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onUnmarked(item.id)}
            className="rounded-md bg-orange-50 px-2.5 py-1.5 text-[11px] font-medium text-orange-500 hover:bg-orange-100"
          >
            Unmarked
          </button>
        </div>
      )}
    </article>
  );
}

export default function BoardView() {
  const router = useRouter();
  const [data, setData] = useState<ProfessorData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);

  useEffect(() => {
    fetchProfessorData().then(setData);
  }, []);

  const filteredStudents = useMemo(() => {
    return STUDENTS.filter((student) =>
      student.name.toLowerCase().includes(studentSearch.toLowerCase()),
    );
  }, [studentSearch]);

  const markAnswered = (id: number) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "ANSWERED" } : item,
      ),
    );
  };

  const unmarked = (id: number) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "UNANSWERED" } : item,
      ),
    );
  };

  const confirmDelete = () => {
    if (deleteTarget === null) {
      return;
    }
    setQuestions((prev) => prev.filter((item) => item.id !== deleteTarget));
    setDeleteTarget(null);
  };

  if (!data) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F6F5F8] text-slate-700">
      <Header
        professorName={data.professor.name}
        onJoinCourse={() => setIsModalOpen(true)}
        courseTitle={data.course.title}
        codeId={data.course.code}
        mode="course"
      />
      <CreateCourse isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <main className="w-full px-6 pb-10 pt-[128px] md:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
              >
                <ChevronLeft size={22} />
              </button>
              <h2 className="text-[30px] font-semibold leading-none text-[#232734]">
                Board : Aws 31/03/2026
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F43F5E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#EA2346]"
            >
              <XCircle size={14} />
              Close Board
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <aside className="lg:col-span-4 rounded-2xl border border-[#EFEAFA] bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2B3040]">
                <Users size={14} className="text-[#6B57FF]" />
                รายชื่อนักเรียน
              </div>
              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search students..."
                    className="w-full rounded-full border border-slate-100 bg-[#FAFAFD] py-2 pl-8 pr-3 text-xs outline-none focus:border-[#C9BEFF]"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  <Filter size={12} className="text-[#6B57FF]" />
                  Filter
                </button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 text-left text-[11px] font-semibold text-slate-500">
                      Name
                    </th>
                    <th className="pb-2 text-right text-[11px] font-semibold text-slate-500">
                      Total Questions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() =>
                        router.push(
                          `/professor/courses/${student.id}?course_code=${encodeURIComponent(
                            data.course.code,
                          )}`,
                        )
                      }
                      className="cursor-pointer border-t border-slate-50 transition hover:bg-slate-50"
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatar}
                            alt={`${student.name} avatar`}
                            className="h-8 w-8 rounded-full bg-slate-100"
                          />
                          <span className="text-[13px] text-[#232938]">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-sm font-semibold text-[#5A46E8]">
                        {student.questions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </aside>

            <section className="lg:col-span-8 rounded-2xl border border-[#EFEAFA] bg-white p-4 min-h-[560px]">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare size={14} className="text-[#D73B88]" />
                <h3 className="text-sm font-semibold text-[#2A3040]">Board Question Feed</h3>
              </div>
              <div className="space-y-3">
                {questions.map((item) => (
                  <QuestionCard
                    key={item.id}
                    item={item}
                    onMarkAnswered={markAnswered}
                    onUnmarked={unmarked}
                    onDelete={(id) => setDeleteTarget(id)}
                  />
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>

      {deleteTarget !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-base font-semibold text-slate-800">ลบคำถามนี้?</p>
            <p className="mt-1 text-sm text-slate-400">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
