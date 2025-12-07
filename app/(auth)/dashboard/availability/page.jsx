import { AvailabilitySettings } from "./components";

export const metadata = {
  title: "Availability | ClientFlow",
  description: "Set your availability schedule.",
};

export default function AvailabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="et-text-2xl font-semibold">Availability</h1>
        <p className="et-text-sm text-muted-foreground">Set your working hours and availability</p>
      </div>
      <AvailabilitySettings />
    </div>
  );
}
