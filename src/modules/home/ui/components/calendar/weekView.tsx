import { es } from "date-fns/locale";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";
import React from "react";

export default function WeekView({ date }: { date: Date }) {
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
                {days.map((_, d) => (
                  <div
                    key={`cell-${h}-${d}`}
                    className="border-t border-l h-20 hover:bg-muted transition-colors"
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
