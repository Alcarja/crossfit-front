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
import { cn } from "@/lib/utils";
import {
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Tag,
  TicketPercent,
  UserX,
} from "lucide-react";
import Section from "./section";

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

const Toolbar = ({
  placeholder,
  onAdd,
  addLabel = "Añadir",
  className,
}: {
  placeholder: string;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
      className
    )}
  >
    <div className="flex w-full md:max-w-md items-center gap-2">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
        <Input placeholder={placeholder} className="pl-9" />
      </div>
      <Button variant="outline" className="gap-2">
        <Filter className="h-4 w-4" /> Filtros
      </Button>
    </div>
    <div className="flex items-center gap-2">
      <Button onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
      <Button variant="outline" size="icon" title="Refrescar">
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const UsersTab = () => (
  <div className="grid gap-6">
    <Tabs defaultValue="with-tariffs" className="w-full">
      <TabsList className="grid w-full grid-cols-3 rounded-2xl">
        <TabsTrigger value="with-tariffs">Con Tarifas</TabsTrigger>
        <TabsTrigger value="with-bonos">Con Bonos</TabsTrigger>
        <TabsTrigger value="inactive">Inactivos</TabsTrigger>
      </TabsList>

      <TabsContent value="with-tariffs" className="mt-4">
        <Section icon={Tag} title="Atletas con Tarifas">
          <Toolbar placeholder="Buscar atletas con tarifas…" />
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
      </TabsContent>

      <TabsContent value="with-bonos" className="mt-4">
        <Section icon={TicketPercent} title="Atletas con Bonos">
          <Toolbar placeholder="Buscar atletas con bonos…" />
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
          <Toolbar placeholder="Buscar atletas inactivos…" />
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

export default UsersTab;
