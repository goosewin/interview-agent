'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
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
              <Input placeholder="Enter Interview ID" />
              <Button className="w-full">Join Interview</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
