import { Suspense } from "react";
import { ContactsList } from "./components";

export const metadata = {
  title: "Contacts | ClientFlow",
  description: "Manage your client database.",
};

export default function ContactsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold">Contacts</h1>
        <p className="text-muted-foreground">Manage your contacts database</p>
      </div>
      <Suspense fallback={<div className="rounded-lg border bg-card p-6 flex items-center justify-center"><div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div>}>
        <ContactsList />
      </Suspense>
    </div>
  );
}
