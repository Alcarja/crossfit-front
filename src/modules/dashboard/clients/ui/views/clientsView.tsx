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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ellipsis,
  Users,
} from "lucide-react";

// ---------------------- MOCK DATA ----------------------

type User = { id: string; name: string };

type ClassItem = {
  id: string;
  name: string;
  coach: string;
  start: Date;
  durationMin: number;
  capacity: number;
  attendees: User[]; // confirmed
  waitlist: User[];
  location?: string;
};

const MOCK_USERS: User[] = [
  { id: "u1", name: "Alex" },
  { id: "u2", name: "Bea" },
  { id: "u3", name: "Carlos" },
  { id: "u4", name: "Daria" },
  { id: "u5", name: "Eli" },
  { id: "u6", name: "Fran" },
];

function makeClass(
  id: string,
  name: string,
  start: Date,
  capacity = 10,
  attendeesN = 4,
  waitN = 1
): ClassItem {
  const attendees = MOCK_USERS.slice(0, attendeesN);
  const waitlist = MOCK_USERS.slice(attendeesN, attendeesN + waitN);
  return {
    id,
    name,
    coach: "Jamie",
    start,
    durationMin: 60,
    capacity,
    attendees,
    waitlist,
    location: "Main Floor",
  };
}

function generateMockClasses(baseDay: Date): ClassItem[] {
  const base = new Date(baseDay);
  base.setHours(6, 0, 0, 0);
  return [
    makeClass("c1", "CrossFit WOD", addMinutes(base, 0), 12, 8, 2),
    makeClass("c2", "Olympic Lifting", addMinutes(base, 60 * 3), 10, 5, 0),
    makeClass("c3", "Mobility", addMinutes(base, 60 * 6), 14, 3, 0),
    makeClass("c4", "Open Gym", addMinutes(base, 60 * 9), 20, 12, 3),
  ];
}

// ---------------------- UI HELPERS ----------------------

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function spotsLeft(cls: ClassItem) {
  return Math.max(0, cls.capacity - cls.attendees.length);
}

// ---------------------- MAIN COMPONENT ----------------------

export const ClientsView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [query, setQuery] = useState("");

  const classesForDay = useMemo(() => {
    const all = generateMockClasses(selectedDate);
    return all
      .filter((c) => isSameDay(c.start, selectedDate))
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [selectedDate, query]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const selectedClass = useMemo(() => {
    return (
      classesForDay.find((c) => c.id === selectedClassId) ??
      classesForDay[0] ??
      null
    );
  }, [classesForDay, selectedClassId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 w-full min-h-screen">
      {/* LEFT: Main list; calendar appears only on demand */}
      <div className="space-y-4">
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
                  <CardTitle className="text-lg">
                    Classes on {format(selectedDate, "PPP")}
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
                      initialFocus
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
                {classesForDay.map((cls) => {
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
                              {format(cls.start, "p")} · {cls.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Coach {cls.coach} • {cls.durationMin} min
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={left > 0 ? "default" : "green"}>
                              {left} spots left
                            </Badge>
                            <Badge variant="default">
                              <Users className="h-3.5 w-3.5 mr-1" />{" "}
                              {cls.attendees.length}/{cls.capacity}
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
      <div className="space-y-4">
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
                  <Badge variant="default">
                    {format(selectedClass.start, "EEEE, PPP")}
                  </Badge>
                  <Badge>
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
                  <Badge variant="default">Coach {selectedClass.coach}</Badge>
                  {selectedClass.location && (
                    <Badge variant="default">{selectedClass.location}</Badge>
                  )}
                </div>

                <div className="text-2xl font-semibold">
                  {selectedClass.name}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatsTile label="Capacity" value={selectedClass.capacity} />
                  <StatsTile
                    label="Registered"
                    value={selectedClass.attendees.length}
                  />
                  <StatsTile
                    label="Available"
                    value={spotsLeft(selectedClass)}
                    highlight
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button className="w-auto">Create Reservation</Button>
                  <Button className="w-auto">Add to Waitlist</Button>
                </div>

                <Separator className="my-2" />

                <Tabs defaultValue="attendees">
                  <TabsList>
                    <TabsTrigger value="attendees">
                      Attendees ({selectedClass.attendees.length})
                    </TabsTrigger>
                    <TabsTrigger value="waitlist">
                      Waitlist ({selectedClass.waitlist.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attendees" className="mt-4">
                    <RosterList
                      users={selectedClass.attendees}
                      kind="attendee"
                    />
                  </TabsContent>

                  <TabsContent value="waitlist" className="mt-4">
                    {selectedClass.waitlist.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No one on the waitlist.
                      </p>
                    ) : (
                      <RosterList
                        users={selectedClass.waitlist}
                        kind="waitlist"
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

// ---- Small components ----
function StatsTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight ? "bg-primary/5" : ""}`}
    >
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function RosterList({
  users,
  kind,
}: {
  users: User[];
  kind: "attendee" | "waitlist";
}) {
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
                  {kind === "attendee" ? "Confirmed" : "Waitlisted"}
                </div>
              </div>

              {/* Popup actions for each reservation */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {kind === "attendee" ? (
                    <>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Check className="h-4 w-4 mr-2" /> Check-in
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Cancel reservation
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Move to waitlist
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Promote to attendee
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Remove from waitlist
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
