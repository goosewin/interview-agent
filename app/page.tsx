'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SignedIn } from '@clerk/nextjs';
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to join interview');
      }

      const interview = await response.json();
      router.push(`/interview/${interview.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join interview');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl p-4 space-y-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">AI Technical Interviewer</h1>
          <SignedIn>
            <Button asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </SignedIn>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Join Interview</CardTitle>
              <CardDescription>Enter your interview code to join.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinInterview} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter interview code"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Joining...' : 'Join Interview'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Try Demo</CardTitle>
              <CardDescription>Experience an AI-powered technical interview.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <a href="/demo">Start Demo Interview</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
