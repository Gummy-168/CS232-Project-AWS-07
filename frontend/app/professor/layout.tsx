import AuthGuard from "../components/AuthGuard";
import ProfessorSidebar from "../components/profSidebar";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRole="professor">
      <div className="flex">
        <ProfessorSidebar />
        <main className="flex-1 bg-slate-50 min-h-screen">{children}</main>
      </div>
    </AuthGuard>
  );
}
