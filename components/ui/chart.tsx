'use client';

import { CSSProperties, HTMLAttributes, ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig;
  children: ReactElement;
}

export function ChartContainer({ children, className, ...props }: ChartContainerProps) {
  return (
    <div
      className={className}
      style={
        {
          '--chart-1': 'var(--primary)',
        } as CSSProperties
      }
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

interface ChartTooltipData {
  value: number;
  stroke?: string;
  fill?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipData[];
  label?: string;
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--color-desktop)' }}
          />
          <span className="text-[0.70rem] tabular-nums">{payload[0]?.value}</span>
        </div>
      </div>
    </div>
  );
}

export function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="flex flex-col">
        <span className="text-[0.70rem] font-medium">{label}</span>
        <span className="text-[0.85rem] font-bold">{payload[0]?.value}</span>
      </div>
    </div>
  );
}
