/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import { GripVertical, Trash2 } from "lucide-react";

export const typeColors: Record<string, string> = {
  WOD: "bg-blue-200 text-blue-900",
  Gymnastics: "bg-red-200 text-red-900",
  Weightlifting: "bg-purple-200 text-purple-900",
  Endurance: "bg-green-200 text-green-900",
  Foundations: "bg-pink-200 text-pink-900",
  Kids: "bg-yellow-200 text-yellow-900",
  Default: "bg-gray-200 text-gray-800",
};

export function DraggableClass({
  cls,
  fullWidth = false,
  onOpenEdit,
  onDelete,
  isPalette = false,
  disabled = false,
}: {
  cls: any;
  fullWidth?: boolean;
  onOpenEdit?: () => void;
  onDelete?: () => void;
  isPalette?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: cls.instanceId || cls.id, data: cls, disabled });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
  };

  const colorClass =
    typeColors[cls.type as keyof typeof typeColors] ?? typeColors.Default;
  const showCounts =
    typeof cls.capacity === "number" && typeof cls.enrolled === "number";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!isPalette) onOpenEdit?.();
      }}
      className={clsx(
        "relative flex items-stretch rounded-sm border border-black/5 shadow-sm text-xs leading-tight select-none",
        colorClass,
        fullWidth
          ? "w-full max-w-full overflow-hidden"
          : "inline-block max-w-full",
        "px-2 py-1 pr-6",
        isDragging ? "opacity-0" : "opacity-100",
        disabled ? "cursor-default" : "cursor-pointer"
      )}
      title={isPalette ? undefined : "Click para editar • arrastra con el asa"}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {!isPalette && onDelete ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10 text-black/60"
              aria-label="Eliminar clase"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="w-5 h-5" />
          )}
          <span className="font-medium truncate">{cls.name}</span>
        </div>

        {showCounts && (
          <div className="mt-0.5 text-[10px] font-medium opacity-90 pl-1">
            {cls.enrolled}/{cls.capacity}
          </div>
        )}
      </div>

      <button
        {...(disabled ? {} : { ...listeners, ...attributes })}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={clsx(
          "absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10",
          disabled
            ? "cursor-default opacity-60"
            : "cursor-grab active:cursor-grabbing"
        )}
        title={disabled ? undefined : "Arrastrar"}
        aria-label="Arrastrar"
      >
        <GripVertical className="h-4 w-4 opacity-70" />
      </button>
    </div>
  );
}

export function PaletteItemStatic({ cls }: { cls: any }) {
  const colorClass =
    typeColors[cls.type as keyof typeof typeColors] ?? typeColors.Default;
  return (
    <div
      className={clsx(
        "rounded-sm border border-black/5 shadow-sm text-xs leading-tight select-none",
        colorClass,
        "px-2 py-1"
      )}
    >
      <div className="font-medium truncate">{cls.name}</div>
    </div>
  );
}

export function BubbleOverlay({ cls }: { cls: any }) {
  const colorClass =
    typeColors[cls.type as keyof typeof typeColors] ?? typeColors.Default;
  const showCounts =
    typeof cls.capacity === "number" && typeof cls.enrolled === "number";
  return (
    <div
      className={clsx(
        "rounded-sm border border-black/10 shadow-lg text-xs leading-tight select-none pointer-events-none",
        colorClass,
        "px-2 py-1 w-full max-w-full overflow-hidden"
      )}
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate min-w-0">{cls.name}</span>
        {showCounts && (
          <span className="ml-auto shrink-0 text-[10px] font-medium opacity-90">
            {cls.enrolled}/{cls.capacity}
          </span>
        )}
      </div>
    </div>
  );
}
