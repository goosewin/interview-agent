'use client';

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useEffect, useState } from 'react';

interface ProblemContentProps {
  content: string;
}

export default function ProblemContent({ content }: ProblemContentProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);

  useEffect(() => {
    if (!content) return;
    serialize(content).then(setMdxSource);
  }, [content]);

  if (!content) {
    return <div className="text-muted-foreground">No problem assigned</div>;
  }

  if (!mdxSource) return null;

  return (
    <div className="prose dark:prose-invert">
      <MDXRemote {...mdxSource} />
    </div>
  );
}
