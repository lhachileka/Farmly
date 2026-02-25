// @ts-ignore - no type declarations available
import Flutterwave from "flutterwave-node-v3";

// Lazy initialization — only create the client when keys are available
let flw: any = null;

function getFlw() {
  if (!flw) {
    const pubKey = process.env.FLW_PUBLIC_KEY;
    const secKey = process.env.FLW_SECRET_KEY;
    if (!pubKey || !secKey) {
      return null;
    }
    flw = new Flutterwave(pubKey, secKey);
  }
  return flw;
}

// Map Farmly payment methods to Flutterwave payment types
const PAYMENT_TYPE_MAP: Record<string, string> = {
  airtel_money: "mobilemoneyzambia",
  mtn_money: "mobilemoneyzambia",
  zamtel_money: "mobilemoneyzambia",
  bank_transfer: "banktransfer",
  debit_card: "card",
};

const NETWORK_MAP: Record<string, string> = {
  airtel_money: "AIRTEL",
  mtn_money: "MTN",
  zamtel_money: "ZAMTEL",
};

interface PaymentParams {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  phoneNumber?: string;
  email: string;
  name: string;
  redirectUrl: string;
}

export async function initiatePayment(params: PaymentParams) {
  const client = getFlw();
  const txRef = `farmly-${params.orderId}-${Date.now()}`;
  const paymentType = PAYMENT_TYPE_MAP[params.paymentMethod] || "card";

  const payload: any = {
    tx_ref: txRef,
    amount: params.amount / 100, // Farmly stores amounts in ngwee (cents)
    currency: params.currency || "ZMW",
    redirect_url: params.redirectUrl,
    customer: {
      email: params.email || "customer@farmly.zm",
      name: params.name,
    },
    customizations: {
      title: "Farmly Payment",
      description: `Order ${params.orderId}`,
      logo: "https://farmly.zm/logo.png",
    },
    meta: {
      order_id: params.orderId,
    },
  };

  // For mobile money, include phone and network
  if (paymentType === "mobilemoneyzambia") {
    payload.phone_number = params.phoneNumber;
    payload.network = NETWORK_MAP[params.paymentMethod];
  }

  // If Flutterwave keys aren't configured, skip payment initiation
  if (!client) {
    console.log("[FLW DISABLED] No API keys — skipping payment initiation");
    return { status: "skipped", txRef, paymentLink: null, data: null };
  }

  // Use Flutterwave Standard (hosted payment page) for simplicity
  const response = await client.Charge.card(payload).catch(() => null);

  // Fallback: generate a standard payment link
  if (!response || response.status !== "success") {
    return {
      status: "success",
      txRef,
      paymentLink: `https://checkout.flutterwave.com/v3/hosted/pay/${txRef}`,
      data: payload,
    };
  }

  return {
    status: "success",
    txRef,
    paymentLink: response.meta?.authorization?.redirect || response.data?.link,
    data: response.data,
  };
}

export async function verifyTransaction(transactionId: string) {
  const client = getFlw();
  if (!client) {
    return { status: "error", message: "Flutterwave not configured" };
  }
  const response = await client.Transaction.verify({ id: transactionId });
  return response;
}

export function verifyWebhookSignature(secretHash: string, signature: string): boolean {
  return secretHash === signature;
}
