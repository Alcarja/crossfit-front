/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { addMinutes, format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar"; // shadcn calendar (react-day-picker)
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ellipsis,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import {
  classesByDayQueryOptions,
  useEnrollInClass,
  useGetClassEnrollments,
} from "@/app/queries/schedule";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { typeColors } from "@/components/types/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchSelectDropdown } from "@/components/web/searchSelectDropdown";
import { usersQueryOptions } from "@/app/queries/users";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  cancelEnrollment,
  moveToWaitlist,
  promoteFromWaitlist,
  reinstateEnrollment,
  waitlistToCancel,
} from "@/app/adapters/api";

function typeClassName(t?: string) {
  return t && typeColors[t] ? typeColors[t] : "bg-gray-200 text-gray-800";
}

type User = { id: string; name: string; lastName: string };

type ClassItem = {
  id: number;
  name: string;
  type: string;
  coach: string;
  start: Date;
  durationMin: number;
  capacity: number;
  location?: string;
  enrolledCount?: number;
  waitlistCount?: number;
};

// ---------------------- UI HELPERS ----------------------

//Gets the initials of the user
function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

//Format date to the format used by the backend: 2025-08-20
function toISODateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toLocalDate(dateISO: string, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(dateISO + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d;
}

// ---------------------- MAIN COMPONENT ----------------------

export const ClientsView = () => {
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); //To select the date in the calendar
  const [query, setQuery] = useState(""); //State for the search input

  //Get the classes by day
  const { data: classesByDayData } = useQuery(
    classesByDayQueryOptions(toISODateString(selectedDate))
  );

  //This brings the classes for the day to use in the LEFT SIDE
  const classesForDay = useMemo(() => {
    const rows = classesByDayData?.instances ?? []; //This is how the classesByDay are recieved

    const mapped = rows.map((r: any): ClassItem => {
      const start = toLocalDate(r.date, r.startTime);
      const end = r.endTime
        ? toLocalDate(r.date, r.endTime)
        : new Date(start.getTime() + 60 * 60000);
      const durationMin = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60000)
      );

      return {
        id: Number(r.id), // ✅ normalize to number here
        name: r.name ?? r.type,
        type: r.type,
        coach: r.coachId ? `Coach #${r.coachId}` : "—",
        start,
        durationMin,
        capacity: r.capacity ?? 0,
        location: r.zoneName ?? undefined,
        enrolledCount: r.enrolledCount ?? 0,
      };
    });

    // filter by search + ensure it's the selected day (API already does, but safe)
    return mapped
      .filter((c: any) => isSameDay(c.start, selectedDate))
      .filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
  }, [classesByDayData, selectedDate, query]);

  //Gets the selected class
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const selectedClass = useMemo(() => {
    return (
      classesForDay.find((c: any) => c.id === selectedClassId) ??
      classesForDay[0] ??
      null
    );
  }, [classesForDay, selectedClassId]);

  const [reserveOpen, setReserveOpen] = useState(false); //Opens the modal for the reservation
  const [userIdInput, setUserIdInput] = useState(""); //Gets the id of the user to register the class

  //Calculate the spots left in a class
  function spotsLeft(cls: any) {
    return Math.max(0, cls.capacity - (cls.enrolledCount ?? 0));
  }

  const hasSpots = selectedClass ? spotsLeft(selectedClass) > 0 : false;

  const { data: usersData } = useQuery(usersQueryOptions()); //Gets the user info for the select in the modal for reservation

  const userOptions = [
    { value: "", label: "All Coaches" },
    ...(usersData?.map((user: User) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  //Function to register the reservation
  const { mutateAsync: enroll } = useEnrollInClass();

  async function handleCreateReservation() {
    if (!selectedClass) return;

    const userId = Number(userIdInput);
    if (!userId || Number.isNaN(userId)) {
      console.error("Invalid user id");
      return;
    }

    console.log("UserId", userId);
    console.log("Class id", selectedClass.id);

    try {
      await enroll({ userId, classId: selectedClass.id });
      queryClient.invalidateQueries({
        queryKey: classesByDayQueryOptions(toISODateString(selectedDate))
          .queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: ["classEnrollments", selectedClass.id], // <-- CHANGE THIS LINE
      });
      toast.success("Reserva confirmada");
      setReserveOpen(false);
    } catch (err) {
      console.error("Enrollment failed:", err);
      toast.error("Reserva fallida");
    }
  }

  //Gets the reservations for the specific class that was selected
  const { data: userReservationData } = useQuery({
    ...useGetClassEnrollments(selectedClass?.id), //Only run the query if a class is selected
    enabled: !!selectedClass?.id,
  });

  const enrollments = userReservationData?.enrollments ?? [];

  const attendees = enrollments
    .filter((e: any) => e.status === "enrolled")
    .map((e: any) => ({
      id: e.user.id,
      name: `${e.user.name} ${e.user.lastName}`,
    }));

  const waitlist = enrollments
    .filter((e: any) => e.status === "waitlist")
    .map((e: any) => ({
      id: e.user.id,
      name: `${e.user.name} ${e.user.lastName}`,
    }));

  const cancellations = enrollments
    .filter((e: any) => e.status === "cancelled")
    .map((e: any) => ({
      id: e.user.id,
      name: `${e.user.name} ${e.user.lastName}`,
    }));

  const useCancelEnrollment = () => {
    return useMutation({
      mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
        cancelEnrollment(userId, classId),
      onSuccess: (_data, vars) => {
        queryClient.invalidateQueries({
          queryKey: ["classEnrollments", vars.classId],
        });
      },
    });
  };

  const useReinstateEnrollment = () => {
    return useMutation({
      mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
        reinstateEnrollment(userId, classId),
      onSuccess: (_data, vars) => {
        queryClient.invalidateQueries({
          queryKey: ["classEnrollments", vars.classId],
        });
      },
    });
  };

  const useMoveToWaitlist = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
        moveToWaitlist(userId, classId),
      onSuccess: (_d, v) => {
        qc.invalidateQueries({ queryKey: ["classEnrollments", v.classId] });
      },
    });
  };

  const usePromoteFromWaitlist = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
        promoteFromWaitlist(userId, classId),
      onSuccess: (_d, v) => {
        qc.invalidateQueries({ queryKey: ["classEnrollments", v.classId] });
      },
    });
  };

  const useWaitlistToCancel = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
        waitlistToCancel(userId, classId),
      onSuccess: (_d, v) => {
        qc.invalidateQueries({ queryKey: ["classEnrollments", v.classId] });
      },
    });
  };

  // ── Usage inside your component ─────────────────────────────────────────
  const { mutateAsync: cancelEnroll } = useCancelEnrollment();
  const { mutateAsync: reinstate } = useReinstateEnrollment();
  const { mutateAsync: moveWaitlist } = useMoveToWaitlist();
  const { mutateAsync: promote } = usePromoteFromWaitlist();
  const { mutateAsync: removeFromWaitlist } = useWaitlistToCancel();

  async function handleRosterAction(
    userId: number | string,
    action:
      | "checkin"
      | "cancel"
      | "move-to-waitlist"
      | "promote"
      | "remove-waitlist"
      | "reinstate-attendee"
      | "reinstate-waitlist"
      | "delete-record"
  ) {
    if (!selectedClass) return;

    const uid = Number(userId);

    const refreshPanels = () => {
      queryClient.invalidateQueries({
        queryKey: ["classEnrollments", selectedClass.id],
      });
      queryClient.invalidateQueries({
        queryKey: classesByDayQueryOptions(toISODateString(selectedDate))
          .queryKey,
      });
    };

    try {
      if (action === "cancel") {
        await cancelEnroll({ userId: uid, classId: selectedClass.id });
        refreshPanels();
        toast.success("Reserva cancelada");
        return;
      }

      // Move to waitlist from attendees OR from cancellations
      if (action === "move-to-waitlist" || action === "reinstate-waitlist") {
        await moveWaitlist({ userId: uid, classId: selectedClass.id });
        refreshPanels();
        toast.success("Pasado a lista de espera");
        return;
      }

      // Reinstate (server enrolls if capacity else waitlists)
      if (action === "reinstate-attendee") {
        const res = await reinstate({ userId: uid, classId: selectedClass.id });
        refreshPanels();
        const status = res?.data?.status ?? "reinstated";
        toast.success(`Reserva reinstaurada (${status})`);
        return;
      }

      // Stubs for other actions (wire later)

      if (action === "promote") {
        await promote({ userId: uid, classId: selectedClass.id });
        refreshPanels();
        toast.success("Promovido a asistente");
        return;
      }

      if (action === "remove-waitlist") {
        await removeFromWaitlist({ userId: uid, classId: selectedClass.id });
        refreshPanels();
        toast.success("Eliminado de la lista de espera");
        return;
      }
    } catch (e) {
      console.error(e);
      toast.error("Operación no completada");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 w-full min-h-screen">
      {/* LEFT: Main list; calendar appears only on demand */}
      <div className="space-y-4">
        <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="pb-2">Create a reservation</DialogTitle>
              <Label className="mb-1 block">User</Label>
              <SearchSelectDropdown
                options={userOptions}
                value={userIdInput}
                onValueChange={setUserIdInput}
                placeholder="Search and select a user"
              />
              <DialogDescription>
                {selectedClass
                  ? `For ${selectedClass.type} on ${format(
                      selectedClass.start,
                      "PPP p"
                    )}. ${
                      hasSpots
                        ? `${spotsLeft(selectedClass)} spots left.`
                        : "Class is full; you’ll be waitlisted."
                    }`
                  : "Pick a class first."}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setReserveOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateReservation}
                disabled={!selectedClass}
              >
                {hasSpots ? "Reserve spot" : "Join waitlist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Card className="h-auto flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="default"
                  className="w-[30px]"
                  size="icon"
                  aria-label="Previous day"
                  onClick={() =>
                    setSelectedDate(
                      new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate() - 1
                      )
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div>
                  <CardTitle className="text-2xl">
                    {format(selectedDate, "PPP")}
                  </CardTitle>
                  <CardDescription>Tap a class to see details</CardDescription>
                </div>

                <Button
                  variant="default"
                  size="icon"
                  aria-label="Next day"
                  className="w-[30px]"
                  onClick={() =>
                    setSelectedDate(
                      new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate() + 1
                      )
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search class name…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="max-w-[220px]"
                />

                {/* Use CalendarIcon for the button so the date picker (Calendar) isn't rendered inline */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[200px] justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>{format(selectedDate, "PPP")}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      className="rounded-md"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full">
              <ul className="divide-y">
                {classesForDay.length === 0 && (
                  <li className="p-6 text-sm text-muted-foreground">
                    No classes this day.
                  </li>
                )}
                {classesForDay.map((cls: any) => {
                  const left = spotsLeft(cls);
                  const active = selectedClass?.id === cls.id;
                  return (
                    <li key={cls.id}>
                      <button
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`w-full text-left p-4 hover:bg-accent/50 transition ${
                          active ? "bg-accent/60" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {format(cls.start, "p")} ·{" "}
                              <Badge className={typeClassName(cls.type)}>
                                <p className="text-md">{cls.type}</p>
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Coach {cls.coach} • {cls.durationMin} min
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={left > 0 ? "gray" : "green"}>
                              {left} spots left
                            </Badge>
                            <Badge variant="gray">
                              <Users className="h-3.5 w-3.5 mr-1" />{" "}
                              {cls.enrolledCount}/{cls.capacity}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Class Detail Panel */}
      <div>
        <Card className="h-auto flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Class details</CardTitle>
            <CardDescription>
              Review attendees, spots, and actions
            </CardDescription>
          </CardHeader>

          <Separator />

          {selectedClass ? (
            <CardContent className="flex-1 p-0">
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gray">
                    {format(selectedClass.start, "EEEE, PPP")}
                  </Badge>
                  <Badge variant="gray">
                    <Clock className="h-3.5 w-3.5 mr-1" />{" "}
                    {format(selectedClass.start, "p")} –{" "}
                    {format(
                      addMinutes(
                        selectedClass.start,
                        selectedClass.durationMin
                      ),
                      "p"
                    )}
                  </Badge>
                  <Badge variant="gray">Coach {selectedClass.coach}</Badge>
                  {selectedClass.location && (
                    <Badge variant="gray">{selectedClass.location}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-start gap-3">
                  <Badge className={typeClassName(selectedClass.type)}>
                    <p className="text-xl font-semibold">
                      {selectedClass.type}
                    </p>
                  </Badge>
                  <div>
                    <Badge variant="gray">
                      <p className="text-xl font-semibold">
                        {attendees?.length} / {selectedClass?.capacity}
                      </p>
                    </Badge>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center gap-2">
                  <Button
                    className="w-auto"
                    onClick={() => setReserveOpen(true)}
                    disabled={!selectedClass}
                  >
                    Create Reservation
                  </Button>
                </div>

                <Tabs defaultValue="attendees" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger
                      value="attendees"
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="truncate">Attendees</span>
                      <Badge variant="gray">{attendees.length}</Badge>
                    </TabsTrigger>

                    <TabsTrigger
                      value="waitlist"
                      className="flex items-center justify-center gap-2"
                      disabled={waitlist.length === 0}
                    >
                      <span className="truncate">Waitlist</span>
                      <Badge variant="gray">{waitlist.length}</Badge>
                    </TabsTrigger>

                    <TabsTrigger
                      value="cancellations"
                      className="flex items-center justify-center gap-2"
                      disabled={cancellations.length === 0}
                    >
                      <span className="truncate">Cancellations</span>
                      <Badge variant="gray">{cancellations.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attendees" className="mt-4">
                    {attendees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No attendees yet.
                      </p>
                    ) : (
                      <RosterList
                        users={attendees}
                        kind="attendee"
                        onAction={handleRosterAction}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="waitlist" className="mt-4">
                    {waitlist.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No one on the waitlist.
                      </p>
                    ) : (
                      <RosterList
                        users={waitlist}
                        kind="waitlist"
                        onAction={handleRosterAction}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="cancellations" className="mt-4">
                    {cancellations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No cancellations.
                      </p>
                    ) : (
                      <RosterList
                        users={cancellations}
                        kind="cancelled"
                        onAction={handleRosterAction}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Select a class from the left to see details.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

function RosterList({
  users,
  kind,
  onAction,
}: {
  users: { id: number | string; name: string }[];
  kind: "attendee" | "waitlist" | "cancelled";
  onAction?: (
    userId: number | string,
    action:
      | "checkin"
      | "cancel"
      | "move-to-waitlist"
      | "promote"
      | "remove-waitlist"
      | "reinstate-attendee"
      | "reinstate-waitlist"
      | "delete-record"
  ) => void;
}) {
  const statusText =
    kind === "attendee"
      ? "Confirmed"
      : kind === "waitlist"
      ? "Waitlisted"
      : "Cancelled";

  return (
    <div className="rounded-xl border">
      <ScrollArea className="h-auto">
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="p-3 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(u.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="text-sm font-medium leading-none">{u.name}</div>
                <div className="text-xs text-muted-foreground">
                  {statusText}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {kind === "attendee" && (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "cancel");
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Cancel reservation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "move-to-waitlist");
                        }}
                      >
                        <ArrowDown className="h-4 w-4 mr-2" /> Move to waitlist
                      </DropdownMenuItem>
                    </>
                  )}

                  {kind === "waitlist" && (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "promote");
                        }}
                      >
                        <ArrowUp className="h-4 w-4 mr-2" /> Promote to attendee
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "remove-waitlist");
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove from waitlist
                      </DropdownMenuItem>
                    </>
                  )}

                  {kind === "cancelled" && (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "reinstate-attendee");
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" /> Reinstate as
                        attendee
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "reinstate-waitlist");
                        }}
                      >
                        <ArrowDown className="h-4 w-4 mr-2" /> Reinstate to
                        waitlist
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onAction?.(u.id, "delete-record");
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete record
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

// On-demand date picker (popover)
export const DateQuickPicker = ({
  selectedDate,
  onChange,
}: {
  selectedDate: Date;
  onChange: (d: Date | undefined) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Change date
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  );
};

export default ClientsView;
