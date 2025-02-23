'use client';

import { MDXRemote } from 'next-mdx-remote/rsc';

interface ProblemContentProps {
  content: string;
}

export default function ProblemContent({ content }: ProblemContentProps) {
  return <MDXRemote source={content} />;
}
