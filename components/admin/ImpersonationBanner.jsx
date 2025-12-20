"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, X, ArrowLeft } from "lucide-react";

export function ImpersonationBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [impersonation, setImpersonation] = useState(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    async function checkImpersonation() {
      try {
        const res = await fetch("/api/admin/impersonate");
        const data = await res.json();
        if (data.impersonating) {
          setImpersonation(data);
        } else {
          setImpersonation(null);
        }
      } catch (err) {
        console.error("Error checking impersonation:", err);
      }
    }
    checkImpersonation();
  }, [pathname]);

  const handleEndImpersonation = async () => {
    setEnding(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      router.push(`/admin/tenants/${impersonation.tenantId}`);
      setImpersonation(null);
    } catch (err) {
      console.error("Error ending impersonation:", err);
    } finally {
      setEnding(false);
    }
  };

  if (!impersonation) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white px-3 py-1.5 flex items-center justify-between gap-2 shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="text-xs sm:text-sm font-medium truncate">
          Viewing as: <span className="font-bold">{impersonation.tenantName}</span>
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="h-7 text-xs shrink-0 bg-white/20 hover:bg-white/30 text-white border-0"
        onClick={handleEndImpersonation}
        disabled={ending}
      >
        <ArrowLeft className="h-3 w-3 mr-1" />
        {ending ? "Exiting..." : "Exit"}
      </Button>
    </div>
  );
}
