'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

type Interview = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  scheduledFor: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  recordingUrl: string | null;
  recordingStartedAt: string | null;
  recordingEndedAt: string | null;
  duration: string | null;
};

export default function InterviewDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInterview() {
      try {
        const response = await fetch(`/api/interviews/${id}`);
        if (!response.ok) throw new Error('Failed to fetch interview');
        const data = await response.json();
        setInterview(data);
      } catch (error) {
        console.error('Error fetching interview:', error);
        setError('Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInterview();
  }, [id]);

  function formatDuration(seconds: string | null): string {
    if (!seconds) return 'N/A';
    const mins = Math.floor(parseInt(seconds) / 60);
    const secs = parseInt(seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p>Loading interview details...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Interview not found'}</p>
        <Button onClick={() => router.push('/interviews')}>Back to Interviews</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Interview Details</h1>
        <Button variant="outline" onClick={() => router.push('/interviews')}>
          Back to Interviews
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {interview.candidateName?.[0] ?? interview.candidateEmail?.[0] ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{interview.candidateName}</h2>
              <p className="text-muted-foreground">{interview.candidateEmail}</p>
            </div>
          </div>
          <div className="grid gap-2">
            <div>
              <strong>Scheduled for:</strong> {formatDate(interview.scheduledFor)}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                {interview.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {interview.recordingUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Recording</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div>
                <strong>Started:</strong>{' '}
                {interview.recordingStartedAt ? formatDate(interview.recordingStartedAt) : 'N/A'}
              </div>
              <div>
                <strong>Ended:</strong>{' '}
                {interview.recordingEndedAt ? formatDate(interview.recordingEndedAt) : 'N/A'}
              </div>
              <div>
                <strong>Duration:</strong> {formatDuration(interview.duration)}
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <video
                controls
                className="w-full"
                src={interview.recordingUrl}
                poster="/video-thumbnail.png"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
