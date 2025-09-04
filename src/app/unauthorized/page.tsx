// app/unauthorized/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="md:mt-40 mt-10 w-full bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acceso no autorizado</CardTitle>
          <CardDescription>
            No tienes permisos para ver esta sección (403). Contacta con un
            administrador si crees que es un error.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Si tienes otra cuenta o rol, inicia sesión de nuevo.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Ir al login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
