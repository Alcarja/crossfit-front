"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  allCategoriesQueryOptions,
  useCreateCategory,
  useDeleteCategory,
} from "@/app/queries/categories";

import {
  useAllInventoryQuery,
  useCreateInventoryItemQuery,
  useDeleteInventoryItem,
  useInventoryTransactionsByMonthAndYear,
  useUpdateInventoryItem,
  useUpdateStock,
} from "@/app/queries/inventory";

import {
  Filter,
  FolderTree,
  History,
  Package,
  PackageSearch,
  PlusCircle,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Combobox from "@/components/web/combobox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  DataTable,
  DataTable as InventoryTable,
} from "../components/tables/inventory-items/data-table";
import { stockColumns } from "../components/tables/current-stock/stock-columns";
import { getInventoryColumns } from "../components/tables/inventory-items/columns";
import { DataTable as StockTable } from "../components/tables/current-stock/data-table";
import { transactionColumns } from "../components/tables/transactions/transactions-columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  //Delete item
  const [deleteInventoryItemDialogOpen, setDeleteInventoryItemDialogOpen] =
    useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  //Edit item
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  //Stock filters
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockCategoryFilter, setStockCategoryFilter] = useState("all");

  //Set page size for table
  const [page, setPage] = useState(0); // 0-based index
  const [pageSize] = useState(15); // rows per page

  //Get inventory data
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

  //First table filter
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

  //Add categories
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

  //Delete categories
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

  //Create inventory item
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

  //Delete inventory item
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

  //Update inventory item
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

  //Update stock
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

  //Load inventory transactions
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

  //Table pagination and clear filter button

  const totalItems = filteredStockItems ? filteredStockItems.length : 0;
  const pageStart = page * (pageSize || 0);
  const pageEnd = Math.min(pageStart + (pageSize || 0), totalItems);
  const totalPages = Math.max(
    1,
    Math.ceil((totalItems || 1) / (pageSize || 1))
  );
  const canPrev = page > 0;
  const canNext =
    filteredStockItems && (page + 1) * pageSize < filteredStockItems.length;

  const clearStockFilters = () => {
    setStockSearchTerm("");
    setStockCategoryFilter("all");
    setPage(0);
  };

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  const canAddCategory = (newCategory || "").trim().length > 0;
  const itemCount = filteredItems?.length ?? 0;

  const resetItemFilters = () => {
    setSearchItem("");
    setFilterCategory("all");
  };

  return (
    <div className="w-[93%] mx-auto max-w-[2400px] md:p-6">
      <Tabs defaultValue="planner" className="w-full my-5">
        <TabsList className="flex flex-wrap items-center justify-center w-full">
          <TabsTrigger value="planner">Registro</TabsTrigger>
          <TabsTrigger value="items">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-6">
          <div className="rounded-lg border p-2 md:p-4 shadow-sm space-y-6">
            <div className="w-full md:p-12 p-4 space-y-10">
              {/* Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Inventory Planner
                </h2>
              </div>

              {/* Section 1: Stock Overview */}
              <Card className="bg-muted/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      <CardTitle>Current Stock</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {typeof totalItems === "number" && (
                        <span>
                          Showing <strong>{pageEnd - pageStart || 0}</strong> of{" "}
                          <strong>{totalItems}</strong> items
                        </span>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Search and filter inventory, then page through results.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    {/* Search */}
                    <div className="flex-1">
                      <Label htmlFor="stock-search">
                        Search (Name or Category)
                      </Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="stock-search"
                          type="text"
                          placeholder="e.g., Protein or Drinks"
                          value={stockSearchTerm}
                          onChange={(e) => setStockSearchTerm(e.target.value)}
                          className="bg-background pl-9"
                        />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex-1">
                      <Label htmlFor="stock-category">Filter by Category</Label>
                      <Select
                        value={stockCategoryFilter}
                        onValueChange={setStockCategoryFilter}
                      >
                        <SelectTrigger
                          id="stock-category"
                          className="bg-background w-full"
                        >
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="All categories" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {categoriesData?.categories?.map(
                            (category: {
                              id: string | number;
                              name: string;
                            }) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            onClick={clearStockFilters}
                            className="mt-1 md:mt-6"
                            size="sm"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" /> Reset
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Clear search, category and reset to page 1
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Active filters summary */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {stockSearchTerm ? (
                      <Badge variant="green">Search: “{stockSearchTerm}”</Badge>
                    ) : null}
                    {stockCategoryFilter && stockCategoryFilter !== "all" ? (
                      <Badge variant="gray">
                        Category: {stockCategoryFilter}
                      </Badge>
                    ) : null}
                  </div>

                  <Separator />

                  {/* Table */}
                  <div className="min-w-full">
                    <StockTable
                      columns={stockColumns}
                      data={paginatedStockItems ?? []}
                    />
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setPage((p: number) => Math.max(p - 1, 0))
                            }
                            className={
                              canPrev
                                ? "cursor-pointer"
                                : "pointer-events-none opacity-50"
                            }
                          />
                        </PaginationItem>
                        <div className="px-2 text-sm text-muted-foreground">
                          Page{" "}
                          <span className="font-medium">{(page || 0) + 1}</span>{" "}
                          of {totalPages}
                        </div>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setPage((p: number) =>
                                filteredStockItems &&
                                (p + 1) * pageSize < filteredStockItems.length
                                  ? p + 1
                                  : p
                              )
                            }
                            className={
                              canNext
                                ? "cursor-pointer"
                                : "pointer-events-none opacity-50"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Update Stock */}
              <Card className="bg-muted/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    <CardTitle>Update Stock</CardTitle>
                  </div>
                  <CardDescription>
                    Add, remove or adjust quantities for a selected item.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        inputMode="numeric"
                        min={0}
                        className="bg-background"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Action</Label>
                      <Select value={actionType} onValueChange={setActionType}>
                        <SelectTrigger className="bg-background w-full">
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
                </CardContent>
              </Card>

              {/* Section 3: Transaction History */}
              <Card className="bg-muted/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      <CardTitle>Transaction History</CardTitle>
                    </div>
                    <CardDescription>
                      Filter by month and year to view past movements.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="w-full md:w-[300px]">
                      <Label>Month</Label>
                      <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {monthNames[i]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full md:w-[300px]">
                      <Label>Year</Label>
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="w-full bg-background">
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

                    <div className="md:ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMonth(currentMonth);
                          setSelectedYear(currentYear);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" /> Reset
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="w-full">
                    <DataTable
                      columns={transactionColumns}
                      data={data?.results ?? []}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <div className="rounded-lg border p-2 md:p-4 shadow-sm space-y-6">
            <div className="w-full md:p-12 p-4 space-y-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Inventory Items
              </h2>

              {/* Section 1: Category Manager */}
              <Card className="bg-muted/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderTree className="h-5 w-5" />
                      <CardTitle>Add Category</CardTitle>
                    </div>
                    <CardDescription>
                      Create categories to group your items.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add category row */}
                  <div className="flex gap-3 items-end flex-col sm:flex-row">
                    <div className="flex flex-col gap-1 flex-1 w-full">
                      <Label htmlFor="new-category">New Category</Label>
                      <Input
                        id="new-category"
                        className="bg-background"
                        placeholder="e.g., Drinks"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleAddCategory}
                            disabled={!canAddCategory}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </TooltipTrigger>
                        {!canAddCategory && (
                          <TooltipContent>
                            Type a category name to enable
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Existing categories */}
                  {categoriesData?.categories?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Existing Categories
                        </h4>
                        <Badge variant="green">
                          {categoriesData.categories.length} total
                        </Badge>
                      </div>
                      <ScrollArea className="w-full rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[70%]">
                                Category
                              </TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoriesData.categories.map(
                              (c: { id: string | number; name: string }) => (
                                <TableRow key={c.id}>
                                  <TableCell>{c.name}</TableCell>
                                  <TableCell className="py-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="delete"
                                          size="sm"
                                          className="w-auto"
                                        >
                                          <Trash2 className="h-4 w-4" />{" "}
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>
                                            Confirm Deletion
                                          </DialogTitle>
                                          <DialogDescription>
                                            Are you sure you want to delete the
                                            category <strong>{c.name}</strong>?
                                          </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="mt-2 flex gap-2">
                                          <Button variant="outline">
                                            Cancel
                                          </Button>
                                          <Button
                                            variant="delete"
                                            onClick={() =>
                                              handleDeleteCategory(Number(c.id))
                                            }
                                          >
                                            Yes, Delete
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 2: Add Inventory Item */}
              <Card className="bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <PackageSearch className="h-5 w-5" />
                    <CardTitle>Add Inventory Item</CardTitle>
                  </div>
                  <CardDescription>
                    Define the item details and assign a category.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="item-name">Item Name</Label>
                      <Input
                        id="item-name"
                        className="bg-background"
                        placeholder="e.g., Jump Rope"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="item-category">Category</Label>
                      <Select
                        value={itemCategory}
                        onValueChange={setItemCategory}
                      >
                        <SelectTrigger
                          id="item-category"
                          className="w-full bg-background"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesData?.categories?.map(
                            (c: { id: string | number; name: string }) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price-regular">Price (Regular)</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          €
                        </span>
                        <Input
                          id="price-regular"
                          className="bg-background pl-7"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={priceRegular}
                          onChange={(e) => setPriceRegular(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="price-coach">Price (Coach)</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          €
                        </span>
                        <Input
                          id="price-coach"
                          className="bg-background pl-7"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={priceCoach}
                          onChange={(e) => setPriceCoach(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="mt-2"
                      onClick={handleAddInventoryItem}
                      disabled={createInventoryItemMutation?.isPending}
                    >
                      {createInventoryItemMutation?.isPending
                        ? "Adding..."
                        : "Add Item"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: View Inventory */}
              <Card className="bg-muted/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackageSearch className="h-5 w-5" />
                      <CardTitle>Inventory Items</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {itemCount} items
                    </div>
                  </div>
                  <CardDescription>
                    Search and filter your items, edit or delete as needed.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-end gap-3 flex-col md:flex-row">
                    <div className="w-full md:w-[300px]">
                      <Label htmlFor="search-item">Search item</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="search-item"
                          placeholder="Type to search"
                          value={searchItem}
                          onChange={(e) => setSearchItem(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="w-full md:w-[300px]">
                      <Label htmlFor="filter-category">Category</Label>
                      <Select
                        value={filterCategory}
                        onValueChange={setFilterCategory}
                      >
                        <SelectTrigger id="filter-category" className="w-full">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Filter by category" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {categoriesData?.categories?.map(
                            (c: { id: string | number; name: string }) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetItemFilters}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" /> Reset
                      </Button>
                    </div>
                  </div>

                  {/* Active filters badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {searchItem ? (
                      <Badge variant="green">Search: “{searchItem}”</Badge>
                    ) : null}
                    {filterCategory && filterCategory !== "all" ? (
                      <Badge variant="pink">Category: {filterCategory}</Badge>
                    ) : null}
                  </div>

                  <Separator />

                  {/* Table */}
                  <div className="w-full">
                    <InventoryTable
                      columns={columns}
                      data={filteredItems ?? []}
                    />
                  </div>

                  {/* Delete Dialog (controlled) */}
                  <Dialog
                    open={deleteInventoryItemDialogOpen}
                    onOpenChange={(open) => {
                      if (!open) setItemToDelete?.(null);
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
                          onClick={() =>
                            setDeleteInventoryItemDialogOpen(false)
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="delete"
                          className="w-auto"
                          onClick={confirmDelete}
                          disabled={deleteInventoryItemMutation?.isPending}
                        >
                          {deleteInventoryItemMutation?.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Dialog (controlled) */}
                  <Dialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                  >
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
                          className="space-y-4 pt-2"
                        >
                          {/* Name */}
                          <div>
                            <Label htmlFor="edit-name">Item Name</Label>
                            <Input
                              id="edit-name"
                              placeholder="Item name"
                              value={editingItem.name}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  name: e.target.value,
                                })
                              }
                              className="bg-background"
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <Label htmlFor="edit-category">Category</Label>
                            <Select
                              value={editingItem.categoryName}
                              onValueChange={(val) =>
                                setEditingItem({
                                  ...editingItem,
                                  categoryName: val,
                                })
                              }
                            >
                              <SelectTrigger
                                id="edit-category"
                                className="w-full bg-background"
                              >
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoriesData?.categories?.map(
                                  (c: {
                                    id: string | number;
                                    name: string;
                                  }) => (
                                    <SelectItem key={c.id} value={c.name}>
                                      {c.name}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Prices */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-price-regular">
                                Price (Regular)
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  €
                                </span>
                                <Input
                                  id="edit-price-regular"
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step="0.01"
                                  value={editingItem.priceRegular}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      priceRegular: parseFloat(
                                        e.target.value || "0"
                                      ),
                                    })
                                  }
                                  className="bg-background pl-7"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="edit-price-coach">
                                Price (Coach)
                              </Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  €
                                </span>
                                <Input
                                  id="edit-price-coach"
                                  type="number"
                                  inputMode="decimal"
                                  min={0}
                                  step="0.01"
                                  value={editingItem.priceCoach}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      priceCoach: parseFloat(
                                        e.target.value || "0"
                                      ),
                                    })
                                  }
                                  className="bg-background pl-7"
                                />
                              </div>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
