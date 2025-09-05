/* eslint-disable @typescript-eslint/no-explicit-any */
import { typeColors } from "@/components/types/types";
import { Workout } from "../types";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export const WorkoutDialog = ({
  workout,
}: {
  workout: Workout;
  isToday: any;
}) => {
  // Pull classes from your map; provide a safe fallback
  const typeClass = typeColors[workout.type] || "bg-gray-200 text-gray-900";

  return (
    <Dialog>
      {/* Trigger: colored by type */}
      <DialogTrigger asChild>
        <div
          className={`cursor-pointer rounded-md border p-2 text-sm transition
                      hover:brightness-95 ${typeClass}`}
        >
          <h2 className="font-semibold">{workout.type}</h2>
          <p className="text-xs/5 opacity-80">
            {new Date(workout.date).toLocaleDateString("es-ES")}
          </p>
        </div>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border rounded-md p-4 text-sm bg-white">
        {/* Colored header inside dialog */}
        <div className={`rounded-md px-3 py-2 mb-3 ${typeClass}`}>
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold uppercase tracking-wide">
              {workout.type}
            </div>
            <span className="opacity-80">—</span>
            <div className="text-xs opacity-90">
              {new Date(workout.date).toLocaleDateString("es-ES")}
            </div>
          </div>
          {workout.cap && (
            <div className="text-xs mt-1 opacity-90">CAP: {workout.cap}</div>
          )}
        </div>

        {/* Workout Parts */}
        {workout.parts?.map((part) => (
          <div
            key={part.title}
            className="
              mb-2 rounded-md bg-gray-50 py-3 pl-3 pr-2
              border-l-4 border-current
              ring-1 ring-inset ring-black/5
            "
          >
            <h3 className="font-semibold text-sm mb-1">
              {part.title}
              {part.title === "Workout" && (part.format || part.cap) && (
                <>
                  {part.format && ` - ${part.format}`}
                  {part.cap && ` ${part.cap}'`}
                </>
              )}
            </h3>

            <div
              className="prose prose-sm text-sm"
              dangerouslySetInnerHTML={{ __html: part.content || "" }}
            />

            {part.versions && (
              <div className="mt-2 space-y-2">
                {part.versions.rx && (
                  <div>
                    <h4 className="text-xs font-semibold">RX</h4>
                    <div
                      className="prose prose-xs text-xs"
                      dangerouslySetInnerHTML={{
                        __html: part.versions.rx.description,
                      }}
                    />
                  </div>
                )}
                {part.versions.scaled && (
                  <div>
                    <h4 className="text-xs font-semibold">Scaled</h4>
                    <div
                      className="prose prose-xs text-xs"
                      dangerouslySetInnerHTML={{
                        __html: part.versions.scaled.description,
                      }}
                    />
                  </div>
                )}
                {part.versions.beginner && (
                  <div>
                    <h4 className="text-xs font-semibold">Beginner</h4>
                    <div
                      className="prose prose-xs text-xs"
                      dangerouslySetInnerHTML={{
                        __html: part.versions.beginner.description,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {part.notes && (
              <div className="text-xs italic mt-1 text-gray-500">
                {part.notes}
              </div>
            )}
          </div>
        ))}

        {/* Workout-level Versions */}
        {workout.versions?.rx && (
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-1">RX</h3>
              <div
                className="prose prose-sm text-sm"
                dangerouslySetInnerHTML={{
                  __html: workout.versions.rx.description,
                }}
              />
            </div>

            {workout.versions.scaled && (
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

            {workout.versions.beginner && (
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
        )}
      </DialogContent>
    </Dialog>
  );
};
