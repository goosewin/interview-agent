'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

type Candidate = {
  id: string;
  name: string;
  email: string;
};

type FormField = 'candidateId' | 'date' | 'time' | 'difficulty';

type ZodError = {
  path: FormField[];
  message: string;
};

const formSchema = z.object({
  candidateId: z.string({
    required_error: 'Please select a candidate.',
  }),
  date: z.string({
    required_error: 'Please select a date for the interview.',
  }),
  time: z.string({
    required_error: 'Please select a time for the interview.',
  }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    required_error: 'Please select a difficulty level.',
  }),
});

export default function NewInterview() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateId: '',
      date: '',
      time: '',
      difficulty: 'medium',
    },
  });

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const response = await fetch('/api/candidates');
        if (!response.ok) throw new Error('Failed to fetch candidates');
        const data = await response.json();
        setCandidates(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    }
    fetchCandidates();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          error.errors.forEach((err: ZodError) => {
            if (err.path[0] && typeof err.path[0] === 'string') {
              form.setError(err.path[0] as FormField, {
                message: err.message,
              });
            }
          });
          return;
        }
        throw new Error('Failed to create interview');
      }

      router.push('/interviews');
    } catch (error) {
      console.error('Error creating interview:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Schedule New Interview</h1>
        <Button variant="outline" onClick={() => router.push('/interviews')}>
          Back to Interviews
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="candidateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a candidate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the candidate for this interview.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Select the date for the interview.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormDescription>Select the time for the interview.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Problem Difficulty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the difficulty level for the interview problem.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Scheduling...' : 'Schedule Interview'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
