import { AuthGuard } from "@/lib/authGuard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

const dashboardRoles = ["admin", "coach"] as const;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <DashboardSidebar allowedRoles={dashboardRoles} />
      <AuthGuard allowedRoles={dashboardRoles}>{children}</AuthGuard>
    </SidebarProvider>
  );
};

export default Layout;
