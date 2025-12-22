import { EmailTemplatesList } from "./components";

export const metadata = {
  title: "Email Templates | ClientFlow",
  description: "Create and manage email templates for your workflows.",
};

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="font-bold">Email Templates</h1>
        <p className="text-muted-foreground mt-0.5 sm:mt-1">
          Create and manage email templates for your workflows
        </p>
      </div>
      <EmailTemplatesList />
    </div>
  );
}
