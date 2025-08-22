/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  CalendarIcon,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Tag,
} from "lucide-react";
import Section from "../section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import {
  useAllMonthlyTariffs,
  useAssignMonthlyTariff,
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

const TariffsTab = () => {
  //const queryClient = useQueryClient();
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
      onSuccess: async () => {
        //await queryClient.invalidateQueries({ queryKey: ["user_tariffs"] });
        toast.success("Tariff assigned to user!");
        setIsAddTariffDialogOpen(false);
        addTariffForm.reset();
      },
      onError: (err) => {
        console.error("assignMonthlyTariff failed:", err);
        // show a toast if you have one
      },
    });
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
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TariffsTab;
