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
import { useState } from 'react';
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
  constraints: z.string().optional(),
});

export default function NewProblem() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'medium',
      sampleInput: '',
      sampleOutput: '',
      constraints: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          error.errors.forEach((err: { path: string[]; message: string }) => {
            if (err.path[0]) {
              form.setError(err.path[0] as keyof z.infer<typeof formSchema>, {
                message: err.message,
              });
            }
          });
          return;
        }
        throw new Error('Failed to create problem');
      }

      router.push('/problems');
    } catch (error) {
      console.error('Error creating problem:', error);
      setError(error instanceof Error ? error.message : 'Failed to create problem');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add New Problem</h1>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="# Problem Description&#10;&#10;Write your problem description in MDX format..."
                    className="min-h-[200px] font-mono"
                  />
                </FormControl>
                <FormDescription>
                  Write the problem description using MDX format. You can use markdown and custom
                  components.
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
                  <Textarea {...field} className="font-mono" />
                </FormControl>
                <FormDescription>Provide example input for the problem.</FormDescription>
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
                  <Textarea {...field} className="font-mono" />
                </FormControl>
                <FormDescription>Provide example output for the problem.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="constraints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Constraints</FormLabel>
                <FormControl>
                  <Textarea {...field} className="font-mono" />
                </FormControl>
                <FormDescription>
                  List any constraints or limitations for the problem.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Problem'}
          </Button>
        </form>
      </Form>
      <div className="mt-8 rounded-lg border border-muted p-4">
        <h2 className="text-lg font-semibold">Important Note</h2>
        <p className="mt-2 text-muted-foreground">
          Problem content should be added as an MDX file in the <code>problems</code> directory with
          the same name as the slug. For example, if the slug is &quot;two-sum&quot;, create a file
          named <code>two-sum.mdx</code>.
        </p>
      </div>
    </div>
  );
}
