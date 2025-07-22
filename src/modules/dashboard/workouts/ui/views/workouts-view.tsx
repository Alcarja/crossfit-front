import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import WorkoutCalendar from "../components/workout-calendar";

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
            <>
              <WorkoutCalendar />

              {/*  <WorkoutsList workouts={workoutsData} /> */}
            </>
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="rounded-lg border p-4 shadow-sm">
            {/*             <WorkoutsList workouts={workoutsData} />
             */}{" "}
          </div>
        </TabsContent>

        <TabsContent value="wod">
          <div className="rounded-lg border p-4 shadow-sm">
            {/*  <WorkoutsList
              workouts={workoutsData.filter((w) => w.type === "WOD")}
            /> */}
          </div>
        </TabsContent>
        <TabsContent value="gymnastics">
          <div className="rounded-lg border p-4 shadow-sm">
            {/* <WorkoutsList
              workouts={workoutsData.filter((w) => w.type === "Gymnastics")}
            /> */}
          </div>
        </TabsContent>

        <TabsContent value="Weightlifting">
          <div className="rounded-lg border p-4 shadow-sm">
            {/*  <WorkoutsList
              workouts={workoutsData.filter((w) => w.type === "Weightlifting")}
            /> */}
          </div>
        </TabsContent>

        <TabsContent value="Endurance">
          <div className="rounded-lg border p-4 shadow-sm">
            {/*   <WorkoutsList
              workouts={workoutsData.filter((w) => w.type === "Endurance")}
            /> */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutsView;
