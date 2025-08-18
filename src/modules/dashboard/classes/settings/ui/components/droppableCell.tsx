"use client";

import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

export function DroppableCell({
  id,
  isTodayCol,
  onEmptyClick,
  children,
}: {
  id: string;
  isTodayCol?: boolean;
  onEmptyClick?: () => void;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        if (e.currentTarget === e.target) onEmptyClick?.();
      }}
      className={clsx(
        "relative p-2 h-auto min-h-[56px] min-w-0 overflow-hidden",
        "border rounded-md",
        isTodayCol ? "border-blue-400 border-2" : "border-gray-200",
        isOver ? "bg-blue-50/70" : "bg-white",
        "transition-colors cursor-pointer"
      )}
    >
      <div className="absolute left-1 right-1 top-1 border-t border-gray-100 pointer-events-none" />
      {children}
    </div>
  );
}

export function DayHeader({
  label,
  isTodayFlag = false,
}: {
  label: string;
  isTodayFlag?: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`text-sm font-semibold text-center w-full ${
          isTodayFlag ? "text-blue-700" : "text-gray-700"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
