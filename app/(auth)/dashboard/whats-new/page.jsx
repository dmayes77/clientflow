import { ChangelogList } from "./components";

export const metadata = {
  title: "What's New | ClientFlow",
  description: "See the latest updates and features.",
};

export default function WhatsNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="et-text-2xl font-semibold">What&apos;s New</h1>
        <p className="et-text-sm text-muted-foreground">Latest updates and features</p>
      </div>
      <ChangelogList />
    </div>
  );
}
