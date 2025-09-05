/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as XLSX from "xlsx";

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
import { ChevronLeft, ChevronRight, TableIcon } from "lucide-react";
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
import { SearchSelectDropdown } from "@/components/web/searchSelectDropdown";

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
  /* isHalfHour?: boolean; */
};

const createFormSchema = z
  .object({
    coach: z.string().min(1, "Coach is required"),
    type: z.string().min(1, "Type is required"),
    isOpen: z.boolean().optional().default(false),
    isClose: z.boolean().optional().default(false),
    //isHalfHour: z.boolean().optional().default(false), // 🆕
    startTime: z.string(),
    endTime: z.string(),
  })
  .refine((data) => !(data.isOpen && data.isClose), {
    message: "You can't check both Apertura and Cierre",
    path: ["isClose"],
  });

const hhmm = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateClassFormSchema = z
  .object({
    coach: z.string().min(1, "Select a coach"),
    type: z.string().min(1, "Select a type"),
    isOpen: z.boolean().optional(),
    isClose: z.boolean().optional(),
    //isHalfHour: z.boolean().optional(), // keep if you still show it
    startTime: z.string().regex(hhmm, "Invalid time (HH:MM)"),
    endTime: z.string().regex(hhmm, "Invalid time (HH:MM)"),
  })
  .refine(
    (vals) => {
      // do a simple HH:MM comparison
      return vals.startTime < vals.endTime;
    },
    { path: ["endTime"], message: "End time must be after start time" }
  );

