/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

import { DollarSignIcon, SearchIcon, MoreHorizontal } from "lucide-react";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  ordersByMonthQueryOptions,
  pendingOrdersQueryOptions,
} from "@/app/queries/orders";
import { es } from "date-fns/locale";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { OrderDialog } from "../components/orderDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export const TransactionsView = () => {
  const today = new Date();

  //Filter states
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfMonth(today)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(today));
  const [orderType, setOrderType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  function openOrder(orderId: number) {
    setSelectedOrderId(orderId);
    setOpen(true);
  }

  const toYMD = (d: Date) => format(d, "yyyy-MM-dd");

  // API params (YYYY-MM-DD)
  const startParam = startDate ? toYMD(startDate) : "";
  const endParam = endDate ? toYMD(endDate) : "";

  // Calendar expects a DateRange; convert from our two states
  const selectedRange: DateRange | undefined =
    startDate || endDate ? { from: startDate, to: endDate } : undefined;

  const { data: ordersData } = useQuery(
    ordersByMonthQueryOptions(startParam, endParam)
  );

  const { data: pendingOrders } = useQuery(pendingOrdersQueryOptions());

  //Format the label in the calendar filter so it's understandable
  const formattedRange = useMemo(() => {
    if (startDate && endDate) {
      const sameYear = startDate.getFullYear() === endDate.getFullYear();
      const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

      if (sameMonth) {
        // 28 - 30 August 2025
        return `${format(startDate, "d")} - ${format(endDate, "d MMMM yyyy", {
          locale: es,
        })}`;
      }

      if (sameYear) {
        // 28 August - 3 September 2025
        return `${format(startDate, "d MMMM", { locale: es })} - ${format(
          endDate,
          "d MMMM yyyy",
          { locale: es }
        )}`;
      }

      // Different years
      return `${format(startDate, "d MMMM yyyy", {
        locale: es,
      })} - ${format(endDate, "d MMMM yyyy", { locale: es })}`;
    }

    if (startDate) {
      return `${format(startDate, "d MMMM yyyy", { locale: es })} - ...`;
    }

    return "Filtrar por fechas";
  }, [startDate, endDate]);

  // --- filtered data ---
  const filteredOrders = useMemo(() => {
    const rows = ordersData?.results ?? []; // <= ensure array
    return rows.filter((o: any) => {
      if (orderType && o.orderType !== orderType) return false;
      if (status && o.status !== status) return false;
      if (paymentMethod && o.paymentMethod !== paymentMethod) return false;

      const query = search.toLowerCase();
      if (
        query &&
        !(
          `${o.userName ?? ""} ${o.userLastName ?? ""}`
            .toLowerCase()
            .includes(query) ||
          o.note?.toLowerCase().includes(query) ||
          o.itemName?.toLowerCase().includes(query)
        )
      )
        return false;

      // date range (inclusive end-of-day)
      if (startDate && new Date(o.createdAt) < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(o.createdAt) > endOfDay) return false;
      }

      return true;
    });
  }, [
    ordersData,
    orderType,
    status,
    paymentMethod,
    search,
    startDate,
    endDate,
  ]);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15); // opciones: 5,10,20,50...

  // Reset to first page when cambian los filtros/datos
  useEffect(() => {
    setPage(1);
  }, [filteredOrders]); // o [orderType, status, paymentMethod, search, startDate, endDate]

  // Totales y página actual
  const total = filteredOrders?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  const pageRows = useMemo(
    () => (filteredOrders ?? []).slice(startIdx, endIdx),
    [filteredOrders, startIdx, endIdx]
  );

  const fmtMoney = (v?: string | number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(Number(v ?? 0));

  const typeLabel: Record<string, string> = {
    member_sale: "Venta cliente",
    internal_use: "Consumo interno",
    stock_purchase: "Compra stock",
  };

  function statusBadge(status: string) {
    switch (status) {
      case "paid":
        return { label: "Pagada", variant: "green" as const };
      case "settled":
        return { label: "Liquidada", variant: "default" as const };
      case "open":
        return { label: "Abierta", variant: "yellow" as const };
      case "canceled":
        return { label: "Cancelada", variant: "red" as const };
      default:
        return { label: status, variant: "gray" as const };
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border bg-background p-2 shadow-sm">
            <DollarSignIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Gestión de Transacciones
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra compras y órdenes registradas
            </p>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="flex flex-wrap items-center justify-center w-full">
            <TabsTrigger value="all">Todas las transacciones</TabsTrigger>
            <TabsTrigger value="pending">Lista de morosos</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="mx-auto w-full space-y-6">
              {/* Filters + Search */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-start gap-4 mt-4">
                <div className="flex flex-wrap gap-6 items-center">
                  {/* Order Type */}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="orderType"
                      className="text-xs text-muted-foreground"
                    >
                      Tipo de orden
                    </Label>
                    <Select
                      value={orderType ?? "all"}
                      onValueChange={(v) =>
                        setOrderType(v === "all" ? undefined : v)
                      }
                    >
                      <SelectTrigger id="orderType" className="w-[160px]">
                        <SelectValue placeholder="Tipo de orden" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="member_sale">
                          Venta cliente
                        </SelectItem>
                        <SelectItem value="internal_use">
                          Consumo interno
                        </SelectItem>
                        <SelectItem value="stock_purchase">
                          Compra stock
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="status"
                      className="text-xs text-muted-foreground"
                    >
                      Estado
                    </Label>
                    <Select
                      value={status ?? "all"}
                      onValueChange={(v) =>
                        setStatus(v === "all" ? undefined : v)
                      }
                    >
                      <SelectTrigger id="status" className="w-[160px]">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="open">Abierta</SelectItem>
                        <SelectItem value="paid">Pagada</SelectItem>
                        <SelectItem value="settled">Liquidada</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="paymentMethod"
                      className="text-xs text-muted-foreground"
                    >
                      Método de pago
                    </Label>
                    <Select
                      value={paymentMethod ?? "all"}
                      onValueChange={(v) =>
                        setPaymentMethod(v === "all" ? undefined : v)
                      }
                    >
                      <SelectTrigger id="paymentMethod" className="w-[160px]">
                        <SelectValue placeholder="Método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-1 w-full max-w-sm">
                  <Label
                    htmlFor="search"
                    className="text-xs text-muted-foreground"
                  >
                    Búsqueda
                  </Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por nombre, nota..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Calendar Date Filter */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Rango de fechas
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-auto min-w-[220px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>{formattedRange}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={selectedRange}
                        onSelect={(r) => {
                          setStartDate(r?.from);
                          setEndDate(r?.to);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Transactions Table */}
              <Card>
                <CardHeader className="px-6">
                  <h2 className="text-2xl font-semibold">
                    Transacciones recientes
                  </h2>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead className="w-[200px]">Cliente</TableHead>
                        <TableHead className="w-[200px]">Item</TableHead>
                        <TableHead className="w-[150px]">Tipo</TableHead>
                        <TableHead className="w-[120px]">Estado</TableHead>
                        <TableHead className="w-[100px]">Pago</TableHead>
                        <TableHead className="w-[100px]">Total</TableHead>
                        <TableHead className="w-[130px] hidden md:table-cell">
                          Fecha
                        </TableHead>
                        <TableHead className="w-[56px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {total === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center text-muted-foreground"
                          >
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        pageRows.map((o: any) => {
                          const s = statusBadge(o.status);
                          return (
                            <TableRow
                              key={o.id}
                              onClick={() => openOrder(o.id)}
                              className="cursor-pointer hover:bg-accent/40"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  openOrder(o.id);
                              }}
                            >
                              <TableCell className="w-[60px]">
                                #{o.id}
                              </TableCell>
                              <TableCell className="w-[200px]">
                                {[o.userName, o.userLastName]
                                  .filter(Boolean)
                                  .join(" ") || `#${o.userId}`}
                              </TableCell>
                              <TableCell className="w-[200px]">
                                {o.itemName ?? "—"}
                              </TableCell>
                              <TableCell className="w-[150px]">
                                <Badge variant="gray">
                                  {typeLabel[o.orderType] ?? o.orderType}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[120px]">
                                <Badge variant={s.variant}>{s.label}</Badge>
                              </TableCell>
                              <TableCell className="w-[100px] capitalize">
                                {o.paymentMethod ?? "—"}
                              </TableCell>
                              <TableCell className="w-[100px]">
                                {fmtMoney(o.total)}
                              </TableCell>
                              <TableCell className="w-[130px] hidden md:table-cell">
                                {o.createdAt
                                  ? format(
                                      new Date(o.createdAt),
                                      "yyyy-MM-dd",
                                      {
                                        locale: es,
                                      }
                                    )
                                  : "—"}
                              </TableCell>
                              <TableCell className="w-[56px]">
                                <Button
                                  className="ml-3"
                                  variant="default"
                                  size="icon"
                                  aria-label="Más acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Controles de paginación (shadcn/ui) */}
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          aria-label="Anterior"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink isActive>{page}</PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext
                          aria-label="Siguiente"
                          onClick={() =>
                            setPage((p) => Math.min(pageCount, p + 1))
                          }
                          className={
                            page === pageCount
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </Card>

              <OrderDialog
                orderId={selectedOrderId}
                open={open}
                onOpenChange={(v) => {
                  if (!v) setSelectedOrderId(null);
                  setOpen(v);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="mx-auto w-full space-y-6">
              <Card>
                <CardHeader className="px-6">
                  <h2 className="text-2xl font-semibold">
                    Transacciones pendientes
                  </h2>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead className="w-[200px]">Cliente</TableHead>
                        <TableHead className="w-[200px]">Item</TableHead>
                        <TableHead className="w-[150px]">Tipo</TableHead>
                        <TableHead className="w-[120px]">Estado</TableHead>
                        <TableHead className="w-[100px]">Pago</TableHead>
                        <TableHead className="w-[100px]">Total</TableHead>
                        <TableHead className="w-[130px] hidden md:table-cell">
                          Fecha
                        </TableHead>
                        <TableHead className="w-[56px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pendingOrders?.results?.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center text-muted-foreground"
                          >
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingOrders?.results?.map((o: any) => {
                          const s = statusBadge(o.status);
                          return (
                            <TableRow
                              key={o.id}
                              onClick={() => openOrder(o.id)}
                              className="cursor-pointer hover:bg-accent/40"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  openOrder(o.id);
                              }}
                            >
                              <TableCell className="w-[60px]">
                                #{o.id}
                              </TableCell>
                              <TableCell className="w-[200px]">
                                {[o.userName, o.userLastName]
                                  .filter(Boolean)
                                  .join(" ") || `#${o.userId}`}
                              </TableCell>
                              <TableCell className="w-[200px]">
                                {o.itemName ?? "—"}
                              </TableCell>
                              <TableCell className="w-[150px]">
                                <Badge variant="gray">
                                  {typeLabel[o.orderType] ?? o.orderType}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[120px]">
                                <Badge variant={s.variant}>{s.label}</Badge>
                              </TableCell>
                              <TableCell className="w-[100px] capitalize">
                                {o.paymentMethod ?? "—"}
                              </TableCell>
                              <TableCell className="w-[100px]">
                                {fmtMoney(o.total)}
                              </TableCell>
                              <TableCell className="w-[130px] hidden md:table-cell">
                                {o.createdAt
                                  ? format(
                                      new Date(o.createdAt),
                                      "yyyy-MM-dd",
                                      {
                                        locale: es,
                                      }
                                    )
                                  : "—"}
                              </TableCell>
                              <TableCell className="w-[56px]">
                                <Button
                                  className="ml-3"
                                  variant="default"
                                  size="icon"
                                  aria-label="Más acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <OrderDialog
                orderId={selectedOrderId}
                open={open}
                onOpenChange={(v) => {
                  if (!v) setSelectedOrderId(null);
                  setOpen(v);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
