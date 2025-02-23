import { getInterviewByIdentifier } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const interview = await getInterviewByIdentifier(identifier);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error joining interview:', error);
    return NextResponse.json(
      { error: 'Failed to join interview' },
      { status: 500 }
    );
  }
} 
