"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ScheduleCalendar() {
  return (
    <div className="w-full overflow-x-auto">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        slotMinTime="09:00:00"
        slotMaxTime="22:00:00"
        slotDuration="01:00:00"
        allDaySlot={false}
        firstDay={1}
        dayHeaderFormat={{ day: "numeric", month: "long" }}
        dayMaxEvents={true}
        selectable
        editable
        nowIndicator
        slotLabelContent={(arg) => {
          const start = arg.date;
          const end = new Date(start.getTime() + 60 * 60 * 1000); // add 1 hour
          const format = (d: Date) =>
            d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

          return `${format(start)} - ${format(end)}`;
        }}
        events={[
          {
            title: "WOD",
            start: "2025-07-15T09:00:00",
            end: "2025-07-15T10:00:00",
            extendedProps: { type: "WOD", coach: "Ana" },
          },
          {
            title: "WOD",
            start: "2025-07-15T09:00:00",
            end: "2025-07-15T10:00:00",
            extendedProps: { type: "WOD", coach: "Mike" },
          },
          {
            title: "WOD",
            start: "2025-07-15T11:00:00",
            end: "2025-07-15T12:00:00",
            extendedProps: { type: "WOD", coach: "Mike" },
          },
          {
            title: "WOD",
            start: "2025-07-15T12:00:00",
            end: "2025-07-15T13:00:00",
            extendedProps: { type: "WOD", coach: "Mike" },
          },
          {
            title: "WOD",
            start: "2025-07-15T13:00:00",
            end: "2025-07-15T14:00:00",
            extendedProps: { type: "WOD", coach: "Mike" },
          },
          {
            title: "WOD",
            start: "2025-07-15T14:00:00",
            end: "2025-07-15T15:00:00",
            extendedProps: { type: "WOD", coach: "Mike" },
          },
          {
            title: "WOD",
            start: "2025-07-15T11:00:00",
            end: "2025-07-15T12:00:00",
            extendedProps: { type: "WOD", coach: "Mike" },
          },
          {
            title: "Gymnastics",
            start: "2025-07-15T10:00:00",
            end: "2025-07-15T11:00:00",
            extendedProps: { type: "Gymnastics", coach: "Ana" },
          },
        ]}
        eventContent={({ event }) => {
          const type = event.extendedProps.type;
          const coach = event.extendedProps.coach;

          const colorMap: Record<string, string> = {
            WOD: "bg-blue-100 border-blue-300 text-blue-900",
            Gymnastics: "bg-yellow-100 border-yellow-300 text-yellow-900",
            Weightlifting: "bg-purple-100 border-purple-300 text-purple-900",
          };

          const classNames =
            colorMap[type] || "bg-gray-100 border-gray-300 text-gray-800";

          return (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`w-full h-full p-1 text-xs rounded-md shadow-sm border overflow-hidden cursor-pointer ${classNames}`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-[10px] truncate">{coach}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px]">
                  <div className="text-sm font-semibold">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Coach: {coach}
                  </div>
                  <div className="text-xs">
                    {new Date(event.startStr).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(event.endStr).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }}
      />
    </div>
  );
}
