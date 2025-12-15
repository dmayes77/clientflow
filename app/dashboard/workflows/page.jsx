import { WorkflowsList } from "./components";

export const metadata = {
  title: "Workflows | ClientFlow",
  description: "Automate your business processes.",
};

export default function WorkflowsPage() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Workflows</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          Automate your business processes
        </p>
      </div>
      <WorkflowsList />
    </div>
  );
}
