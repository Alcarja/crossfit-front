import { AuthGuard } from "@/lib/authGuard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <AuthGuard>{children}</AuthGuard>
    </SidebarProvider>
  );
};

export default Layout;
