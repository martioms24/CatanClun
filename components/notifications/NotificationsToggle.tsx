"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/actions/notifications-actions";

type Status = "unsupported" | "denied" | "disabled" | "enabled" | "loading";

/** Convert a base64 VAPID public key into the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationsToggle({
  className,
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "full";
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const existing = await reg?.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "enabled" : "disabled");
      } catch {
        if (!cancelled) setStatus("disabled");
      }
    }
    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      // 1. Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 2. Ask permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "disabled");
        return;
      }

      // 3. Subscribe
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 4. Persist on server
      const json = sub.toJSON();
      const res = await savePushSubscription(
        {
          endpoint: json.endpoint!,
          keys: {
            p256dh: json.keys!.p256dh!,
            auth: json.keys!.auth!,
          },
        },
        navigator.userAgent
      );
      if (res.error) {
        console.error("Save subscription failed:", res.error);
        return;
      }
      setStatus("enabled");
    } catch (err) {
      console.error("Enable notifications failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("disabled");
    } catch (err) {
      console.error("Disable notifications failed:", err);
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported" || status === "loading") return null;

  const enabled = status === "enabled";
  const denied = status === "denied";

  const label = denied
    ? "Permisos bloquejats"
    : enabled
    ? "Notificacions activades"
    : "Activar notificacions";

  const onClick = denied ? undefined : enabled ? disable : enable;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy || denied}
        title={label}
        aria-label={label}
        className={cn(
          "flex items-center justify-center rounded-medieval p-1.5 transition-colors",
          enabled
            ? "text-medieval-gold hover:bg-parchment/10"
            : "text-parchment/70 hover:text-medieval-gold hover:bg-parchment/10",
          denied && "opacity-40 cursor-not-allowed",
          className
        )}
      >
        {enabled ? <Bell size={18} /> : <BellOff size={18} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || denied}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-medieval font-cinzel text-base w-full transition-colors",
        enabled
          ? "text-medieval-gold hover:bg-parchment/10"
          : "text-parchment/70 hover:text-medieval-gold hover:bg-parchment/10",
        denied && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {enabled ? <Bell size={18} /> : <BellOff size={18} />}
      {label}
    </button>
  );
}
