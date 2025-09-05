export type TemplateClass = {
  id: string;
  name: string;
  duration: number; // minutes
  coach?: string;
  zone?: string;
  type: string;
  capacity?: number;
};

export type TemplateRow = {
  id: string; // structure row id
  name: string;
  type: string;
  dayOfWeek: number; // 1..7 (Mon=1)
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number;
  zone?: string;
  coach?: string;
};

export type WeekInstance = {
  id: string; // instance id
  date: string; // yyyy-MM-dd
  name: string;
  type: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  capacity: number;
  enrolled: number;
  zone?: string;
  coach?: string;
};
