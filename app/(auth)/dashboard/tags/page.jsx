import { TagsList } from "./components";

export const metadata = {
  title: "Tags | ClientFlow",
  description: "Organize your data with tags.",
};

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tags</h1>
        <p className="text-sm text-muted-foreground">Organize contacts and bookings with custom tags</p>
      </div>
      <TagsList />
    </div>
  );
}
