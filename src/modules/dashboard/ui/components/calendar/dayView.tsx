/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { es } from "date-fns/locale";
import { startOfDay, addHours, format } from "date-fns";

export default function DayView({
  date,
  classes,
}: {
  date: Date;
  classes: any;
}) {
  const start = startOfDay(date);
  const hours = Array.from({ length: 13 }, (_, h) => h + 9); // 9:00–21:00

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const spanLabel = capitalize(
    format(date, "EEEE d 'de' MMMM", { locale: es })
  );

  return (
    <div className="grid grid-cols-[60px_1fr] text-sm border rounded-md">
      <div className="col-span-2 bg-muted font-medium p-2">{spanLabel}</div>

      {hours.map((h, i) => {
        const hourDate = addHours(start, h);
        return (
          <>
            <div
              key={`label-${i}`}
              className="text-right text-xs border-t p-2 pr-3 text-muted-foreground"
            >
              {format(hourDate, "HH:mm")}
            </div>
            <div
              key={`slot-${i}`}
              className="border-t border-l h-16 hover:bg-muted transition-colors"
            />
          </>
        );
      })}
    </div>
  );
}
