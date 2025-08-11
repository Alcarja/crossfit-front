/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as XLSX from "xlsx";

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
import { Button } from "@/components/ui/button";
import { TableIcon } from "lucide-react";
import { typeColors } from "@/components/types/types";

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

  const extractParagraphs = (html: string): string[] => {
    const div = document.createElement("div");
    div.innerHTML = html;

    const paragraphs = Array.from(div.querySelectorAll("p")).map(
      (p) => p.textContent?.trim().replace(/\u00a0/g, "") || ""
    );

    return paragraphs.filter(Boolean);
  };

  // Export workouts horizontally, one workout per column (with spacing)
  const exportHorizontalWorkouts = (workouts: Workout[]) => {
    const maxWorkoutHeight = 100; // just in case
    const rowCount = maxWorkoutHeight;
    const colCount = workouts.length * 2 - 1; // workout + space columns

    // Create empty 2D array
    const sheetData: string[][] = Array.from({ length: rowCount }, () =>
      Array(colCount).fill("")
    );

    workouts.forEach((workout, index) => {
      const col = index * 2; // skip every other column for spacing
      let row = 0;

      const date = workout.date.split("T")[0];
      const type = workout.type;

      sheetData[row++][col] = `${date} - ${type}`;

      if (workout.parts && workout.parts.length > 0) {
        workout.parts.forEach((part) => {
          sheetData[row++][col] = part.title;

          if (part.format) {
            sheetData[row++][col] = part.format;
          }

          const contentLines = extractParagraphs(part.content);
          contentLines.forEach((line) => {
            sheetData[row++][col] = line;
          });

          if (part.notes) {
            sheetData[row++][col] = part.notes;
          }

          row++; // blank line between parts
        });
      } else {
        sheetData[row++][col] = "(No parts provided)";
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Optional: widen workout columns
    worksheet["!cols"] = Array.from({ length: colCount }, (_, i) =>
      i % 2 === 0 ? { wch: 40 } : { wch: 2 }
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workouts");
    XLSX.writeFile(workbook, "Workouts_Horizontal.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex flex-wrap items-center justify-start gap-4">
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

        <Button
          className="w-auto bg-blue-200"
          onClick={() => exportHorizontalWorkouts(workouts)}
        >
          <TableIcon />
          Export Workouts
        </Button>
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
                  {workoutsForDay.map((workout) => {
                    const typeClass =
                      typeColors[workout.type] || "bg-gray-200 text-gray-800";

                    return (
                      <div
                        key={workout.id}
                        className="bg-gray-50 rounded p-2 border text-left space-y-2 cursor-pointer hover:bg-gray-100"
                        onClick={(e) => {
                          setSelectedWorkout(workout);
                          setShowEditForm(true);
                          e.stopPropagation();
                        }}
                      >
                        {/* Type badge */}
                        <div className="flex items-center">
                          <span
                            className={`text-[10px] sm:text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${typeClass}`}
                          >
                            {workout.type}
                          </span>
                        </div>

                        {/* Parts */}
                        {workout.parts?.map((part, index) => (
                          <div key={index} className="space-y-1">
                            <div className="text-sm font-medium text-blue-700">
                              <span>
                                {part.title}
                                {part.title === "Workout" &&
                                  (part.format || part.cap) && (
                                    <>
                                      {part.format && ` - ${part.format}`}
                                      {part.cap && ` ${part.cap}'`}
                                    </>
                                  )}
                              </span>
                            </div>

                            <div
                              className="text-xs text-gray-800"
                              // Ensure `part.content` is trusted/escaped upstream
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
                    );
                  })}
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
