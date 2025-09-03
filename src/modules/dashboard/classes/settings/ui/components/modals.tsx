/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { durationFromTimes, hh, minutesToTime, weekdayShort } from "./utils";
import { typeColors } from "./constants";
import { TemplateRow, WeekInstance } from "./types";

const types = [
  "WOD",
  "Gymnastics",
  "Weightlifting",
  "Endurance",
  "Open Box",
  "Foundations",
  "Kids",
];

const getTimeOptions = () =>
  Array.from({ length: 96 }, (_, i) => {
    const mins = i * 15;
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  });

const parseTimeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/* ---------- Quick Add (shared) ---------- */
export function QuickAddModal({
  open,
  onOpenChange,
  slot,
  onCreateOne,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  // ⬇️ slot now carries minute-precision start time
  slot:
    | { day: number; startTime: string }
    | { dateISO: string; startTime: string }
    | null;
  // ⬇️ onCreateOne also minute-precision; no hour/minute ints
  onCreateOne: (
    p:
      | {
          kind: "template";
          day: number;
          startTime: string; // "HH:mm"
          endTime: string; // "HH:mm"
          name: string;
          type: string;
          coach: string;
          zone: string;
          duration: number; // minutes
          capacity: number;
        }
      | {
          kind: "week";
          dateISO: string;
          startTime: string; // "HH:mm"
          endTime: string; // "HH:mm"
          name: string;
          type: string;
          coach: string;
          zone: string;
          duration: number; // minutes
          capacity: number;
        }
  ) => void;
}) {
  const [type, setType] = useState("WOD");
  const [name, setName] = useState("WOD");
  const [coach, setCoach] = useState("");
  const [zone, setZone] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [capacity, setCapacity] = useState(16);

  // helpers
  const minutesToTime = (mins: number) => {
    const m = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (open && slot) {
      const initial = slot.startTime ?? "09:00";
      setStartTime(initial);
      // default end = start + 60min
      const startMin = parseTimeToMinutes(initial);
      setEndTime(minutesToTime(startMin + 60));

      setType("WOD");
      setName("WOD");
      setCoach("");
      setZone("");
      setCapacity(16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slot?.startTime]);

  const isTemplateSlot = !!slot && "day" in slot;
  const whenText = slot
    ? isTemplateSlot
      ? `Hora: ${slot.startTime} • Día: ${
          weekdayShort[(slot as { day: number }).day]
        }`
      : `Hora: ${slot.startTime} • Fecha: ${
          (slot as { dateISO: string }).dateISO
        }`
    : "";

  const handleCreate = () => {
    if (!slot) return;

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    const duration =
      endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
    if (duration <= 0) return;

    const base = {
      name,
      type,
      coach,
      zone,
      capacity,
      startTime, // keep as "HH:mm"
      endTime, // keep as "HH:mm"
      duration, // minutes
    };

    const payload =
      "day" in slot
        ? ({ kind: "template", day: slot.day, ...base } as const)
        : ({ kind: "week", dateISO: slot.dateISO, ...base } as const);

    onCreateOne(payload);
    onOpenChange(false);
  };

  const timeOptions = getTimeOptions();

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
          {/* Type */}
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

          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Nombre</Label>
            <Input
              className="h-9 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre visible"
            />
          </div>

          {/* Coach */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Coach</Label>
            <Input
              className="h-9 text-sm"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="Nombre del coach"
            />
          </div>

          {/* Zone */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Zona</Label>
            <Input
              className="h-9 text-sm"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Zona / espacio"
            />
          </div>

          {/* Start Time */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Hora de inicio</Label>
            <Select value={startTime} onValueChange={(v) => setStartTime(v)}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Selecciona hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* End Time */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Hora de fin</Label>
            <Select value={endTime} onValueChange={(v) => setEndTime(v)}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Selecciona hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
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
        </div>

        <DialogFooter className="mt-3 gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            className="h-9 text-sm w-full sm:w-auto"
            onClick={handleCreate}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SeriesModal({
  open,
  onOpenChange,
  context, // "structure" | "week" (only used for title/description)
  onCreate, // EXACTLY the same shape as QuickAdd's onCreateOne
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context: "structure" | "week";
  onCreate: (
    p:
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
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15"); // example default spanning 75 min
  const [capacity, setCapacity] = useState(16);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon–Fri

  const timeOptions = getTimeOptions();

  useEffect(() => {
    if (!open) return;
    // Reset like your QuickAdd
    setType("WOD");
    setName("WOD");
    setCoach("");
    setZone("");
    setStartTime("09:00");
    setEndTime("10:00");
    setCapacity(16);
    setDays([1, 2, 3, 4, 5]); // default Mon–Fri
  }, [open]);

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleCreate = () => {
    const duration =
      parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    if (duration <= 0 || days.length === 0) return;

    // EXACTLY like QuickAdd: take only the hour part for "hour"
    const hour = parseInt(startTime.split(":")[0], 10);

    // Emit ONE record per selected day with the SAME payload shape as QuickAdd
    for (const day of days) {
      onCreate({
        kind: "template",
        day,
        hour,
        name,
        type,
        coach,
        zone,
        duration,
        capacity,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[620px] sm:max-w-lg p-4 sm:p-6">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base sm:text-lg">
            Programar series (
            {context === "structure" ? "estructura" : "semana"})
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Crea múltiples clases con los mismos datos en varios días.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tipo */}
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

          {/* Nombre */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Nombre</Label>
            <Input
              className="h-9 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre visible"
            />
          </div>

          {/* Coach */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Coach</Label>
            <Input
              className="h-9 text-sm"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="Nombre del coach"
            />
          </div>

          {/* Zona */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Zona</Label>
            <Input
              className="h-9 text-sm"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Zona / espacio"
            />
          </div>

          {/* Hora de inicio */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Hora de inicio</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Selecciona hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hora de fin */}
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Hora de fin</Label>
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue placeholder="Selecciona hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacidad */}
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

          {/* Días */}
          <div className="space-y-1 sm:col-span-2">
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
                  <span>{weekdayShort[d]}</span>
                </label>
              ))}
            </div>
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
            onClick={handleCreate}
          >
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Edit (structure) ---------- */
export function EditTemplateModal({
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
            • {weekdayShort[local.dayOfWeek]} • {local.startTime}–
            {local.endTime}
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
                const raw = e.target.value;
                const mins = Math.max(
                  15,
                  Number.isFinite(+raw) ? parseInt(raw, 10) : 15
                );

                const startMin = parseTimeToMinutes(local.startTime); // "HH:mm" -> minutes
                const newEnd = minutesToTime(startMin + mins); // add minutes precisely

                setLocal((prev) => ({ ...prev, endTime: newEnd }));
                // if you're controlling `duration` separately, keep it in sync:
                // setDuration(mins);
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

/* ---------- Edit (week) ---------- */
export function EditWeekModal({
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
  const [local, setLocal] = useState<WeekInstance | null>(inst);
  useEffect(() => {
    if (open) setLocal(inst);
  }, [open, inst]);
  if (!open || !local) return null;

  const colorClass =
    typeColors[local.type as keyof typeof typeColors] ?? typeColors.Default;
  const duration = durationFromTimes(local.startTime, local.endTime);
  const types = [
    "WOD",
    "Gymnastics",
    "Weightlifting",
    "Endurance",
    "Open Box",
    "Foundations",
    "Kids",
  ];

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
