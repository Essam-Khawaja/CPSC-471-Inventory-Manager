import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { DashboardOverview } from "../components/dashboard/DashboardOverview";
import { getCurrentUser } from "../lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-slate-50 px-6 py-4">
          <DashboardOverview />
        </main>
      </div>
    </div>
  );
}

