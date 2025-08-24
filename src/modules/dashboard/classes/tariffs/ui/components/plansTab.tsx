/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import {
  Edit,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Tag,
  TicketPercent,
  Trash2,
} from "lucide-react";
import Section from "./section";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useEffect, useMemo, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllBonoTariffs,
  useAllMonthlyTariffs,
  useCreateBonoTariff,
  useCreateMonthlyTariff,
  useUpdateBonoTariff,
  useUpdateMonthlyTariff,
} from "@/app/queries/tariffs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ──────────────────────────────────────────────────────────────────────────
   Constants & Types
   ────────────────────────────────────────────────────────────────────────── */

export const CLASS_TYPES = [
  "WOD",
  "Gymnastics",
  "Weightlifting",
  "Endurance",
  "Open Box",
  "Foundations",
  "Kids",
] as const;
export type ClassType = (typeof CLASS_TYPES)[number];

export type WeeklyRule = {
  classType: ClassType;
  allowed: boolean;
  maxPerWeek: number | null;
};

export type HasWeeklyRules = { weeklyRules: WeeklyRule[] };

const WeeklyRuleSchema = z.object({
  classType: z.enum(CLASS_TYPES),
  allowed: z.boolean(),
  maxPerWeek: z.number().int().positive().nullable(),
});

export const createTariffFormSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(50),
  price: z.number().min(0, "Debe ser mayor o igual a 0"),
  limitType: z.enum(["unlimited", "limited"]),
  creditQty: z.number().int().positive().nullable().optional(),
  maxPerDay: z.number().int().positive().nullable().optional(),
  isActive: z.boolean(),
  weeklyRules: z.array(WeeklyRuleSchema),
});

export const createBonoFormSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(50),
  price: z.number().min(0, "Debe ser mayor o igual a 0"),
  creditQty: z.number().int().positive().nullable(),
  isActive: z.boolean(),
});

export type CreateTariffFormValues = z.infer<typeof createTariffFormSchema>;
export type CreateBonoFormValues = z.infer<typeof createBonoFormSchema>;

type Tariff = {
  id: number;
  name: string;
  price: string;
  creditQty: number | null;
  maxPerDay: number | null;
  isActive: boolean;
  rules?: {
    classType: ClassType;
    isAllowed: boolean;
    maxPerWeek: number | null;
  }[];
  weeklyRules?: WeeklyRule[];
};

type Bono = {
  id: number;
  name: string;
  price: string;
  creditQty: number | null;
  isActive: boolean;
};

/* ──────────────────────────────────────────────────────────────────────────
   Utilities (pure)
   ────────────────────────────────────────────────────────────────────────── */

const buildDefaultWeeklyRules = (): WeeklyRule[] =>
  CLASS_TYPES.map((ct) => ({ classType: ct, allowed: true, maxPerWeek: null }));

const hasWeeklyLimits = (
  rules?: Pick<WeeklyRule, "allowed" | "maxPerWeek">[]
) => (rules ?? []).some((r) => !r.allowed || r.maxPerWeek !== null);

const getExceptions = (rules?: WeeklyRule[]) =>
  (rules ?? []).filter((r) => !r.allowed || r.maxPerWeek !== null);

const toExceptionPayload = (rules?: WeeklyRule[]) =>
  (rules ?? [])
    .filter((r) => !r.allowed || r.maxPerWeek != null)
    .map((r) => ({
      classType: r.classType,
      isAllowed: r.allowed,
      maxPerWeek: r.maxPerWeek ?? null,
    }));

/* ──────────────────────────────────────────────────────────────────────────
   Form Helpers (impure – operate on RHF)
   ────────────────────────────────────────────────────────────────────────── */

