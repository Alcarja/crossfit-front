/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCreateWorkoutQuery } from "@/app/queries/workouts";
import { RichTextEditor } from "@/components/web/richTextEditor";
import { useQueryClient } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const PART_TITLES = [
  "Warm-up",
  "Strength",
  "Workout",
  "Midline",
  "Accessories",
] as const;

const FORMATS = ["FOR TIME", "EMOM", "INTERVAL", "AMRAP"] as const;

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
