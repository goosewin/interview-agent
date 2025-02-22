import { createInterview, getUserInterviews } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createInterviewSchema = z.object({
  candidateId: z.string().min(1, "Candidate is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "Difficulty is required",
  }),
});

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const interviews = await getUserInterviews(user.id);
    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = createInterviewSchema.parse(body);

    // Combine date and time into a single datetime
    const scheduledFor = new Date(`${validatedData.date}T${validatedData.time}`);

    const interview = await createInterview({
      userId: user.id,
      candidateId: validatedData.candidateId,
      scheduledFor,
      status: "not_started",
      problemDescription: "To be assigned", // Will be set when interview starts
      language: "javascript", // Default language, can be changed later
      metadata: {
        difficulty: validatedData.difficulty,
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error("Failed to create interview:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
