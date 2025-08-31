// lib/llm-service.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { AIGenerateConfig } from './types';

export async function sendAIGenMDX(content: AIGenerateConfig): Promise<string> {
  if (content.provider === 'gemini') {
    return sendGeminiMessage(content);
  } else if (content.provider === 'openrouter') {
    return sendOpenRouterMessage(content);
  }

  throw new Error(`Unsupported provider: ${content.provider}`);
}

async function sendGeminiMessage(content: AIGenerateConfig): Promise<string> {
  const google = createGoogleGenerativeAI({
    apiKey: content.apiKey,
  });
  const model = google(content.model);
  try {
    const { text } = await generateText({
      model,
      prompt: content.prompt,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function sendOpenRouterMessage(content: AIGenerateConfig): Promise<string> {
  const openRouter = createOpenRouter({
    apiKey: content.apiKey,
  });

  const model = openRouter(content.model);

  try {
    const { text } = await generateText({
      model,
      prompt: content.prompt,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    throw new Error(
      `OpenRouter API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
