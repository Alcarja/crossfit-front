/* eslint-disable @typescript-eslint/no-explicit-any */
import { es } from "date-fns/locale";
import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  parseISO,
  getHours,
} from "date-fns";
import React from "react";

const typeColors: Record<string, string> = {
  WOD: "bg-blue-200 text-blue-900",
  Gymnastics: "bg-red-200 text-red-900",
  Weightlifting: "bg-purple-200 text-purple-900",
  Endurance: "bg-green-200 text-green-900",
  Foundations: "bg-pink-200 text-pink-900",
  Kids: "bg-yellow-200 text-yellow-900",
};

export default function WeekView({
  date,
  classes,
  onTimeSlotClick,
  onClassClick,
}: {
  date: Date;
  classes: any;
  onTimeSlotClick?: (range: { startStr: string; endStr: string }) => void;
  onClassClick?: (cls: any) => void;
}) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: 13 }, (_, h) => h + 9); // 9:00–21:00

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const weekDays = days.map((day) =>
    capitalize(format(day, "EEE d", { locale: es }))
  );

  const spanLabel = `${format(start, "dd-MM")} / ${format(end, "dd-MM")}`;

  // Group classes by day-hour key
  const classesByDayHour: Record<string, any[]> = {};

  classes.forEach((cls: any) => {
    if (!cls?.start) return; // <-- prevent crash

    const date = parseISO(cls.start);
    const key = `${format(date, "yyyy-MM-dd")}-${getHours(date)}`;

    if (!classesByDayHour[key]) {
      classesByDayHour[key] = [];
    }

    classesByDayHour[key].push(cls);
  });

  return (
    <div className="space-y-4">
      {/* Week range label */}
      <div className="text-center text-md text-muted-foreground font-medium">
        {spanLabel}
      </div>

      {/* Scroll wrapper */}
      <div className="overflow-x-auto w-full">
        <div className="w-full lg:w-full min-w-[850px] lg:min-w-0">
          <div className="grid grid-cols-[60px_repeat(7,minmax(100px,1fr))] border text-sm">
            {/* Header row */}
            <div className="bg-muted p-2" />
            {weekDays.map((day, i) => (
              <div
                key={i}
                className="text-center font-semibold border-l p-2 bg-muted"
              >
                {day}
              </div>
            ))}

            {/* Time slots */}
            {hours.map((h, i) => (
              <React.Fragment key={`row-${i}`}>
                <div className="text-xs text-right border-t px-2 py-1 text-muted-foreground bg-background">
                  {`${h.toString().padStart(2, "0")}:00`}
                </div>
                {days.map((day, d) => {
                  const key = `${format(day, "yyyy-MM-dd")}-${h}`;
                  const dayHourClasses = classesByDayHour[key] || [];

                  return (
                    <div
                      key={`cell-${h}-${d}`}
                      onClick={() => {
                        const startStr = `${format(day, "yyyy-MM-dd")}T${String(
                          h
                        ).padStart(2, "0")}:00:00`;
                        const endStr = `${format(day, "yyyy-MM-dd")}T${String(
                          h + 1
                        ).padStart(2, "0")}:00:00`;
                        onTimeSlotClick?.({ startStr, endStr });
                      }}
                      className="relative border-t border-l h-20 px-1 py-0.5 hover:bg-muted transition-colors"
                    >
                      {dayHourClasses.map((cls: any) => {
                        const color =
                          typeColors[cls.type] || typeColors.Default;

                        return (
                          <div
                            key={cls.id}
                            onClick={(e) => {
                              e.stopPropagation(); // 👈 prevent triggering the time slot click
                              onClassClick?.(cls); // 👈 call parent function
                            }}
                            className={`text-xs px-1 py-0.5 rounded-sm mb-0.5 truncate ${color}`}
                          >
                            {cls.type} ({cls.coach})
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
