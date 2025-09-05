/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import z from "zod";

import {
  ArrowUpRight,
  CalendarDays,
  CalendarIcon,
  CircleDollarSign,
  Clock4,
  GaugeCircle,
  Hash,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Tag,
  Ticket,
} from "lucide-react";
import Section from "../section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import {
  useAllGroupedActiveOrFutureMonthlyUserTariffs,
  useAllMonthlyTariffs,
  useAssignMonthlyTariff,
  useUpdateUserMonthlyTariff,
  useUpgradeUserTariff,
  useUserFutureTariffs,
  useUserTariffHistory,
} from "@/app/queries/tariffs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SearchSelectDropdown } from "@/components/web/searchSelectDropdown";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createStripePaymentIntent,
  getUserFutureTariffs,
  getUserTariffHistory,
} from "@/app/adapters/api";
import { AddTariffForm } from "./forms/addTariffForm";
import { EditTariffForm } from "./forms/editTariffForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpgradeTariffForm } from "./forms/upgradeTariffForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StripeQRDialog } from "@/components/web/stripeQRDialog";

const addTariffFormSchema = z.object({
  userId: z.number(),
  planId: z.number(),
  startsOn: z.date().optional(),
  customExpiresOn: z.date().optional(),
  remainingCredits: z.string().min(1).max(15).optional(),
  note: z.string().max(100).optional(),
  paymentMethod: z.string(),
  collectWhen: z.enum(["now", "later"]),
  graceDays: z.number().min(0).max(14),
});

