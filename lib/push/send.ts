import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys missing — notifications disabled");
    return;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
};

/**
 * Sends a web-push notification to every stored subscription.
 * Silently prunes subscriptions that return 404/410 (the browser revoked them).
 * Fire-and-forget friendly — errors are logged, never thrown.
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  configureVapid();
  if (!vapidConfigured) return;

  const supabase = await createAdminClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error) {
    console.error("[push] failed to read subscriptions", error);
    return;
  }
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const deadIds: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body
        );
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone — remove it
          deadIds.push(s.id);
        } else {
          console.error("[push] send failed", statusCode, err);
        }
      }
    })
  );

  if (deadIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", deadIds);
  }
}

/**
 * Sends a push notification to a specific player (by player_id).
 * Looks up the player's user_id, then finds their subscriptions.
 */
export async function sendPushToPlayer(
  playerId: string,
  payload: PushPayload
): Promise<void> {
  configureVapid();
  if (!vapidConfigured) return;

  const supabase = await createAdminClient();

  // Get the player's user_id
  const { data: player } = await supabase
    .from("players")
    .select("user_id")
    .eq("id", playerId)
    .single();

  if (!player?.user_id) return;

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", player.user_id);

  if (error || !subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  const deadIds: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body
        );
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          deadIds.push(s.id);
        } else {
          console.error("[push] send to player failed", statusCode, err);
        }
      }
    })
  );

  if (deadIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", deadIds);
  }
}
