/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameDay,
  isBefore,
  format,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { workoutsByDateRangeQueryOptions } from "@/app/queries/workouts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Workout } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditWorkoutForm } from "./forms/edit-workout-form";
import { CreateWorkoutForm } from "./forms/create-workout-form";

export const MonthlyWorkoutCalendar = () => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Generate the calendar days
  const allMonthDays = useMemo(() => {
    const start = startOfWeek(
      startOfMonth(new Date(selectedYear, selectedMonth)),
      { weekStartsOn: 1 }
    );
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    const days: Date[] = [];
    let current = new Date(start);

    while (isBefore(current, addDays(end, 7))) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }

    return days;
  }, [selectedMonth, selectedYear]);

  // Break calendar days into weeks
  const weeks = useMemo(() => {
    const chunks: Date[][] = [];
    for (let i = 0; i < allMonthDays.length; i += 7) {
      chunks.push(allMonthDays.slice(i, i + 7));
    }
    return chunks;
  }, [allMonthDays]);

  const start = allMonthDays[0].toISOString().split("T")[0];
  const end = allMonthDays[allMonthDays.length - 1].toISOString().split("T")[0];

  const { data: workouts = [] } = useQuery(
    workoutsByDateRangeQueryOptions(start, end)
  );

  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w: any) => {
      const key = w.date.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(w);
    });
    return map;
  }, [workouts]);

  const availableYears = [2025, 2026, 2027, 2028];

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 py-2">
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

      {/* Weekday headers */}
      <div className="hidden lg:grid grid-cols-7 gap-2 text-center font-semibold text-sm text-gray-600">
        {[
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado",
          "Domingo",
        ].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Weeks */}
      {weeks.map((week, wIndex) => (
        <div
          key={wIndex}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2"
        >
          {week.map((date, i) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const isToday = isSameDay(date, today);
            const workoutsForDay = workoutsByDate[dateStr] || [];

            return (
              <div
                key={i}
                className={`border rounded-md p-2 min-h-[120px] text-sm ${
                  isToday ? "bg-blue-100 ring-2 ring-blue-600" : "bg-white"
                }`}
                onClick={() => {
                  const dateOnly = format(date, "yyyy-MM-dd");
                  setCreateDate(dateOnly);
                  setShowCreateDialog(true);
                }}
              >
                <div className="font-semibold mb-1 text-center">
                  {/* Show weekday name on small screens */}
                  <span className="block lg:hidden text-xs text-muted-foreground">
                    {format(date, "EEE")}
                  </span>
                  {format(date, "dd/MM")}
                </div>

                <div className="space-y-2">
                  {workoutsForDay.map((workout) => (
                    <div
                      key={workout.id}
                      className="bg-gray-50 rounded p-2 border text-left space-y-1 cursor-pointer hover:bg-gray-100"
                      onClick={(e) => {
                        setSelectedWorkout(workout);
                        setShowEditForm(true);
                        e.stopPropagation();
                      }}
                    >
                      <div className="text-xs uppercase font-medium text-gray-500">
                        {workout.type}
                      </div>

                      {workout.parts?.map((part, index) => (
                        <div key={index}>
                          <div className="text-sm font-medium text-blue-700">
                            {part.title}
                          </div>
                          <div
                            className="text-xs text-gray-800"
                            dangerouslySetInnerHTML={{ __html: part.content }}
                          />
                          {part.notes && (
                            <div className="text-xs italic text-gray-500">
                              {part.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {createDate && (
        <CreateWorkoutForm
          open={showCreateDialog}
          setOpen={setShowCreateDialog}
          initialDate={createDate}
        />
      )}
      {selectedWorkout && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="!w-[90%] !max-w-[800px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Workout</DialogTitle>
            </DialogHeader>

            <EditWorkoutForm
              setOpen={setShowEditForm}
              workoutData={selectedWorkout}
              setSelectedWorkout={setSelectedWorkout}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
