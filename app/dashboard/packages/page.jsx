import { PackagesList } from "./components";

export const metadata = {
  title: "Packages | ClientFlow",
  description: "Manage your service packages.",
};

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Packages</h1>
        <p className="text-muted-foreground">Bundle services into packages for your clients</p>
      </div>
      <PackagesList />
    </div>
  );
}
