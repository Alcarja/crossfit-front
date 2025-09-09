import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

type Class = {
  id: string;
  start: string;
  end: string;
  type: string;
  coach: string;
  isHalfHour?: boolean;
};

const colorPool = [
  "bg-blue-200 text-blue-900",
  "bg-red-200 text-red-900",
  "bg-purple-200 text-purple-900",
  "bg-green-200 text-green-900",
  "bg-pink-200 text-pink-900",
  "bg-yellow-200 text-yellow-900",
  "bg-indigo-200 text-indigo-900",
  "bg-teal-200 text-teal-900",
  "bg-orange-200 text-orange-900",
  "bg-emerald-200 text-emerald-900",
  "bg-rose-200 text-rose-900",
  "bg-lime-200 text-lime-900",
];

function getColorForCoach(name: string): string {
  const cleanName = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPool.length;
  return colorPool[index];
}

export default function MonthView({
  date,
  classes,
}: {
  date: Date;
  classes: Class[];
}) {
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

  const [showMoreModal, setShowMoreModal] = useState<string>("");

  return (
    <div className="space-y-4">
      {/* Date Range Header */}
      <div className="flex items-center justify-center w-full text-md text-muted-foreground font-medium py-3">
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

          const dayClasses = classes
            .filter((cls) => isSameDay(parseISO(cls.start), d))
            .sort(
              (a, b) =>
                parseISO(a.start).getTime() - parseISO(b.start).getTime()
            );

          const maxVisible = 3;
          const showMore = dayClasses.length > maxVisible;
          const visibleClasses = dayClasses.slice(0, maxVisible);

          return (
            <div
              key={i}
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName !== "BUTTON") {
                  toast.info(
                    "Para agregar una clase ve a la vista semanal o diaria."
                  );
                }
              }}
              className={`relative border rounded-md p-2 min-h-[130px] text-sm
                ${isToday ? "border-blue-400 border-2 font-semibold" : ""}
                ${!isToday && isCurrentMonth ? "bg-white" : ""}
                ${!isCurrentMonth ? "bg-muted text-gray-500" : ""}
              `}
            >
              <div className="block lg:hidden text-xs text-muted-foreground font-semibold mb-1">
                {format(d, "EEE")}
              </div>
              <div className="font-medium mb-1">{format(d, "d")}</div>

              <div className="space-y-1 text-xs overflow-hidden">
                {visibleClasses.map((cls) => {
                  const color = getColorForCoach(cls.coach || "unknown");

                  return (
                    <div
                      key={cls.id}
                      className={`px-1.5 py-1 rounded-sm truncate ${color}`}
                    >
                      <span className="font-medium">
                        {format(parseISO(cls.start), "HH:mm")}
                      </span>{" "}
                      • {cls.type} ({cls.coach})
                      {cls.isHalfHour ? " – 30min" : ""}
                    </div>
                  );
                })}

                {showMore && (
                  <button
                    className="text-blue-600 hover:underline text-xs mt-1"
                    onClick={() => setShowMoreModal(format(d, "yyyy-MM-dd"))}
                  >
                    Ver {dayClasses.length - maxVisible} más
                  </button>
                )}

                {/* Inline Popover Modal */}
                {showMoreModal === format(d, "yyyy-MM-dd") && (
                  <div className="absolute left-0 top-full mt-1 w-[250px] z-10 bg-white border rounded-md shadow-md p-2 space-y-2">
                    <div className="text-sm font-semibold">
                      {format(d, "EEEE d 'de' MMMM", { locale: es })}
                    </div>

                    {dayClasses.map((cls) => {
                      const color = getColorForCoach(cls.coach || "unknown");
                      return (
                        <div
                          key={cls.id}
                          className={`px-1.5 py-1 rounded-sm text-xs ${color}`}
                        >
                          <span className="font-medium">
                            {format(parseISO(cls.start), "HH:mm")}
                          </span>{" "}
                          • {cls.type} ({cls.coach})
                          {cls.isHalfHour ? " – 30min" : ""}
                        </div>
                      );
                    })}

                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setShowMoreModal("")}
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
