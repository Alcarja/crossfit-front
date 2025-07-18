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

import Combobox from "@/components/web/combobox";
import { useQuery } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import { classesByMonthQueryOptions } from "@/app/queries/classes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const hourlyRates: Record<string, number> = {
  WOD: 10,
  Gymnastics: 15,
  Weightlifting: 15,
  Endurance: 10,
  Kids: 15,
  Foundations: 15,
  isOpen: 5,
  isClose: 5,
};

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

      let totalHours = 0;
      const classTypeHours: Record<string, number> = {};
      let isOpenCount = 0;
      let isCloseCount = 0;
      let openHours = 0;
      let closeHours = 0;

      userClasses.forEach((cls: any) => {
        const start = new Date(cls.start);
        const end = new Date(cls.end);
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        totalHours += diff;
        classTypeHours[cls.type] = (classTypeHours[cls.type] || 0) + diff;

        if (cls.isOpen) {
          isOpenCount++;
          openHours += diff;
        }

        if (cls.isClose) {
          isCloseCount++;
          closeHours += diff;
        }
      });

      const expenses = totalHours * 20;

      return {
        id: user.id,
        name: fullName,
        hours: totalHours.toFixed(1),
        expenses: expenses.toFixed(2),
        classTypeHours,
        isOpenCount,
        isCloseCount,
        openHours,
        closeHours,
      };
    });

  useEffect(() => {
    console.log("Filtered data", filteredData);
  }, [filteredData]);

  return (
    <div className="w-full h-auto p-6 space-y-8">
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
      <div className="space-y-4">
        {filteredData.map((coach: any) => {
          const colorMap: Record<string, string> = {
            WOD: "bg-blue-500",
            Gymnastics: "bg-yellow-500",
            Weightlifting: "bg-purple-500",
            Endurance: "bg-green-500",
            Kids: "bg-pink-500",
            Foundations: "bg-orange-500",
          };

          const totalHours = Object.entries(
            coach.classTypeHours as Record<string, number>
          ).reduce((sum, [, hours]) => sum + hours, 0);

          const totalPay =
            Object.entries(
              coach.classTypeHours as Record<string, number>
            ).reduce((sum, [type, hours]) => {
              const rate = hourlyRates[type] || 0;
              return sum + rate * hours;
            }, 0) +
            (hourlyRates["isOpen"] || 0) * coach.openHours +
            (hourlyRates["isClose"] || 0) * coach.closeHours;

          return (
            <Card key={coach.name} className="w-full shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">{coach.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Summary Section */}
                <div className="space-y-4 w-full lg:w-1/2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">
                      {totalHours.toFixed(1)} hrs
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Payment
                    </p>
                    <p className="text-xl font-semibold">
                      {totalPay.toFixed(2)}€
                    </p>
                  </div>
                </div>

                {/* Table Section */}
                <div className="w-full lg:w-1/2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Class Breakdown
                  </p>
                  <table className="w-full text-xs border rounded-md overflow-hidden mb-4">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left px-2 py-1">Type</th>
                        <th className="text-right px-2 py-1">Hours</th>
                        <th className="text-right px-2 py-1">Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(coach.classTypeHours).map(
                        ([type, hours]: [string, any]) => {
                          const rate = hourlyRates[type] || 0;
                          const total = rate * hours;

                          return (
                            <tr key={type} className="border-t">
                              <td className="px-2 py-1 flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    colorMap[type] || "bg-gray-400"
                                  }`}
                                />
                                {type}
                              </td>
                              <td className="text-right px-2 py-1">
                                {hours.toFixed(1)} h
                              </td>
                              <td className="text-right px-2 py-1">
                                {total.toFixed(2)}€
                              </td>
                            </tr>
                          );
                        }
                      )}

                      {/* isOpen Row */}
                      <tr className="border-t">
                        <td className="px-2 py-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Opening
                        </td>
                        <td className="text-right px-2 py-1">
                          {coach.openHours.toFixed(1)}
                        </td>
                        <td className="text-right px-2 py-1">
                          {(hourlyRates["isOpen"] * coach.openHours).toFixed(2)}
                          €
                        </td>
                      </tr>

                      {/* isClose Row */}
                      <tr className="border-t">
                        <td className="px-2 py-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Closing
                        </td>
                        <td className="text-right px-2 py-1">
                          {coach.closeHours.toFixed(1)}
                        </td>
                        <td className="text-right px-2 py-1">
                          {(hourlyRates["isClose"] * coach.closeHours).toFixed(
                            2
                          )}
                          €
                        </td>
                      </tr>

                      {/* Totals Row */}
                      <tr className="border-t font-medium bg-gray-50">
                        <td className="px-2 py-1">Total</td>
                        <td className="text-right px-2 py-1">
                          {totalHours.toFixed(1)} h
                        </td>
                        <td className="text-right px-2 py-1">
                          {totalPay.toFixed(2)}€
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
