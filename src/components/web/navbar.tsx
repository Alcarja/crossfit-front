// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import {
  SearchIcon,
  PlusCircleIcon,
  HeartIcon,
  User2Icon,
  UserIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  Calendar,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/authContext";

// --- optional: use media query internally if you don't already pass isMobile
function useIsMobile(query = "(max-width: 767px)") {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setIsMobile(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);
  return isMobile;
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile(); // or replace with your prop/logic

  // ---- Desktop / Tablet (Top Navbar) ----
  if (!isMobile) {
    return (
      <nav
        className={cn(
          "sticky top-0 z-50 w-full border-b-[1.5px] px-4 md:px-8 py-2 md:py-0 bg-white border-secondary"
        )}
      >
        <div className="flex md:justify-between justify-end items-center h-16 w-full">
          {/* Left: Logo (only visible on sm+) */}
          <div className="hidden sm:flex items-center gap-2 pl-2">
            <Link href="/">
              <img src="/logo.png" alt="Logo" className="w-14 h-14" />
            </Link>
          </div>

          {/* Right: Auth / Dropdown */}
          <div className="flex justify-end items-center gap-3 pr-2">
            {!user && (
              <>
                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex gap-2">
                  <Link href="/login">
                    <Button
                      variant="default"
                      size="sm"
                      icon={<User2Icon className="size-4 text-red" />}
                      className="w-[80px] md:w-auto"
                    >
                      Login
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[180px]">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/client">
                    <DropdownMenuItem>
                      <div className="flex items-center justify-between w-full">
                        <p>Dashboard</p>
                        <LayoutDashboardIcon size={16} className="text-red" />
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={logout}>
                    <div className="flex items-center justify-between w-full">
                      <p>Log out</p>
                      <LogOutIcon size={16} className="text-red" />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // ---- Mobile layout: top-left menu button + bottom floating bar ----
  const tabs = [
    { href: "/dashboard/client/my-classes", label: "Calendar", Icon: Calendar },
    { href: "/search", label: "Search", Icon: SearchIcon },
    { href: "/create", label: "New", Icon: PlusCircleIcon }, // center CTA
    { href: "/favorites", label: "Saved", Icon: HeartIcon },
    user
      ? { href: "/dashboard/client", label: "Me", Icon: UserIcon }
      : { href: "/login", label: "Login", Icon: User2Icon },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "/";

  return (
    <>
      {/* bottom floating nav */}
      <nav
        className={cn(
          "sm:hidden fixed inset-x-0 bottom-3 z-[20]", // ⬅️ lifted from bottom
          "px-3 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1"
        )}
        aria-label="Mobile navigation"
      >
        <div
          className={cn(
            "mx-auto max-w-[600px]", // ⬅️ narrower
            "rounded-xl border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60",
            "shadow-[0_6px_16px_rgba(0,0,0,0.1)]",
            "px-2 py-1"
          )}
        >
          <ul className="grid grid-cols-5 items-end">
            {tabs.map(({ href, label, Icon }) => {
              const active = isActive(href);
              const base =
                "flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-lg transition";
              return (
                <li key={href} className="contents">
                  <Link
                    href={href}
                    className={cn(
                      base,
                      active
                        ? "text-red"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "size-4", // ⬅️ smaller icons
                        "size-5",
                        active && "scale-110"
                      )}
                    />
                    <span className="text-[10px] leading-none">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Margin at the top so the content doesn't clash with the sidebar button */}
      <div className="sm:hidden h-[60px]" aria-hidden />
    </>
  );
};
