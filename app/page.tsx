'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleJoinInterview(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/interviews/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join interview');
      }

      const interview = await response.json();
      router.push(`/interview/${interview.id}/preflight`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join interview');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl space-y-4 p-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">AI Technical Interviewer</h1>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>For Hiring Managers</CardTitle>
              <CardDescription>
                Looking to manage jobs and interviews? Log in to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignedIn>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </SignedIn>
              <SignedOut>
                <Button asChild className="w-full">
                  <Link href="/sign-in">Login to Hiring Portal</Link>
                </Button>
              </SignedOut>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Interviewees</CardTitle>
              <CardDescription>
                Taking an interview? Enter your interview ID to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleJoinInterview} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter interview ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Joining...' : 'Join Interview'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
