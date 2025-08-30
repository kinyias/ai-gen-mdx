'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AIGenerateDialog, type AIGenerateConfig } from '@/components/dialogs/AIGenerateDialog';
import { toast } from 'sonner';
import type { EditorTheme } from '@/types/mdx';

interface MDXEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MDXEditor({ value, onChange }: MDXEditorProps) {
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  }, [onChange]);

  const handleAIGenerate = async (config: AIGenerateConfig) => {
    setIsGenerating(true);
    setDialogOpen(false);
    
    try {
      toast.info('Generating content...', {
        description: `Using ${config.model} to create your content`,
      });

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: config.prompt,
          model: config.model,
          apiKey: config.apiKey,
          context: value,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onChange(data.content);
        toast.success('Content generated successfully!', {
          description: 'Your new MDX content is ready to edit',
        });
      } else {
        toast.error('Generation failed', {
          description: data.error || 'Please try again',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to connect to AI service',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const editorTheme: EditorTheme = {
    base: theme === 'dark' ? 'vs-dark' : 'vs-light',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'D73A49' },
      { token: 'string', foreground: '032F62' },
    ],
    colors: {
      'editor.background': theme === 'dark' ? '#0D1117' : '#FFFFFF',
    }
  };

  if (!mounted) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>MDX Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">MDX Editor</CardTitle>
          <Button 
            onClick={() => setDialogOpen(true)}
            disabled={isGenerating}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-full min-h-[500px]">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={value}
            onChange={handleEditorChange}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineHeight: 1.5,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>
      </CardContent>
      
      <AIGenerateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleAIGenerate}
        isGenerating={isGenerating}
      />
    </Card>
  );
}