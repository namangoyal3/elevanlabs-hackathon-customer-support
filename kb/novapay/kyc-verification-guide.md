# KYC Verification Guide

NovaPay follows the RBI Master Direction on KYC. Every customer must complete full KYC before they can transact above the limited-KYC threshold (₹10,000 in and ₹10,000 out per month). The process is entirely in-app and typically completes within 10 minutes.

## Accepted identity documents

Customers may submit **any one** of the following for identity + address proof:
- **Aadhaar card** (preferred — enables instant e-KYC via UIDAI OTP)
- **Passport** (front + back pages, must be unexpired)
- **Driving licence** (front + back, issued by any Indian state RTO)
- **Voter ID / EPIC card** (front + back, Election Commission of India)

PAN is always required **in addition** to the above, for income-tax compliance on cashback + reward crediting.

## Re-KYC triggers

A customer who has already completed KYC may be asked to re-verify if:
- More than **24 months** have passed since the last successful KYC (RBI rule for low-risk customers)
- A **name or address change** is detected in the CKYC registry
- Aadhaar e-KYC consent was withdrawn by the customer in UIDAI
- The account crosses into **higher-risk transaction patterns** (flagged by the risk engine — not disclosed to the customer)
- The customer requests a **limit upgrade** (e.g. loan onboarding or enterprise tier)

Re-KYC usually requires only a fresh Aadhaar OTP + video verification. Full document re-upload is only required if the originally submitted document has expired.

## Common rejection reasons

1. **Blurry / cropped uploads** — ensure all four corners of the document are visible and text is legible.
2. **Name mismatch** — the name on the ID must match the name on the PAN card exactly, including middle names.
3. **Expired document** — passports and driving licences must be valid on the date of upload.
4. **Selfie mismatch** — the live-selfie check uses liveness detection; photos of photos are rejected.
5. **Low-quality Aadhaar mask** — if the user redacts Aadhaar numbers, the OCR pipeline fails; submit an unmasked Aadhaar with the first 8 digits covered only by the UIDAI tool, not manually.

## Timeline

- **Aadhaar e-KYC with OTP:** instant (approved within 2 minutes)
- **Manual document review:** up to 24 business hours
- **Video KYC (for high-value accounts):** scheduled within 48 hours

## What to tell a customer whose KYC has been rejected

Explain the **specific rejection reason** (available in the agent dashboard under the customer's profile), direct them to the rejection email they received, and walk them through the single field that needs correction. Re-submission reuses the same KYC ticket — there is no cooldown, and the customer can re-upload immediately.
