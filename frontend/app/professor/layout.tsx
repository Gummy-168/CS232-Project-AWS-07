import ProfessorSidebar from "../components/profSidebar";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* ใส่ Professor Sidebar ไว้ที่นี่! มันจะแสดงเฉพาะหน้าที่อยู่ใต้ (professor) โฟลเดอร์ */}
      <ProfessorSidebar />
      <main className="flex-1 bg-slate-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}