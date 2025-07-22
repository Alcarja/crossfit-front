"use client";

import { workoutsByDateRangeQueryOptions } from "@/app/queries/workouts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FullCalendar from "@fullcalendar/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CreateWorkoutForm } from "./forms/create-workout-form";

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

const WorkoutCalendar = () => {
  const [calendarRange, setCalendarRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showForm, setShowForm] = useState(false);

  const workoutsQueryOptions = calendarRange
    ? workoutsByDateRangeQueryOptions(calendarRange.start, calendarRange.end)
    : null;

  const { data: workouts = [], isLoading } = useQuery(
    workoutsQueryOptions ?? {
      queryKey: ["workouts", "disabled"],
      queryFn: async () => [],
      enabled: false,
    }
  );

  useEffect(() => {
    console.log("📦 fetched workouts:", workouts);
  }, [workouts]);

  if (isLoading) return <p>Loading calendar...</p>;

  return (
    <div className="w-full h-screen p-6">
      <Button className="mb-4 w-auto" onClick={() => setShowForm(true)}>
        + Create Workout
      </Button>

      <FullCalendar
        height="100%"
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        datesSet={(arg) => {
          setCalendarRange({ start: arg.startStr, end: arg.endStr });
        }}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        events={workouts.map((w: Workout) => ({
          id: w.id,
          start: w.date,
          extendedProps: { workout: w },
        }))}
        eventClick={(info) => {
          const workout = info.event.extendedProps.workout as Workout;
          setSelectedWorkout(workout);
        }}
        eventDisplay="block"
        eventContent={({ event }) => {
          const workout = event.extendedProps.workout as Workout;
          const type = workout.type.toLowerCase();

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
              title={type}
              className={`w-full h-full p-1 text-xs rounded-md shadow-sm border overflow-hidden cursor-pointer ${classNames}`}
            >
              <div className="text-[12px] font-medium truncate">{type}</div>
            </div>
          );
        }}
      />

      {/* Workout Dialog */}
      {selectedWorkout && (
        <Dialog open onOpenChange={() => setSelectedWorkout(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedWorkout.type}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              {new Date(selectedWorkout.date).toLocaleDateString()}
            </div>
            {selectedWorkout.parts?.map((part) => (
              <div key={part.title} className="mt-4">
                <h3 className="font-bold">{part.title}</h3>
                <div
                  className="prose text-sm"
                  dangerouslySetInnerHTML={{ __html: part.content }}
                />
              </div>
            ))}
          </DialogContent>
        </Dialog>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workout</DialogTitle>
          </DialogHeader>
          <CreateWorkoutForm
            open={showForm}
            setOpen={setShowForm}
            onSubmit={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutCalendar;
