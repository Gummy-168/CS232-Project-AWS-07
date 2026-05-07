import ProfessorSidebar from "../components/profSidebar";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <ProfessorSidebar />
      <div className="flex-1 ml-64 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}