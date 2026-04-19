import OpenAI from 'openai';

/**
 * NVIDIA NIM chat completions via the OpenAI-compatible endpoint.
 *
 * Two model tiers in play:
 *   INTENT — nano-8b, latency-sensitive. Called on every debounced
 *            transcript turn during a live call.
 *   DEEP   — super-49b-v1.5, quality-sensitive. Called once at
 *            call end for summary + QA.
 *
 * Both models return JSON — callers must pass schema hints in the
 * system prompt and must be defensive about malformed output.
 */

export const INTENT_MODEL = 'nvidia/llama-3.1-nemotron-nano-8b-v1';
export const DEEP_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1.5';
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

let _client: OpenAI | undefined;

export function nvidiaClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not set');
  _client = new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL });
  return _client;
}

/** Testing seam so unit tests can swap in a fake. */
export function __setNvidiaClient(client: OpenAI | undefined) {
  _client = client;
}
