import { CalendarView } from "./components";

export const metadata = {
  title: "Calendar | ClientFlow",
  description: "View and manage your bookings calendar.",
};

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Calendar</h1>
        <p className="text-muted-foreground">View and manage your bookings</p>
      </div>
      <CalendarView />
    </div>
  );
}
