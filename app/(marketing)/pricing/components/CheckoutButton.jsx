"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateCheckout } from "@/lib/hooks";

export function CheckoutButton({ priceId, planType, children, ...props }) {
  const createCheckout = useCreateCheckout();

  const handleCheckout = () => {
    createCheckout.mutate(
      { priceId, planType },
      {
        onSuccess: (data) => {
          window.location.href = data.url;
        },
        onError: (error) => {
          console.error("Error:", error);
          toast.error("Failed to start checkout. Please try again.");
        },
      }
    );
  };

  return (
    <Button onClick={handleCheckout} disabled={createCheckout.isPending} {...props}>
      {createCheckout.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </Button>
  );
}
