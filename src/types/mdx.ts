export interface MDXContent {
  content: string;
  title?: string;
}

export interface AIGenerateRequest {
  prompt: string;
  model: string;
  apiKey: string;
  context?: string;
}

export interface AIGenerateResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface EditorTheme {
  base: 'vs-dark' | 'vs-light';
  inherit: boolean;
  rules: Array<{
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
  colors: Record<string, string>;
}