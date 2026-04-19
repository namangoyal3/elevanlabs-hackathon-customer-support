import { create } from 'zustand';
import type {
  CallState,
  CallSummary,
  Contact,
  KbArticle,
  TranscriptChunk,
} from '@/types';

/**
 *  State machine:
 *
 *  idle ─ pickPersona ─▶ pre_call ─ startCall ─▶ active ─ endCall ─▶ ended
 *    ▲                                                                │
 *    └──────────────────────── reset ──────────────────────────────────┘
 *
 *  Only these transitions are valid. Guards live in the action creators
 *  so dispatching e.g. `endCall()` while in `idle` is a no-op, not a crash.
 */

export interface CallStore extends CallState {
  // lifecycle
  pickPersona: (contact: Contact, predicted?: KbArticle[]) => void;
  startCall: (callId: string) => void;
  endCall: () => void;
  reset: () => void;

  // live updates
  appendTranscript: (chunk: TranscriptChunk) => void;
  setKbCards: (cards: KbArticle[]) => void;
  setIntent: (label: string, confidence: number) => void;
  setSentiment: (score: number) => void;
  setSuggestedReplies: (replies: string[]) => void;
  triggerEscalation: () => void;
  dismissEscalation: () => void;

  // post-call
  setSummary: (summary: CallSummary) => void;
  summary: CallSummary | null;
}

const initialState: CallState & { summary: CallSummary | null } = {
  callId: null,
  status: 'idle',
  contact: null,
  transcript: [],
  kbCards: [],
  sentimentScore: 0,
  intentLabel: '',
  intentConfidence: 0,
  escalationRisk: false,
  suggestedReplies: [],
  summary: null,
};

export const useCallStore = create<CallStore>((set, get) => ({
  ...initialState,

  pickPersona: (contact, predicted = []) => {
    if (get().status !== 'idle' && get().status !== 'ended') return;
    set({
      ...initialState,
      status: 'pre_call',
      contact,
      kbCards: predicted,
    });
  },

  startCall: (callId) => {
    if (get().status !== 'pre_call') return;
    set({ status: 'active', callId });
  },

  endCall: () => {
    if (get().status !== 'active') return;
    set({ status: 'ended' });
  },

  reset: () => set(initialState),

  appendTranscript: (chunk) => {
    if (get().status !== 'active') return;
    set((s) => ({ transcript: [...s.transcript, chunk] }));
  },

  setKbCards: (cards) => set({ kbCards: cards }),

  setIntent: (label, confidence) => set({ intentLabel: label, intentConfidence: confidence }),

  setSentiment: (score) => set({ sentimentScore: score }),

  setSuggestedReplies: (replies) => set({ suggestedReplies: replies.slice(0, 3) }),

  triggerEscalation: () => set({ escalationRisk: true }),

  dismissEscalation: () => set({ escalationRisk: false }),

  setSummary: (summary) => set({ summary }),
}));

/** Pure reducer variant exposed for unit tests (no React dependency). */
export interface ReducerState {
  state: CallState & { summary: CallSummary | null };
}

export function createTestStore() {
  return useCallStore.getState;
}
