"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Calendar1,
  CircleUserRound,
  DumbbellIcon,
  NotepadText,
  PanelLeftIcon,
  PanelRightIcon,
  Settings2Icon,
  ShoppingBasketIcon,
  ArrowDownLeftFromCircleIcon,
  UserPlus2,
  Calendar1Icon,
  SettingsIcon,
} from "lucide-react";

const coachSection = [
  {
    icon: Calendar1,
    label: "Calendar",
    href: "/dashboard",
  },
  {
    icon: NotepadText,
    label: "Expenses",
    href: "/dashboard/expenses",
  },
  {
    icon: DumbbellIcon,
    label: "Workouts",
    href: "/dashboard/workouts",
  },
];

const adminSection = [
  {
    icon: ShoppingBasketIcon,
    label: "Inventory",
    href: "/dashboard/inventory",
  },
  {
    icon: UserPlus2,
    label: "Register Coach",
    href: "/dashboard/register",
  },
  {
    icon: CircleUserRound,
    label: "Coaches",
    href: "/dashboard/admin/coaches",
  },
];

const clientSection = [
  {
    icon: Calendar1Icon,
    label: "Reserves",
    href: "/dashboard/clients",
  },
  {
    icon: SettingsIcon,
    label: "Class Settings",
    href: "/dashboard/classes/settings",
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

  const sidebarContent = (
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
              Coach Section
            </h3>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {coachSection.map((item) => (
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

        <div className="h-full flex flex-col justify-between">
          <div className="flex h-auto flex-col justify-start">
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

                <div className="px-4 py-2">
                  <Separator className=" text-[#5D6B68]" />
                </div>

                <SidebarGroup>
                  {state !== "collapsed" && (
                    <h3 className="text-xs text-red font-semibold text-muted-foreground uppercase tracking-wide mb-4 pl-2">
                      Client Section
                    </h3>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {clientSection.map((item) => (
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

  return (
    <>
      {/* ✅ Mobile Drawer Button */}
      {isMobile && (
        <div className="fixed top-6 left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="size-9">
                <ArrowDownLeftFromCircleIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4 w-[250px] overflow-y-auto">
              <div className="space-y-6 mt-8">
                {/* App title */}
                <h2 className="text-xl font-bold">Dashboard</h2>

                {/* General section */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    General
                  </p>
                  <div className="space-y-1">
                    {coachSection.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition",
                            pathname === item.href && "bg-muted font-semibold"
                          )}
                        >
                          <item.icon className="size-5" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>

                {/* Admin section */}
                {user?.role === "admin" && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Admin
                    </p>
                    <div className="space-y-1">
                      {adminSection.map((item) => (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition",
                              pathname === item.href && "bg-muted font-semibold"
                            )}
                          >
                            <item.icon className="size-5" />
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer section */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Settings
                  </p>
                  <div className="space-y-1">
                    {footerSection.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition",
                            pathname === item.href && "bg-muted font-semibold"
                          )}
                        >
                          <item.icon className="size-5" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* ✅ Desktop Sidebar */}
      {!isMobile && sidebarContent}
    </>
  );
};
