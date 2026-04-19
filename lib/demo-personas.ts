import type { Contact } from '@/types';

/**
 * Three hardcoded NovaPay customer profiles used in the hackathon demo.
 * Each one maps cleanly to one of the three PRD §4.2 demo scenarios so
 * the agent can click → pre_call → start call → see the co-pilot surface
 * the exact KB cards the PRD predicts.
 */
export interface DemoPersona extends Contact {
  predictedIntent: string;
  predictedKbIds: string[];
  hookLine: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'demo-001',
    name: 'Priya Sharma',
    phone: '+919876543210',
    tier: 'standard',
    vip: false,
    openTickets: [],
    callHistory: [
      { date: '2026-03-15', summary: 'Wallet top-up issue, resolved' },
    ],
    predictedIntent: 'failed_transaction',
    predictedKbIds: ['failed-transaction-policy', 'chargeback-disputes'],
    hookLine: 'My UPI payment of ₹4,500 failed 3 days ago but the money was debited.',
  },
  {
    id: 'demo-002',
    name: 'Rahul Mehta',
    phone: '+919898765432',
    tier: 'enterprise',
    vip: true,
    openTickets: [{ id: 'T-4521', title: 'KYC re-submission pending' }],
    callHistory: [
      { date: '2026-04-01', summary: 'Account freeze — KYC expired' },
    ],
    predictedIntent: 'kyc_issue',
    predictedKbIds: ['kyc-verification-guide', 'account-freeze-policy'],
    hookLine: 'I submitted my KYC documents 2 weeks ago and my account is still frozen.',
  },
  {
    id: 'demo-003',
    name: 'Ananya Krishnan',
    phone: '+919765432109',
    tier: 'premium',
    vip: false,
    openTickets: [],
    callHistory: [
      { date: '2026-04-10', summary: 'Personal loan application approved' },
    ],
    predictedIntent: 'loan_status',
    predictedKbIds: ['loan-disbursement-faq'],
    hookLine: 'My loan was approved yesterday but I have not received the money yet.',
  },
];

export function getPersona(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id);
}
