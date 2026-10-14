import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = "https://api.paystack.co";

interface PaystackInitResponse {
  status: boolean;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  data: {
    status: string;
    reference: string;
    amount: number;
    paid_at: string;
  };
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // kobo
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInitResponse> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paystack init failed: ${res.statusText}`);
  }

  return res.json();
}

export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Paystack verify failed: ${res.statusText}`);
  }

  return res.json();
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(body)
    .digest("hex");
  return hash === signature;
}
