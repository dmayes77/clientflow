import { ServicesList } from "./components";

export const metadata = {
  title: "Services & Pricing | ClientFlow",
  description: "Manage your services and pricing.",
};

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Services & Pricing</h1>
        <p className="text-sm text-muted-foreground">Manage your service offerings</p>
      </div>
      <ServicesList />
    </div>
  );
}
