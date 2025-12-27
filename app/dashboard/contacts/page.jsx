import { Suspense } from "react";
import { ContactsList } from "./components";

export const metadata = {
  title: "Contacts | ClientFlow",
  description: "Manage your client database.",
};

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="rounded-lg border bg-card p-6 flex items-center justify-center"><div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" /></div>}>
      <ContactsList />
    </Suspense>
  );
}
