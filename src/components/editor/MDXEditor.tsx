'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  sendAIGenMDX,
} from '@/lib/modules/llm/llm-service';

interface MDXEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MDXEditor({ value, onChange }: MDXEditorProps) {
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [selectionTooltip, setSelectionTooltip] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: '',
  });
  const [streamController, setStreamController] =
    useState<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const stopGeneration = useCallback(() => {
    if (streamController) {
      streamController.abort();
      setStreamController(null);
      setIsGenerating(false);
      toast.info('Generation stopped');
    }
  }, [streamController]);

  const handleAIGenerate = async (config: AIGenerateConfig) => {
    if (!editorRef.current) return;
    
    setIsGenerating(true);
    setDialogOpen(false);

    const controller = new AbortController();
    const editor = editorRef.current;
    const model = editor.getModel();

    if (!model) {
      setIsGenerating(false);
      return;
    }

    // Get the current selection at the time of generation
    const currentSelection = editor.getSelection();
    
    // Use current selection if available, fallback to stored selectionRange
    const effectiveRange = currentSelection && !currentSelection.isEmpty() 
      ? {
          startLineNumber: currentSelection.startLineNumber,
          startColumn: currentSelection.startColumn,
          endLineNumber: currentSelection.endLineNumber,
          endColumn: currentSelection.endColumn,
        }
      : selectionRange;

    setStreamController(controller);
    
    try {
      toast.info('Generating content...', {
        description: `Using ${config.model} to create your content`,
      });
      
      const data = await sendAIGenMDX(config);
      
      // Check if there's a selection to replace
      if (effectiveRange) {
        // Verify the range is valid
        const totalLines = model.getLineCount();
        const isValidRange = effectiveRange.startLineNumber >= 1 && 
                           effectiveRange.endLineNumber <= totalLines &&
                           effectiveRange.startColumn >= 1;
        
        if (isValidRange) {
          const editOperation = {
            range: {
              startLineNumber: effectiveRange.startLineNumber,
              startColumn: effectiveRange.startColumn,
              endLineNumber: effectiveRange.endLineNumber,
              endColumn: effectiveRange.endColumn,
            },
            text: data,
            forceMoveMarkers: true,
          };
          
          // Try multiple approaches for replacement
          let success = false;
          
          // Method 1: executeEdits
          try {
            success = editor.executeEdits('ai-replace-selection', [editOperation]);
          } catch (error) {
            console.error('executeEdits failed:', error);
          }
          
          // Method 2: If executeEdits fails, try direct model edit
          if (!success) {
            try {
              const edit = {
                range: {
                  startLineNumber: effectiveRange.startLineNumber,
                  startColumn: effectiveRange.startColumn,
                  endLineNumber: effectiveRange.endLineNumber,
                  endColumn: effectiveRange.endColumn,
                },
                text: data
              };
              
              model.pushEditOperations([], [edit], () => null);
              success = true;
            } catch (error) {
              console.error('Direct model edit failed:', error);
            }
          }
          
          // Method 3: If both fail, manually reconstruct the content
          if (!success) {
            try {
              const fullContent = model.getValue();
              const lines = fullContent.split('\n');
              
              // Calculate the exact text to replace
              let beforeText = '';
              let afterText = '';
              
              // Get text before selection
              for (let i = 0; i < effectiveRange.startLineNumber - 1; i++) {
                beforeText += lines[i] + '\n';
              }
              if (effectiveRange.startLineNumber > 0 && lines[effectiveRange.startLineNumber - 1]) {
                beforeText += lines[effectiveRange.startLineNumber - 1].substring(0, effectiveRange.startColumn - 1);
              }
              
              // Get text after selection
              if (effectiveRange.endLineNumber <= lines.length && lines[effectiveRange.endLineNumber - 1]) {
                afterText = lines[effectiveRange.endLineNumber - 1].substring(effectiveRange.endColumn - 1);
              }
              for (let i = effectiveRange.endLineNumber; i < lines.length; i++) {
                afterText += '\n' + lines[i];
              }
              
              const newContent = beforeText + data + afterText;
              
              // Set the new content
              model.setValue(newContent);
              onChange(newContent);
              success = true;
            } catch (error) {
              console.error('Manual reconstruction failed:', error);
            }
          }
          
          if (success) {
            toast.success('Selection replaced with AI-generated content');
            
            // Ensure parent component gets the updated content
            const finalContent = model.getValue();
            onChange(finalContent);
          } else {
            toast.error('Failed to replace selection');
          }
        } else {
          toast.error('Invalid selection range');
        }
        
        // Clear selection state after replacement attempt
        setSelectionRange(null);
        setSelectionTooltip({
          visible: false,
          position: { x: 0, y: 0 },
          selectedText: '',
        });
      } else {
        // No selection, replace entire content
        onChange(data);
        toast.success('Generated new content');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
      setStreamController(null);
    }
  };

  const handleSelectionAIGenerate = async (selectedText: string) => {
    // Keep the current selection state when opening dialog
    setSelectionTooltip({
      visible: false,
      position: { x: 0, y: 0 },
      selectedText,
    });
    
    // Open the AI dialog with the selected text as context
    setDialogOpen(true);
  };

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Listen for selection changes
    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getSelection();
      
      if (selection && !selection.isEmpty()) {
        const selectedText =
          editor.getModel()?.getValueInRange(selection) || '';

        if (selectedText.trim().length > 0) {
          // Store the selection range
          const newSelectionRange = {
            startLineNumber: e.selection.startLineNumber,
            startColumn: e.selection.startColumn,
            endLineNumber: e.selection.endLineNumber,
            endColumn: e.selection.endColumn,
          };
          
          setSelectionRange(newSelectionRange);

          // Get the position of the selection end for tooltip
          const position = editor.getScrolledVisiblePosition(
            selection.getEndPosition()
          );

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
        // Clear selection state when no text is selected
        setSelectionRange(null);
        setSelectionTooltip({
          visible: false,
          position: { x: 0, y: 0 },
          selectedText: '',
        });
      }
    });

    // Hide tooltip when clicking elsewhere
    editor.onDidFocusEditorText(() => {
      const selection = editor.getSelection();
      if (!selection || selection.isEmpty()) {
        setSelectionRange(null);
        setSelectionTooltip({
          visible: false,
          position: { x: 0, y: 0 },
          selectedText: '',
        });
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
              {isGenerating ? 'Generating...' : selectionRange ? 'AI Replace Selection' : 'AI Generate'}
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
              AI is generating content... Click  `&quot;`Stop `&quot;` to cancel
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
        selectedText={selectionTooltip.selectedText}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleAIGenerate}
        isGenerating={isGenerating}
      />
    </Card>
  );
}