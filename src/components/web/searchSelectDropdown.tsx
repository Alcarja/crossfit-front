"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function SearchSelectDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, options]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-sm hover:bg-accent"
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md">
          <div className="flex items-center px-2 border-b">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No results
              </div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onValueChange(opt.value);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    opt.value === value && "bg-muted"
                  )}
                >
                  {opt.label}
                  {opt.value === value && (
                    <Check className="ml-2 h-4 w-4 text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
