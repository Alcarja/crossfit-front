import { format, startOfWeek } from "date-fns";

export const hh = (n: number) => String(n).padStart(2, "0");
export const parseHour = (time: string) => parseInt(time.split(":")[0], 10);
export const iso = (d: Date) => format(d, "yyyy-MM-dd");
export const weekKeyFromDate = (d: Date) =>
  iso(startOfWeek(d, { weekStartsOn: 1 }));
export const durationFromTimes = (start: string, end: string) =>
  (parseHour(end) - parseHour(start)) * 60;

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
