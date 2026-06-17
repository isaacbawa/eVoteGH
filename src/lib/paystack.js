import crypto from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export async function initializeTransaction({ email, amountInPesewas, reference, metadata }) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountInPesewas, // Paystack expects the smallest currency unit (pesewas for GHS)
      reference,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize Paystack transaction");
  }
  return data.data; // { authorization_url, access_code, reference }
}

export async function verifyTransaction(reference) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to verify Paystack transaction");
  }
  return data.data;
}

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}