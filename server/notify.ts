import { storage } from "./storage";
import { sendSMS } from "./sms";
import type { InsertNotification } from "@shared/schema";

interface NotifyOptions {
  /** The in-app notification to create */
  notification: InsertNotification;
  /** SMS message text (shorter than in-app). If omitted, no SMS sent. */
  smsMessage?: string;
}

/**
 * Unified notification dispatcher.
 * Creates an in-app notification AND sends SMS if the user has:
 * 1. SMS notifications enabled in their preferences
 * 2. A phone number on their profile
 */
export async function notify(options: NotifyOptions): Promise<void> {
  const { notification, smsMessage } = options;

  // Always create the in-app notification
  await storage.createNotification(notification);

  // Attempt SMS if message provided
  if (smsMessage) {
    try {
      const user = await storage.getUser(notification.userId);
      if (!user || !user.phone) return;

      const prefs = (user.notificationPrefs as any) || {};
      if (prefs.smsNotifications !== true) return;

      await sendSMS(user.phone, smsMessage);
    } catch (error) {
      // SMS failure should never block the flow
      console.error("SMS notification failed:", error);
    }
  }
}
