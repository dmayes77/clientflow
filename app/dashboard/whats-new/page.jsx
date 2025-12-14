import { ChangelogList } from "./components";

export const metadata = {
  title: "What's New | ClientFlow",
  description: "See the latest updates and features.",
};

export default function WhatsNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>What&apos;s New</h1>
        <p className="text-muted-foreground">Latest updates and features</p>
      </div>
      <ChangelogList />
    </div>
  );
}
