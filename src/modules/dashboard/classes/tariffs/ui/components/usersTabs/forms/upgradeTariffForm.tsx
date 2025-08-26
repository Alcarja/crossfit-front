"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { z } from "zod";
import { useMemo, useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Ticket,
  GaugeCircle,
  CircleDollarSign,
  CalendarDays,
  ShieldCheck,
  Info,
  InfoIcon,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

/* ---------- schema ---------- */
const schema = z.object({
  toPlanId: z.string().min(1, "Selecciona un plan"),
  commissionPct: z
    .preprocess((v) => (v === "" ? undefined : Number(v)), z.number().min(0))
    .optional(),
  commissionAmount: z.string().optional(),
  note: z.string().max(200).optional(),
  paymentMethod: z.enum(["card", "cash"]),
});

// ✅ Explicit type based on expected output shape
type UpgradeForm = {
  toPlanId: string;
  commissionPct?: number;
  commissionAmount?: string;
  note?: string;
  paymentMethod: "card" | "cash";
};

/* ---------- helpers ---------- */
function eurosToCents(input?: string): number | undefined {
  if (!input) return undefined;
  const normalized = input.replace(",", ".").trim();
  if (!normalized) return undefined;
  const n = Number(normalized);
  if (!isFinite(n)) return undefined;
  return Math.max(0, Math.round(n * 100));
}

function money(cents?: number | null, currency = "€") {
  if (cents == null) return "-";
  return `${(cents / 100).toFixed(2)}${currency}`;
}

// 1) Add this helper at the top (next to money/eurosToCents)
function getPriceCents(plan: any): number {
  if (!plan) return 0;

  const toNum = (v: any) => {
    const n = Number(v);
    return v != null && !Number.isNaN(n) ? n : null;
  };

  // values already in cents
  for (const v of [
    plan.priceCents,
    plan.monthlyPriceCents,
    plan.amountCents,
    plan.amount_in_cents,
    plan.price_in_cents,
  ]) {
    const n = toNum(v);
    if (n != null) return n;
  }

  // values in euros → convert
  for (const v of [plan.price, plan.amount, plan.monthlyPrice]) {
    const n = toNum(v);
    if (n != null) return Math.round(n * 100);
  }

  return 0;
}

function computePricing({
  curPriceCents,
  toPriceCents,
  commissionPct,
  commissionAmountStr,
}: {
  curPriceCents: number;
  toPriceCents: number;
  commissionPct?: number;
  commissionAmountStr?: string;
}) {
  const baseDiffCents = Math.max(0, toPriceCents - curPriceCents);

  // If a fixed commission is provided (euros string), it overrides the % commission
  const fixed = eurosToCents(commissionAmountStr);
  const pct = Math.max(
    0,
    Math.round(baseDiffCents * ((commissionPct ?? 0) / 100))
  );
  const commissionCents = fixed ?? pct;

  return {
    baseDiffCents,
    commissionCents,
    totalCents: baseDiffCents + commissionCents,
  };
}

/* ---------- component ---------- */
export function UpgradeTariffForm({
  open,
  onOpenChange,
  current,
  allPlans,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  current: any | null;
  allPlans: any[];
  onSubmit: (
    vals: UpgradeForm & {
      pricing: {
        currency: "eur";
        baseDiffCents: number;
        commissionCents: number;
        totalCents: number;
      };
      meta: {
        fromPlanId: number;
        toPlanId: number;
        userId: number;
        userTariffId: number;
      };
    }
  ) => void;
}) {
  const form = useForm<UpgradeForm>({
    resolver: zodResolver(schema) as Resolver<UpgradeForm>,
    defaultValues: {
      commissionPct: 0,
      commissionAmount: "",
      note: "",
      paymentMethod: "cash",
    },
  });

  const hasCurrent = !!current;

  //This gets the current plan
  const curPlanFull = useMemo(() => {
    const currentId = current?.plan?.id;
    if (!currentId) return current?.plan ?? {};
    const found = allPlans.find((p) => String(p.id) === String(currentId));
    return found ?? current?.plan ?? {};
  }, [allPlans, current?.plan]);

  //GOT IT HERE
  const curPriceCents = getPriceCents(curPlanFull);

  const curCap: number | null = curPlanFull?.creditQty ?? null;
  const curMaxDay: number | null = curPlanFull?.maxPerDay ?? null;

  const remainingNow: number | null =
    current?.userTariff?.remainingCredits ?? null;

  const startRaw = current?.userTariff?.startsOn
    ? new Date(current.userTariff.startsOn)
    : null;
  const endRaw = current?.userTariff?.expiresOn
    ? new Date(current.userTariff.expiresOn)
    : null;
  const showRange = isValid(startRaw as any) && isValid(endRaw as any);
  const sameMonth =
    showRange &&
    (startRaw as Date).getMonth() === (endRaw as Date).getMonth() &&
    (startRaw as Date).getFullYear() === (endRaw as Date).getFullYear();
  const range = showRange
    ? sameMonth
      ? `${format(startRaw as Date, "d", { locale: es })}–${format(
          endRaw as Date,
          "d MMM",
          { locale: es }
        )}`
      : `${format(startRaw as Date, "d MMM", { locale: es })} – ${format(
          endRaw as Date,
          "d MMM",
          { locale: es }
        )}`
    : "—";

  // Eligibility & sorting (unconditional useMemo)
  const eligible = useMemo(() => {
    const isSuperiorPlan = (target: any) => {
      const tCap: number | null = target?.creditQty ?? null;
      const tMax: number | null = target?.maxPerDay ?? null;
      if (curCap != null) {
        if (tCap == null) return true; // capped -> unlimited
        return tCap > curCap;
      } else {
        if (tCap == null)
          return curMaxDay != null && tMax != null && tMax > curMaxDay;
        return false;
      }
    };

    const sortPlans = (a: any, b: any) => {
      const aCap = a?.creditQty ?? null;
      const bCap = b?.creditQty ?? null;
      if (aCap != null && bCap == null) return -1;
      if (aCap == null && bCap != null) return 1;
      if (aCap != null && bCap != null) return aCap - bCap;
      const aMax = a?.maxPerDay ?? 0;
      const bMax = b?.maxPerDay ?? 0;
      return aMax - bMax;
    };

    return (allPlans || [])
      .filter((p: any) => p?.isActive)
      .filter((p: any) => p?.id !== curPlanFull?.id) // ✅ use curPlanFull
      .filter((p: any) => isSuperiorPlan(p))
      .sort(sortPlans);
  }, [allPlans, curPlanFull?.id, curCap, curMaxDay]);

  const isAtMax = eligible.length === 0;

  const selectedToId = form.watch("toPlanId");

  const toPlan = useMemo(
    () =>
      selectedToId
        ? eligible.find((p: any) => String(p.id) === String(selectedToId))
        : null,
    [eligible, selectedToId]
  );

  const toPriceCents = getPriceCents(toPlan); // ← normalized target price

  // Auto pricing (unconditional)
  const { baseDiffCents, commissionCents, totalCents } = useMemo(
    () =>
      computePricing({
        curPriceCents,
        toPriceCents, // ← normalized
        commissionPct: form.watch("commissionPct"),
        commissionAmountStr: form.watch("commissionAmount"),
      }),
    [
      curPriceCents,
      toPriceCents,
      form.watch("commissionPct"),
      form.watch("commissionAmount"),
    ]
  );

  useEffect(() => {
    console.log("Current price cents", curPriceCents);
    console.log("Target price cents", toPriceCents);
  }, [curPriceCents, toPriceCents]);

  const disableSubmit = !hasCurrent || isAtMax || !toPlan || baseDiffCents <= 0;

  const maxMsg =
    curCap != null
      ? "Ya estás en el máximo de planes con créditos (el siguiente sería ilimitado con límites diarios iguales o inferiores)."
      : "Ya estás en el máximo de planes ilimitados (no hay uno con mayor reservas por día).";

  const fromPlanId = Number(current?.plan?.id ?? 0);
  const userId = Number(current?.user?.id ?? 0);
  const userTariffId = Number(current?.userTariff?.id ?? 0);

  // if you need the selected target price inside submit, it's fine to compute on the fly
  const handleUpgradeSubmit = React.useCallback(
    (vals: UpgradeForm) => {
      if (!toPlan || !hasCurrent) return;

      const pricing = computePricing({
        curPriceCents,
        toPriceCents: getPriceCents(toPlan),
        commissionPct: vals.commissionPct,
        commissionAmountStr: vals.commissionAmount,
      });

      onSubmit({
        ...vals,
        pricing: { currency: "eur", ...pricing },
        meta: {
          fromPlanId,
          toPlanId: Number(vals.toPlanId),
          userId,
          userTariffId,
        },
      });
    },
    // ✅ only primitives + stable functions
    [
      toPlan,
      hasCurrent,
      curPriceCents,
      fromPlanId,
      userId,
      userTariffId,
      onSubmit,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            Mejorar / Recargar tarifa
          </DialogTitle>
          <DialogDescription>
            Las fechas permanecen iguales. Se cobra la diferencia + comisión.
          </DialogDescription>
        </DialogHeader>

        {/* Current summary */}
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {(curPlanFull as any)?.name ?? "—"}
            </span>
            {(curPlanFull as any)?.type && (
              <Badge variant="gray" className="text-[10px] px-1 py-0.5">
                {(curPlanFull as any).type}
              </Badge>
            )}
            {isAtMax && (
              <Badge variant="green" className="text-[10px] px-1 py-0.5">
                Plan máximo
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> {range}
            </span>
            <span className="inline-flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" /> {remainingNow ?? "∞"} créditos
            </span>
            {curMaxDay != null && (
              <span className="inline-flex items-center gap-1">
                <GaugeCircle className="w-3.5 h-3.5" /> Máx/día: {curMaxDay}
              </span>
            )}
            {curPriceCents > 0 && (
              <span className="inline-flex items-center gap-1">
                <CircleDollarSign className="w-3.5 h-3.5" />
                {`De ${(curPriceCents / 100).toFixed(2)}€ a ${(
                  toPriceCents / 100
                ).toFixed(2)}€`}
                <span className="ml-1 font-medium">
                  · Dif: {money(baseDiffCents)}
                </span>
              </span>
            )}
          </div>
          {isAtMax && (
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {maxMsg}
            </div>
          )}
        </div>

        <Form {...form}>
          <form
            id="upgrade-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(handleUpgradeSubmit)}
          >
            {/* Nuevo plan */}
            <FormField
              control={form.control}
              name="toPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo plan</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!hasCurrent || isAtMax}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isAtMax
                            ? "Ya estás en el plan máximo"
                            : "Selecciona un plan superior"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {eligible.map((p: any) => {
                        const pc = getPriceCents(p);
                        return (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                            {pc ? ` · ${(pc / 100).toFixed(2)}€` : ""}
                            {p.creditQty != null
                              ? ` · ${p.creditQty} créditos`
                              : " · ∞"}
                            {p.creditQty == null && p.maxPerDay != null
                              ? ` · máx/día ${p.maxPerDay}`
                              : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Inline price diff chip */}
                  {toPlan && (
                    <div className="mt-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 bg-muted/30">
                        <CircleDollarSign className="w-3.5 h-3.5" />
                        {`De ${(curPriceCents / 100).toFixed(2)}€ a ${(
                          toPriceCents / 100
                        ).toFixed(2)}€`}
                        <span className="ml-1 font-medium">
                          · Dif: {money(baseDiffCents)}
                        </span>
                      </span>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comisión */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center flex-wrap gap-3">
                <FormField
                  control={form.control}
                  name="commissionPct"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Comisión (%)</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="decimal"
                          placeholder="p.ej. 10"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          disabled={!toPlan || !hasCurrent || isAtMax}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commissionAmount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Comisión fija (€)</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="decimal"
                          placeholder="p.ej. 4.50"
                          {...field}
                          disabled={!toPlan || !hasCurrent || isAtMax}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-1 pl-1 pt-1 text-muted-foreground text-xs italic">
                <InfoIcon size={12} />
                <span>Si incluyes ambas comisiones, la fija prevalece.</span>
              </div>
            </div>

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

            {/* Resumen cobro */}
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-xs",
                !toPlan ? "bg-muted/40" : "bg-muted/20"
              )}
            >
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Info className="w-3.5 h-3.5" />
                Resumen del cobro
              </div>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="opacity-80">Diferencia de precio</span>
                <span className="text-right font-medium">
                  {money(baseDiffCents)}
                </span>
                <span className="opacity-80">Comisión</span>
                <span className="text-right font-medium">
                  {money(commissionCents)}
                </span>
                <span className="opacity-80">Total a cobrar</span>
                <span className="text-right font-semibold">
                  {money(totalCents)}
                </span>
              </div>
              {toPlan && baseDiffCents <= 0 && (
                <p className="mt-1 text-[11px] text-destructive">
                  El plan seleccionado no incrementa el precio base.
                </p>
              )}
            </div>

            {/* Nota */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Motivo / detalle interno"
                      {...field}
                      disabled={!hasCurrent || isAtMax}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="upgrade-form"
            className="w-auto"
            disabled={disableSubmit}
            aria-disabled={disableSubmit}
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5" />
            Actualizar tarifa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
