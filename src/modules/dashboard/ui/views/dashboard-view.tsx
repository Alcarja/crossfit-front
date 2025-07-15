"use client";

import ScheduleCalendar2 from "@/components/web/scheduleCalendar2";

const DashboardView = () => {
  return (
    <div className="w-full max-w-[2400px] px-4 sm:px-6 md:px-12 py-8 space-y-16">
      <section className="bg-white border rounded-xl shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-4">Schedule</h2>
        <ScheduleCalendar2 />
      </section>
    </div>
  );
};

export default DashboardView;
