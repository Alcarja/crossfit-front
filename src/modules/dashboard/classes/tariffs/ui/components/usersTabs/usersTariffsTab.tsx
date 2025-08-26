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
  useAllActiveMonthlyUserTariffs,
  useAllMonthlyTariffs,
  useAssignMonthlyTariff,
  useUpdateUserMonthlyTariff,
  useUserFutureTariffs,
  useUserTariffHistory,
} from "@/app/queries/tariffs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { getUserFutureTariffs, getUserTariffHistory } from "@/app/adapters/api";
import { AddTariffForm } from "./forms/addTariffForm";
import { EditTariffForm } from "./forms/editTariffForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpgradeTariffForm } from "./forms/upgradeTariffForm";

const addTariffFormSchema = z.object({
  userId: z.number(),
  planId: z.number(),
  startsOn: z.date().optional(),
  customExpiresOn: z.date().optional(),
  remainingCredits: z.string().min(1).max(15).optional(),
  note: z.string().max(100).optional(),
});

const TariffsTab = () => {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("");
  const [isAddTariffDialogOpen, setIsAddTariffDialogOpen] = useState(false);

  const [isEditTariffDialogOpen, setIsEditTariffDialogOpen] = useState(false);
  const [selectedUserTariffInfo, setSelectedUserTariffInfo] = useState<
    any | null
  >(null);

  const { data: allUsers } = useQuery(usersQueryOptions());
  const { data: allMonthlyTariffs } = useAllMonthlyTariffs();
  const { data: allActiveMonthlyUserTariffs } =
    useAllActiveMonthlyUserTariffs();

  const rows =
    allActiveMonthlyUserTariffs?.results?.map((r: any) => ({
      id: r.userTariff.id,
      name: `${r.user.name} ${r.user.lastName}`.trim(),
      email: r.user.email,
      plan: r.plan.name,
      expires: r.userTariff.expiresOn,
      fullData: r,
    })) ?? [];

  //Apply the filter to the table rows
  const filteredRows = rows.filter((r: any) => {
    const q = filter.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.plan.toLowerCase().includes(q)
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

  const { mutate: assignTariff } = useAssignMonthlyTariff();

  function onSubmitAddTariffForm(values: z.infer<typeof addTariffFormSchema>) {
    const payload = {
      userId: values.userId,
      planId: values.planId,
      startsOn: values.startsOn ? toYMD(values.startsOn as Date) : undefined,
      customExpiresOn: values.customExpiresOn
        ? toYMD(values.customExpiresOn as Date)
        : undefined,
      // Avoid sending NaN
      remainingCredits:
        values.remainingCredits == null
          ? undefined
          : Number(values.remainingCredits),
      note: values.note || undefined,
    };

    assignTariff(payload, {
      onSuccess: async (_data, variables) => {
        const uid = variables.userId; // comes from payload

        await queryClient.invalidateQueries({
          queryKey: ["allActiveMonthlyUserTariffs"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["userTariffHistory", uid],
        });
        await queryClient.invalidateQueries({
          queryKey: ["userFutureTariffs", uid],
        });

        toast.success("Tariff assigned to user!");
        setIsAddTariffDialogOpen(false);
        addTariffForm.reset();
      },
      onError: (err) => {
        console.error("assignMonthlyTariff failed:", err);
        toast.error("Error assigning tariff to user");
      },
    });
  }

  const selectedUserId = selectedUserTariffInfo?.user?.id;

  // History for the selected user (server)
  const {
    data: userTariffHistory,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useUserTariffHistory(selectedUserId);

  const {
    data: userFutureTariffs,
    isLoading: isFutureLoading,
    error: futureError,
  } = useUserFutureTariffs(selectedUserId);

  const userTariffs =
    allActiveMonthlyUserTariffs?.results?.filter(
      (t: any) => t.user.id === selectedUserId
    ) ?? [];

  const today = new Date();

  const currentTariff = userTariffs.find((t: any) => {
    const start = new Date(t.userTariff.startsOn);
    const end = new Date(t.userTariff.expiresOn);
    return start <= today && end >= today;
  });

  const [rightPaneMode, setRightPaneMode] = useState<"add" | "edit">("add");
  const [editingTariff, setEditingTariff] = useState<any | null>(null);

  // when clicking edit in Current/Future, do:
  function startEdit(tariff: any) {
    setEditingTariff(tariff); // full { userTariff, plan, user }
    setRightPaneMode("edit");
  }

  // booked ranges for the selected user (active + future)
  function calculateBookedRangesForUser(userId?: number) {
    if (!userId) return [];
    const active =
      allActiveMonthlyUserTariffs?.results?.filter(
        (t: any) => t.user.id === userId
      ) ?? [];
    const future =
      userFutureTariffs?.results?.filter((t: any) => t.user.id === userId) ??
      [];
    return [...active, ...future].map((t: any) => ({
      id: t.userTariff.id, // <-- important
      from: new Date(t.userTariff.startsOn),
      to: new Date(t.userTariff.expiresOn),
    }));
  }

  const bookedRanges = calculateBookedRangesForUser(selectedUserId);

  const { mutate: updateTariff } = useUpdateUserMonthlyTariff();

  const toDateOnly = (d: Date | null | undefined) =>
    d ? format(d, "yyyy-MM-dd") : null;

  const onSubmitEditTariffForm = (values: {
    planId: number;
    startsOn: Date;
    customExpiresOn: Date | null;
    note?: string | null;
    remainingCredits?: number | null;
  }) => {
    const tariffId = Number(editingTariff.userTariff.id);
    const userId = Number(editingTariff.userTariff.userId);

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
          queryKey: ["allActiveMonthlyUserTariffs"],
        });
      },
      onError: (err) => console.error("❌ Error updating tariff:", err),
    });
  };

  const onSubmitAddTariffFromRightPane = (values: {
    planId: string;
    dateRange: { from: Date; to: Date };
    remainingCredits?: string;
    note?: string;
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
      remainingCredits: values.remainingCredits, // string -> Number() inside your handler
      note: values.note,
    } as any);
  };

  // --- Upgrade dialog state ---
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState<any | null>(null);

  // open from current tariff card (or any row)
  function openUpgrade(tariff: any) {
    setUpgradeFor(tariff); // { user, plan, userTariff }
    setIsUpgradeOpen(true);
  }

  function submitUpgrade(values: {
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

    const { commissionPct, commissionAmount, note, pricing, meta } = values;

    const payload = {
      tariffId: meta.userTariffId,
      userId: meta.userId,
      toPlanId: meta.toPlanId,
      commissionPct:
        commissionPct == null || commissionPct === 0
          ? undefined
          : Number(commissionPct),
      commissionCents:
        commissionAmount && commissionAmount.trim() !== ""
          ? Math.round(Number(commissionAmount) * 100)
          : undefined,
      baseDiffCents: pricing.baseDiffCents,
      totalCents: pricing.totalCents,
      currency: pricing.currency,
      note: note || undefined,
      fromPlanId: meta.fromPlanId,
      paymentMethod: values.paymentMethod,
    };

    console.log("Payload", payload);

    // continue with upgradeTariff(payload)...
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

        <ScrollArea>
          <Table>
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
        </ScrollArea>

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
        <DialogContent className="sm:max-w-xl">
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
            <Button type="submit" form="add-tariff-form">
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
        <DialogContent className="w-full max-w-[70vw]! h-[92vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Gestión de tarifas
                </DialogTitle>
                <DialogDescription>
                  Consulta la tarifa actual, próximas asignaciones y el
                  historial.
                </DialogDescription>
              </DialogHeader>

              {/* Athlete info */}
              {currentTariff?.user && (
                <div className="flex items-center gap-4 mt-4">
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
            <div className="flex-1 flex overflow-hidden">
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
        onSubmit={submitUpgrade}
      />
    </>
  );
};

export default TariffsTab;

export const CurrentTariffCard = ({ tariff, onEdit, onUpgrade }: any) => {
  if (!tariff)
    return (
      <Card className="border bg-muted/10">
        <CardContent className="p-3 text-xs text-muted-foreground">
          Sin tarifa activa.
        </CardContent>
      </Card>
    );

  const { plan, userTariff } = tariff;

  console.log("Plan from current tariff card", plan);

  const start = new Date(userTariff?.startsOn);
  const end = new Date(userTariff?.expiresOn);
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

  // Optional fields you might have on your plan object:
  const maxPerDay = plan?.maxPerDay as number | undefined; // e.g. 1, 2, 3
  const price = plan?.price as number | undefined; // e.g. 49.9
  const tariffId = userTariff?.id as number | undefined;

  return (
    <TooltipProvider>
      <Card className="border bg-card">
        <CardContent className="py-2 px-6">
          <div className="flex items-center gap-2">
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

              {/* Meta row 2: max/day · price · tariff id (all conditional) */}
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

            {/* RIGHT: actions (icon + tooltips) */}
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
      new Date(a.userTariff.startsOn).getTime() -
      new Date(b.userTariff.startsOn).getTime()
  );

  return (
    <div className="space-y-2">
      {items.map((t) => (
        <Accordion key={t.userTariff.id} type="single" collapsible>
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
                    Edita detalles administrativos (nota, corrección de fechas,
                    etc.).
                    <br />
                    Para más clases o cambiar de plan, usa “Mejorar / Recargar”.
                  </TooltipContent>
                </Tooltip>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
              <div className="space-y-1">
                <div>
                  <strong>Inicio:</strong>{" "}
                  {format(
                    new Date(t.userTariff.startsOn),
                    "dd 'de' MMMM yyyy",
                    { locale: es }
                  )}
                </div>
                <div>
                  <strong>Expira:</strong>{" "}
                  {format(
                    new Date(t.userTariff.expiresOn),
                    "dd 'de' MMMM yyyy",
                    { locale: es }
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
