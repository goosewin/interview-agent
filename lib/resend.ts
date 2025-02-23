import { Resend } from 'resend';

console.log('🔑 Initializing Resend with API key exists:', !!process.env.RESEND_API_KEY);
export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInterviewEmail({
  to,
  candidateName,
  interviewDate,
  interviewId,
}: {
  to: string;
  candidateName: string;
  interviewDate: Date;
  interviewId: string;
}) {
  console.log('🚀 Starting sendInterviewEmail with:', {
    to,
    candidateName,
    interviewDate,
    interviewId,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  });

  try {
    const formattedDate = interviewDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    console.log('📧 Sending email via Resend...');
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: 'Your Technical Interview Has Been Scheduled',
      html: `
        <h1>Hello ${candidateName}!</h1>
        <p>Your technical interview has been scheduled for:</p>
        <p><strong>${formattedDate}</strong></p>
        <p>Your interview ID is: <strong>${interviewId}</strong></p>
        <p>Please join the interview at the scheduled time using this link:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/interview/${interviewId}">Join Interview</a></p>
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
    console.log('✅ Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
}