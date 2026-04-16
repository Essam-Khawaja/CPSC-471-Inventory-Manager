import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardOverview
      warehouseIds={user.warehouseIds}
      userName={user.name}
      role={user.role}
    />
  );
}
