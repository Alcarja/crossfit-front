/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useCreateWorkoutQuery } from "@/app/queries/workouts";
import { useQueryClient } from "@tanstack/react-query";

import { SortableWorkoutPart } from "./sortable-workout-part";

export type WorkoutPart = {
  id: number;
  title: "Warm-up" | "Strength" | "Workout" | "Midline" | "Accessories";
  format?: "FOR TIME" | "EMOM" | "INTERVAL" | "AMRAP";
  content: string;
  notes?: string;
  cap?: string;
  versions?: {
    rx: { description: string };
    scaled?: { description: string };
    beginner?: { description: string };
  };
};

export type Workout = {
  id: string;
  date: string; // ISO string (for calendar display)
  type:
    | "WOD"
    | "Gymnastics"
    | "Weightlifting"
    | "Endurance"
    | "Foundations"
    | "Kids";

  cap?: string; // e.g. "20 min"
  parts?: WorkoutPart[];
  versions?: {
    rx: { description: string };
    scaled?: { description: string };
    beginner?: { description: string };
  };
};

const WORKOUT_TYPES = [
  "WOD",
  "Gymnastics",
  "Weightlifting",
  "Endurance",
  "Foundations",
  "Kids",
];

export function CreateWorkoutForm({
  open,
  setOpen,
  initialDate,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  initialDate?: string; // ✅ Fix here
}) {
  const queryClient = useQueryClient();
  const createWorkoutMutation = useCreateWorkoutQuery();

  const [formData, setFormData] = useState<Partial<Workout>>({
    date: "",
    type: "WOD",
    versions: { rx: { description: "" } },
    parts: [],
  });

  useEffect(() => {
    if (initialDate && open) {
      setFormData({
        date: initialDate,
        type: "WOD",
        versions: { rx: { description: "" } },
        parts: [],
      });
    }
  }, [initialDate, open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const [partCounter, setPartCounter] = useState(1); // starts at 1, increment for each new part
  const [openParts, setOpenParts] = useState<Record<number, boolean>>({});

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = formData.parts?.findIndex((p) => p.id === active.id);
      const newIndex = formData.parts?.findIndex((p) => p.id === over?.id);
      if (oldIndex !== undefined && newIndex !== undefined) {
        const reordered = arrayMove(formData.parts!, oldIndex, newIndex);
        setFormData((prev) => ({ ...prev, parts: reordered }));
      }
    }
  };

  useEffect(() => {
    if (!formData.parts) return;

    setOpenParts((prev) => {
      const updated: Record<number, boolean> = { ...prev };
      formData?.parts?.forEach((p) => {
        if (!(p.id in updated)) {
          updated[p.id] = true; // only open the *new* one
        }
      });
      return updated;
    });
  }, [formData.parts]);

  const handleAddPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [
        ...(prev.parts || []),
        {
          id: partCounter, // ✅ numeric ID
          title: "Warm-up",
          content: "",
          notes: "",
          format: undefined,
          cap: undefined,
          versions: undefined,
        },
      ],
    }));
    setPartCounter((prev) => prev + 1);
  };

  const handleUpdatePart = (
    index: number,
    key: keyof WorkoutPart,
    value: any
  ) => {
    const updatedParts = [...(formData.parts || [])];
    updatedParts[index] = { ...updatedParts[index], [key]: value };
    setFormData((prev) => ({ ...prev, parts: updatedParts }));
  };

  const handleRemovePart = (index: number) => {
    const updated = [...(formData.parts || [])];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, parts: updated }));
  };

  const handleSubmit = () => {
    if (!formData.date || !formData.type) {
      alert("Date and type are required.");
      return;
    }

    createWorkoutMutation.mutate(
      {
        date: formData.date,
        type: formData.type,
        parts: formData.parts,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormData({
            date: new Date().toISOString(),
            type: "WOD",
            parts: [],
          });
          queryClient.invalidateQueries({
            queryKey: ["workouts", "byRange"],
          });
        },
        onError: (err) => {
          console.error("Failed to create workout:", err);
          alert("Error creating workout");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[99%] !max-w-[800px] max-h-[80vh] overflow-y-auto px-4">
        <DialogHeader>
          <DialogTitle>Create New Workout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input
              className="w-[97%]"
              type="date"
              autoFocus={false}
              value={formData.date || ""} // already in YYYY-MM-DD
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date: e.target.value, // also YYYY-MM-DD
                }))
              }
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as Workout["type"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Workout type" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parts */}
          <div className="space-y-2 w-full max-w-[99%]">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Workout Parts</h3>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={(formData.parts || []).map((part) => part.id)}
                strategy={verticalListSortingStrategy}
              >
                {(formData.parts || []).map((part, index) => (
                  <SortableWorkoutPart
                    key={part.id}
                    id={part.id}
                    part={part}
                    index={index}
                    isOpen={openParts[part.id]}
                    toggleOpen={() =>
                      setOpenParts((prev) => ({
                        ...prev,
                        [part.id]: !prev[part.id],
                      }))
                    }
                    onRemove={() => handleRemovePart(index)}
                    onUpdate={handleUpdatePart}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              onClick={handleAddPart}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Part
            </Button>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
