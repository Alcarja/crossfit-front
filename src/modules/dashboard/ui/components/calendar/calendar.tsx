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
import { Checkbox } from "@/components/ui/checkbox";
import Combobox from "@/components/web/combobox";

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
  isHalfHour?: boolean;
};

const createFormSchema = z
  .object({
    coach: z.string().min(1, "Coach is required"),
    type: z.string().min(1, "Type is required"),
    isOpen: z.boolean().optional().default(false),
    isClose: z.boolean().optional().default(false),
    isHalfHour: z.boolean().optional().default(false), // 🆕
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
    isHalfHour: z.boolean().optional().default(false),
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

    const formatted: Class[] = classes.results.map((cls: any) => {
      const start = new Date(cls.start);
      const end = new Date(cls.end);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes

      return {
        id: cls.id.toString(),
        start: cls.start,
        end: cls.end,
        type: cls.type,
        coach: cls.coach?.name || "",
        isOpen: cls.isOpen,
        isClose: cls.isClose,
        isHalfHour: duration === 30,
      };
    });

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
    createForm.reset({
      coach: "",
      type: "WOD",
      isOpen: false,
      isClose: false,
      isHalfHour: false,
    });
    setCreateDialogOpen(true);
  };

  const createClassMutation = useCreateClassQuery();

  function onSubmitCreateClass(values: any) {
    const coachId = values.coach;
    const coachData = users?.find((u: any) => u.id === Number(coachId));
    const coachName = coachData ? coachData.name : coachId;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const start = fromZonedTime(selectedRange?.start || "", timeZone);
    const end = new Date(start);

    // ⏱️ Adjust end time for half-hour if checked
    if (values.isHalfHour) {
      end.setMinutes(end.getMinutes() + 30);
    } else {
      end.setMinutes(end.getMinutes() + 60);
    }

    const newClass = {
      start: start.toISOString(),
      end: end.toISOString(),
      coach: coachId,
      type: values.type,
      isOpen: values.isOpen,
      isClose: values.isClose,
    };

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

  // Close create dialog and clear form
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    createForm.reset({
      coach: "",
      type: "WOD",
      isOpen: false,
      isClose: false,
      isHalfHour: false,
    });
  };

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
      isHalfHour: found.isHalfHour ?? false,
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

    // ⏱ Recalculate end time based on isHalfHour checkbox
    const start = new Date(editingEvent.start);
    const end = new Date(start);

    if (values.isHalfHour) {
      end.setMinutes(start.getMinutes() + 30);
    } else {
      end.setMinutes(start.getMinutes() + 60);
    }

    updateClassMutation.mutate(
      {
        id: Number(classId),
        data: {
          coachId,
          type: values.type,
          start: start.toISOString(),
          end: end.toISOString(),
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
                ? {
                    ...cls,
                    coach: coachName,
                    type: values.type,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    isHalfHour: values.isHalfHour ?? false, // ✅ update flag locally too
                  }
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

  // Close update dialog and clear form
  const handleCloseUpdateDialog = () => {
    setUpdateClassDialogOpen(false);
    setEditingEvent(null);
    updateClassForm.reset({
      coach: "",
      type: "WOD",
      isOpen: false,
      isClose: false,
      isHalfHour: false,
    });
  };

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
      <Dialog open={createDialogOpen} onOpenChange={handleCloseCreateDialog}>
        <DialogContent>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onSubmitCreateClass)}
              className="space-y-6"
            >
              {/* Coach */}
              <FormField
                control={createForm.control}
                name="coach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coach</FormLabel>
                    <FormControl>
                      <Combobox
                        options={
                          users?.map((user: any) => ({
                            value: user.id.toString(),
                            label: user.name,
                          })) ?? []
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a coach"
                        size="full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Combobox
                        options={[
                          { value: "WOD", label: "WOD" },
                          { value: "Gymnastics", label: "Gymnastics" },
                          { value: "Weightlifting", label: "Weightlifting" },
                          { value: "Endurance", label: "Endurance" },
                          { value: "Foundations", label: "Foundations" },
                          { value: "Kids", label: "Kids" },
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select class type"
                        size="full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Apertura */}
                <FormField
                  control={createForm.control}
                  name="isOpen"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal pt-1.5">
                        Apertura
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Cierre */}
                <FormField
                  control={createForm.control}
                  name="isClose"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal pt-1.5">
                        Cierre
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Half Hour */}
                <FormField
                  control={createForm.control}
                  name="isHalfHour"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal pt-1.5">
                        Clase de media hora
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

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
        onOpenChange={handleCloseUpdateDialog}
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
                      <Combobox
                        options={
                          users?.map((user: any) => ({
                            value: user.id.toString(),
                            label: user.name,
                          })) ?? []
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a coach"
                        size="full"
                      />
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
                      <Combobox
                        options={[
                          { value: "WOD", label: "WOD" },
                          { value: "Gymnastics", label: "Gymnastics" },
                          { value: "Weightlifting", label: "Weightlifting" },
                          { value: "Endurance", label: "Endurance" },
                          { value: "Foundations", label: "Foundations" },
                          { value: "Kids", label: "Kids" },
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select class type"
                        size="full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Apertura */}
                <FormField
                  control={updateClassForm.control}
                  name="isOpen"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal pt-1.5">
                        Apertura
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Cierre */}
                <FormField
                  control={updateClassForm.control}
                  name="isClose"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal pt-1.5">
                        Cierre
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Clase de media hora */}
                <FormField
                  control={updateClassForm.control}
                  name="isHalfHour"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal pt-1.5">
                        Clase de media hora
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

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
