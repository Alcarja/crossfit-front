/* eslint-disable @typescript-eslint/no-explicit-any */
import { es } from "date-fns/locale";
import { startOfWeek, endOfWeek, addDays, format, parseISO } from "date-fns";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const typeColors: Record<string, string> = {
  WOD: "bg-blue-200 text-blue-900",
  Gymnastics: "bg-red-200 text-red-900",
  Weightlifting: "bg-purple-200 text-purple-900",
  Endurance: "bg-green-200 text-green-900",
  Foundations: "bg-pink-200 text-pink-900",
  Kids: "bg-yellow-200 text-yellow-900",
};

const HOURS_RANGE = Array.from({ length: 13 }, (_, h) => h + 9); // 9:00–21:00
const PIXELS_PER_MINUTE = 1.3; // 60m -> 78px
const SLOT_MINUTES = 15;
const SLOT_PX = SLOT_MINUTES * PIXELS_PER_MINUTE;

// Layout + UX constants
const COL_GAP_PX = 2; // gap between overlapping bubbles
const TRACK_GUTTER_RIGHT_PX = 45; // clickable gutter on RIGHT only
const MAX_VISIBLE_COLS = 3; // collapse dense clusters to this many columns

// Hover band state
type HoverBand = { dayStr: string; topPx: number; label: string } | null;

// Event + layout types
type Evt = { cls: any; startMin: number; endMin: number };
type Pos = { col: number; cols: number; clusterId: number };
type ClusterMeta = {
  id: number;
  startMin: number;
  endMin: number;
  cols: number;
};

// Helpers
function clampToWindow(startMin: number, endMin: number, totalMin: number) {
  const s = Math.max(0, startMin);
  const e = Math.min(totalMin, endMin);
  return e <= s ? null : { startMin: s, endMin: e };
}

function clusterKey(dayStr: string, clusterId: number) {
  return `${dayStr}:${clusterId}`;
}

// Interval graph coloring + cluster metadata
function layoutOverlaps(evts: Evt[]): {
  positions: Map<Evt, Pos>;
  clusters: ClusterMeta[];
} {
  const sorted = [...evts].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin
  );

  const clusterBuckets: Evt[][] = [];
  let cluster: Evt[] = [];
  let clusterEnd = -1;

  for (const e of sorted) {
    if (!cluster.length || e.startMin < clusterEnd) {
      cluster.push(e);
      clusterEnd = Math.max(clusterEnd, e.endMin);
    } else {
      clusterBuckets.push(cluster);
      cluster = [e];
      clusterEnd = e.endMin;
    }
  }
  if (cluster.length) clusterBuckets.push(cluster);

  const positions = new Map<Evt, Pos>();
  const metas: ClusterMeta[] = [];

  clusterBuckets.forEach((c, clusterId) => {
    const colEnds: number[] = [];
    const temp: { e: Evt; col: number }[] = [];

    for (const e of c) {
      let col = colEnds.findIndex((endMin) => e.startMin >= endMin);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(e.endMin);
      } else {
        colEnds[col] = e.endMin;
      }
      temp.push({ e, col });
    }

    const cols = colEnds.length;
    const startMin = c[0].startMin;
    const endMin = Math.max(...c.map((x) => x.endMin));
    metas.push({ id: clusterId, startMin, endMin, cols });

    for (const { e, col } of temp) positions.set(e, { col, cols, clusterId });
  });

  return { positions, clusters: metas };
}

