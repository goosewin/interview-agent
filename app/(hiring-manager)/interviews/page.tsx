'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Interview = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  scheduledFor: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
  };
};

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    try {
      const response = await fetch('/api/interviews');
      if (!response.ok) throw new Error('Failed to fetch interviews');
      const data = await response.json();
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  }

  async function cancelInterview(id: string) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/interviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!response.ok) throw new Error('Failed to cancel interview');
      await fetchInterviews();
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling interview:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Interviews</h1>
        <Button asChild>
          <Link href="/interviews/new">Schedule New Interview</Link>
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Candidate</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[150px]">Time</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((interview) => {
              const date = new Date(interview.scheduledFor);
              return (
                <TableRow key={interview.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${interview.candidateEmail}`}
                          alt={interview.candidateName}
                        />
                        <AvatarFallback>
                          {interview.candidateName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{interview.candidateName}</span>
                        <span className="text-sm text-muted-foreground">
                          {interview.candidateEmail}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{date.toLocaleDateString()}</TableCell>
                  <TableCell>{date.toLocaleTimeString()}</TableCell>
                  <TableCell className="capitalize">{interview.metadata.difficulty}</TableCell>
                  <TableCell className="capitalize">{interview.status}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/interviews/${interview.id}/reschedule`}>Reschedule</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setSelectedInterview(interview);
                            setIsCancelDialogOpen(true);
                          }}
                          disabled={interview.status === 'cancelled'}
                        >
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this interview? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedInterview && (
            <div className="py-4">
              <p>
                <strong>Candidate:</strong> {selectedInterview.candidateName}
              </p>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(selectedInterview.scheduledFor).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong>{' '}
                {new Date(selectedInterview.scheduledFor).toLocaleTimeString()}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Interview
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedInterview && cancelInterview(selectedInterview.id)}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelling...' : 'Cancel Interview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
