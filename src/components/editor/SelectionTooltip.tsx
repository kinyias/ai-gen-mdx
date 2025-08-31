'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionTooltipProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onAIGenerate: (selectedText: string) => void;
}

export function SelectionTooltip({ 
  visible, 
  position, 
  selectedText, 
  onAIGenerate 
}: SelectionTooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible || !selectedText.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border rounded-lg shadow-lg p-2",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
      }}
    >
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onAIGenerate(selectedText)}
          className="gap-1 h-7 px-2 text-xs"
        >
          <Sparkles className="w-3 h-3" />
          AI Enhance
        </Button>
      </div>
    </div>
  );
}