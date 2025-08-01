import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { WorkoutsCalendar2 } from "../components/workout-calendar-2";
import { MonthlyWorkoutCalendar } from "../components/workout-list";

const WorkoutsView = () => {
  return (
    <div className="w-full max-w-[2400px] m-6 md:p-6">
      <h1 className="text-4xl font-bold mb-6">Workouts</h1>
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="flex flex-wrap items-center justify-center w-full">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="planner">Planner</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="rounded-lg border p-4 shadow-sm space-y-6">
            <>
              <WorkoutsCalendar2 />
            </>
          </div>
        </TabsContent>

        <TabsContent value="planner">
          <div className="rounded-lg border p-4 shadow-sm">
            <MonthlyWorkoutCalendar />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkoutsView;
