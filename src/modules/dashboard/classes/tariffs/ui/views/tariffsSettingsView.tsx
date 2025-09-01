"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Users, Tag } from "lucide-react";
import Header from "../sections/header";
import PlansTab from "../components/plansTab";
import UsersTab from "../components/usersTab";

const TariffsSettingsView = () => {
  return (
    <div className="mx-auto w-full p-4 md:p-6">
      <div className="grid gap-6">
        <Header />

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Atletas
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Tag className="h-4 w-4" /> Planes (Tarifas y Bonos)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
          <TabsContent value="plans" className="mt-4">
            <PlansTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TariffsSettingsView;
