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

type Problem = {
  id: string;
  title: string;
  difficulty: string;
};

type FormField = 'candidateId' | 'date' | 'time' | 'difficulty' | 'problemId';

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
  problemId: z.string({
    required_error: 'Please select a problem.',
  }),
});

const RANDOM_PROBLEM = 'random';

export default function NewInterview() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateId: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
      difficulty: 'medium',
      problemId: '',
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingCandidates(true);
        setIsLoadingProblems(true);

        const [candidatesRes, problemsRes] = await Promise.all([
          fetch('/api/candidates'),
          fetch('/api/problems'),
        ]);

        if (!candidatesRes.ok) throw new Error('Failed to fetch candidates');
        if (!problemsRes.ok) throw new Error('Failed to fetch problems');

        const candidatesData = await candidatesRes.json();
        const problemsData = await problemsRes.json();

        setCandidates(candidatesData);
        setProblems(problemsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingCandidates(false);
        setIsLoadingProblems(false);
      }
    }
    fetchData();
  }, []);

  // Filter problems based on selected difficulty
  const filteredProblems = problems.filter(
    (problem) => problem.difficulty === form.watch('difficulty')
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          problemId: values.problemId === RANDOM_PROBLEM ? undefined : values.problemId,
        }),
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

      const interview = await response.json();

      // Send email notification
      const emailResponse = await fetch('/api/send-interview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interview.id,
          identifier: interview.identifier,
          candidateId: values.candidateId,
          scheduledFor: `${values.date}T${values.time}`,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Failed to send interview email:', errorData);
      }

      router.push('/interviews');
    } catch (error) {
      console.error('Error creating interview:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingCandidates || isLoadingProblems) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoadingCandidates && candidates.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p>No candidates found. Add some candidates first.</p>
        <Button asChild>
          <a href="/candidates/new">Add New Candidate</a>
        </Button>
      </div>
    );
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                  <Input type="date" {...field} value={field.value || ''} />
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
                  <Input type="time" {...field} value={field.value || ''} />
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
                <Select onValueChange={field.onChange} value={field.value}>
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
          <FormField
            control={form.control}
            name="problemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Problem</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || RANDOM_PROBLEM}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a problem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={RANDOM_PROBLEM}>
                      Random problem of selected difficulty
                    </SelectItem>
                    {filteredProblems.map((problem) => (
                      <SelectItem key={problem.id} value={problem.id}>
                        {problem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a specific problem or choose random to automatically assign one of the
                  selected difficulty.
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
