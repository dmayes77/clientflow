import { TagsList } from "./components";

export const metadata = {
  title: "Tags | ClientFlow",
  description: "Organize your data with tags.",
};

export default function TagsPage() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="font-bold">Tags</h1>
        <p className="text-muted-foreground mt-0.5 sm:mt-1">
          Organize contacts, invoices, and bookings with custom tags to trigger workflows
        </p>
      </div>
      <TagsList />
    </div>
  );
}
