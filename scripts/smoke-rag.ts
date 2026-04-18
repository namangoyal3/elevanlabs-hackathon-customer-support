import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { ragSearch } from '../lib/rag';

interface Scenario {
  label: string;
  query: string;
  expectedTopId: string;
}

const SCENARIOS: Scenario[] = [
  {
    label: 'A · Failed Transaction',
    query: 'My UPI payment of ₹4,500 failed 3 days ago but the money was debited from my account.',
    expectedTopId: 'failed-transaction-policy',
  },
  {
    label: 'B · KYC + Freeze',
    query: 'I submitted my documents for KYC 2 weeks ago and my account is still frozen.',
    expectedTopId: 'account-freeze-policy',
  },
  {
    label: 'C · Loan Disbursal',
    query: 'My loan was approved yesterday but I have not received the money yet.',
    expectedTopId: 'loan-disbursement-faq',
  },
];

async function main() {
  let failures = 0;
  for (const s of SCENARIOS) {
    const start = Date.now();
    const hits = await ragSearch(s.query, 3);
    const elapsed = Date.now() - start;
    console.log(`\n━━ ${s.label} (${elapsed}ms)`);
    console.log(`   Q: ${s.query}`);
    if (hits.length === 0) {
      console.log('   ✗ no results');
      failures++;
      continue;
    }
    hits.forEach((h, i) => {
      const marker = i === 0 && h.id === s.expectedTopId ? '✅' : i === 0 ? '❌' : '  ';
      console.log(`   ${marker} [${(h.similarity ?? 0).toFixed(3)}] ${h.id} — ${h.title}`);
    });
    if (hits[0].id !== s.expectedTopId) failures++;
  }
  console.log(`\nFailures: ${failures}/${SCENARIOS.length}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('smoke failed:', err);
  process.exit(1);
});
