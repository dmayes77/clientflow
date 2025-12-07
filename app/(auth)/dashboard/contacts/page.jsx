import { ContactsList } from "./components";

export const metadata = {
  title: "Contacts | ClientFlow",
  description: "Manage your client database.",
};

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="et-text-2xl font-semibold">Contacts</h1>
        <p className="et-text-sm text-muted-foreground">Manage your client database</p>
      </div>
      <ContactsList />
    </div>
  );
}
