import { db } from '@/db';
import { interviews } from '@/db/schema';
import { getInterview, updateInterview } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateInterviewSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled', 'abandoned']).optional(),
  scheduledFor: z.string().optional(),
  problemDescription: z.string().optional(),
  language: z.string().optional(),
  code: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  lastActiveAt: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const isJoin = url.searchParams.get('join') === 'true';

    // Use db.query to get all relations
    const interview = await db.query.interviews.findFirst({
      where: isJoin ? eq(interviews.identifier, id) : eq(interviews.id, id),
      with: {
        candidate: true,
        evaluations: true,
      },
    });

    if (!interview) {
      return new Response('Interview not found', { status: 404 });
    }

    // Transform the data to match the expected format
    const evaluation = interview.evaluations[0];
    const transformedInterview = {
      ...interview,
      candidateName: interview.candidate.name,
      candidateEmail: interview.candidate.email,
      evaluation: evaluation ? {
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        overallScore: evaluation.overallScore,
        recommendation: evaluation.recommendation,
        reasoning: evaluation.reasoning,
        technicalStrengths: evaluation.technicalStrengths,
        technicalWeaknesses: evaluation.technicalWeaknesses,
        communicationStrengths: evaluation.communicationStrengths,
        communicationWeaknesses: evaluation.communicationWeaknesses,
        nextSteps: evaluation.nextSteps,
      } : undefined,
    };

    return Response.json(transformedInterview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get interview by either UUID or identifier
    const interview = await getInterview(id);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateInterviewSchema.parse(body);

    // Create update data with proper date handling
    const data: Record<string, unknown> = { ...validatedData };
    if (validatedData.scheduledFor) {
      data.scheduledFor = new Date(validatedData.scheduledFor);
    }
    if (validatedData.lastActiveAt) {
      data.lastActiveAt = new Date(validatedData.lastActiveAt);
    }

    // Use the UUID for the update
    const updatedInterview = await updateInterview(interview.id, data);
    return NextResponse.json(updatedInterview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error('Failed to update interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
