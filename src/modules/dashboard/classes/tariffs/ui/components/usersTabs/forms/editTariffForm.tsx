"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from "react";
import { parseISO, isValid, startOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Your search-select component
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchSelectDropdown } from "@/components/web/searchSelectDropdown";
import { useForm } from "react-hook-form";

const editTariffSchema = z.object({
  planId: z.number().int().positive(),
  startsOn: z.date(),
  customExpiresOn: z.date().nullable().optional(),
  // keep it as a string in the form; validate if present
  remainingCredits: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "" || !Number.isNaN(Number(v)), {
      message: "Debe ser un número",
    }),
  note: z.string().optional(),
});

type EditTariffFormRaw = z.infer<typeof editTariffSchema>;

type SubmitPayload = {
  id: number;
  planId: number;
  startsOn: Date;
  customExpiresOn: Date | null;
  note?: string | null;
  remainingCredits?: number | null;
};

type EditTariffFormProps = {
  editingTariff: any | null;
  tariffOptions: {
    value: string;
    label: string;
    creditQty: number | null;
    maxPerDay: number | null;
  }[];
  bookedRanges: { id: number; from: Date; to: Date }[];
  onSubmit: (payload: SubmitPayload) => void; // <-- use onSubmit
  onDelete: (id: number) => void;
  onCancel: () => void;
};

export function EditTariffForm({
  editingTariff,
  tariffOptions,
  bookedRanges,
  onSubmit,
  onDelete,
  onCancel,
}: EditTariffFormProps) {
  const selfId = editingTariff.userTariff.id;

  const safeDate = (v: string | Date | null | undefined) => {
    if (!v) return undefined;
    const d = typeof v === "string" ? parseISO(v) : new Date(v);
    return isValid(d) ? d : undefined;
  };

  const defaultStartsOn = safeDate(editingTariff.userTariff.startsOn);
  const defaultCustomExpiresOn =
    safeDate(editingTariff.userTariff.customExpiresOn) ??
    safeDate(editingTariff.userTariff.expiresOn);

  // Disable any day inside ranges EXCEPT this tariff’s own period
  const isDateBlocked = (date: Date) => {
    const d = startOfDay(date).getTime();
    for (const r of bookedRanges) {
      if (Number(r.id) === Number(selfId)) continue;
      const from = startOfDay(r.from).getTime();
      const to = startOfDay(r.to).getTime();
      if (d >= from && d <= to) return true;
    }
    return false;
  };

  const form = useForm<EditTariffFormRaw>({
    resolver: zodResolver(editTariffSchema),
    defaultValues: {
      planId: Number(editingTariff.plan?.id),
      startsOn: defaultStartsOn!,
      customExpiresOn: defaultCustomExpiresOn ?? null,
      // stringify current value for the input
      remainingCredits:
        editingTariff.userTariff.remainingCredits != null
          ? String(editingTariff.userTariff.remainingCredits)
          : "", // keep empty string instead of null
      note: editingTariff.userTariff.note ?? "",
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    reset({
      planId: Number(editingTariff.plan?.id),
      startsOn: safeDate(editingTariff.userTariff.startsOn)!,
      customExpiresOn:
        safeDate(editingTariff.userTariff.customExpiresOn) ??
        safeDate(editingTariff.userTariff.expiresOn) ??
        null,
      remainingCredits:
        editingTariff.userTariff.remainingCredits != null
          ? String(editingTariff.userTariff.remainingCredits)
          : "", // ✅ string/empty string      note: editingTariff.userTariff.note ?? "",
    });
  }, [editingTariff, reset]);

  const planId = watch("planId");
  const selectedPlan = useMemo(
    () => tariffOptions.find((t) => Number(t.value) === Number(planId)),
    [tariffOptions, planId]
  );
  const shouldShowCredits = selectedPlan && selectedPlan.creditQty !== null;

  const submit = (values: EditTariffFormRaw) => {
    const rc =
      values.remainingCredits == null || values.remainingCredits === ""
        ? null
        : Number(values.remainingCredits);

    onSubmit({
      id: selfId!,
      planId: Number(values.planId),
      startsOn: values.startsOn,
      customExpiresOn: values.customExpiresOn ?? null,
      note: values.note ?? null,
      remainingCredits: Number.isNaN(rc) ? null : rc,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(submit, (errors) => {
          console.log("❌ EditTariffForm validation errors:", errors);
        })}
        className="space-y-6"
      >
        {" "}
        {/* PLAN */}
        <FormField
          control={control}
          name="planId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarifa</FormLabel>
              <FormControl>
                <SearchSelectDropdown
                  options={tariffOptions}
                  value={field.value == null ? "" : String(field.value)}
                  onValueChange={(v: any) => field.onChange(Number(v))}
                  placeholder="Search and select a tariff"
                />
              </FormControl>
              {selectedPlan && selectedPlan.creditQty !== null && (
                <FormDescription>
                  Plan con límite — créditos: {selectedPlan.creditQty}
                  {selectedPlan.maxPerDay
                    ? ` · máx/día: ${selectedPlan.maxPerDay}`
                    : ""}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {/* STARTS ON */}
        <FormField
          control={control}
          name="startsOn"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Empieza en</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-auto pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Elige una fecha</span>
                      )}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(d) => d && field.onChange(d)}
                    disabled={isDateBlocked}
                    captionLayout="dropdown"
                    startMonth={new Date(2024, 0)}
                    locale={{
                      ...es,
                      options: { ...es.options, weekStartsOn: 1 },
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Días sombreados no disponibles (ya hay otra tarifa).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* CUSTOM EXPIRES ON */}
        <FormField
          control={control}
          name="customExpiresOn"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Termina en (opcional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-auto pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ?? undefined}
                    onSelect={(d) => field.onChange(d ?? null)}
                    disabled={isDateBlocked}
                    captionLayout="dropdown"
                    startMonth={new Date(2024, 0)}
                    locale={{
                      ...es,
                      options: { ...es.options, weekStartsOn: 1 },
                    }}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Si no seleccionas fecha de fin, se calculará según las reglas
                del plan (ej. +1 mes).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* REMAINING CREDITS */}
        {shouldShowCredits && (
          <FormField
            control={control}
            name="remainingCredits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reservas restantes</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Si el plan tiene límite de reservas, ajusta el remanente.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {/* NOTE */}
        <FormField
          control={control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Pagado en efectivo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            Guardar cambios
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="delete"
            onClick={() => onDelete(selfId)}
          >
            Eliminar
          </Button>
        </div>
      </form>
    </Form>
  );
}
