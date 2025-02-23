import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, params.id))
      .limit(1);

    if (!interview.length) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview[0]);
  } catch (error) {
    console.error('Failed to fetch interview:', error);
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedInterview = await db
      .update(interviews)
      .set(body)
      .where(eq(interviews.id, params.id))
      .returning();

    if (!updatedInterview.length) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(updatedInterview[0]);
  } catch (error) {
    console.error('Failed to update interview:', error);
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
  }
}
