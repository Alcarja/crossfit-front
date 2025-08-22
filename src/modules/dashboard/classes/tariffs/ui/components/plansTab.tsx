/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import {
  Edit,
  Filter,
  MoreVertical,
  Plus,
  RefreshCcw,
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
import { useForm } from "react-hook-form";
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
import { useEffect, useState } from "react";
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

export const createTariffFormSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio").max(50),
  price: z.number().min(0, "Debe ser mayor o igual a 0"),
  limitType: z.enum(["unlimited", "limited"]),
  creditQty: z.number().int().positive().nullable().optional(),
  maxPerDay: z.number().int().positive().nullable().optional(),
  isActive: z.boolean(),
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
};

type Bono = {
  id: number;
  name: string;
  price: string;
  creditQty: number | null;
  isActive: boolean;
};

type TariffRowActionsProps = {
  tariff: Tariff;
  onOpen?: (tariff: Tariff) => void;
  onEdit?: (tariff: Tariff) => void;
  onDelete?: (tariff: Tariff) => void;
};

const TariffRowActions: React.FC<TariffRowActionsProps> = ({
  tariff,
  onOpen,
  onEdit,
  onDelete,
}) => (
  <DropdownMenu onOpenChange={(open) => open && onOpen?.(tariff)}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="w-auto">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40">
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="gap-2" onClick={() => onEdit?.(tariff)}>
        <Edit className="h-4 w-4" /> Editar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="gap-2 text-red-600 focus:text-red-600"
        onClick={() => onDelete?.(tariff)}
      >
        <Trash2 className="h-4 w-4" /> Eliminar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

type BonoRowActionsProps = {
  bono: Bono;
  onOpen?: (bono: Bono) => void;
  onEdit?: (bono: Bono) => void;
  onDelete?: (bono: Bono) => void;
};

const BonoRowActions: React.FC<BonoRowActionsProps> = ({
  bono,
  onOpen,
  onEdit,
  onDelete,
}) => (
  <DropdownMenu onOpenChange={(open) => open && onOpen?.(bono)}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="w-auto">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40">
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="gap-2" onClick={() => onEdit?.(bono)}>
        <Edit className="h-4 w-4" /> Editar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="gap-2 text-red-600 focus:text-red-600"
        onClick={() => onDelete?.(bono)}
      >
        <Trash2 className="h-4 w-4" /> Eliminar
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const PlansTab = () => {
  const queryClient = useQueryClient();

  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [selectedBono, setSelectedBono] = useState<Bono | null>(null);

  const [openCreateNewTariff, setOpenCreateNewTariff] = useState(false);
  const [openEditTariff, setOpenEditTariff] = useState(false);

  const [openCreateNewBono, setOpenCreateNewBono] = useState(false);
  const [openEditBono, setOpenEditBono] = useState(false);

  const form = useForm<CreateTariffFormValues>({
    resolver: zodResolver(createTariffFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      limitType: "unlimited",
      creditQty: 0, // ✅ match schema
      maxPerDay: 0, // ✅ match schema
      isActive: true,
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
    },
  });

  const bonoForm = useForm<CreateBonoFormValues>({
    resolver: zodResolver(createBonoFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      creditQty: 0, // ✅ match schema
      isActive: true,
    },
  });

  const editBonoForm = useForm<CreateBonoFormValues>({
    resolver: zodResolver(createBonoFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      creditQty: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!selectedTariff) return;

    // derive limitType from DB row
    const limitType: "limited" | "unlimited" =
      selectedTariff.creditQty != null ? "limited" : "unlimited";

    editForm.reset({
      name: selectedTariff.name,
      price: Number(selectedTariff.price), // db returns string → number
      limitType,
      creditQty: selectedTariff.creditQty, // number | null
      maxPerDay: selectedTariff.maxPerDay, // number | null
      isActive: selectedTariff.isActive,
    });
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

  const { mutate } = useCreateMonthlyTariff();

  function onSubmit(values: CreateTariffFormValues) {
    mutate(
      {
        name: values.name,
        price: values.price,
        isActive: values.isActive,
        creditQty:
          values.limitType === "limited"
            ? values.creditQty ?? null // ensure it's null, not undefined
            : null,
        maxPerDay:
          values.limitType === "unlimited"
            ? values.maxPerDay ?? null // ensure it's null, not undefined
            : null,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allMonthlyTariffs"] });
          toast.success("New tariff saved!");
          form.reset();
          setOpenCreateNewTariff(false);
        },
        onError: () => {
          console.error("Error creating new tariff");
          toast.error("Error creating new tariff");
          // form.reset();
        },
      }
    );
  }

  const { mutate: mutateUpdateMonthlyTariff } = useUpdateMonthlyTariff();

  function onSubmitEditForm(values: CreateTariffFormValues) {
    if (!selectedTariff) return; // ensure you have one selected

    const data = {
      name: values.name,
      price: values.price,
      isActive: values.isActive,
      creditQty:
        values.limitType === "limited" ? values.creditQty ?? null : null,
      maxPerDay:
        values.limitType === "unlimited" ? values.maxPerDay ?? null : null,
    };

    mutateUpdateMonthlyTariff(
      { id: selectedTariff.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allMonthlyTariffs"] });
          toast.success("Tarifa actualizada");
          editForm.reset(); // ✅ reset the EDIT form
          setOpenEditTariff(false); // ✅ close the EDIT dialog
        },
        onError: () => {
          toast.error("Error actualizando tarifa");
        },
      }
    );
  }

  //FORM FIELDS CONTROL

  //This controls what formField is used when you switch limitType in the edit form
  const editLimitType = editForm.watch("limitType");

  useEffect(() => {
    if (editLimitType === "unlimited") {
      editForm.setValue("creditQty", null, { shouldValidate: true });
    } else {
      editForm.setValue("maxPerDay", null, { shouldValidate: true });
    }
  }, [editLimitType]); // eslint-disable-line react-hooks/exhaustive-deps

  //This controls what formField is used when you switch limitType in the create form
  const limitType = form.watch("limitType");

  useEffect(() => {
    if (limitType === "unlimited") {
      // clear creditQty
      form.setValue("creditQty", null, { shouldValidate: true });
    } else {
      // clear maxPerDay
      form.setValue("maxPerDay", null, { shouldValidate: true });
    }
  }, [limitType]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: mutateBono } = useCreateBonoTariff();

  function onSubmiCreateBono(values: CreateBonoFormValues) {
    mutateBono(
      {
        name: values.name,
        price: values.price,
        isActive: values.isActive,
        creditQty: values.creditQty || 0,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allBonoTariffs"] });
          toast.success("New bono saved!");
          form.reset();
          setOpenCreateNewBono(false);
        },
        onError: () => {
          console.error("Error creating new bono");
          toast.error("Error creating new bono");
        },
      }
    );
  }

  const { mutate: mutateUpdateBonoTariff } = useUpdateBonoTariff();

  function onSubmitEditBonoForm(values: CreateBonoFormValues) {
    if (!selectedBono) return; // ensure you have one selected

    const data = {
      name: values.name,
      price: values.price,
      isActive: values.isActive,
      creditQty: values.creditQty,
    };

    mutateUpdateBonoTariff(
      { id: selectedBono.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["allBonoTariffs"] });
          toast.success("Bono actualizado");
          editForm.reset(); // ✅ reset the EDIT form
          setOpenEditBono(false); // ✅ close the EDIT dialog
        },
        onError: () => {
          toast.error("Error actualizando bono");
        },
      }
    );
  }

  const { data: allMonthlyTariffs } = useAllMonthlyTariffs();

  const { data: allBonoTariffs } = useAllBonoTariffs();

  return (
    <div className="grid gap-6">
      {/* Tarifas mensuales */}
      <Section icon={Tag} title="Tarifas (Mensuales)">
        <div
          className={cn(
            "flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          )}
        >
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
              onOpenChange={setOpenCreateNewTariff}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 w-auto">
                  <Plus className="h-4 w-4" /> Añadir Tarifa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva tarifa</DialogTitle>
                  <DialogDescription>
                    Define nombre, precio, créditos mensuales y límite por día.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
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

                    {/* Tipo de uso */}
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
                                <RadioGroupItem
                                  value="unlimited"
                                  id="unlimited"
                                />
                                <label htmlFor="unlimited" className="text-sm">
                                  Ilimitada
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="limited" id="limited" />
                                <label htmlFor="limited" className="text-sm">
                                  Limitada
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Condicional: Créditos (si limitada) */}
                    {limitType === "limited" && (
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
                    )}

                    {/* Condicional: Máx. por día (si ilimitada) */}
                    {limitType === "unlimited" && (
                      <FormField
                        control={form.control}
                        name="maxPerDay"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Máx. clases por día</FormLabel>
                            <Select
                              // show placeholder when null
                              value={
                                field.value == null ? "" : String(field.value)
                              }
                              onValueChange={(v) =>
                                field.onChange(v === "none" ? null : Number(v))
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Número por día" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {/* Use non-empty values for all items */}
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

                    {/* Submit */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="submit">Crear tarifa</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" title="Refrescar">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
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
              {allMonthlyTariffs?.tariffs?.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="w-1/5">{t.name}</TableCell>

                  <TableCell className="w-1/5 text-center tabular-nums">
                    {t.maxPerDay !== null && t.maxPerDay !== undefined
                      ? `${t.maxPerDay} / día`
                      : t.creditQty ?? "—"}
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
                    <TariffRowActions
                      tariff={t}
                      onOpen={(tariff) => setSelectedTariff(tariff)}
                      onEdit={(tariff) => {
                        setSelectedTariff(tariff);
                        setOpenEditTariff(true); // <-- open edit
                      }}
                      onDelete={(tariff) => {
                        setSelectedTariff(tariff);
                        // open delete confirm
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <Dialog open={openEditTariff} onOpenChange={setOpenEditTariff}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar tarifa</DialogTitle>
              <DialogDescription>
                Actualiza nombre, precio y límites de la tarifa seleccionada.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onSubmitEditForm)}
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

                {/* Tipo de uso */}
                <FormField
                  control={editForm.control}
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
                            <RadioGroupItem
                              value="unlimited"
                              id="unlimited_edit"
                            />
                            <label htmlFor="unlimited_edit" className="text-sm">
                              Ilimitada
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="limited" id="limited_edit" />
                            <label htmlFor="limited_edit" className="text-sm">
                              Limitada
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Condicional: Créditos (si limitada) */}
                {editLimitType === "limited" && (
                  <FormField
                    control={editForm.control}
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
                )}

                {/* Condicional: Máx. por día (si ilimitada) */}
                {editLimitType === "unlimited" && (
                  <FormField
                    control={editForm.control}
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
                            <SelectTrigger>
                              <SelectValue placeholder="Sin límite por día" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 por día</SelectItem>
                            <SelectItem value="2">2 por día</SelectItem>
                            <SelectItem value="none">Sin límite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
        <div
          className={cn(
            "flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          )}
        >
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
                    onSubmit={bonoForm.handleSubmit(onSubmiCreateBono)}
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
                              aria-label="Activar tarifa"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="submit">Crear bono</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" title="Refrescar">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
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
              {allBonoTariffs?.tariffs?.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="w-1/5">{t.name}</TableCell>

                  <TableCell className="w-1/5 text-center tabular-nums">
                    {t.maxPerDay !== null && t.maxPerDay !== undefined
                      ? `${t.maxPerDay} / día`
                      : t.creditQty ?? "—"}
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
                    <BonoRowActions
                      bono={t}
                      onOpen={(bono) => setSelectedBono(bono)}
                      onEdit={(bono) => {
                        setSelectedBono(bono);
                        setOpenEditBono(true); // ✅ open bono edit
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
        <Dialog open={openEditBono} onOpenChange={setOpenEditBono}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar bono</DialogTitle>
              <DialogDescription>
                Actualiza nombre, precio y límites del bono seleccionado.
              </DialogDescription>
            </DialogHeader>

            <Form {...editBonoForm}>
              <form
                onSubmit={editBonoForm.handleSubmit(onSubmitEditBonoForm)}
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
                  <Button className="w-auto" type="submit">
                    Guardar cambios
                  </Button>
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
