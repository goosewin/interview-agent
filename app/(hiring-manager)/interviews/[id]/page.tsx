'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Editor } from '@monaco-editor/react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

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
  code: string | null;
  language: string;
  problemDescription: string;
  messages: Array<{
    role: string;
    message: string;
    time_in_call_secs: number;
  }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatDuration(duration: string | null) {
  if (!duration) return 'N/A';
  const minutes = Math.floor(parseInt(duration) / 60);
  const seconds = parseInt(duration) % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function InterviewDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch interview details
        const interviewResponse = await fetch(`/api/interviews/${id}`);
        if (!interviewResponse.ok) throw new Error('Failed to fetch interview');
        const interviewData = await interviewResponse.json();
        setInterview(interviewData);

        // Fetch messages from interview transcript
        if (interviewData.messages?.length > 0) {
          const formattedMessages = interviewData.messages.map(
            (msg: { role: string; message: string; time_in_call_secs: number }) => ({
              role: msg.role === 'agent' ? 'assistant' : 'user',
              content: msg.message,
              timestamp: new Date(msg.time_in_call_secs * 1000).toISOString(),
            })
          );
          setMessages(formattedMessages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (error || !interview) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Interview not found'}</p>
        <Button onClick={() => router.push('/interviews')}>Back to Interviews</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/interviews')} className="mr-4">
            ← Back
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback>{interview.candidateName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{interview.candidateName}</h1>
            <p className="text-muted-foreground">{interview.candidateEmail}</p>
          </div>
        </div>
        <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
          {interview.status}
        </Badge>
      </div>

      {/* Interview Details */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <strong>Scheduled For:</strong>
            <p>{formatDate(interview.scheduledFor)}</p>
          </div>
          <div>
            <strong>Duration:</strong>
            <p>{formatDuration(interview.duration)}</p>
          </div>
          <div>
            <strong>Status:</strong>
            <p className="capitalize">{interview.status.replace('_', ' ')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="recording" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="code">Code Solution</TabsTrigger>
        </TabsList>

        <TabsContent value="recording" className="space-y-4">
          {interview.recordingUrl ? (
            <Card>
              <CardContent className="pt-6">
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
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <div>
                    <strong>Started:</strong>{' '}
                    {interview.recordingStartedAt
                      ? formatDate(interview.recordingStartedAt)
                      : 'N/A'}
                  </div>
                  <div>
                    <strong>Ended:</strong>{' '}
                    {interview.recordingEndedAt ? formatDate(interview.recordingEndedAt) : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recording available for this interview
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transcript" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[600px] pr-4">
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <div className="mb-1 text-xs opacity-70">
                            {message.role === 'user' ? 'Candidate' : 'AI Interviewer'}
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className="mt-1 text-right text-xs opacity-70">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No transcript available for this interview
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Problem Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert">{interview.problemDescription}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Solution</CardTitle>
            </CardHeader>
            <CardContent>
              {interview.code ? (
                <div className="rounded-lg border">
                  <Editor
                    height="400px"
                    defaultLanguage={interview.language}
                    defaultValue={interview.code}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                    }}
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No code solution available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
