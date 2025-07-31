"use client";

import { useState } from "react";
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
import { DataTable } from "../components/tables/data-table";
import { getInventoryColumns } from "../components/tables/columns";
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
  useUpdateInventoryItem,
} from "@/app/queries/inventory";

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

  const { data: categoriesData } = useQuery(allCategoriesQueryOptions());

  const { data: inventoryData } = useQuery(useAllInventoryQuery());

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

  return (
    <div className="w-full p-12 space-y-10">
      <h2 className="text-2xl font-bold">Inventory Manager</h2>

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
                    <tr key={c.id} className="border-t hover:bg-gray-50">
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
                              <DialogTitle>Confirm Deletion</DialogTitle>
                            </DialogHeader>
                            <p>
                              Are you sure you want to delete the category{" "}
                              <strong>{c.name}</strong>?
                            </p>
                            <DialogFooter className="mt-4">
                              <Button variant="outline">Cancel</Button>
                              <Button
                                className="w-auto"
                                variant="delete"
                                onClick={() => handleDeleteCategory(c.id)}
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
            <Select value={itemCategory} onValueChange={setItemCategory}>
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
          {createInventoryItemMutation.isPending ? "Adding..." : "Add Item"}
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
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
          <DataTable columns={columns} data={filteredItems ?? []} />
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
                Are you sure you want to delete this item? This action cannot be
                undone.
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
              <DialogDescription>Make changes and save.</DialogDescription>
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
                      setEditingItem({ ...editingItem, name: e.target.value })
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
                      setEditingItem({ ...editingItem, categoryName: val })
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
  );
};
