import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const interview = await db.select().from(interviews).where(eq(interviews.id, id)).limit(1);

    if (!interview.length) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview[0]);
  } catch (error) {
    console.error('Failed to fetch interview:', error);
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedInterview = await db
      .update(interviews)
      .set(body)
      .where(eq(interviews.id, id))
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
