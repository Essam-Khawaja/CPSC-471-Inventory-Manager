import { LayoutShell } from "@/components/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountStatus !== "active") {
    redirect("/pending");
  }

  return <LayoutShell role={user.role}>{children}</LayoutShell>;
}
