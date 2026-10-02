import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import AccessibilityToolbar from "@/components/ui/AccessibilityToolbar";

export const metadata = {
  title: "Saarthi Dashboard — Accessible Job Assistant",
  description: "Track job applications, manage accessibility preferences, and discover matched job opportunities.",
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F5F5F6] text-[#222222]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main id="main-content" className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
      <AccessibilityToolbar />
    </div>
  );
}