export default function WeekView({
  date,
  classes,
  onTimeSlotClick,
  onClassClick,
}: {
  date: Date;
  classes: any[];
  onTimeSlotClick?: (range: { startStr: string; endStr: string }) => void;
  onClassClick?: (cls: any) => void;
}) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const weekDays = days.map((d) =>
    capitalize(format(d, "EEE d", { locale: es }))
  );
  const spanLabel = `${format(start, "dd-MM")} / ${format(end, "dd-MM")}`;

  const [hover, setHover] = React.useState<HoverBand>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const columnHeightPx = HOURS_RANGE.length * 60 * PIXELS_PER_MINUTE;
  const totalMin = HOURS_RANGE.length * 60;

  const mobileGridTemplate = "60px repeat(7, 310px)"; // Time gutter + 7 fixed day columns
  const desktopGridTemplate = "60px repeat(7, minmax(100px, 1fr))"; // Responsive on desktop

  return (
    <TooltipProvider delayDuration={20}>
      <div className="space-y-4">
        {/* Date range header */}
        <div className="flex items-center justify-center w-full text-md text-muted-foreground font-medium py-3">
          {spanLabel}
        </div>

        {/* Card wrapper */}
        <div className="overflow-x-auto w-full border border-muted-60 rounded-md">
          <div className="min-w-[1040px] sm:min-w-full">
            {/* Header row */}
            <div
              className="grid text-sm bg-muted/60"
              style={{
                gridTemplateColumns:
                  window.innerWidth < 640
                    ? mobileGridTemplate
                    : desktopGridTemplate,
              }}
            >
              {" "}
              <div className="p-2" />
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="text-center font-semibold border-l border-border/60 p-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Body grid */}
            <div
              className="grid border-t border-border/60 text-sm"
              role="grid"
              aria-label="Week calendar"
              style={{
                gridTemplateColumns:
                  window.innerWidth < 640
                    ? mobileGridTemplate
                    : desktopGridTemplate,
              }}
            >
              {/* Time gutter */}
              <div className="relative flex flex-col items-end pr-3 pt-1 text-[11px] text-muted-foreground bg-gradient-to-b from-background to-muted/20">
                {HOURS_RANGE.map((h) => (
                  <div
                    key={h}
                    style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}
                    className="flex items-start justify-end pt-0.5 leading-none"
                  >
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] bg-muted/50 border border-border/50">
                      {`${h.toString().padStart(2, "0")}:00`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayStart = new Date(`${dayStr}T09:00:00`);

                const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const minutes = Math.max(
                    0,
                    Math.min(
                      totalMin - SLOT_MINUTES,
                      Math.floor(offsetY / PIXELS_PER_MINUTE)
                    )
                  );
                  // Use start of the clicked hour as default start
                  const snappedToHour = Math.floor(minutes / 60) * 60; // e.g., 10:37 -> 10:00
                  const clickedStart = new Date(
                    dayStart.getTime() + snappedToHour * 60000
                  );
                  const clickedEnd = new Date(
                    clickedStart.getTime() + 60 * 60000
                  ); // default 60min
                  const startStr = clickedStart.toISOString();
                  const endStr = clickedEnd.toISOString();
                  onTimeSlotClick?.({ startStr, endStr });
                };

                const handleMouseMove = (
                  e: React.MouseEvent<HTMLDivElement>
                ) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const minutes = Math.max(
                    0,
                    Math.min(
                      totalMin - SLOT_MINUTES,
                      Math.floor(offsetY / PIXELS_PER_MINUTE)
                    )
                  );
                  const snapped =
                    Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES;
                  const topPx = snapped * PIXELS_PER_MINUTE;
                  const endDate = new Date(
                    dayStart.getTime() + (snapped + SLOT_MINUTES) * 60000
                  );
                  const label = format(endDate, "HH:mm");
                  setHover({ dayStr, topPx, label });
                };

                const handleMouseLeave = () => {
                  if (hover?.dayStr === dayStr) setHover(null);
                };

                // Build + clamp events for this day (to 09:00–21:00 window)
                const safeClasses = Array.isArray(classes) ? classes : [];
                const rawDayEvents: Evt[] = safeClasses.reduce(
                  (acc: Evt[], cls: any) => {
                    const startISO = cls?.start;
                    const endISO = cls?.end;
                    if (
                      typeof startISO !== "string" ||
                      typeof endISO !== "string"
                    )
                      return acc; // skip incomplete
                    let s: Date, e: Date;
                    try {
                      s = parseISO(startISO);
                      e = parseISO(endISO);
                    } catch {
                      return acc; // skip unparsable
                    }
                    if (format(s, "yyyy-MM-dd") !== dayStr) return acc; // only today's events
                    const candidate = {
                      cls,
                      startMin: (s.getHours() - 9) * 60 + s.getMinutes(),
                      endMin: (e.getHours() - 9) * 60 + e.getMinutes(),
                    };
                    const clamped = clampToWindow(
                      candidate.startMin,
                      candidate.endMin,
                      totalMin
                    );
                    if (clamped) acc.push({ cls, ...clamped });
                    return acc;
                  },
                  []
                );

                const { positions, clusters } = layoutOverlaps(rawDayEvents);

                return (
                  <div
                    key={dayStr}
                    className="relative border-l border-t border-border/60 bg-white"
                    style={{ height: columnHeightPx }}
                    onClick={handleClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    role="gridcell"
                    aria-label={dayStr}
                  >
                    {/* Hour delimiter lines */}
                    <div
                      className="pointer-events-none absolute inset-0 z-0"
                      style={{ height: columnHeightPx }}
                    >
                      {Array.from({ length: HOURS_RANGE.length }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="absolute left-0 right-0 border-t border-border/70"
                            style={{ top: i * 60 * PIXELS_PER_MINUTE }}
                          />
                        )
                      )}
                    </div>

                    {/* Events track (RIGHT gutter kept) */}
                    <div
                      className="absolute inset-y-0 z-10"
                      style={{ left: 0, right: TRACK_GUTTER_RIGHT_PX }}
                    >
                      {/* +N more aggregators for dense clusters */}
                      {clusters.map((c) => {
                        const key = clusterKey(dayStr, c.id);
                        const collapsed =
                          !expanded[key] && c.cols > MAX_VISIBLE_COLS;
                        if (!collapsed) return null;
                        const top = c.startMin * PIXELS_PER_MINUTE;
                        const overflow = c.cols - MAX_VISIBLE_COLS;
                        return (
                          <button
                            key={`more-${dayStr}-${c.id}`}
                            className="absolute right-1 z-20 text-[10px] px-1.5 py-0.5 rounded bg-white/90 border shadow hover:bg-white"
                            style={{ top: top + 4, height: 20 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded((s) => ({ ...s, [key]: true }));
                            }}
                            title="Show all overlapping events"
                          >
                            +{overflow} more
                          </button>
                        );
                      })}

                      {/* Events */}
                      {rawDayEvents.map((ev) => {
                        const pos = positions.get(ev)!;
                        const key = clusterKey(dayStr, pos.clusterId);
                        const collapsed =
                          !expanded[key] && pos.cols > MAX_VISIBLE_COLS;

                        const visibleCols = collapsed
                          ? MAX_VISIBLE_COLS
                          : pos.cols;
                        const colInView = collapsed
                          ? pos.col % MAX_VISIBLE_COLS
                          : pos.col;

                        const color =
                          typeColors[ev.cls.type] ||
                          "bg-gray-200 text-gray-900";
                        const top = ev.startMin * PIXELS_PER_MINUTE;
                        const height = Math.max(
                          SLOT_PX,
                          (ev.endMin - ev.startMin) * PIXELS_PER_MINUTE
                        );

                        const left = `calc(${
                          (colInView / visibleCols) * 100
                        }% + ${colInView * COL_GAP_PX}px)`;
                        const width = `calc(${100 / visibleCols}% - ${
                          (COL_GAP_PX * (visibleCols - 1)) / visibleCols
                        }px)`;

                        // Compact modes for small-height chips
                        const isTiny = height < 22; // ~ one text line
                        const isCompact = !isTiny && height < 40; // ~ two lines
                        const chipPadding = isTiny
                          ? "px-1 py-0.5"
                          : isCompact
                          ? "px-1.5 py-1"
                          : "px-2 py-1.5";
                        const lineLeading = isTiny ? "leading-4" : "leading-5";
                        const typeLabel = isTiny
                          ? ev.cls.shortLabel ?? (ev.cls.type || "").slice(0, 8)
                          : ev.cls.type || "";
                        const timeLabel = `${format(
                          parseISO(ev.cls.start),
                          "HH:mm"
                        )}–${format(parseISO(ev.cls.end), "HH:mm")}`;

                        return (
                          <Tooltip key={ev.cls.id}>
                            <TooltipTrigger asChild>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClassClick?.(ev.cls);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onClassClick?.(ev.cls);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                className={`absolute ${lineLeading} ${chipPadding} rounded-lg cursor-pointer shadow-sm hover:shadow-md ring-1 ring-black/5 ${color} border-l-4 border-black/10 transition-shadow overflow-hidden`}
                                style={{ top, height, left, width }}
                              >
                                {isTiny ? (
                                  // ultra-compact: show only the time
                                  <div className="text-[10px] font-medium truncate whitespace-nowrap">
                                    {timeLabel}
                                  </div>
                                ) : isCompact ? (
                                  // compact: type + time (both truncated if needed)
                                  <>
                                    <div className="font-semibold tracking-tight truncate whitespace-nowrap">
                                      {typeLabel}
                                    </div>
                                    <div className="text-[10px] opacity-80 truncate whitespace-nowrap">
                                      {timeLabel}
                                    </div>
                                  </>
                                ) : (
                                  // full: type + time + coach
                                  <>
                                    <div className="font-semibold tracking-tight truncate whitespace-nowrap">
                                      {typeLabel}
                                    </div>
                                    <div className="text-[10px] opacity-80 truncate whitespace-nowrap">
                                      {timeLabel}
                                    </div>
                                    <div className="text-[10px] opacity-80 -mt-0.5 truncate whitespace-nowrap">
                                      {ev.cls.coach}
                                    </div>
                                  </>
                                )}
                              </div>
                            </TooltipTrigger>

                            <TooltipContent
                              side="right"
                              align="start"
                              sideOffset={4}
                              className="max-w-[180px] px-2 py-1.5 text-xs"
                            >
                              <div className="space-y-0.2">
                                <div className="font-semibold text-sm leading-tight">
                                  {ev.cls.type}
                                </div>
                                <div className="flex gap-1 items-center text-[10px]">
                                  <span className="rounded px-1 py-0.5 border">
                                    {format(
                                      parseISO(ev.cls.start),
                                      "EEE d MMM",
                                      { locale: es }
                                    )}
                                  </span>
                                  <span>
                                    {format(parseISO(ev.cls.start), "HH:mm")}–
                                    {format(parseISO(ev.cls.end), "HH:mm")}
                                  </span>
                                </div>
                                {ev.cls.coach && (
                                  <div className="text-[11px] opacity-80">
                                    <strong>Coach:</strong> {ev.cls.coach}
                                  </div>
                                )}
                                {ev.cls.location && (
                                  <div className="text-[11px] opacity-80">
                                    <strong>Location:</strong> {ev.cls.location}
                                  </div>
                                )}
                                {typeof ev.cls.capacity === "number" &&
                                  typeof ev.cls.booked === "number" && (
                                    <div className="text-[11px] opacity-80">
                                      <strong>Spots:</strong> {ev.cls.booked}/
                                      {ev.cls.capacity}
                                    </div>
                                  )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {/* Right-side clickable gutter (visual hint, but inert) */}
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0 z-0"
                      style={{
                        width: TRACK_GUTTER_RIGHT_PX,
                      }}
                    />

                    {/* 15-min hover band + time label */}
                    {hover?.dayStr === dayStr && (
                      <>
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-20"
                          style={{
                            top: hover.topPx,
                            height: SLOT_PX,
                            borderRadius: 8,
                          }}
                        />
                        <div
                          className="pointer-events-none absolute z-30 flex items-center justify-center text-[10px] font-medium text-blue-900/80"
                          style={{
                            top: hover.topPx,
                            height: SLOT_PX,
                            right: 0,
                            width: TRACK_GUTTER_RIGHT_PX,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hover.label}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
