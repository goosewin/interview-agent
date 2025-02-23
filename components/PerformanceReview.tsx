import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

type PerformanceMetrics = {
  correctness: number;
  efficiency: number;
  overallScore: number;
};

type PerformanceReview = {
  id: string;
  metrics: PerformanceMetrics;
  feedback: string;
  createdAt: string;
};

export default function PerformanceReview({ interviewId }: { interviewId: string }) {
  const [review, setReview] = useState<PerformanceReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchReview = useCallback(async () => {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/review`);
      if (!response.ok) throw new Error('Failed to fetch review');
      const data = await response.json();
      setReview(data);
    } catch {
      setIsLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const generateReview = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/interviews/${interviewId}/complete`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to generate review');
      const data = await response.json();
      setReview(data);
    } catch {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No performance review available</p>
        <Button onClick={generateReview} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Review...
            </>
          ) : (
            'Generate Review'
          )}
        </Button>
      </div>
    );
  }

  const chartData = [
    { name: 'Correctness', value: review.metrics.correctness },
    { name: 'Efficiency', value: review.metrics.efficiency },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(review.metrics.overallScore)}`}>
                {review.metrics.overallScore}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Overall Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Solution Correctness</h3>
              <Badge
                variant={review.metrics.correctness >= 80 ? 'default' : 'destructive'}
                className="mb-2"
              >
                {review.metrics.correctness}%
              </Badge>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Code Efficiency</h3>
              <Badge
                variant={review.metrics.efficiency >= 80 ? 'default' : 'destructive'}
                className="mb-2"
              >
                {review.metrics.efficiency}%
              </Badge>
            </div>
            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted p-4">
              {review.feedback}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}