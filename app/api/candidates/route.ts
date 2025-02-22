import { createCandidate, getCandidates } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createCandidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  notes: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    const candidates = await getCandidates(user.id, includeArchived);
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = createCandidateSchema.parse(body);

    const candidate = await createCandidate({
      ...validatedData,
      userId: user.id,
    });

    return NextResponse.json(candidate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error('Failed to create candidate:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
