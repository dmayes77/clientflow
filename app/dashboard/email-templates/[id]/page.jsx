import { EmailTemplateForm } from "../components/EmailTemplateForm";

export const metadata = {
  title: "Edit Template | ClientFlow",
};

export default async function EditEmailTemplatePage({ params }) {
  const { id } = await params;

  return <EmailTemplateForm mode="edit" templateId={id} />;
}
