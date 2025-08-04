/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import MonthView from "./monthView";
import WeekView from "./weekView";
import DayView from "./dayView";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classesQueryOptions,
  useCreateClassQuery,
  useDeleteClassQuery,
  useUpdateClassQuery,
} from "@/app/queries/classes";
import { usersQueryOptions } from "@/app/queries/users";
import z from "zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { zodResolver } from "@hookform/resolvers/zod";

import { fromZonedTime } from "date-fns-tz";

type Class = {
  event: {
    id: string;
  };
  id: string;
  start: string;
  end: string;
  type: string;
  coach: string;
  isOpen?: boolean;
  isClose?: boolean;
};

const createFormSchema = z
  .object({
    coach: z.string().min(1, "Coach is required"),
    type: z.string().min(1, "Type is required"),
    isOpen: z.boolean().optional().default(false),
    isClose: z.boolean().optional().default(false),
  })
  .refine((data) => !(data.isOpen && data.isClose), {
    message: "You can't check both Apertura and Cierre",
    path: ["isClose"],
  });

const updateClassFormSchema = z
  .object({
    coach: z.string().min(1, "Coach is required"),
    type: z.string().min(1, "Type is required"),
    isOpen: z.boolean().optional().default(false),
    isClose: z.boolean().optional().default(false),
  })
  .refine((data) => !(data.isOpen && data.isClose), {
    message: "You can't check both Apertura and Cierre",
    path: ["isClose"],
  });

