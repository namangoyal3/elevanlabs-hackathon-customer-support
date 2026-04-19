# Privacy & Data Deletion

NovaPay is regulated under the **Digital Personal Data Protection Act, 2023 (DPDP)** and the RBI data-localisation directive. Customers have the right to access, correct, and delete their personal data, subject to the legal retention requirements below.

## What data we hold

- **Profile:** name, DOB, email, mobile, profile photo
- **KYC:** PAN, Aadhaar masked number, document images, video-KYC recording
- **Transaction history:** every UPI / wallet / card / loan transaction, including counterparties
- **Behavioural:** device IDs, approximate location at time of transaction, app usage events
- **Loan:** if the customer has taken a loan, the full loan file including NACH mandate + e-sign

## Data-access request (DSAR)

A customer can download a complete machine-readable export of their data via:
**Home → Settings → Privacy → Download my data**

- Export is generated asynchronously — **SLA: within 5 business days**
- The download is emailed as an encrypted ZIP with a password sent separately to the registered mobile
- The export includes all data listed above in JSON + CSV formats

## Data-correction request

For name changes, address updates, or KYC-document refreshes, use the in-app KYC-update flow (see KYC Verification Guide). For any field not covered there (e.g. corrections to transaction descriptions), customers email **privacy@novapay.example** with the exact field and desired change.

## Data-deletion request

Customers can request deletion of their data via:
**Home → Settings → Privacy → Delete my account**

### What happens when a deletion request is filed
1. **Immediate:** account is frozen (no new transactions; see Account Freeze Policy)
2. **Within 24 hours:** all marketing + analytics event pipelines purge the customer's data
3. **Within 30 days:** hard-delete of all non-retention-required data. After this point, the customer is unrecoverable — a fresh signup with the same PAN is treated as a new relationship.

### Data we are required to retain despite deletion

Indian financial regulation requires NovaPay to retain certain data even after a deletion request:
- **Transaction history: 10 years** (RBI prevention-of-money-laundering rules)
- **KYC records: 5 years** after account closure (PMLA 2002)
- **Loan files: 8 years** after loan closure (RBI NBFC-MFI master directions)
- **Tax records:** as required by Income Tax Act

Retained data is moved to a **legal-hold cold store** with access restricted to compliance staff only. It is not used for any operational purpose.

### Deletion SLA

**30 days from request date.** A confirmation email is sent on day 30 once hard-delete completes. If the customer has an active loan, deletion is blocked until the loan is fully repaid or settled — the request is held, not rejected.

## Data portability

A customer's NovaPay profile (excluding bank + KYC data, which cannot be legally shared cross-provider) can be exported as a **DPDP-compliant portability pack** for re-use by another payment provider. Generated through the same "Download my data" flow; flagged with "Portability format" in the request.

## Agent scripting notes

- Never promise immediate deletion — the SLA is 30 days and this is a regulatory requirement.
- If the customer asks "will you keep my data?", be honest about the retention periods. These are **legal obligations**, not company policy. Customers appreciate the transparency.
- If the customer is frustrated about retention, direct them to the full privacy policy at **novapay.example/privacy** which lists the specific statutes.
