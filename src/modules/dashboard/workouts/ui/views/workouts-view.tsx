"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export type WorkoutPart = {
  title: "Warming-up" | "Strength" | "Workout" | "Midline" | "Accessories";
  content: string;
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
  format: "for time" | "EMOM" | "interval" | "AMRAP";
  focus?: string[]; // e.g. ["upper body", "VO2MAX"]
  cap?: string; // e.g. "20 min"
  parts?: WorkoutPart[];
  versions: {
    rx: { description: string };
    scaled?: { description: string };
    beginner?: { description: string };
  };
};

const mockWorkouts: Workout[] = [
  {
    id: "1",
    date: "2025-07-21",
    type: "WOD",
    format: "for time",
    cap: "20 min",
    focus: ["upper body", "VO2MAX"],
    parts: [
      {
        title: "Workout",
        content: `
          <p><strong>21-15-9</strong></p>
          <ul>
            <li>Thrusters (42.5/30kg)</li>
            <li>Pull-ups</li>
          </ul>
        `,
      },
      {
        title: "Midline",
        content: `
          <p>3 rounds:</p>
          <ul>
            <li>20 sit-ups</li>
            <li>20 hollow rocks</li>
          </ul>
        `,
      },
    ],
    versions: {
      rx: {
        description: `
          <p>Perform the workout <strong>as written</strong>:</p>
          <ul>
            <li>Thrusters at 42.5/30kg</li>
            <li>Strict pull-ups</li>
          </ul>
        `,
      },
      scaled: {
        description: `
          <ul>
            <li>Thrusters at 30/20kg</li>
            <li>Banded pull-ups</li>
          </ul>
        `,
      },
      beginner: {
        description: `
          <ul>
            <li>Thrusters at 15/10kg</li>
            <li>Ring rows</li>
          </ul>
        `,
      },
    },
  },
  {
    id: "2",
    date: "2025-07-23",
    type: "Weightlifting",
    format: "EMOM",
    focus: ["strength", "posterior chain"],
    parts: [
      {
        title: "Strength",
        content: `
          <p><strong>EMOM 10:</strong></p>
          <ul>
            <li>1 Clean</li>
            <li>1 Front Squat</li>
            <li>1 Jerk @ 75–85% of 1RM</li>
          </ul>
        `,
      },
      {
        title: "Accessories",
        content: `
          <ul>
            <li>3 sets of:</li>
            <li>10 RDLs (heavy)</li>
            <li>10 DB Shrugs</li>
            <li>30s Hollow Hold</li>
          </ul>
        `,
      },
    ],
    versions: {
      rx: {
        description: `
          <p>Barbell complex at 80% 1RM.</p>
          <ul>
            <li>Focus on form and bar speed</li>
          </ul>
        `,
      },
      scaled: {
        description: `
          <ul>
            <li>Lighter load (60–70%)</li>
            <li>Full range of motion with safe technique</li>
          </ul>
        `,
      },
    },
  },
  {
    id: "3",
    date: "2025-07-25",
    type: "Gymnastics",
    format: "AMRAP",
    cap: "16 min",
    focus: ["core", "control", "upper body"],
    parts: [
      {
        title: "Workout",
        content: `
          <p><strong>AMRAP 16:</strong></p>
          <ul>
            <li>10 Toes-to-bar</li>
            <li>10 Ring Dips</li>
            <li>15 Wall Walk Shoulder Taps</li>
          </ul>
        `,
      },
    ],
    versions: {
      rx: {
        description: `
          <ul>
            <li>Strict ring dips</li>
            <li>Full range toes-to-bar</li>
          </ul>
        `,
      },
      scaled: {
        description: `
          <ul>
            <li>Knee raises</li>
            <li>Banded dips</li>
            <li>Reduced reps as needed</li>
          </ul>
        `,
      },
      beginner: {
        description: `
          <ul>
            <li>Hanging knee tucks</li>
            <li>Box dips</li>
            <li>Plank shoulder taps</li>
          </ul>
        `,
      },
    },
  },
  {
    id: "4",
    date: "2025-07-27",
    type: "Endurance",
    format: "interval",
    focus: ["VO2MAX", "engine"],
    parts: [
      {
        title: "Workout",
        content: `
          <p><strong>6 rounds:</strong></p>
          <ul>
            <li>400m Run @ 90% effort</li>
            <li>1:1 Work-to-Rest Ratio</li>
          </ul>
        `,
      },
      {
        title: "Midline",
        content: `
          <ul>
            <li>3 rounds:</li>
            <li>30 Russian Twists</li>
            <li>20 Leg Raises</li>
            <li>10 V-Ups</li>
          </ul>
        `,
      },
    ],
    versions: {
      rx: {
        description: `
          <p>Maintain <strong>sub-1:45</strong> pace on each 400m.</p>
        `,
      },
      scaled: {
        description: `
          <ul>
            <li>Run 300m or row 400m</li>
            <li>Focus on consistent pacing</li>
          </ul>
        `,
      },
      beginner: {
        description: `
          <ul>
            <li>200m run</li>
            <li>Or 1:00 fast walk</li>
            <li>Rest as needed</li>
          </ul>
        `,
      },
    },
  },
];

