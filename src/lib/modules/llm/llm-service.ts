// lib/llm-service.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText } from 'ai';
import { AIGenerateConfig } from './types';

export async function sendAIGenMDXStream(content: AIGenerateConfig): Promise<ReadableStream<string>> {
    content.prompt =`You are an assistant that always responds in **MDX format**. \n
    - Use standard Markdown syntax for headings, lists, links, tables, and code blocks. \n 
    - Can use style css to style elements to do user requests. \n
    - Do not include extra explanations outside of the MDX output.  \n
    - Do NOT use triple backticks or \`\`\`mdx. \n
    Now, respond to the following request in MDX format:
`+ content.prompt;
  try {
    if (content.provider === 'gemini') {
      return await sendGeminiMessageStream(content);
    } else if (content.provider === 'openrouter') {
      return await sendOpenRouterMessageStream(content);
    }

    throw new Error(`Unsupported provider: ${content.provider}`);
  } catch (error) {
    throw error;
  }
}

async function sendGeminiMessageStream(content: AIGenerateConfig): Promise<ReadableStream<string>> {
  const google = createGoogleGenerativeAI({
    apiKey: content.apiKey,
  });
  const model = google(content.model);
  
  try {
//   await generateText({
//     model,
//     prompt: "ping",
//   });
    const { textStream } = await streamText({
      model,
      prompt: content.prompt,
      temperature: 0.7,
    });
    
    return textStream;
  } catch (error) {
    console.log('here',error);
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function sendOpenRouterMessageStream(content: AIGenerateConfig): Promise<ReadableStream<string>> {
  const openRouter = createOpenRouter({
    apiKey: content.apiKey,
  });

  const model = openRouter(content.model);

  try {
    const { textStream } = await streamText({
      model,
      prompt: content.prompt,
      temperature: 0.7,
    });

    return textStream;
  } catch (error) {
    throw new Error(
      `OpenRouter API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

// Keep the non-streaming version for compatibility
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