'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
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
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Interview = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  scheduledFor: string;
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
  };
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  identifier: string;
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const response = await fetch('/api/interviews');
        const data = await response.json();
        setInterviews(data);
      } catch (error) {
        console.error('Error fetching interviews:', error);
      }
    }
    fetchInterviews();
  }, []);

  async function cancelInterview(id: string) {
    setIsLoadingCancel(true);
    try {
      const response = await fetch(`/api/interviews/${id}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel interview');
      const updatedInterviews = interviews.map((interview) =>
        interview.id === id ? { ...interview, status: 'cancelled' as const } : interview
      );
      setInterviews(updatedInterviews);
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling interview:', error);
    } finally {
      setIsLoadingCancel(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'destructive' {
    switch (status) {
      case 'not_started':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'destructive';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  }

  async function handleCancelInterview() {
    setIsLoadingCancel(true);
    try {
      await cancelInterview(selectedInterview!.id);
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling interview:', error);
    } finally {
      setIsLoadingCancel(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <Button asChild>
          <Link href="/interviews/new">New Interview</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Candidate</TableHead>
            <TableHead>Interview ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interviews.map((interview) => (
            <TableRow key={interview.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback>
                      {interview.candidateName?.[0] ?? interview.candidateEmail?.[0] ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{interview.candidateName}</div>
                    <div className="text-sm text-muted-foreground">{interview.candidateEmail}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1">{interview.identifier}</code>
              </TableCell>
              <TableCell>{formatDate(interview.scheduledFor)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(interview.status)}>
                  {interview.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/interviews/${interview.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/interviews/${interview.id}/reschedule`}>Reschedule</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedInterview(interview);
                        setShowCancelDialog(true);
                      }}
                    >
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the interview with {selectedInterview?.candidateName} on{' '}
              {selectedInterview && formatDate(selectedInterview.scheduledFor)}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, keep it
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInterview}
              disabled={isLoadingCancel}
            >
              {isLoadingCancel ? 'Cancelling...' : 'Yes, cancel it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
