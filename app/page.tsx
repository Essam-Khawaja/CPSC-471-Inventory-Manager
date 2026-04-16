import { LayoutShell } from "@/components/layout/LayoutShell";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountStatus !== "active" && user.accountStatus !== "none") {
    redirect("/pending");
  }

  return (
    <LayoutShell role={user.role}>
      <DashboardOverview
        warehouseIds={user.warehouseIds}
        userName={user.name}
      />
    </LayoutShell>
  );
}
