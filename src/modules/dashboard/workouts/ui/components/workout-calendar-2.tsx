/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { workoutsByDateRangeQueryOptions } from "@/app/queries/workouts";
import { Workout } from "../types";
import { WorkoutDialog } from "./workout-dialog";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  isBefore,
  isSameDay as isSameDayFn,
  format,
} from "date-fns";

export const WorkoutsCalendar2 = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const calendarStartDate = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    return startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  }, [selectedYear, selectedMonth]);

  const calendarEndDate = useMemo(() => {
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    return endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });
  }, [selectedYear, selectedMonth]);

  const start = useMemo(
    () => calendarStartDate.toISOString().split("T")[0],
    [calendarStartDate]
  );

  const end = useMemo(
    () => calendarEndDate.toISOString().split("T")[0],
    [calendarEndDate]
  );

  const { data: workouts = [] } = useQuery(
    workoutsByDateRangeQueryOptions(start, end)
  );

  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w: any) => {
      const key = w.date.split("T")[0];
      map[key] = map[key] || [];
      map[key].push(w);
    });
    return map;
  }, [workouts]);

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) => isSameDayFn(d1, d2);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let current = new Date(calendarStartDate);

    while (isBefore(current, addDays(calendarEndDate, 1))) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }

    return days;
  }, [calendarStartDate, calendarEndDate]);

  const availableYears = [2025, 2026, 2027, 2028];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center py-2">
        <Select
          value={String(selectedMonth)}
          onValueChange={(val) => setSelectedMonth(parseInt(val))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }).map((_, i) => (
              <SelectItem key={i} value={String(i)}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(selectedYear)}
          onValueChange={(val) => setSelectedYear(parseInt(val))}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar grid */}
      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Weekday headers: show only on large screens */}
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div
            key={day}
            className="hidden lg:block text-sm font-semibold text-center"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((date, i) => {
          try {
            const dateStr = format(date, "yyyy-MM-dd");
            const isCurrentMonth = date.getMonth() === selectedMonth;
            const dayWorkouts = workoutsByDate[dateStr] || [];
            const isToday = isSameDay(date, today);

            return (
              <div
                key={i}
                className={`border rounded-md p-2 min-h-[100px] text-sm
            ${isToday ? "border-2 border-blue-400 font-semibold" : ""}
            ${!isToday && isCurrentMonth ? "bg-white" : ""}
            ${!isToday && !isCurrentMonth ? "bg-muted text-gray-500" : ""}
          `}
              >
                {/* Show day name inside cell on small screens */}
                <div className="block lg:hidden text-xs font-semibold text-muted-foreground mb-1">
                  {format(date, "EEE")}
                </div>

                {/* Day number */}
                <div className="font-medium mb-1">
                  {date.getDate().toString().padStart(2, "0")}
                </div>

                {/* Workouts */}
                <div className="space-y-1">
                  {dayWorkouts.map((workout) => (
                    <WorkoutDialog
                      key={workout.id}
                      workout={workout}
                      isToday={isToday}
                    />
                  ))}
                </div>
              </div>
            );
          } catch (err) {
            console.error("Invalid calendar entry:", date, err);
            return null;
          }
        })}
      </div>
    </div>
  );
};
