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

const mockClasses: Class[] = [
  {
    id: 1,
    date: "07-09-2025",
    startTime: "09:00",
    endTime: "10:00",
    name: "Morning Yoga",
    type: "yoga",
    zoneName: "Studio A",
    coachName: "Alice",
    capacity: 15,
    attendants: 3,
    isCancelled: false,
    isInscribed: true,
    isWaitlist: false,
  },
  {
    id: 2,
    date: "07-09-2025",
    startTime: "11:00",
    endTime: "12:00",
    name: "HIIT Training",
    type: "hiit",
    zoneName: "Main Hall",
    coachName: "Bob",
    capacity: 20,
    attendants: 2,
    isCancelled: false,
    isInscribed: false,
    isWaitlist: true,
  },
  {
    id: 3,
    date: "07-09-2025",
    startTime: "18:00",
    endTime: "19:30",
    name: "Evening Pilates",
    type: "pilates",
    zoneName: "Studio B",
    coachName: "Charlie",
    capacity: 12,
    attendants: 0,
    isCancelled: true,
    isInscribed: false,
    isWaitlist: false,
  },
];

const attendees: Array<{ id: string; firstName: string; avatarUrl: string }> = [
  {
    id: "u1",
    firstName: "Leo",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Leo",
  },
  {
    id: "u2",
    firstName: "Mia",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Mia",
  },
  {
    id: "u3",
    firstName: "Noah",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Noah",
  },
  {
    id: "u4",
    firstName: "Ava",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Ava",
  },
  {
    id: "u5",
    firstName: "Liam",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Liam",
  },
  {
    id: "u6",
    firstName: "Emma",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Emma",
  },
  {
    id: "u7",
    firstName: "Sofia",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Sofia",
  },
  {
    id: "u8",
    firstName: "Lucas",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Lucas",
  },
  {
    id: "u9",
    firstName: "Maya",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Maya",
  },
  {
    id: "u10",
    firstName: "Ethan",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Ethan",
  },
  {
    id: "u11",
    firstName: "Iris",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Iris",
  },
  {
    id: "u12",
    firstName: "Owen",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Owen",
  },
  {
    id: "u13",
    firstName: "Lucas",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Lucas",
  },
  {
    id: "u14",
    firstName: "Maya",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Maya",
  },
  {
    id: "u15",
    firstName: "Ethan",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Ethan",
  },
  {
    id: "u16",
    firstName: "Iris",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Iris",
  },
  {
    id: "u17",
    firstName: "Owen",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Owen",
  },
];

