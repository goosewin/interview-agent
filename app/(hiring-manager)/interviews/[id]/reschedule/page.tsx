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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

type Interview = {
  id: string;
  identifier: string; 
  candidateId: string;
  scheduledFor: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
  };
};

type FormField = 'date' | 'time' | 'difficulty';

type ZodError = {
  path: string[];
  message: string;
};

const formSchema = z.object({
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

export default function RescheduleInterview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
      difficulty: 'medium',
    },
  });

  useEffect(() => {
    async function fetchInterview() {
      try {
        setIsLoadingInterview(true);
        const response = await fetch(`/api/interviews/${id}`);
        if (!response.ok) throw new Error('Failed to fetch interview');
        const data = await response.json();
        setInterview(data);

        // Set form defaults
        const date = new Date(data.scheduledFor);
        form.reset({
          date: date.toISOString().split('T')[0],
          time: date.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
          difficulty: data.metadata?.difficulty || 'medium',
        });
      } catch (error) {
        console.error('Error fetching interview:', error);
      } finally {
        setIsLoadingInterview(false);
      }
    }
    fetchInterview();
  }, [id, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!interview) {
      console.error('Interview data not loaded');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/interviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledFor: `${values.date}T${values.time}`,
          metadata: {
            ...(interview?.metadata || {}),
            difficulty: values.difficulty,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          error.errors.forEach((err: ZodError) => {
            if (err.path[0] && typeof err.path[0] === 'string') {
              const field = err.path[0] as FormField;
              if (field === 'date' || field === 'time' || field === 'difficulty') {
                form.setError(field, {
                  message: err.message,
                });
              }
            }
          });
          return;
        }
        throw new Error('Failed to reschedule interview');
      }

      // Send email notification after successful reschedule
      if (!interview || !interview.candidateId || !interview.identifier) {
        console.error('Missing interview data for email notification');
        return;
      }

      const emailPayload = {
        identifier: interview.identifier,  // Use the short identifier instead of UUID
        candidateId: interview.candidateId,
        scheduledFor: `${values.date}T${values.time}`,
      };

      const emailResponse = await fetch('/api/send-interview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Failed to send interview email:', {
          status: emailResponse.status,
          statusText: emailResponse.statusText,
          error: errorData,
          requestPayload: emailPayload
        });
      } else {
        console.log('Email sent successfully');
      }

      router.push('/interviews');
    } catch (error) {
      console.error('Error rescheduling interview:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingInterview) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p>Loading interview details...</p>
      </div>
    );
  }

  if (!isLoadingInterview && !interview) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p>Interview not found.</p>
        <Button asChild>
          <Link href="/interviews">Back to Interviews</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reschedule Interview</h1>
        <Button variant="outline" onClick={() => router.push('/interviews')}>
          Back to Interviews
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Select the new date for the interview.</FormDescription>
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
                <FormDescription>Select the new time for the interview.</FormDescription>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Rescheduling...' : 'Reschedule Interview'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
