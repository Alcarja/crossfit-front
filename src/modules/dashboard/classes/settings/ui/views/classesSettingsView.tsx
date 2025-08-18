/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";

/* shadcn/ui */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* icons */
import { GripVertical, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

/* -------------------------------------
   Types
------------------------------------- */
type TemplateClass = {
  id: string;
  name: string;
  duration: number; // minutes
  coach?: string;
  zone?: string;
  type: string;
  capacity?: number;
};

type TemplateRow = {
  id: string; // structure row id
  name: string;
  type: string;
  dayOfWeek: number; // 1..7 (Mon=1)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number;
  zone?: string;
  coach?: string;
};

type WeekInstance = {
  id: string; // instance id
  date: string; // yyyy-MM-dd
  name: string;
  type: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number;
  enrolled: number; // shows like before
  zone?: string;
  coach?: string;
};

/* -------------------------------------
   Colors
------------------------------------- */
const typeColors: Record<string, string> = {
  WOD: "bg-blue-200 text-blue-900",
  Gymnastics: "bg-red-200 text-red-900",
  Weightlifting: "bg-purple-200 text-purple-900",
  Endurance: "bg-green-200 text-green-900",
  Foundations: "bg-pink-200 text-pink-900",
  Kids: "bg-yellow-200 text-yellow-900",
  Default: "bg-gray-200 text-gray-800",
};

/* -------------------------------------
   Config + Palette
------------------------------------- */
const DEFAULT_START = 9;
const DEFAULT_END = 22;

const classPalette: TemplateClass[] = [
  {
    id: "template-1",
    name: "WOD",
    duration: 60,
    coach: "",
    zone: "",
    type: "WOD",
    capacity: 20,
  },
  {
    id: "template-2",
    name: "Weightlifting",
    duration: 60,
    coach: "",
    zone: "",
    type: "Weightlifting",
    capacity: 10,
  },
  {
    id: "template-3",
    name: "Gymnastics",
    duration: 45,
    coach: "",
    zone: "",
    type: "Gymnastics",
    capacity: 8,
  },
  {
    id: "template-4",
    name: "Endurance",
    duration: 60,
    coach: "",
    zone: "",
    type: "Endurance",
    capacity: 12,
  },
  {
    id: "template-5",
    name: "Open Box",
    duration: 60,
    coach: "",
    zone: "",
    type: "Open Box",
    capacity: 8,
  },
  {
    id: "template-6",
    name: "Foundations",
    duration: 60,
    coach: "",
    zone: "",
    type: "Foundations",
    capacity: 12,
  },
  {
    id: "template-7",
    name: "Kids",
    duration: 60,
    coach: "",
    zone: "",
    type: "Kids",
    capacity: 12,
  },
];

/* -------------------------------------
   Helpers
------------------------------------- */
const hh = (n: number) => String(n).padStart(2, "0");
const parseHour = (time: string) => parseInt(time.split(":")[0], 10);
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const weekKeyFromDate = (d: Date) => iso(startOfWeek(d, { weekStartsOn: 1 })); // Monday ISO
const durationFromTimes = (start: string, end: string) =>
  (parseHour(end) - parseHour(start)) * 60;

/* -------------------------------------
   Responsive helper
------------------------------------- */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

/* -------------------------------------
   Draggable bubble
------------------------------------- */
function DraggableClass({
  cls,
  fullWidth = false,
  onOpenEdit,
  onDelete,
  isPalette = false,
  disabled = false,
}: {
  cls: any;
  fullWidth?: boolean;
  onOpenEdit?: () => void;
  onDelete?: () => void;
  isPalette?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: cls.instanceId || cls.id,
      data: cls,
      disabled,
    });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
  };

  const colorClass =
    typeColors[cls.type as keyof typeof typeColors] ?? typeColors.Default;
  const showCounts =
    typeof cls.capacity === "number" && typeof cls.enrolled === "number";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!isPalette) onOpenEdit?.();
      }}
      className={clsx(
        "relative flex items-stretch rounded-sm border border-black/5 shadow-sm text-xs leading-tight select-none",
        colorClass,
        fullWidth
          ? "w-full max-w-full overflow-hidden"
          : "inline-block max-w-full",
        "px-2 py-1 pr-6",
        isDragging ? "opacity-0" : "opacity-100",
        disabled ? "cursor-default" : "cursor-pointer"
      )}
      title={isPalette ? undefined : "Click para editar • arrastra con el asa"}
    >
      {/* Left content (trash + title) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {!isPalette && onDelete ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10 text-black/60"
              aria-label="Eliminar clase"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="w-5 h-5" />
          )}
          <span className="font-medium truncate">{cls.name}</span>
        </div>

        {showCounts && (
          <div className="mt-0.5 text-[10px] font-medium opacity-90 pl-1">
            {cls.enrolled}/{cls.capacity}
          </div>
        )}
      </div>

      {/* Handle */}
      <button
        {...(disabled ? {} : { ...listeners, ...attributes })}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={clsx(
          "absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10",
          disabled
            ? "cursor-default opacity-60"
            : "cursor-grab active:cursor-grabbing"
        )}
        title={disabled ? undefined : "Arrastrar"}
        aria-label="Arrastrar"
      >
        <GripVertical className="h-4 w-4 opacity-70" />
      </button>
    </div>
  );
}

