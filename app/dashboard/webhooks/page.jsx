import { WebhooksList } from "./components";

export const metadata = {
  title: "Webhooks | ClientFlow",
  description: "Configure webhook endpoints.",
};

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Webhooks</h1>
        <p className="text-muted-foreground">Configure webhook endpoints for real-time notifications</p>
      </div>
      <WebhooksList />
    </div>
  );
}
