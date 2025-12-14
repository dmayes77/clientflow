import { EmailTemplatesList } from "./components";

export const metadata = {
  title: "Email Templates | ClientFlow",
  description: "Create and manage email templates for your workflows.",
};

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Email Templates</h1>
        <p className="text-muted-foreground">Create and manage email templates for your workflows</p>
      </div>
      <EmailTemplatesList />
    </div>
  );
}
