import type { IntentLabel } from '@/lib/intent-parser';

/**
 * Per-intent canned suggested replies. Keeps the agent's side of the
 * call on-script without needing another LLM round-trip per utterance.
 *
 * Tuned to the 8 NovaPay KB articles — the top card for each intent is
 * the article the replies refer to, so clicking the chip keeps the
 * agent aligned with what the KB says.
 */
export const REPLIES_BY_INTENT: Record<IntentLabel, string[]> = {
  failed_transaction: [
    'Your refund should arrive within 3 business days from the transaction date.',
    'Let me raise a dispute ticket on your behalf so we can escalate it.',
    'Could you share the exact UPI failure code shown in your app?',
  ],
  kyc_issue: [
    'Your KYC is typically processed within 24 business hours after submission.',
    'Could you confirm which document you submitted and that the selfie matched?',
    'I can trigger a re-KYC request now — would you like me to?',
  ],
  loan_status: [
    'Approved loans are disbursed within 24 to 48 hours after e-sign.',
    'Can you confirm you completed the e-sign step on the loan agreement?',
    'I can check the disbursal status right now if you hold for a moment.',
  ],
  wallet_topup: [
    'The daily wallet spend limit is ₹1 lakh for full-KYC accounts.',
    'Force-close the app and retry — the UPI handshake times out after 45 seconds.',
    'Would you like me to walk you through linking your bank for top-ups?',
  ],
  chargeback: [
    'The merchant has 7 business days to respond to a dispute ticket.',
    'I will raise a chargeback — your reference code will start with DSP.',
    'Do you have any supporting evidence I can attach to the dispute?',
  ],
  account_freeze: [
    'Most account freezes are cleared within 24 hours after verification.',
    'Could you complete the in-app video verification when prompted?',
    'If this is a KYC-expiry freeze, re-KYC will auto-unfreeze in 10 minutes.',
  ],
  rewards: [
    'UPI spend earns 1.5% cashback, capped at ₹50 per transaction.',
    'The monthly earning cap resets on the 1st of each month.',
    'NovaPay Coins expire 12 months after the date they were credited.',
  ],
  privacy: [
    'Your data deletion request will be fully processed within 30 days.',
    'Some transaction data must be retained for 10 years under RBI rules.',
    'You can download a full export via Settings → Privacy → Download my data.',
  ],
  other: [
    'Could you tell me a bit more about what you are seeing?',
    'Let me pull up your account — one moment.',
  ],
};

export function suggestedRepliesFor(intent: string): string[] {
  return (REPLIES_BY_INTENT as Record<string, string[]>)[intent] ?? REPLIES_BY_INTENT.other;
}
