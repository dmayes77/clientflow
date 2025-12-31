"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed before (within last 7 days)
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event (Chrome/Android)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Delay showing prompt to not interrupt initial experience
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS, show prompt after delay if not standalone
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", new Date().toISOString());
  };

  // Don't show if already installed or no prompt available
  if (isStandalone || !showPrompt) {
    return null;
  }

  // iOS-specific install instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4" style={{ animationDuration: 'var(--animation-duration)', animationTimingFunction: 'var(--animation-timing)' }}>
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-1">Install ClientFlow</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Tap the share button <span className="inline-block px-1 py-0.5 bg-muted rounded text-[10px]">⎙</span> then "Add to Home Screen" for the best experience.
              </p>
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 text-xs">
                Got it
              </Button>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chrome/Android install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4" style={{ animationDuration: 'var(--animation-duration)', animationTimingFunction: 'var(--animation-timing)' }}>
      <div className="bg-card border border-border rounded-xl shadow-xl p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1">Install ClientFlow</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Install for quick access, offline support, and a native app experience.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleInstall} className="h-8 text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Install
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 text-xs">
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
