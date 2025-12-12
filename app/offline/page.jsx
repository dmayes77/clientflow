"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Offline Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">You're Offline</h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">
          It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
        </p>

        {/* What's available */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-medium mb-2">While offline, you can:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• View recently cached pages</li>
            <li>• Access downloaded content</li>
            <li>• Review your last synced data</li>
          </ul>
        </div>

        {/* Retry Button */}
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>

        {/* Status indicator */}
        <p className="text-xs text-muted-foreground mt-6">
          We'll automatically reconnect when you're back online
        </p>
      </div>
    </div>
  );
}
