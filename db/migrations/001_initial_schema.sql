-- Migration 001: Initial Schema
-- CallPilot — AI Co-Pilot for Customer Support
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- This script is idempotent — safe to re-run.

-- ──────────────────────────────────────────────────────────────
-- STEP 1: Enable pgvector extension
-- ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ──────────────────────────────────────────────────────────────
-- STEP 2: Core tables
-- ──────────────────────────────────────────────────────────────

-- Calls: one row per phone call
CREATE TABLE IF NOT EXISTS calls (
  id           TEXT PRIMARY KEY,
  contact_id   TEXT,
  agent_id     TEXT,
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  duration_s   INTEGER,
  disposition  TEXT CHECK (disposition IN ('resolved','follow_up','escalated','abandoned')),
  summary      TEXT,
  qa_score     NUMERIC(4,2),
  csat_pred    NUMERIC(3,2),
  processed    BOOLEAN DEFAULT FALSE,
  crm_synced   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Transcript chunks: each utterance from agent or customer
CREATE TABLE IF NOT EXISTS transcript_chunks (
  id        BIGSERIAL PRIMARY KEY,
  call_id   TEXT REFERENCES calls(id) ON DELETE CASCADE,
  speaker   TEXT CHECK (speaker IN ('agent','customer')),
  text      TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  sentiment NUMERIC(4,3) CHECK (sentiment BETWEEN -1.0 AND 1.0)
);
CREATE INDEX IF NOT EXISTS idx_transcript_call ON transcript_chunks(call_id, timestamp);

-- Knowledge base articles with vector embeddings
CREATE TABLE IF NOT EXISTS kb_articles (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  url        TEXT,
  embedding  vector(1536),
  company_id TEXT DEFAULT 'novapay',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for fast approximate nearest-neighbour search (cosine distance)
CREATE INDEX IF NOT EXISTS kb_articles_embedding_hnsw
  ON kb_articles USING hnsw (embedding vector_cosine_ops);

-- KB gaps: unanswered customer questions detected post-call
CREATE TABLE IF NOT EXISTS kb_gaps (
  id          BIGSERIAL PRIMARY KEY,
  call_id     TEXT REFERENCES calls(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  occurrences INTEGER DEFAULT 1,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- QA scores: rubric evaluation per call
CREATE TABLE IF NOT EXISTS qa_scores (
  id           BIGSERIAL PRIMARY KEY,
  call_id      TEXT REFERENCES calls(id) ON DELETE CASCADE,
  scores       JSONB,
  total        NUMERIC(4,2),
  highlights   TEXT[],
  improvements TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Audit log: immutable append-only event trail
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id  TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- STEP 3: RPC functions
-- ──────────────────────────────────────────────────────────────

-- Health probe: returns server time + pgvector availability
CREATE OR REPLACE FUNCTION health()
RETURNS TABLE (now TIMESTAMPTZ, vector_installed BOOLEAN)
LANGUAGE SQL STABLE
AS $$
  SELECT now(),
         EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector');
$$;

-- KB vector search: cosine similarity, threshold-filtered, top-K results
CREATE OR REPLACE FUNCTION match_kb_articles(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count     INT
)
RETURNS TABLE (
  id         TEXT,
  title      TEXT,
  content    TEXT,
  url        TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT id, title, content, url,
         1 - (embedding <=> query_embedding) AS similarity
  FROM kb_articles
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ──────────────────────────────────────────────────────────────
-- STEP 4: Row Level Security (enable for production)
-- ──────────────────────────────────────────────────────────────
-- Uncomment these when you add authentication (Phase 5 / Clerk).
-- By default, Supabase service-role key bypasses RLS entirely,
-- so the app will work without these during development.

-- ALTER TABLE calls             ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transcript_chunks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kb_articles       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kb_gaps           ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE qa_scores         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;

-- Example policy (service role always bypasses):
-- CREATE POLICY "agents can read their own calls"
--   ON calls FOR SELECT
--   USING (agent_id = auth.uid()::text);
