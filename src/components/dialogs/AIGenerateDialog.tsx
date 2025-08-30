'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: AIGenerateConfig) => Promise<void>;
  isGenerating: boolean;
}

export interface AIGenerateConfig {
  model: string;
  apiKey: string;
  prompt: string;
}

const AI_MODELS = [
  { value: 'gpt-4', label: 'GPT-4', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'gemini-pro', label: 'Gemini Pro', provider: 'Google' },
];

export function AIGenerateDialog({ 
  open, 
  onOpenChange, 
  onGenerate, 
  isGenerating 
}: AIGenerateDialogProps) {
  const [model, setModel] = useState('gpt-4');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('Generate an engaging MDX article about modern web development with interactive examples and code snippets.');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleGenerate = async () => {
    if (!apiKey.trim() || !prompt.trim()) {
      return;
    }

    await onGenerate({
      model,
      apiKey: apiKey.trim(),
      prompt: prompt.trim(),
    });
  };

  const selectedModel = AI_MODELS.find(m => m.value === model);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Content Generation
          </DialogTitle>
          <DialogDescription>
            Configure your AI model and generate custom MDX content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select an AI model" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((modelOption) => (
                  <SelectItem key={modelOption.value} value={modelOption.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{modelOption.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {modelOption.provider}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel && (
              <p className="text-xs text-muted-foreground">
                Provider: {selectedModel.provider}
              </p>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Generation Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe what you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about the type of content, style, and any special requirements
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!apiKey.trim() || !prompt.trim() || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}