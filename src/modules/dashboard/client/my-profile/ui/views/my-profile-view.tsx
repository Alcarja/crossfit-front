"use client";

import * as React from "react";
import {
  User2,
  Mail,
  Phone,
  Activity,
  CreditCard,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PersonalInformation } from "../components/personalInformation";
import { Plans } from "../components/plans";
import { PersonalActivity } from "../components/personalActivity";
import { useAuth } from "@/context/authContext";
import { useQuery } from "@tanstack/react-query";
import { userByIdQueryOptions } from "@/app/queries/users";

export type UserData = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  birthDay: Date;
};

export const MyProfileView = () => {
  const { user } = useAuth();

  const { data: userData } = useQuery(userByIdQueryOptions(Number(user?.id)));

  const userInfo = userData?.user?.[0];

  React.useEffect(() => {
    console.log("data", userData);
  }, [userData]);

  return (
    <>
      <main className="h-auto w-full bg-white text-gray-900 md:py-6 md:px-9">
        {/* Header only in desktop */}
        <div className="mb-6 hidden flex-col gap-3 ml-6 mt-3 md:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border bg-background p-2 shadow-sm">
              <User2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Mi perfil
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra tu información personal y consulta tus datos y planes
                activos
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto w-full max-w-3xl md:max-w-[1400px] 2xl:max-w-[1600px] px-4 md:px-8 lg:px-12 pt-3 md:pt-6">
          {/* Top: avatar + name with subtle personality */}
          {/* Mobile */}
          <div className="md:hidden">
            <div className="rounded-3xl p-[1.5px]">
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="flex items-center gap-4 p-4 sm:p-6">
                  <Avatar className="h-16 w-16 border shadow-sm">
                    {userInfo?.avatarUrl ? (
                      <AvatarImage
                        src={userInfo?.avatarUrl}
                        alt={userInfo?.name}
                      />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {getInitials(userInfo?.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl sm:text-2xl font-semibold leading-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {userInfo?.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <Chip>
                        <Mail className="h-4 w-4" />
                        {userInfo?.email}
                      </Chip>
                      {userInfo?.phone ? (
                        <Chip>
                          <Phone className="h-4 w-4" />
                          {userInfo?.phone}
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="rounded-3xl p-[1.5px]">
              <Card className="rounded-3xl shadow-sm">
                <CardContent className="grid grid-cols-12 items-center gap-6 p-8">
                  {/* Left: big avatar */}
                  <div className="col-span-2 flex justify-center">
                    <Avatar className="h-24 w-24 border shadow-sm ring-2 ring-indigo-500/15">
                      {userData?.user.avatarUrl ? (
                        <AvatarImage
                          src={userInfo?.avatarUrl}
                          alt={userInfo?.name}
                        />
                      ) : null}
                      <AvatarFallback className="text-xl">
                        {getInitials(userInfo?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Middle: name + contact chips */}
                  <div className="col-span-7 min-w-0">
                    <h2 className="truncate text-3xl font-semibold leading-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {userInfo?.name}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <Chip>
                        <Mail className="h-5 w-5" />
                        {userInfo?.email}
                      </Chip>
                      {userInfo?.phoneNumber ? (
                        <Chip>
                          <Phone className="h-5 w-5" />
                          {userInfo?.phoneNumber}
                        </Chip>
                      ) : null}
                      {userInfo?.birthDay ? (
                        <Chip>
                          <Calendar className="h-5 w-5" />
                          {formatDate(userInfo?.birthDay)}
                        </Chip>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: quick facts (compact info tiles) */}
                  <div className="col-span-3 hidden lg:flex items-center justify-end gap-3">
                    {userInfo?.createdAt ? (
                      <div className="rounded-xl border px-3 py-2 text-sm">
                        <div className="text-xs text-muted-foreground">
                          Miembro desde
                        </div>
                        <div className="font-medium">
                          {formatDate(userInfo?.createdAt)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="datos" className="mt-4 md:mt-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/60 p-1">
              <TabsTrigger
                value="datos"
                className="rounded-xl md:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Datos
              </TabsTrigger>
              <TabsTrigger
                value="planes"
                className="rounded-xl md:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Planes
              </TabsTrigger>
              <TabsTrigger
                value="actividad"
                className="rounded-xl md:px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Actividad
              </TabsTrigger>
            </TabsList>

            {/* Tab: Datos */}
            <TabsContent value="datos" className="mt-3 md:mt-5">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                    Información personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInformation userId={user?.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Planes */}
            <TabsContent value="planes" className="mt-3 md:mt-5">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
                    Tu plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Plans userId={user?.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Actividad */}
            <TabsContent value="actividad" className="mt-3 md:mt-5">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <Activity className="h-5 w-5 md:h-6 md:w-6" />
                    Resumen de actividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalActivity userId={user?.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

// ---------- Small, readable subcomponents ----------

function getInitials(name: string) {
  const parts = name?.trim().split(/\s+/).slice(0, 2);
  return parts?.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  const [y, m, d] = iso.slice(0, 10).split("-"); // -> ["2025","07","12"]
  return `${d}/${m}/${y}`; // -> "12/07/2025"
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-1 text-muted-foreground">
      {children}
    </span>
  );
}
