/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  classesQueryOptions,
  useCreateClassQuery,
  useUpdateClassQuery,
} from "@/app/queries/classes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Class = {
  id: string;
  start: string;
  end: string;
  type: string;
  coach: string;
  isOpen?: boolean;
  isClose?: boolean;
};

const createFormSchema = z.object({
  coach: z.string().min(1, "Coach is required"),
  type: z.string().min(1, "Type is required"),
});

const updateClassFormSchema = z.object({
  coach: z.string().min(1, "Coach is required"),
  type: z.string().min(1, "Type is required"),
});

export default function ScheduleCalendar() {
  const { user } = useAuth();

  const calendarRef = useRef<FullCalendar | null>(null);

  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false); //Controls the create class dialog

  const [updateClassDialogOpen, setUpdateClassDialogOpen] = useState(false); //Controls the update class dialog
  const [editingEvent, setEditingEvent] = useState<Class | null>(null); //Sets the event you want to edit to use it in the form later

  const [selectedType, setSelectedType] = useState<string>("all"); //States for the filters
  const [selectedCoach, setSelectedCoach] = useState<string>("all");

  const [calendarClasses, setCalendarClasses] = useState<Class[]>([]); //Sets the classes when the page loads

  const { data: users } = useQuery(usersQueryOptions()); //Get users

  const [dateRange, setDateRange] = useState<{
    //This date range comes from the calendar property "datesSet". You save datesSet to your state and use it in your query
    start: string;
    end: string;
  } | null>(null);

  const [selectedRange, setSelectedRange] = useState<{
    //Time range to use in the getEvents call
    start: string;
    end: string;
  } | null>(null);

  const { data: classes } = useQuery(
    //Get classes
    dateRange
      ? classesQueryOptions(dateRange.start, dateRange.end)
      : { queryKey: [], queryFn: async () => [] }
  );

  //Formats the classes from the query and saves them to the local state
  useEffect(() => {
    if (!classes) return;

    const formattedClasses: Class[] = classes?.results?.map((cls: any) => ({
      id: cls.id.toString(), // FullCalendar needs string IDs and the id from the DB comes as a number
      start: cls.start,
      end: cls.end,
      type: cls.type,
      coach: cls.coach?.name, // human-readable name for display
      isOpen: cls.isOpen,
      isClose: cls.isClose,
    }));

    setCalendarClasses(formattedClasses);
  }, [classes]);

  //FILTERS
  const filteredClasses = calendarClasses?.filter((cls) => {
    const matchesType = selectedType === "all" || cls.type === selectedType;
    const matchesCoach = selectedCoach === "all" || cls.coach === selectedCoach;
    return matchesType && matchesCoach;
  });

  const createClassMutation = useCreateClassQuery();

  //CREATE NEW CLASS FORM
  const createForm = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      coach: "",
      type: "",
    },
  });

  //Opens dialog with create form. It uses "select" from the calendar to trigger. It saves the time range to our state "selectedRange" to use it in the dialog.
  const openCreateDialog = (range: DateSelectArg) => {
    setSelectedRange({ start: range.startStr, end: range.endStr });

    createForm.reset({ coach: "", type: "WOD" });
    setCreateDialogOpen(true);
  };

  //Submits the form from the createDialog
  function onSubmitCreateClass(values: z.infer<typeof createFormSchema>) {
    const coachId = values.coach;
    const coachData = users?.find((u: any) => u.id === Number(coachId));
    const coachName = coachData ? `${coachData.name}` : coachId;

    const startDate = selectedRange?.start
      ? new Date(selectedRange.start)
      : null;
    const endDate = selectedRange?.end ? new Date(selectedRange.end) : null;

    // Default flags
    let isOpen = false;
    let isClose = false;

    if (startDate && endDate) {
      const startHour = startDate.getHours();
      const endHour = endDate.getHours();

      if (startHour === 9 && endHour === 10) {
        isOpen = true;
      } else if (startHour === 21 && endHour === 22) {
        isClose = true;
      }
    }

    const newClass = {
      start: selectedRange?.start,
      end: selectedRange?.end,
      coach: coachName,
      type: values.type,
      isOpen,
      isClose,
    };

    if (!user?.id) {
      toast.error("User not authenticated.");
      return;
    }

    createClassMutation.mutate(
      { userId: user?.id, classData: { ...newClass, coach: coachId } },
      {
        onSuccess: (createdClass) => {
          const classWithCoachName = {
            ...createdClass,
            coach: coachName,
          };
          setCalendarClasses((prev) => [...prev, classWithCoachName]);
          toast.success("Class created successfully!");
          setCreateDialogOpen(false);
        },
        onError: (err) => {
          toast.error("Error creating class");
          console.error("❌ Failed to create class:", err);
        },
      }
    );
  }

  //UPDATE CLASS FORM
  const updateClassForm = useForm<z.infer<typeof updateClassFormSchema>>({
    resolver: zodResolver(updateClassFormSchema),
    defaultValues: {
      coach: "",
      type: "",
    },
  });

  const openEditDialog = (info: EventClickArg) => {
    const eventId = info.event.id;
    const found = calendarClasses.find((cls) => cls.id === eventId);

    if (!found) {
      console.warn("⚠️ Could not find event to edit.");
      return;
    }

    setEditingEvent(found);

    // Get coach ID by looking up the name
    const matchedUserId = users?.find((u: any) => u.name === found.coach)?.id;

    // Reset form values with existing class data
    updateClassForm.reset({
      coach: matchedUserId ? String(matchedUserId) : "", // must be a string if form expects string
      type: found.type,
    });

    setUpdateClassDialogOpen(true);
  };

  const updateClassMutation = useUpdateClassQuery();

  function onSubmitUpdateClass(values: z.infer<typeof createFormSchema>) {
    //Edit class
    const classId = editingEvent?.id;
    const coachId = Number(values.coach);
    const coachData = users?.find((u: any) => u.id === Number(coachId));
    const coachName = coachData?.name ?? String(coachId);

    updateClassMutation.mutate(
      {
        id: Number(classId),
        data: {
          coachId,
          type: values.type,
          start: editingEvent?.start,
          end: editingEvent?.end,
        },
      },
      {
        onSuccess: () => {
          toast.success("Class updated successfully!");

          // Optionally update local state optimistically (optional)
          setCalendarClasses((prev) =>
            prev.map((cls) =>
              cls.id === classId
                ? {
                    ...cls,
                    coach: coachName,
                    type: values.type,
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

    return;
  }

  //This uses the same function as the editClass one
  const handleEventDrop = (info: any) => {
    const eventId = info.event.id;
    const newStartStr = info.event.start?.toISOString();
    const newEndStr = info.event.end?.toISOString();

    if (!newStartStr || !newEndStr || !eventId) {
      console.warn("⚠️ Invalid event drop info.");
      return;
    }

    const newStart = new Date(newStartStr);
    const newEnd = new Date(newEndStr);

    let isOpen = false;
    let isClose = false;

    const startHour = newStart.getHours();
    const endHour = newEnd.getHours();

    if (startHour === 9 && endHour === 10) {
      isOpen = true;
    } else if (startHour === 21 && endHour === 22) {
      isClose = true;
    }

    updateClassMutation.mutate(
      {
        id: Number(eventId),
        data: {
          start: newStartStr,
          end: newEndStr,
          isOpen,
          isClose,
        },
      },
      {
        onSuccess: () => {
          toast.success("Class updated successfully!");

          setCalendarClasses((prev) =>
            prev.map((cls) =>
              cls.id === eventId
                ? {
                    ...cls,
                    start: newStartStr,
                    end: newEndStr,
                    isOpen,
                    isClose,
                  }
                : cls
            )
          );

          queryClient.invalidateQueries({ queryKey: ["classes"] });
        },
        onError: (error) => {
          toast.error("Failed to update class");
          console.error("❌ Update failed:", error);
          info.revert();
        },
      }
    );
  };

  return (
    <div className="relative w-full overflow-auto">
      <div className="relative min-w-[900px] xl:min-w-0">
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          {/* Class Type Filter */}
          <div className="w-[200px]">
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Array.from(
                  new Set(calendarClasses?.map((cls) => cls.type))
                ).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coach Filter */}
          <div className="w-[200px]">
            <Select
              value={selectedCoach}
              onValueChange={(value) => setSelectedCoach(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coaches</SelectItem>
                {Array.from(
                  new Set(calendarClasses?.map((cls) => cls.coach))
                ).map((coach) => (
                  <SelectItem key={coach} value={coach}>
                    {coach}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          views={{
            dayGridMonth: {
              dayHeaders: false,
            },
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="09:00:00"
          slotMaxTime="22:00:00"
          slotDuration="01:00:00"
          allDaySlot={false}
          firstDay={1}
          events={filteredClasses?.map((cls) => ({
            //Defines the shape of the events so you can track it using "event"
            id: cls.id,
            type: cls.type,
            start: cls.start,
            end: cls.end,
            extendedProps: {
              coach: cls.coach,
              isOpen: cls.isOpen,
              isClose: cls.isClose,
            },
          }))}
          editable
          selectMirror
          selectOverlap
          eventOverlap
          nowIndicator
          datesSet={(arg) => {
            const start = arg.startStr;
            const end = arg.endStr;
            setDateRange({ start, end });
          }}
          eventDrop={handleEventDrop}
          selectable //Allows to select a time range when clicking the calendar
          select={openCreateDialog} //This property tracks when the calendar is clicked
          selectAllow={() => {
            const viewType = calendarRef.current?.getApi().view.type;

            if (viewType === "dayGridMonth") {
              toast.info(
                "You can't add classes in the month view. Switch to week or day view."
              );
              return false;
            }

            return true;
          }}
          eventClick={openEditDialog} //This property tracks if you click an existing event
          dayHeaderFormat={{ day: "numeric", month: "long" }}
          dayMaxEvents={true}
          slotLabelContent={({ date }) => {
            const end = new Date(date.getTime() + 60 * 60 * 1000);
            const format = (d: Date) =>
              d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

            return `${format(date)} - ${format(end)}`;
          }}
          eventContent={({ event }) => {
            const type = event.extendedProps.type;
            const coach = event.extendedProps.coach;

            const colorMap: Record<string, string> = {
              WOD: "bg-blue-100 border-blue-300 text-blue-900",
              Gymnastics: "bg-yellow-100 border-yellow-300 text-yellow-900",
              Weightlifting: "bg-purple-100 border-purple-300 text-purple-900",
              Endurance: "bg-green-100 border-green-300 text-green-900",
              Kids: "bg-pink-100 border-pink-300 text-pink-900",
              Foundations: "bg-orange-100 border-orange-300 text-orange-900",
            };

            const classNames =
              colorMap[type] || "bg-gray-100 border-gray-300 text-gray-800";

            const tooltipText = `Coach: ${coach}\n${new Date(
              event.startStr
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} – ${new Date(event.endStr).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`;

            return (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      title={tooltipText} // ✅ Native fallback tooltip
                      className={`w-full h-full p-1 text-xs rounded-md shadow-sm border overflow-hidden cursor-pointer ${classNames}`}
                    >
                      <div className="text-[12px] truncate">{type}</div>
                      <div className="text-[12px] truncate">{coach}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] z-[99999]">
                    <div className="text-xs text-muted-foreground">
                      Coach: {coach}
                    </div>
                    <div className="text-xs">
                      {new Date(event.startStr).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(event.endStr).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }}
        />
      </div>

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

              <DialogFooter className="pt-4 gap-2">
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* === EDIT CLASS MODAL === */}
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

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="delete"
                  onClick={() => {}}
                  className="w-auto"
                >
                  Delete
                </Button>

                <Button type="submit">Edit</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
