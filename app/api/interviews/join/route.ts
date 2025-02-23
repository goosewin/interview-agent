import { getInterviewByIdentifier, getProblem } from '@/lib/db';
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

    // If we don't have a problem description, try to fetch it from the problems table
    if (!interview.problemDescription && interview.metadata?.problemId) {
      const problem = await getProblem(interview.metadata.problemId, interview.userId);
      if (!problem) {
        return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...interview,
        problemDescription: problem.description,
      });
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
