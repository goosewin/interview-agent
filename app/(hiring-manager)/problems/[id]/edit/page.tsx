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
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    required_error: 'Please select a difficulty level.',
  }),
  sampleInput: z.string().optional(),
  sampleOutput: z.string().optional(),
});

type Problem = z.infer<typeof formSchema>;

export default function EditProblem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);

  const form = useForm<Problem>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'medium',
      sampleInput: '',
      sampleOutput: '',
    },
  });

  useEffect(() => {
    async function fetchProblem() {
      try {
        setIsLoadingProblem(true);
        const response = await fetch(`/api/problems/${id}`);
        if (!response.ok) throw new Error('Failed to fetch problem');
        const data = await response.json();
        form.reset(data);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch problem');
      } finally {
        setIsLoadingProblem(false);
      }
    }
    fetchProblem();
  }, [id, form]);

  async function onSubmit(values: Problem) {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/problems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          error.errors.forEach((err: { path: string[]; message: string }) => {
            if (err.path[0]) {
              form.setError(err.path[0] as keyof Problem, {
                message: err.message,
              });
            }
          });
          return;
        }
        throw new Error('Failed to update problem');
      }

      router.push('/problems');
    } catch (error) {
      console.error('Error updating problem:', error);
      setError(error instanceof Error ? error.message : 'Failed to update problem');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingProblem) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p>Loading problem details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Problem</h1>
        <Button variant="outline" onClick={() => router.push('/problems')}>
          Back to Problems
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the title of the problem.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Markdown)</FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[200px]" />
                </FormControl>
                <FormDescription>
                  Enter the description of the problem using markdown.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
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
                <FormDescription>Select the difficulty level of the problem.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sampleInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sample Input</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>Enter a sample input for the problem.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sampleOutput"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sample Output</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>Enter the corresponding sample output.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Problem'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
