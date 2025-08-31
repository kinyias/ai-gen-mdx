'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { MDXRenderer } from '@/components/preview/MDXRenderer';

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
  { hasError: boolean; error?: Error; errorId: string }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true, 
      error,
      errorId: Date.now().toString() // Force re-render when error changes
    };
  }

  componentDidUpdate(prevProps: { children: React.ReactNode; fallback?: React.ReactNode }) {
    // Reset error state when content changes (user fixes the error)
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: undefined, errorId: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            MDX Syntax Error: Please check your syntax and try again.
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle className="text-lg font-semibold">Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <MDXErrorBoundary>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXRenderer content={content} />
          </div>
        </MDXErrorBoundary>
      </CardContent>
    </Card>
  );
}