import { getInterview, updateInterview } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateInterviewSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "cancelled"]).optional(),
  scheduledFor: z.string().optional(),
  problemDescription: z.string().optional(),
  language: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const interview = await getInterview(params.id);
    if (!interview) {
      return new NextResponse("Interview not found", { status: 404 });
    }

    if (interview.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Failed to fetch interview:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const interview = await getInterview(params.id);
    if (!interview) {
      return new NextResponse("Interview not found", { status: 404 });
    }

    if (interview.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateInterviewSchema.parse(body);

    // Create update data without scheduledFor
    const { scheduledFor, ...rest } = validatedData;

    // Add scheduledFor as Date if provided
    const data = scheduledFor
      ? { ...rest, scheduledFor: new Date(scheduledFor) }
      : rest;

    const updatedInterview = await updateInterview(params.id, data);
    return NextResponse.json(updatedInterview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error("Failed to update interview:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