function PaletteItemStatic({ cls }: { cls: any }) {
  const colorClass =
    typeColors[cls.type as keyof typeof typeColors] ?? typeColors.Default;
  return (
    <div
      className={clsx(
        "rounded-sm border border-black/5 shadow-sm text-xs leading-tight select-none",
        colorClass,
        "px-2 py-1"
      )}
    >
      <div className="font-medium truncate">{cls.name}</div>
    </div>
  );
}

function BubbleOverlay({ cls }: { cls: any }) {
  const colorClass =
    typeColors[cls.type as keyof typeof typeColors] ?? typeColors.Default;
  const showCounts =
    typeof cls.capacity === "number" && typeof cls.enrolled === "number";
  return (
    <div
      className={clsx(
        "rounded-sm border border-black/10 shadow-lg text-xs leading-tight select-none pointer-events-none",
        colorClass,
        "px-2 py-1 w-full max-w-full overflow-hidden"
      )}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate min-w-0">{cls.name}</span>
        {showCounts && (
          <span className="ml-auto shrink-0 text-[10px] font-medium opacity-90">
            {cls.enrolled}/{cls.capacity}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------
   Droppable calendar cell
------------------------------------- */
function DroppableCell({
  id,
  isTodayCol,
  onEmptyClick,
  children,
}: {
  id: string;
  isTodayCol?: boolean;
  onEmptyClick?: () => void;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        if (e.currentTarget === e.target) onEmptyClick?.();
      }}
      className={clsx(
        "relative p-2 h-auto min-h-[56px] min-w-0 overflow-hidden",
        "border rounded-md",
        isTodayCol ? "border-blue-400 border-2" : "border-gray-200",
        isOver ? "bg-blue-50/70" : "bg-white",
        "transition-colors cursor-pointer"
      )}
    >
      <div className="absolute left-1 right-1 top-1 border-t border-gray-100 pointer-events-none" />
      {children}
    </div>
  );
}

function DayHeader({
  label,
  isTodayFlag = false,
}: {
  label: string;
  isTodayFlag?: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={clsx(
          "text-sm font-semibold text-center w-full",
          isTodayFlag ? "text-blue-700" : "text-gray-700"
        )}
      >
        {label}
      </div>
    </div>
  );
}

/* -------------------------------------
   Quick Add Modal (shared)
------------------------------------- */
function QuickAddModal({
  open,
  onOpenChange,
  slot, // { day, hour } (structure) OR { dateISO, hour } (week)
  onCreateOne,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slot:
    | { day: number; hour: number }
    | { dateISO: string; hour: number }
    | null;
  onCreateOne: (
    payload:
      | {
          kind: "template";
          day: number;
          hour: number;
          name: string;
          type: string;
          coach: string;
          zone: string;
          duration: number;
          capacity: number;
        }
      | {
          kind: "week";
          dateISO: string;
          hour: number;
          name: string;
          type: string;
          coach: string;
          zone: string;
          duration: number;
          capacity: number;
        }
  ) => void;
}) {
  const [type, setType] = useState("WOD");
  const [name, setName] = useState("WOD");
  const [coach, setCoach] = useState("");
  const [zone, setZone] = useState("");
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(16);

  const types = [
    "WOD",
    "Gymnastics",
    "Weightlifting",
    "Endurance",
    "Foundations",
    "Kids",
  ];

  const isTemplateSlot = slot && "day" in slot;
  const whenText = slot
    ? isTemplateSlot
      ? `Hora: ${String((slot as any).hour).padStart(2, "0")}:00 • Día: ${
          ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][
            (slot as any).day
          ]
        }`
      : `Hora: ${String((slot as any).hour).padStart(2, "0")}:00 • Fecha: ${
          (slot as any).dateISO
        }`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Añadir clase
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {whenText}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setName(v);
              }}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Nombre</Label>
            <Input
              className="h-9 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre visible"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Coach</Label>
            <Input
              className="h-9 text-sm"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="Nombre del coach"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Zona</Label>
            <Input
              className="h-9 text-sm"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Zona / espacio"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Duración (min)</Label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))}
              placeholder="60"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Capacidad</Label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value || "0", 10))}
              placeholder="16"
              inputMode="numeric"
            />
          </div>
        </div>

        <DialogFooter className="mt-3 gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            className="h-9 text-sm w-full sm:w-auto"
            onClick={() => {
              if (!slot) return;
              if ("day" in (slot as any)) {
                onCreateOne({
                  kind: "template",
                  day: (slot as any).day,
                  hour: (slot as any).hour,
                  name,
                  type,
                  coach,
                  zone,
                  duration,
                  capacity,
                });
              } else {
                onCreateOne({
                  kind: "week",
                  dateISO: (slot as any).dateISO,
                  hour: (slot as any).hour,
                  name,
                  type,
                  coach,
                  zone,
                  duration,
                  capacity,
                });
              }
              onOpenChange(false);
            }}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------
   Series Modal (shared)
