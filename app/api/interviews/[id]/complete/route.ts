import { NextRequest } from 'next/server';
import { db } from '@/db';
import { interviews, performanceReviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { aiClient } from '@/lib/ai';
import { generateText } from 'ai';

type Message = {
  role: string;
  content: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const id = params.id;
    const { code, language, messages, problemDescription } = await request.json();

    // Save final state first
    await db.update(interviews)
      .set({
        code,
        language,
        status: 'completed',
        messages,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, id));

    // Generate evaluation
    const prompt = `You are a technical interviewer evaluating a candidate's solution. Provide your evaluation in JSON format with metrics (correctness 0-100, efficiency 0-100, overallScore 0-100) and detailed feedback.

Problem:
${problemDescription}

Solution (${language}):
${code}

Interview Discussion:
${messages.map((m: Message) => `${m.role}: ${m.content}`).join('\n')}`;

    const { text } = await generateText({
      model: aiClient,
      prompt
    });

    let evaluation;
    try {
      evaluation = JSON.parse(text);
      
      // Validate the evaluation structure
      if (!evaluation.metrics?.correctness || !evaluation.metrics?.efficiency || !evaluation.metrics?.overallScore || !evaluation.feedback) {
        throw new Error('Invalid evaluation format');
      }
    } catch {
      console.error('Failed to parse AI response:', text);
      return Response.json({ error: 'Failed to parse evaluation' }, { status: 500 });
    }

    // Save evaluation
    const [review] = await db
      .insert(performanceReviews)
      .values({
        interviewId: id,
        metrics: evaluation.metrics,
        feedback: evaluation.feedback,
      })
      .returning();

    return Response.json(review);
  } catch {
    console.error('Failed to complete interview');
    return Response.json({ error: 'Failed to complete interview' }, { status: 500 });
  }
}
