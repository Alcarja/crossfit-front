/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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

  const userOptions = [
    { value: "", label: "All Coaches" },
    ...(usersData?.map((user: User) => ({
      value: String(user.id),
      label: `${user.name} ${user.lastName}`,
    })) ?? []),
  ];

  const inventoryOptions = [
    ...(inventoryData?.allInventory?.map((item: any) => ({
      value: String(item.id),
      label: `${item.name} (${item.categoryName}) - ${item.priceCoach}€`,
    })) ?? []),
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

  return (
    <div className="w-full h-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">Expenses Dashboard</h2>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-wrap items-center justify-start gap-4">
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
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
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
        <div>
          <Button
            onClick={() => setExpenseDialogOpen(true)}
            variant={"default"}
            className="bg-primary text-white hover:text-black"
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {filteredData.map((coach: any) => {
          return (
            <Card key={coach.name} className="w-full shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">{coach.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Items Purchased
                  </p>
                  <p className="text-xl font-bold">{coach.totalQuantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expense</p>
                  <p className="text-xl font-semibold">
                    {coach.totalAmount.toFixed(2)}€
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Expense Breakdown
                  </p>

                  <div className="w-full overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[700px] text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Item</th>
                          <th className="px-2 py-1 text-right">Quantity</th>
                          <th className="px-2 py-1 text-right">Total (€)</th>
                          <th className="px-2 py-1 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coach.expenses.map((exp: any) => (
                          <tr key={exp.id} className="border-t">
                            <td className="px-2 py-1">{exp.date}</td>
                            <td className="px-2 py-1">
                              {exp.inventory?.name ?? "Unknown Item"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {exp.quantity}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {parseFloat(exp.totalPrice).toFixed(2)}€
                            </td>
                            <td className="px-2 py-1 text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="delete" size="sm">
                                    Delete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Deletion</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this
                                      expense? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline">Cancel</Button>
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
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Coach Expense</DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Coach Selector */}
            <div>
              <Label>Coach</Label>
              <Combobox
                size="full"
                options={userOptions}
                value={selectedCoachForAddingExpense}
                onValueChange={setSelectedCoachForAddingExpense}
                placeholder="Search and select a coach"
              />
            </div>

            {/* Inventory Selector */}
            <div>
              <Label>Inventory Item</Label>
              <Combobox
                size="full"
                options={inventoryOptions}
                value={selectedInventoryId}
                onValueChange={setSelectedInventoryId}
                placeholder="Search and select an item"
              />
            </div>

            {/* Quantity */}
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            {/* Date */}
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
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
