import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT as string,
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export type PushPayload = {
  title: string;
  body: string;
  tag?: string;
};

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ ok: boolean; gone: boolean }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true, gone: false };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 404/410 means the browser unsubscribed or the subscription expired —
    // the caller should delete it rather than keep retrying forever.
    return { ok: false, gone: statusCode === 404 || statusCode === 410 };
  }
}
