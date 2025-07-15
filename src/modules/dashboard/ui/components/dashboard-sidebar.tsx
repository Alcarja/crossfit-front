"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Calendar1,
  CircleUserRound,
  FolderArchiveIcon,
  LayoutDashboardIcon,
  PanelLeftIcon,
  PanelRightIcon,
  PodcastIcon,
  Settings2Icon,
  VoteIcon,
} from "lucide-react";
import { useAuth } from "@/context/authContext";

const firstSection = [
  {
    icon: Calendar1,
    label: "Calendar",
    href: "/dashboard",
  },
];

const secondSection = [
  {
    icon: FolderArchiveIcon,
    label: "All Events",
    href: "/dashboard/all-events",
  },
  {
    icon: PodcastIcon,
    label: "All posts",
    href: "/dashboard/all-posts",
  },
  {
    icon: VoteIcon,
    label: "All votations",
    href: "/dashboard/all-votations",
  },
];

const adminSection = [
  {
    icon: LayoutDashboardIcon,
    label: "Admin dashboard",
    href: "/dashboard/admin/dashboard",
  },
  {
    icon: CircleUserRound,
    label: "Coaches",
    href: "/dashboard/admin/coaches",
  },
];

const footerSection = [
  {
    icon: Settings2Icon,
    label: "Settings",
    href: "/dashboard/settings",
  },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();

  const { user } = useAuth();

  const { state, toggleSidebar, isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "pt-16 transition-all duration-300",
        state === "collapsed" && "w-[4rem]"
      )}
    >
      <SidebarHeader className="text-sidebar-accent-foreground px-4">
        <SidebarGroup>
          <SidebarGroupContent
            className={cn(
              "flex items-center px-2 transition-all duration-300",
              state === "collapsed" ? "justify-center px-0" : "justify-between"
            )}
          >
            {" "}
            {state !== "collapsed" && (
              <p className="font-bold text-2xl">Dashboard</p>
            )}
            <Button
              className="size-9"
              variant="outline"
              onClick={toggleSidebar}
            >
              {state === "collapsed" || isMobile ? (
                <PanelLeftIcon className="size-4 text-red" />
              ) : (
                <PanelRightIcon className="size-4 text-red" />
              )}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {state !== "collapsed" && (
            <h3 className="text-xs text-red font-semibold text-muted-foreground uppercase tracking-wide mb-4 pl-2">
              General Section
            </h3>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                      pathname === item.href &&
                        "bg-linear-to-r/oklch border-[#5D6B68]/10"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-7 mr-2" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 py-2">
          <Separator className=" text-[#5D6B68]" />
        </div>

        <div className="h-full flex flex-col justify-between">
          <div>
            <SidebarGroup>
              {state !== "collapsed" && (
                <h3 className="text-xs text-red font-semibold text-muted-foreground uppercase tracking-wide mb-4 pl-2">
                  Personal Section
                </h3>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {secondSection.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                          pathname === item.href &&
                            "bg-linear-to-r/oklch border-[#5D6B68]/10"
                        )}
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-7 mr-2" />
                          <span className="text-sm font-medium tracking-tight">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user?.role === "admin" ? (
              <>
                <div className="px-4 py-2">
                  <Separator className=" text-[#5D6B68]" />
                </div>

                <SidebarGroup>
                  {state !== "collapsed" && (
                    <h3 className="text-xs text-red font-semibold text-muted-foreground uppercase tracking-wide mb-4 pl-2">
                      Admin Section
                    </h3>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminSection.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            className={cn(
                              "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                              pathname === item.href &&
                                "bg-linear-to-r/oklch border-[#5D6B68]/10"
                            )}
                            isActive={pathname === item.href}
                          >
                            <Link href={item.href}>
                              <item.icon className="size-7 mr-2" />
                              <span className="text-sm font-medium tracking-tight">
                                {item.label}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            ) : null}
          </div>

          <SidebarGroup className="mb-3">
            <SidebarGroupContent>
              <SidebarMenu>
                {footerSection.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                        pathname === item.href &&
                          "bg-linear-to-r/oklch border-[#5D6B68]/10"
                      )}
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-7" />
                        <span className="text-sm font-medium tracking-tight">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
