import { aiClient } from '@/lib/ai';
import { captureLLMGeneration } from '@/lib/posthog';
import { generateText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const startTime = Date.now();
  const lastMessage = messages[messages.length - 1];

  try {
    const { text } = await generateText({
      model: aiClient,
      prompt: lastMessage.content,
    });

    // Track LLM request in PostHog
    captureLLMGeneration({
      input: messages,
      output: text,
      model: 'gpt-3.5-turbo-instruct',
      startTime,
      metadata: {
        type: 'chat_completion',
        messageCount: messages.length,
      },
    });

    return new Response(text);
  } catch (error) {
    console.error('Error in chat API:', error);

    // Track error in PostHog
    captureLLMGeneration({
      input: messages,
      model: 'gpt-3.5-turbo-instruct',
      startTime,
      error,
      metadata: {
        type: 'chat_completion',
        messageCount: messages.length,
      },
    });

    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
    });
  }
}
