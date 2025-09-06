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

// If you want localized week starts (e.g., Monday), pass a locale to startOfWeek.
// import { enUS } from 'date-fns/locale';

export const MyClassesView = () => {
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

  return (
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
          <ClassesPanel selectedDate={selectedDate} />
        </section>
      </div>
    </main>
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
      <div className="px-2 pb-3 sm:px-4">
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

//Props for the component
type ClassesPanelProps = {
  selectedDate: string | null;
};

function ClassesPanel({ selectedDate }: ClassesPanelProps) {
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
