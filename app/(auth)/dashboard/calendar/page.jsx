import { CalendarView } from "./components";

export const metadata = {
  title: "Calendar | ClientFlow",
  description: "View and manage your bookings calendar.",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">View and manage your bookings</p>
      </div>
      <CalendarView />
    </div>
  );
}
