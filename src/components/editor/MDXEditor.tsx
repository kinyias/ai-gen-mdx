'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Square } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AIGenerateDialog } from '@/components/dialogs/AIGenerateDialog';
import { SelectionTooltip } from '@/components/editor/SelectionTooltip';
import { toast } from 'sonner';
import type { editor } from 'monaco-editor';
import { AIGenerateConfig } from '@/lib/modules/llm/types';
import { sendAIGenMDXStream } from '@/lib/modules/llm/llm-service';

interface MDXEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MDXEditor({ value, onChange }: MDXEditorProps) {
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionTooltip, setSelectionTooltip] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: '',
  });
  const [streamController, setStreamController] = useState<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  }, [onChange]);

  const stopGeneration = useCallback(() => {
    if (streamController) {
      streamController.abort();
      setStreamController(null);
      setIsGenerating(false);
      toast.info('Generation stopped');
    }
  }, [streamController]);

  const handleAIGenerate = async (config: AIGenerateConfig) => {
    setIsGenerating(true);
    setDialogOpen(false);
    
    const controller = new AbortController();
    setStreamController(controller);
    
    let accumulatedText = '';
    let hasReceivedContent = false;
    
    try {
      toast.info("Generating content...", {
        description: `Using ${config.model} to create your content`,
      });

      const stream = await sendAIGenMDXStream(config);
      const reader = stream.getReader();

      try {
        while (true) {
          if (controller.signal.aborted) {
            await reader.cancel();
            break;
          }
          
          const { done, value } = await reader.read();
          
          if (done) {
            if (!hasReceivedContent && accumulatedText.trim() === '') {
              throw new Error("No content received from API (possibly invalid API key or model)");
            }
            break;
          }
          
          if (value && value.trim() !== '') {
            hasReceivedContent = true;
            accumulatedText += value;
            onChange(accumulatedText);
          }
        }

        if (!controller.signal.aborted && hasReceivedContent) {
          toast.success("Content generated successfully!", {
            description: "Your new MDX content is ready to edit",
          });
        }
      } catch (streamError) {
        console.error("Stream reading error:", streamError);
        if (!controller.signal.aborted) {
          toast.error("Stream failed", {
            description: streamError instanceof Error ? streamError.message : "Error reading stream data",
          });
        }
      } finally {
        reader.releaseLock();
        setSelectedText('');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Generation error:", error);
        
        toast.error("Generation failed", {
          description: error instanceof Error ? error.message : "An unknown error occurred during generation",
        });
      }
    } finally {
      setIsGenerating(false);
      setStreamController(null);
    }
  };

  const handleSelectionAIGenerate = async (selectedText: string) => {
    setSelectionTooltip({ visible: false, position: { x: 0, y: 0 }, selectedText: '' });
    setSelectedText(selectedText);
    // For now, open the main AI dialog with the selected text as context
    setDialogOpen(true);
  };

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);
    
    // Listen for selection changes
    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection) || '';
        
        if (selectedText.trim().length > 0) {
          // Get the position of the selection end
          const position = editor.getScrolledVisiblePosition(selection.getEndPosition());
          
          if (position) {
            const editorDomNode = editor.getDomNode();
            const rect = editorDomNode?.getBoundingClientRect();
            
            if (rect) {
              setSelectionTooltip({
                visible: true,
                position: {
                  x: rect.left + position.left,
                  y: rect.top + position.top,
                },
                selectedText,
              });
            }
          }
        }
      } else {
        setSelectionTooltip({ visible: false, position: { x: 0, y: 0 }, selectedText: '' });
      }
    });

    // Hide tooltip when clicking elsewhere
    editor.onDidFocusEditorText(() => {
      const selection = editor.getSelection();
      if (!selection || selection.isEmpty()) {
        setSelectionTooltip({ visible: false, position: { x: 0, y: 0 }, selectedText: '' });
      }
    });
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
          <div className="flex items-center gap-2">
            {isGenerating && (
              <Button 
                onClick={stopGeneration}
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            )}
            <Button 
              onClick={() => setDialogOpen(true)}
              disabled={isGenerating}
              size="sm"
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'AI Generate'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="h-full min-h-[500px] relative">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
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
              readOnly: isGenerating, // Make editor read-only during generation
            }}
          />
          {isGenerating && (
            <div className="absolute top-0 left-0 right-0 bg-primary/10 backdrop-blur-sm p-2 text-center text-sm text-primary z-10">
              AI is generating content... Click "Stop" to cancel
            </div>
          )}
        </div>
      </CardContent>
      
      <SelectionTooltip
        visible={selectionTooltip.visible}
        position={selectionTooltip.position}
        selectedText={selectionTooltip.selectedText}
        onAIGenerate={handleSelectionAIGenerate}
      />
      
      <AIGenerateDialog
        selectedText={selectedText}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleAIGenerate}
        isGenerating={isGenerating}
      />
    </Card>
  );
}