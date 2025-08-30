'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { MDXContent } from '@/components/preview/MDXContent';

interface MDXPreviewProps {
  content: string;
}

interface MDXErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function MDXErrorBoundary({ children, fallback }: MDXErrorBoundaryProps) {
  return (
    <React.Suspense 
      fallback={
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      }
    >
      <ErrorBoundary fallback={fallback}>
        {children}
      </ErrorBoundary>
    </React.Suspense>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to render MDX content. Please check your syntax.
            {this.state.error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Error details</summary>
                <pre className="text-xs mt-1 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export function MDXPreview({ content }: MDXPreviewProps) {
  const renderMDX = () => {
    if (!content.trim()) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <p>Start typing in the editor to see your MDX content here</p>
        </div>
      );
    }

    try {
      return (
        <MDXContent content={content} />
      );
    } catch (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to compile MDX content. Please check your syntax.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle className="text-lg font-semibold">Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <MDXErrorBoundary>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {renderMDX()}
          </div>
        </MDXErrorBoundary>
      </CardContent>
    </Card>
  );
}