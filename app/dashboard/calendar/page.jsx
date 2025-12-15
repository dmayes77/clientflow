import { CalendarView } from "./components";

export const metadata = {
  title: "Calendar | ClientFlow",
  description: "View and manage your bookings calendar.",
};

export default function CalendarPage() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Calendar</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          View and manage your bookings
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
