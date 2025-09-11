import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  useUserActiveTariffs,
  useUserFutureTariffs,
} from "@/app/queries/tariffs";
import { Separator } from "@/components/ui/separator";
import { CalendarArrowUpIcon, CreditCard } from "lucide-react";

export type TariffResult = {
  tariff: Tariff;
};

export type Tariff = {
  id: number;
  userId: number;
  planId: number;
  startsOn: string; // ISO date, e.g., "2025-09-10"
  customExpiresOn: string; // ISO date
  expiresOn: string; // ISO date
  remainingCredits: number | null;
  note: string | null;
  status: "active" | "pending" | "expired" | string; // adjust as needed
  billingStatus: "processing" | "paid" | "failed" | string; // adjust as needed
  provisionalAccessUntil: string | null; // ISO date or null
  createdAt: string;
  updatedAt: string;
};

export const Plans = ({ userId }: { userId?: number }) => {
  const {
    data: currentTariffs,
    isLoading,
    isError,
  } = useUserActiveTariffs(userId!);
  const {
    data: futureTariffs,
    isLoading: isLoadingFutureTariffs,
    isError: isErrorFutureTariffs,
  } = useUserFutureTariffs(userId!);

  const tariffs =
    currentTariffs?.results.map((result: TariffResult) => result.tariff) ?? [];

  if (isLoading) return <p>Loading tariffs...</p>;
  if (isError) return <p>Error loading tariffs.</p>;
  if (tariffs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No active plans found.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* === Card 1: Active Tariffs === */}
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-start gap-2 pl-3">
          <CreditCard />
          <h2 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Tu plan actual
          </h2>
        </div>

        {tariffs.map((tariff: Tariff) => (
          <div
            key={tariff.id}
            className="space-y-4 rounded-xl p-4 shadow-sm bg-muted/10"
          >
            {/* Estado */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Estado</span>
              <Badge
                variant={getStatusVariant(tariff.status)}
                className="capitalize"
              >
                {tariff.status}
              </Badge>
            </div>

            <Separator />

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Inicio</span>
                <span className="font-medium">
                  {format(new Date(tariff.startsOn), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Expira</span>
                <span className="font-medium">
                  {format(new Date(tariff.customExpiresOn), "dd/MM/yyyy")}
                </span>
              </div>

              {tariff.provisionalAccessUntil && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">
                    Acceso provisional
                  </span>
                  <span className="font-medium">
                    {format(
                      new Date(tariff.provisionalAccessUntil),
                      "dd/MM/yyyy"
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Créditos restantes */}
            {typeof tariff.remainingCredits === "number" && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Créditos restantes
                  </span>
                  <span className="text-base font-semibold text-primary">
                    {tariff.remainingCredits}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* === Card 2: Future Tariffs === */}
      <div className="space-y-6">
        <div className="flex flex-row items-center justify-start gap-2 pl-3">
          <CalendarArrowUpIcon />
          <h2 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Planes próximos
          </h2>
        </div>

        {tariffs.map((tariff: Tariff) => (
          <div
            key={tariff.id}
            className="space-y-4 rounded-xl p-4 shadow-sm bg-muted/10"
          >
            {/* Estado */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Estado</span>
              <Badge
                variant={getStatusVariant(tariff.status)}
                className="capitalize"
              >
                {tariff.status}
              </Badge>
            </div>

            <Separator />

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Inicio</span>
                <span className="font-medium">
                  {format(new Date(tariff.startsOn), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Expira</span>
                <span className="font-medium">
                  {format(new Date(tariff.customExpiresOn), "dd/MM/yyyy")}
                </span>
              </div>

              {tariff.provisionalAccessUntil && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">
                    Acceso provisional
                  </span>
                  <span className="font-medium">
                    {format(
                      new Date(tariff.provisionalAccessUntil),
                      "dd/MM/yyyy"
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Créditos restantes */}
            {typeof tariff.remainingCredits === "number" && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">
                    Créditos restantes
                  </span>
                  <span className="text-base font-semibold text-primary">
                    {tariff.remainingCredits}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Otro panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Contenido futuro.</p>
        </CardContent>
      </Card>
    </div>
  );
};

function getStatusVariant(
  status: string
): "green" | "yellow" | "red" | "default" {
  switch (status) {
    case "active":
      return "green";
    case "pending":
      return "yellow";
    case "expired":
      return "red";
    default:
      return "default";
  }
}
