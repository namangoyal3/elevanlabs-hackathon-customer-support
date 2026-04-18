-- Migration 002: Demo Seed Data
-- Inserts mock contacts and a sample call for local development / demo purposes.
-- Run AFTER 001_initial_schema.sql.
-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).

-- ──────────────────────────────────────────────────────────────
-- Sample calls (for testing post-call UI without a live call)
-- ──────────────────────────────────────────────────────────────
INSERT INTO calls (id, contact_id, agent_id, started_at, ended_at, duration_s, disposition, summary, qa_score, csat_pred, processed, crm_synced)
VALUES
  (
    'call_demo_001',
    'contact_priya_001',
    'agent_demo',
    now() - INTERVAL '2 hours',
    now() - INTERVAL '1 hour 48 minutes',
    720,
    'resolved',
    'Customer reported UPI payment failure to merchant Zomato. Guided through retry flow. Transaction completed successfully after cache clear.',
    87.50,
    0.92,
    TRUE,
    FALSE
  ),
  (
    'call_demo_002',
    'contact_rahul_002',
    'agent_demo',
    now() - INTERVAL '1 hour',
    now() - INTERVAL '48 minutes',
    720,
    'escalated',
    'Customer disputed EMI deduction for personal loan. Escalated to loans team after confirming discrepancy in statement.',
    72.00,
    0.41,
    TRUE,
    FALSE
  ),
  (
    'call_demo_003',
    'contact_ananya_003',
    'agent_demo',
    now() - INTERVAL '30 minutes',
    now() - INTERVAL '18 minutes',
    720,
    'follow_up',
    'Customer requested KYC upgrade to Premium tier. Documents submitted. Follow-up required in 48 hours for verification confirmation.',
    91.00,
    0.78,
    TRUE,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- Sample transcript chunks for demo call 001
-- ──────────────────────────────────────────────────────────────
INSERT INTO transcript_chunks (call_id, speaker, text, timestamp, sentiment)
VALUES
  ('call_demo_001', 'customer', 'Hi, my UPI payment to Zomato failed but the money was debited from my account.',               now() - INTERVAL '1 hour 58 minutes', -0.6),
  ('call_demo_001', 'agent',    'I understand that''s frustrating. Let me pull up your account right away.',                      now() - INTERVAL '1 hour 57 minutes',  0.2),
  ('call_demo_001', 'customer', 'It''s been 3 hours and neither the merchant got the money nor was it refunded to me.',            now() - INTERVAL '1 hour 56 minutes', -0.7),
  ('call_demo_001', 'agent',    'I can see the transaction is in a pending state. This usually resolves within 24 hours but let me initiate a manual check.', now() - INTERVAL '1 hour 55 minutes',  0.3),
  ('call_demo_001', 'customer', 'Okay, thank you. I hope it gets resolved soon.',                                                  now() - INTERVAL '1 hour 53 minutes',  0.1),
  ('call_demo_001', 'agent',    'Absolutely. I''ve raised a priority trace request. You''ll get an SMS update within 2 hours.',    now() - INTERVAL '1 hour 52 minutes',  0.6),
  ('call_demo_001', 'customer', 'Great, thank you so much for the help!',                                                          now() - INTERVAL '1 hour 50 minutes',  0.8)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- Sample QA scores
-- ──────────────────────────────────────────────────────────────
INSERT INTO qa_scores (call_id, scores, total, highlights, improvements)
VALUES
  (
    'call_demo_001',
    '{"empathy": 90, "resolution": 95, "tone": 85, "accuracy": 80, "efficiency": 87}'::jsonb,
    87.50,
    ARRAY['Excellent empathy at call opening', 'Clear and accurate resolution steps', 'Customer left satisfied'],
    ARRAY['Could have proactively offered refund timeline upfront', 'Slight delay in pulling up account']
  ),
  (
    'call_demo_002',
    '{"empathy": 75, "resolution": 60, "tone": 78, "accuracy": 80, "efficiency": 67}'::jsonb,
    72.00,
    ARRAY['Correctly identified billing discrepancy', 'Professional escalation handoff'],
    ARRAY['Escalation could have been triggered earlier', 'Customer left frustrated — sentiment recovery needed']
  )
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- Sample KB gaps
-- ──────────────────────────────────────────────────────────────
INSERT INTO kb_gaps (call_id, question, occurrences, status)
VALUES
  ('call_demo_002', 'What is the exact SLA for EMI dispute resolution?', 3, 'open'),
  ('call_demo_003', 'Can KYC upgrade be done via WhatsApp without visiting a branch?', 2, 'open')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- Audit log entries
-- ──────────────────────────────────────────────────────────────
INSERT INTO audit_log (event_type, entity_id, payload)
VALUES
  ('call.created',   'call_demo_001', '{"contact_id": "contact_priya_001", "source": "seed"}'::jsonb),
  ('call.processed', 'call_demo_001', '{"disposition": "resolved", "qa_score": 87.5}'::jsonb),
  ('call.created',   'call_demo_002', '{"contact_id": "contact_rahul_002", "source": "seed"}'::jsonb),
  ('call.processed', 'call_demo_002', '{"disposition": "escalated", "qa_score": 72.0}'::jsonb),
  ('call.created',   'call_demo_003', '{"contact_id": "contact_ananya_003", "source": "seed"}'::jsonb);
