import OpenAI from 'openai';

export function createLlmClient(): OpenAI {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || 'https://api.siliconflow.cn/v1';
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey, baseURL });
}
