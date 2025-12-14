import { WorkflowsList } from "./components";

export const metadata = {
  title: "Workflows | ClientFlow",
  description: "Automate your business processes.",
};

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Workflows</h1>
        <p className="text-muted-foreground">Automate your business processes</p>
      </div>
      <WorkflowsList />
    </div>
  );
}
