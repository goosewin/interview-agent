'use client';

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

type Problem = {
  id: string;
  title: string;
  difficulty: string;
  createdAt: string;
};

export default function Problems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  async function fetchProblems() {
    try {
      const response = await fetch('/api/problems');
      if (!response.ok) throw new Error('Failed to fetch problems');
      const data = await response.json();
      setProblems(data);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  }

  async function deleteProblem(id: string) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/problems/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete problem');
      await fetchProblems();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting problem:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Problems</h1>
        <Button asChild>
          <Link href="/problems/new">Add New Problem</Link>
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead className="w-[150px]">Difficulty</TableHead>
              <TableHead className="w-[200px]">Created At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell>{problem.title}</TableCell>
                <TableCell className="capitalize">{problem.difficulty}</TableCell>
                <TableCell>{new Date(problem.createdAt).toLocaleDateString()}</TableCell>
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
                        <Link href={`/problems/${problem.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSelectedProblem(problem);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Problem</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this problem? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedProblem && (
            <div className="py-4">
              <p>
                <strong>Title:</strong> {selectedProblem.title}
              </p>
              <p>
                <strong>Difficulty:</strong> {selectedProblem.difficulty}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedProblem && deleteProblem(selectedProblem.id)}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Problem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
