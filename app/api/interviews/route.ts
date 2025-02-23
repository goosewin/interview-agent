import { createInterview, getProblem, getProblems, getUserInterviews } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { createId } from '@paralleldrive/cuid2';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createInterviewSchema = z.object({
  candidateId: z.string().min(1, 'Candidate is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    required_error: 'Difficulty is required',
  }),
  problemId: z.string().optional(),
});

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviews = await getUserInterviews(user.id);
    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createInterviewSchema.parse(body);

    // Combine date and time into a single datetime
    const scheduledFor = new Date(`${validatedData.date}T${validatedData.time}`);

    // Get all problems for the user
    const problems = await getProblems(user.id);
    if (problems.length === 0) {
      return NextResponse.json(
        { error: 'No problems found. Please create at least one problem first.' },
        { status: 400 }
      );
    }

    // If no problem is selected, get a random one of the specified difficulty
    let problemId = validatedData.problemId;
    let problemDescription = '';

    if (!problemId) {
      const matchingProblems = problems.filter((p) => p.difficulty === validatedData.difficulty);
      if (matchingProblems.length === 0) {
        return NextResponse.json(
          {
            error: `No problems found with difficulty: ${validatedData.difficulty}. Please create one first.`,
          },
          { status: 400 }
        );
      }

      // Select a random problem
      const randomIndex = Math.floor(Math.random() * matchingProblems.length);
      problemId = matchingProblems[randomIndex].id;
      problemDescription = matchingProblems[randomIndex].description;
    } else {
      const problem = await getProblem(problemId, user.id);
      if (!problem) {
        return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
      }
      problemDescription = problem.description;
    }

    const interview = await createInterview({
      userId: user.id,
      candidateId: validatedData.candidateId,
      problemId,
      identifier: createId(),
      scheduledFor,
      status: 'not_started',
      problemDescription,
      language: 'javascript', // Default language, can be changed later
      metadata: {
        difficulty: validatedData.difficulty,
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error('Failed to create interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
