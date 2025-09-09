/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarCheck, Tag } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classesByDayQueryOptions,
  useCancelEnrollmentClient,
  useEnrollInClassClient,
  useGetClassById,
  userReservationsByMonthQueryOptions,
} from "@/app/queries/schedule";
import { toast } from "sonner";
import { typeColors } from "@/components/types/types";
import { sendTemplateEmail } from "@/app/adapters/api";

export const MyClassesView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id ?? undefined;

  //const [classes, setClasses] = useState<any[]>([]); //Get the classes from the backend
  const [drawerOpen, setDrawerOpen] = useState(false); //Control the drawer state
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  //Gets the current month
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  //Stores the selected date, on first load it loads today
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd") // The format that the back expects --> yyyy-MM-dd
  );

  //Changes the selected date
  const handleSelectDate = React.useCallback((d: Date) => {
    const formatted: string = format(d, "yyyy-MM-dd"); // The format that the back expects --> yyyy-MM-dd
    setSelectedDate(formatted);
  }, []);

  //Handles the change of the month
  const handleChangeMonth = useCallback((m: Date) => {
    setCurrentMonth(m);
  }, []);

  // When a user clicks a class, it passes the id from the list of classes to here to get the info of the specific class
  const { data: classById } = useQuery(useGetClassById(selectedClassId));

  //Gets the user enrollment in the selected class if it exists
  const userEnrollment = classById?.classEnrollments?.find(
    (e: any) => e.userId === userId
  );

  const userStatus = userEnrollment?.status; // "enrolled" | "waitlist" | "cancelled" | undefined

  const showCancelButton =
    userStatus === "enrolled" || userStatus === "waitlist";

  const showReserveButton =
    !userEnrollment ||
    userStatus === "cancelled" ||
    userStatus === "cancelled_late";

  //This gets all the classes for a given day. If you add the userId it tells you if the user is enrolled or in waitlist for that class
  const { data: classesByDayData } = useQuery(
    classesByDayQueryOptions(selectedDate, userId)
  );

  //Formats the month into yyyy-MM so the backend can use it
  const formattedMonth = format(currentMonth, "yyyy-MM");

  const { data: userReservations } = useQuery(
    userReservationsByMonthQueryOptions(userId, formattedMonth)
  );

  const selectedClass = classById;

  const { mutateAsync: cancelEnrollmentClient, isPending: isCancelling } =
    useCancelEnrollmentClient();

  const handleCancelReservation = async (userId: number, classId: number) => {
    console.log("user id", userId);
    console.log("class id", classId);

    try {
      // call the mutation
      await cancelEnrollmentClient({ userId, classId });

      // invalidate the relevant caches (adjust selectedDate from your state)
      await queryClient.invalidateQueries({
        queryKey: classesByDayQueryOptions(selectedDate, userId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: ["classEnrollments", classId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["classById", classId],
      });

      const month = format(selectedDate, "yyyy-MM");
      await queryClient.invalidateQueries({
        queryKey: userReservationsByMonthQueryOptions(userId, month).queryKey,
      });

      // optional: user feedback
      // const msg = res?.late
      //   ? "Cancelación fuera de plazo (no se reembolsa el crédito)."
      //   : res?.refunded
      //   ? "Reserva cancelada y crédito reembolsado."
      //   : "Reserva cancelada.";
      // toast.success(msg);
    } catch (err: any) {
      // toast.error(err?.error ?? "No se pudo cancelar la reserva");
      console.error(err);
    }
  };

  useEffect(() => {
    console.log("Class by id", classById);
  }, [classById]);

  const { mutateAsync: enrollInClass, isPending } = useEnrollInClassClient(); // uses the client route

  const handleMakeReservation = async (userId: number, classId: number) => {
    console.log("user id", userId);
    console.log("class id", classId);

    if (!selectedClass) return;

    if (!userId || Number.isNaN(userId)) {
      console.error("Invalid user id");
      toast.error("Usuario inválido");
      return;
    }

    try {
      await enrollInClass({ userId, classId });

      await queryClient.invalidateQueries({
        queryKey: classesByDayQueryOptions(selectedDate, userId).queryKey,
      });

      await queryClient.invalidateQueries({
        queryKey: ["classEnrollments", selectedClass.id],
      });

      await queryClient.invalidateQueries({
        queryKey: userReservationsByMonthQueryOptions(userId, formattedMonth)
          .queryKey,
      });

      await queryClient.invalidateQueries({
        queryKey: ["classById", classId],
      });

      toast.success("Reserva confirmada");
      setDrawerOpen(false);
    } catch (err: any) {
      // Map server codes to friendly messages
      let message = "Reserva fallida";
      if (err?.code === "BOOKING_WINDOW") {
        const opens =
          err?.opensAt &&
          new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(err.opensAt));
        message = `Las reservas se abren ${opens ? `el ${opens}` : "pronto"}.`;
      } else if (err?.code === "NO_CREDITS") {
        message = "No te quedan créditos.";
      } else if (err?.code === "DUPLICATE_ENROLLMENT") {
        message = "Ya tienes una reserva para esta hora.";
      } else if (typeof err?.error === "string") {
        message = err.error;
      }

      console.error("Enrollment failed:", err);
      toast.error(message);
    }
  };

  const enrolled = (selectedClass?.classEnrollments ?? []).filter(
    (e: any) => String(e.status) === "enrolled"
  );

  const sendEmail = async () => {
    await sendTemplateEmail({
      userId: 1,
      template: "WAITLIST_PROMOTED",
      params: {
        className: "CrossFit WOD",
        classTime: "Today 18:30",
        ctaUrl: `/classes/abc123`,
      },
    });
  };

  return (
    <>
      <main className="h-auto w-full bg-white text-gray-900 md:py-6 md:px-9">
        {/* Header only in desktop */}
        <div className="mb-6 flex-col gap-3 hidden md:flex ml-6 mt-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border bg-background p-2 shadow-sm">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Mis clases
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra tus reservas para las distintas clases.
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full md:grid md:grid-cols-6 md:gap-6 p-4 sm:p-6">
          {/* Calendar (mobile: top ~half; desktop: left column) */}
          <section className="md:col-span-2">
            <CalendarPanel
              userReservations={userReservations}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate} //This passes back the select date function so the state in the parent can be changed from the child component
              onChangeMonth={handleChangeMonth}
            />
          </section>

          {/* Classes list (mobile: bottom ~half; desktop: right side) */}
          <section className="md:col-span-4 mt-6 md:mt-0">
            <ClassesPanel
              classData={classesByDayData}
              onSelectClassId={(id) => {
                setSelectedClassId(id);
                setDrawerOpen(true); // trigger Sheet
              }}
            />
          </section>
          <div>
            <Button onClick={() => sendEmail()}>test email</Button>
          </div>
        </div>
      </main>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[75vh] md:h-auto p-0 overflow-hidden z-50 rounded-t-2xl md:rounded-2xl md:bottom-6">
          {" "}
          {/* Use a column layout: fixed top, scrollable middle, fixed bottom */}
          <div className="flex h-full flex-col">
            {/* TOP (fixed) */}
            <div className="shrink-0 bg-white border-b md:px-5">
              <DrawerHeader className="px-4 py-3 space-y-2">
                {/* Row 0 — class type (top-left) */}
                <div className="flex items-center">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                      ((t) => {
                        if (!t) return "bg-gray-100 text-gray-700";
                        const exact = typeColors[t];
                        if (exact) return exact;
                        const upper = typeColors[t.toUpperCase?.()] as
                          | string
                          | undefined;
                        if (upper) return upper;
                        const title =
                          t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
                        return typeColors[title] ?? "bg-gray-100 text-gray-700";
                      })(selectedClass?.classInformation?.type)
                    }
                  >
                    {selectedClass?.classInformation?.type}
                  </span>
                </div>

                {/* Row 1 — time (emphasized) + cupo badge */}
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-2xl font-bold leading-none">
                    {selectedClass?.classInformation?.startTime}
                    <span className="mx-2 text-base font-medium">–</span>
                    {selectedClass?.classInformation?.endTime}
                  </div>

                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      selectedClass?.aggregates?.enrolledCount >=
                      selectedClass?.classInformation?.capacity
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700",
                    ].join(" ")}
                  >
                    Cupo: {selectedClass?.aggregates?.enrolledCount}/
                    {selectedClass?.classInformation?.capacity}
                  </span>
                </div>

                {/* Row 2 — date (left) • zone/coach (right) */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{selectedClass?.classInformation?.date}</span>
                  <span className="truncate">
                    {selectedClass?.classInformation?.zoneName
                      ? `${selectedClass?.classInformation?.zoneName} • `
                      : ""}
                    {selectedClass?.classInformation?.coachName}
                  </span>
                </div>
              </DrawerHeader>
            </div>

            {/* MIDDLE (scrollable) */}
            <div className="overflow-y-auto px-4 md:px-40 pt-5 pb-10 h-full">
              {/* Avatars in centered rows of ~4–5 */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-6">
                {enrolled === 0 ? (
                  <div className="text-gray-600 px-6 py-4 rounded-md text-md text-center">
                    No users in this class yet
                  </div>
                ) : (
                  enrolled?.map((a: any) => {
                    const initials = a.userName?.slice(0, 2).toUpperCase();
                    const bgColors = [
                      "bg-red-500",
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-purple-500",
                      "bg-pink-500",
                      "bg-indigo-500",
                    ];
                    const colorIndex =
                      a.userName?.charCodeAt(0) % bgColors.length;
                    const bgColor = bgColors[colorIndex];

                    return (
                      <div
                        key={a.id}
                        className="flex w-20 flex-col items-center"
                      >
                        {a.avatarUrl ? (
                          <img
                            src={a.avatarUrl}
                            alt={a.userName}
                            className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-md font-medium ring-1 ring-gray-200 ${bgColor}`}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="mt-1 text-xs text-gray-700 truncate w-full text-center">
                          {a.userName}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* BOTTOM (sticky, shadcn buttons) */}
            <div className="shrink-0 sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="p-4 space-y-2">
                {showCancelButton && (
                  <Button
                    variant="delete"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isCancelling}
                    onClick={() =>
                      handleCancelReservation(
                        userId!,
                        classById?.classInformation?.id
                      )
                    }
                  >
                    {userStatus === "enrolled"
                      ? "Cancelar reserva"
                      : "Cancelar de lista de espera"}
                  </Button>
                )}

                {showReserveButton && (
                  <Button
                    className="w-full h-11 text-base font-semibold bg-green-600 text-white hover:text-green-600 hover:border-green-600"
                    onClick={() =>
                      handleMakeReservation(
                        userId!,
                        classById?.classInformation?.id
                      )
                    }
                    disabled={isPending}
                  >
                    {isPending ? "Reservando..." : "Reservar"}
                  </Button>
                )}

                <DrawerFooter className="p-0">
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full h-10">
                      Cerrar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

type CalendarPanelProps = {
  currentMonth: Date;
  selectedDate: string | null;
  onSelectDate: (d: Date) => void;
  onChangeMonth: (m: Date) => void;
  userReservations: [];
};

export function CalendarPanel({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  userReservations,
}: CalendarPanelProps) {
  //Gets the name of the selected month
  const monthLabel = format(currentMonth, "MMMM yyyy");

  //Gets the first day to show in the calendar grid
  const firstDayToShow = React.useMemo(
    () => startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    [currentMonth]
  );

  //Gets the last day to show in the calendar grid
  const lastDayToShow = React.useMemo(
    () => endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    [currentMonth]
  );

  //Gets the days in between to show in the calendar
  const days = React.useMemo(
    () => eachDayOfInterval({ start: firstDayToShow, end: lastDayToShow }),
    [firstDayToShow, lastDayToShow]
  );

  //Handles changing the month
  const gotoPrev = React.useCallback(
    () => onChangeMonth(addMonths(currentMonth, -1)),
    [currentMonth, onChangeMonth]
  );

  const gotoNext = React.useCallback(
    () => onChangeMonth(addMonths(currentMonth, 1)),
    [currentMonth, onChangeMonth]
  );

  //Gets the names of the week days (Lun, Mar, Mier...)
  const weekdayLabels = React.useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) =>
      format(addDaysSafe(start, i), "EEE")
    );
  }, []);

  useEffect(() => {
    console.log("user reservationssdfkjshdflksdhf", userReservations);
  }, [userReservations]);

  // SWIPE CONTROLS FOR MOBILE
  const touchStartRef = React.useRef<{
    x: number;
    y: number;
    t: number;
  } | null>(null);
  const didSwipeRef = React.useRef(false);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // ignore multi-touch
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    didSwipeRef.current = false;
  }, []);

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      if (!start) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dt = Date.now() - start.t;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Tune these thresholds to taste
      const distanceOK = absX > 48; // min horizontal movement (px)
      const angleOK = absX > absY * 1.15; // mostly horizontal
      const speedOK = dt < 450 || absX > 96; // quick or long enough

      if (distanceOK && angleOK && speedOK) {
        if (dx < 0) gotoNext();
        else gotoPrev();
        didSwipeRef.current = true; // so a tap doesn't select a day
      }

      touchStartRef.current = null;
    },
    [gotoNext, gotoPrev]
  );

  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <button
          type="button"
          aria-label="Previous month"
          onClick={gotoPrev}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
        >
          ◀
        </button>
        <h2 className="text-base sm:text-lg font-semibold select-none">
          {monthLabel}
        </h2>
        <button
          type="button"
          aria-label="Next month"
          onClick={gotoNext}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.99]"
        >
          ▶
        </button>
      </div>

      {/* Calendar grid */}
      <div
        className="px-2 pb-3 sm:px-4 touch-pan-y" // keep vertical page scroll natural
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {" "}
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-medium text-gray-500">
          {weekdayLabels.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        {/* Dates */}
        <div className="grid grid-cols-7 gap-y-1 text-sm sm:text-base md:min-h-[40vh] min-h-[20vh]">
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const selectedDay = selectedDate ?? "";
            const dayKey = format(day, "yyyy-MM-dd");
            const isSelected = selectedDay === dayKey;
            const today = isToday(day);

            // 🔍 Find reservation for the day
            const reservation: any = userReservations?.find(
              (r: any) => r.date === dayKey
            );
            const status = reservation?.status; // 'enrolled' | 'waitlist' | undefined

            return (
              <div
                key={day.toISOString()}
                className="flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={[
                    "mx-auto flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition",
                    inMonth ? "text-gray-900" : "text-gray-400",
                    today && !isSelected ? "ring-1 ring-gray-300" : "",
                    isSelected ? "bg-gray-900 text-white" : "hover:bg-gray-100",
                  ].join(" ")}
                  aria-label={format(day, "PPP")}
                  aria-pressed={isSelected}
                >
                  {format(day, "d")}
                </button>

                {/* 🔵 Dot under the day */}
                {status === "enrolled" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
                )}
                {status === "waitlist" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type Class = {
  capacity: number;
  coachId?: number;
  date: string;
  endTime: string;
  enrolledCount: number;
  id: number;
  isCancelled?: boolean;
  name?: string;
  startTime: string;
  type: string;
  waitlistCount: number;
  zoneName: string;
  userStatus: string;
};

//Props for the component
type ClassesPanelProps = {
  onSelectClassId: (id: number) => void;
  classData: { instances: Class[] }; // ClassData is an array of classes
};

function ClassesPanel({ onSelectClassId, classData }: ClassesPanelProps) {
  useEffect(() => {
    console.log("Class data", classData);
  }, [classData]);

  const getNowInTz = (timeZone: string) => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .reduce<Record<string, string>>((acc, p) => {
        if (p.type !== "literal") acc[p.type] = p.value;
        return acc;
      }, {});
    const yyyy = parts.year,
      mm = parts.month,
      dd = parts.day;
    const HH = parts.hour,
      MM = parts.minute;
    return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` };
  };

  const isInactive = (c: Class) => {
    // Cancelled are always blocked
    if (c.isCancelled) return true;

    // Defensive defaults
    const tz = c.zoneName || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = getNowInTz(tz);

    // Future day -> active; past day -> inactive
    if (c.date > now.date) return false;
    if (c.date < now.date) return true;

    // Same day: hide if class already ended (endTime <= now)
    // Works for "HH:MM" or "HH:MM:SS" strings
    const end = c.endTime.slice(0, 5); // "HH:MM"
    return end <= now.time;
  };

  if (classData?.instances?.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 h-auto overflow-auto flex items-center justify-center text-gray-400">
        <span className="text-sm">No classes scheduled for today.</span>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {classData?.instances?.map((c: Class) => {
        const inactive = isInactive(c);
        const typeClass =
          typeColors[c.type as keyof typeof typeColors] ??
          "bg-gray-200 text-gray-900"; // fallback

        return (
          <div
            key={c.id}
            role="button"
            aria-disabled={inactive}
            title={inactive ? "This class is no longer available" : ""}
            className={[
              "flex justify-between p-2 first:border-t last:border-b border-gray-200 rounded-md transition",
              inactive
                ? "opacity-50 pointer-events-none cursor-not-allowed select-none"
                : "bg-white hover:bg-gray-50 cursor-pointer",
            ].join(" ")}
            onClick={() => {
              if (!inactive) onSelectClassId(c.id);
            }}
          >
            {/* left */}
            <div className="flex gap-5">
              {/* Time */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {c.startTime}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {c.endTime}
                </span>
              </div>

              {/* Badge (tiny placeholder) */}
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200">
                  <Tag className="w-4 h-4 text-gray-600" />
                </span>
              </div>

              {/* Class type */}
              <div className="flex flex-col items-start gap-1">
                {/* colored pill using your map */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${typeClass}`}
                >
                  {c.type}
                </span>

                <span className="text-sm font-regular text-gray-600">
                  {c.coachId} - {c.zoneName}
                </span>

                {c.isCancelled && (
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* right */}
            <div className="flex flex-col items-end sm:mt-0 gap-1">
              <span className="text-sm font-semibold text-gray-900 pr-2">
                {c.enrolledCount}/{c.capacity}
              </span>
              {c.userStatus === "enrolled" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Enrolled
                </span>
              )}
              {c.userStatus === "waitlist" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Waitlist
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Helpers ---
function addDaysSafe(date: Date, amount: number) {
  // small inline helper so we don't pull another fn
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}
