export interface QaCriterion {
  id: string;
  label: string;
  weight: number; // [0,1], all weights should sum to 1.0
}

/**
 * Eight-criterion call-quality rubric mirrored from PRD §10.4.
 * Weights sum to 1.0 so the aggregate score stays on a 1..5 scale.
 */
export const QA_CRITERIA: readonly QaCriterion[] = [
  { id: 'greeting',   label: 'Correct greeting and consent prompt',     weight: 0.10 },
  { id: 'accuracy',   label: 'Accurate info provided (vs KB)',          weight: 0.25 },
  { id: 'empathy',    label: 'Empathy and tone',                        weight: 0.15 },
  { id: 'compliance', label: 'Compliance script followed',              weight: 0.20 },
  { id: 'fcr',        label: 'Issue resolved on first contact',         weight: 0.10 },
  { id: 'escalation', label: 'Correct escalation handling',             weight: 0.10 },
  { id: 'duration',   label: 'Call duration within SLA',                weight: 0.05 },
  { id: 'crm',        label: 'CRM updated correctly',                   weight: 0.05 },
];

export type QaScoreEntry = { score: number; rationale: string };
export type QaScoreMap = Record<string, QaScoreEntry>;

export interface QaResult {
  scores: QaScoreMap;
  total: number;
  highlights: string[];
  improvements: string[];
}

/**
 * Weighted average of per-criterion scores. Missing criteria contribute 0
 * weight (they're skipped from both numerator and denominator) so partial
 * LLM responses don't artificially tank the total.
 */
export function weightedAverage(scores: QaScoreMap, criteria: readonly QaCriterion[] = QA_CRITERIA): number {
  let numerator = 0;
  let denominator = 0;
  for (const c of criteria) {
    const entry = scores[c.id];
    if (!entry || typeof entry.score !== 'number' || !Number.isFinite(entry.score)) continue;
    const clamped = Math.max(1, Math.min(5, entry.score));
    numerator += clamped * c.weight;
    denominator += c.weight;
  }
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}
