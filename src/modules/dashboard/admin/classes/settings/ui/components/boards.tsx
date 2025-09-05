/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { apiDayToUi, hh, minutesToTime, parseTimeToMinutes } from "./utils";

import {
  QuickAddModal,
  SeriesModal,
  EditTemplateModal,
  EditWeekModal,
} from "./modals";
import type { TemplateRow, WeekInstance } from "./types";
import { useEffect, useMemo, useState } from "react";
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
  const [editing, setEditing] = useState<TemplateRow | null>(null);

  const [quickSlot, setQuickSlot] = useState<{
    day: number;
    startTime: string;
  } | null>(null);

  const openQuickAdd = (day: number, startTime: string) => {
    setQuickSlot({ day, startTime });
    setQuickOpen(true);
  };

  function openEdit(row: TemplateRow) {
    setEditing(row);
    setEditOpen(true);
  }

  const { data: scheduleData } = useQuery(scheduleQueryOptions());

  useEffect(() => {
    if (scheduleData?.templates) {
      setTemplateRows(
        scheduleData.templates.map((t: any) => ({
          id: String(t.id),
          name: t.name,
          type: t.type,
          dayOfWeek: apiDayToUi(Number(t.dayOfWeek)), // <-- convert 0->7
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
          <div className="flex flex-col bg-white w-full overflow-auto border border-blue-500">
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

                  <div className="flex items-center gap-2 flex-wrap py-2 md:py-0">
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
                                    onClick={(e) => {
                                      e.stopPropagation(); // prevent opening QuickAdd
                                      openEdit(ev.cls as TemplateRow);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={() => {}}
                                    title=""
                                  >
                                    {/* trash always visible */}
                                    <button
                                      className="absolute top-0.5 right-0.5 z-20 p-1 rounded hover:bg-black/10 focus:outline-none"
                                      aria-label="Eliminar clase"
                                      onClick={(e) => {
                                        e.stopPropagation(); // don't open edit
                                        setTemplateRows((prev) =>
                                          prev.filter((r) => r.id !== ev.cls.id)
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 opacity-70" />
                                    </button>

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
                                    <div className="text-[10px] opacity-80 truncate pl-2">
                                      <span className="font-bold">
                                        0 / {ev.cls.capacity}
                                      </span>
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

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { typeColors } from "@/components/types/types";

export function isoFn(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Start-of-week (Monday) for a date, in local time. */
export function startOfWeekMonday(d: Date): Date {
  const out = new Date(d);
  const dow = out.getDay(); // 0=Sun..6=Sat
  const diff = (dow === 0 ? -6 : 1) - dow; // move to Monday
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Local YYYY-MM-DD for the Monday of the week containing `d`. */
export function isoMonday(d: Date): string {
  return isoFn(startOfWeekMonday(d));
}
/* --------- Week Board (dated) --------- */
export function WeekBoard({
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
  createOneWeekInstance, // ⬅️ minute-precision
  saveEditWeek,
  selectedDate,
  setSelectedDate,
}: {
  isSmall: boolean;
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
    day: number; // 1..7 (Mon..Sun) if you reuse SeriesModal with days
    startTime: string; // "HH:mm"
    duration: number; // minutes
    name: string;
    type: string;
    coach: string;
    zone: string;
    capacity: number;
  }) => void;
  createOneWeekInstance: (p: {
    dateISO: string;
    startTime: string; // "HH:mm"
    endTime?: string; // optional; you can compute from duration
    name: string;
    type: string;
    coach: string;
    zone: string;
    duration: number; // minutes
    capacity: number;
  }) => void;
  saveEditWeek: (r: WeekInstance) => void;
  selectedDate: Date;
  setSelectedDate: (fn: (d: Date) => Date) => void;
  isoFn?: (d: Date) => string;
}) {
  // ---------- fetch existing week ----------
  const mondayISO = isoFn(selectedDate);
  const { data: weekResp } = useGetWeek(mondayISO);

  useEffect(() => {
    const payload =
      (weekResp as any)?.instances ?? (weekResp as any)?.data?.instances;
    if (!payload) return;

    const mapped: WeekInstance[] = payload.map((c: any) => ({
      id: String(c.id),
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

    setWeeksByKey((prev) => ({ ...prev, [wkKey]: mapped }));
  }, [weekResp, setWeeksByKey, wkKey]);

  // ---------- save week ----------
  const saveWeekMutation = useSaveWeek();
  function addMinutes(hhmm: string, mins: number) {
    const base = parseTimeToMinutes(hhmm);
    return minutesToTime(base + mins);
  }
  function handleSaveWeek() {
    const weekDates = days.map((d) => isoFn(d));
    const toHHMMSS = (s: string) => (s.length === 5 ? `${s}:00` : s);

    const classes = weekInstances
      .filter((it) => weekDates.includes(it.date))
      .map((it) => ({
        id: it.id && !it.id.startsWith("inst-") ? it.id : undefined,
        dateISO: it.date,
        startTime: toHHMMSS(it.startTime),
        endTime: toHHMMSS(it.endTime ?? addMinutes(it.startTime, 60)),
        name: it.name,
        type: it.type,
        zoneName: it.zone ?? null,
        coachId: typeof it.coach === "number" ? it.coach : null,
        capacity: it.capacity,
      }));

    saveWeekMutation.mutate(
      {
        startDate: mondayISO,
        affectedDates: weekDates,
        classes,
        deletedIds: [],
      },
      {
        onSuccess: () => toast.success("Semana guardada!"),
        onError: (e: any) =>
          toast.error(
            e?.data?.error ?? e?.message ?? "Error al guardar la semana"
          ),
      }
    );
  }

  // ---------- minute grid (same as StructureBoard) ----------
  const SLOT_PX = 20; // 15-min slot = 20px
  const PIXELS_PER_MINUTE = SLOT_PX / 15;
  const TRACK_GUTTER_RIGHT_PX = 35;
  const COL_GAP_PX = 3;
  const MAX_VISIBLE_COLS = 3;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
        );
      }
    }
    return slots;
  }, [startHour, endHour]);

  const [hover, setHover] = useState<{
    dayStr: string;
    topPx: number;
    label: string;
  } | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function getTimeFromOffset(y: number): string {
    const minutesOffset = Math.floor(y / SLOT_PX) * 15;
    const absoluteMinutes = startHour * 60 + minutesOffset;
    return minutesToTime(absoluteMinutes);
  }

  function clusterKey(dayStr: string, clusterId: number) {
    return `${dayStr}:${clusterId}`;
  }

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

  function toRawDayEvents(instances: WeekInstance[], dateISO: string) {
    return instances
      .filter((r) => r.date === dateISO)
      .map((r) => {
        const s = parseTimeToMinutes(r.startTime);
        const e = parseTimeToMinutes(r.endTime);
        return { cls: r, id: r.id, startMin: s, endMin: e };
      })
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

  // ---------- quick add & edit ----------
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSlot, setQuickSlot] = useState<{
    dateISO: string;
    startTime: string;
  } | null>(null);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<WeekInstance | null>(null);

  function openQuickAdd(dateISO: string, startTime: string) {
    setQuickSlot({ dateISO, startTime });
    setQuickOpen(true);
  }

  function openEdit(row: WeekInstance) {
    setEditing(row);
    setEditOpen(true);
  }

  const columnHeightPx = (endHour - startHour) * 60 * PIXELS_PER_MINUTE;

  return (
    <TooltipProvider delayDuration={20}>
      <div className="grid w-full">
        {/* LEFT */}
        <div className="flex flex-col overflow-auto bg-white">
          {/* Header */}
          <div className="border-b px-2 py-2 w-full md:w-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 w-full md:w-auto">
              {/* Date */}
              <div className="flex items-center justify-between gap-2 w-full md:w-auto">
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

              {/* Hours */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <label className="hidden sm:inline text-xs text-gray-600 pt-2">
                    Desde
                  </label>
                  <Select
                    value={String(startHour)}
                    onValueChange={(v) => setStartHour(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-8 sm:h-9 md:w-[100px] flex-1">
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

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <label className="hidden sm:inline text-xs text-gray-600 pt-2">
                    Hasta
                  </label>
                  <Select
                    value={String(endHour)}
                    onValueChange={(v) => setEndHour(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-8 sm:h-9 md:w-[100px] flex-1">
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

                <Button
                  className="md:w-auto w-full"
                  onClick={generateWeekFromStructure}
                >
                  Generar semana desde estructura
                </Button>
                <Button
                  className="md:w-auto w-[48%]"
                  variant="outline"
                  onClick={() => setSeriesOpen(true)}
                >
                  Programar series
                </Button>
                <Button
                  className="md:w-auto w-[49%]"
                  variant="default"
                  onClick={handleSaveWeek}
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          </div>

          {/* Minute grid like StructureBoard */}
          <div className="flex-1 overflow-auto px-3 pb-3">
            <div className="pt-3">
              {/* Header Row */}
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 min-w-[1600px] lg:min-w-0">
                <div />
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    className="text-sm font-medium text-center text-gray-700"
                  >
                    {format(d, "EEE d", { locale: es })}
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 mt-2 min-w-[1600px] lg:min-w-0">
                {/* Hour labels */}
                <div className="relative">
                  {timeSlots.map((time, i) => (
                    <div
                      key={`label-${time}`}
                      className="absolute left-0 right-0 text-[11px] text-gray-500 text-left"
                      style={{ top: i * SLOT_PX, height: SLOT_PX }}
                    >
                      {time.endsWith(":00") ? time : ""}
                    </div>
                  ))}
                  <div style={{ height: timeSlots.length * SLOT_PX }} />
                </div>

                {/* Day columns */}
                {days.map((day) => {
                  const dayISO = isoFn(day);
                  const dayStr = `day-${dayISO}`;
                  const rawDayEvents = toRawDayEvents(weekInstances, dayISO);
                  const { positions, clusters } = layoutOverlaps(rawDayEvents);

                  return (
                    <div
                      key={dayISO}
                      className={`relative bg-white border rounded-md overflow-hidden ${
                        isToday(day) ? "ring-1 ring-blue-300" : ""
                      }`}
                      style={{ height: columnHeightPx }}
                      onMouseLeave={() => setHover(null)}
                      onMouseMove={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
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
                        const bounds = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - bounds.top;
                        const startTimeStr = getTimeFromOffset(y);
                        openQuickAdd(dayISO, startTimeStr);
                      }}
                    >
                      {/* Hour lines */}
                      {Array.from({ length: endHour - startHour + 1 }).map(
                        (_, i) => (
                          <div
                            key={`hline-${i}`}
                            className="absolute left-0 right-0 border-t border-gray-300/30"
                            style={{ top: i * 60 * PIXELS_PER_MINUTE }}
                          />
                        )
                      )}

                      {/* Track for events */}
                      <div
                        className="absolute inset-y-0 z-10"
                        style={{ left: 0, right: TRACK_GUTTER_RIGHT_PX }}
                      >
                        {/* +N more */}
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

                        {/* Events */}
                        {rawDayEvents.map((ev) => {
                          const pos = positions.get(ev)!;

                          const clusterK = clusterKey(dayStr, pos.clusterId);
                          const collapsed =
                            !expanded[clusterK] && pos.cols > MAX_VISIBLE_COLS;

                          const visibleCols = collapsed
                            ? MAX_VISIBLE_COLS
                            : pos.cols;
                          const colInView = collapsed
                            ? pos.col % MAX_VISIBLE_COLS
                            : pos.col;

                          const top =
                            (ev.startMin - startHour * 60) * PIXELS_PER_MINUTE;
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
                            <>
                              <Tooltip key={ev.cls.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`absolute rounded shadow-sm ring-1 ring-black/5 border-l-4 border-black/10 ${color} cursor-pointer overflow-hidden`}
                                    style={{ top, height, left, width }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEdit(ev.cls as WeekInstance);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={() => {}}
                                    title=""
                                  >
                                    {/* trash always visible */}

                                    <button
                                      className="absolute top-0.5 right-0.5 z-20 p-1 rounded hover:bg-black/10 focus:outline-none"
                                      aria-label="Eliminar clase sin inscritos"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWeeksByKey((prev) => ({
                                          ...prev,
                                          [wkKey]: (prev[wkKey] ?? []).filter(
                                            (r) => r.id !== ev.cls.id
                                          ),
                                        }));
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 opacity-70" />
                                    </button>

                                    {/* content */}
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
                                      <div className="text-[10px] opacity-80 truncate">
                                        <span className="font-bold">
                                          {ev.cls.enrolled} / {ev.cls.capacity}
                                        </span>
                                      </div>
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
                                        {typeof ev.cls.enrolled === "number"
                                          ? ` (${ev.cls.enrolled} inscritos)`
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
                            </>
                          );
                        })}
                      </div>

                      {/* Hover band + label */}
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
      </div>

      {/* Quick add uses minute-precision slot */}
      <QuickAddModal
        open={quickOpen}
        onOpenChange={setQuickOpen}
        slot={quickSlot} // { dateISO, startTime }
        onCreateOne={(p) => {
          if ("dateISO" in p) {
            // payload already has startTime/endTime/duration
            createOneWeekInstance(p);
          }
        }}
      />

      <SeriesModal
        open={seriesOpen}
        onOpenChange={setSeriesOpen}
        context="week"
        onCreate={(payload) => {
          // payload: { day, startTime, duration, name, type, coach, zone, capacity }
          // Map each selected weekday to the actual date of this week and emit createOneWeekInstance
          const byDow: Record<number, Date> = {};
          days.forEach((d) => {
            // your UI likely uses 1..7 (Mon..Sun)
            const dow = ((d.getDay() + 6) % 7) + 1; // JS Sun=0 -> 7, Mon=1 -> 1, ...
            byDow[dow] = d;
          });

          const target = byDow[payload.day];
          if (!target) return;

          const dateISO = isoFn(target);
          createOneWeekInstance({
            dateISO,
            startTime: payload.startTime,
            duration: payload.duration,
            name: payload.name,
            type: payload.type,
            coach: payload.coach,
            zone: payload.zone,
            capacity: payload.capacity,
          });
        }}
      />

      <EditWeekModal
        open={editOpen}
        onOpenChange={setEditOpen}
        inst={editing}
        onSave={saveEditWeek}
      />
    </TooltipProvider>
  );
}
