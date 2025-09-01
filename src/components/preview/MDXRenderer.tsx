import React from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import { mdxComponents } from '@/lib/mdx-components';

interface MDXRendererProps {
  content: string;
}

export function MDXRenderer({ content }: MDXRendererProps) {
  const [MDXContent, setMDXContent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isCompiling, setIsCompiling] = React.useState(false);

  React.useEffect(() => {
    const compileMDX = async () => {
      try {
        setIsCompiling(true);
        setError(null);
        
        // Check for incomplete tags like "<" without closing ">"
        const incompleteTagMatch = content.match(/<[^>]*$/);
        if (incompleteTagMatch) {
          // Don't compile if there's an incomplete tag at the end
          setMDXContent(null);
          setError(null); // Don't show error for incomplete typing
          return;
        }
        
        const { default: MDXComponent } = await evaluate(content, {
          ...runtime,
          useMDXComponents: () => mdxComponents,
        });
        setMDXContent(() => MDXComponent);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to compile MDX';
        
        // Don't show errors for common incomplete syntax patterns
        const isIncompleteTag = errorMessage.includes('Unexpected end of file') || 
                               errorMessage.includes('Expected') ||
                               errorMessage.includes('Unterminated');
        
        if (isIncompleteTag && content.trim().endsWith('<')) {
          setError(null); // User is still typing
        } else {
          setError(errorMessage);
        }
        setMDXContent(null);
      } finally {
        setIsCompiling(false);
      }
    };

    if (content.trim()) {
      compileMDX();
    } else {
      setMDXContent(null);
      setError(null);
      setIsCompiling(false);
    }
  }, [content]);

  if (error) {
    throw new Error(error);
  }

  if (isCompiling) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="animate-pulse">
          <p>Compiling MDX...</p>
        </div>
      </div>
    );
  }

  if (!MDXContent) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Start typing in the editor to see your MDX content here</p>
      </div>
    );
  }

  return <MDXContent />;
}