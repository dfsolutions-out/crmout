import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import DashboardSidebar from "@/src/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const companyName = "Delta Serviços";

  return (
    <DashboardSidebar companyName={companyName}>
      {children}
    </DashboardSidebar>
  );
}