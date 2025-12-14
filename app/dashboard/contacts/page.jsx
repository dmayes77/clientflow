import { ContactsList } from "./components";

export const metadata = {
  title: "Contacts | ClientFlow",
  description: "Manage your client database.",
};

export default function ContactsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1>Contacts</h1>
        <p className="hig-subheadline text-muted-foreground">Manage your contacts database</p>
      </div>
      <ContactsList />
    </div>
  );
}
