// lib/llm-service.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { AIGenerateConfig } from './types';

export async function sendAIGenMDXStream(content: AIGenerateConfig): Promise<ReadableStream<string>> {
  content.prompt = `You are an assistant that always responds in **MDX format**. \n
    - Use standard Markdown syntax for headings, lists, links, tables, and code blocks. \n
    - Can use style css to style elements to do user requests. \n
    - Do not include extra explanations outside of the MDX output. \n
    - Do NOT use triple backticks or \`\`\`mdx. \n
    Now, respond to the following request in MDX format: ` + content.prompt;

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${content.model}:streamGenerateContent?key=${content.apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: content.prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from Gemini API');
    }
    return new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              try {
                // Remove the "data: " prefix if present
                const jsonStr = line.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]') continue;
                
                const data = JSON.parse(jsonStr);
                
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                  const text = data.candidates[0].content.parts[0].text;
                  controller.enqueue(text);
                }
              } catch (parseError) {
                console.log(parseError);
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      }
    });
  } catch (error) {
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function sendOpenRouterMessageStream(content: AIGenerateConfig): Promise<ReadableStream<string>> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const requestBody = {
    model: content.model,
    messages: [
      {
        role: 'user',
        content: content.prompt
      }
    ],
    temperature: 0.7,
    stream: true,
    max_tokens: 8192,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${content.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'MDX Editor App',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from OpenRouter API');
    }

    return new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              try {
                // Remove the "data: " prefix if present
                const jsonStr = line.replace(/^data:\s*/, '');
                if (jsonStr === '[DONE]') continue;
                
                const data = JSON.parse(jsonStr);
                
                if (data.choices?.[0]?.delta?.content) {
                  const text = data.choices[0].delta.content;
                  controller.enqueue(text);
                }
              } catch (parseError) {
                console.log(parseError);
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      }
    });
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
    content.prompt =`You are an assistant that always responds in **MDX format**. \n
    - Use standard Markdown syntax for headings, lists, links, tables, and code blocks. \n 
    - Can use style css to style elements to do user requests. \n
    - Do not include extra explanations outside of the MDX output.  \n
    - Do NOT use triple backticks or \`\`\`mdx. \n
    Now, respond to the following request in MDX format:
`+ content.prompt;
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