export type WorkoutPart = {
  id: number;
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
  date: string;
  type:
    | "WOD"
    | "Gymnastics"
    | "Weightlifting"
    | "Endurance"
    | "Foundations"
    | "Kids";
  cap?: string;
  parts?: WorkoutPart[];
  versions?: {
    rx: { description: string };
    scaled?: { description: string };
    beginner?: { description: string };
  };
};
