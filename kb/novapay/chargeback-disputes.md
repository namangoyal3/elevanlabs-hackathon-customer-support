# Chargeback & Disputes

## Overview
A chargeback is a reversal of a payment transaction initiated when a customer disputes a charge. NovaPay handles disputes for payments made via the NovaPay wallet, UPI, and NovaPay-issued cards.

## Types of Disputes

| Type | Description |
|------|-------------|
| Unauthorized Transaction | Customer did not authorize the payment |
| Merchant Not Delivered | Goods/services paid for were not received |
| Duplicate Charge | Same transaction charged twice |
| Wrong Amount | Merchant charged a different amount than agreed |
| Refund Not Received | Merchant promised a refund but it wasn't credited |

## How to File a Dispute

### Via App (Recommended)
1. Open NovaPay app → **Transactions**
2. Find the disputed transaction and tap on it
3. Tap **Raise a Dispute**
4. Select dispute reason from the list
5. Add supporting details (optional: attach screenshots)
6. Submit — you'll receive a reference number via SMS

### Via Customer Support
1. Call or chat with support
2. Provide: Transaction ID, amount, date, and reason for dispute
3. Agent raises the dispute on your behalf
4. Reference number shared with customer

## SLA (Resolution Timeline)

| Dispute Type | Resolution Time |
|-------------|----------------|
| Duplicate charge | 3–5 business days |
| Wrong amount | 3–5 business days |
| Merchant not delivered | 7 business days |
| Unauthorized transaction | 7–10 business days |
| Refund not received from merchant | 10–15 business days |

*All timelines are from the date the dispute is filed, not the transaction date.*

## Merchant Escalation Process

If the initial dispute is not resolved within the SLA:
1. NovaPay escalates directly to the merchant's payment gateway
2. Merchant has 5 business days to respond with evidence
3. If merchant does not respond, chargeback is approved automatically
4. If merchant disputes the claim, NovaPay's arbitration team reviews within 5 more business days

## What Customers Should Keep Ready

- Transaction reference number (starts with TXN-)
- Screenshot of payment confirmation
- Any communication with the merchant (receipts, emails, chat)
- Bank statement showing the debit

## Dispute Reference Codes

| Code | Meaning |
|------|---------|
| DSP-001 | Dispute filed, under review |
| DSP-002 | Merchant contacted |
| DSP-003 | Chargeback approved, refund in process |
| DSP-004 | Dispute rejected (evidence favors merchant) |
| DSP-005 | Escalated to arbitration |

## Suggested Response for Agents

> "I've raised a dispute for your transaction of ₹[amount] on [date]. Your dispute reference number is [DSP-XXXXX]. The resolution typically takes [X] business days. You'll receive updates via SMS. If it's not resolved by [date], please contact us with this reference number."

## Escalation Criteria

- Unauthorized transaction above ₹10,000 → escalate immediately to Fraud team
- Dispute unresolved beyond SLA → escalate to Senior Disputes team
- Customer claims identity theft → escalate to Security team and freeze account
- Merchant repeatedly disputed by multiple customers → flag to Risk team
