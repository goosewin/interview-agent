import { createProblem, getProblems } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createProblemSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    required_error: 'Please select a difficulty level.',
  }),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const problems = await getProblems(user.id);
    return NextResponse.json(problems);
  } catch (error) {
    console.error('Failed to fetch problems:', error);
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
    const validatedData = createProblemSchema.parse(body);

    const problem = await createProblem({
      ...validatedData,
      userId: user.id,
    });

    return NextResponse.json(problem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error('Failed to create problem:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
