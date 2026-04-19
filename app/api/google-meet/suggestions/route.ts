import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const SYSTEM_PROMPT = `You are an AI co-pilot for customer support agents on a Google Meet call.
Analyze the conversation transcript and return a JSON object with actionable suggestions.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "responseImprovement": "A better or more empathetic way to phrase the agent's most recent response",
  "missingInfo": "Key information the agent should still gather from the customer",
  "toneAdvice": "One specific empathy or tone improvement for this moment",
  "kbReference": "Relevant policy, procedure, or knowledge the agent should reference",
  "nextAction": "The single most important next step the agent should take",
  "urgencyLevel": "low|medium|high"
}

If the transcript is too short to analyze a category, use null for that field.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { transcript } = body as { transcript?: string };

  if (!transcript || transcript.trim().length < 20) {
    return Response.json({ error: 'Transcript too short to analyze' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const completion = await nvidia.chat.completions.create({
          model: 'nvidia/llama-3.1-nemotron-nano-8b-instruct',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Analyze this Google Meet customer support transcript:\n\n${transcript}`,
            },
          ],
          stream: true,
          max_tokens: 600,
          temperature: 0.2,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content ?? '';
          if (content) send({ content });
        }

        send({ done: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Suggestion generation failed';
        send({ error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
