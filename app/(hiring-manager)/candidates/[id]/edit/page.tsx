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
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type Candidate = z.infer<typeof formSchema>;

export default function EditCandidate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<Candidate>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
    },
  });

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const response = await fetch(`/api/candidates/${id}`);
        if (!response.ok) throw new Error('Failed to fetch candidate');
        const data = await response.json();
        form.reset(data);
      } catch (error) {
        console.error('Error fetching candidate:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch candidate');
      }
    }
    fetchCandidate();
  }, [id, form]);

  async function onSubmit(values: Candidate) {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update candidate');
      }

      router.push('/candidates');
    } catch (error) {
      console.error('Error updating candidate:', error);
      setError(error instanceof Error ? error.message : 'Failed to update candidate');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Candidate</h1>
        <Button variant="outline" onClick={() => router.push('/candidates')}>
          Back to Candidates
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the candidate&apos;s full name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormDescription>Enter the candidate&apos;s email address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormDescription>Enter the candidate&apos;s phone number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>Add any relevant notes about the candidate.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Candidate'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
