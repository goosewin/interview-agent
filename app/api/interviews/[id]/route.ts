import { getInterview, getInterviewByIdentifier, updateInterview } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
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
    // Use getInterviewByIdentifier for short identifiers (non-UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const interview = isUUID ? await getInterview(id) : await getInterviewByIdentifier(id);

    if (!interview) {
      return new Response('Interview not found', { status: 404 });
    }

    return Response.json(interview);
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

    // Use getInterviewByIdentifier for short identifiers (non-UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const interview = isUUID ? await getInterview(id) : await getInterviewByIdentifier(id);
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
