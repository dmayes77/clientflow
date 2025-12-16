import { PackagesList } from "./components";

export const metadata = {
  title: "Packages | ClientFlow",
  description: "Manage your service packages.",
};

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Packages</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground">Bundle services into packages for your clients</p>
      </div>
      <PackagesList />
    </div>
  );
}
