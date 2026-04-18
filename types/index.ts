export type Tier = 'standard' | 'premium' | 'enterprise';

export interface Ticket {
  id: string;
  title: string;
}

export interface CallHistoryItem {
  date: string;
  summary: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tier: Tier;
  vip: boolean;
  openTickets: Ticket[];
  callHistory: CallHistoryItem[];
}

export interface KbArticle {
  id: string;
  title: string;
  content: string;
  snippet?: string;
  url?: string;
  similarity?: number;
}

export type Speaker = 'agent' | 'customer';

export interface TranscriptChunk {
  speaker: Speaker;
  text: string;
  timestamp: number;
}

export type Disposition = 'resolved' | 'follow_up' | 'escalated' | 'abandoned';
export type SentimentTrend = 'positive' | 'neutral' | 'negative' | 'recovered';

export interface CallSummary {
  text: string;
  disposition: Disposition;
  followUpActions: string[];
  sentimentTrend: SentimentTrend;
  csatPrediction: number;
}

export interface CallState {
  callId: string | null;
  status: 'idle' | 'pre_call' | 'active' | 'ended';
  contact: Contact | null;
  transcript: TranscriptChunk[];
  kbCards: KbArticle[];
  sentimentScore: number;
  intentLabel: string;
  intentConfidence: number;
  escalationRisk: boolean;
  suggestedReplies: string[];
}
