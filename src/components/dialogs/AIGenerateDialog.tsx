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
import { AIGenerateConfig } from '@/lib/modules/llm/types';

interface AIGenerateDialogProps {
  selectedText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: AIGenerateConfig) => Promise<void>;
  isGenerating: boolean;
}



const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
  { value: 'gemini-2.0-pro-exp', label: 'Gemini 2.0 Pro Experimental', provider: 'Google' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { value: 'deepseek/deepseek-chat-v3.1:free', label: 'Deepseek-chat-v3.1:free', provider: 'openrouter' },
  { value: 'openai/gpt-oss-120b:free', label: 'gpt-oss-120b:free', provider: 'openrouter' },
  { value: 'openai/gpt-oss-20b:free', label: 'gpt-oss-20b:free', provider: 'openrouter' },
  { value: 'moonshotai/kimi-k2:free', label: 'kimi-k2:free', provider: 'openrouter' },
];

export function AIGenerateDialog({ 
  selectedText,
  open, 
  onOpenChange, 
  onGenerate, 
  isGenerating 
}: AIGenerateDialogProps) {
  const [model, setModel] = useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState(localStorage.getItem('ai_api_key') || '');
  const [prompt, setPrompt] = useState('Generate an engaging MDX article about modern web development with interactive examples and code snippets.');
  const [showApiKey, setShowApiKey] = useState(false);
  
  
  const selectedModel = AI_MODELS.find(m => m.value === model);
  const handleGenerate = async () => {
    if (!apiKey.trim() || !prompt.trim()) {
      return;
    }
    localStorage.setItem('ai_api_key', apiKey);
    await onGenerate({
      model,
      apiKey: apiKey.trim(),
      prompt: selectedText + ' ' + prompt,
      provider: selectedModel?.provider.toLowerCase() === 'google' ? 'gemini' : 'openrouter',
    });
  };
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