import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

export default function MonthView({ date }: { date: Date }) {
  const today = new Date();
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);
  const spanLabel = capitalize(format(date, "MMMM yyyy", { locale: es }));

  const days: Date[] = [];
  let current = start;

  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }

  return (
    <div className="space-y-4">
      {/* Date Range Header */}
      <div className="flex items-center justify-center w-full text-md text-muted-foreground font-medium  py-3">
        {spanLabel}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div
            key={day}
            className="hidden lg:block text-sm font-semibold text-center"
          >
            {day}
          </div>
        ))}
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === date.getMonth();
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              className={`border rounded-md p-2 min-h-[130px] text-sm
                ${isToday ? "border-blue-400 border-2 font-semibold" : ""}
                ${!isToday && isCurrentMonth ? "bg-white" : ""}
                ${!isCurrentMonth ? "bg-muted text-gray-500" : ""}
              `}
            >
              <div className="block lg:hidden text-xs text-muted-foreground font-semibold mb-1">
                {format(d, "EEE")}
              </div>
              <div className="font-medium mb-1">{format(d, "d")}</div>
              <div className="text-xs text-muted-foreground">Event/Note</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
