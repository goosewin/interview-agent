import { MDXRemote } from 'next-mdx-remote/rsc';

export default function ProblemContent({ content }: { content: string }) {
  return <MDXRemote source={content} />;
} 