export default function Calendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarClasses, setCalendarClasses] = useState<Class[]>([]);
  const { data: users } = useQuery(usersQueryOptions());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const availableYears = Array.from(
    { length: 5 },
    (_, i) => currentYear - 2 + i
  );

  // For dialog
  const [selectedRange, setSelectedRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handlePrev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate(new Date(currentYear, month, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1));
  };

  const visibleRange =
    view === "month"
      ? {
          start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
          end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
        }
      : view === "week"
      ? {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        }
      : {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };

  const { data: classes } = useQuery(
    classesQueryOptions(
      visibleRange.start.toISOString(),
      visibleRange.end.toISOString()
    )
  );

  useEffect(() => {
    if (!classes) return;
    const formatted: Class[] = classes.results.map((cls: any) => ({
      id: cls.id.toString(),
      start: cls.start,
      end: cls.end,
      type: cls.type,
      coach: cls.coach?.name || "",
      isOpen: cls.isOpen,
      isClose: cls.isClose,
    }));
    setCalendarClasses(formatted);
  }, [classes]);

  const createForm = useForm({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      coach: "",
      type: "",
      isOpen: false,
      isClose: false,
    },
  });

  // This gets triggered by WeekView
  const openCreateDialog = (range: { startStr: string; endStr: string }) => {
    setSelectedRange({ start: range.startStr, end: range.endStr });
    createForm.reset({ coach: "", type: "WOD" });
    setCreateDialogOpen(true);
  };

  const createClassMutation = useCreateClassQuery();

  function onSubmitCreateClass(values: any) {
    const coachId = values.coach;
    const coachData = users?.find((u: any) => u.id === Number(coachId));
    const coachName = coachData ? coachData.name : coachId;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const newClass = {
      start: fromZonedTime(selectedRange?.start || "", timeZone).toISOString(),
      end: fromZonedTime(selectedRange?.end || "", timeZone).toISOString(),
      coach: coachId,
      type: values.type,
      isOpen: values.isOpen,
      isClose: values.isClose,
    };
    /* const newClass = {
      start: selectedRange?.start,
      end: selectedRange?.end,
      coach: coachId,
      type: values.type,
      isOpen: values.isOpen,
      isClose: values.isClose,
    }; */

    if (!user?.id) {
      toast.error("User not authenticated.");
      return;
    }

    createClassMutation.mutate(
      { userId: user.id, classData: newClass },
      {
        onSuccess: (res) => {
          setCalendarClasses((prev) => [
            ...prev,
            {
              ...res.data,
              coach: coachName,
            },
          ]);
          queryClient.invalidateQueries({ queryKey: ["classes"] });

          toast.success("Class created successfully!");
          setCreateDialogOpen(false);
        },
        onError: (err) => {
          toast.error("Error creating class.");
          console.error(err);
        },
      }
    );
  }

  const updateClassForm = useForm({
    resolver: zodResolver(updateClassFormSchema),
    defaultValues: {
      coach: "",
      type: "",
      isOpen: false,
      isClose: false,
    },
  });

  const [updateClassDialogOpen, setUpdateClassDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Class | null>(null);

  const updateClassMutation = useUpdateClassQuery();

  const openEditDialog = (cls: Class) => {
    console.log("Class id", cls?.event?.id);
    const found = calendarClasses.find((c) => c.id === cls?.event?.id);
    if (!found) {
      console.warn("⚠️ Could not find class to edit.");
      return;
    }

    setEditingEvent(found);

    const matchedUserId = users?.find((u: any) => u.name === found.coach)?.id;

    updateClassForm.reset({
      coach: matchedUserId ? String(matchedUserId) : "",
      type: found.type,
      isOpen: found.isOpen ?? false,
      isClose: found.isClose ?? false,
    });

    setUpdateClassDialogOpen(true);
  };

  function onSubmitUpdateClass(values: z.infer<typeof updateClassFormSchema>) {
    if (!editingEvent) {
      toast.error("No class selected for editing.");
      return;
    }

    const classId = editingEvent.id;
    const coachId = Number(values.coach);
    const coachData = users?.find((u: any) => u.id === coachId);
    const coachName = coachData?.name ?? String(coachId);

    updateClassMutation.mutate(
      {
        id: Number(classId),
        data: {
          coachId,
          type: values.type,
          start: editingEvent.start,
          end: editingEvent.end,
          isOpen: values.isOpen ?? false,
          isClose: values.isClose ?? false,
        },
      },
      {
        onSuccess: () => {
          toast.success("Class updated successfully!");

          // Optimistic update
          setCalendarClasses((prev) =>
            prev.map((cls) =>
              cls.id === classId
                ? { ...cls, coach: coachName, type: values.type }
                : cls
            )
          );

          queryClient.invalidateQueries({ queryKey: ["classes"] });
          setUpdateClassDialogOpen(false);
        },
        onError: (err) => {
          toast.error("Failed to update class");
          console.error("❌ Error updating class:", err);
        },
      }
    );
  }

  const deleteClassMutation = useDeleteClassQuery();

  function handleDeleteClass() {
    if (!editingEvent) {
      toast.error("No class selected for deletion.");
      return;
    }

    const classId = editingEvent.id;

    deleteClassMutation.mutate(Number(classId), {
      onSuccess: () => {
        toast.success("Class deleted successfully");

        setCalendarClasses((prev) => prev.filter((cls) => cls.id !== classId));

        queryClient.invalidateQueries({ queryKey: ["classes"] });
        setUpdateClassDialogOpen(false);
        setEditingEvent(null);
      },
      onError: (err) => {
        toast.error("Failed to delete class");
        console.error("❌ Error deleting class:", err);
      },
    });
  }

  return (
    <div className="space-y-4 my-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View Switcher */}
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "day" ? "default" : "outline"}
            onClick={() => setView("day")}
          >
            Day
          </Button>
        </div>

        {/* Month/Year filters */}
        {view === "month" && (
          <>
            <Select
              value={String(currentMonth)}
              onValueChange={(val) => handleMonthChange(parseInt(val))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(currentYear)}
              onValueChange={(val) => handleYearChange(parseInt(val))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Navigation Arrows */}
        <div className="ml-auto flex gap-1">
          <Button variant="default" size="icon" onClick={handlePrev}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="default" size="icon" onClick={handleNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* View */}
      {view === "month" && (
        <MonthView date={currentDate} classes={calendarClasses} />
      )}
      {view === "week" && (
        <WeekView
          date={currentDate}
          classes={calendarClasses}
          onClassClick={(cls) => {
            const fakeEventClickArg = {
              event: { id: cls.id },
            } as any; // or cast to your EventClickArg type if needed
            openEditDialog(fakeEventClickArg);
          }}
          onTimeSlotClick={openCreateDialog} // <-- Pass it here
        />
      )}
      {view === "day" && (
        <DayView date={currentDate} classes={calendarClasses} />
      )}

      {/* === CREATE CLASS MODAL === */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onSubmitCreateClass)}
              className="space-y-6"
            >
              <FormField
                control={createForm.control}
                name="coach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coach</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Select coach</option>
                        {users?.map((user: any) => (
                          <option key={user.id} value={user.id.toString()}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <select
                      {...field}
                      className="w-full border border-input rounded-md px-3 py-2 text-sm"
                    >
                      <option value="WOD">WOD</option>
                      <option value="Gymnastics">Gymnastics</option>
                      <option value="Weightlifting">Weightlifting</option>
                      <option value="Endurance">Endurance</option>
                      <option value="Foundations">Foundations</option>
                      <option value="Kids">Kids</option>
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="isOpen"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mr-2"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Apertura</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="isClose"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mr-2"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Cierre</FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4 gap-2">
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* === UPDATE CLASS MODAL === */}
      <Dialog
        open={updateClassDialogOpen}
        onOpenChange={setUpdateClassDialogOpen}
      >
        <DialogContent>
          <Form {...updateClassForm}>
            <form
              onSubmit={updateClassForm.handleSubmit(onSubmitUpdateClass)}
              className="space-y-6"
            >
              <FormField
                control={updateClassForm.control}
                name="coach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coach</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Select coach</option>
                        {users?.map((user: any) => (
                          <option key={user.id} value={user.id.toString()}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateClassForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm"
                      >
                        <option value="WOD">WOD</option>
                        <option value="Gymnastics">Gymnastics</option>
                        <option value="Weightlifting">Weightlifting</option>
                        <option value="Endurance">Endurance</option>
                        <option value="Foundations">Foundations</option>
                        <option value="Kids">Kids</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateClassForm.control}
                name="isOpen"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={!!field.value} // ensures it's boolean
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mr-2"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Apertura</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={updateClassForm.control}
                name="isClose"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mr-2"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Cierre</FormLabel>
                  </FormItem>
                )}
              />

              <div className="pt-4 gap-2 w-full flex items-center justify-between">
                <Button
                  type="button"
                  variant="delete"
                  onClick={handleDeleteClass}
                >
                  Delete
                </Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
