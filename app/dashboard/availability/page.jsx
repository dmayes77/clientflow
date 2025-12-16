import { AvailabilitySettings } from "./components";

export const metadata = {
  title: "Availability | ClientFlow",
  description: "Set your availability schedule.",
};

export default function AvailabilityPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Availability</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground">Set your working hours and availability</p>
      </div>
      <AvailabilitySettings />
    </div>
  );
}
