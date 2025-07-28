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
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { workoutsByDateRangeQueryOptions } from "@/app/queries/workouts";
import { Workout } from "../types";
import { WorkoutDialog } from "./workout-dialog";

export const WorkoutsCalendar2 = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const start = useMemo(
    () => new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0],
    [selectedYear, selectedMonth]
  );

  const end = useMemo(() => {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    return lastDay.toISOString().split("T")[0];
  }, [selectedYear, selectedMonth]);

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
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    const days: Date[] = [];

    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() - i - 1);
      days.push(d);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(selectedYear, selectedMonth, i));
    }

    const trailing = 42 - days.length;
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(lastDay);
      d.setDate(lastDay.getDate() + i);
      days.push(d);
    }

    return days;
  }, [selectedYear, selectedMonth]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    workouts.forEach((w: any) => years.add(new Date(w.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [workouts]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search workouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={String(selectedMonth)}
          onValueChange={(val) => setSelectedMonth(parseInt(val))}
        >
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[120px]">
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
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-sm font-semibold text-center">
            {day}
          </div>
        ))}

        {calendarDays.map((date, i) => {
          try {
            const dateStr = date.toISOString().split("T")[0];
            const isCurrentMonth = date.getMonth() === selectedMonth;
            const dayWorkouts = workoutsByDate[dateStr] || [];
            const isToday = isSameDay(date, today);

            return (
              <div
                key={i}
                className={`border rounded-md p-2 min-h-[100px] text-sm
                  ${isToday ? "bg-blue-400 text-white font-semibold" : ""}
                  ${!isToday && isCurrentMonth ? "bg-white" : ""}
                  ${!isToday && !isCurrentMonth ? "bg-muted text-gray-500" : ""}
                `}
              >
                <div className="font-medium mb-1">
                  {date.getDate().toString().padStart(2, "0")}
                </div>
                <div className="space-y-1">
                  {dayWorkouts
                    .filter((w) =>
                      w.parts?.some((p) =>
                        p.content?.toLowerCase().includes(search.toLowerCase())
                      )
                    )
                    .map((workout) => (
                      <WorkoutDialog key={workout.id} workout={workout} />
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
