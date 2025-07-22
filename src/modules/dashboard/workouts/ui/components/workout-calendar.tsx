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
import { useMemo, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CreateWorkoutForm } from "./forms/create-workout-form";
import type { DateSelectArg } from "@fullcalendar/core";

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
  const fallbackDate = useMemo(() => {
    const now = new Date();
    const year = 2025;
    const month = now.getMonth(); // 0-based
    const day = Math.min(now.getDate(), 28); // prevent invalid day

    return new Date(year, month, day).toISOString().split("T")[0];
  }, []);

  const [calendarRange, setCalendarRange] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 🔁 Current month (0-based)

    const start = new Date(year, month + 1, 1);
    const end = new Date(year, month + 1, 0); // Last day of that month

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  });
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const workoutsQueryOptions = calendarRange
    ? workoutsByDateRangeQueryOptions(calendarRange.start, calendarRange.end)
    : null;

  const { data: workouts = [] } = useQuery(
    workoutsQueryOptions ?? {
      queryKey: ["workouts", "disabled"],
      queryFn: async () => [],
      enabled: false,
    }
  );

  const openCreateDialog = (info: DateSelectArg) => {
    setSelectedDate(info.startStr);
    setShowForm(true);
  };

  return (
    <div className="w-full h-screen p-6">
      <Button className="mb-4 w-auto" onClick={() => setShowForm(true)}>
        + Create Workout
      </Button>

      <FullCalendar
        height="90%"
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={calendarRange?.start || fallbackDate}
        firstDay={1}
        datesSet={(arg) => {
          const newStart = arg.startStr;
          const newEnd = arg.endStr;

          setCalendarRange((prev) => {
            if (prev?.start === newStart && prev?.end === newEnd) {
              return prev; // 🔒 Don't re-set if nothing changed
            }
            return { start: newStart, end: newEnd };
          });
        }}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        selectable={true} // required for "select" to work
        select={openCreateDialog}
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
            initialDate={selectedDate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutCalendar;
