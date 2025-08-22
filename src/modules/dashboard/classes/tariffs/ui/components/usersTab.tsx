/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Tag,
  TicketPercent,
  UserX,
} from "lucide-react";
import Section from "./section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import { useAllMonthlyTariffs } from "@/app/queries/tariffs";
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

const addTariffFormSchema = z.object({
  userId: z.number(),
  planId: z.number(),
  startsOn: z.date().optional(),
  customExpiresOn: z.date().optional(),
  remainingCredits: z.string().min(1).max(15).optional(),
  note: z.string().max(100).optional(),
});

const MOCK_USERS_TARIFFS = [
  {
    id: 201,
    name: "Carlos Ruiz",
    email: "carlos@example.com",
    plan: "Mensual 13",
    expires: "2025-08-31",
  },
];

const MOCK_USERS_BONOS = [
  {
    id: 301,
    name: "Sofía Torres",
    email: "sofia@example.com",
    plan: "Bono 10",
    creditsLeft: 3,
    expires: "2026-01-10",
  },
];

const MOCK_INACTIVE_ATHLETES = [
  {
    id: 401,
    name: "Diego Pérez",
    email: "diego@example.com",
    lastTariffEnd: "2025-05-31",
  },
];

const UsersTab = () => {
  const [isAddTariffDialogOpen, setIsAddTariffDialogOpen] = useState(false);

  const { data: allUsers } = useQuery(usersQueryOptions());
  const { data: allMonthlyTariffs } = useAllMonthlyTariffs();

  const userOptions = [
    ...(allUsers?.map((user: any) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  const tariffOptions = [
    ...(allMonthlyTariffs?.tariffs?.map((tariff: any) => ({
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

  function onSubmitAddTariffForm(values: z.infer<typeof addTariffFormSchema>) {
    const payload = {
      ...values,
      startsOn: values.startsOn ? toYMD(values.startsOn as Date) : undefined,
      customExpiresOn: values.customExpiresOn
        ? toYMD(values.customExpiresOn as Date)
        : undefined,
      remainingCredits: Number(values.remainingCredits),
    };

    console.log("payload", payload);
    // send payload...
  }
  return (
    <div className="grid gap-6">
      <Tabs defaultValue="with-tariffs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="with-tariffs">Con Tarifas</TabsTrigger>
          <TabsTrigger value="with-bonos">Con Bonos</TabsTrigger>
          <TabsTrigger value="inactive">Inactivos</TabsTrigger>
        </TabsList>

        <TabsContent value="with-tariffs" className="mt-4">
          <Section icon={Tag} title="Atletas con Tarifas">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full md:max-w-md items-center gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                  <Input
                    placeholder="Buscar atletas con tarifas"
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsAddTariffDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> Añadir
                </Button>
                <Button variant="outline" size="icon" title="Refrescar">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator className="my-4" />
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
                  {MOCK_USERS_TARIFFS.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.plan}</TableCell>
                      <TableCell>{u.expires}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
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
                            value={
                              field.value == null ? "" : String(field.value)
                            } // number -> string
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
                            value={
                              field.value == null ? "" : String(field.value)
                            } // number -> string
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
                          Elige una fecha de inicio para la tarifa. Si se
                          selecciona la tarifa empieza hoy
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
                          Selecciona cuándo termina la tarifa. Si no se
                          selecciona la tarifa termina dentro de un mes
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
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="with-bonos" className="mt-4">
          <Section icon={TicketPercent} title="Atletas con Bonos">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full md:max-w-md items-center gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                  <Input
                    placeholder="Buscar atletas con bonos"
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => {}} className="gap-2">
                  <Plus className="h-4 w-4" /> Añadir
                </Button>
                <Button variant="outline" size="icon" title="Refrescar">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator className="my-4" />
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Créditos restantes</TableHead>
                    <TableHead>Expira</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_USERS_BONOS.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.plan}</TableCell>
                      <TableCell>{u.creditsLeft}</TableCell>
                      <TableCell>{u.expires}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Section>
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          <Section icon={UserX} title="Atletas Inactivos">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full md:max-w-md items-center gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                  <Input
                    placeholder="Buscar atletas con inactivos"
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" /> Filtros
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => {}} className="gap-2">
                  <Plus className="h-4 w-4" /> Añadir
                </Button>
                <Button variant="outline" size="icon" title="Refrescar">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator className="my-4" />
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Última tarifa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_INACTIVE_ATHLETES.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.lastTariffEnd}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersTab;
