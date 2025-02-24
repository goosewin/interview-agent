'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'recharts';

const technicalData = [
  { criteria: 'Code Quality', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Problem Solving', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Technical Accuracy', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Edge Cases', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Time/Space', score: Math.floor(Math.random() * 5) + 1 },
];

const communicationData = [
  { criteria: 'Clarity', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Requirements', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Questions', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Explanation', score: Math.floor(Math.random() * 5) + 1 },
  { criteria: 'Conduct', score: Math.floor(Math.random() * 5) + 1 },
];

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function ReviewPage() {
  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Performance Review</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Technical Skills</CardTitle>
            <CardDescription>
              Assessment of technical capabilities and problem-solving skills
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[450px]">
              <RadarChart
                data={technicalData}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                outerRadius="70%"
              >
                <Tooltip content={<ChartTooltipContent />} />
                <PolarAngleAxis
                  dataKey="criteria"
                  tick={{
                    fontSize: 14,
                    fill: 'hsl(var(--foreground))',
                  }}
                  tickSize={20}
                />
                <PolarGrid />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Communication Skills</CardTitle>
            <CardDescription>
              Assessment of communication effectiveness and professional conduct
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[450px]">
              <RadarChart
                data={communicationData}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                outerRadius="70%"
              >
                <Tooltip content={<ChartTooltipContent />} />
                <PolarAngleAxis
                  dataKey="criteria"
                  tick={{
                    fontSize: 14,
                    fill: 'hsl(var(--foreground))',
                  }}
                  tickSize={20}
                />
                <PolarGrid />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
