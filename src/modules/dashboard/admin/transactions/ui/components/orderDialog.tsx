/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { CreditCard, Wallet, Ban, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { orderByIdQueryOptions } from "@/app/queries/orders";
import {
  cancelOpenOrderQueryOptions,
  createNewPaymentForOrderQueryOptions,
  finalizePendingCashPaymentQueryOptions,
  finalizeStripeCardPaymentQueryOptions,
  stripePaymentIntentQueryOptions,
  switchPaymentToCashQueryOptions,
  switchPendingCashToCardQueryOptions,
} from "@/app/queries/payments";
import { toast } from "sonner";
import { StripeQRDialog } from "@/components/web/stripeQRDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function fmtMoney(
  value: number | string | null | undefined,
  currency: string = "EUR",
  locale: string = "es-ES"
) {
  const n =
    typeof value === "string"
      ? Number.parseFloat(value)
      : typeof value === "number"
      ? value
      : 0;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    n || 0
  );
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export function OrderDialog({ orderId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false); //Cancel payment but kep order open

  const [isNewPaymentDialogOpen, setIsNewPaymentDialogOpen] = useState(false); //Start new payment with current order open
  const [newPaymentMethod, setNewPaymentMethod] = useState<"card" | "cash">(
    "card"
  ); //type of payment selected for new payment

  const [qrData, setQrData] = useState<{
    checkoutUrl: string;
    orderId: number;
  } | null>(null);

  const { data: individualOrderData, isFetching } = useQuery(
    orderByIdQueryOptions(orderId as number)
  );

  useEffect(() => {
    console.log("Individual order data", individualOrderData);
  }, [individualOrderData]);

  useEffect(() => {
    console.log("Order id", orderId);
  }, [orderId]);

  function renderPaymentStatus(status: string) {
    // Tweak variants as you prefer
    const map: Record<
      string,
      {
        label: string;
        variant: "default" | "yellow" | "red" | "green" | "gray";
      }
    > = {
      pending: { label: "Pendiente", variant: "yellow" },
      processing: { label: "En curso", variant: "yellow" },
      requires_action: { label: "Requiere acción", variant: "yellow" },
      succeeded: { label: "Pagado", variant: "green" },
      failed: { label: "Fallido", variant: "red" },
      cancelled: { label: "Cancelado", variant: "red" },
      void: { label: "Cancelado", variant: "red" },
      refunded: { label: "Reembolsado", variant: "gray" },
    };
    const cfg = map[status] ?? { label: status, variant: "outline" as const };
    return (
      <Badge variant={cfg.variant} className="capitalize">
        {cfg.label}
      </Badge>
    );
  }

  //Finalize a pending payment by card
  const { mutate: finalizeCard } = useMutation({
    mutationFn: (orderId: number) =>
      finalizeStripeCardPaymentQueryOptions(orderId).queryFn(),
  });

  const onClickFinalizeCard =
    (orderId: number | null): React.MouseEventHandler<HTMLButtonElement> =>
    (e) => {
      e.preventDefault();
      if (orderId == null) {
        toast.error("Falta el ID de la orden");
        return;
      }
      finalizeCard(orderId, {
        onSuccess: (res) => {
          const data = (res as any)?.data ?? res; // axios or fetch
          const checkoutUrl: string | undefined | null = data?.checkoutUrl;
          const paid = data?.stripe?.payment_status === "paid";

          if (checkoutUrl) {
            setQrData({ checkoutUrl, orderId }); // ✅ opens dialog via state
          } else if (paid) {
            toast.success("Pago con tarjeta confirmado");
          } else {
            toast.message("Aún pendiente", {
              description: "Si acabas de pagar, reintenta en unos segundos.",
            });
          }
        },
        onError: (err) => {
          console.error("finalizeCard failed:", err);
          toast.error("No se pudo verificar el pago");
        },
      });
    };

  //Switch a pending card payment to cash
  const { mutate: switchToCash } = useMutation({
    mutationFn: (params: {
      orderId: number;
      amount?: number;
      note?: string;
      recordedByCoachId?: number;
    }) => switchPaymentToCashQueryOptions(params).queryFn(),
  });

  const onClickSwitchToCash =
    (orderId: number | null): React.MouseEventHandler<HTMLButtonElement> =>
    (e) => {
      e.preventDefault();
      if (orderId == null) {
        toast.error("Falta el ID de la orden");
        return;
      }
      switchToCash(
        { orderId, note: "Pagado en efectivo" },
        {
          onSuccess: async () => {
            toast.success("Pedido saldado en efectivo");
            await queryClient.invalidateQueries({
              queryKey: ["order", orderId],
            });
            await queryClient.invalidateQueries({
              queryKey: ["orders"],
            });
          },
          onError: (err) => {
            console.error("switchToCash failed:", err);
            toast.error("No se pudo cambiar a efectivo");
          },
        }
      );
    };

  //Switch a pending cash payment to card
  const { mutate: switchToCard } = useMutation({
    mutationFn: (orderId: number) =>
      switchPendingCashToCardQueryOptions(orderId).queryFn(),
  });

  const onClickSwitchToCard =
    (orderId: number | null): React.MouseEventHandler<HTMLButtonElement> =>
    (e) => {
      e.preventDefault();
      if (orderId == null) {
        toast.error("Falta el ID de la orden");
        return;
      }
      switchToCard(orderId, {
        onSuccess: async (res: any) => {
          const data = res?.data ?? res;
          const checkoutUrl: string | null = data?.checkoutUrl ?? null;

          if (checkoutUrl) {
            // assumes: const [qrData, setQrData] = useState<{ checkoutUrl: string; orderId: number } | null>(null);
            setQrData({ checkoutUrl, orderId });
            toast.success("Escanea el QR para pagar con tarjeta.");
          } else {
            toast.success("Cambio a tarjeta preparado");
          }

          await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
          await queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (err) => {
          console.error("switchToCard failed:", err);
          toast.error("No se pudo cambiar a tarjeta");
        },
      });
    };

  //Finalize cash payment
  const { mutate: finalizeCash } = useMutation({
    mutationFn: (params: {
      orderId: number;
      amount?: number;
      note?: string;
      recordedByCoachId?: number;
    }) => finalizePendingCashPaymentQueryOptions(params).queryFn(),
  });

  const onClickFinalizeCash =
    (orderId: number | null): React.MouseEventHandler<HTMLButtonElement> =>
    (e) => {
      e.preventDefault();
      if (orderId == null) {
        toast.error("Falta el ID de la orden");
        return;
      }
      finalizeCash(
        { orderId, note: "Pago en efectivo confirmado" },
        {
          onSuccess: async () => {
            toast.success("Pago en efectivo confirmado");
            await queryClient.invalidateQueries({
              queryKey: ["order", orderId],
            });
            await queryClient.invalidateQueries({ queryKey: ["orders"] });
          },
          onError: (err) => {
            console.error("finalizeCash failed:", err);
            toast.error("No se pudo confirmar el pago en efectivo");
          },
        }
      );
    };

  //Cancel open order
  const { mutate: cancelOrder } = useMutation({
    mutationFn: (params: { orderId: number; reason?: string }) =>
      cancelOpenOrderQueryOptions(params).queryFn(),
  });

  const onClickCancelOrder =
    (orderId: number | null): React.MouseEventHandler<HTMLButtonElement> =>
    (e) => {
      e.preventDefault();
      if (orderId == null) {
        toast.error("Falta el ID de la orden");
        return;
      }

      cancelOrder(
        { orderId, reason: "Cancelada por el administrador" },
        {
          onSuccess: async () => {
            toast.success("Orden cancelada");
            await queryClient.invalidateQueries({
              queryKey: ["order", orderId],
            });
            await queryClient.invalidateQueries({ queryKey: ["orders"] });
          },
          onError: (err) => {
            console.error("cancelOrder failed:", err);
            toast.error("No se pudo cancelar la orden");
          },
        }
      );
    };

  //Start new payment

  const { mutate: createNewPayment } = useMutation({
    mutationFn: (params: {
      orderId: number;
      method: "card" | "cash";
      note?: string;
      recordedByCoachId?: number;
      amount?: number;
    }) => createNewPaymentForOrderQueryOptions(params).queryFn(),
  });

  const onClickStartNewPayment =
    (
      orderId: number | null,
      newPaymentMethod: "card" | "cash"
    ): React.MouseEventHandler<HTMLButtonElement> =>
    async (e) => {
      e.preventDefault();
      if (orderId == null) {
        toast.error("Falta el ID de la orden");
        return;
      }

      createNewPayment(
        { orderId, method: newPaymentMethod },
        {
          onSuccess: async () => {
            if (newPaymentMethod === "card") {
              try {
                const res: any = await stripePaymentIntentQueryOptions(
                  orderId
                ).queryFn();

                const checkoutUrl = res?.data?.checkoutUrl ?? res?.checkoutUrl;
                if (!checkoutUrl) {
                  toast.error("No se pudo obtener el enlace de pago");
                  return;
                }
                setQrData({ checkoutUrl, orderId });

                await queryClient.invalidateQueries({
                  queryKey: ["order", orderId],
                });
                await queryClient.invalidateQueries({ queryKey: ["orders"] });

                toast.success("Escanea el QR para pagar con tarjeta.");
              } catch (err) {
                console.error("createPaymentIntent failed:", err);
                toast.error("No se pudo iniciar el pago con tarjeta");
              }
            } else {
              // cash: you just created a new pending cash payment row (per your spec)
              toast.success("Nuevo pago en efectivo creado");
              await queryClient.invalidateQueries({
                queryKey: ["order", orderId],
              });
              await queryClient.invalidateQueries({ queryKey: ["orders"] });
            }
          },
          onError: (err) => {
            console.error("createNewPayment failed:", err);
            toast.error("No se pudo crear el nuevo pago");
          },
        }
      );
    };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[95%]! h-[95%] max-h-none rounded-md shadow-md flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b bg-background px-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base md:text-lg">
                {orderId ? `Orden #${orderId}` : "Orden"}
              </DialogTitle>
              {isFetching && (
                <Badge variant="default" className="uppercase">
                  Actualizando…
                </Badge>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* === ORDER MANAGEMENT UI (UI-only) === */}
            <div className="grid gap-4 md:grid-cols-4">
              {/* Main column */}
              <div className="md:col-span-3 space-y-4">
                {/* Order meta / edit card */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">
                          Detalles de la orden
                        </CardTitle>
                        <CardDescription>
                          Información general del pedido. El estado se gestiona
                          desde la pestaña de pagos.
                        </CardDescription>
                      </div>
                      {/* TODO: (Opcional) mostrar badge resumen del estado aquí */}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 text-sm text-muted-foreground">
                    {/* Fila: Estado / Tipo / Liquidación */}
                    <div className="grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <Label>Estado</Label>
                        <p className="mt-1 text-base text-foreground">
                          {individualOrderData?.order.status === "open" &&
                            "Abierta"}
                          {individualOrderData?.order.status === "paid" &&
                            "Pagada"}
                          {individualOrderData?.order.status === "settled" &&
                            "Liquidada"}
                          {individualOrderData?.order.status === "canceled" &&
                            "Cancelada"}
                        </p>
                      </div>

                      <div className="md:col-span-4">
                        <Label>Tipo</Label>
                        <p className="mt-1 capitalize text-base text-foreground">
                          {individualOrderData?.order.orderType ===
                            "member_sale" && "Venta cliente"}
                          {individualOrderData?.order.orderType ===
                            "internal_use" && "Uso interno"}
                          {individualOrderData?.order.orderType ===
                            "stock_purchase" && "Compra stock"}
                        </p>
                      </div>

                      <div className="md:col-span-4">
                        <Label>Liquidación</Label>
                        <p className="mt-1 capitalize text-base text-foreground">
                          {individualOrderData?.order.settlementMethod || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Fila: Cliente / Fecha */}
                    <div className="grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-6">
                        <Label>Cliente</Label>
                        <p className="mt-1 text-base text-foreground">
                          {individualOrderData?.order.buyerName}{" "}
                          {individualOrderData?.order.buyerLastName}{" "}
                          <span className="text-muted-foreground text-sm">
                            (#{individualOrderData?.order.userId})
                          </span>
                        </p>
                      </div>

                      <div className="md:col-span-6 flex flex-col items-end text-right">
                        <Label>Fecha</Label>
                        <p className="mt-1 text-base text-foreground">
                          {fmtDate(individualOrderData?.order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Nota */}
                    <div>
                      <Label>Nota</Label>
                      <p className="mt-1 text-base text-foreground">
                        {individualOrderData?.order.note || "—"}
                      </p>
                    </div>
                  </CardContent>

                  {/* TODO: In the future, allow editing type, status, note etc. */}
                </Card>

                <Card>
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          Pagos de la orden
                        </CardTitle>
                        <CardDescription>
                          Gestiona cobros y estados.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="mt-4">
                    {(individualOrderData?.payments?.length ?? 0) === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <div className="text-sm text-muted-foreground">
                          Aún no hay pagos.
                        </div>
                        <Button size="sm">
                          <Wallet className="mr-2 h-4 w-4" /> Añadir pago
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[70px]">ID</TableHead>
                            <TableHead className="w-[120px]">Método</TableHead>
                            <TableHead className="w-[130px]">Estado</TableHead>
                            <TableHead className="w-[120px]">Importe</TableHead>
                            <TableHead className="w-[380px]">Nota</TableHead>
                            <TableHead className="w-[400px]">Fecha</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {(individualOrderData?.payments ?? []).map(
                            (payment: any) => {
                              return (
                                <TableRow key={payment.id}>
                                  <TableCell className="w-[70px]">
                                    #{payment.id}
                                  </TableCell>
                                  <TableCell className="capitalize w-[120px]">
                                    <Badge variant="gray">
                                      {payment.method}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="w-[130px]">
                                    {renderPaymentStatus(payment.status)}
                                  </TableCell>
                                  <TableCell className="w-[120px]">
                                    {fmtMoney(payment.amount)}
                                  </TableCell>
                                  <TableCell className="truncate max-w-[380px]">
                                    {payment.note ?? "—"}
                                  </TableCell>
                                  <TableCell className="w-[400px]">
                                    {payment.paidAt
                                      ? fmtDate(payment.paidAt)
                                      : fmtDate(payment.createdAt)}
                                  </TableCell>
                                </TableRow>
                              );
                            }
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar: Totals + Quick actions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumen</CardTitle>
                    <CardDescription>Totales de la orden</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">
                        {individualOrderData?.order?.total}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pendiente</span>
                      <span className="font-semibold text-amber-600">
                        {individualOrderData?.computed?.balanceDue}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Acciones rápidas
                    </CardTitle>
                    <CardDescription>Operaciones comunes</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {/* CARD actions (hide if payment is void) */}
                    {individualOrderData?.payments[0]?.method === "card" &&
                      individualOrderData?.payments[0]?.status !== "void" && (
                        <>
                          {/* WORKING */}
                          <Button
                            className="justify-start w-auto"
                            onClick={onClickFinalizeCard(orderId)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Terminar pago con tarjeta
                          </Button>

                          {/* WORKING */}
                          <Button
                            variant="outline"
                            className="justify-start"
                            onClick={onClickSwitchToCash(orderId)}
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            Cambiar pago a efectivo
                          </Button>
                        </>
                      )}

                    {/* CASH actions (hide if payment is void) */}
                    {individualOrderData?.payments[0]?.method === "cash" &&
                      individualOrderData?.payments[0]?.status !== "void" && (
                        <>
                          <Button
                            className="justify-start w-auto"
                            onClick={onClickFinalizeCash(orderId)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Terminar pago en efectivo
                          </Button>

                          {/* WORKING */}
                          <Button
                            variant="outline"
                            className="justify-start"
                            onClick={onClickSwitchToCard(orderId)}
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            Cambiar pago a tarjeta
                          </Button>
                        </>
                      )}

                    {/* Cancel order (only when pending; naturally hidden if void) */}
                    {individualOrderData?.order.status === "open" &&
                      individualOrderData?.payments[0]?.status ===
                        "pending" && (
                        <>
                          <Button
                            variant="delete"
                            className="justify-start"
                            onClick={() => setIsCancelDialogOpen(true)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancelar orden
                          </Button>

                          {/* Dialog: confirm with the function above */}
                          <Dialog
                            open={isCancelDialogOpen}
                            onOpenChange={setIsCancelDialogOpen}
                          >
                            <DialogContent className="sm:max-w-[520px]">
                              <DialogHeader>
                                <DialogTitle>Cancelar orden</DialogTitle>
                                <DialogDescription>
                                  Esta acción anulará los pagos pendientes y
                                  cancelará la tarifa si no ha sido usada. No
                                  podrás deshacer esta acción.
                                </DialogDescription>
                              </DialogHeader>

                              <DialogFooter className="gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsCancelDialogOpen(false)}
                                >
                                  Volver
                                </Button>
                                <Button
                                  variant="delete"
                                  onClick={onClickCancelOrder(orderId)}
                                >
                                  Confirmar cancelación
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                    {/* Only show this when order is open AND payment is void */}
                    {individualOrderData?.order?.status === "open" &&
                      individualOrderData?.payments?.[0]?.status === "void" && (
                        <>
                          <Button
                            className="justify-start w-auto"
                            onClick={() => setIsNewPaymentDialogOpen(true)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Iniciar nuevo pago
                          </Button>

                          <Dialog
                            open={isNewPaymentDialogOpen}
                            onOpenChange={setIsNewPaymentDialogOpen}
                          >
                            <DialogContent className="sm:max-w-[420px]!">
                              <DialogHeader>
                                <DialogTitle>Iniciar nuevo pago</DialogTitle>
                                <DialogDescription>
                                  El pago anterior fue anulado. Selecciona el
                                  método para reiniciar el cobro.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Método de pago
                                  </label>
                                  <Select
                                    value={newPaymentMethod}
                                    onValueChange={(v) =>
                                      setNewPaymentMethod(v as "card" | "cash")
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Selecciona método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="card">
                                        Tarjeta
                                      </SelectItem>
                                      <SelectItem value="cash">
                                        Efectivo
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <DialogFooter className="gap-2 mt-2">
                                <Button
                                  className="w-auto"
                                  variant="outline"
                                  onClick={() =>
                                    setIsNewPaymentDialogOpen(false)
                                  }
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  className="w-auto"
                                  onClick={onClickStartNewPayment(
                                    orderId,
                                    newPaymentMethod
                                  )}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  Confirmar e iniciar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer (sticks to bottom) */}
          <DialogFooter className="shrink-0 border-t bg-background px-4 py-3">
            <div className="flex w-full items-center justify-end gap-2">
              {/*  <Button
              variant="default"
              className="w-auto"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button> */}
              <DialogClose asChild>
                <Button>Hecho</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <StripeQRDialog
        open={!!qrData}
        onOpenChange={(open: any) => !open && setQrData(null)}
        checkoutUrl={qrData?.checkoutUrl ?? ""}
        orderId={qrData?.orderId}
        onCopied={() => toast.success("Enlace copiado")}
      />
    </>
  );
}
