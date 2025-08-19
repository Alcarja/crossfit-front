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
import { hh, iso, parseHour } from "./utils";
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
} from "@/app/queries/schedule";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/* --------- Structure Board (no dates) --------- */
export function StructureBoard({
  isSmall,
  hours,
  templateRows,
  setTemplateRows,
  startHour,
  endHour,
  setStartHour,
  setEndHour,
  createOneTemplate,
  seriesCreateStructure,

  saveEditTemplate,
}: {
  isSmall: boolean;
  hours: number[];
  templateRows: TemplateRow[];
  setTemplateRows: React.Dispatch<React.SetStateAction<TemplateRow[]>>;
  startHour: number;
  endHour: number;
  setStartHour: (v: number) => void;
  setEndHour: (v: number) => void;
  createOneTemplate: (p: {
    day: number;
    hour: number;
    name: string;
    type: string;
    coach: string;
    zone: string;
    duration: number;
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

  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSlot, setQuickSlot] = useState<{
    day: number;
    hour: number;
  } | null>(null);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);

  const openQuickAdd = (day: number, hour: number) => {
    setQuickSlot({ day, hour });
    setQuickOpen(true);
  };

  const handleDragStart = (e: DragStartEvent) =>
    setActiveItem(e.active.data.current || null);

  const handleDragCancel = () => setActiveItem(null);

  const handleDragEnd = (e: DragEndEvent) => {
    const { over, active } = e;
    setActiveItem(null);
    if (!over) return;

    // over.id is "tpl_<day>_<hour>" — extract the last two parts
    const parts = String(over.id).split("_"); // ["tpl", "<day>", "<hour>"]
    const day = parseInt(parts[parts.length - 2], 10);
    const hour = parseInt(parts[parts.length - 1], 10);
    if (Number.isNaN(day) || Number.isNaN(hour)) return;

    const data = active.data.current as any;
    const fromPalette = !data.instanceId && !!data.id && !data.templateRowId;

    if (fromPalette) {
      const tpl = classPalette.find((t) => t.id === data.id);
      if (!tpl) return;
      createOneTemplate({
        day,
        hour,
        name: tpl.name,
        type: tpl.type,
        coach: tpl.coach || "",
        zone: tpl.zone || "",
        duration: tpl.duration || 60,
        capacity: tpl.capacity || 16,
      });
    } else if (data.templateRowId) {
      // move existing row
      const id = data.templateRowId as string;
      setTemplateRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                dayOfWeek: day,
                startTime: `${hh(hour)}:00`,
                endTime: `${hh(
                  hour +
                    Math.max(1, parseHour(r.endTime) - parseHour(r.startTime))
                )}:00`,
              }
            : r
        )
      );
    }
  };

  const { data: scheduleData } = useQuery(scheduleQueryOptions());

  useEffect(() => {
    if (scheduleData?.templates) {
      setTemplateRows(
        scheduleData.templates.map((t: any) => ({
          id: String(t.id),
          name: t.name,
          type: t.type,
          dayOfWeek: t.dayOfWeek, // 0=Sunday…6=Saturday
          startTime: t.startTime,
          endTime: t.endTime,
          capacity: t.capacity,
          coach: t.coachId ?? "",
          zone: t.zoneName ?? "",
        }))
      );
    }
  }, [scheduleData, setTemplateRows]);

  const createScheduleMutation = useCreateSchedule();

  const saveChanges = () => {
    const rows = templateRows
      .slice()
      .sort((a, b) =>
        a.dayOfWeek === b.dayOfWeek
          ? parseHour(a.startTime) - parseHour(b.startTime)
          : a.dayOfWeek - b.dayOfWeek
      )
      .map((r) => ({
        name: r.name,
        type: r.type as
          | "WOD"
          | "Gymnastics"
          | "Weightlifting"
          | "Endurance"
          | "Foundations"
          | "Kids",
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        capacity: r.capacity,
        coachId: undefined, // TODO: map real coach id if you have it
        zoneName: r.zone || undefined,
        isActive: true,
      }));

    // call mutation with onSuccess
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

          {/* grid */}
          <div className="flex-1 overflow-auto px-3 pb-3">
            <div className="pt-3">
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 min-w-[900px] lg:min-w-0">
                <div />
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <DayHeader
                    key={`hdr-${d}`}
                    label={
                      ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][d]
                    }
                  />
                ))}
              </div>
            </div>

            {hours.map((h) => (
              <div
                key={`row-${h}`}
                className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 mb-2 min-w-[900px] lg:min-w-0"
              >
                <div className="border rounded-md bg-white flex items-start justify-center pt-2 text-[11px] text-gray-500">{`${hh(
                  h
                )}:00`}</div>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const cellId = `tpl_${d}_${h}`;
                  const here = templateRows.filter(
                    (r) => r.dayOfWeek === d && parseHour(r.startTime) === h
                  );
                  return (
                    <DroppableCell
                      key={cellId}
                      id={cellId}
                      onEmptyClick={() => openQuickAdd(d, h)}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        {here.map((r) => (
                          <DraggableClass
                            key={r.id}
                            cls={{
                              templateRowId: r.id,
                              id: r.id,
                              name: r.name,
                              type: r.type,
                              capacity: r.capacity,
                              enrolled: 0, // 👈 since structure has no enrolled yet
                            }}
                            fullWidth
                            onOpenEdit={() => {
                              setEditing(r);
                              setEditOpen(true);
                            }}
                            onDelete={() =>
                              setTemplateRows((prev) =>
                                prev.filter((x) => x.id !== r.id)
                              )
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

      {activeItem && (
        <DragOverlay
          adjustScale={false}
          dropAnimation={null}
          // prevent the overlay from eating clicks and staying above selects
          style={{ pointerEvents: "none", zIndex: 40 }}
        >
          <BubbleOverlay cls={activeItem} />
        </DragOverlay>
      )}

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
        onCreate={seriesCreateStructure}
      />
      <EditTemplateModal
        open={editOpen}
        onOpenChange={setEditOpen}
        row={editing}
        onSave={saveEditTemplate}
      />
    </DndContext>
  );
}

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

  const logWeek = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const rows = weekInstances
      .slice()
      .sort((a, b) =>
        a.date === b.date
          ? parseHour(a.startTime) - parseHour(b.startTime)
          : a.date.localeCompare(b.date)
      )
      .map((c) => ({
        date: c.date,
        time: `${pad(parseHour(c.startTime))}:00`,
        name: c.name,
        type: c.type,
        coach: c.coach ?? "",
        zone: c.zone ?? "",
        enrolled: c.enrolled,
        capacity: c.capacity,
        id: c.id,
      }));
    console.table(rows);
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
                <Button variant="outline" onClick={logWeek}>
                  Registrar clases
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
        slot={quickSlot}
        onCreateOne={(p) => {
          if ("dateISO" in p) createOneWeekInstance(p);
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
