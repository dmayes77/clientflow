import { EmailTemplateForm } from "../components/EmailTemplateForm";

export const metadata = {
  title: "New Template | ClientFlow",
};

export default function NewEmailTemplatePage() {
  return <EmailTemplateForm mode="create" />;
}
