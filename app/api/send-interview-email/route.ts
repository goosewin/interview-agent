import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCandidate } from '@/lib/db';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { identifier, candidateId, scheduledFor } = await request.json();
    console.log('Request payload:', { identifier, candidateId, scheduledFor });

    if (!identifier || !candidateId || !scheduledFor) {
      console.error('Missing required fields:', { identifier, candidateId, scheduledFor });
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: {
            identifier: !identifier ? 'Interview identifier is required' : null,
            candidateId: !candidateId ? 'Candidate ID is required' : null,
            scheduledFor: !scheduledFor ? 'Schedule time is required' : null,
          }
        },
        { status: 400 }
      );
    }

    const candidate = await getCandidate(candidateId, userId);
    if (!candidate) {
      console.error('Candidate not found:', { candidateId, userId });
      return NextResponse.json(
        { 
          error: 'Candidate not found',
          details: { candidateId }
        },
        { status: 404 }
      );
    }

    if (!candidate.email) {
      console.error('Candidate email not found:', { candidateId, name: candidate.name });
      return NextResponse.json(
        { 
          error: 'Candidate email not found',
          details: { candidateId, name: candidate.name }
        },
        { status: 400 }
      );
    }

    const formattedDate = new Date(scheduledFor).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    console.log('Attempting to send email:', {
      from: 'onboarding@resend.dev',
      to: candidate.email,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 5),
    });

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: candidate.email,
      subject: 'Your Technical Interview Has Been Scheduled',
      html: `
        <p>Dear ${candidate.name},</p>
        <p>We are pleased to inform you that your technical interview has been scheduled for:</p>
        <p><strong>${formattedDate}</strong></p>
        <p>Your interview ID is: <strong>${identifier}</strong></p>
        <p>Please join the interview at the scheduled time using this link:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/interview/${identifier}">Join Interview</a></p>
        <p>Important reminders:</p>
        <ul>
          <li>Test your camera and microphone before the interview</li>
          <li>Ensure you have a stable internet connection</li>
          <li>Find a quiet place for the interview</li>
          <li>Have a backup device ready just in case</li>
        </ul>
        <p>Good luck!</p>
      `,
    });

    console.log('Resend API response:', result);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    // Log the full error details
    console.error('Failed to send interview email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to send interview email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
