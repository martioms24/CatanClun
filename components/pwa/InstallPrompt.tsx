"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    try {
      if (sessionStorage.getItem("pwa-dismissed")) {
        setDismissed(true);
      }
    } catch {}

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem("pwa-dismissed", "1");
    } catch {}
  }

  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-4">
      <div className="bg-medieval-dark border-2 border-medieval-gold rounded-medieval shadow-medieval-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-cinzel text-medieval-gold text-sm font-semibold">
            Instal·la Catan Clun
          </p>
          <p className="font-garamond text-parchment/70 text-xs mt-0.5">
            Afegeix l&apos;app a la teva pantalla d&apos;inici
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleInstall}>
          <Download size={14} />
          Instal·lar
        </Button>
        <button
          onClick={handleDismiss}
          className="text-parchment/50 hover:text-parchment p-1 transition-colors"
          aria-label="Tancar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
