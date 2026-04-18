/**
 * NVIDIA NIM embeddings via the asymmetric retrieval model nv-embedqa-e5-v5.
 *
 * Asymmetric means: "passage" type embeddings are used at indexing time,
 * "query" type embeddings are used at search time. Using the right type
 * on each side materially improves retrieval quality — don't mix them.
 */

const NVIDIA_EMBED_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = 'nvidia/nv-embedqa-e5-v5';
export const NVIDIA_EMBED_DIM = 1024;

type InputType = 'passage' | 'query';

interface NvidiaEmbedResponse {
  data: Array<{ embedding: number[] }>;
  model?: string;
  usage?: unknown;
}

async function embed(text: string, inputType: InputType): Promise<number[]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not set');

  const res = await fetch(NVIDIA_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: NVIDIA_EMBED_MODEL,
      input: [text],
      input_type: inputType,
      encoding_format: 'float',
      truncate: 'END',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`NVIDIA embed ${res.status}: ${body.slice(0, 400)}`);
  }

  const json = (await res.json()) as NvidiaEmbedResponse;
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length !== NVIDIA_EMBED_DIM) {
    throw new Error(`NVIDIA embed: unexpected response shape (dim=${vec?.length})`);
  }
  return vec;
}

export function embedPassage(text: string): Promise<number[]> {
  return embed(text, 'passage');
}

export function embedQuery(text: string): Promise<number[]> {
  return embed(text, 'query');
}