const WorkoutDialog = ({ workout }: { workout: Workout }) => (
  <Dialog>
    <DialogTrigger asChild>
      <div className="cursor-pointer rounded-md border p-3 shadow-sm hover:bg-muted transition">
        <h2 className="font-semibold">{workout.type}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date(workout.date).toDateString()}
        </p>
      </div>
    </DialogTrigger>

    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex flex-col gap-1">
          {workout.type} • {workout.format.toUpperCase()}
        </DialogTitle>
      </DialogHeader>

      <div className="text-sm text-muted-foreground mb-4 space-y-1">
        <p>{new Date(workout.date).toLocaleDateString()}</p>
        {Array.isArray(workout.focus) && workout.focus.length > 0 && (
          <p>Focus: {workout.focus.join(", ")}</p>
        )}
        {workout.cap && <p>CAP: {workout.cap}</p>}
      </div>

      {workout.parts?.map((part) => (
        <div key={part.title} className="mb-6">
          <h3 className="font-semibold text-sm mb-1">{part.title}</h3>
          <div
            className="prose prose-sm text-sm"
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        </div>
      ))}

      <div className="mt-4 space-y-6">
        <div>
          <h3 className="font-semibold text-sm mb-1">RX</h3>
          <div
            className="prose prose-sm text-sm"
            dangerouslySetInnerHTML={{
              __html: workout.versions.rx.description,
            }}
          />
        </div>

        {workout.versions.scaled && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Scaled</h3>
            <div
              className="prose prose-sm text-sm"
              dangerouslySetInnerHTML={{
                __html: workout.versions.scaled.description,
              }}
            />
          </div>
        )}

        {workout.versions.beginner && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Beginner</h3>
            <div
              className="prose prose-sm text-sm"
              dangerouslySetInnerHTML={{
                __html: workout.versions.beginner.description,
              }}
            />
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

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
        workout.versions.rx.description
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        workout.versions.scaled?.description
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        workout.versions.beginner?.description
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

const WorkoutCalendar = ({ workouts }: { workouts: Workout[] }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  return (
    <div className="w-full h-screen p-6">
      <FullCalendar
        height="100%"
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        events={workouts.map((w) => ({
          id: w.id,
          start: w.date,
          extendedProps: {
            workout: w,
          },
        }))}
        eventClick={(info) => {
          const workout = info.event.extendedProps.workout as Workout;
          setSelectedWorkout(workout);
        }}
        eventDisplay="block"
        eventContent={({ event }) => {
          const workout = event.extendedProps.workout as Workout;

          const type = workout.type.toLowerCase();
          const format = workout.format;

          const colorMap: Record<string, string> = {
            wod: "bg-blue-100 border-blue-300 text-blue-900",
            gymnastics: "bg-yellow-100 border-yellow-300 text-yellow-900",
            weightlifting: "bg-purple-100 border-purple-300 text-purple-900",
            endurance: "bg-green-100 border-green-300 text-green-900",
            kids: "bg-pink-100 border-pink-300 text-pink-900",
            foundations: "bg-orange-100 border-orange-300 text-orange-900",
          };

          const classNames =
            colorMap[type] || "bg-gray-100 border-gray-300 text-gray-800";

          return (
            <div
              title={`${type} • ${format}`}
              className={`w-full h-full p-1 text-xs rounded-md shadow-sm border overflow-hidden cursor-pointer ${classNames}`}
            >
              <div className="text-[12px] font-medium truncate">{type}</div>
              <div className="text-[11px] uppercase">{format}</div>
            </div>
          );
        }}
      />

      {selectedWorkout && (
        <Dialog open={true} onOpenChange={() => setSelectedWorkout(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-1">
                {selectedWorkout.type} • {selectedWorkout.format.toUpperCase()}
              </DialogTitle>
            </DialogHeader>

            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <p>{new Date(selectedWorkout.date).toLocaleDateString()}</p>
              {Array.isArray(selectedWorkout.focus) &&
                selectedWorkout.focus.length > 0 && (
                  <p>Focus: {selectedWorkout.focus.join(", ")}</p>
                )}
              {selectedWorkout.cap && <p>CAP: {selectedWorkout.cap}</p>}
            </div>

            {selectedWorkout.parts?.map((part) => (
              <div key={part.title} className="mb-4">
                <h3 className="font-semibold text-sm mb-1">{part.title}</h3>
                <p className="text-sm whitespace-pre-line">{part.content}</p>
              </div>
            ))}

            <div className="mt-4">
              <h3 className="font-semibold text-sm mb-1">RX</h3>
              <p className="text-sm">
                {selectedWorkout.versions.rx.description}
              </p>

              {selectedWorkout.versions.scaled && (
                <>
                  <h3 className="font-semibold text-sm mt-3 mb-1">Scaled</h3>
                  <p className="text-sm">
                    {selectedWorkout.versions.scaled.description}
                  </p>
                </>
              )}

              {selectedWorkout.versions.beginner && (
                <>
                  <h3 className="font-semibold text-sm mt-3 mb-1">Beginner</h3>
                  <p className="text-sm">
                    {selectedWorkout.versions.beginner.description}
                  </p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const WorkoutsView = () => {
  return (
    <div className="w-full max-w-[2400px] mx-4">
      <h1 className="text-2xl font-bold mb-4">Workouts</h1>
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="flex flex-wrap items-center justify-center w-full">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="wod">WODs</TabsTrigger>
          <TabsTrigger value="gymnastics">Gymnastics</TabsTrigger>
          <TabsTrigger value="weightlifting">Weightlifting</TabsTrigger>
          <TabsTrigger value="endurance">Endurance</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="rounded-lg border p-4 shadow-sm space-y-6">
            <WorkoutCalendar workouts={mockWorkouts} />
            <WorkoutsList workouts={mockWorkouts} />
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="rounded-lg border p-4 shadow-sm">
            <WorkoutsList workouts={mockWorkouts} />
          </div>
        </TabsContent>

        <TabsContent value="wod">
          <div className="rounded-lg border p-4 shadow-sm">
            <WorkoutsList
              workouts={mockWorkouts.filter((w) => w.type === "WOD")}
            />
          </div>
        </TabsContent>
        <TabsContent value="gymnastics">
          <div className="rounded-lg border p-4 shadow-sm">
            <WorkoutsList
              workouts={mockWorkouts.filter((w) => w.type === "Gymnastics")}
            />
          </div>
        </TabsContent>

        <TabsContent value="Weightlifting">
          <div className="rounded-lg border p-4 shadow-sm">
            <WorkoutsList
              workouts={mockWorkouts.filter((w) => w.type === "Weightlifting")}
            />
          </div>
        </TabsContent>

        <TabsContent value="Endurance">
          <div className="rounded-lg border p-4 shadow-sm">
            <WorkoutsList
              workouts={mockWorkouts.filter((w) => w.type === "Endurance")}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutsView;
