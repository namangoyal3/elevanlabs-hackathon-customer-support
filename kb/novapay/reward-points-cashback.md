# Reward Points & Cashback

NovaPay's reward programme credits customers for spending through the wallet and UPI rails. Rewards are credited as **NovaPay Coins** — 1 Coin = ₹1 — redeemable for wallet top-ups, select merchant vouchers, and EMI payments.

## Earn rate

| Spend channel | Earn rate | Cap per transaction |
|---------------|-----------|---------------------|
| **UPI spend** | 1.5% | max ₹50 per transaction |
| **NovaPay Wallet spend** | 2.0% | max ₹100 per transaction |
| Debit card spend (online + offline) | 1.0% | max ₹30 per transaction |
| Utility bill payments (electricity / LPG / broadband) | 0.5% | max ₹25 per transaction |
| Peer-to-peer UPI transfers | **0%** (not rewarded) | — |
| Loan EMI auto-debits | **0%** | — |

Rewards are calculated on the **net transaction value** (after any merchant discount) and credited within 3 business days of the transaction.

## Monthly earning cap

A customer can earn a maximum of **₹2,500 in NovaPay Coins per calendar month** across all channels combined. After the cap, transactions continue to process but no new Coins are credited for the remainder of the month. The counter resets on the 1st of each month.

## Expiry

- NovaPay Coins expire **12 months** after the date they were credited
- Expiry is calculated per Coin batch (not per account) — oldest Coins are used first on redemption ("FIFO")
- Customers can see their Coin-expiry schedule in **Home → Rewards → View expiry schedule**

## Redemption

Coins can be redeemed via **Home → Rewards → Redeem**:
- **Wallet top-up** (1:1 — no minimum, instant)
- **Gift vouchers** from partner merchants (e.g. Amazon, Flipkart, BookMyShow; minimum 100 Coins)
- **Loan EMI payment** (covers current or next upcoming EMI; no partial application)
- **Donation** to verified NGOs (full tax receipt provided)

Coins **cannot** be transferred to another NovaPay user, withdrawn as cash to a bank account, or used for credit card bill payments.

## Disputes over missing rewards

If a customer expected rewards for a qualifying transaction but didn't see them after 3 business days:
1. Check if the transaction is in an **excluded category** (P2P transfers, loan EMIs)
2. Check if the monthly cap has already been reached
3. Confirm the transaction is in **Home → Rewards → Earnings** — it may just be in "pending" state
4. If still missing, raise a rewards dispute via the same transaction's dispute flow — use category **"Missing cashback / rewards"**. Team SLA for rewards disputes is **5 business days**.

## Agent scripting notes

- Always quote both the **earn rate AND the per-transaction cap** — many customer complaints are about the cap, not the rate.
- If a customer is near the monthly earning cap, recommend they switch spend to the **wallet rail** (2% rate) before hitting the cap rather than UPI (1.5%).
- Cashback on a refunded transaction is **clawed back** — the Coins already credited for the original purchase are deducted when the refund processes. This is documented in the T&C but is a frequent source of confusion.
