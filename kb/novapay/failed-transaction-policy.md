# Failed Transaction Policy

## Overview
A failed transaction occurs when a payment initiated through NovaPay does not complete successfully. This can happen due to network issues, bank declines, insufficient funds, or technical errors on the payment gateway.

## Common Reasons for Transaction Failure

1. **Insufficient Funds** — The customer's bank account or NovaPay wallet does not have enough balance to complete the payment.
2. **Bank Decline** — The customer's bank has declined the transaction due to fraud detection, daily limits, or account restrictions.
3. **Network Timeout** — The transaction timed out due to a slow or interrupted internet connection during payment.
4. **Incorrect UPI PIN** — The customer entered the wrong UPI PIN three or more times, causing the transaction to be blocked temporarily.
5. **Technical Error** — A system error on NovaPay's or the bank's payment gateway caused the transaction to fail.
6. **Expired Card / Account** — The linked bank account or card has expired or been closed.

## Refund Policy for Failed Transactions

- If money was debited but the transaction shows as failed, the amount is **automatically refunded within 3 business days**.
- For UPI transactions: refund is typically credited within **24–48 hours**.
- For wallet payments: refund is instant in most cases.
- If the refund has not arrived after **5 business days**, escalate the ticket to the payments team.

## How to Check Transaction Status

1. Open the NovaPay app → **Transactions** tab.
2. Locate the transaction and tap on it.
3. The status will show: **Success**, **Pending**, **Failed**, or **Refunded**.
4. For pending transactions older than 4 hours, advise the customer to wait up to 24 hours before escalating.

## Suggested Response for Agents

> "I can see your transaction failed on [date]. A refund of ₹[amount] will be credited back to your account within 3 business days. If you don't receive it by [date+3], please contact us again with the Transaction Reference ID and we'll escalate it immediately."

## Escalation Criteria

- Refund not received after 5 business days → escalate to Payments Team
- Transaction amount above ₹50,000 → escalate immediately regardless of timeline
- Customer reports the same issue on 3+ transactions → flag for fraud review

## Reference Codes

| Code | Meaning |
|------|---------|
| TXN_FAIL_001 | Insufficient funds |
| TXN_FAIL_002 | Bank declined |
| TXN_FAIL_003 | Network timeout |
| TXN_FAIL_004 | UPI PIN error |
| TXN_FAIL_005 | Technical error |