export const MyClassesView = () => {
  //const [classes, setClasses] = useState<any[]>([]); //Get the classes from the backend
  const [drawerOpen, setDrawerOpen] = useState(false); //Control the drawer state
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  //Gets the current month
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  //Stores the selected date, on first load it loads today
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "dd-MM-yyyy")
  );
  //Changes the selected date
  const handleSelectDate = React.useCallback((d: Date) => {
    const formatted: string = format(d, "dd-MM-yyyy"); // e.g. 20-08-2025
    setSelectedDate(formatted);
  }, []);

  //Handles the change of the month
  const handleChangeMonth = useCallback((m: Date) => {
    setCurrentMonth(m);
  }, []);

  const selectedClass = mockClasses[0];

  const showCancel = selectedClass.isInscribed && !selectedClass.isCancelled;

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
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate} //This passes back the select date function so the state in the parent can be changed from the child component
              onChangeMonth={handleChangeMonth}
            />
          </section>

          {/* Classes list (mobile: bottom ~half; desktop: right side) */}
          <section className="md:col-span-4 mt-6 md:mt-0">
            <ClassesPanel
              selectedDate={selectedDate}
              onSelectClassId={(id) => {
                setSelectedClassId(id);
                setDrawerOpen(true); // trigger Sheet
              }}
            />
          </section>
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
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    {selectedClass.type} - — ID #{selectedClass.id}
                  </span>
                </div>

                {/* Row 1 — time (emphasized) + cupo badge */}
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-2xl font-bold leading-none">
                    {selectedClass.startTime}
                    <span className="mx-2 text-base font-medium">–</span>
                    {selectedClass.endTime}
                  </div>

                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      selectedClass.attendants >= selectedClass.capacity
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700",
                    ].join(" ")}
                  >
                    Cupo: {selectedClass.attendants}/{selectedClass.capacity}
                  </span>
                </div>

                {/* Row 2 — date (left) • zone/coach (right) */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{selectedClass.date}</span>
                  <span className="truncate">
                    {selectedClass.zoneName
                      ? `${selectedClass.zoneName} • `
                      : ""}
                    {selectedClass.coachName}
                  </span>
                </div>
              </DrawerHeader>
            </div>

            {/* MIDDLE (scrollable) */}
            <div className="overflow-y-auto px-4 md:px-40 pt-5 pb-10">
              {/* Avatars in centered rows of ~4–5 */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-6">
                {attendees.map((a) => (
                  <div key={a.id} className="flex w-20 flex-col items-center">
                    <img
                      src={a.avatarUrl}
                      alt={a.firstName}
                      className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200"
                    />
                    <span className="mt-1 text-xs text-gray-700 truncate w-full text-center">
                      {a.firstName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM (sticky, shadcn buttons) */}
            <div className="shrink-0 sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="p-4 space-y-2">
                {!showCancel ? (
                  <Button
                    variant="delete"
                    className="w-full h-11 text-base font-semibold"
                    // onClick={() => ...}
                  >
                    Cancelar reserva
                  </Button>
                ) : (
                  <Button
                    className="w-full h-11 text-base font-semibold bg-green-600 text-white hover:text-green-600 hover:border-green-600"
                    // onClick={() => ...}
                  >
                    Reservar
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
};

export function CalendarPanel({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
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
    console.log("Selected date", selectedDate);
  }, [selectedDate]);

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
            const selectedDay = selectedDate ?? ""; // formatted "dd-MM-yyyy" or ""
            const dayKey = format(day, "dd-MM-yyyy");
            const isSelected = selectedDay === dayKey;
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

type Class = {
  id: number;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  name: string;
  type: string;
  zoneName?: string;
  coachName?: string;
  capacity: number;
  attendants: number;
  isCancelled: boolean;
  isInscribed: boolean;
  isWaitlist: boolean;
};

//Props for the component
type ClassesPanelProps = {
  selectedDate: string | null;
  onSelectClassId: (id: number) => void;
};

function ClassesPanel({ selectedDate, onSelectClassId }: ClassesPanelProps) {
  // If selectedDate is not passed properly, fallback to today
  const dateToUse = selectedDate ?? format(new Date(), "dd-MM-yyyy");

  //Filters all the classes recieved and gives you the ones for today. Later I will only bring the classes for the selected day instead of filteringe them
  const classesForSelectedDay = mockClasses.filter((c) => c.date === dateToUse);

  if (classesForSelectedDay.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-6 h-auto overflow-auto flex items-center justify-center text-gray-400">
        <span className="text-sm">No classes scheduled for today.</span>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {classesForSelectedDay.map((c) => (
        <div
          key={c.id}
          className="flex justify-between p-2 bg-white first:border-t last:border-b border-gray-200"
          onClick={() => onSelectClassId(c.id)} // <-- send id to parent
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
            <div className="flex flex-col items-start">
              <span className="text-md font-regular text-gray-900 uppercase">
                {c.type}
              </span>
              <span className="text-sm font-regular text-gray-600">
                {c.coachName} - {c.zoneName}
              </span>
            </div>
          </div>

          {/* right */}
          <div className="flex flex-col items-end sm:mt-0 gap-1">
            {/* Top: attendants / capacity */}
            <span className="text-sm font-semibold text-gray-900 pr-2">
              {c.attendants}/{c.capacity}
            </span>

            <span
              className={[
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                c.isCancelled
                  ? "bg-red-50 text-red-500"
                  : c.isWaitlist
                  ? "bg-yellow-50 text-yellow-600"
                  : c.isInscribed
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-50 text-gray-500",
              ].join(" ")}
            >
              {c.isCancelled
                ? "Cancelled"
                : c.isWaitlist
                ? "Waitlist"
                : c.isInscribed
                ? "Confirmed"
                : "Available"}
            </span>
          </div>
        </div>
      ))}
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
