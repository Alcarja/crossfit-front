"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";

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
  DollarSignIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const coachSection = [
  { icon: Calendar1, label: "Calendar", href: "/dashboard/coach" },
  {
    icon: NotepadText,
    label: "Expenses",
    href: "/dashboard/coach/expenses",
  },
  { icon: DumbbellIcon, label: "Workouts", href: "/dashboard/coach/workouts" },
];

const adminSections = {
  Transactions: [
    {
      icon: DollarSignIcon,
      label: "Transactions",
      href: "/dashboard/admin/transactions",
    },
    {
      icon: ShoppingBasketIcon,
      label: "Inventory",
      href: "/dashboard/admin/inventory",
    },
  ],
  Classes: [
    {
      icon: Calendar1Icon,
      label: "Classes",
      href: "/dashboard/admin/classes/dashboard",
    },
    {
      icon: SettingsIcon,
      label: "Class Settings",
      href: "/dashboard/admin/classes/settings",
    },
    {
      icon: DollarSignIcon,
      label: "Tariff Plans",
      href: "/dashboard/admin/classes/tariffs",
    },
  ],
  Coaches: [
    {
      icon: CircleUserRound,
      label: "Coaches",
      href: "/dashboard/admin/coaches",
    },
    {
      icon: UserPlus2,
      label: "Register Coach",
      href: "/dashboard/admin/register",
    },
  ],
};

// CLIENT: personal info only
const clientSection = [
  {
    icon: Calendar1Icon,
    label: "My Classes",
    href: "/dashboard/client/my-classes",
  },
  {
    icon: SettingsIcon,
    label: "My Profile",
    href: "/dashboard/client/my-profile",
  },
  {
    icon: DollarSignIcon,
    label: "My Purchases",
    href: "/dashboard/client",
  },
];

const footerSection = [
  { icon: Settings2Icon, label: "Settings", href: "/dashboard/settings" },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();

  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isCoach = user?.role === "coach";

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
        <div className="h-full flex flex-col justify-between">
          <div className="flex flex-col justify-start">
            {(isAdmin || isCoach) && (
              <>
                <SidebarGroup>
                  {state !== "collapsed" && (
                    <h3 className="text-xs text-red font-semibold text-muted-foreground uppercase tracking-wide mb-1 pl-2">
                      Coach Section
                    </h3>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {coachSection.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton
                                  asChild
                                  className={cn(
                                    "h-9 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                    pathname === item.href &&
                                      "bg-linear-to-r/oklch border-[#5D6B68]/10"
                                  )}
                                  isActive={pathname === item.href}
                                >
                                  <Link href={item.href}>
                                    <item.icon className="size-7 mr-2" />
                                    {state !== "collapsed" && (
                                      <span className="text-sm font-medium tracking-tight">
                                        {item.label}
                                      </span>
                                    )}
                                  </Link>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className={cn(
                                  state !== "collapsed" && "hidden"
                                )}
                              >
                                <span>{item.label}</span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}

            <div className="flex h-auto flex-col justify-start">
              {isAdmin && (
                <>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {Object.entries(adminSections).map(
                          ([subsectionTitle, items]) => (
                            <div
                              key={subsectionTitle}
                              className={cn(
                                "mb-1 rounded-md",
                                state !== "collapsed" && "px-2 py-1"
                              )}
                            >
                              {state !== "collapsed" && (
                                <p className="text-[0.7rem] font-semibold uppercase text-muted-foreground mb-1 tracking-wide px-1">
                                  {subsectionTitle}
                                </p>
                              )}

                              {items.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <SidebarMenuButton
                                          asChild
                                          className={cn(
                                            "h-9 flex items-center gap-2 border border-transparent hover:bg-linear-to-r/oklch hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                            pathname === item.href &&
                                              "bg-linear-to-r/oklch border-[#5D6B68]/10",
                                            state !== "collapsed" && "pl-6"
                                          )}
                                          isActive={pathname === item.href}
                                        >
                                          <Link
                                            href={item.href}
                                            className="flex items-center gap-1 w-full"
                                          >
                                            <item.icon className="size-6 shrink-0" />
                                            {state !== "collapsed" && (
                                              <span className="text-sm font-medium tracking-tight">
                                                {item.label}
                                              </span>
                                            )}
                                          </Link>
                                        </SidebarMenuButton>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="right"
                                        className={cn(
                                          state !== "collapsed" && "hidden"
                                        )}
                                      >
                                        <span>{item.label}</span>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </SidebarMenuItem>
                              ))}
                            </div>
                          )
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}
            </div>

            <SidebarGroup>
              {state !== "collapsed" && (
                <h3 className="text-xs text-red font-semibold text-muted-foreground uppercase tracking-wide mb-1 pl-2">
                  Client Section
                </h3>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {clientSection.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              className={cn(
                                "h-9 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                pathname === item.href &&
                                  "bg-linear-to-r/oklch border-[#5D6B68]/10"
                              )}
                              isActive={pathname === item.href}
                            >
                              <Link href={item.href}>
                                <item.icon className="size-7 mr-2" />
                                {state !== "collapsed" && (
                                  <span className="text-sm font-medium tracking-tight">
                                    {item.label}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className={cn(state !== "collapsed" && "hidden")}
                          >
                            <span>{item.label}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
          {(isAdmin || isCoach) && (
            <div>
              <SidebarGroup className="mb-3">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {footerSection.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "h-9 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
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
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <>
      {isMobile && (
        <div className="fixed top-6 left-4 z-200">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="size-9">
                <ArrowDownLeftFromCircleIcon />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="p-4 w-[250px] overflow-y-auto pt-12"
            >
              <div className="space-y-6 mt-8">
                {(isAdmin || isCoach) && (
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
                )}

                {user?.role === "admin" && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      Admin
                    </p>

                    {Object.entries(adminSections).map(
                      ([sectionName, links]) => (
                        <div key={sectionName} className="mb-2">
                          <p className="text-xs text-muted-foreground font-semibold uppercase mb-2 pl-1">
                            {sectionName}
                          </p>
                          <div className="space-y-1">
                            {links.map((item) => (
                              <SheetClose asChild key={item.href}>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    "flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-muted transition",
                                    pathname === item.href &&
                                      "bg-muted font-semibold"
                                  )}
                                >
                                  <item.icon className="size-5" />
                                  {item.label}
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Client
                  </p>

                  {clientSection.map((item) => (
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

                {(isAdmin || isCoach) && (
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
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {!isMobile && sidebarContent}
    </>
  );
};
