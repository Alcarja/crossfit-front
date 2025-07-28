/* eslint-disable @typescript-eslint/no-explicit-any */
import { Workout } from "../types";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export const WorkoutDialog = ({
  workout,
}: {
  workout: Workout;
  isToday: any;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer rounded-md border p-2 text-sm hover:bg-muted transition">
          <h2 className="font-semibold">{workout.type}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(workout.date).toLocaleDateString("es-ES")}
          </p>
        </div>
      </DialogTrigger>

      <DialogContent
        className={`
          max-h-[90vh] overflow-y-auto border rounded-md p-4 text-smbg-white"`}
      >
        {/* Top Section */}
        <div className="flex items-center justify-start gap-3">
          <div className="text-xl font-semibold uppercase tracking-wide">
            {workout.type}
          </div>
          <span>-</span>
          <div className="text-sm">
            {new Date(workout.date).toLocaleDateString("es-ES")}
          </div>
        </div>

        {/* CAP (if exists) */}
        {workout.cap && (
          <div className="text-sm mb-2 text-muted-foreground">
            CAP: {workout.cap}
          </div>
        )}

        {/* Workout Parts */}
        {workout.parts?.map((part) => (
          <div
            key={part.title}
            className="mb-2 border-l-4 pl-3 py-3 bg-blue-50 rounded-md border-blue-500"
          >
            <h3 className="font-semibold text-sm mb-1">{part.title}</h3>
            <div
              className="prose prose-sm text-sm"
              dangerouslySetInnerHTML={{
                __html: part.content || "",
              }}
            />

            {part.versions && (
              <div className="mt-2 space-y-2">
                {part.versions.rx && (
                  <div>
                    <h4 className="text-xs font-semibold text-blue-700">RX</h4>
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
                    <h4 className="text-xs font-semibold text-blue-700">
                      Scaled
                    </h4>
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
                    <h4 className="text-xs font-semibold text-blue-700">
                      Beginner
                    </h4>
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

        {/* Versions */}
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
