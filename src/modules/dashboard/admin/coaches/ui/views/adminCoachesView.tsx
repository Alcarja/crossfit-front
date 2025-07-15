/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Combobox from "@/components/web/combobox";
import { useQuery } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import { classesByMonthQueryOptions } from "@/app/queries/classes";

export interface User {
  id: number;
  name: string;
  lastName: string;
}

export interface Class {
  id: number;
  type: string;
  start: string; // ISO date string
  end: string; // ISO date string
  isOpen: boolean;
  isClose: boolean;
  coach: Coach;
}

export interface Coach {
  id: number;
  name: string;
  lastName: string;
}

const AdminCoachesView = () => {
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1); // JS months are 0-based
  const currentYear = String(currentDate.getFullYear());

  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const { data: usersData } = useQuery(usersQueryOptions());

  const { data: classesData } = useQuery(
    classesByMonthQueryOptions(selectedMonth, selectedYear)
  );

  useEffect(() => {
    console.log("Classes data", classesData?.results);
  }, [classesData]);

  const userOptions = [
    { value: "", label: "All Coaches" }, // Add this line
    ...(usersData?.map((user: User) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  const filteredData = (usersData ?? [])
    .filter(
      (user: User) => !selectedCoachId || String(user.id) === selectedCoachId
    )
    .map((user: User) => {
      const fullName = `${user.name} ${user.lastName}`;
      const userClasses =
        classesData?.results.filter(
          (cls: Class) => cls.coach?.id === user.id
        ) ?? [];

      const totalHours = userClasses.reduce((sum: any, cls: Class) => {
        const start = new Date(cls.start);
        const end = new Date(cls.end);
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);

      const expenses = totalHours * 20;

      return {
        id: user.id,
        name: fullName,
        hours: totalHours.toFixed(1),
        expenses: expenses.toFixed(2),
      };
    });

  return (
    <div className="w-full h-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Coach Dashboard</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <Label>Coaches</Label>
          <Combobox
            options={userOptions}
            value={selectedCoachId}
            onValueChange={setSelectedCoachId}
            placeholder="Search and select a coach"
          />
        </div>

        <div className="flex flex-col gap-1 w-[300px]">
          <Label>Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 w-[300px]">
          <Label>Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((coach: any) => (
          <Card key={coach.name}>
            <CardHeader>
              <CardTitle>{coach.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">Hours</div>
              <div className="text-xl font-semibold">{coach.hours} hrs</div>
              <div className="text-sm text-muted-foreground">Expenses</div>
              <div className="text-xl font-semibold">${coach.expenses}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Summary</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Expenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row: any) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.hours}</TableCell>
                  <TableCell>${row.expenses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoachesView;
