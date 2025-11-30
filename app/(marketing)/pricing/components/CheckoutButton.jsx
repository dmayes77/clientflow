"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export function CheckoutButton({ priceId, planType, children, ...props }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          planType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start checkout. Please try again.",
        color: "red",
      });
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} loading={loading} {...props}>
      {children}
    </Button>
  );
}
