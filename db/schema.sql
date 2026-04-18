-- CallPilot schema. Idempotent — safe to re-run.
-- Requires pgvector. Enable once per database:  CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;

-- Calls
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

-- Transcript chunks
CREATE TABLE IF NOT EXISTS transcript_chunks (
  id        BIGSERIAL PRIMARY KEY,
  call_id   TEXT REFERENCES calls(id) ON DELETE CASCADE,
  speaker   TEXT CHECK (speaker IN ('agent','customer')),
  text      TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  sentiment NUMERIC(4,3)
);
CREATE INDEX IF NOT EXISTS idx_transcript_call ON transcript_chunks(call_id, timestamp);

-- Knowledge base
CREATE TABLE IF NOT EXISTS kb_articles (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  url        TEXT,
  embedding  vector(1536),
  company_id TEXT DEFAULT 'novapay',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index (better recall than ivfflat, no train step). Cosine distance.
CREATE INDEX IF NOT EXISTS kb_articles_embedding_hnsw
  ON kb_articles USING hnsw (embedding vector_cosine_ops);

-- Knowledge gaps detected post-call
CREATE TABLE IF NOT EXISTS kb_gaps (
  id          BIGSERIAL PRIMARY KEY,
  call_id     TEXT REFERENCES calls(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  occurrences INTEGER DEFAULT 1,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- QA scores per call
CREATE TABLE IF NOT EXISTS qa_scores (
  id           BIGSERIAL PRIMARY KEY,
  call_id      TEXT REFERENCES calls(id) ON DELETE CASCADE,
  scores       JSONB,
  total        NUMERIC(4,2),
  highlights   TEXT[],
  improvements TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Audit log (immutable append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id  TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
