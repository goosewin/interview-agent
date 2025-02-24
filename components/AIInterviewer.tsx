'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type AIInterviewerProps = {
  audioUrl?: string;
  className?: string;
};

export default function AIInterviewer({ className }: AIInterviewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);

  // Initialize and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = 400;
    canvas.height = 400;
    let frame = 0;

    const drawFrame = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw head
      ctx.beginPath();
      ctx.arc(200, 200, 100, 0, Math.PI * 2);
      ctx.fillStyle = '#2a2a2a';
      ctx.fill();

      // Draw eyes
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(160, 170, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(240, 170, 10, 0, Math.PI * 2);
      ctx.fill();

      // Animate mouth
      const mouthY = 220 + Math.sin(frame / 30) * 5;
      ctx.beginPath();
      ctx.moveTo(160, mouthY);
      ctx.quadraticCurveTo(200, mouthY + 5, 240, mouthY);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 4;
      ctx.stroke();
      frame++;
      (animationRef as { current: number }).current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      if (animationRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Card className={cn('p-4', className)}>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm">AI Interviewer</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
