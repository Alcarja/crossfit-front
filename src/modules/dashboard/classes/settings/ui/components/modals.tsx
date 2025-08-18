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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { durationFromTimes, hh, parseHour, weekdayShort } from "./utils";
import { typeColors } from "./constants";
import { TemplateRow, WeekInstance } from "./types";

/* ---------- Quick Add (shared) ---------- */
export function QuickAddModal({
  open,
  onOpenChange,
  slot, // { day, hour } | { dateISO, hour }
  onCreateOne,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slot:
    | { day: number; hour: number }
    | { dateISO: string; hour: number }
    | null;
  onCreateOne: (
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

  const isTemplateSlot = slot && "day" in slot!;
  const whenText = slot
    ? isTemplateSlot
      ? `Hora: ${String((slot as any).hour).padStart(2, "0")}:00 • Día: ${
          weekdayShort[(slot as any).day]
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

/* ---------- Series (shared) ---------- */
export function SeriesModal({
  open,
  onOpenChange,
  onCreate,
  context,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context: "structure" | "week";
  onCreate: (p: {
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
          {/* type/name */}
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
            />
          </div>

          {/* coach/zone */}
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

          {/* duration/capacity */}
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

          {/* start/end hours */}
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
                <span>{weekdayShort[d]}</span>
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
