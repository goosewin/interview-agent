import { fal } from '@fal-ai/client';

// Configure fal.ai client with API key
if (process.env.NEXT_PUBLIC_FAL_KEY) {
  fal.config({
    credentials: process.env.NEXT_PUBLIC_FAL_KEY,
  });
} else {
  console.warn('FAL_KEY not found in environment variables');
}

export { fal };
