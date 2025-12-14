import { AvailabilitySettings } from "./components";

export const metadata = {
  title: "Availability | ClientFlow",
  description: "Set your availability schedule.",
};

export default function AvailabilityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Availability</h1>
        <p className="hig-subheadline text-muted-foreground">Set your working hours and availability</p>
      </div>
      <AvailabilitySettings />
    </div>
  );
}
