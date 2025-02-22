import { deleteProblem, getProblem, updateProblem } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateProblemSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }).optional(),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const problem = await getProblem(id, user.id);
    if (!problem) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (error) {
    console.error('Failed to fetch problem:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateProblemSchema.parse(body);

    const problem = await updateProblem(id, user.id, validatedData);
    if (!problem) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error('Failed to update problem:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const problem = await deleteProblem(id, user.id);
    if (!problem) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (error) {
    console.error('Failed to delete problem:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
