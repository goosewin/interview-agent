import posthog from 'posthog-js';

// Initialize PostHog
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false,
    persistence: 'localStorage',
    autocapture: true,
  });
}

// Helper to capture LLM events
export function captureLLMGeneration({
  input,
  output,
  model,
  provider = 'openai',
  startTime,
  error,
  metadata = {},
}: {
  input: string | { role: string; content: string }[];
  output?: string | { role: string; content: string }[];
  model: string;
  provider?: string;
  startTime: number;
  error?: Error | unknown;
  metadata?: Record<string, unknown>;
}) {
  const latency = Date.now() - startTime;
  const inputContent = Array.isArray(input) ? input[input.length - 1].content : input;

  posthog.capture('$ai_generation', {
    $ai_model: model,
    $ai_provider: provider,
    $ai_input: inputContent,
    $ai_output_choices: output,
    $ai_latency: latency / 1000, // Convert to seconds
    $ai_is_error: !!error,
    $ai_error: error instanceof Error ? error.message : String(error),
    ...metadata,
  });
}

export { posthog };
