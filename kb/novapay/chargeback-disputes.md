# Chargeback & Disputes

A chargeback is a formal request to reverse a payment the customer believes was not authorized, not delivered, or materially different from what was ordered. For UPI and card rails, NovaPay represents the customer in the dispute process against the merchant's acquiring bank.

## When to file a dispute

A customer can file a chargeback dispute if any of the following are true:
- **Failed transaction** — money debited, beneficiary didn't receive it, and auto-refund did not land in T+3 business days
- **Unauthorized transaction** — customer claims they did not initiate or approve the debit
- **Service not rendered** — e.g. paid for a flight, flight was cancelled and airline did not refund within 10 business days
- **Duplicate charge** — the merchant charged the same transaction twice
- **Amount mismatch** — merchant charged more than the agreed amount

For fraud / card-not-present disputes, NovaPay also requires the customer to **block the card** in the app and file a police FIR within 72 hours for amounts above ₹10,000.

## How to file

1. Open the NovaPay app → **Home → Transactions**
2. Tap the disputed transaction
3. Scroll to **"Raise a dispute"**
4. Select the dispute category (see above), add a description, and attach any supporting evidence (screenshots, order confirmations, email threads)
5. The dispute ticket is created with a **reference code in the format DSP-YYYYMMDD-NNNN** — this is what the customer should quote on any future call

## Timeline (SLA)

- **Dispute acknowledgement:** within 4 hours (automated email + in-app notification)
- **Provisional credit (fraud claims only):** within 2 business days after acknowledgement, pending investigation
- **Merchant response window:** **7 business days** — the acquiring bank forwards the dispute; the merchant has this window to accept, reject, or provide counter-evidence
- **Final resolution:** up to **45 calendar days** for complex disputes (e.g. airline refund chargebacks)

If the merchant does not respond within 7 business days, NovaPay auto-resolves the dispute in the customer's favour.

## Merchant escalation

If the customer's dispute is rejected by the merchant and the customer has further evidence, they can **appeal within 10 business days** via the same ticket. Appeals are reviewed by NovaPay's Dispute Resolution team, not the merchant — and may trigger an RBI Ombudsman filing if the merchant is non-cooperative.

## Reference codes the customer may see

| Code prefix | Meaning |
|-------------|---------|
| **DSP** | Dispute ticket (customer-facing) |
| **CHB** | Chargeback formally raised with acquiring bank |
| **ARN** | Acquirer Reference Number (used during bank escalation) |
| **OMB** | Ombudsman case number |

## Agent scripting notes

- Always read the customer the **DSP reference code** when a dispute is raised on-call — write it in their follow-up email too.
- Provisional credits are visible in the customer's wallet with the label **"DISPUTE HOLD"** — they can spend this credit but it becomes a debit if the dispute is rejected.
- Do not promise a dispute outcome on a call. Say: "The merchant has 7 business days to respond; you'll hear back from us either way."
