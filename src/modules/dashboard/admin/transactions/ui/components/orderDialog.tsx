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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  CreditCard,
  Wallet,
  RotateCw,
  Ban,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  const [newPaymentOpen, setNewPaymentOpen] = useState<null | {
    method: "cash" | "card";
  }>(null);

  const [confirmCancel, setConfirmCancel] = useState<null | { id: number }>(
    null
  );

  const { data: individualOrderData, isFetching } = useQuery(
    orderByIdQueryOptions(orderId as number)
  );

  useEffect(() => {
    console.log("Individual order data", individualOrderData);
  }, [individualOrderData]);

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
      canceled: { label: "Cancelado", variant: "red" },
      refunded: { label: "Reembolsado", variant: "gray" },
    };
    const cfg = map[status] ?? { label: status, variant: "outline" as const };
    return (
      <Badge variant={cfg.variant} className="capitalize">
        {cfg.label}
      </Badge>
    );
  }

  return (
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

                    <Button
                      className="w-auto"
                      size="sm"
                      onClick={() => setNewPaymentOpen({ method: "cash" })}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Nuevo pago
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="mt-4">
                  {(individualOrderData?.payments?.length ?? 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                      <div className="text-sm text-muted-foreground">
                        Aún no hay pagos.
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setNewPaymentOpen({ method: "cash" })}
                      >
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
                          <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {(individualOrderData?.payments ?? []).map(
                          (payment: any) => {
                            const isOpen = [
                              "pending",
                              "processing",
                              "requires_action",
                            ].includes(payment.status);
                            const isSucceeded = payment.status === "succeeded";
                            const isCanceled = payment.status === "canceled";

                            return (
                              <TableRow key={payment.id}>
                                <TableCell className="w-[70px]">
                                  #{payment.id}
                                </TableCell>
                                <TableCell className="capitalize w-[120px]">
                                  <Badge variant="gray">{payment.method}</Badge>
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

                                {/* ACTIONS */}
                                <TableCell className="w-[100px] pl-5">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Acciones"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                      align="end"
                                      className="w-56"
                                    >
                                      {/* Succeeded */}
                                      {isSucceeded && (
                                        <DropdownMenuItem
                                        // onClick={() => viewReceipt(p.id)}
                                        >
                                          Ver recibo
                                        </DropdownMenuItem>
                                      )}

                                      {/* Canceled */}
                                      {isCanceled && (
                                        <DropdownMenuItem
                                        // onClick={() => setNewPaymentOpen({ method: "cash" })}
                                        >
                                          Nuevo pago
                                        </DropdownMenuItem>
                                      )}

                                      {/* Open + CASH */}
                                      {isOpen && payment.method === "cash" && (
                                        <>
                                          <DropdownMenuItem
                                          // onClick={() => settleCash(p.id)}
                                          >
                                            <Check className="mr-2 h-4 w-4" />
                                            Liquidar efectivo
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                          // onClick={() => convertMethod(p.id, "card")}
                                          >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Cambiar a tarjeta
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() =>
                                              setConfirmCancel({
                                                id: payment.id,
                                              })
                                            }
                                          >
                                            <Ban className="mr-2 h-4 w-4" />
                                            Cancelar
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      {/* Open + CARD */}
                                      {isOpen && payment.method === "card" && (
                                        <>
                                          <DropdownMenuItem
                                          // onClick={() => finishCard(p.id)}
                                          >
                                            <RotateCw className="mr-2 h-4 w-4" />
                                            Finalizar con tarjeta
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                          // onClick={() => convertMethod(p.id, "cash")}
                                          >
                                            <Wallet className="mr-2 h-4 w-4" />
                                            Cambiar a efectivo
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() =>
                                              setConfirmCancel({
                                                id: payment.id,
                                              })
                                            }
                                          >
                                            <Ban className="mr-2 h-4 w-4" />
                                            Cancelar
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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

              {/* New Payment */}
              <Dialog
                open={!!newPaymentOpen}
                onOpenChange={(v) => !v && setNewPaymentOpen(null)}
              >
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Nuevo pago</DialogTitle>
                    <DialogDescription>
                      Registra un nuevo pago para esta orden.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Método</Label>
                      <div className="col-span-3">
                        <Select defaultValue={newPaymentOpen?.method ?? "cash"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Importe</Label>
                      <div className="col-span-3">
                        <Input placeholder="0,00" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right">Nota</Label>
                      <div className="col-span-3">
                        <Textarea placeholder="Opcional" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setNewPaymentOpen(null)}
                    >
                      Cerrar
                    </Button>
                    <Button /* onClick={createPayment} */>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Cancel payment */}
              <Dialog
                open={!!confirmCancel}
                onOpenChange={(v) => !v && setConfirmCancel(null)}
              >
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Cancelar pago</DialogTitle>
                    <DialogDescription>
                      ¿Seguro que deseas cancelar este pago? Esta acción no se
                      puede deshacer.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmCancel(null)}
                    >
                      Cerrar
                    </Button>
                    <Button
                      variant="delete"
                      // onClick={() => { cancelPayment(confirmCancel!.id); setConfirmCancel(null); }}
                    >
                      Cancelar pago
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>€120.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">€120.00</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pendiente</span>
                    <span className="font-semibold text-amber-600">
                      €120.00
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Acciones rápidas</CardTitle>
                  <CardDescription>Operaciones comunes</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button className="justify-start w-auto">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cobrar con tarjeta
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Wallet className="mr-2 h-4 w-4" />
                    Registrar efectivo
                  </Button>
                  <Button variant="delete" className="justify-start">
                    <Ban className="mr-2 h-4 w-4" />
                    Cancelar orden
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* === END ORDER MANAGEMENT UI === */}
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
  );
}
