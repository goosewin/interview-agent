import { deleteCandidate, getCandidate, updateCandidate } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateCandidateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const candidate = await getCandidate(id, user.id);
    if (!candidate) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Failed to fetch candidate:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateCandidateSchema.parse(body);

    const candidate = await updateCandidate(id, user.id, validatedData);
    if (!candidate) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    console.error("Failed to update candidate:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const candidate = await deleteCandidate(id, user.id);
    if (!candidate) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Failed to delete candidate:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
