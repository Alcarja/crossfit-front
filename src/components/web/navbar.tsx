/* eslint-disable @next/next/no-img-element */
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  User,
  Menu,
  X,
  User2Icon,
  LayoutDashboardIcon,
  LogOutIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b-[1.5px] px-4 md:px-8 py-2 md:py-0 bg-white border-secondary"
      )}
    >
      <div className="grid grid-cols-3 items-center h-16 w-full">
        {/* Left: Logo (only visible on sm+) */}
        <div className="hidden sm:flex items-center gap-2 pl-2">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-14 h-14" />
          </Link>
        </div>

        {/* Center: Navigation */}
        <div className="flex justify-center">
          <div className="hidden md:flex items-center space-x-6 bg-white border border-gray-200 rounded-md px-6 py-2 shadow-sm text-sm font-medium">
            <Link href="/" passHref>
              <button className="text-gray-700 hover:text-black transition-colors">
                Home
              </button>
            </Link>
            <div className="h-4 border-l border-gray-300" />
            <Link href="/explore" passHref>
              <button className="text-gray-700 hover:text-black transition-colors">
                Explore
              </button>
            </Link>
          </div>
        </div>

        {/* Right: Auth / Dropdown / Mobile Toggle */}
        <div className="flex justify-end items-center gap-3 pr-2">
          {!user && (
            <>
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex gap-2">
                {/*  <Link href="/register">
                  <Button
                    size="sm"
                    icon={<LogInIcon className="size-4 text-red" />}
                    className="w-[80px] md:w-auto"
                  >
                    Register
                  </Button>
                </Link> */}
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

              {/* Mobile Dropdown Avatar */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[160px]">
                    <DropdownMenuLabel>Authentication</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* <Link href="/register">
                      <DropdownMenuItem>
                        <LogIn className="mr-2 h-4 w-4" />
                        Register
                      </DropdownMenuItem>
                    </Link> */}
                    <Link href="/login">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Login
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[160px]">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
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
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden ml-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 flex flex-col gap-4 border-t py-5">
          <Link href="/posts">
            <button className="w-full text-left text-muted-foreground hover:text-foreground transition">
              Posts
            </button>
          </Link>
          <Link href="/galleries">
            <button className="w-full text-left text-muted-foreground hover:text-foreground transition">
              Galleries
            </button>
          </Link>
          <Link href="/votations">
            <button className="w-full text-left text-muted-foreground hover:text-foreground transition">
              Votations
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
};
