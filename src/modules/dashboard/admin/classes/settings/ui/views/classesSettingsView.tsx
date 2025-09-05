/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import useMediaQuery from "../components/useMediaQuery";
import { DEFAULT_END, DEFAULT_START } from "../components/constants";
import {
  hh,
  iso,
  minutesToTime,
  parseTimeToMinutes,
  weekKeyFromDate,
} from "../components/utils";
import { TemplateRow, WeekInstance } from "../components/types";
import { StructureBoard, WeekBoard } from "../components/boards";
import { CircleSlash2Icon } from "lucide-react";

type CreateWeekInstanceArgs = {
  dateISO: string;
  startTime: string; // "HH:mm"
  duration: number; // minutes
  name: string;
  type: string;
  coach: string;
  zone: string;
  capacity: number;
};

export default function ClassesSettingsView() {
  const isSmall = useMediaQuery("(max-width: 1024px)");
  const [startHour, setStartHour] = useState<number>(DEFAULT_START);
  const [endHour, setEndHour] = useState<number>(DEFAULT_END);

  /* ===== Structure state ===== */
  const [templateRows, setTemplateRows] = useState<TemplateRow[]>([]);

  //Create a single class for the schedule tab --> This one is working perfectly
  const createOneTemplate = (p: {
    day: number;
    startTime: string; // <-- accept "HH:mm"
    duration: number; // minutes
    name: string;
    type: string;
    coach: string;
    zone: string;
    capacity: number;
  }) => {
    const startMin = parseTimeToMinutes(p.startTime);
    const endMin = startMin + p.duration;

    const row: TemplateRow = {
      id: `tpl-${uuidv4()}`,
      name: p.name,
      type: p.type,
      dayOfWeek: p.day,
      startTime: minutesToTime(startMin), // keeps minutes
      endTime: minutesToTime(endMin), // start + duration
      capacity: p.capacity,
      coach: p.coach || undefined,
      zone: p.zone || undefined,
    };

    setTemplateRows((prev) => [...prev, row]);
  };

  //Saves changes to an existing class
  const saveEditTemplate = (updated: TemplateRow) => {
    setTemplateRows((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  //Create multiple classes at once
  const seriesCreateStructure = (payload: {
    type: string;
    name: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
  }) => {
    const rows: TemplateRow[] = [];
    payload.daysOfWeek.forEach((dow) => {
      for (let h = payload.startHour; h < payload.endHour; h++) {
        rows.push({
          id: `tpl-${uuidv4()}`,
          name: payload.name,
          type: payload.type,
          dayOfWeek: dow,
          startTime: `${hh(h)}:00`,
          endTime: `${hh(
            h + Math.max(1, Math.ceil(payload.duration / 60))
          )}:00`,
          capacity: payload.capacity,
          coach: payload.coach || undefined,
          zone: payload.zone || undefined,
        });
      }
    });
    setTemplateRows((prev) => [...prev, ...rows]); //Adds all the classes to the state at once
  };

  /* ===== Week (dated) state ===== */
  const [selectedDate, setSelectedDate] = useState(new Date()); //Save the current date
  const weekStart = useMemo(
    //Get the start of the week
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );

  //Calculate the days of the current week
  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  //Create a label for current week
  const weekLabel = `${format(weekStart, "d 'de' MMM", {
    locale: es,
  })} – ${format(addDays(weekStart, 6), "d 'de' MMM yyyy", { locale: es })}`;

  const [weeksByKey, setWeeksByKey] = useState<Record<string, WeekInstance[]>>(
    {}
  );
  const wkKey = weekKeyFromDate(selectedDate);
  const weekInstances = weeksByKey[wkKey] ?? [];

  //Create a single class for the calendar tab
  const createOneWeekInstance = (p: CreateWeekInstanceArgs) => {
    const startMin = parseTimeToMinutes(p.startTime);
    const endTime = minutesToTime(startMin + p.duration);

    const inst: WeekInstance = {
      id: `inst-${uuidv4()}`,
      date: p.dateISO,
      name: p.name,
      type: p.type,
      startTime: p.startTime,
      endTime,
      capacity: p.capacity,
      enrolled: 0,
      coach: p.coach || undefined,
      zone: p.zone || undefined,
    };

    setWeeksByKey((prev) => ({
      ...prev,
      [wkKey]: [...(prev[wkKey] ?? []), inst],
    }));
  };

  const saveEditWeek = (updated: WeekInstance) => {
    setWeeksByKey((prev) => ({
      ...prev,
      [wkKey]: (prev[wkKey] ?? []).map((x) =>
        x.id === updated.id ? updated : x
      ),
    }));
  };

  const isoLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  //Copies the classes from the schedule and adds them to the calendar
  const generateWeekFromStructure = () => {
    const todayISO = isoLocal(new Date());

    const clones: WeekInstance[] = templateRows
      .map((t) => {
        // Your TemplateRow.dayOfWeek is 1..7 (Mon..Sun)
        const dateISO = isoLocal(addDays(weekStart, (t.dayOfWeek ?? 1) - 1));
        return { t, dateISO };
      })
      .filter(({ dateISO }) => dateISO > todayISO) // strictly FUTURE (exclude today)
      .map(({ t, dateISO }) => ({
        id: `inst-${uuidv4()}`,
        date: dateISO,
        name: t.name,
        type: t.type,
        startTime: t.startTime,
        endTime: t.endTime,
        capacity: t.capacity,
        enrolled: 0,
        coach: t.coach,
        zone: t.zone,
      }));

    // Merge into current week; skip duplicates by (date|startTime|type)
    setWeeksByKey((prev) => {
      const existing = prev[wkKey] ?? [];
      const keyOf = (x: WeekInstance) => `${x.date}|${x.startTime}|${x.type}`;
      const existingKeys = new Set(existing.map(keyOf));
      return {
        ...prev,
        [wkKey]: [
          ...existing,
          ...clones.filter((c) => !existingKeys.has(keyOf(c))),
        ],
      };
    });
  };

  return (
    <div className="w-full mx-auto max-w-[2400px] md:p-6 p-3">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-background p-2 shadow-sm">
            <CircleSlash2Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Gestión de Classes
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra la estructura y planificación de las clases
            </p>
          </div>
        </div>
      </div>
      <Tabs defaultValue="defaultSchedule" className="w-auto">
        <TabsList className="w-full flex gap-2 mb-6">
          <TabsTrigger value="defaultSchedule" className="flex-1">
            Estructura de las clases
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1">
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="defaultSchedule" className="w-full">
          <StructureBoard
            isSmall={isSmall}
            templateRows={templateRows}
            setTemplateRows={setTemplateRows}
            startHour={startHour}
            endHour={endHour}
            setStartHour={setStartHour}
            setEndHour={setEndHour}
            createOneTemplate={createOneTemplate}
            seriesCreateStructure={seriesCreateStructure}
            openEditTemplate={() => {}}
            saveEditTemplate={saveEditTemplate}
          />
        </TabsContent>

        <TabsContent value="schedule" className="w-full">
          <WeekBoard
            isSmall={isSmall}
            days={days}
            weekLabel={weekLabel}
            startHour={startHour}
            endHour={endHour}
            setStartHour={setStartHour}
            setEndHour={setEndHour}
            weekInstances={weekInstances}
            setWeeksByKey={setWeeksByKey}
            wkKey={wkKey}
            generateWeekFromStructure={generateWeekFromStructure}
            seriesCreateWeek={(p) => {
              // p: { day, startTime, duration, name, type, coach, zone, capacity }
              const date = iso(addDays(weekStart, p.day - 1));
              const startMin = parseTimeToMinutes(p.startTime);
              const endTime = minutesToTime(startMin + p.duration);

              const inst: WeekInstance = {
                id: `inst-${uuidv4()}`,
                date,
                name: p.name,
                type: p.type,
                startTime: p.startTime,
                endTime,
                capacity: p.capacity,
                enrolled: 0,
                coach: p.coach || "",
                zone: p.zone || "",
              };

              setWeeksByKey((prev) => ({
                ...prev,
                [wkKey]: [...(prev[wkKey] ?? []), inst],
              }));
            }}
            createOneWeekInstance={createOneWeekInstance}
            saveEditWeek={saveEditWeek}
            selectedDate={selectedDate}
            setSelectedDate={(fn: any) => setSelectedDate((d) => fn(d))}
            isoFn={iso}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
