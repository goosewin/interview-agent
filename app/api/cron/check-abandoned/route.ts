import { db } from '@/db';
import { interviews } from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// This route should be called by a cron job every minute
export async function GET() {
  try {
    // Find interviews that haven't been active for 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Update interviews that are in progress and haven't been active
    await db
      .update(interviews)
      .set({
        status: 'abandoned',
        updatedAt: new Date(),
      })
      .where(
        and(eq(interviews.status, 'in_progress'), lt(interviews.lastActiveAt, fiveMinutesAgo))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to check for abandoned interviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
