/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import * as XLSX from "xlsx";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import Combobox from "@/components/web/combobox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersQueryOptions } from "@/app/queries/users";
import {
  coachExpensesByMonthAndYearQueryOptions,
  useCreateCoachExpenseMutation,
  useDeleteCoachExpenseMutation,
} from "@/app/queries/coach-expenses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAllInventoryQuery } from "@/app/queries/inventory";
import { toast } from "sonner";
import { SearchSelectDropdown } from "@/components/web/searchSelectDropdown";
import { TableIcon, Trash2Icon } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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

const ExpensesView = () => {
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1); // JS months are 0-based
  const currentYear = String(currentDate.getFullYear());

  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | undefined>();
  const [date, setDate] = useState(currentDate.toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //States for the combobox
  const [selectedCoachForAddingExpense, setSelectedCoachForAddingExpense] =
    useState<string>("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");

  //Queries
  const { data: usersData } = useQuery(usersQueryOptions());

  const { data: expensesData } = useQuery(
    coachExpensesByMonthAndYearQueryOptions(selectedMonth, selectedYear)
  );

  const { data: inventoryData } = useQuery(useAllInventoryQuery());

  //Check if the user selected in the combobox is a coach or a client
  const selectedCoach = usersData?.find(
    (user: User) => String(user.id) === String(selectedCoachForAddingExpense)
  );

  const isClient = selectedCoach?.role === "client";

  const userOptions = [
    { value: "", label: "All Coaches" },
    ...(usersData?.map((user: User) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  const inventoryOptions = [
    ...(inventoryData?.allInventory?.map((item: any) => {
      const priceToShow = isClient ? item.priceRegular : item.priceCoach;

      return {
        value: String(item.id),
        label: `${item.name} (${item.categoryName}) - ${priceToShow}€`,
      };
    }) ?? []),
  ];

  const filteredData = (usersData ?? [])
    .filter(
      (user: User) => !selectedCoachId || String(user.id) === selectedCoachId
    )
    .map((user: User) => {
      const fullName = `${user.name} ${user.lastName}`;

      const userExpenses =
        expensesData?.results.filter(
          (expense: any) => expense.coach?.id === user.id
        ) ?? [];

      const totalQuantity = userExpenses.reduce(
        (sum: number, exp: any) => sum + exp.quantity,
        0
      );
      const totalAmount = userExpenses.reduce(
        (sum: number, exp: any) => sum + parseFloat(exp.totalPrice),
        0
      );

      return {
        id: user.id,
        name: fullName,
        totalQuantity,
        totalAmount,
        expenses: userExpenses,
      };
    });

  const createExpenseMutation = useCreateCoachExpenseMutation();

  const handleSubmitExpense = async () => {
    setIsSubmitting(true);

    const payload = {
      coachId: parseInt(selectedCoachForAddingExpense),
      inventoryId: selectedInventoryId,
      quantity,
      date,
      customPrice,
    };

    createExpenseMutation.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["expenses", "byMonth", selectedMonth, selectedYear],
        });
        toast.success("Expense added successfully!");
        setIsSubmitting(false);
        setExpenseDialogOpen(false);
        setQuantity(1);
      },
      onError: (error: any) => {
        toast.error(`Failed to add expense: ${error.message}`);
        setIsSubmitting(false);
      },
    });
  };

  const deleteExpenseMutation = useDeleteCoachExpenseMutation();

  const handleDeleteExpense = (expenseId: number) => {
    deleteExpenseMutation.mutate(expenseId, {
      onSuccess: () => {
        toast.success("Expense deleted successfully!");
        queryClient.invalidateQueries({
          queryKey: ["expenses", "byMonth", selectedMonth, selectedYear],
        });
      },
      onError: (error: any) => {
        toast.error(`Failed to delete expense: ${error.message}`);
      },
    });
  };

  const exportGroupedExpensesToExcel = (coaches: any) => {
    const rows = [];
    let grandTotalAmount = 0;

    coaches.forEach((coach: any) => {
      let coachTotalAmount = 0;

      coach.expenses.forEach((exp: any, index: any) => {
        const amount = parseFloat(exp.totalPrice);
        const isLastExpense = index === coach.expenses.length - 1;

        coachTotalAmount += amount;
        grandTotalAmount += amount;

        rows.push({
          "Coach Name": coach.name,
          Date: exp.date,
          Item: exp.inventory?.name ?? "Unknown Item",
          Quantity: exp.quantity,
          "Total (€)": amount.toFixed(2),
          "Coach Total (€)": isLastExpense ? coachTotalAmount.toFixed(2) : "",
        });
      });
    });

    // Add grand total row at the end
    rows.push({
      "Coach Name": "",
      Date: "",
      Item: "",
      Quantity: "",
      "Total (€)": "",
      "Coach Total (€)": grandTotalAmount.toFixed(2),
    });

    // Ensure headers are in correct order
    const headers = [
      "Coach Name",
      "Date",
      "Item",
      "Quantity",
      "Total (€)",
      "Coach Total (€)",
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Expenses");

    XLSX.writeFile(workbook, "All_Coaches_Expenses.xlsx");
  };

  const totals = React.useMemo(() => {
    const totalCoaches = filteredData.length;
    const totalItems = filteredData.reduce(
      (sum: number, c: any) => sum + (Number(c.totalQuantity) || 0),
      0
    );
    const totalAmount = filteredData.reduce(
      (sum: number, c: any) => sum + (Number(c.totalAmount) || 0),
      0
    );
    return { totalCoaches, totalItems, totalAmount };
  }, [filteredData]);

  const activeFilters = React.useMemo(() => {
    const monthLabel = selectedMonth
      ? new Date(0, Number(selectedMonth) - 1).toLocaleString("default", {
          month: "long",
        })
      : null;

    const yearLabel = selectedYear || null;
    const hasCoach = Boolean(selectedCoachId);

    return { monthLabel, yearLabel, hasCoach };
  }, [selectedCoachId, selectedMonth, selectedYear]);

  // Clear filters (reset to no filters)
  const clearFilters = React.useCallback(() => {
    setSelectedCoachId?.("");
    setSelectedMonth?.(currentMonth);
    setSelectedYear?.(currentYear);
  }, [
    setSelectedCoachId,
    setSelectedMonth,
    setSelectedYear,
    currentMonth,
    currentYear,
  ]);

  return (
    <div className="w-full h-auto md:p-12 p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">
            Expenses Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Track expenses by coach, month, and year. Add new expenses and
            export summaries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setExpenseDialogOpen(true)}
            className="bg-primary text-primary-foreground w-auto hover:bg-white hover:text-black"
          >
            Add Expense
          </Button>
          <Button
            variant="default"
            onClick={() => exportGroupedExpensesToExcel(filteredData)}
            className="w-auto bg-blue-200"
          >
            <TableIcon className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
        </div>
      </div>

      {/* Filters (Integrated Toolbar) */}
      <div>
        <div className="rounded-2xl border bg-muted/30 supports-[backdrop-filter]:bg-background/60 backdrop-blur p-4 md:p-7">
          <div className="flex items-center justify-start flex-wrap gap-4">
            {/* Coach */}
            <div className="flex-1">
              <Label className="mb-3 pl-1 block">Coach</Label>
              <Combobox
                options={userOptions}
                value={selectedCoachId}
                onValueChange={setSelectedCoachId}
                placeholder="Search and select a coach"
                size="full"
              />
            </div>

            {/* Month */}
            <div className="flex-1">
              <Label className="mb-3 pl-1 block">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString("default", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="flex-1">
              <Label className="mb-3 pl-1 block">Year</Label>
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

            {/* Actions */}
            <div className="flex-1">
              <Button
                variant="default"
                onClick={clearFilters}
                className="w-auto mt-6"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Active filter chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.hasCoach && (
              <Badge variant="green">Coach selected</Badge>
            )}
            {activeFilters.monthLabel && (
              <Badge variant="blue">{activeFilters.monthLabel}</Badge>
            )}
            {activeFilters.yearLabel && (
              <Badge variant="pink">{activeFilters.yearLabel}</Badge>
            )}
            {!activeFilters.hasCoach &&
              !activeFilters.monthLabel &&
              !activeFilters.yearLabel && (
                <span className="text-xs text-muted-foreground pl-2">
                  No filters applied
                </span>
              )}
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Card className="md:flex-1 w-full">
          <CardContent className="py-1 px-5">
            <p className="text-sm text-muted-foreground">Total Coaches</p>
            <p className="text-3xl font-semibold mt-1">{totals.totalCoaches}</p>
          </CardContent>
        </Card>
        <Card className="md:flex-1 w-full">
          <CardContent className="py-1 px-5">
            <p className="text-sm text-muted-foreground">
              Total Items Purchased
            </p>
            <p className="text-3xl font-semibold mt-1">{totals.totalItems}</p>
          </CardContent>
        </Card>
        <Card className="md:flex-1 w-full">
          <CardContent className="py-1 px-5">
            <p className="text-sm text-muted-foreground">Total Expense</p>
            <p className="text-3xl font-semibold mt-1">
              {totals.totalAmount.toFixed(2)}€
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coaches Accordion */}
      <Card className="border-muted/50">
        <CardHeader>
          <CardTitle className="text-xl">Coaches</CardTitle>
          <CardDescription>
            Expand a coach to view detailed expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No expenses match your filters.
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filteredData.map((coach: any) => (
                <AccordionItem key={coach.name} value={coach.name}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">
                          {coach.name}
                        </span>
                        <Badge
                          variant={coach.totalQuantity > 0 ? "green" : "gray"}
                          className="rounded-full"
                        >
                          {coach.totalQuantity} items
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">
                          {coach.totalAmount.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-md border">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead className="bg-muted/60">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">
                                Date
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Item
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Quantity
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Total (€)
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {coach.expenses.map((exp: any) => (
                              <tr key={exp.id} className="border-t">
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {exp.date}
                                </td>
                                <td className="px-3 py-2">
                                  {exp.inventory?.name ?? "Unknown Item"}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {exp.quantity}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {parseFloat(exp.totalPrice).toFixed(2)}€
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="delete" size="sm">
                                        <Trash2Icon />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Confirm Deletion
                                        </DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete this
                                          expense? This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex justify-end gap-2 pt-4">
                                        <DialogTrigger asChild>
                                          <Button variant="outline">
                                            Cancel
                                          </Button>
                                        </DialogTrigger>
                                        <Button
                                          variant="delete"
                                          onClick={() =>
                                            handleDeleteExpense(exp.id)
                                          }
                                        >
                                          Confirm Delete
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/40">
                              <td className="px-3 py-2 font-medium" colSpan={2}>
                                Coach totals
                              </td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {coach.totalQuantity}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {coach.totalAmount.toFixed(2)}€
                              </td>
                              <td className="px-3 py-2" />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Coach Expense</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="mb-1 block">Coach</Label>
                <SearchSelectDropdown
                  options={userOptions}
                  value={selectedCoachForAddingExpense}
                  onValueChange={setSelectedCoachForAddingExpense}
                  placeholder="Search and select a coach"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">Inventory Item</Label>
                <SearchSelectDropdown
                  options={inventoryOptions}
                  value={selectedInventoryId}
                  onValueChange={setSelectedInventoryId}
                  placeholder="Search and select an item"
                />
              </div>
              <div>
                <Label className="mb-1 block">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Custom Price (optional)</Label>
                <Input
                  type="number"
                  min={1}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e?.target?.value))}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExpenseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitExpense} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Add Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesView;
