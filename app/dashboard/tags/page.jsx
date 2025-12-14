import { TagsList } from "./components";

export const metadata = {
  title: "Tags | ClientFlow",
  description: "Organize your data with tags.",
};

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Tags</h1>
        <p className="text-muted-foreground">Organize contacts, invoices, and bookings with custom tags to trigger workflows</p>
      </div>
      <TagsList />
    </div>
  );
}