const TariffsTab = () => {
  const queryClient = useQueryClient();
  const [qrData, setQrData] = useState<{
    checkoutUrl: string;
    orderId: number;
  } | null>(null);

  const [filter, setFilter] = useState("");
  const [isAddTariffDialogOpen, setIsAddTariffDialogOpen] = useState(false);

  const [isEditTariffDialogOpen, setIsEditTariffDialogOpen] = useState(false);
  const [selectedUserTariffInfo, setSelectedUserTariffInfo] = useState<
    any | null
  >(null);

  const { data: allUsers } = useQuery(usersQueryOptions());
  const { data: allMonthlyTariffs } = useAllMonthlyTariffs();

  const { data: allGroupedActiveMonthlyUserTariffs } =
    useAllGroupedActiveOrFutureMonthlyUserTariffs();

  const selectedUserId = selectedUserTariffInfo?.user?.id;

  // Tariff history for the selected user
  const {
    data: userTariffHistory,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useUserTariffHistory(selectedUserId);

  //Future tariffs for the selected user
  const {
    data: userFutureTariffs,
    isLoading: isFutureLoading,
    error: futureError,
  } = useUserFutureTariffs(selectedUserId);

  const results = allGroupedActiveMonthlyUserTariffs?.results ?? [];

  const selectedRow =
    results.find((r: any) => r?.user?.id === selectedUserId) ?? null;

  const currentTariff = selectedRow?.active ?? null; // active window today

  // Build table rows:
  // - row id = results.user.id (as you requested)
  // - show active info if it exists; otherwise future
  const rows = results.map((r: any) => {
    const primary = r.active ?? r.future ?? null; // prefer active, else future
    return {
      id: r.user?.id, // <-- from user
      name: `${r.user?.name ?? ""} ${r.user?.lastName ?? ""}`.trim(),
      email: r.user?.email ?? "",
      plan: r.active?.plan?.name ?? r.future?.plan?.name ?? "—",
      startsOn: primary?.tariff?.startsOn ?? null,
      expires: primary?.tariff?.expiresOn ?? null,
      status: primary?.tariff?.status ?? null, // optional, useful to display
      tariffId: primary?.tariff?.id ?? null, // if you still need a tariff id
      fullData: r,
    };
  });

  const filteredRows = rows.filter((row: any) => {
    const q = (filter ?? "").toLowerCase();
    return (
      (row.name ?? "").toLowerCase().includes(q) ||
      (row.email ?? "").toLowerCase().includes(q) ||
      (row.plan ?? "").toLowerCase().includes(q)
    );
  });

  // --- pagination state ---
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const pageRows = filteredRows?.slice(start, end);
  const pageCount = Math.ceil(filteredRows?.length / pageSize);

  const userOptions = [
    ...(allUsers?.map((user: any) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  const tariffOptions = [
    ...(allMonthlyTariffs?.tariffs
      ?.filter((t: any) => t.isActive)
      .map((tariff: any) => ({
        value: String(tariff.id),
        label: `${tariff.name}`,
        creditQty: tariff.creditQty,
        maxPerDay: tariff.maxPerDay,
      })) ?? []),
  ];

  /* ADD TARIFFS FORM */
  const addTariffForm = useForm<z.infer<typeof addTariffFormSchema>>({
    resolver: zodResolver(addTariffFormSchema),
    defaultValues: {
      paymentMethod: "cash",
      collectWhen: "now",
      graceDays: 0,
    },
  });

  const planId = addTariffForm.watch("planId"); //Watches the form field
  /* Checks the selected tariff */
  const selectedTariff = tariffOptions.find(
    (t) => Number(t.value) === Number(planId)
  );

  // Show field only if we have a tariff and it has a creditQty
  const shouldShowCredits = selectedTariff && selectedTariff.creditQty !== null;

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const { mutate: assignTariff, mutateAsync: assignTariffAsync } =
    useAssignMonthlyTariff();

  function onSubmitAddTariffForm(values: z.infer<typeof addTariffFormSchema>) {
    const paymentMethod = values.paymentMethod;

    const payload = {
      userId: values.userId,
      planId: values.planId,
      startsOn: values.startsOn ? toYMD(values.startsOn as Date) : undefined,
      customExpiresOn: values.customExpiresOn
        ? toYMD(values.customExpiresOn as Date)
        : undefined,
      remainingCredits:
        values.remainingCredits == null
          ? undefined
          : Number(values.remainingCredits),
      note: values.note || undefined,
      paymentMethod: values.paymentMethod,
      collectWhen: values.collectWhen,
      graceDays: values.graceDays,
    };

    // --- CASH flow: use mutate with callbacks (no await) ---
    if (paymentMethod === "cash") {
      assignTariff(payload, {
        onSuccess: async (_data, variables) => {
          const uid = variables.userId;

          await queryClient.invalidateQueries({
            queryKey: ["allGroupedActiveMonthlyUserTariffs"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["userTariffHistory", uid],
          });
          await queryClient.invalidateQueries({
            queryKey: ["userFutureTariffs", uid],
          });

          toast.success("Tarifa asignada al usuario");
          setIsAddTariffDialogOpen(false);
          addTariffForm.reset();
        },
        onError: (err) => {
          console.error("assignMonthlyTariff failed:", err);
          toast.error("Error al asignar la tarifa al usuario");
        },
      });
      return;
    }

    // --- CARD flow: use mutateAsync + await ---
    if (paymentMethod === "card") {
      (async () => {
        try {
          // 1) Assign tariff & create order (server returns order/payment)
          const result = await assignTariffAsync(payload);
          // Depending on your mutationFn, result may be res.data or AxiosResponse
          const orderId = result?.order?.id ?? result?.data?.order?.id;
          if (!orderId) throw new Error("No se recibió un ID de orden");

          // 2) Create Stripe Checkout session
          const response = await createStripePaymentIntent(orderId);
          console.log("response", response);

          const checkoutUrl = response?.checkoutUrl;
          if (!checkoutUrl) throw new Error("No se recibió URL de pago");

          // 3) Always open QR dialog (no redirect)
          setQrData({ checkoutUrl, orderId });

          toast.success("Tarifa creada. Escanea el QR para pagar con tarjeta.");
        } catch (err) {
          console.error("Stripe payment flow failed", err);
          toast.error("Error al procesar el pago con tarjeta");
        }
      })();
    }
  }

  //Uses the same create function from above
  const onSubmitAddTariffFromRightPane = (values: {
    planId: string;
    dateRange: { from: Date; to: Date };
    remainingCredits?: string;
    note?: string;
    paymentMethod: string;
    collectWhen: string;
    graceDays?: number;
  }) => {
    const userId = Number(selectedUserId ?? currentTariff?.user?.id);
    if (!userId) {
      toast.error("Selecciona un atleta antes de asignar la tarifa");
      return;
    }

    onSubmitAddTariffForm({
      userId,
      planId: Number(values.planId),
      startsOn: values.dateRange.from,
      customExpiresOn: values.dateRange.to,
      remainingCredits: values.remainingCredits,
      paymentMethod: values.paymentMethod,
      note: values.note,
      collectWhen: values.collectWhen,
      graceDays: values.graceDays,
    } as any);
  };

  const [rightPaneMode, setRightPaneMode] = useState<"add" | "edit">("add");
  const [editingTariff, setEditingTariff] = useState<any | null>(null);

  // when clicking edit in Current/Future, do:
  function startEdit(tariff: any) {
    setEditingTariff(tariff); // full { userTariff, plan, user }
    setRightPaneMode("edit");
  }

  // booked ranges for the selected user (active + future)
  function calculateBookedRangesForUser(userId: number) {
    if (!userId) return [];

    const row =
      allGroupedActiveMonthlyUserTariffs?.results?.find(
        (r: any) => r?.user?.id === userId
      ) ?? null;

    if (!row) return [];

    const seen = new Set();
    const tariffs = [row.active?.tariff, row.future?.tariff].filter(Boolean);

    return tariffs
      .filter((t) => t?.id && !seen.has(t.id) && (seen.add(t.id), true))
      .map((t) => ({
        id: t.id, // <-- important
        from: new Date(t.startsOn),
        to: new Date(t.expiresOn),
      }));
  }

  const bookedRanges = calculateBookedRangesForUser(selectedUserId);

  const { mutate: updateTariff } = useUpdateUserMonthlyTariff();

  const toDateOnly = (d: Date | null | undefined) =>
    d ? format(d, "yyyy-MM-dd") : null;

  //Update user tariff from admin, without payment
  const onSubmitEditTariffForm = (values: {
    planId: number;
    startsOn: Date;
    customExpiresOn: Date | null;
    note?: string | null;
    remainingCredits?: number | null;
  }) => {
    const tariffId = Number(editingTariff.tariff.id);
    const userId = Number(editingTariff.tariff.userId);

    const payload = {
      tariffId,
      userId,
      planId: values.planId,
      startsOn: toDateOnly(values.startsOn)!, // ← now "2025-08-26"
      customExpiresOn: toDateOnly(values.customExpiresOn), // ← now "2025-08-30"
      note: values.note ?? null,
      remainingCredits: values.remainingCredits ?? null,
    };

    updateTariff(payload, {
      onSuccess: (_data, variables) => {
        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: ["userTariffHistory", variables.userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["userFutureTariffs", variables.userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["allGroupedActiveMonthlyUserTariffs"],
        });
      },
      onError: (err) => console.error("❌ Error updating tariff:", err),
    });
  };

  // --- Upgrade dialog state ---
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState<any | null>(null);

  const { mutate: upgradeTariff, mutateAsync: upgradeTariffAsync } =
    useUpgradeUserTariff();
  // open from current tariff card (or any row)
  function openUpgrade(tariff: any) {
    setUpgradeFor(tariff); // { user, plan, userTariff }
    setIsUpgradeOpen(true);
  }

  //Upgrade user tariff with payment
  async function onClickSubmitUpgrade(values: {
    toPlanId: string;
    commissionPct?: number | null;
    commissionAmount?: string | null;
    note?: string | null;
    paymentMethod: "card" | "cash";
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
  }) {
    if (!upgradeFor) return;

    const {
      commissionPct,
      commissionAmount,
      note,
      pricing,
      meta,
      paymentMethod,
    } = values;

    const payload = {
      tariffId: meta.userTariffId,
      userId: meta.userId,
      fromPlanId: meta.fromPlanId,
      toPlanId: meta.toPlanId,
      baseDiffCents: pricing.baseDiffCents,
      totalCents: pricing.totalCents,
      commissionCents:
        commissionAmount && commissionAmount.trim() !== ""
          ? Math.round(Number(commissionAmount) * 100)
          : undefined,
      commissionPct:
        commissionPct == null || commissionPct === 0
          ? undefined
          : Number(commissionPct),
      currency: pricing.currency,
      note: note || undefined,
      paymentMethod,
    };

    // --- CASH flow: callbacks (no await) ---
    if (paymentMethod === "cash") {
      upgradeTariff(payload, {
        onSuccess: async () => {
          const uid = meta.userId;

          await queryClient.invalidateQueries({
            queryKey: ["allGroupedActiveMonthlyUserTariffs"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["userTariffHistory", uid],
          });
          await queryClient.invalidateQueries({
            queryKey: ["userFutureTariffs", uid],
          });
          await queryClient.invalidateQueries({ queryKey: ["orders"] });

          toast.success("Upgrade aplicado y pagado en efectivo");
          setIsUpgradeOpen(false);
        },
        onError: (err) => {
          console.error("upgradeUserTariff (cash) failed:", err);
          toast.error("No se pudo aplicar el upgrade en efectivo");
        },
      });
      return;
    }

    // --- CARD flow: await then create Checkout + show QR ---
    if (paymentMethod === "card") {
      try {
        // 1) Upgrade & create order/payment (pending)
        const result: any = await upgradeTariffAsync(payload);

        // result can be AxiosResponse or plain; handle both:
        const orderId = result?.order?.id ?? result?.data?.order?.id;
        if (!orderId) throw new Error("No se recibió un ID de orden");

        // 2) Create Stripe Checkout Session
        const response: any = await createStripePaymentIntent(orderId);
        const checkoutUrl =
          response?.checkoutUrl ?? response?.data?.checkoutUrl;
        if (!checkoutUrl) throw new Error("No se recibió URL de pago");

        // 3) Open QR dialog
        setQrData({ checkoutUrl, orderId });
        toast.success("Upgrade creado. Escanea el QR para pagar con tarjeta.");
        setIsUpgradeOpen(false);

        // Optional: refresh related data
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        await queryClient.invalidateQueries({
          queryKey: ["userTariffHistory", meta.userId],
        });
      } catch (err) {
        console.error("Stripe upgrade flow failed:", err);
        toast.error("Error al iniciar el pago con tarjeta");
      }
    }
  }

  return (
    <>
      <Section icon={Tag} title="Atletas con Tarifas">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full md:max-w-md items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input
                placeholder="Buscar atletas con tarifas"
                className="pl-9"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddTariffDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Añadir
            </Button>
          </div>
        </div>
        <Separator className="my-4" />

        <div className="w-full flex items-center justify-between flex-wrap mb-3">
          <div className="text-sm text-muted-foreground">
            Mostrando {rows.length === 0 ? 0 : start + 1}–{end} de {rows.length}
          </div>
        </div>

        <Table className="w-full min-w-[900px] overflow-x-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Expira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {filter
                    ? "No hay resultados para tu búsqueda."
                    : "No hay tarifas activas."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row: any) => (
                <TableRow
                  key={row.id}
                  onClick={async () => {
                    // row.fullData should be the full { userTariff, plan, user } object
                    setSelectedUserTariffInfo(row.fullData);

                    // Prefetch history for UX snappiness
                    const uid = row.fullData?.user?.id;
                    if (uid) {
                      // Prefetch both history and future tariffs
                      await Promise.all([
                        queryClient.prefetchQuery({
                          queryKey: ["userTariffHistory", uid],
                          queryFn: () => getUserTariffHistory(uid),
                        }),
                        queryClient.prefetchQuery({
                          queryKey: ["userFutureTariffs", uid],
                          queryFn: () => getUserFutureTariffs(uid),
                        }),
                      ]);
                    }

                    setIsEditTariffDialogOpen(true);
                  }}
                >
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.plan}</TableCell>
                  <TableCell>{row.expires}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-3 flex items-center justify-between">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>

              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pg) => (
                <PaginationItem key={pg}>
                  <PaginationLink
                    href="#"
                    isActive={pg === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pg);
                    }}
                  >
                    {pg}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(pageCount, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Section>
      {/* Add Tariff Dialog */}
      <Dialog
        open={isAddTariffDialogOpen}
        onOpenChange={setIsAddTariffDialogOpen}
      >
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Asignar tarifa</DialogTitle>
            <DialogDescription>
              Completa los datos para asignar una tarifa a un atleta. Podrás
              ajustar fechas y notas antes de guardar.
            </DialogDescription>
          </DialogHeader>

          <Form {...addTariffForm}>
            <form
              id="add-tariff-form"
              onSubmit={addTariffForm.handleSubmit(onSubmitAddTariffForm)}
              className="space-y-6"
            >
              <FormField
                control={addTariffForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <SearchSelectDropdown
                        options={userOptions}
                        value={field.value == null ? "" : String(field.value)} // number -> string
                        onValueChange={(v) => field.onChange(Number(v))} // string -> number
                        placeholder="Search and select a user"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TARIFF / PLAN */}
              <FormField
                control={addTariffForm.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarifa</FormLabel>
                    <FormControl>
                      <SearchSelectDropdown
                        options={tariffOptions}
                        value={field.value == null ? "" : String(field.value)} // number -> string
                        onValueChange={(v) => field.onChange(Number(v))}
                        placeholder="Search and select a tariff"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addTariffForm.control}
                name="startsOn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Empieza en (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-auto pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("2000-01-01")}
                          captionLayout="dropdown"
                          startMonth={new Date(2024, 0)}
                          endMonth={new Date(2026, 12)}
                          locale={{
                            ...es,
                            options: { ...es.options, weekStartsOn: 1 },
                          }} // Monday = 1
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="pt-1 pl-1">
                      Elige una fecha de inicio para la tarifa. Si se selecciona
                      la tarifa empieza hoy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addTariffForm.control}
                name="customExpiresOn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Termina en (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-auto pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("2000-01-01")}
                          captionLayout="dropdown"
                          startMonth={new Date(2024, 0)}
                          endMonth={new Date(2026, 12)}
                          locale={{
                            ...es,
                            options: { ...es.options, weekStartsOn: 1 },
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Selecciona cuándo termina la tarifa. Si no se selecciona
                      la tarifa termina dentro de un mes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {shouldShowCredits && (
                <FormField
                  control={addTariffForm.control}
                  name="remainingCredits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reservas restantes</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Si la tarifa es mensual con límite de reservas,
                        especifica el número restante.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={addTariffForm.control}
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
                control={addTariffForm.control}
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
              {addTariffForm.watch("collectWhen") === "later" && (
                <FormField
                  control={addTariffForm.control}
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
                        El usuario tendrá acceso inmediato durante{" "}
                        {field.value ?? 3} días mientras el pago queda
                        pendiente.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={addTariffForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddTariffDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" form="add-tariff-form" className="w-auto">
              Asignar tarifa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Tariff Dialog */}
      <Dialog
        open={isEditTariffDialogOpen}
        onOpenChange={setIsEditTariffDialogOpen}
      >
        <DialogContent className="w-full max-w-[90vw]! h-[80vh] p-0">
          <div className="flex flex-col h-full max-h-[80vh] overflow-auto w-full max-w-[90vw]">
            {/* Header */}
            <div className="border-b px-6 py-4">
              <DialogHeader>
                <DialogTitle className="md:text-2xl text-lg leading-[1]">
                  Gestión de tarifas
                </DialogTitle>
                <DialogDescription>
                  Consulta la tarifa actual, próximas asignaciones y el
                  historial.
                </DialogDescription>
              </DialogHeader>

              {/* Athlete info */}
              {/* TODO --> add user information to currentTariff call, right now it doesn't bring it */}
              {currentTariff?.user && (
                <div className="flex md:flex-row flex-col items-center gap-4 mt-4">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                    {currentTariff.user.name?.[0]}
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-base font-semibold">
                      {currentTariff.user.name} {currentTariff.user.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {currentTariff.user.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Main layout */}
            <div className="flex-1 flex overflow-auto">
              {/* Left column - current and future tariffs */}
              <div className="w-full lg:w-1/2 overflow-y-auto p-6 space-y-6">
                {/* Current Tariff */}
                <section>
                  <h3 className="text-lg font-semibold mb-3">Tarifa actual</h3>
                  <CurrentTariffCard
                    tariff={currentTariff}
                    onEdit={startEdit}
                    onUpgrade={openUpgrade}
                  />
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">
                    Tarifas programadas
                  </h3>
                  <div className="space-y-3">
                    {isFutureLoading ? (
                      <div className="text-sm text-muted-foreground py-3">
                        Cargando futuras tarifas…
                      </div>
                    ) : futureError ? (
                      <div className="text-sm text-destructive py-3">
                        No se pudo cargar las tarifas programadas.
                      </div>
                    ) : (
                      <FutureTariffsList
                        tariffs={userFutureTariffs?.results}
                        onEdit={startEdit}
                      />
                    )}
                  </div>
                </section>

                {/* History */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">
                    Historial de tarifas anteriores
                  </h3>

                  {isHistoryLoading ? (
                    <div className="text-sm text-muted-foreground py-3">
                      Cargando historial…
                    </div>
                  ) : historyError ? (
                    <div className="text-sm text-destructive py-3">
                      No se pudo cargar el historial.
                    </div>
                  ) : (
                    <PastTariffsList tariffs={userTariffHistory?.results} />
                  )}
                </section>
              </div>

              {/* Right column - new assignment */}
              <div className="hidden lg:block w-1/2 border-l h-full overflow-y-auto bg-muted/20 px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {rightPaneMode === "edit"
                      ? "Editar tarifa"
                      : "Asignar nueva tarifa"}
                  </h3>
                  {rightPaneMode === "edit" && (
                    <button
                      className="text-xs underline text-muted-foreground"
                      onClick={() => {
                        setRightPaneMode("add");
                        setEditingTariff(null);
                      }}
                    >
                      Cambiar a alta nueva
                    </button>
                  )}
                </div>

                {rightPaneMode === "edit" && editingTariff ? (
                  <EditTariffForm
                    editingTariff={editingTariff}
                    tariffOptions={tariffOptions}
                    bookedRanges={bookedRanges /* includes ids */}
                    onSubmit={onSubmitEditTariffForm}
                    onDelete={() => {}}
                    onCancel={() => {
                      setRightPaneMode("add");
                      setEditingTariff(null);
                    }}
                  />
                ) : (
                  <AddTariffForm
                    tariffOptions={tariffOptions}
                    bookedRanges={bookedRanges}
                    onSubmit={onSubmitAddTariffFromRightPane}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Upgrade Tariff Dialog */}
      <UpgradeTariffForm
        open={isUpgradeOpen}
        onOpenChange={(v) => {
          setIsUpgradeOpen(v);
          if (!v) setUpgradeFor(null);
        }}
        current={upgradeFor} // { user, plan, userTariff }
        allPlans={allMonthlyTariffs?.tariffs ?? []} // from your query
        onSubmit={onClickSubmitUpgrade}
      />
      <StripeQRDialog
        open={!!qrData}
        onOpenChange={(open: any) => !open && setQrData(null)}
        checkoutUrl={qrData?.checkoutUrl ?? ""}
        orderId={qrData?.orderId}
        onCopied={() => toast.success("Enlace copiado")}
      />
      ;
    </>
  );
};

export default TariffsTab;

export const CurrentTariffCard = ({ tariff, onEdit, onUpgrade }: any) => {
  // Support BOTH shapes:
  // - old: { userTariff, plan }
  // - new: { tariff, plan }
  const userTariff = tariff?.userTariff ?? tariff?.tariff ?? null;
  const plan = tariff?.plan ?? null;

  // If nothing usable, show the empty state
  if (!userTariff || !userTariff.startsOn || !userTariff.expiresOn) {
    return (
      <Card className="border bg-muted/10">
        <CardContent className="p-3 text-xs text-muted-foreground">
          Sin tarifa activa.
        </CardContent>
      </Card>
    );
  }

  const start = new Date(userTariff.startsOn);
  const end = new Date(userTariff.expiresOn);

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  const rangeText = sameMonth
    ? `${format(start, "d", { locale: es })}–${format(end, "d MMM", {
        locale: es,
      })}`
    : `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM", {
        locale: es,
      })}`;

  const credits =
    userTariff?.remainingCredits != null
      ? `${userTariff.remainingCredits}`
      : "∞";

  const maxPerDay = plan?.maxPerDay;
  const price = plan?.price;
  const tariffId = userTariff?.id;

  const isPaymentIncomplete =
    userTariff?.status === "pending" ||
    userTariff?.billingStatus === "processing";

  const isPaymentComplete =
    userTariff?.status === "active" && userTariff?.billingStatus === "paid";

  const provisionalUntilText = userTariff?.provisionalAccessUntil
    ? format(new Date(userTariff.provisionalAccessUntil), "dd MMM yyyy", {
        locale: es,
      })
    : null;

  return (
    <TooltipProvider>
      <Card className="border bg-card">
        <CardContent className="py-2 px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-2">
            {/* LEFT: title + metas */}
            <div className="min-w-0 flex-1">
              {/* Title line */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {plan.name}
                </span>

                <Badge
                  variant="green"
                  className="h-5 px-1.5 text-[10px] capitalize"
                >
                  {plan.type}
                </Badge>

                {/* NEW: payment badges */}
                {isPaymentIncomplete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="yellow"
                        className="h-5 px-1.5 text-[10px] border-amber-400/60 text-amber-800 bg-amber-50"
                      >
                        Procesando pago
                      </Badge>
                    </TooltipTrigger>
                    {provisionalUntilText && (
                      <TooltipContent className="max-w-xs text-xs">
                        Acceso provisional hasta {provisionalUntilText}.
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}

                {isPaymentComplete && (
                  <Badge
                    variant="green"
                    className="h-5 px-1.5 text-[10px] bg-emerald-600/10 text-emerald-700 border-emerald-600/30"
                  >
                    Pago completo
                  </Badge>
                )}

                {userTariff?.note && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <StickyNote
                        className="w-3.5 h-3.5 text-primary/90 shrink-0 cursor-help"
                        aria-label="Ver nota"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {userTariff.note}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Meta row 1: date range · credits */}
              <div className="mt-0.5 text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.25">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {rangeText}
                </span>
                <span className="inline-flex items-center gap-1.25">
                  <Ticket className="w-3.5 h-3.5" />
                  {credits} créditos
                </span>
              </div>

              {/* Meta row 2: max/day · price · tariff id */}
              <div className="mt-0.5 text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                {typeof maxPerDay === "number" && (
                  <span className="inline-flex items-center gap-1.25">
                    <GaugeCircle className="w-3.5 h-3.5" />
                    Máx/día: {maxPerDay}
                  </span>
                )}
                {typeof price === "number" && (
                  <span className="inline-flex items-center gap-1.25">
                    <CircleDollarSign className="w-3.5 h-3.5" />
                    Base: {price.toFixed(2)}€
                  </span>
                )}
                {typeof tariffId === "number" && (
                  <span className="inline-flex items-center gap-1.25">
                    <Hash className="w-3.5 h-3.5" />
                    ID: {tariffId}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT: actions */}
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 px-2.5 text-[12px] w-auto"
                    onClick={() => onUpgrade?.(tariff)}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                    Mejorar / Recargar
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Cambia a un plan superior o añade créditos.
                  <br />
                  <strong>Las fechas no cambian</strong>; solo límites (créditos
                  / máx por día).
                  <br />
                  Se cobra la diferencia + comisión.
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => onEdit?.(tariff)}
                    aria-label="Editar detalles de la tarifa"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Edita detalles administrativos (nota, corrección de fechas,
                  etc.).
                  <br />
                  Para más clases o cambiar de plan, usa “Mejorar / Recargar”.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export function PastTariffsList({ tariffs }: { tariffs: any }) {
  if (!tariffs || tariffs.length === 0) {
    return (
      <Card className="text-sm text-muted-foreground">
        <CardContent className="py-1">Sin historial.</CardContent>
      </Card>
    );
  }

  // just in case it's not already sorted, most recent first
  const items = [...tariffs].sort(
    (a, b) =>
      new Date(b.userTariff.expiresOn).getTime() -
      new Date(a.userTariff.expiresOn).getTime()
  );

  return (
    <div className="space-y-2">
      {items.map((t) => (
        <Accordion key={t.userTariff.id} type="single" collapsible>
          <AccordionItem value="tariff">
            <AccordionTrigger className="px-4 py-2 text-xs hover:no-underline">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {t.plan.name}
                  </span>
                  <Badge
                    variant="gray"
                    className="text-[10px] px-1.5 py-0.5 capitalize"
                  >
                    {t.plan.type}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-primary" />
                    {format(new Date(t.userTariff.startsOn), "dd MMM", {
                      locale: es,
                    })}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock4 className="w-3 h-3 text-primary" />
                    {format(new Date(t.userTariff.expiresOn), "dd MMM", {
                      locale: es,
                    })}
                  </span>

                  <span className="flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-primary" />
                    {t.userTariff.remainingCredits ?? "Ilimitados"}
                  </span>

                  {t.userTariff.note && (
                    <span className="flex items-center gap-1">
                      <StickyNote className="w-3 h-3 text-primary" />
                      {t.userTariff.note}
                    </span>
                  )}
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
              <div className="space-y-1">
                <div>
                  <strong>Inicio:</strong>{" "}
                  {format(
                    new Date(t.userTariff.startsOn),
                    "dd 'de' MMMM yyyy",
                    {
                      locale: es,
                    }
                  )}
                </div>
                <div>
                  <strong>Expiró:</strong>{" "}
                  {format(
                    new Date(t.userTariff.expiresOn),
                    "dd 'de' MMMM yyyy",
                    {
                      locale: es,
                    }
                  )}
                </div>
                <div>
                  <strong>Créditos:</strong>{" "}
                  {t.userTariff.remainingCredits ?? "Ilimitados"}
                </div>
                {t.userTariff.note && (
                  <div>
                    <strong>Nota:</strong> {t.userTariff.note}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
}

export function FutureTariffsList({
  tariffs,
  onEdit,
}: {
  tariffs: any[] | null | undefined;
  onEdit?: (tariff: any) => void;
}) {
  if (!tariffs || tariffs.length === 0) return null;

  const items = [...tariffs].sort(
    (a, b) =>
      new Date(a.tariff.startsOn).getTime() -
      new Date(b.tariff.startsOn).getTime()
  );

  return (
    <div className="space-y-2">
      {items.map((t) => {
        const isPaymentIncomplete =
          t.tariff?.status === "pending" ||
          t.tariff?.billingStatus === "processing";

        const isPaymentComplete =
          t.tariff?.status === "active" && t.tariff?.billingStatus === "paid";

        const provisionalUntilText = t.tariff?.provisionalAccessUntil
          ? format(new Date(t.tariff.provisionalAccessUntil), "dd MMM yyyy", {
              locale: es,
            })
          : null;

        return (
          <Accordion key={t.tariff.id} type="single" collapsible>
            <AccordionItem value="future-tariff">
              <AccordionTrigger className="px-4 py-2 text-xs hover:no-underline">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full text-muted-foreground">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {t.plan.name}
                    </span>
                    <Badge
                      variant="gray"
                      className="text-[10px] px-1.5 py-0.5 capitalize"
                    >
                      {t.plan.type}
                    </Badge>

                    {/* Payment badges (same logic as CurrentTariffCard) */}
                    {isPaymentIncomplete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="yellow"
                            className="h-5 px-1.5 text-[10px] border-amber-400/60 text-amber-800 bg-amber-50"
                          >
                            Procesando pago
                          </Badge>
                        </TooltipTrigger>
                        {provisionalUntilText && (
                          <TooltipContent className="max-w-xs text-xs">
                            Acceso provisional hasta {provisionalUntilText}.
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}

                    {isPaymentComplete && (
                      <Badge
                        variant="green"
                        className="h-5 px-1.5 text-[10px] bg-emerald-600/10 text-emerald-700 border-emerald-600/30"
                      >
                        Pago completo
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-primary" />
                      {format(new Date(t.tariff.startsOn), "dd MMM", {
                        locale: es,
                      })}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock4 className="w-3 h-3 text-primary" />
                      {format(new Date(t.tariff.expiresOn), "dd MMM", {
                        locale: es,
                      })}
                    </span>

                    <span className="flex items-center gap-1">
                      <Ticket className="w-3 h-3 text-primary" />
                      {t.tariff.remainingCredits ?? "Ilimitados"}
                    </span>

                    {t.tairff?.note && (
                      <span className="flex items-center gap-1">
                        <StickyNote className="w-3 h-3 text-primary" />
                        {t.tariff.note}
                      </span>
                    )}
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(t);
                        }}
                        aria-label="Editar detalles de la tarifa"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Edita detalles administrativos (nota, corrección de
                      fechas, etc.).
                      <br />
                      Para más clases o cambiar de plan, usa “Mejorar /
                      Recargar”.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <div>
                    <strong>Inicio:</strong>{" "}
                    {format(new Date(t.tariff.startsOn), "dd 'de' MMMM yyyy", {
                      locale: es,
                    })}
                  </div>
                  <div>
                    <strong>Expira:</strong>{" "}
                    {format(new Date(t.tariff.expiresOn), "dd 'de' MMMM yyyy", {
                      locale: es,
                    })}
                  </div>
                  <div>
                    <strong>Créditos:</strong>{" "}
                    {t.tariff.remainingCredits ?? "Ilimitados"}
                  </div>
                  {t.tariff.note && (
                    <div>
                      <strong>Nota:</strong> {t.tariff.note}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </div>
  );
}
