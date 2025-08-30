// This is a Server Component
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/lib/mdx-components';

interface MDXContentProps {
  content: string;
}

export async function MDXContent({ content }: MDXContentProps) {
  // Using async function for the Server Component
  return (
    <MDXRemote 
      source={content} 
      components={mdxComponents}
    />
  );
}