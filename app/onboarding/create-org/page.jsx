"use client";

import { CreateOrganization } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

export default function CreateOrgPage() {
  return (
    <div className="text-center">
      <Badge className="mb-4" variant="secondary">
        Step 1 of 3
      </Badge>
      <h2 className="mb-2 text-2xl font-bold">Create Your Business</h2>
      <p className="mb-8 text-muted-foreground">
        Set up your business account to get started with ClientFlow
      </p>

      <div className="flex justify-center">
        <CreateOrganization
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              cardBox: "shadow-lg rounded-xl border",
              card: "shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
          afterCreateOrganizationUrl="/onboarding/payment"
          skipInvitationScreen={true}
        />
      </div>
    </div>
  );
}
