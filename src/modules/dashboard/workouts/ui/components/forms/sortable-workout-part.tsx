/* eslint-disable @typescript-eslint/no-explicit-any */

import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/web/richTextEditor";

import { useSortable } from "@dnd-kit/sortable";
import { WorkoutPart } from "../../types";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PART_TITLES = [
  "Warm-up",
  "Strength",
  "Workout",
  "Midline",
  "Accessories",
] as const;

const FORMATS = ["FOR TIME", "EMOM", "INTERVAL", "AMRAP"] as const;

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
        className="p-3 border rounded-md bg-muted/50 space-y-2 relative w-full"
      >
        <div className="flex items-center justify-between w-full">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
            title="Drag to reorder"
          >
            ⠿
          </div>
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