export default function Calendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarClasses, setCalendarClasses] = useState<Class[]>([]);
  const { data: users } = useQuery(usersQueryOptions());

  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const availableYears = [2025, 2026, 2027, 2028, 2029];

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
      //const start = new Date(cls.start);
      //const end = new Date(cls.end);
      //const duration = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes

      return {
        id: cls.id.toString(),
        start: cls.start,
        end: cls.end,
        type: cls.type,
        coach: cls.coach?.name || "",
        isOpen: cls.isOpen,
        isClose: cls.isClose,
        //isHalfHour: duration === 30,
      };
    });

    setCalendarClasses(formatted);
  }, [classes]);

  //Filter classes by coach
  const filteredClasses = calendarClasses.filter((cls) => {
    const coachMatch = selectedCoach ? cls.coach === selectedCoach : true;
    const typeMatch = selectedType ? cls.type === selectedType : true;
    return coachMatch && typeMatch;
  });

  const createForm = useForm({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      coach: "",
      type: "",
      isOpen: false,
      isClose: false,
      startTime: "", // manual start time control
      endTime: "",
    },
  });

  // This gets triggered by WeekView
  // This gets triggered by WeekView
  const openCreateDialog = (range: { startStr: string; endStr: string }) => {
    setSelectedRange({ start: range.startStr, end: range.endStr });

    // Default to start of the clicked hour, end = +60 min
    const localStart = new Date(range.startStr);
    localStart.setMinutes(0, 0, 0); // start of the hour
    const localEnd = new Date(localStart.getTime() + 60 * 60 * 1000);

    const startTimeDefault =
      String(localStart.getHours()).padStart(2, "0") +
      ":" +
      String(localStart.getMinutes()).padStart(2, "0"); // "HH:MM"
    const endTimeDefault =
      String(localEnd.getHours()).padStart(2, "0") +
      ":" +
      String(localEnd.getMinutes()).padStart(2, "0"); // "HH:MM"

    createForm.reset({
      coach: "",
      type: "WOD",
      isOpen: false,
      isClose: false,
      //isHalfHour: false, // keep if you still use it elsewhere

      startTime: startTimeDefault,
      endTime: endTimeDefault,
    });

    setCreateDialogOpen(true);
  };

  const createClassMutation = useCreateClassQuery();

  function onSubmitCreateClass(values: any) {
    const coachId = values.coach;
    const coachData = users?.find((u: any) => u.id === Number(coachId));
    const coachName = coachData ? coachData.name : coachId;

    if (!user?.id) {
      toast.error("User not authenticated.");
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Date part from the clicked day
    const datePart = (selectedRange?.start || "").slice(0, 10); // "YYYY-MM-DD"
    const startClock = values.startTime || "09:00";
    const endClock = values.endTime || "10:00";

    const startLocalISO = `${datePart}T${startClock}:00`;
    const endLocalISO = `${datePart}T${endClock}:00`;

    const start = fromZonedTime(startLocalISO, timeZone);
    const end = fromZonedTime(endLocalISO, timeZone);

    if (!(start instanceof Date) || isNaN(start.getTime())) {
      toast.error("Invalid start time.");
      return;
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      toast.error("Invalid end time.");
      return;
    }
    if (end <= start) {
      toast.error("End time must be after start time.");
      return;
    }

    const newClass = {
      start: start.toISOString(),
      end: end.toISOString(),
      coach: coachId,
      type: values.type,
      isOpen: values.isOpen,
      isClose: values.isClose,
    };

    createClassMutation.mutate(
      { userId: user.id, classData: newClass },
      {
        onSuccess: (res) => {
          setCalendarClasses((prev) => [
            ...prev,
            {
              ...res.data,
              // ensure these are present even if backend omits/renames
              start: res.data?.start ?? newClass.start,
              end: res.data?.end ?? newClass.end,
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
      //isHalfHour: false,
    });
  };

  const updateClassForm = useForm({
    resolver: zodResolver(updateClassFormSchema),
    defaultValues: {
      coach: "",
      type: "",
      isOpen: false,
      isClose: false,
      //isHalfHour: false, // optional
      startTime: "09:00", // NEW
      endTime: "10:00", // NEW
    },
  });

  const [updateClassDialogOpen, setUpdateClassDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Class | null>(null);

  const updateClassMutation = useUpdateClassQuery();

  const openEditDialog = (cls: Class) => {
    const found = calendarClasses.find((c) => c.id === cls?.event?.id);
    if (!found) {
      console.warn("⚠️ Could not find class to edit.");
      return;
    }

    setEditingEvent(found);

    const matchedUserId = users?.find((u: any) => u.name === found.coach)?.id;

    // Derive HH:MM in the desired time zone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const startHHmm = new Date(found.start).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }); // e.g., "10:00"

    const endHHmm = new Date(found.end).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }); // e.g., "11:00"

    updateClassForm.reset({
      coach: matchedUserId ? String(matchedUserId) : "",
      type: found.type,
      isOpen: found.isOpen ?? false,
      isClose: found.isClose ?? false,
      //isHalfHour: found.isHalfHour ?? false,
      // NEW:
      startTime: startHHmm,
      endTime: endHHmm,
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

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get date part for the edited class in the chosen time zone: YYYY-MM-DD
    const datePart = new Date(editingEvent.start).toLocaleDateString("en-CA", {
      timeZone,
    });

    const startClock = values.startTime || "09:00";
    const endClock = values.endTime || "10:00";

    const startLocalISO = `${datePart}T${startClock}:00`;
    const endLocalISO = `${datePart}T${endClock}:00`;

    const start = fromZonedTime(startLocalISO, timeZone);
    const end = fromZonedTime(endLocalISO, timeZone);

    if (!(start instanceof Date) || isNaN(start.getTime())) {
      toast.error("Invalid start time.");
      return;
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      toast.error("Invalid end time.");
      return;
    }
    if (end <= start) {
      toast.error("End time must be after start time.");
      return;
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

          // Optimistic update — ensure start/end are present
          setCalendarClasses((prev) =>
            prev.map((cls) =>
              cls.id === classId
                ? {
                    ...cls,
                    coach: coachName,
                    type: values.type,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    //isHalfHour: values.isHalfHour ?? false,
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
      //isHalfHour: false,
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

  const exportClassesToExcel = (classes: any[]) => {
    const startHour = 9;
    const endHour = 22;

    // Get Monday of the week
    const minDate = new Date(
      Math.min(...classes.map((c) => new Date(c.start).getTime()))
    );
    const monday = new Date(minDate);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // Force Monday

    // Build week days
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });

    const dayHeaders = days.map((d) => {
      const weekday = d.toLocaleDateString("es-ES", { weekday: "long" });
      const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const date = d.toLocaleDateString("es-ES");
      return `${capitalized} - ${date}`;
    });

    const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => {
      const hour = startHour + i;
      return `${hour.toString().padStart(2, "0")}:00`;
    });

    // Build empty calendar matrix
    const calendarMatrix: Record<string, Record<string, string[]>> = {};
    timeSlots.forEach((time) => {
      calendarMatrix[time] = {};
      dayHeaders.forEach((day) => {
        calendarMatrix[time][day] = [];
      });
    });

    // Summary tracker
    const summary: Record<string, Record<string, number>> = {};

    // Fill matrix and build summary
    classes.forEach((cls) => {
      const start = new Date(cls.start);
      const end = new Date(cls.end);
      const durationHours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const hour = start.getHours();
      const timeKey = `${hour.toString().padStart(2, "0")}:00`;

      const weekday = start.toLocaleDateString("es-ES", { weekday: "long" });
      const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const date = start.toLocaleDateString("es-ES");
      const dayKey = `${capitalized} - ${date}`;

      const coachName = `${cls.coach?.name ?? ""} ${
        cls.coach?.lastName ?? ""
      }`.trim();
      const type = cls.type;

      const label = `${type} (${coachName})${
        durationHours <= 0.5 ? " (30 min)" : ""
      }`;

      if (calendarMatrix[timeKey] && calendarMatrix[timeKey][dayKey]) {
        calendarMatrix[timeKey][dayKey].push(label);
      }

      // Track summary
      if (!summary[coachName]) summary[coachName] = {};
      if (!summary[coachName][type]) summary[coachName][type] = 0;
      summary[coachName][type] += durationHours;
    });

    // Convert matrix to rows
    const rows: string[][] = [["Time", ...dayHeaders]];
    timeSlots.forEach((time) => {
      const row = [time];
      dayHeaders.forEach((day) => {
        const cellContent = calendarMatrix[time][day].join("\n");
        row.push(cellContent);
      });
      rows.push(row);
    });

    // Append summary
    rows.push([], ["Resumen de Horas por Coach y Tipo"]);
    for (const coach in summary) {
      rows.push([coach]);
      for (const type in summary[coach]) {
        rows.push([`${type}: ${summary[coach][type].toFixed(1)}`]);
      }
      rows.push([]);
    }

    // Sheet & style
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    // 🔹 Set wider columns so content is visible
    worksheet["!cols"] = [
      { wch: 10 }, // Time column
      ...dayHeaders.map(() => ({ wch: 30 })), // Wider day columns
    ];

    // 🔹 Set taller rows for multiline cells
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      if (!worksheet["!rows"]) worksheet["!rows"] = [];
      worksheet["!rows"][R] = { hpt: 60 }; // 80 points = plenty for multiple lines
    }

    for (let C = range.s.c + 1; C <= range.e.c; ++C) {
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellRef];
        if (cell && typeof cell.v === "string") {
          if (!cell.s) cell.s = {};
          cell.s.alignment = {
            wrapText: true,
            vertical: "center",
            horizontal: "center",
          };
        }
      }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calendario Semanal");

    // Dynamic file name
    const startOfWeek = days[0];
    const endOfWeek = days[6];
    const options = { month: "long" } as const;
    const startMonth = startOfWeek.toLocaleDateString("es-ES", options);
    const endMonth = endOfWeek.toLocaleDateString("es-ES", options);
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();
    const year = startOfWeek.getFullYear();

    const fileName = `${
      startMonth.charAt(0).toUpperCase() + startMonth.slice(1)
    } ${startDay} - ${
      startMonth !== endMonth
        ? endMonth.charAt(0).toUpperCase() + endMonth.slice(1) + " "
        : ""
    }${endDay} / ${year}.xlsx`;

    // Save
    XLSX.writeFile(workbook, fileName);
  };

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

      {/* Coach and class type filters */}
      <div className="flex flex-wrap items-center justify-start gap-4">
        <Select
          value={selectedCoach ?? "all"}
          onValueChange={(val) => setSelectedCoach(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por coach" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los coaches</SelectItem>
            {users?.map((user: any) => (
              <SelectItem key={user.id} value={user.name}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedType ?? "all"}
          onValueChange={(val) => setSelectedType(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="WOD">WOD</SelectItem>
            <SelectItem value="Gymnastics">Gymnastics</SelectItem>
            <SelectItem value="Weightlifting">Weightlifting</SelectItem>
            <SelectItem value="Endurance">Endurance</SelectItem>
            <SelectItem value="Foundations">Foundations</SelectItem>
            <SelectItem value="Kids">Kids</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View */}
      {view === "month" && (
        <MonthView date={currentDate} classes={filteredClasses} />
      )}
      {view === "week" && (
        <>
          <Button
            className="w-auto bg-blue-200"
            onClick={() => {
              exportClassesToExcel(classes?.results || []);
            }}
          >
            <TableIcon />
            Export Classes
          </Button>
          <WeekView
            date={currentDate}
            classes={filteredClasses}
            onClassClick={(cls) => {
              const fakeEventClickArg = {
                event: { id: cls.id },
              } as any; // or cast to your EventClickArg type if needed
              openEditDialog(fakeEventClickArg);
            }}
            onTimeSlotClick={openCreateDialog} // <-- Pass it here
          />
        </>
      )}
      {view === "day" && (
        <DayView date={currentDate} classes={filteredClasses} />
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
                      <SearchSelectDropdown
                        options={
                          users?.map((user: any) => ({
                            value: user.id.toString(),
                            label: user.name,
                          })) ?? []
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select an coach"
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
                      <SearchSelectDropdown
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === TIME CONTROLS === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start time (local) */}
                <FormField
                  control={createForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start time</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 96 }, (_, i) => {
                              const hours = Math.floor((i * 15) / 60)
                                .toString()
                                .padStart(2, "0");
                              const minutes = ((i * 15) % 60)
                                .toString()
                                .padStart(2, "0");
                              const time = `${hours}:${minutes}`;
                              return (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration (minutes) */}
                <FormField
                  control={createForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End time</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 96 }, (_, i) => {
                              const hours = Math.floor((i * 15) / 60)
                                .toString()
                                .padStart(2, "0");
                              const minutes = ((i * 15) % 60)
                                .toString()
                                .padStart(2, "0");
                              const time = `${hours}:${minutes}`;
                              return (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                {/*  <FormField
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
                /> */}
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
                      <SearchSelectDropdown
                        options={
                          users?.map((user: any) => ({
                            value: user.id.toString(),
                            label: user.name,
                          })) ?? []
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select an coach"
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
                      <SearchSelectDropdown
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start time */}

                <FormField
                  control={updateClassForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start time</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 96 }, (_, i) => {
                              const hours = Math.floor((i * 15) / 60)
                                .toString()
                                .padStart(2, "0");
                              const minutes = ((i * 15) % 60)
                                .toString()
                                .padStart(2, "0");
                              const time = `${hours}:${minutes}`;
                              return (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateClassForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start time</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 96 }, (_, i) => {
                              const hours = Math.floor((i * 15) / 60)
                                .toString()
                                .padStart(2, "0");
                              const minutes = ((i * 15) % 60)
                                .toString()
                                .padStart(2, "0");
                              const time = `${hours}:${minutes}`;
                              return (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                {/*  <FormField
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
                /> */}
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
