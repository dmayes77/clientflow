import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <ShieldX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
