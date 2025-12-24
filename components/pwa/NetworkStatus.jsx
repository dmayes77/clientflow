"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide "reconnected" message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show nothing when online and not showing reconnected message
  if (isOnline && !showReconnected) {
    return null;
  }

  // Reconnected banner
  if (isOnline && showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-100 animate-in slide-in-from-top-2 duration-300">
        <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <Wifi className="w-4 h-4" />
          <span>Back online</span>
        </div>
      </div>
    );
  }

  // Offline banner
  return (
    <div className="fixed top-0 left-0 right-0 z-100 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>You're offline - some features may be unavailable</span>
      </div>
    </div>
  );
}
