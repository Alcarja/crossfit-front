import { format, startOfWeek } from "date-fns";

export const hh = (n: number) => String(n).padStart(2, "0");

// --- Minute-aware helpers ---
export const parseTimeToMinutes = (time: string): number => {
  const [h, m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
};

export const minutesToTime = (mins: number): string => {
  // keep within 0..1439 but support negative/overflow inputs
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export const addMinutes = (time: string, minutes: number): string =>
  minutesToTime(parseTimeToMinutes(time) + minutes);

// duration that handles crossing midnight (e.g., 23:30 → 01:00 = 90)
export const durationFromTimes = (start: string, end: string): number => {
  const s = parseTimeToMinutes(start);
  let e = parseTimeToMinutes(end);
  if (e < s) e += 24 * 60;
  return e - s;
};
// --- end minute-aware helpers ---

export const iso = (d: Date) => format(d, "yyyy-MM-dd");
export const weekKeyFromDate = (d: Date) =>
  iso(startOfWeek(d, { weekStartsOn: 1 }));

export const weekdayShort = [
  "",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];
