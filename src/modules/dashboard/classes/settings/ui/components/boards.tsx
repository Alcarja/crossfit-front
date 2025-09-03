/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { classPalette } from "./constants";
import { hh, minutesToTime, parseTimeToMinutes } from "./utils";
import {
  DraggableClass,
  PaletteItemStatic,
  BubbleOverlay,
} from "./draggableClass";
import { DayHeader, DroppableCell } from "./droppableCell";
import {
  QuickAddModal,
  SeriesModal,
  EditTemplateModal,
  EditWeekModal,
} from "./modals";
import type { TemplateRow, WeekInstance } from "./types";
import { useEffect, useState } from "react";
import {
  scheduleQueryOptions,
  useCreateSchedule,
  useGetWeek,
  useSaveWeek,
} from "@/app/queries/schedule";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/* --------- Structure Board (no dates) --------- */
export function StructureBoard({
  templateRows,
  setTemplateRows,
  startHour,
  endHour,
  setStartHour,
  setEndHour,
  createOneTemplate,
  saveEditTemplate,
}: {
  isSmall: boolean;
  templateRows: TemplateRow[];
  setTemplateRows: React.Dispatch<React.SetStateAction<TemplateRow[]>>;
  startHour: number;
  endHour: number;
  setStartHour: (v: number) => void;
  setEndHour: (v: number) => void;

  // ⬇️ minute-precision; no hour field
  createOneTemplate: (p: {
    day: number;
    startTime: string; // "HH:mm"
    duration: number; // minutes
    name: string;
    type: string;
    coach: string;
    zone: string;
    capacity: number;
  }) => void;

  seriesCreateStructure: (p: {
    type: string;
    name: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
  }) => void;
  openEditTemplate: (id: string) => void;
  saveEditTemplate: (r: TemplateRow) => void;
}) {
  const queryClient = useQueryClient();

  const [quickOpen, setQuickOpen] = useState(false);

  const [seriesOpen, setSeriesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing] = useState<TemplateRow | null>(null);

  const [quickSlot, setQuickSlot] = useState<{
    day: number;
    startTime: string;
  } | null>(null);

  const openQuickAdd = (day: number, startTime: string) => {
    setQuickSlot({ day, startTime });
    setQuickOpen(true);
  };

  const { data: scheduleData } = useQuery(scheduleQueryOptions());

  useEffect(() => {
    if (scheduleData?.templates) {
      setTemplateRows(
        scheduleData.templates.map((t: any) => ({
          id: String(t.id),
          name: t.name,
          type: t.type,
          dayOfWeek: t.dayOfWeek,
          startTime: minutesToTime(parseTimeToMinutes(t.startTime)),
          endTime: minutesToTime(parseTimeToMinutes(t.endTime)),
          capacity: t.capacity,
          coach: t.coachId ?? "",
          zone: t.zoneName ?? "",
        }))
      );
    }
  }, [scheduleData, setTemplateRows]);

  const createScheduleMutation = useCreateSchedule();

  const saveChanges = () => {
    // 1) normalize + sort by (day, start minutes)
    const rows = templateRows
      .slice()
      .sort((a, b) =>
        a.dayOfWeek === b.dayOfWeek
          ? parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
          : a.dayOfWeek - b.dayOfWeek
      )
      .map((r) => {
        // API expects 0..6 (Sun..Sat). UI is 1..7 (Mon..Sun) -> convert: 7 -> 0
        const apiDay = r.dayOfWeek % 7;

        // ensure HH:mm padding (in case any row got "H:m")
        const start = minutesToTime(parseTimeToMinutes(r.startTime));
        const end = minutesToTime(parseTimeToMinutes(r.endTime));

        return {
          name: r.name,
          type: r.type as
            | "WOD"
            | "Gymnastics"
            | "Weightlifting"
            | "Endurance"
            | "Foundations"
            | "Kids",
          dayOfWeek: apiDay, // <-- converted
          startTime: start, // "HH:mm"
          endTime: end, // "HH:mm"
          capacity: r.capacity,
          coachId: undefined, // map to real id if you have it
          zoneName: r.zone || undefined,
          isActive: true,
        };
      });

    // 2) send to API
    createScheduleMutation.mutate(
      {
        settings: {
          name: "Main",
          timezone: "Europe/Madrid",
          validFrom: new Date().toISOString().slice(0, 10),
          validTo: null,
        },
        templates: rows,
        replaceExisting: true,
      },
      {
        onSuccess: () => {
          toast.success("Cambios guardados correctamente!");
          queryClient.invalidateQueries({ queryKey: ["schedule"] });
        },
        onError: () => {
          toast.error("Ocurrió un error al guardar los cambios");
        },
      }
    );
  };

  function generateTimeSlots(start: number, end: number): string[] {
    const slots: string[] = [];
    for (let h = start; h < end; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = String(h).padStart(2, "0");
        const minute = String(m).padStart(2, "0");
        slots.push(`${hour}:${minute}`);
      }
    }
    return slots;
  }

  const timeSlots = generateTimeSlots(startHour, endHour); // e.g., 09:00 to 21:00

  const SLOT_PX = 20; // 15-minute slot = 20px
  const TRACK_GUTTER_RIGHT_PX = 35; // Space to the right for the time label (matches your UI)

  const [hover, setHover] = useState<{
    dayStr: string;
    topPx: number;
    label: string;
  } | null>(null);

  // constants
  const COL_GAP_PX = 3; // gap between columns inside a cluster
  const MAX_VISIBLE_COLS = 3; // collapse clusters beyond this (optional)
  const PIXELS_PER_MINUTE = SLOT_PX / 15; // if SLOT_PX = height of a 15-min slot

  // collapse state for “+N more”
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // util: build a key per cluster per day
  function clusterKey(dayStr: string, clusterId: number) {
    return `${dayStr}:${clusterId}`;
  }

  // transform your rows to the shape expected by layoutOverlaps
  function toRawDayEvents(rows: typeof templateRows, day: number) {
    return rows
      .filter((r) => r.dayOfWeek === day)
      .map((r) => ({
        cls: r,
        id: r.id,
        startMin: parseTimeToMinutes(r.startTime),
        endMin: parseTimeToMinutes(r.endTime),
      }))
      .map((ev) => {
        const windowStart = startHour * 60;
        const windowEnd = endHour * 60;
        const s = Math.max(windowStart, ev.startMin);
        const e = Math.min(windowEnd, ev.endMin);
        return e <= s ? null : { ...ev, startMin: s, endMin: e };
      })
      .filter(Boolean) as Array<{
      cls: any;
      id: string;
      startMin: number;
      endMin: number;
    }>;
  }

  // Event + layout types
  type Evt = { cls: any; startMin: number; endMin: number };
  type Pos = { col: number; cols: number; clusterId: number };
  type ClusterMeta = {
    id: number;
    startMin: number;
    endMin: number;
    cols: number;
  };

  function layoutOverlaps(evts: Evt[]): {
    positions: Map<Evt, Pos>;
    clusters: ClusterMeta[];
  } {
    const sorted = [...evts].sort(
      (a, b) => a.startMin - b.startMin || a.endMin - b.endMin
    );

    const clusterBuckets: Evt[][] = [];
    let cluster: Evt[] = [];
    let clusterEnd = -1;

    for (const e of sorted) {
      if (!cluster.length || e.startMin < clusterEnd) {
        cluster.push(e);
        clusterEnd = Math.max(clusterEnd, e.endMin);
      } else {
        clusterBuckets.push(cluster);
        cluster = [e];
        clusterEnd = e.endMin;
      }
    }
    if (cluster.length) clusterBuckets.push(cluster);

    const positions = new Map<Evt, Pos>();
    const metas: ClusterMeta[] = [];

    clusterBuckets.forEach((c, clusterId) => {
      const colEnds: number[] = [];
      const temp: { e: Evt; col: number }[] = [];

      for (const e of c) {
        let col = colEnds.findIndex((endMin) => e.startMin >= endMin);
        if (col === -1) {
          col = colEnds.length;
          colEnds.push(e.endMin);
        } else {
          colEnds[col] = e.endMin;
        }
        temp.push({ e, col });
      }

      const cols = colEnds.length;
      const startMin = c[0].startMin;
      const endMin = Math.max(...c.map((x) => x.endMin));
      metas.push({ id: clusterId, startMin, endMin, cols });

      for (const { e, col } of temp) positions.set(e, { col, cols, clusterId });
    });

    return { positions, clusters: metas };
  }

  function getTimeFromOffset(y: number): string {
    const minutesOffset = Math.floor(y / SLOT_PX) * 15; // snaps to 15 min
    const absoluteMinutes = startHour * 60 + minutesOffset;
    return minutesToTime(absoluteMinutes); // "HH:mm"
  }

  return (
    <>
      <TooltipProvider delayDuration={20}>
        <div className="grid gap-0">
          {/* LEFT */}
          <div className="flex flex-col bg-white">
            {/* Header */}
            <div className="border-b px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="hidden sm:inline text-xs text-gray-600 pt-2">
                      Desde
                    </label>
                    <Select
                      value={String(startHour)}
                      onValueChange={(v) => setStartHour(parseInt(v, 10))}
                    >
                      <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                        <SelectValue placeholder="Desde" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, h) => (
                          <SelectItem key={`s-${h}`} value={String(h)}>{`${hh(
                            h
                          )}:00`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="hidden sm:inline text-xs text-gray-600 pt-2">
                      Hasta
                    </label>
                    <Select
                      value={String(endHour)}
                      onValueChange={(v) => setEndHour(parseInt(v, 10))}
                    >
                      <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                        <SelectValue placeholder="Hasta" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 - startHour }).map((_, i) => {
                          const h = i + startHour + 1;
                          return (
                            <SelectItem key={`e-${h}`} value={String(h)}>{`${hh(
                              h
                            )}:00`}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* warning/note */}

                    <Button
                      className="w-auto"
                      onClick={() => setSeriesOpen(true)}
                    >
                      Programar series
                    </Button>
                    <Button variant="outline" onClick={saveChanges}>
                      Guardar Cambios
                    </Button>
                    <div className="text-xs text-amber-600 font-medium">
                      ⚠️ Recuerda pulsar &quot;Guardar cambios&quot;
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-auto px-3 pb-3">
              <div className="pt-3">
                {/* Header Row */}
                <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 min-w-[900px] lg:min-w-0">
                  <div /> {/* Empty top-left */}
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <div
                      key={`hdr-${d}`}
                      className="text-sm font-medium text-center text-gray-700"
                    >
                      {["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][d]}
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 mt-2 min-w-[900px] lg:min-w-0">
                  {/* Hour column */}
                  <div className="relative">
                    {timeSlots.map((time, i) => (
                      <div
                        key={`label-${time}`}
                        className="absolute left-0 right-0 text-[11px] text-gray-500 pr-1 text-right"
                        style={{
                          top: i * SLOT_PX,
                          height: SLOT_PX,
                        }}
                      >
                        {time.endsWith(":00") ? time : ""}
                      </div>
                    ))}
                    {/* Fill height */}
                    <div style={{ height: timeSlots.length * SLOT_PX }} />
                  </div>

                  {/* Day columns */}
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const dayStr = `day-${d}`;

                    // 1) build raw events for the day in minutes
                    const rawDayEvents = toRawDayEvents(templateRows, d);

                    // 2) compute lane positions & clusters
                    const { positions, clusters } =
                      layoutOverlaps(rawDayEvents);

                    // column height in px (minutes * px/min)
                    const columnHeightPx =
                      (endHour - startHour) * 60 * PIXELS_PER_MINUTE;

                    return (
                      <div
                        key={dayStr}
                        className="relative bg-white border rounded-md overflow-hidden"
                        style={{ height: columnHeightPx }}
                        onMouseLeave={() => setHover(null)}
                        onMouseMove={(e) => {
                          const bounds =
                            e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - bounds.top;
                          const index = Math.floor(y / SLOT_PX);
                          const time = timeSlots[index];
                          if (!time) return;
                          setHover({
                            dayStr,
                            topPx: index * SLOT_PX,
                            label: time,
                          });
                        }}
                        onClick={(e) => {
                          const bounds =
                            e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - bounds.top;
                          const startTimeStr = getTimeFromOffset(y); // e.g., "10:15"
                          openQuickAdd(d, startTimeStr);
                        }}
                      >
                        {/* Hour delimiter lines */}
                        {Array.from({ length: endHour - startHour + 1 }).map(
                          (_, i) => (
                            <div
                              key={`hline-${i}`}
                              className="absolute left-0 right-0 border-t border-gray-300/30"
                              style={{ top: i * 60 * PIXELS_PER_MINUTE }}
                            />
                          )
                        )}

                        {/* Events track (RIGHT gutter kept) */}
                        <div
                          className="absolute inset-y-0 z-10"
                          style={{ left: 0, right: TRACK_GUTTER_RIGHT_PX }}
                        >
                          {/* +N more aggregators for dense clusters (optional) */}
                          {clusters.map((c) => {
                            const key = clusterKey(dayStr, c.id);
                            const collapsed =
                              !expanded[key] && c.cols > MAX_VISIBLE_COLS;
                            if (!collapsed) return null;

                            const top =
                              (c.startMin - startHour * 60) * PIXELS_PER_MINUTE;
                            const overflow = c.cols - MAX_VISIBLE_COLS;

                            return (
                              <button
                                key={`more-${dayStr}-${c.id}`}
                                className="absolute right-1 z-20 text-[10px] px-1.5 py-0.5 rounded bg-white/90 border shadow hover:bg-white"
                                style={{ top: top + 4, height: 20 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpanded((s) => ({ ...s, [key]: true }));
                                }}
                                title="Mostrar todos los solapados"
                              >
                                +{overflow} más
                              </button>
                            );
                          })}

                          {/* Events (side-by-side in lanes) */}
                          {rawDayEvents.map((ev) => {
                            const pos = positions.get(ev)!;

                            const clusterK = clusterKey(dayStr, pos.clusterId);
                            const collapsed =
                              !expanded[clusterK] &&
                              pos.cols > MAX_VISIBLE_COLS;

                            const visibleCols = collapsed
                              ? MAX_VISIBLE_COLS
                              : pos.cols;
                            const colInView = collapsed
                              ? pos.col % MAX_VISIBLE_COLS
                              : pos.col;

                            const top =
                              (ev.startMin - startHour * 60) *
                              PIXELS_PER_MINUTE;
                            const height = Math.max(
                              SLOT_PX,
                              (ev.endMin - ev.startMin) * PIXELS_PER_MINUTE
                            );

                            const left = `calc(${
                              (colInView / visibleCols) * 100
                            }% + ${colInView * COL_GAP_PX}px)`;
                            const width = `calc(${100 / visibleCols}% - ${
                              (COL_GAP_PX * (visibleCols - 1)) / visibleCols
                            }px)`;

                            const color =
                              typeColors[ev.cls.type] ||
                              "bg-gray-200 text-gray-900";

                            return (
                              <Tooltip key={ev.cls.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`absolute rounded shadow-sm ring-1 ring-black/5 border-l-4 border-black/10 ${color} cursor-pointer overflow-hidden`}
                                    style={{ top, height, left, width }}
                                    onClick={() => {}}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={() => {}}
                                    title="" // prevent native title tooltip
                                  >
                                    {/* compact content in the chip */}
                                    <div className="px-2 py-1">
                                      <div className="font-semibold text-xs truncate">
                                        {ev.cls.name ?? ev.cls.type}
                                      </div>
                                      <div className="text-[10px] opacity-80 truncate">
                                        {ev.cls.startTime}–{ev.cls.endTime}
                                      </div>
                                      {ev.cls.coach && (
                                        <div className="text-[10px] opacity-80 truncate">
                                          {ev.cls.coach}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TooltipTrigger>

                                <TooltipContent
                                  side="right"
                                  align="start"
                                  sideOffset={6}
                                  className="px-2 py-1.5 text-xs max-w-[220px]"
                                >
                                  <div className="space-y-0.5">
                                    <div className="font-semibold">
                                      {ev.cls.name ?? ev.cls.type}
                                    </div>
                                    <div className="opacity-80">
                                      {ev.cls.startTime}–{ev.cls.endTime}
                                    </div>
                                    {ev.cls.coach && (
                                      <div className="opacity-80">
                                        <strong>Coach:</strong> {ev.cls.coach}
                                      </div>
                                    )}
                                    {typeof ev.cls.capacity === "number" && (
                                      <div className="opacity-80">
                                        <strong>Capacidad:</strong>{" "}
                                        {ev.cls.capacity}
                                        {typeof ev.cls.booked === "number"
                                          ? ` (${ev.cls.booked} inscritos)`
                                          : ""}
                                      </div>
                                    )}
                                    {ev.cls.zone && (
                                      <div className="opacity-80">
                                        <strong>Zona:</strong> {ev.cls.zone}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>

                        {/* Hover band + label (unchanged) */}
                        {hover?.dayStr === dayStr && (
                          <>
                            <div
                              className="pointer-events-none absolute left-0 right-0 z-20"
                              style={{
                                top: hover.topPx,
                                height: SLOT_PX,
                                borderRadius: 8,
                              }}
                            />
                            <div
                              className="pointer-events-none absolute z-30 flex items-center justify-center text-[10px] font-medium text-blue-900/80"
                              style={{
                                top: hover.topPx,
                                height: SLOT_PX,
                                right: 0,
                                width: TRACK_GUTTER_RIGHT_PX,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {hover.label}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT palette */}
          {/*   <div className="border-l bg-white flex flex-col">
            <div className="px-5 py-2 border-b bg-white">
              <div className="text-sm font-semibold">Clases disponibles</div>
              <div className="text-xs text-gray-500">
                {isSmall
                  ? "Toca para ver"
                  : "Arrastra con el asa ▮▮ al calendario"}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <div className="flex flex-col space-y-2">
                {classPalette.map((c) =>
                  isSmall ? (
                    <PaletteItemStatic key={c.id} cls={c} />
                  ) : (
                    <DraggableClass
                      key={c.id}
                      cls={c}
                      isPalette
                      disabled={false}
                    />
                  )
                )}
              </div>
            </div>
          </div> */}
        </div>

        <QuickAddModal
          open={quickOpen}
          onOpenChange={setQuickOpen}
          slot={quickSlot}
          onCreateOne={(p) => {
            if ("day" in p) createOneTemplate(p);
          }}
        />

        <SeriesModal
          open={seriesOpen}
          onOpenChange={setSeriesOpen}
          context="structure"
          onCreate={(p) => {
            if ("day" in p) createOneTemplate(p); // SAME path as QuickAdd
          }}
        />
        <EditTemplateModal
          open={editOpen}
          onOpenChange={setEditOpen}
          row={editing}
          onSave={saveEditTemplate}
        />
      </TooltipProvider>
    </>
  );
}

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

import { useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { typeColors } from "@/components/types/types";
/* --------- Week Board (dated) --------- */
export function WeekBoard({
  isSmall,
  hours,
  days,
  weekLabel,
  startHour,
  endHour,
  setStartHour,
  setEndHour,
  weekInstances,
  setWeeksByKey,
  wkKey,
  generateWeekFromStructure,
  seriesCreateWeek,
  createOneWeekInstance,
  saveEditWeek,
  selectedDate,
  setSelectedDate,
  isoFn = iso,
}: {
  isSmall: boolean;
  hours: number[];
  days: Date[];
  weekLabel: string;
  startHour: number;
  endHour: number;
  setStartHour: (v: number) => void;
  setEndHour: (v: number) => void;
  weekInstances: WeekInstance[];
  setWeeksByKey: React.Dispatch<
    React.SetStateAction<Record<string, WeekInstance[]>>
  >;
  wkKey: string;
  generateWeekFromStructure: () => void;
  seriesCreateWeek: (p: {
    type: string;
    name: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
  }) => void;
  createOneWeekInstance: (p: {
    dateISO: string;
    hour: number;
    name: string;
    type: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
  }) => void;
  openEditWeek: (id: string) => void;
  saveEditWeek: (r: WeekInstance) => void;
  selectedDate: Date;
  setSelectedDate: (fn: (d: Date) => Date) => void;
  isoFn?: (d: Date) => string;
}) {
  const initialIdsRef = useRef<Record<string, string[]>>({});

  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSlot, setQuickSlot] = useState<{
    dateISO: string;
    hour: number;
  } | null>(null);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<WeekInstance | null>(null);

  const openQuickAdd = (dateISO: string, hour: number) => {
    setQuickSlot({ dateISO, hour });
    setQuickOpen(true);
  };

  const handleDragStart = (e: DragStartEvent) =>
    setActiveItem(e.active.data.current || null);
  const handleDragCancel = () => setActiveItem(null);

  const handleDragEnd = (e: DragEndEvent) => {
    const { over, active } = e;
    setActiveItem(null);
    if (!over) return;
    const [dateISO, hourStr] = String(over.id).split("_");
    const hour = parseInt(hourStr, 10);
    const data = active.data.current as any;
    const fromPalette = !data.instanceId && !!data.id && !data.weekInstanceId;

    if (fromPalette) {
      const tpl = classPalette.find((t) => t.id === data.id);
      if (!tpl) return;
      createOneWeekInstance({
        dateISO,
        hour,
        name: tpl.name,
        type: tpl.type,
        coach: tpl.coach || "",
        zone: tpl.zone || "",
        duration: tpl.duration || 60,
        capacity: tpl.capacity || 16,
      });
    } else if (data.weekInstanceId) {
      const instId = data.weekInstanceId as string;
      setWeeksByKey((prev) => ({
        ...prev,
        [wkKey]: (prev[wkKey] ?? []).map((it) =>
          it.id === instId
            ? { ...it, date: dateISO, startTime: `${hh(hour)}:00` }
            : it
        ),
      }));
    }
  };

  //const mondayISO = selectedDate.toISOString().slice(0, 10);
  const mondayISO = isoFn(selectedDate);

  // ---- Load week if it exists ----
  const { data: weekResp } = useGetWeek(mondayISO);

  useEffect(() => {
    console.log("Week resp", weekResp);
  }, [weekResp]);

  useEffect(() => {
    const payload =
      (weekResp as any)?.instances ?? (weekResp as any)?.data?.instances;
    if (!payload) return;

    // baseline ids per date (only persisted rows have id)
    initialIdsRef.current = payload.reduce(
      (acc: Record<string, string[]>, c: any) => {
        const d = c.date; // "YYYY-MM-DD"
        (acc[d] ||= []).push(String(c.id));
        return acc;
      },
      {}
    );

    // your existing mapping:
    const mapped: WeekInstance[] = payload.map((c: any) => ({
      id: String(c.id), // keep server id
      date: c.date,
      startTime: c.startTime,
      endTime: c.endTime,
      name: c.name,
      type: c.type,
      zone: c.zoneName ?? "",
      coach: c.coachId ?? "",
      capacity: c.capacity ?? 0,
      enrolled: c.enrolled ?? 0,
    }));

    console.log("Mapped", mapped);

    setWeeksByKey((prev) => ({ ...prev, [wkKey]: mapped }));
  }, [weekResp, setWeeksByKey, wkKey]);

  // ---- Mutations ----
  const saveWeekMutation = useSaveWeek();
  const queryClient = useQueryClient();

  const addMinutes = (hhmm: string, mins: number) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(0, 0, 1, h, m + mins, 0);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const isoLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const isServerId = (id: string) => !!id && !id.startsWith("inst-");

  const handleSaveWeek = () => {
    const mondayISO = isoFn(selectedDate); // Monday of selected week (YYYY-MM-DD)
    const weekDates = days.map((d) => isoFn(d)); // all 7 dates in the grid
    const todayISO = isoLocal(new Date());

    // Keep this: backend's fallback diff (if used) only deletes today+
    const affectedDates = weekDates.filter((d) => d >= todayISO);

    const toHHMMSS = (s: string) => (s.length === 5 ? `${s}:00` : s);

    // Include DB id as string when present; omit for new (inst-xxx) rows
    const classes = weekInstances
      .filter((it) => weekDates.includes(it.date))
      .map((it) => ({
        id: isServerId(it.id) ? it.id : undefined,
        dateISO: it.date,
        startTime: toHHMMSS(it.startTime),
        endTime: toHHMMSS(
          it.endTime ?? addMinutes(it.startTime, (it as any).duration ?? 60)
        ),
        name: it.name,
        type: it.type,
        zoneName: it.zone ?? null,
        coachId: typeof it.coach === "number" ? it.coach : null,
        capacity: it.capacity,
      }));

    // Build current ids per date (ONLY server rows with real ids)
    const currentIdsByDate = weekInstances.reduce(
      (acc: Record<string, Set<string>>, it) => {
        if (!weekDates.includes(it.date)) return acc;
        if (isServerId(it.id)) {
          (acc[it.date] ||= new Set()).add(it.id); // keep as string
        }
        return acc;
      },
      {}
    );

    // ✅ EXPLICIT deletions must consider ALL week days (past + today + future)
    const deletionDates = weekDates;

    // deletedIds = baseline ids - current ids, over ALL week dates
    const deletedIds: string[] = [];
    for (const date of deletionDates) {
      const before = new Set(initialIdsRef.current[date] ?? []); // baseline strings
      const now = currentIdsByDate[date] ?? new Set<string>();
      for (const id of before) {
        if (!now.has(id)) deletedIds.push(id);
      }
    }

    saveWeekMutation.mutate(
      { startDate: mondayISO, affectedDates, classes, deletedIds },
      {
        onSuccess: () => {
          toast.success("Semana guardada!");
          queryClient.invalidateQueries({ queryKey: ["week", mondayISO] });

          // refresh baseline after success to the new current set
          initialIdsRef.current = Object.fromEntries(
            weekDates.map((d) => [
              d,
              Array.from(currentIdsByDate[d] ?? new Set()),
            ])
          );
        },
        onError: (e: any) => {
          if (e?.status === 409 || e?.code === "DUPLICATE_CLASS_SAME_HOUR") {
            toast.error(
              "No puedes registrar la misma clase dos veces en la misma hora"
            );
            return;
          }
          toast.error(
            e?.data?.error ?? e?.message ?? "Error al guardar la semana"
          );
        },
      }
    );
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
        {/* LEFT */}
        <div className="flex flex-col bg-white">
          <div className="border-b px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSelectedDate(
                      (d) =>
                        new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm md:text-md text-muted-foreground font-medium min-w-[200px] text-center">
                  {weekLabel}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSelectedDate(
                      (d) =>
                        new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="hidden sm:inline text-xs text-gray-600 pt-2">
                    Desde
                  </label>
                  <Select
                    value={String(startHour)}
                    onValueChange={(v) => setStartHour(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                      <SelectValue placeholder="Desde" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, h) => (
                        <SelectItem key={`ws-${h}`} value={String(h)}>{`${hh(
                          h
                        )}:00`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="hidden sm:inline text-xs text-gray-600 pt-2">
                    Hasta
                  </label>
                  <Select
                    value={String(endHour)}
                    onValueChange={(v) => setEndHour(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                      <SelectValue placeholder="Hasta" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 - startHour }).map((_, i) => {
                        const h = i + startHour + 1;
                        return (
                          <SelectItem key={`we-${h}`} value={String(h)}>{`${hh(
                            h
                          )}:00`}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-auto" onClick={generateWeekFromStructure}>
                  Generar semana desde estructura
                </Button>
                <Button variant="outline" onClick={() => setSeriesOpen(true)}>
                  Programar series
                </Button>

                <Button
                  className="w-auto"
                  variant="default"
                  onClick={handleSaveWeek}
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          </div>

          {/* grid */}
          <div className="flex-1 overflow-auto px-3 pb-3">
            <div className="pt-3">
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 min-w-[900px] lg:min-w-0">
                <div />
                {days.map((d) => (
                  <DayHeader
                    key={d.toISOString()}
                    label={`${format(d, "EEE", { locale: es })} ${format(
                      d,
                      "d",
                      { locale: es }
                    )}`}
                    isTodayFlag={isToday(d)}
                  />
                ))}
              </div>
            </div>

            {hours.map((h) => (
              <div
                key={`wrow-${h}`}
                className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 mb-2 min-w-[900px] lg:min-w-0"
              >
                <div className="border rounded-md bg-white flex items-start justify-center pt-2 text-[11px] text-gray-500">{`${hh(
                  h
                )}:00`}</div>
                {days.map((day) => {
                  const dayISO = isoFn(day);
                  const cellId = `${dayISO}_${h}`;
                  const here = weekInstances.filter(
                    (r) => r.date === dayISO && parseHour(r.startTime) === h
                  );
                  return (
                    <DroppableCell
                      key={cellId}
                      id={cellId}
                      isTodayCol={isToday(day)}
                      onEmptyClick={() => openQuickAdd(dayISO, h)}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        {here.map((r) => (
                          <DraggableClass
                            key={r.id}
                            cls={{
                              weekInstanceId: r.id,
                              id: r.id,
                              name: r.name,
                              type: r.type,
                              capacity: r.capacity,
                              enrolled: r.enrolled,
                            }}
                            fullWidth
                            onOpenEdit={() => {
                              setEditing(r);
                              setEditOpen(true);
                            }}
                            onDelete={() =>
                              setWeeksByKey((prev) => ({
                                ...prev,
                                [wkKey]: (prev[wkKey] ?? []).filter(
                                  (x) => x.id !== r.id
                                ),
                              }))
                            }
                          />
                        ))}
                      </div>
                    </DroppableCell>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT palette */}
        <div className="border-l bg-white flex flex-col">
          <div className="px-5 py-2 border-b bg-white">
            <div className="text-sm font-semibold">Clases disponibles</div>
            <div className="text-xs text-gray-500">
              {isSmall
                ? "Toca para ver"
                : "Arrastra con el asa ▮▮ al calendario"}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="flex flex-col space-y-2">
              {classPalette.map((c) =>
                isSmall ? (
                  <PaletteItemStatic key={c.id} cls={c} />
                ) : (
                  <DraggableClass
                    key={c.id}
                    cls={c}
                    isPalette
                    disabled={false}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay
        adjustScale={false}
        dropAnimation={null}
        // ensure the overlay never blocks clicks; keep zIndex < Select (z-50) or remove it
        style={{ pointerEvents: "none", zIndex: 40 }}
      >
        <BubbleOverlay cls={activeItem} />
      </DragOverlay>

      <QuickAddModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        slot={quickSlot} // now has { day, startTime }
        onCreateOne={(p) => {
          if ("dateISO" in p) {
            createOneWeekInstance(p); // existing week path
          } else if ("day" in p) {
            createOneTemplate(p); // NEW: template path
          }
        }}
      />

      <SeriesModal
        open={seriesOpen}
        onOpenChange={setSeriesOpen}
        context="week"
        onCreate={seriesCreateWeek}
      />
      <EditWeekModal
        open={editOpen}
        onOpenChange={setEditOpen}
        inst={editing}
        onSave={saveEditWeek}
      />
    </DndContext>
  );
}
