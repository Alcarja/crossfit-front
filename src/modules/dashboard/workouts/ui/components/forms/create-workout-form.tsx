/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useCreateWorkoutQuery } from "@/app/queries/workouts";
import { RichTextEditor } from "@/components/web/richTextEditor";
import { useQueryClient } from "@tanstack/react-query";

export type WorkoutPart = {
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
  initialDate?: string;
}) {
  const queryClient = useQueryClient();
  const createWorkoutMutation = useCreateWorkoutQuery();

  const [formData, setFormData] = useState<Partial<Workout>>({
    date: initialDate || new Date().toISOString(),
    type: "WOD",
    versions: { rx: { description: "" } },
    parts: [],
  });

  const handleAddPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [
        ...(prev.parts || []),
        { title: "Warm-up", content: "", notes: "" },
      ],
    }));
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
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full !max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create New Workout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={new Date(formData.date || "").toISOString().split("T")[0]}
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Workout Parts</h3>
            </div>

            {(formData.parts || []).map((part, i) => (
              <div
                key={i}
                className="p-3 border rounded-md bg-muted/50 space-y-2 relative"
              >
                <button
                  className="absolute top-2 right-2 text-muted-foreground"
                  onClick={() => handleRemovePart(i)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Select
                    value={part.title}
                    onValueChange={(val) => handleUpdatePart(i, "title", val)}
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

                {/* Format - Only for "Workout" */}
                {part.title === "Workout" && (
                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select
                      value={part.format}
                      onValueChange={(val) =>
                        handleUpdatePart(i, "format", val)
                      }
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

                {/* CAP - only if FOR TIME or AMRAP */}
                {["FOR TIME", "AMRAP"].includes(part.format || "") && (
                  <div>
                    <label className="text-sm font-medium">Time Cap</label>
                    <Input
                      value={part.cap || ""}
                      onChange={(e) =>
                        handleUpdatePart(i, "cap", e.target.value)
                      }
                      placeholder="e.g. 20 min"
                    />
                  </div>
                )}

                {/* Content */}
                <div>
                  <label className="text-sm font-medium">
                    Content (HTML allowed)
                  </label>
                  <RichTextEditor
                    value={part.content}
                    onChange={(html) => handleUpdatePart(i, "content", html)}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium">
                    Notes (optional)
                  </label>
                  <Textarea
                    value={part.notes}
                    onChange={(e) =>
                      handleUpdatePart(i, "notes", e.target.value)
                    }
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
                        handleUpdatePart(i, "versions", versions);
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
                        handleUpdatePart(i, "versions", versions);
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
                        handleUpdatePart(i, "versions", versions);
                      }}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))}
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
