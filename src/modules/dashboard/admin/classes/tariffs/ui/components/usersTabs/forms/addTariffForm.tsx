import { CalendarIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

const dateRangeSchema = z
  .object({
    from: z.date().optional(),
    to: z.date().optional(),
  })
  .refine((r) => r.from && r.to, {
    message: "Selecciona un periodo válido",
    path: ["from"], // attach the error to something inside the object
  })
  .transform((r) => ({ from: r.from as Date, to: r.to as Date }));

const addTariffFormSchema = z.object({
  planId: z.string().min(1, "Selecciona un plan"),
  dateRange: dateRangeSchema,
  remainingCredits: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === "" || !Number.isNaN(Number(v)), {
      message: "Debe ser un número",
    }),
  paymentMethod: z.string(),
  note: z.string().max(100).optional(),
  collectWhen: z.enum(["now", "later"]),
  graceDays: z.number().min(1).max(14).optional(),
});

type FormInput = z.input<typeof addTariffFormSchema>; // from?: Date; to?: Date
type FormData = z.output<typeof addTariffFormSchema>;

export function AddTariffForm({
  tariffOptions,
  bookedRanges,
  onSubmit,
}: {
  tariffOptions: {
    value: string;
    label: string;
    creditQty: number | null;
    maxPerDay: number | null;
  }[];
  bookedRanges: { from: Date; to: Date }[];
  onSubmit: (data: FormData) => void;
}) {
  const form = useForm<FormInput>({
    resolver: zodResolver(addTariffFormSchema),
    defaultValues: {
      planId: "",
      dateRange: { from: undefined, to: undefined },
      paymentMethod: "cash",
      collectWhen: "now",
      graceDays: 3,
    },
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedPlanId = watch("planId");
  const selectedPlan = tariffOptions.find((t) => t.value === selectedPlanId);
  const dateRange = watch("dateRange");

  function isDateInRanges(date: Date, ranges: { from: Date; to: Date }[]) {
    const d = startOfDay(date).getTime();
    for (const r of ranges) {
      const from = startOfDay(r.from).getTime();
      const to = startOfDay(r.to).getTime();
      if (d >= from && d <= to) return true;
    }
    return false;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit((values) => {
          onSubmit(values as FormData);
        })}
        className="space-y-4 text-sm"
      >
        {" "}
        <div>
          <Label>Plan</Label>
          <Select onValueChange={(val) => setValue("planId", val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un plan" />
            </SelectTrigger>
            <SelectContent>
              {tariffOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.planId && (
            <p className="text-xs text-destructive mt-1">
              {errors.planId.message}
            </p>
          )}
        </div>
        <div>
          <Label>Periodo</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy", { locale: es })} –{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy", { locale: es })
                  )
                ) : (
                  <span>Selecciona una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 pointer-events-auto"
              align="start"
            >
              <Calendar
                locale={es}
                mode="range"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                selected={dateRange as any}
                onSelect={(range) =>
                  setValue("dateRange", range as FormInput["dateRange"], {
                    shouldValidate: true,
                  })
                }
                disabled={(date) => isDateInRanges(date, bookedRanges)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {errors.dateRange && (
            <p className="text-xs text-destructive mt-1">Periodo inválido</p>
          )}
        </div>
        {selectedPlan && selectedPlan.creditQty !== null && (
          <div>
            <Label>Reservas restantes</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={watch("remainingCredits") ?? ""}
              onChange={(e) =>
                setValue("remainingCredits", e.target.value, {
                  shouldValidate: true,
                })
              }
              className="mt-1"
            />
            {errors.remainingCredits && (
              <p className="text-xs text-destructive mt-1">
                {errors.remainingCredits.message as string}
              </p>
            )}
          </div>
        )}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de pago</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="collectWhen"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuándo cobrar</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el momento del cobro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Cobrar ahora</SelectItem>
                  <SelectItem value="later">Cobrar más tarde</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* GRACIA (solo si later) */}
        {form.watch("collectWhen") === "later" && (
          <FormField
            control={form.control}
            name="graceDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Días de gracia (acceso provisional)</FormLabel>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={14}
                  className="mt-1"
                  value={field.value != null ? String(field.value) : ""} // string
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? undefined : Number(v)); // number | undefined
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El usuario tendrá acceso inmediato durante {field.value ?? 3}{" "}
                  días mientras el pago queda pendiente.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {/* Notas */}
        <div>
          <Label>Notas</Label>
          <Input
            placeholder="Ej. Pagado en efectivo"
            value={watch("note") ?? ""}
            onChange={(e) => setValue("note", e.target.value)}
            className="mt-1"
          />
          {errors.note && (
            <p className="text-xs text-destructive mt-1">
              {errors.note.message as string}
            </p>
          )}
        </div>
        {bookedRanges?.length > 0 && (
          <Card className="bg-muted/30 border-muted/50">
            <CardContent className="text-xs py-3 text-muted-foreground space-y-1">
              <p className="font-medium">Periodos ya ocupados:</p>
              <ul className="list-disc list-inside">
                {bookedRanges.map((r, i) => (
                  <li key={i}>
                    {format(r.from, "dd MMM", { locale: es })} –{" "}
                    {format(r.to, "dd MMM yyyy", { locale: es })}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        <Button type="submit" className="w-full">
          Asignar tarifa
        </Button>
      </form>
    </Form>
  );
}
