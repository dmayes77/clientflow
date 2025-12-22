import { WebhooksList } from "./components";

export const metadata = {
  title: "Webhooks | ClientFlow",
  description: "Configure webhook endpoints.",
};

export default function WebhooksPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhook endpoints for real-time notifications</p>
      </div>
      <WebhooksList />
    </div>
  );
}
