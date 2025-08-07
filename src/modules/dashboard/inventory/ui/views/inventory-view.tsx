"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DataTable,
  DataTable as InventoryTable,
} from "../components/tables/inventory-items/data-table";
import { DataTable as StockTable } from "../components/tables/current-stock/data-table";
import { getInventoryColumns } from "../components/tables/inventory-items/columns";
import {
  allCategoriesQueryOptions,
  useCreateCategory,
  useDeleteCategory,
} from "@/app/queries/categories";
import { toast } from "sonner";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useAllInventoryQuery,
  useCreateInventoryItemQuery,
  useDeleteInventoryItem,
  useInventoryTransactionsByMonthAndYear,
  useUpdateInventoryItem,
  useUpdateStock,
} from "@/app/queries/inventory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stockColumns } from "../components/tables/current-stock/stock-columns";
import Combobox from "@/components/web/combobox";
import { transactionColumns } from "../components/tables/transactions/transactions-columns";

export interface Category {
  id: number;
  name: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  priceRegular: number;
  priceCoach: number;
  unitsInStock?: number;
}

export const InventoryView = () => {
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [priceRegular, setPriceRegular] = useState("");
  const [priceCoach, setPriceCoach] = useState("");

  const [searchItem, setSearchItem] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [deleteInventoryItemDialogOpen, setDeleteInventoryItemDialogOpen] =
    useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockCategoryFilter, setStockCategoryFilter] = useState("all");

  const [page, setPage] = useState(0); // 0-based index
  const [pageSize] = useState(10); // rows per page

  const { data: categoriesData } = useQuery(allCategoriesQueryOptions());

  const { data: inventoryData } = useQuery(useAllInventoryQuery());

  //Formatted data for the combobox input in the second form
  const inventoryOptions =
    inventoryData?.allInventory?.map((item: InventoryItem) => ({
      value: item.id.toString(),
      label: item.name,
    })) ?? [];

  //Track the data of the false stock form to later use in the function to submit it
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [actionType, setActionType] = useState("");

  const filteredItems = inventoryData?.allInventory
    ?.filter((item: InventoryItem) => {
      const matchesCategory =
        filterCategory === "all" ||
        !filterCategory ||
        item.categoryName === filterCategory;

      const matchesSearch =
        !searchItem ||
        item.name.toLowerCase().includes(searchItem.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a: InventoryItem, b: InventoryItem) => a.name.localeCompare(b.name));

  //Filters for the stock table
  const filteredStockItems = inventoryData?.allInventory
    ?.filter((item: InventoryItem) => {
      const matchesCategory =
        stockCategoryFilter === "all" ||
        item.categoryName === stockCategoryFilter;

      const search = stockSearchTerm.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.categoryName.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.sort((a: any, b: any) => a.name.localeCompare(b.name));

  const paginatedStockItems = filteredStockItems?.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  useEffect(() => {
    setPage(0);
  }, [stockCategoryFilter, stockSearchTerm]);

  const { mutate: createCategory } = useCreateCategory();

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;

    createCategory(newCategory, {
      onSuccess: () => {
        setNewCategory("");
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        toast.success("Category created");
      },
      onError: (error) => {
        console.error("Failed to create category:", error);
        toast.error("Error creating category");
      },
    });
  };

  const { mutate: deleteCategory } = useDeleteCategory();

  const handleDeleteCategory = (id: number) => {
    deleteCategory(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        toast.success("Category deleted successfully");
      },
      onError: (error) => {
        console.error("Delete failed:", error);
        toast.error("Error deleting category");
      },
    });
  };

  const createInventoryItemMutation = useCreateInventoryItemQuery();

  const handleAddInventoryItem = () => {
    const category = categoriesData?.categories?.find(
      (c: Category) => c.name === itemCategory
    );

    if (!itemName || !category?.id || !priceRegular || !priceCoach) {
      toast.error("Please fill out all required fields.");
      return;
    }

    createInventoryItemMutation.mutate(
      {
        name: itemName,
        categoryId: category.id,
        priceRegular: parseFloat(priceRegular),
        priceCoach: parseFloat(priceCoach),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          toast.success("Inventory item added!");
          // Optionally clear the form
          setItemName("");
          setItemCategory("");
          setPriceRegular("0");
          setPriceCoach("0");
        },
        onError: (error: Error) => {
          toast.error(
            `Failed to add item: ${error?.message || "Unknown error"}`
          );
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteInventoryItemDialogOpen(true);
  };

  const deleteInventoryItemMutation = useDeleteInventoryItem();

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      deleteInventoryItemMutation.mutate(itemToDelete, {
        onSuccess: () => {
          toast.success("Item deleted");
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          setDeleteInventoryItemDialogOpen(false);
          setItemToDelete(null);
        },
        onError: (error: Error) => {
          toast.error(`Failed to delete: ${error.message}`);
        },
      });
    }
  };

  const handleUpdate = (item: InventoryItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const updateMutation = useUpdateInventoryItem();

  const handleEditSubmit = () => {
    if (!editingItem) return;

    const categoryId = categoriesData?.categories.find(
      (c: Category) => c.name === editingItem.categoryName
    )?.id;

    if (!categoryId) {
      toast.error("Invalid category");
      return;
    }

    updateMutation.mutate(
      {
        inventoryItemId: editingItem.id,
        name: editingItem.name,
        categoryId,
        priceRegular: editingItem.priceRegular,
        priceCoach: editingItem.priceCoach,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          toast.success("Item updated");
          setEditDialogOpen(false);
          setEditingItem(null);
        },
        onError: (error: Error) => {
          toast.error(`Failed to update: ${error.message}`);
        },
      }
    );
  };

  const columns = getInventoryColumns(handleUpdate, handleDelete);

  const updateStockMutation = useUpdateStock();

  const handleUpdateStock = () => {
    if (!selectedInventoryId || !quantity || !actionType) {
      toast.error("All fields are required");
      return;
    }

    const formData = {
      itemId: Number(selectedInventoryId),
      quantity: Number(quantity),
      action: actionType,
    };

    updateStockMutation.mutate(formData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({
          queryKey: ["inventory-transactions"],
        });
        toast.success("Stock updated successfully!");

        setSelectedInventoryId("");
        setQuantity("");
        setActionType("");
      },
      onError: (error: Error) => {
        console.error("Update failed:", error);
        toast.error("Failed to update stock.");
      },
    });
  };

  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1); // JS months are 0-based
  const currentYear = String(currentDate.getFullYear());

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const { data } = useQuery(
    useInventoryTransactionsByMonthAndYear(
      Number(selectedMonth),
      Number(selectedYear)
    )
  );

  return (
    <div className="w-[93%] mx-auto max-w-[2400px] md:p-6">
      <Tabs defaultValue="planner" className="w-full my-5">
        <TabsList className="flex flex-wrap items-center justify-center w-full pb-2">
          <TabsTrigger value="planner">Registro</TabsTrigger>
          <TabsTrigger value="items">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="planner">
          <div className="rounded-lg border p-2 md:p-4 shadow-sm space-y-6">
            <div className="w-full md:p-12 p-4 space-y-10">
              <h2 className="text-4xl font-bold">Inventory Planner</h2>

              {/* Section 1: Stock Overview */}
              <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold">Current Stock</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  {/* Text Search */}
                  <div className="flex-1">
                    <Label>Search (Name or Category)</Label>
                    <Input
                      type="text"
                      placeholder="e.g., Protein or Drinks"
                      value={stockSearchTerm}
                      onChange={(e) => setStockSearchTerm(e.target.value)}
                      className="bg-white"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex-1">
                    <Label>Filter by Category</Label>
                    <Select
                      value={stockCategoryFilter}
                      onValueChange={setStockCategoryFilter}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {categoriesData?.categories?.map(
                          (category: Category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <StockTable
                    columns={stockColumns}
                    data={paginatedStockItems ?? []}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(p - 1, 0))}
                        disabled={page === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) =>
                            filteredStockItems &&
                            (p + 1) * pageSize < filteredStockItems.length
                              ? p + 1
                              : p
                          )
                        }
                        disabled={
                          !filteredStockItems ||
                          (page + 1) * pageSize >= filteredStockItems.length
                        }
                      >
                        Next
                      </Button>
                    </div>

                    <div className="text-sm text-gray-600">
                      Page {page + 1} of{" "}
                      {filteredStockItems
                        ? Math.ceil(filteredStockItems.length / pageSize)
                        : 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Update Stock */}
              <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold">Update Stock</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Item</Label>
                    <Combobox
                      options={inventoryOptions}
                      value={selectedInventoryId}
                      onValueChange={setSelectedInventoryId}
                      placeholder="Search and select an item"
                      size="full"
                    />
                  </div>

                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      className="bg-white"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Action</Label>
                    <Select value={actionType} onValueChange={setActionType}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Añadir Stock</SelectItem>
                        <SelectItem value="out">Retirar Stock</SelectItem>
                        <SelectItem value="adjustment">
                          Ajustar Stock
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      type="button"
                      onClick={handleUpdateStock}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section 3: Transaction History */}
              <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold">Transaction History</h3>

                {/* Filters */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                  <div className="flex flex-wrap items-center justify-start gap-4">
                    {/* <div className="flex flex-col gap-1">
                      <Label>Coaches</Label>
                      <Combobox
                        options={userOptions}
                        value={selectedCoachId}
                        onValueChange={setSelectedCoachId}
                        placeholder="Search and select a coach"
                      />
                    </div> */}

                    <div className="flex flex-col gap-1 w-full max-w-[300px]">
                      <Label>Month</Label>
                      <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                      >
                        <SelectTrigger className="w-full bg-white">
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

                    <div className="flex flex-col gap-1 w-full max-w-[300px]">
                      <Label>Year</Label>
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2026">2026</SelectItem>
                          <SelectItem value="2027">2027</SelectItem>
                          <SelectItem value="2028">2028</SelectItem>
                          <SelectItem value="2029">2029</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DataTable
                  columns={transactionColumns}
                  data={data?.results ?? []}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items">
          <div className="rounded-lg border p-2 md:p-4 shadow-sm space-y-6">
            <div className="w-full md:p-12 p-4 space-y-10">
              <h2 className="text-4xl font-bold">Inventory Items</h2>

              {/* Left: Category Manager */}
              <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold">Add Category</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex flex-col gap-1 flex-1">
                    <Label>New Category</Label>
                    <Input
                      className="bg-white"
                      placeholder="e.g., Drinks"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddCategory}>Add</Button>
                </div>

                {categoriesData?.categories?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-3 border-b pb-1 text-gray-700">
                      Existing Categories
                    </h4>

                    <div className="bg-white border border-gray-300 rounded-md shadow-inner overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                          <tr>
                            <th className="text-left px-4 py-2">Category</th>
                            <th className="text-left px-4 py-2 w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoriesData?.categories?.map((c: Category) => (
                            <tr
                              key={c.id}
                              className="border-t hover:bg-gray-50"
                            >
                              <td className="px-4 py-2">{c.name}</td>
                              <td className="px-4 py-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="delete"
                                      className="w-auto h-[30px]"
                                    >
                                      Delete
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Confirm Deletion
                                      </DialogTitle>
                                    </DialogHeader>
                                    <p>
                                      Are you sure you want to delete the
                                      category <strong>{c.name}</strong>?
                                    </p>
                                    <DialogFooter className="mt-4">
                                      <Button variant="outline">Cancel</Button>
                                      <Button
                                        className="w-auto"
                                        variant="delete"
                                        onClick={() =>
                                          handleDeleteCategory(c.id)
                                        }
                                      >
                                        Yes, Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Inventory Item Manager */}
              <div className="w-full space-y-4 shadow-md bg-gray-50 p-5 rounded-lg">
                <h3 className="text-xl font-semibold">Add Inventory Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Item Name</Label>
                    <Input
                      className="bg-white"
                      placeholder="e.g., Jump Rope"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select
                      value={itemCategory}
                      onValueChange={setItemCategory}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.categories?.map((c: Category) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Price (Regular)</Label>
                    <Input
                      className="bg-white"
                      type="number"
                      step="0.01"
                      value={priceRegular}
                      onChange={(e) => setPriceRegular(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Price (Coach)</Label>
                    <Input
                      className="bg-white"
                      type="number"
                      step="0.01"
                      value={priceCoach}
                      onChange={(e) => setPriceCoach(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="mt-2 bg-white"
                  onClick={handleAddInventoryItem}
                  disabled={createInventoryItemMutation.isPending}
                >
                  {createInventoryItemMutation.isPending
                    ? "Adding..."
                    : "Add Item"}
                </Button>
              </div>

              {/* Section 3: View Inventory */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Inventory Items</h3>
                <div className="flex gap-4">
                  <Input
                    placeholder="Search item"
                    value={searchItem}
                    onChange={(e) => setSearchItem(e.target.value)}
                    className="w-[200px]"
                  />
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categoriesData?.categories?.map((c: Category) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md p-4">
                  <InventoryTable
                    columns={columns}
                    data={filteredItems ?? []}
                  />
                </div>

                <Dialog
                  open={deleteInventoryItemDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) setItemToDelete(null);
                    setDeleteInventoryItemDialogOpen(open);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Inventory Item</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this item? This action
                        cannot be undone.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteInventoryItemDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="delete"
                        className="w-auto"
                        onClick={confirmDelete}
                        disabled={deleteInventoryItemMutation.isPending}
                      >
                        {deleteInventoryItemMutation.isPending
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Inventory Item</DialogTitle>
                      <DialogDescription>
                        Make changes and save.
                      </DialogDescription>
                    </DialogHeader>

                    {editingItem && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEditSubmit();
                        }}
                        className="space-y-4 pt-4"
                      >
                        {/* Name */}
                        <div>
                          <Label>Item Name</Label>
                          <Input
                            placeholder="Item name"
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                name: e.target.value,
                              })
                            }
                            className="bg-white"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={editingItem.categoryName}
                            onValueChange={(val) =>
                              setEditingItem({
                                ...editingItem,
                                categoryName: val,
                              })
                            }
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriesData?.categories.map((c: Category) => (
                                <SelectItem key={c.id} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Prices in the same row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Price (Regular)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingItem.priceRegular}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  priceRegular: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label>Price (Coach)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingItem.priceCoach}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  priceCoach: parseFloat(e.target.value),
                                })
                              }
                              className="bg-white"
                            />
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" variant="default">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
