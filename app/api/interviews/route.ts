import { db } from '@/db';
import { interviews } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = await db
      .select()
      .from(interviews)
      .orderBy(desc(interviews.createdAt))
      .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await db.insert(interviews).values(body).returning();
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to create interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
} 
