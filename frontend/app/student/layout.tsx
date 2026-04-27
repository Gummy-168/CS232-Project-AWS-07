import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header title="Dashboard" /> {/* เปลี่ยน title ตามหน้าได้ */}
        <main className="flex-1 overflow-y-auto pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}