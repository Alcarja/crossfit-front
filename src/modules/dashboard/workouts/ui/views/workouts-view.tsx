import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import WorkoutCalendar from "../components/workout-calendar";
import { WorkoutsCalendar2 } from "../components/workout-calendar-2";
import { MonthlyWorkoutCalendar } from "../components/workout-list";

const WorkoutsView = () => {
  return (
    <div className="w-full max-w-[2400px] m-6">
      <h1 className="text-2xl font-bold mb-4">Workouts</h1>
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="flex flex-wrap items-center justify-center w-full">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="calendar-2">Calendar 2</TabsTrigger>
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
            </>
          </div>
        </TabsContent>

        <TabsContent value="calendar-2">
          <div className="rounded-lg border p-4 shadow-sm">
            <WorkoutsCalendar2 />
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="rounded-lg border p-4 shadow-sm">
            <MonthlyWorkoutCalendar />
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
