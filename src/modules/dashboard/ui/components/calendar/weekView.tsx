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

const colorPool = [
  "bg-blue-200 text-blue-900",
  "bg-red-200 text-red-900",
  "bg-purple-200 text-purple-900",
  "bg-green-200 text-green-900",
  "bg-pink-300 text-pink-900",
  "bg-yellow-200 text-yellow-900",
  "bg-indigo-200 text-indigo-900",
  "bg-teal-200 text-teal-900",
  "bg-orange-200 text-orange-900",
  "bg-emerald-200 text-emerald-900",
  "bg-rose-200 text-rose-900",
  "bg-lime-200 text-lime-900",
];

// Runtime cache of assigned coach names → color
const assignedColors = new Map<string, string>();

export function getUniqueColorForCoach(name: string): string {
  if (!name) return "bg-gray-200 text-gray-800";

  // Use already-assigned color if available
  if (assignedColors.has(name)) {
    return assignedColors.get(name)!;
  }

  // Try to find an unused color
  for (const color of colorPool) {
    if (![...assignedColors.values()].includes(color)) {
      assignedColors.set(name, color);
      return color;
    }
  }

  // Fallback: consistent hash if all colors used
  const cleanName = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPool.length;
  const fallbackColor = colorPool[index];

  assignedColors.set(name, fallbackColor);
  return fallbackColor;
}

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
                        const baseHour = h;
                        const dayStr = format(day, "yyyy-MM-dd");

                        const startStr = `${dayStr}T${String(baseHour).padStart(
                          2,
                          "0"
                        )}:00:00`;

                        // End time will be decided based on `isHalfHour` checkbox in the form
                        onTimeSlotClick?.({ startStr, endStr: startStr });
                      }}
                      className="relative border-t border-l h-auto min-h-20 px-1 pt-0.5 pb-5 hover:bg-muted transition-colors"
                    >
                      {dayHourClasses.map((cls: any) => {
                        const color = getUniqueColorForCoach(
                          cls.coach || "unknown"
                        );

                        return (
                          <div
                            key={cls.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onClassClick?.(cls);
                            }}
                            className={`text-xs px-1 py-[2.5px] rounded-sm mb-0.5 truncate ${color}`}
                          >
                            {cls.type} ({cls.coach})
                            {cls.isHalfHour ? " – 30min" : ""}
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