function clearWeeklyLimits(form: UseFormReturn<any>) {
  form.setValue("weeklyRules", buildDefaultWeeklyRules(), {
    shouldDirty: true,
    shouldValidate: true,
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Reusable UI Subcomponents
   ────────────────────────────────────────────────────────────────────────── */

// Generic row actions for Tariff/Bono
type RowActionsProps<T> = {
  item: T;
  onOpen?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
};
function RowActions<T>({ item, onOpen, onEdit, onDelete }: RowActionsProps<T>) {
  return (
    <DropdownMenu onOpenChange={(open) => open && onOpen?.(item)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-auto">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={() => onEdit?.(item)}>
          <Edit className="h-4 w-4" /> Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-red-600 focus:text-red-600"
          onClick={() => onDelete?.(item)}
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Weekly limits editor (shared by create & edit)
function WeeklyRulesBlock({ form }: { form: UseFormReturn<HasWeeklyRules> }) {
  const rules = (useWatch({ control: form.control, name: "weeklyRules" }) ??
    []) as WeeklyRule[];

  return (
    <div className="space-y-2.5">
      {rules.map((_, i) => {
        const allowed = form.getValues(`weeklyRules.${i}.allowed`);
        const name = form.getValues(`weeklyRules.${i}.classType`);
        return (
          <div
            key={name}
            className={cn(
              "flex items-center gap-3 rounded-md border p-2 sm:p-2.5 transition-colors",
              allowed
                ? "border-l-4 border-l-emerald-500"
                : "border-l-4 border-l-rose-500"
            )}
          >
            <div className="flex-1 min-w-0 text-sm font-medium truncate">
              {name}
            </div>

            <FormField
              control={form.control}
              name={`weeklyRules.${i}.allowed`}
              render={({ field }) => (
                <div className="flex items-center">
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(v) => {
                      field.onChange(v);
                      if (!v) {
                        form.setValue(`weeklyRules.${i}.maxPerWeek`, null, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    aria-label="Permitir este tipo de clase"
                    className="scale-90"
                  />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name={`weeklyRules.${i}.maxPerWeek`}
              render={({ field }) => (
                <div className="flex items-center">
                  {allowed ? (
                    <Input
                      type="number"
                      min={1}
                      placeholder="Máx/sem"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      aria-label="Límite semanal"
                      className="h-8 w-[110px] text-[13px]"
                    />
                  ) : (
                    <div className="h-8 w-24" aria-hidden />
                  )}
                </div>
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

// Limit type fields (shared by create & edit)
function LimitTypeFields({
  form,
  ids,
}: {
  form: UseFormReturn<CreateTariffFormValues>;
  ids: { unlimited: string; limited: string };
}) {
  const limitType = form.watch("limitType");

  // One effect to keep mutually exclusive fields clean
  useEffect(() => {
    if (limitType === "unlimited") {
      form.setValue("creditQty", null, { shouldValidate: true });
    } else {
      form.setValue("maxPerDay", null, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limitType]);

  return (
    <>
      <FormField
        control={form.control}
        name="limitType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de uso</FormLabel>
            <FormControl>
              <RadioGroup
                className="flex gap-4"
                value={field.value}
                onValueChange={(v) =>
                  field.onChange(v as "unlimited" | "limited")
                }
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="unlimited" id={ids.unlimited} />
                  <label htmlFor={ids.unlimited} className="text-sm">
                    Ilimitada
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="limited" id={ids.limited} />
                  <label htmlFor={ids.limited} className="text-sm">
                    Limitada
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {limitType === "limited" ? (
        <FormField
          control={form.control}
          name="creditQty"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Créditos mensuales</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value === null ? "" : field.value}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name="maxPerDay"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Máx. clases por día</FormLabel>
              <Select
                value={field.value == null ? "" : String(field.value)}
                onValueChange={(v) =>
                  field.onChange(v === "none" ? null : Number(v))
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Número por día" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 por día</SelectItem>
                  <SelectItem value="2">2 por día</SelectItem>
                  <SelectItem value="3">3 por día</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}

// Limits switch card (shared)
function LimitsSwitch({
  checked,
  onCheckedChange,
  label = "Límites por tipo de clase",
  subtitle = (
    <>
      Activa para definir límites{" "}
      <span className="font-bold underline text-black text-md">semanales</span>{" "}
      por tipo de clase.
    </>
  ),
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <FormLabel>{label}</FormLabel>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label="Mostrar límites por clase"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────────────────── */

const PlansTab = () => {
  const queryClient = useQueryClient();

  // UI state
  const [showLimits, setShowLimits] = useState(false); // create monthly
  const [showLimitsEdit, setShowLimitsEdit] = useState(false); // edit monthly
  const [openCreateNewTariff, setOpenCreateNewTariff] = useState(false);
  const [openEditTariff, setOpenEditTariff] = useState(false);
  const [openCreateNewBono, setOpenCreateNewBono] = useState(false);
  const [openEditBono, setOpenEditBono] = useState(false);

  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [selectedBono, setSelectedBono] = useState<Bono | null>(null);

  // Forms
  const form = useForm<CreateTariffFormValues>({
    resolver: zodResolver(createTariffFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      limitType: "unlimited",
      creditQty: null,
      maxPerDay: null,
      isActive: true,
      weeklyRules: buildDefaultWeeklyRules(),
    },
  });

  const editForm = useForm<CreateTariffFormValues>({
    resolver: zodResolver(createTariffFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      limitType: "unlimited",
      creditQty: null,
      maxPerDay: null,
      isActive: true,
      weeklyRules: buildDefaultWeeklyRules(),
    },
  });

  const bonoForm = useForm<CreateBonoFormValues>({
    resolver: zodResolver(createBonoFormSchema),
    defaultValues: { name: "", price: 0, creditQty: 0, isActive: true },
  });

  const editBonoForm = useForm<CreateBonoFormValues>({
    resolver: zodResolver(createBonoFormSchema),
    defaultValues: { name: "", price: 0, creditQty: 0, isActive: true },
  });

  const DEFAULT_MONTHLY_VALUES: CreateTariffFormValues = {
    name: "",
    price: 0,
    limitType: "unlimited",
    creditQty: null,
    maxPerDay: null,
    isActive: true,
    weeklyRules: buildDefaultWeeklyRules(),
  };

  function resetCreateMonthlyUI() {
    // fresh weeklyRules array each time
    const fresh = {
      ...DEFAULT_MONTHLY_VALUES,
      weeklyRules: buildDefaultWeeklyRules(),
    };
    form.reset(fresh, { keepDirty: false, keepErrors: false });
    setShowLimits(false);
  }

  function resetEditMonthlyUI() {
    const fresh = {
      ...DEFAULT_MONTHLY_VALUES,
      weeklyRules: buildDefaultWeeklyRules(),
    };
    editForm.reset(fresh, { keepDirty: false, keepErrors: false });
    setShowLimitsEdit(false);
    setSelectedTariff(null); // avoids stale selection on next open
  }

  /* ── Effects: hydrate edit forms ─────────────────────────────────────── */

  useEffect(() => {
    if (!selectedTariff) return;

    const limitType: "limited" | "unlimited" =
      selectedTariff.creditQty != null ? "limited" : "unlimited";

    editForm.reset(
      {
        name: selectedTariff.name,
        price: Number(selectedTariff.price),
        limitType,
        creditQty: selectedTariff.creditQty,
        maxPerDay: selectedTariff.maxPerDay,
        isActive: selectedTariff.isActive,
        weeklyRules: selectedTariff.weeklyRules?.length
          ? selectedTariff.weeklyRules
          : buildDefaultWeeklyRules(),
      },
      { keepValues: false, keepDirty: false, keepErrors: false }
    );

    setShowLimitsEdit(hasWeeklyLimits(selectedTariff.weeklyRules));
  }, [selectedTariff, editForm]);

  useEffect(() => {
    if (!selectedBono) return;
    editBonoForm.reset({
      name: selectedBono.name,
      price: Number(selectedBono.price),
      creditQty: selectedBono.creditQty,
      isActive: selectedBono.isActive,
    });
  }, [selectedBono, editBonoForm]);

  /* ── Queries ─────────────────────────────────────────────────────────── */

  const { data: allMonthlyTariffs } = useAllMonthlyTariffs();
  const { data: allBonoTariffs } = useAllBonoTariffs();

  /* ── Mutations & Submit Handlers ─────────────────────────────────────── */

  const { mutate: createMonthly } = useCreateMonthlyTariff();
  const { mutate: updateMonthly } = useUpdateMonthlyTariff();
  const { mutate: createBono } = useCreateBonoTariff();
  const { mutate: updateBono } = useUpdateBonoTariff();

  const handleCreateMonthly = (values: CreateTariffFormValues) => {
    const weeklyRules = toExceptionPayload(values.weeklyRules);
    const payload = {
      name: values.name.trim(),
      price: Number(values.price),
      isActive: !!values.isActive,
      creditQty:
        values.limitType === "limited" ? values.creditQty ?? null : null,
      maxPerDay:
        values.limitType === "unlimited" ? values.maxPerDay ?? null : null,
      ...(weeklyRules.length ? { weeklyRules } : {}),
    };

    createMonthly(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["allMonthlyTariffs"] });
        toast.success("New tariff saved!");
        form.reset({
          name: "",
          price: 0,
          limitType: "unlimited",
          creditQty: null,
          maxPerDay: null,
          isActive: true,
          weeklyRules: buildDefaultWeeklyRules(),
        });
        setShowLimits(false);
        setOpenCreateNewTariff(false);
      },
      onError: () => {
        console.error("Error creating new tariff");
        toast.error("Error creating new tariff");
      },
    });
  };

  const handleEditMonthly = (values: CreateTariffFormValues) => {
    if (!selectedTariff) return;

    const weeklyRules = toExceptionPayload(values.weeklyRules);
    const data = {
      name: values.name.trim(),
      price: Number(values.price),
      isActive: !!values.isActive,
      creditQty:
        values.limitType === "limited" ? values.creditQty ?? null : null,
      maxPerDay:
        values.limitType === "unlimited" ? values.maxPerDay ?? null : null,
      weeklyRules, // authoritative
    };

    updateMonthly(
      { id: selectedTariff.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allMonthlyTariffs"] });
          toast.success("Tarifa actualizada");
          editForm.reset({
            name: "",
            price: 0,
            limitType: "unlimited",
            creditQty: null,
            maxPerDay: null,
            isActive: true,
            weeklyRules: buildDefaultWeeklyRules(),
          });
          setShowLimitsEdit(false);
          setOpenEditTariff(false);
        },
        onError: () => {
          toast.error("Error actualizando tarifa");
        },
      }
    );
  };

  const handleCreateBono = (values: CreateBonoFormValues) => {
    createBono(
      {
        name: values.name.trim(),
        price: Number(values.price),
        isActive: !!values.isActive,
        creditQty: values.creditQty || 0,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allBonoTariffs"] });
          toast.success("New bono saved!");
          bonoForm.reset({ name: "", price: 0, creditQty: 0, isActive: true });
          setOpenCreateNewBono(false);
        },
        onError: () => {
          console.error("Error creating new bono");
          toast.error("Error creating new bono");
        },
      }
    );
  };

  const handleEditBono = (values: CreateBonoFormValues) => {
    if (!selectedBono) return;

    updateBono(
      {
        id: selectedBono.id,
        data: {
          name: values.name.trim(),
          price: Number(values.price),
          isActive: !!values.isActive,
          creditQty: values.creditQty,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allBonoTariffs"] });
          toast.success("Bono actualizado");
          editBonoForm.reset({
            name: "",
            price: 0,
            creditQty: 0,
            isActive: true,
          });
          setOpenEditBono(false);
        },
        onError: () => {
          toast.error("Error actualizando bono");
        },
      }
    );
  };

  /* ── Derived helpers for table rendering ─────────────────────────────── */

  const monthlyRows = useMemo(
    () => allMonthlyTariffs?.tariffs ?? [],
    [allMonthlyTariffs]
  );
  const bonoRows = useMemo(
    () => allBonoTariffs?.tariffs ?? [],
    [allBonoTariffs]
  );

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="grid gap-6">
      {/* Tarifas mensuales */}
      <Section icon={Tag} title="Tarifas (Mensuales)">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Filtros */}
          <div className="flex w-full md:max-w-md items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input placeholder="Search" className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <Dialog
              open={openCreateNewTariff}
              onOpenChange={(open) => {
                setOpenCreateNewTariff(open);
                if (!open) resetCreateMonthlyUI(); // <- close -> reset + hide limits
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 w-auto">
                  <Plus className="h-4 w-4" /> Añadir Tarifa
                </Button>
              </DialogTrigger>
              <DialogContent className="h-auto max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear nueva tarifa</DialogTitle>
                  <DialogDescription>
                    Define nombre, precio, créditos mensuales y límite por día.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleCreateMonthly)}
                    className="space-y-4"
                  >
                    {/* Nombre */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Mensual 13 clases" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Precio */}
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Precio (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={
                                Number.isNaN(field.value as any)
                                  ? 0
                                  : field.value
                              }
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tipo + Fields */}
                    <LimitTypeFields
                      form={form}
                      ids={{ unlimited: "unlimited", limited: "limited" }}
                    />

                    {/* Activa */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Activa</FormLabel>
                            <div className="text-xs text-muted-foreground">
                              Si está desactivada, no aparecerá para asignar a
                              atletas.
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Activar tarifa"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Límites */}
                    <LimitsSwitch
                      checked={showLimits}
                      onCheckedChange={(v) => {
                        setShowLimits(v);
                        if (!v) clearWeeklyLimits(form);
                      }}
                    />
                    {showLimits && (
                      <WeeklyRulesBlock
                        form={form as unknown as UseFormReturn<HasWeeklyRules>}
                      />
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="submit">Crear tarifa</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/*  <Button variant="outline" size="icon" title="Refrescar">
              <RefreshCcw className="h-4 w-4" />
            </Button> */}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Monthly Table */}
        <ScrollArea>
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6 text-left">Nombre</TableHead>
                <TableHead className="w-1/6 text-center">Créditos</TableHead>
                <TableHead className="w-1/6 text-right">Precio</TableHead>
                <TableHead className="w-1/6 text-center">Estado</TableHead>
                <TableHead className="w-1/6 text-center">Límites</TableHead>
                <TableHead className="w-1/6 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {monthlyRows.map((t: Tariff) => {
                const exceptions = getExceptions(t.weeklyRules);
                const hasLimitsRow = exceptions.length > 0;

                return (
                  <TableRow key={t.id} className="align-middle">
                    <TableCell className="w-1/6 truncate">{t.name}</TableCell>

                    <TableCell className="w-1/6 text-center tabular-nums">
                      {t.maxPerDay !== null && t.maxPerDay !== undefined
                        ? `${t.maxPerDay} / día`
                        : t.creditQty ?? "—"}
                    </TableCell>

                    <TableCell className="w-1/6 text-right tabular-nums">
                      {t.price} €
                    </TableCell>

                    <TableCell className="w-1/6 text-center">
                      <Badge variant={t.isActive ? "green" : "gray"}>
                        {t.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>

                    <TableCell className="w-1/6 text-center">
                      {hasLimitsRow ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge
                              variant="gray"
                              className="cursor-pointer whitespace-nowrap"
                            >
                              {exceptions.length} límite
                              {exceptions.length !== 1 ? "s" : ""}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent
                            align="center"
                            side="top"
                            className="p-3 w-72"
                          >
                            <div className="text-sm font-medium mb-2">
                              Límites semanales
                            </div>
                            <div className="space-y-1 max-h-56 overflow-auto">
                              {exceptions.map((r, idx) => (
                                <div
                                  key={`${r.classType}-${idx}`}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="truncate">{r.classType}</div>
                                  <div className="ml-3 text-right">
                                    {r.allowed === false ? (
                                      <span className="text-rose-600">
                                        Bloqueada
                                      </span>
                                    ) : (
                                      <span className="tabular-nums">
                                        máx {r.maxPerWeek}/sem
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Edita para cambiar estos límites.
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    <TableCell className="w-1/6">
                      <div className="flex items-center justify-center">
                        <RowActions<Tariff>
                          item={t}
                          onOpen={(tariff) => setSelectedTariff(tariff)}
                          onEdit={(tariff) => {
                            setSelectedTariff(tariff);
                            setOpenEditTariff(true);
                          }}
                          onDelete={(tariff) => {
                            setSelectedTariff(tariff);
                            // open delete confirm…
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Edit Monthly Dialog */}
        <Dialog
          open={openEditTariff}
          onOpenChange={(open) => {
            setOpenEditTariff(open);
            if (!open) resetEditMonthlyUI(); // <- close -> reset + hide limits
          }}
        >
          {" "}
          <DialogContent className="h-auto max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar tarifa</DialogTitle>
              <DialogDescription>
                Actualiza nombre, precio y límites de la tarifa seleccionada.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEditMonthly)}
                className="space-y-4"
              >
                {/* Nombre */}
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Mensual 13 clases" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Precio */}
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Precio (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={
                            Number.isNaN(field.value as any) ? 0 : field.value
                          }
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo + Fields */}
                <LimitTypeFields
                  form={editForm}
                  ids={{ unlimited: "unlimited_edit", limited: "limited_edit" }}
                />

                {/* Activa */}
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Activa</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Si está desactivada, no aparecerá para asignar a
                          atletas.
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Activar tarifa"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Límites */}
                <LimitsSwitch
                  checked={showLimitsEdit}
                  onCheckedChange={(v) => {
                    setShowLimitsEdit(v);
                    if (!v) clearWeeklyLimits(editForm);
                  }}
                />
                {showLimitsEdit && (
                  <WeeklyRulesBlock
                    form={editForm as unknown as UseFormReturn<HasWeeklyRules>}
                  />
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenEditTariff(false)}
                  >
                    Cancelar
                  </Button>
                  <Button className="w-auto" type="submit">
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Section>

      {/* Bonos */}
      <Section icon={TicketPercent} title="Bonos">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Filtros */}
          <div className="flex w-full md:max-w-md items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input placeholder="Search" className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2">
            <Dialog
              open={openCreateNewBono}
              onOpenChange={setOpenCreateNewBono}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 w-auto">
                  <Plus className="h-4 w-4" /> Añadir Bono
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nuevo bono</DialogTitle>
                  <DialogDescription>
                    Define nombre, precio y créditos mensuales.
                  </DialogDescription>
                </DialogHeader>

                <Form {...bonoForm}>
                  <form
                    onSubmit={bonoForm.handleSubmit(handleCreateBono)}
                    className="space-y-4"
                  >
                    {/* Nombre */}
                    <FormField
                      control={bonoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Bono 13 clases" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Precio */}
                    <FormField
                      control={bonoForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Precio (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={
                                Number.isNaN(field.value as any)
                                  ? 0
                                  : field.value
                              }
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Créditos */}
                    <FormField
                      control={bonoForm.control}
                      name="creditQty"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Créditos mensuales</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              value={field.value === null ? "" : field.value}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Activa */}
                    <FormField
                      control={bonoForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Activa</FormLabel>
                            <div className="text-xs text-muted-foreground">
                              Si está desactivada, no aparecerá para asignar a
                              atletas.
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Activar bono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="submit">Crear bono</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/*  <Button variant="outline" size="icon" title="Refrescar">
              <RefreshCcw className="h-4 w-4" />
            </Button> */}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Bonos Table */}
        <ScrollArea>
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5 text-left">Nombre</TableHead>
                <TableHead className="w-1/5 text-center">Créditos</TableHead>
                <TableHead className="w-1/5 text-right">Precio</TableHead>
                <TableHead className="w-1/5 text-center">Estado</TableHead>
                <TableHead className="w-1/5 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bonoRows.map((t: Bono) => (
                <TableRow key={t.id}>
                  <TableCell className="w-1/5">{t.name}</TableCell>

                  <TableCell className="w-1/5 text-center tabular-nums">
                    {t.creditQty ?? "—"}
                  </TableCell>

                  <TableCell className="w-1/5 text-right tabular-nums">
                    {t.price} €
                  </TableCell>

                  <TableCell className="w-1/5 text-center">
                    <Badge variant={t.isActive ? "green" : "gray"}>
                      {t.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>

                  <TableCell className="w-1/5 text-center">
                    <RowActions<Bono>
                      item={t}
                      onOpen={(bono) => setSelectedBono(bono)}
                      onEdit={(bono) => {
                        setSelectedBono(bono);
                        setOpenEditBono(true);
                      }}
                      onDelete={(bono) => {
                        setSelectedBono(bono);
                        // open delete confirm…
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Edit Bono Dialog */}
        <Dialog open={openEditBono} onOpenChange={setOpenEditBono}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar bono</DialogTitle>
              <DialogDescription>
                Actualiza nombre, precio y créditos del bono seleccionado.
              </DialogDescription>
            </DialogHeader>

            <Form {...editBonoForm}>
              <form
                onSubmit={editBonoForm.handleSubmit(handleEditBono)}
                className="space-y-4"
              >
                {/* Nombre */}
                <FormField
                  control={editBonoForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="8 clases" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Precio */}
                <FormField
                  control={editBonoForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Precio (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={
                            Number.isNaN(field.value as any) ? 0 : field.value
                          }
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Créditos */}
                <FormField
                  control={editBonoForm.control}
                  name="creditQty"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Créditos mensuales</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Activa */}
                <FormField
                  control={editBonoForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Activa</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Si está desactivado, no aparecerá para asignar a
                          atletas.
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Activar bono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenEditBono(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar cambios</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Section>
    </div>
  );
};

export default PlansTab;
