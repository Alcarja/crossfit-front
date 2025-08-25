import { Clock4, Ticket, CalendarIcon } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

const addTariffFormSchema = z.object({
  userId: z.string().min(1, "Selecciona un usuario"),
  planId: z.string().min(1, "Selecciona un plan"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

type FormData = z.infer<typeof addTariffFormSchema>;

export function AddTariffForm({
  userOptions,
  tariffOptions,
  bookedRanges,
  onSubmit,
}: {
  userOptions: { value: string; label: string }[];
  tariffOptions: {
    value: string;
    label: string;
    creditQty: number | null;
    maxPerDay: number | null;
  }[];
  bookedRanges: { from: Date; to: Date }[];
  onSubmit: (data: FormData) => void;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(addTariffFormSchema),
    defaultValues: {
      userId: "",
      planId: "",
      dateRange: {
        from: undefined,
        to: undefined,
      },
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
      <div>
        <Label>Usuario</Label>
        <Select onValueChange={(val) => setValue("userId", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un atleta" />
          </SelectTrigger>
          <SelectContent>
            {userOptions.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.userId && (
          <p className="text-xs text-destructive mt-1">
            {errors.userId.message}
          </p>
        )}
      </div>

      <div>
        <Label>Plan</Label>
        <Select onValueChange={(val) => setValue("planId", val)}>
          <SelectTrigger>
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
        <Label>Período</Label>
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
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              locale={es}
              mode="range"
              selected={dateRange}
              onSelect={(range) => setValue("dateRange", range!)}
              disabled={(date) => isDateInRanges(date, bookedRanges)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {errors.dateRange && (
          <p className="text-xs text-destructive mt-1">Período inválido</p>
        )}
      </div>

      {/* Optional Tariff Info */}
      {selectedPlan && selectedPlan.creditQty !== null && (
        <Card className="border-muted/40 bg-muted/10">
          <CardContent className="py-3 px-4 text-xs text-muted-foreground">
            <p>
              <Ticket className="inline w-3 h-3 mr-1 text-primary" />
              <strong>Créditos:</strong> {selectedPlan.creditQty}
            </p>
            {selectedPlan.maxPerDay && (
              <p>
                <Clock4 className="inline w-3 h-3 mr-1 text-primary" />
                <strong>Máx por día:</strong> {selectedPlan.maxPerDay}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {bookedRanges?.length > 0 && (
        <Card className="bg-muted/30 border-muted/50">
          <CardContent className="text-xs py-3 text-muted-foreground space-y-1">
            <p className="font-medium">Períodos ya ocupados:</p>
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
  );
}
