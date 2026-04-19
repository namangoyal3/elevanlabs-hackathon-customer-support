# Account Freeze Policy

NovaPay may freeze an account when its risk engine detects behaviour that violates the terms of service or that puts the customer or platform at risk. A frozen account cannot initiate new transactions but can still be logged into to view balance and history.

## Freeze triggers

An account can be frozen automatically if any of the following is detected:
1. **Fraud flags** — e.g. the beneficiary VPA is on the RBI blacklist, or the IP is in a known high-risk region
2. **3 consecutive wrong UPI PIN attempts** in under 10 minutes (hard-freeze for 24 hours; soft-freeze for 10 minutes after each wrong attempt)
3. **KYC expiry** — the account crosses 24 months since last KYC with no re-KYC completed
4. **Income-tax reporting discrepancy** — PAN-linked adverse record from ITD
5. **Court order / regulatory direction** — freeze via legal process; cannot be auto-unfrozen
6. **Customer-initiated freeze** — via **Help → Report lost device → Freeze now**

Accounts are **not frozen** for non-payment of loan EMIs; that is a separate workflow handled by the collections team.

## What is blocked during a freeze

- Outgoing UPI payments (send, pay merchant, pay bills)
- Wallet top-up
- Loan disbursements
- Card transactions (debit card is temporarily disabled)
- P2P transfers to other NovaPay users

Incoming money (refunds, salary credits, incoming P2P) is **still allowed** and will land in the wallet or linked bank account as normal.

## Unfreezing an account

### Soft-freeze (3 wrong PIN attempts)
- Self-service: wait 10 minutes, then try again in the app
- If forgotten PIN: **Home → Payments → Forgot UPI PIN → Reset** (requires Aadhaar OTP + debit card last 6)

### Hard-freeze (24 hours after repeated wrong PIN)
- Expires automatically after 24 hours from the last wrong attempt
- Can be cleared early by customer service after verifying identity (KYC-linked phone OTP + PAN last 4)

### Fraud-flag freeze
- **Timeline: up to 24 business hours** to unfreeze
- Customer must complete an in-app video verification (liveness + ID check)
- If the flag was a false positive, a re-enablement email is sent and the account is live within 30 minutes of verification

### KYC-expiry freeze
- Complete re-KYC in the app (**Home → Profile → Complete re-KYC**)
- Account is auto-unfrozen within **10 minutes** of successful re-KYC

### Legal freeze
- **Not auto-unfrozen.** Must be released by the authority that ordered it. Customer Service can only share the contact details of the processing team; do not commit to a timeline.

## Agent scripting notes

- Always confirm the **freeze reason** from the agent dashboard before quoting a timeline — customers are often told by the app "contact support" without a reason shown in their view.
- For fraud-flag freezes, **do not share the triggering signal** with the customer (e.g. "your IP was flagged") — this is a compliance restriction. Say: "Our risk system asked for a verification step before we can re-enable."
- If a customer says they cannot log in at all, that is **a lockout, not a freeze** — covered in Login & Access Help (separate article).
