import AuthGuard from "../components/AuthGuard";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRole="student">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <main className="flex-1 overflow-y-auto pt-1">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
