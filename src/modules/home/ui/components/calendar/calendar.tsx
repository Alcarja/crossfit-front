"use client";

import { useEffect, useState, useMemo } from "react";
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import MonthView from "./monthView";
import WeekView from "./weekView";
import DayView from "./dayView";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import { classesQueryOptions } from "@/app/queries/classes";

type Class = {
  id: string;
  start: string;
  end: string;
  type: string;
  coach: string;
  isOpen?: boolean;
  isClose?: boolean;
};

export default function Calendar() {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const availableYears = Array.from(
    { length: 5 },
    (_, i) => currentYear - 2 + i
  );

  const handlePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate(new Date(currentYear, month, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1));
  };

  // Calculate visible range for current view
  const visibleRange = useMemo(() => {
    if (view === "month") {
      return {
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
      };
    }
    if (view === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    }
    return {
      start: startOfDay(currentDate),
      end: endOfDay(currentDate),
    };
  }, [view, currentDate]);

  const [calendarClasses, setCalendarClasses] = useState<Class[]>([]);
  const { data: users } = useQuery(usersQueryOptions());

  const { data: classes } = useQuery(
    classesQueryOptions(
      visibleRange.start.toISOString(),
      visibleRange.end.toISOString()
    )
  );

  useEffect(() => {
    if (!classes) return;

    const formatted: Class[] = classes.results.map((cls: any) => ({
      id: String(cls.id),
      start: cls.start,
      end: cls.end,
      type: cls.type,
      coach: cls.coach?.name,
      isOpen: cls.isOpen,
      isClose: cls.isClose,
    }));

    setCalendarClasses(formatted);
  }, [classes]);

  // Filter classes based on visible range
  const filteredClasses = useMemo(() => {
    return calendarClasses.filter((cls) =>
      isWithinInterval(parseISO(cls.start), visibleRange)
    );
  }, [calendarClasses, visibleRange]);

  return (
    <div className="space-y-4 my-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View Switcher */}
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "day" ? "default" : "outline"}
            onClick={() => setView("day")}
          >
            Day
          </Button>
        </div>

        {/* Month/Year filters */}
        {view === "month" && (
          <>
            <Select
              value={String(currentMonth)}
              onValueChange={(val) => handleMonthChange(parseInt(val))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(currentYear)}
              onValueChange={(val) => handleYearChange(parseInt(val))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Navigation Arrows */}
        <div className="ml-auto flex gap-1">
          <Button variant="default" size="icon" onClick={handlePrev}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="default" size="icon" onClick={handleNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* View */}
      {view === "month" && (
        <MonthView date={currentDate} classes={filteredClasses} />
      )}
      {view === "week" && (
        <WeekView date={currentDate} classes={filteredClasses} />
      )}
      {view === "day" && (
        <DayView date={currentDate} classes={filteredClasses} />
      )}
    </div>
  );
}
