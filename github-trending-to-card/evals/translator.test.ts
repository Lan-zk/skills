import { translateDescriptions } from '../src/translator';
import { createLlmClient } from '../src/llmClient';
import type { TrendingItem } from '../src/types';

const originalEnv = process.env;

describe('translator.ts - translateDescriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, LLM_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should skip translation when LLM_API_KEY is not set', async () => {
    delete process.env.LLM_API_KEY;
    const items: TrendingItem[] = [
      {
        owner: 'test',
        name: 'repo',
        description: 'English desc',
        language: 'TypeScript',
        hex: '#3178c6',
        stars: '100',
        new_stars: '10',
        timestamp: '2026-04-01 00:00',
      },
    ];

    const result = await translateDescriptions(items);

    expect(result).toEqual(items);
  });

  it('should return empty array unchanged', async () => {
    const result = await translateDescriptions([]);
    expect(result).toEqual([]);
  });

  it('should translate descriptions via LLM API', async () => {
    const items: TrendingItem[] = [
      {
        owner: 'owner1',
        name: 'repo1',
        description: 'A React component library',
        language: 'TypeScript',
        hex: '#3178c6',
        stars: '100',
        new_stars: '10',
        timestamp: '2026-04-01 00:00',
      },
      {
        owner: 'owner2',
        name: 'repo2',
        description: 'Python web framework',
        language: 'Python',
        hex: '#3572A5',
        stars: '200',
        new_stars: '20',
        timestamp: '2026-04-01 00:00',
      },
    ];

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '1. 一个 React 组件库\n2. Python Web 框架' } }],
    });
    const mockClient = { chat: { completions: { create: mockCreate } } };

    const result = await translateDescriptions(
      items,
      () => mockClient as unknown as ReturnType<typeof createLlmClient>,
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: expect.arrayContaining([
          { role: 'system', content: expect.stringContaining('资深开发者') },
          { role: 'user', content: expect.stringContaining('React') },
        ]),
      }),
    );

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('一个 React 组件库');
    expect(result[1].description).toBe('Python Web 框架');
    expect(result[0].owner).toBe('owner1'); // unchanged fields preserved
  });

  it('should preserve original description when parse fails', async () => {
    const items: TrendingItem[] = [
      {
        owner: 'test',
        name: 'repo',
        description: 'Original desc',
        language: 'TypeScript',
        hex: '#3178c6',
        stars: '100',
        new_stars: '10',
        timestamp: '2026-04-01 00:00',
      },
    ];

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '无法解析的格式' } }],
    });
    const mockClient = { chat: { completions: { create: mockCreate } } };

    const result = await translateDescriptions(
      items,
      () => mockClient as unknown as ReturnType<typeof createLlmClient>,
    );

    expect(result[0].description).toBe('Original desc');
  });
});
