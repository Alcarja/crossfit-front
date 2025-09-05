"use client";

import { AuthGuard } from "@/lib/authGuard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/coach/calendar/ui/components/dashboard-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["client", "coach", "admin"]}>
      <SidebarProvider>
        <DashboardSidebar />
        {children}
      </SidebarProvider>
    </AuthGuard>
  );
}
