'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AIGenerateDialog } from '@/components/dialogs/AIGenerateDialog';
import { SelectionTooltip } from '@/components/editor/SelectionTooltip';
import { toast } from 'sonner';
import type { editor } from 'monaco-editor';
import { AIGenerateConfig } from '@/lib/modules/llm/types';
import { sendAIGenMDX } from '@/lib/modules/llm/llm-service';

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
  const [selectionTooltip, setSelectionTooltip] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: '',
  });

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
      console.log(config);
      const data =await sendAIGenMDX(config);
        onChange(data);
        toast.success('Content generated successfully!', {
          description: 'Your new MDX content is ready to edit',
        });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectionAIGenerate = async (selectedText: string) => {
    setSelectionTooltip({ visible: false, position: { x: 0, y: 0 }, selectedText: '' });
    
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
            }}
          />
        </div>
      </CardContent>
      
      <SelectionTooltip
        visible={selectionTooltip.visible}
        position={selectionTooltip.position}
        selectedText={selectionTooltip.selectedText}
        onAIGenerate={handleSelectionAIGenerate}
      />
      
      <AIGenerateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleAIGenerate}
        isGenerating={isGenerating}
      />
    </Card>
  );
}