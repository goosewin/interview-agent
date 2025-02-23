'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

type ChartData = {
  criteria: string;
  score: number;
}[];

interface EvaluationChartsProps {
  technicalData: ChartData;
  communicationData: ChartData;
  technicalReasoning: string;
  communicationReasoning: string;
  technicalWeaknesses: string[];
  communicationWeaknesses: string[];
}

export function EvaluationCharts({
  technicalData,
  communicationData,
  technicalReasoning,
  communicationReasoning,
  technicalWeaknesses,
  communicationWeaknesses,
}: EvaluationChartsProps) {
  // Transform data for bar chart
  const chartData = [
    {
      category: 'Technical',
      score: Math.max(1, technicalData[0].score),
    },
    {
      category: 'Communication',
      score: Math.max(1, communicationData[0].score),
    },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
          <CardDescription>Assessment of technical and communication abilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="category" />
                <YAxis domain={[0, 10]} />
                <Bar
                  dataKey="score"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Technical Skills</CardTitle>
            <CardDescription>
              Assessment of technical capabilities and problem-solving skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold">Technical Feedback</h3>
              <p className="mt-2 text-muted-foreground">{technicalReasoning}</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Areas for Improvement</h4>
              <ul className="mt-2 list-inside list-disc">
                {technicalWeaknesses.map((weakness, i) => (
                  <li key={i} className="text-muted-foreground">{weakness}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Skills</CardTitle>
            <CardDescription>
              Assessment of communication effectiveness and professional conduct
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold">Communication Feedback</h3>
              <p className="mt-2 text-muted-foreground">{communicationReasoning}</p>
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Areas for Improvement</h4>
              <ul className="mt-2 list-inside list-disc">
                {communicationWeaknesses.map((weakness, i) => (
                  <li key={i} className="text-muted-foreground">{weakness}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