------------------------------------- */
function SeriesModal({
  open,
  onOpenChange,
  onCreate,
  context, // "structure" | "week"
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context: "structure" | "week";
  onCreate: (payload: {
    type: string;
    name: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
    daysOfWeek: number[]; // 1..7, Mon=1
    startHour: number; // 0..23
    endHour: number; // exclusive
  }) => void;
}) {
  const [type, setType] = useState("WOD");
  const [name, setName] = useState("WOD");
  const [coach, setCoach] = useState("");
  const [zone, setZone] = useState("");
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(16);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(13);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const types = [
    "WOD",
    "Gymnastics",
    "Weightlifting",
    "Endurance",
    "Foundations",
    "Kids",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[620px] sm:max-w-lg p-4 sm:p-6 max-h-[85vh] overflow-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base sm:text-lg">
            Programar series (
            {context === "structure" ? "estructura" : "semana"})
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Crea clases recurrentes{" "}
            {context === "structure"
              ? "en la plantilla semanal"
              : "para la semana seleccionada"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                setName(v);
              }}
            >
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Nombre</Label>
            <Input
              className="h-9 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre visible"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Coach</Label>
            <Input
              className="h-9 text-sm"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Zona</Label>
            <Input
              className="h-9 text-sm"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Duración (min)</Label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Capacidad</Label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value || "0", 10))}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Desde (hora)</Label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={0}
              max={23}
              value={startHour}
              onChange={(e) =>
                setStartHour(parseInt(e.target.value || "0", 10))
              }
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Hasta (exclusiva)</Label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={1}
              max={24}
              value={endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value || "0", 10))}
            />
          </div>
        </div>

        <Separator className="my-3" />

        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Días</Label>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <label
                key={d}
                className="flex items-center gap-2 rounded border px-2 py-1 text-xs sm:text-sm"
              >
                <Checkbox
                  checked={days.includes(d)}
                  onCheckedChange={() => toggleDay(d)}
                  id={`day-${d}`}
                />
                <span>
                  {["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][d]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-3">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            className="h-9 text-sm w-full sm:w-auto"
            onClick={() => {
              onCreate({
                type,
                name,
                coach,
                zone,
                duration,
                capacity,
                daysOfWeek: days.sort(),
                startHour,
                endHour,
              });
              onOpenChange(false);
            }}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------
   Edit Modals
------------------------------------- */
function EditTemplateModal({
  open,
  onOpenChange,
  row,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: TemplateRow | null;
  onSave: (r: TemplateRow) => void;
}) {
  const types = [
    "WOD",
    "Gymnastics",
    "Weightlifting",
    "Endurance",
    "Foundations",
    "Kids",
  ];

  const [local, setLocal] = useState<TemplateRow | null>(row);
  useEffect(() => {
    if (open) setLocal(row);
  }, [open, row]);

  if (!open || !local) return null;

  const colorClass =
    typeColors[local.type as keyof typeof typeColors] ?? typeColors.Default;

  const duration = durationFromTimes(local.startTime, local.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar clase (estructura)</DialogTitle>
          <DialogDescription>
            Cambia los valores para esta fila de la plantilla.
          </DialogDescription>
        </DialogHeader>

        <div className={clsx("px-2 py-1 rounded-sm text-xs", colorClass)}>
          <div className="font-medium">{local.name}</div>
          <div>
            •{" "}
            {
              ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][
                local.dayOfWeek
              ]
            }{" "}
            • {local.startTime}–{local.endTime}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select
              value={local.type}
              onValueChange={(v) => setLocal({ ...local, type: v, name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={local.name}
              onChange={(e) => setLocal({ ...local, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Coach</Label>
            <Input
              value={local.coach || ""}
              onChange={(e) => setLocal({ ...local, coach: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Zona</Label>
            <Input
              value={local.zone || ""}
              onChange={(e) => setLocal({ ...local, zone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Duración (min)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => {
                const mins = Math.max(15, parseInt(e.target.value || "0", 10));
                const newEnd = `${hh(
                  parseHour(local.startTime) + Math.ceil(mins / 60)
                )}:00`;
                setLocal({ ...local, endTime: newEnd });
              }}
            />
          </div>

          <div className="space-y-1">
            <Label>Capacidad</Label>
            <Input
              type="number"
              min={1}
              value={local.capacity}
              onChange={(e) =>
                setLocal({
                  ...local,
                  capacity: Math.max(1, parseInt(e.target.value || "0", 10)),
                })
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (local) onSave(local);
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditWeekModal({
  open,
  onOpenChange,
  inst,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inst: WeekInstance | null;
  onSave: (r: WeekInstance) => void;
}) {
  const types = [
    "WOD",
    "Gymnastics",
    "Weightlifting",
    "Endurance",
    "Foundations",
    "Kids",
  ];

  const [local, setLocal] = useState<WeekInstance | null>(inst);
  useEffect(() => {
    if (open) setLocal(inst);
  }, [open, inst]);

  if (!open || !local) return null;

  const colorClass =
    typeColors[local.type as keyof typeof typeColors] ?? typeColors.Default;

  const duration = durationFromTimes(local.startTime, local.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar clase (semana)</DialogTitle>
          <DialogDescription>
            Cambia los valores solo para esta instancia.
          </DialogDescription>
        </DialogHeader>

        <div className={clsx("px-2 py-1 rounded-sm text-xs", colorClass)}>
          <div className="font-medium">{local.name}</div>
          <div>
            • {local.date} • {local.startTime}–{local.endTime}
          </div>
          <div className="mt-1 font-semibold">
            {local.enrolled}/{local.capacity} inscritos
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select
              value={local.type}
              onValueChange={(v) => setLocal({ ...local, type: v, name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={local.name}
              onChange={(e) => setLocal({ ...local, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Coach</Label>
            <Input
              value={local.coach || ""}
              onChange={(e) => setLocal({ ...local, coach: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Zona</Label>
            <Input
              value={local.zone || ""}
              onChange={(e) => setLocal({ ...local, zone: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Duración (min)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => {
                const mins = Math.max(15, parseInt(e.target.value || "0", 10));
                const newEnd = `${hh(
                  parseHour(local.startTime) + Math.ceil(mins / 60)
                )}:00`;
                setLocal({ ...local, endTime: newEnd });
              }}
            />
          </div>

          <div className="space-y-1">
            <Label>Capacidad</Label>
            <Input
              type="number"
              min={1}
              value={local.capacity}
              onChange={(e) =>
                setLocal({
                  ...local,
                  capacity: Math.max(1, parseInt(e.target.value || "0", 10)),
                })
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={() => {
              if (local) onSave(local);
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------
   Main
------------------------------------- */
export default function ClassesSettingsView() {
  const isSmall = useMediaQuery("(max-width: 1024px)");
  const [startHour, setStartHour] = useState<number>(DEFAULT_START);
  const [endHour, setEndHour] = useState<number>(DEFAULT_END);
  const hours = useMemo(
    () =>
      Array.from({ length: endHour - startHour }).map((_, i) => i + startHour),
    [startHour, endHour]
  );

  /* ======= TAB 1: STRUCTURE ======= */
  const [templateRows, setTemplateRows] = useState<TemplateRow[]>([]);
  const [activeItemStructure, setActiveItemStructure] = useState<any | null>(
    null
  );

  const [quickOpenStructure, setQuickOpenStructure] = useState(false);
  const [quickSlotStructure, setQuickSlotStructure] = useState<{
    day: number;
    hour: number;
  } | null>(null);

  const [seriesOpenStructure, setSeriesOpenStructure] = useState(false);

  const [editTplOpen, setEditTplOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<TemplateRow | null>(null);

  const openQuickAddTemplate = (day: number, hour: number) => {
    setQuickSlotStructure({ day, hour });
    setQuickOpenStructure(true);
  };

  const createOneTemplate = (p: {
    day: number;
    hour: number;
    name: string;
    type: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
  }) => {
    const start = `${hh(p.hour)}:00`;
    const end = `${hh(p.hour + Math.max(1, Math.ceil(p.duration / 60)))}:00`;
    const row: TemplateRow = {
      id: `tpl-${uuidv4()}`,
      name: p.name,
      type: p.type,
      dayOfWeek: p.day,
      startTime: start,
      endTime: end,
      capacity: p.capacity,
      coach: p.coach || undefined,
      zone: p.zone || undefined,
    };
    setTemplateRows((prev) => [...prev, row]);
  };

  const openEditTemplate = (id: string) => {
    const row = templateRows.find((r) => r.id === id) || null;
    if (!row) return;
    setEditingTpl(row);
    setEditTplOpen(true);
  };

  const saveEditTemplate = (updated: TemplateRow) => {
    setTemplateRows((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

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
    setTemplateRows((prev) => [...prev, ...rows]);
  };

  const handleDragStartStructure = (e: DragStartEvent) =>
    setActiveItemStructure(e.active.data.current || null);
  const handleDragCancelStructure = () => setActiveItemStructure(null);

  const handleDragEndStructure = (e: DragEndEvent) => {
    const { over, active } = e;
    setActiveItemStructure(null);
    if (!over) return;

    // over id format: tpl_<day>_<hour>
    const [dayStr, hourStr] = String(over.id).split("_");
    const day = parseInt(dayStr, 10);
    const hour = parseInt(hourStr, 10);

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
      // move existing template row
      setTemplateRows((prev) =>
        prev.map((r) =>
          r.id === data.templateRowId
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

  const logStructure = () => {
    const rows = templateRows
      .slice()
      .sort((a, b) =>
        a.dayOfWeek === b.dayOfWeek
          ? parseHour(a.startTime) - parseHour(b.startTime)
          : a.dayOfWeek - b.dayOfWeek
      )
      .map((r) => ({
        day: ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][r.dayOfWeek],
        time: `${r.startTime}–${r.endTime}`,
        name: r.name,
        type: r.type,
        coach: r.coach ?? "",
        zone: r.zone ?? "",
        capacity: r.capacity,
      }));
    console.table(rows);
  };

  /* ======= TAB 2: WEEK (DATED) ======= */
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekLabel = `${format(weekStart, "d 'de' MMM", {
    locale: es,
  })} – ${format(addDays(weekStart, 6), "d 'de' MMM yyyy", { locale: es })}`;

  const [weeksByKey, setWeeksByKey] = useState<Record<string, WeekInstance[]>>(
    {}
  );
  const wkKey = weekKeyFromDate(selectedDate);
  const weekInstances = weeksByKey[wkKey] ?? [];

  const [activeItemWeek, setActiveItemWeek] = useState<any | null>(null);

  const [quickOpenWeek, setQuickOpenWeek] = useState(false);
  const [quickSlotWeek, setQuickSlotWeek] = useState<{
    dateISO: string;
    hour: number;
  } | null>(null);

  const [seriesOpenWeek, setSeriesOpenWeek] = useState(false);

  const [editWeekOpen, setEditWeekOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<WeekInstance | null>(null);

  const openQuickAddWeek = (dateISO: string, hour: number) => {
    setQuickSlotWeek({ dateISO, hour });
    setQuickOpenWeek(true);
  };

  const createOneWeekInstance = (p: {
    dateISO: string;
    hour: number;
    name: string;
    type: string;
    coach: string;
    zone: string;
    duration: number;
    capacity: number;
  }) => {
    const start = `${hh(p.hour)}:00`;
    const end = `${hh(p.hour + Math.max(1, Math.ceil(p.duration / 60)))}:00`;
    const inst: WeekInstance = {
      id: `inst-${uuidv4()}`,
      date: p.dateISO,
      name: p.name,
      type: p.type,
      startTime: start,
      endTime: end,
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

  const openEditWeek = (id: string) => {
    const inst = weekInstances.find((x) => x.id === id) || null;
    if (!inst) return;
    setEditingWeek(inst);
    setEditWeekOpen(true);
  };

  const saveEditWeek = (updated: WeekInstance) => {
    setWeeksByKey((prev) => ({
      ...prev,
      [wkKey]: (prev[wkKey] ?? []).map((x) =>
        x.id === updated.id ? updated : x
      ),
    }));
  };

  const seriesCreateWeek = (payload: {
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
    const base: WeekInstance[] = [];
    payload.daysOfWeek.forEach((dow) => {
      const date = iso(addDays(weekStart, dow - 1));
      for (let h = payload.startHour; h < payload.endHour; h++) {
        base.push({
          id: `inst-${uuidv4()}`,
          date,
          name: payload.name,
          type: payload.type,
          startTime: `${hh(h)}:00`,
          endTime: `${hh(
            h + Math.max(1, Math.ceil(payload.duration / 60))
          )}:00`,
          capacity: payload.capacity,
          enrolled: 0,
          coach: payload.coach || undefined,
          zone: payload.zone || undefined,
        });
      }
    });
    setWeeksByKey((prev) => ({
      ...prev,
      [wkKey]: [...(prev[wkKey] ?? []), ...base],
    }));
  };

  const generateWeekFromStructure = () => {
    const cloned: WeekInstance[] = templateRows.map((t) => ({
      id: `inst-${uuidv4()}`,
      date: iso(addDays(weekStart, t.dayOfWeek - 1)),
      name: t.name,
      type: t.type,
      startTime: t.startTime,
      endTime: t.endTime,
      capacity: t.capacity,
      enrolled: 0,
      coach: t.coach,
      zone: t.zone,
    }));
    setWeeksByKey((prev) => ({ ...prev, [wkKey]: cloned }));
  };

  const handleDragStartWeek = (e: DragStartEvent) =>
    setActiveItemWeek(e.active.data.current || null);
  const handleDragCancelWeek = () => setActiveItemWeek(null);

  const handleDragEndWeek = (e: DragEndEvent) => {
    const { over, active } = e;
    setActiveItemWeek(null);
    if (!over) return;

    // over id format: <dateISO>_<hour>
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
      // move existing instance
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

  /* -------------------------------------
     RENDER
  ------------------------------------- */
  return (
    <div className="w-full mx-auto max-w-[2400px] md:p-6">
      <Tabs defaultValue="defaultSchedule" className="w-full">
        <TabsList className="w-full flex gap-2 mb-6">
          <TabsTrigger value="defaultSchedule" className="flex-1">
            Estructura de las clases
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1">
            Calendario
          </TabsTrigger>
        </TabsList>

        {/* ====== TAB 1: STRUCTURE ====== */}
        <TabsContent value="defaultSchedule" className="w-full">
          <DndContext
            onDragStart={handleDragStartStructure}
            onDragEnd={handleDragEndStructure}
            onDragCancel={handleDragCancelStructure}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
              {/* LEFT */}
              <div className="flex flex-col bg-white">
                {/* Header */}
                <div className="border-b px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground font-medium">
                      Plantilla semanal (sin fechas)
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label className="hidden sm:inline text-xs text-gray-600 pt-2">
                          Desde
                        </Label>
                        <Select
                          value={String(startHour)}
                          onValueChange={(v) => setStartHour(parseInt(v, 10))}
                        >
                          <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                            <SelectValue placeholder="Desde" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }).map((_, h) => (
                              <SelectItem key={`s-${h}`} value={String(h)}>
                                {`${hh(h)}:00`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="hidden sm:inline text-xs text-gray-600 pt-2">
                          Hasta
                        </Label>
                        <Select
                          value={String(endHour)}
                          onValueChange={(v) => setEndHour(parseInt(v, 10))}
                        >
                          <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                            <SelectValue placeholder="Hasta" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 - startHour }).map(
                              (_, i) => {
                                const h = i + startHour + 1;
                                return (
                                  <SelectItem key={`e-${h}`} value={String(h)}>
                                    {`${hh(h)}:00`}
                                  </SelectItem>
                                );
                              }
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={() => setSeriesOpenStructure(true)}>
                        Programar series
                      </Button>
                      <Button variant="outline" onClick={logStructure}>
                        Registrar estructura
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-auto px-3 pb-3">
                  {/* headers */}
                  <div className="pt-3">
                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 min-w-[900px] lg:min-w-0">
                      <div className="text-sm font-semibold text-center text-gray-400 select-none" />
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <DayHeader
                          key={`hdr-${d}`}
                          label={
                            [
                              "",
                              "Lun",
                              "Mar",
                              "Mié",
                              "Jue",
                              "Vie",
                              "Sáb",
                              "Dom",
                            ][d]
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* rows */}
                  {hours.map((h) => (
                    <div
                      key={`row-${h}`}
                      className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 mb-2 min-w-[900px] lg:min-w-0"
                    >
                      <div className="border rounded-md bg-white flex items-start justify-center pt-2 text-[11px] text-gray-500">
                        {`${hh(h)}:00`}
                      </div>

                      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                        const cellId = `tpl_${d}_${h}`;
                        const here = templateRows.filter(
                          (r) =>
                            r.dayOfWeek === d && parseHour(r.startTime) === h
                        );
                        return (
                          <DroppableCell
                            key={cellId}
                            id={cellId}
                            onEmptyClick={() => openQuickAddTemplate(d, h)}
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
                                  }}
                                  fullWidth
                                  onOpenEdit={() => openEditTemplate(r.id)}
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

              {/* RIGHT: Palette */}
              <div className="border-l bg-white flex flex-col">
                <div className="px-5 py-2 border-b bg-white">
                  <div className="text-sm font-semibold">
                    Clases disponibles
                  </div>
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

            {/* Overlays & Modals */}
            <DragOverlay
              adjustScale={false}
              dropAnimation={null}
              style={{ zIndex: 9999 }}
            >
              {activeItemStructure ? (
                <BubbleOverlay cls={activeItemStructure} />
              ) : null}
            </DragOverlay>

            <QuickAddModal
              open={quickOpenStructure}
              onOpenChange={setQuickOpenStructure}
              slot={quickSlotStructure}
              onCreateOne={(p) => {
                if ("day" in p) {
                  createOneTemplate(p);
                }
              }}
            />

            <SeriesModal
              open={seriesOpenStructure}
              onOpenChange={setSeriesOpenStructure}
              context="structure"
              onCreate={seriesCreateStructure}
            />

            <EditTemplateModal
              open={editTplOpen}
              onOpenChange={setEditTplOpen}
              row={editingTpl}
              onSave={saveEditTemplate}
            />
          </DndContext>
        </TabsContent>

        {/* ====== TAB 2: WEEK (DATED) ====== */}
        <TabsContent value="schedule" className="w-full">
          <DndContext
            onDragStart={handleDragStartWeek}
            onDragEnd={handleDragEndWeek}
            onDragCancel={handleDragCancelWeek}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
              {/* LEFT: Calendar */}
              <div className="flex flex-col bg-white">
                <div className="border-b px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate((d) => subWeeks(d, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm md:text-md text-muted-foreground font-medium min-w-[200px] text-center">
                        {weekLabel}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate((d) => addWeeks(d, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label className="hidden sm:inline text-xs text-gray-600 pt-2">
                          Desde
                        </Label>
                        <Select
                          value={String(startHour)}
                          onValueChange={(v) => setStartHour(parseInt(v, 10))}
                        >
                          <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                            <SelectValue placeholder="Desde" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }).map((_, h) => (
                              <SelectItem key={`ws-${h}`} value={String(h)}>
                                {`${hh(h)}:00`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="hidden sm:inline text-xs text-gray-600 pt-2">
                          Hasta
                        </Label>
                        <Select
                          value={String(endHour)}
                          onValueChange={(v) => setEndHour(parseInt(v, 10))}
                        >
                          <SelectTrigger className="h-8 sm:h-9 w-[100px]">
                            <SelectValue placeholder="Hasta" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 - startHour }).map(
                              (_, i) => {
                                const h = i + startHour + 1;
                                return (
                                  <SelectItem key={`we-${h}`} value={String(h)}>
                                    {`${hh(h)}:00`}
                                  </SelectItem>
                                );
                              }
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        className="w-auto"
                        onClick={generateWeekFromStructure}
                      >
                        Generar semana desde estructura
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSeriesOpenWeek(true)}
                      >
                        Programar series
                      </Button>
                      <Button variant="outline" onClick={logWeek}>
                        Registrar clases
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-auto px-3 pb-3">
                  {/* headers */}
                  <div className="pt-3">
                    <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 min-w-[900px] lg:min-w-0">
                      <div className="text-sm font-semibold text-center text-gray-400 select-none" />
                      {days.map((d) => (
                        <DayHeader
                          key={d.toISOString()}
                          label={format(d, "EEE", { locale: es })}
                          isTodayFlag={isToday(d)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* rows */}
                  {hours.map((h) => (
                    <div
                      key={`wrow-${h}`}
                      className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2 mb-2 min-w-[900px] lg:min-w-0"
                    >
                      <div className="border rounded-md bg-white flex items-start justify-center pt-2 text-[11px] text-gray-500">
                        {`${hh(h)}:00`}
                      </div>

                      {days.map((day) => {
                        const dayISO = iso(day);
                        const cellId = `${dayISO}_${h}`;
                        const here = weekInstances.filter(
                          (r) =>
                            r.date === dayISO && parseHour(r.startTime) === h
                        );
                        return (
                          <DroppableCell
                            key={cellId}
                            id={cellId}
                            isTodayCol={isToday(day)}
                            onEmptyClick={() => openQuickAddWeek(dayISO, h)}
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
                                  onOpenEdit={() => openEditWeek(r.id)}
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

              {/* RIGHT: Palette */}
              <div className="border-l bg-white flex flex-col">
                <div className="px-5 py-2 border-b bg-white">
                  <div className="text-sm font-semibold">
                    Clases disponibles
                  </div>
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

            {/* Overlay + Modals */}
            <DragOverlay
              adjustScale={false}
              dropAnimation={null}
              style={{ zIndex: 9999 }}
            >
              {activeItemWeek ? <BubbleOverlay cls={activeItemWeek} /> : null}
            </DragOverlay>

            <QuickAddModal
              open={quickOpenWeek}
              onOpenChange={setQuickOpenWeek}
              slot={quickSlotWeek}
              onCreateOne={(p) => {
                if ("dateISO" in p) createOneWeekInstance(p);
              }}
            />

            <SeriesModal
              open={seriesOpenWeek}
              onOpenChange={setSeriesOpenWeek}
              context="week"
              onCreate={seriesCreateWeek}
            />

            <EditWeekModal
              open={editWeekOpen}
              onOpenChange={setEditWeekOpen}
              inst={editingWeek}
              onSave={saveEditWeek}
            />
          </DndContext>
        </TabsContent>
      </Tabs>
    </div>
  );
}
