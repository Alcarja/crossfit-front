import { useMemo, useState } from "react";
import { WorkoutDialog } from "./workout-dialog";
import { Input } from "@/components/ui/input";

export type WorkoutPart = {
  title: "Warm-up" | "Strength" | "Workout" | "Midline" | "Accessories";
  format?: "FOR TIME" | "EMOM" | "INTERVAL" | "AMRAP";
  content: string;
  notes?: string;
};

export type Workout = {
  id: string;
  date: string; // ISO string (for calendar display)
  type:
    | "WOD"
    | "Gymnastics"
    | "Weightlifting"
    | "Endurance"
    | "Foundations"
    | "Kids";

  focus?: string[]; // e.g. ["upper body", "VO2MAX"]
  cap?: string; // e.g. "20 min"
  parts?: WorkoutPart[];
  versions?: {
    rx: { description: string };
    scaled?: { description: string };
    beginner?: { description: string };
  };
};

export const WorkoutsList = ({ workouts }: { workouts: Workout[] }) => {
  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    workouts.forEach((w) => years.add(new Date(w.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a); // most recent first
  }, [workouts]);

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const filtered = useMemo(() => {
    return workouts.filter((workout) => {
      const date = new Date(workout.date);
      const matchesMonth = date.getMonth() === selectedMonth;
      const matchesYear = date.getFullYear() === selectedYear;
      const matchesSearch =
        workout?.versions?.rx.description
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        workout?.versions?.scaled?.description
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        workout?.versions?.beginner?.description
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        workout.parts?.some((part) =>
          part.content.toLowerCase().includes(search.toLowerCase())
        );
      return matchesMonth && matchesYear && matchesSearch;
    });
  }, [workouts, search, selectedMonth, selectedYear]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search workouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          No workouts found for this month and year.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <WorkoutDialog key={w.id} workout={w} />
          ))}
        </div>
      )}
    </div>
  );
};
