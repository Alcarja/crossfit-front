/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Workout, WorkoutPart } from "../../types";

import {
  useDeleteWorkoutMutation,
  useUpdateWorkoutQuery,
} from "@/app/queries/workouts";
import { useQueryClient } from "@tanstack/react-query";

import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { toast } from "sonner";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/web/richTextEditor";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogFooter,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const WORKOUT_TYPES = [
  "WOD",
  "Gymnastics",
  "Weightlifting",
  "Endurance",
  "Foundations",
  "Kids",
];

const PART_TITLES = [
  "Warm-up",
  "Strength",
  "Workout",
  "Midline",
  "Accessories",
] as const;

const FORMATS = ["FOR TIME", "EMOM", "INTERVAL", "AMRAP"] as const;

//Formats the date
const normalizeDateString = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export function EditWorkoutForm({
  setOpen,
  workoutData,
  setSelectedWorkout,
}: {
  setOpen: (value: boolean) => void;
  workoutData: Workout | null;
  setSelectedWorkout?: (workout: Workout) => void;
}) {
  const queryClient = useQueryClient();
  const updateWorkoutMutation = useUpdateWorkoutQuery();

  //Sets the form data when you open it
  const [formData, setFormData] = useState<Partial<Workout>>({
    type: "WOD",
    versions: { rx: { description: "" } },
    parts: [],
  });

  const [partCounter, setPartCounter] = useState(1); //Tracks how many parts you have in the form
  const [openParts, setOpenParts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!workoutData) return;

    //Checks if the format is one of the allowed formats
    const allowedFormats = ["FOR TIME", "EMOM", "INTERVAL", "AMRAP"] as const;
    const isValidFormat = (val: any): val is WorkoutPart["format"] =>
      allowedFormats.includes(val);

    //Formats each part and adds an id to each part to use the drag and drop (each part must have an id but it is not something we save to the DB, we apply it locally)
    const normalizedParts: WorkoutPart[] = (workoutData.parts || []).map(
      (part, index) => ({
        id: part.id ?? index + 1, // Sets a unique ID for each part
        title: part.title,
        format: isValidFormat(part.format) ? part.format : undefined,
        content: part.content || "",
        notes: part.notes || "",
        cap: part.cap || "",
        versions: {
          rx: part.versions?.rx || { description: "" },
          scaled: part.versions?.scaled || { description: "" },
          beginner: part.versions?.beginner || { description: "" },
        },
      })
    );

    setPartCounter(normalizedParts.length + 1); //This tracks how many parts have been loaded and sets the local counter. If there are three parts, sets the counter to four.

    //Sets the form data with the data recieved and with the normalized part data from the previous step
    setFormData({
      id: workoutData.id,
      date: normalizeDateString(workoutData.date),
      type: workoutData.type,
      parts: normalizedParts,
    });
  }, [workoutData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
        { id: partCounter, title: "Warm-up", content: "", notes: "" },
      ],
    }));
    setPartCounter((prev) => prev + 1);
  };

  const formattedDate = formData.date
    ? new Date(formData.date).toISOString().split("T")[0]
    : "";

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
    const removed = updated.splice(index, 1)[0];

    setFormData((prev) => ({ ...prev, parts: updated }));

    // Clean up collapsible state
    if (removed?.id !== undefined) {
      setOpenParts((prev) => {
        const copy = { ...prev };
        delete copy[removed.id];
        return copy;
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.id || !formData.date || !formData.type) {
      alert("Date, type, and ID are required.");
      return;
    }

    updateWorkoutMutation.mutate(
      {
        workoutId: Number(formData.id),
        data: {
          date: formData.date,
          type: formData.type,
          parts: formData.parts || [],
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFormData({
            date: new Date().toISOString(),
            type: "WOD",
            parts: [],
          });
          queryClient.invalidateQueries({ queryKey: ["workouts", "byRange"] });

          if (setSelectedWorkout) {
            setSelectedWorkout({
              ...formData,
              id: formData.id!,
              parts: formData.parts || [],
            } as Workout);
          }

          toast.success("Workout updated!");
        },
        onError: (err) => {
          console.error("Failed to update workout:", err);
          toast.error("Error updating workout");
        },
      }
    );
  };

  const deleteMutation = useDeleteWorkoutMutation();

  const handleDelete = () => {
    deleteMutation.mutate(Number(workoutData?.id), {
      onSuccess: () => {
        toast.success("Workout deleted!");
        queryClient.invalidateQueries({ queryKey: ["workouts", "byRange"] });
        setOpen(false);
      },
      onError: () => {
        toast.error("Failed to delete workout.");
      },
    });
  };

  return (
    <div className="space-y-4 w-full">
      {/* Date */}
      <div>
        <label className="text-sm font-medium">Date</label>
        <Input
          type="date"
          value={formattedDate}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              date: new Date(e.target.value).toISOString(),
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
        >
          <SortableContext
            items={(formData.parts || []).map((part) => part.id)}
            strategy={verticalListSortingStrategy}
          >
            {(formData.parts || []).map((part, i) => (
              <SortableWorkoutPart
                key={part.id}
                id={part.id}
                index={i}
                part={part}
                isOpen={openParts[part.id]} // from state
                toggleOpen={() =>
                  setOpenParts((prev) => ({
                    ...prev,
                    [part.id]: !prev[part.id],
                  }))
                }
                onRemove={() => handleRemovePart(i)}
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
      <div className="w-full flex items-center justify-between">
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-auto" variant={"delete"}>
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="pb-8">
                Are you sure you want to delete the workout?
              </DialogTitle>
              <DialogFooter>
                <div className="flex items-center justify-center gap-4">
                  <DialogClose asChild>
                    <Button className="flex-1">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      className="flex-1"
                      variant={"delete"}
                      onClick={() => handleDelete()}
                    >
                      Delete
                    </Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-300 hover:bg-green-500"
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SortableWorkoutPart({
  id,
  part,
  index,
  onRemove,
  onUpdate,
  isOpen,
  toggleOpen,
}: {
  id: number;
  part: WorkoutPart;
  index: number;
  isOpen: boolean;
  toggleOpen: () => void;
  onRemove: () => void;
  onUpdate: (index: number, key: keyof WorkoutPart, value: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={toggleOpen}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="p-3 border rounded-md bg-muted/50 space-y-2 relative w-full cursor-move"
      >
        <div className="flex items-center justify-between w-full">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 font-medium text-sm cursor-pointer focus:outline-none"
            >
              <span>{part.title || "Untitled Part"}</span>
              <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-muted-foreground hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields (collapsible content) */}
        <CollapsibleContent className="pt-2 space-y-3">
          {/* Title */}
          <div>
            <label className="text-sm font-medium">Title</label>
            <Select
              value={part.title}
              onValueChange={(val) => onUpdate(index, "title", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Title" />
              </SelectTrigger>
              <SelectContent>
                {PART_TITLES.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          {part.title === "Workout" && (
            <div>
              <label className="text-sm font-medium">Format</label>
              <Select
                value={part.format}
                onValueChange={(val) => onUpdate(index, "format", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cap */}
          {["FOR TIME", "AMRAP"].includes(part.format || "") && (
            <div>
              <label className="text-sm font-medium">Time Cap</label>
              <Input
                value={part.cap || ""}
                onChange={(e) => onUpdate(index, "cap", e.target.value)}
                placeholder="e.g. 20 min"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label className="text-sm font-medium">Content</label>
            <RichTextEditor
              value={part.content}
              onChange={(html) => onUpdate(index, "content", html)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={part.notes}
              onChange={(e) => onUpdate(index, "notes", e.target.value)}
              rows={2}
            />
          </div>

          {/* Versions */}
          {part.title === "Workout" && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium">Versions</h4>

              <Textarea
                placeholder="RX description"
                value={part.versions?.rx?.description || ""}
                onChange={(e) => {
                  const versions = {
                    ...part.versions,
                    rx: { description: e.target.value },
                  };
                  onUpdate(index, "versions", versions);
                }}
                rows={3}
              />
              <Textarea
                placeholder="Scaled description"
                value={part.versions?.scaled?.description || ""}
                onChange={(e) => {
                  const versions = {
                    ...part.versions,
                    scaled: { description: e.target.value },
                  };
                  onUpdate(index, "versions", versions);
                }}
                rows={3}
              />
              <Textarea
                placeholder="Beginner description"
                value={part.versions?.beginner?.description || ""}
                onChange={(e) => {
                  const versions = {
                    ...part.versions,
                    beginner: { description: e.target.value },
                  };
                  onUpdate(index, "versions", versions);
                }}
                rows={3}
              />
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
