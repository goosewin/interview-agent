import { getInterviewByIdentifier } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    if (!identifier) {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const interview = await getInterviewByIdentifier(identifier);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
