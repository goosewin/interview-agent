import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { captureLLMGeneration } from './posthog';

export const aiClient = openai('gpt-4o-2024-11-20');

export async function generate(prompt: string) {
  const startTime = Date.now();
  try {
    const { text } = await generateText({
      model: aiClient,
      prompt: prompt,
    });

    captureLLMGeneration({
      input: prompt,
      output: text,
      model: 'gpt-4o-2024-11-20',
      startTime,
      metadata: {
        type: 'text_generation',
      },
    });

    return text;
  } catch (error) {
    captureLLMGeneration({
      input: prompt,
      model: 'gpt-4o-2024-11-20',
      startTime,
      error,
      metadata: {
        type: 'text_generation',
      },
    });
    throw error;
  }
}
