// @ts-ignore - no type declarations available
import AfricasTalking from "africastalking";

// Lazy initialization — only create the client when keys are available
let smsClient: any = null;

function getSMS() {
  if (!smsClient && process.env.AT_API_KEY) {
    const at = AfricasTalking({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME || "sandbox",
    });
    smsClient = at.SMS;
  }
  return smsClient;
}

/**
 * Format a Zambian phone number to international format (+260...)
 */
function formatZambianNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+260")) return cleaned;
  if (cleaned.startsWith("260")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+260${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `+260${cleaned}`;
  return cleaned;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const sms = getSMS();
  if (!sms) {
    console.log(`[SMS DISABLED] Would send to ${to}: ${message}`);
    return false;
  }

  try {
    const formattedNumber = formatZambianNumber(to);
    const result = await sms.send({
      to: [formattedNumber],
      message,
      from: "FARMLY",
    });
    console.log(`SMS sent to ${formattedNumber}:`, result);
    return true;
  } catch (error) {
    console.error("SMS send failed:", error);
    return false;
  }
}
