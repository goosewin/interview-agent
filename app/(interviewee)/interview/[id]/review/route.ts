import { NextRequest } from 'next/server';
import { db } from '@/db';
import { performanceReviews } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const [review] = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.interviewId, params.id));

    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    return Response.json(review);
  } catch {
    console.error('Failed to fetch review');
    return Response.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}