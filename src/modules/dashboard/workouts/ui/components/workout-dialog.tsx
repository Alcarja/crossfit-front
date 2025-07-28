import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type WorkoutPart = {
  title: "Warm-up" | "Strength" | "Workout" | "Midline" | "Accessories";
  format?: "FOR TIME" | "EMOM" | "INTERVAL" | "AMRAP";
  content: string;
  notes?: string;
};

export type Workout = {
  id: string;
  date: string; // ISO string (for calendar display)
  type:
    | "WOD"
    | "Gymnastics"
    | "Weightlifting"
    | "Endurance"
    | "Foundations"
    | "Kids";

  focus?: string[]; // e.g. ["upper body", "VO2MAX"]
  cap?: string; // e.g. "20 min"
  parts?: WorkoutPart[];
  versions?: {
    rx: { description: string };
    scaled?: { description: string };
    beginner?: { description: string };
  };
};

export const WorkoutDialog = ({ workout }: { workout: Workout }) => {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer rounded-md border p-3 shadow-sm hover:bg-muted transition flex items-center justify-between">
            <h2 className="font-semibold">{workout.type}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(workout.date).toLocaleDateString("es-ES")}
            </p>
          </div>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              {workout.type}
            </DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mb-4 space-y-1">
            <p>{new Date(workout.date).toLocaleDateString()}</p>
            {Array.isArray(workout.focus) && workout.focus.length > 0 && (
              <p>Focus: {workout.focus.join(", ")}</p>
            )}
            {workout.cap && <p>CAP: {workout.cap}</p>}
          </div>

          {workout.parts?.map((part) => (
            <div key={part.title} className="mb-6">
              <h3 className="font-semibold text-sm mb-1">{part.title}</h3>
              <div
                className="prose prose-sm text-sm"
                dangerouslySetInnerHTML={{
                  __html: part.content || "",
                }}
              />
            </div>
          ))}

          <div className="mt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-1">RX</h3>
              {workout.versions && (
                <div
                  className="prose prose-sm text-sm"
                  dangerouslySetInnerHTML={{
                    __html: workout?.versions?.rx.description,
                  }}
                />
              )}
            </div>

            {workout.versions && workout.versions.scaled && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Scaled</h3>
                <div
                  className="prose prose-sm text-sm"
                  dangerouslySetInnerHTML={{
                    __html: workout.versions.scaled.description,
                  }}
                />
              </div>
            )}

            {workout.versions && workout.versions.beginner && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Beginner</h3>
                <div
                  className="prose prose-sm text-sm"
                  dangerouslySetInnerHTML={{
                    __html: workout.versions.beginner.description,
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
