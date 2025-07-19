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
import { coachExpensesByMonthAndYearQueryOptions } from "@/app/queries/coach-expenses";

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

  const { data: expensesData } = useQuery(
    coachExpensesByMonthAndYearQueryOptions(selectedMonth, selectedYear)
  );

  const userOptions = [
    { value: "", label: "All Coaches" }, // Add this line
    ...(usersData?.map((user: User) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  const coachStats = (usersData ?? [])
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

      const coachExpenses =
        expensesData?.results.filter(
          (item: any) => String(item.coachId) === String(user.id)
        ) ?? [];

      const totalExpenses = coachExpenses.reduce(
        (sum: number, expense: any) => {
          return sum + parseFloat(expense.totalPrice);
        },
        0
      );

      const totalPay =
        Object.entries(classTypeHours).reduce((sum, [type, hours]) => {
          const rate = hourlyRates[type] || 0;
          return sum + rate * hours;
        }, 0) +
        (hourlyRates["isOpen"] || 0) * openHours +
        (hourlyRates["isClose"] || 0) * closeHours;

      const netTotal = totalPay - totalExpenses;

      return {
        id: user.id,
        name: fullName,
        classTypeHours,
        isOpenCount,
        isCloseCount,
        openHours,
        closeHours,
        totalHours: totalHours.toFixed(1),
        totalPay: totalPay.toFixed(2),
        expenses: totalExpenses.toFixed(2),
        netTotal: netTotal.toFixed(2),
        expenseItems: coachExpenses,
      };
    });

  useEffect(() => {
    console.log("Coach stats", coachStats);
  }, [coachStats]);

  useEffect(() => {
    console.log("Expenses data", expensesData?.results);
  }, [expensesData]);

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
        {coachStats.map((coach: any) => {
          const colorMap: Record<string, string> = {
            WOD: "bg-blue-500",
            Gymnastics: "bg-yellow-500",
            Weightlifting: "bg-purple-500",
            Endurance: "bg-green-500",
            Kids: "bg-pink-500",
            Foundations: "bg-orange-500",
          };

          return (
            <Card key={coach.id} className="w-full shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">{coach.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Summary */}
                <div className="space-y-4 w-full lg:w-1/2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{coach.totalHours} hrs</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Payment
                    </p>
                    <p className="text-xl font-semibold">{coach.totalPay}€</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Expenses
                    </p>
                    <p className="text-xl font-semibold text-red-600">
                      {coach.expenses}€
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Net Total</p>
                    <p className="text-xl font-semibold text-green-700">
                      {coach.netTotal}€
                    </p>
                  </div>
                </div>

                {/* Class Breakdown Table */}
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
                      {Object.entries(
                        coach.classTypeHours as Record<string, number>
                      ).map(([type, hours]) => {
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
                      })}

                      {/* Opening */}
                      <tr className="border-t">
                        <td className="px-2 py-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Opening
                        </td>
                        <td className="text-right px-2 py-1">
                          {coach.openHours.toFixed(1)} h
                        </td>
                        <td className="text-right px-2 py-1">
                          {(hourlyRates["isOpen"] * coach.openHours).toFixed(2)}
                          €
                        </td>
                      </tr>

                      {/* Closing */}
                      <tr className="border-t">
                        <td className="px-2 py-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Closing
                        </td>
                        <td className="text-right px-2 py-1">
                          {coach.closeHours.toFixed(1)} h
                        </td>
                        <td className="text-right px-2 py-1">
                          {(hourlyRates["isClose"] * coach.closeHours).toFixed(
                            2
                          )}
                          €
                        </td>
                      </tr>

                      {/* Totals */}
                      <tr className="border-t font-medium bg-gray-50">
                        <td className="px-2 py-1">Total</td>
                        <td className="text-right px-2 py-1">
                          {coach.totalHours} h
                        </td>
                        <td className="text-right px-2 py-1">
                          {coach.totalPay}€
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Expense Table */}
                  {coach.expenseItems?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-regular mb-2 text-muted-foreground">
                        Expenses
                      </h3>
                      <table className="w-full text-xs border rounded-md overflow-hidden">
                        <thead>
                          <tr className="bg-muted">
                            <th className="text-left px-2 py-1">Date</th>
                            <th className="text-left px-2 py-1">Inventory</th>
                            <th className="text-right px-2 py-1">Qty</th>
                            <th className="text-right px-2 py-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coach.expenseItems.map((item: any) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-2 py-1">{item.date}</td>
                              <td className="px-2 py-1">
                                {item.inventory?.name}
                              </td>
                              <td className="text-right px-2 py-1">
                                {item.quantity}
                              </td>
                              <td className="text-right px-2 py-1">
                                {parseFloat(item.totalPrice).toFixed(2)}€
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t font-medium bg-gray-50">
                            <td colSpan={3} className="px-2 py-1 text-right">
                              Total Expenses
                            </td>
                            <td className="text-right px-2 py-1">
                              {coach.expenses}€
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
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
                <TableHead>Open</TableHead>
                <TableHead>Close</TableHead>
                <TableHead>Total Pay</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Net Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coachStats.map((row: any) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.totalHours}</TableCell>
                  <TableCell>{row.openHours.toFixed(1)} h</TableCell>
                  <TableCell>{row.closeHours.toFixed(1)} h</TableCell>
                  <TableCell>{row.totalPay}€</TableCell>
                  <TableCell>{row.expenses}€</TableCell>
                  <TableCell className="font-semibold text-green-700">
                    {row.netTotal}€
                  </TableCell>
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
