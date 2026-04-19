# Failed Transaction Policy

If a UPI payment fails but the money has been debited from the customer's linked bank account, NovaPay follows the RBI-mandated **T+3 auto-refund rule**. The amount will be credited back to the same source account within three business days of the original transaction date. No customer action is required for an auto-refund to be triggered — the reversal happens as soon as the settlement batch reconciles.

## Common UPI failure codes

| Code | Meaning | Customer impact |
|------|---------|-----------------|
| **U16** | Beneficiary bank unable to credit — often a temporary receiver-side outage | Money debited, auto-reversal in 24–72h |
| **U30** | Debit was successful but the credit-confirmation webhook timed out | Auto-reversal in 24h if the beneficiary bank confirms non-receipt |
| **U69** | Beneficiary VPA invalid or deactivated | Immediate reversal — typically within minutes |
| **U28** | Merchant MCC (Merchant Category Code) temporarily blocked | Reversal within 24h |
| **ZM** | PSP (payment service provider) technical failure | Reversal in 24h |

## Checking refund status

Customers can track the refund in the NovaPay app:
**Home → Transactions → tap the failed payment → View dispute details.**
The page shows the expected refund date (transaction date + 3 business days), the failure code, and the last status update from the PSP.

## When to file a dispute

If the refund has **not arrived by end of day on the third business day**, the customer is eligible to raise a manual dispute. Disputes are logged from the same transaction detail page via the "Raise a dispute" button, which creates a chargeback request against the merchant or the beneficiary bank. Support for disputes is covered in the Chargeback & Disputes article.

## Agent scripting notes

- Always quote the T+3 window calculated from the **transaction timestamp**, not the time of call.
- The debit-side reversal uses the same UTR (Unique Transaction Reference) as the original debit — tell customers to look for the same UTR in their bank statement.
- Weekends and bank holidays don't count toward the T+3 SLA.
- If the original debit is on a **credit card-linked UPI** rail, the reversal lands on the card as a refund adjustment, not the card limit — this is a frequent point of customer confusion.
- Partial failures (e.g. ₹4,500 debited, only ₹4,000 credited) are rare but are handled as disputes, not auto-refunds.

## Escalation triggers

Escalate to T2 when: the refund is past T+5 with no PSP update; the failure code is not in the table above; the customer is an enterprise-tier account; or the disputed amount is over ₹50,000.
