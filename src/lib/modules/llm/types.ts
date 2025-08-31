// lib/types.ts
export interface LLMConfig {
  provider: 'gemini' | 'openrouter';
  apiKey: string;
  model: string;
}

export interface LLMModel {
  id: string;
  name: string;
  displayName?: string;
}
export interface AIGenerateConfig {
  model: string;
  apiKey: string;
  prompt: string;
 provider: 'gemini' | 'openrouter';
}