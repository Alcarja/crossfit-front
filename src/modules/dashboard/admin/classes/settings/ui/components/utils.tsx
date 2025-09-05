import { format, startOfWeek } from "date-fns";

export const hh = (n: number) => String(n).padStart(2, "0");

// --- Minute-aware helpers ---
export const parseTimeToMinutes = (time: string): number => {
  if (typeof time !== "string") {
    throw new Error(
      `parseTimeToMinutes: expected "HH:mm", got ${String(time)}`
    );
  }
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(time.trim());
  if (!m)
    throw new Error(
      `parseTimeToMinutes: invalid time "${time}" (expected "HH:mm")`
    );
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h * 60 + min;
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

//From the backend sunday comes back as 0, but the front uses it as 7. This changes it from 1 to 7
export const apiDayToUi = (api: number) => ((api + 6) % 7) + 1; // 0..6 -> 1..7
