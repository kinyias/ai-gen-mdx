import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const mdxComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-bold mb-6 text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-3xl font-semibold mb-4 text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-2xl font-medium mb-3 text-foreground" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-relaxed text-muted-foreground" {...props}>
      {children}
    </p>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code 
      className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground" 
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre 
      className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 border" 
      {...props}
    >
      {children}
    </pre>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-muted-foreground" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote 
      className="border-l-4 border-primary pl-6 my-6 italic text-muted-foreground" 
      {...props}
    >
      {children}
    </blockquote>
  ),
  // Custom MDX Components
  InfoCard: ({ title, children, variant = "default" }: { 
    title: string; 
    children: React.ReactNode;
    variant: "default" | "warning" | "success" | "destructive";
  }) => {
    // Map custom variants to valid Badge variants
    const badgeVariant: "default" | "destructive" | "outline" | "secondary" | null | undefined =
      variant === "default"
        ? "secondary"
        : variant === "warning"
        ? "destructive"
        : variant === "success"
        ? "default"
        : variant;

    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant={badgeVariant}>
              {variant === "default" ? "Info" : variant}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  },
  ActionButton: ({ children, onClick, variant = "default" }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }) => (
    <Button variant={variant} onClick={onClick} className="my-2">
      {children}
    </Button>
  ),
};