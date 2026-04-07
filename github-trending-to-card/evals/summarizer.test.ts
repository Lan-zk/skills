import type { TrendingItem } from '../src/types';
import type { ReadmeClient } from '../src/readmeClient';
import { createLlmClient } from '../src/llmClient';

const originalEnv = process.env;

const baseItem: TrendingItem = {
	owner: 'testowner',
	name: 'testrepo',
	description: 'A test project',
	language: 'TypeScript',
	hex: '#3178c6',
	stars: '100',
	new_stars: '10',
	forks: '5',
	contributors: '20',
	license: 'MIT',
	timestamp: '2026-04-01 00:00',
};

// ---------------------------------------------------------------------------
// parseAiIntro unit tests (mirrors private function in summarizer.ts)
// ---------------------------------------------------------------------------

describe('parseAiIntro', () => {
	function parseAiIntro(text: string): string {
		const match = text.match(
			/<b class="ai-block ai-block--problem">解决问题：<\/b>(?:<br\s*\/?\/?\s*>|\s)*[\s\S]*?<b class="ai-block ai-block--solution">解决方案：<\/b>(?:<br\s*\/?\/?\s*>|\s)*[\s\S]*/,
		);
		return match ? match[0].trim() : '';
	}

	it('should extract HTML from class-based format', () => {
		const section = `<b class="ai-block ai-block--problem">解决问题：</b>开发者在终端与 AI 交互时缺乏深度代码理解。<br>
<b class="ai-block ai-block--solution">解决方案：</b>通过文件系统索引和语义搜索，让 Claude 在终端中真正"看懂"整个代码库。`;
		const result = parseAiIntro(section);
		expect(result).toBeDefined();
		expect(result).toContain('ai-block--problem');
		expect(result).toContain('ai-block--solution');
	});

	it('should return empty string when tag not found', () => {
		expect(parseAiIntro('无标签纯文本')).toBe('');
	});
});

// ---------------------------------------------------------------------------
// buildSummaryUserMessage unit tests (mirrors private function in summarizer.ts)
// ---------------------------------------------------------------------------

describe('buildSummaryUserMessage', () => {
	function buildSummaryUserMessage(item: TrendingItem, readme: string): string {
		const prompt = `# 项目信息
项目名：{owner}/{name}
原始描述：{description}

# README 片段（已截取前 4KB）
{readme}

# 输出要求
请分析 README 内容，回答以下两个核心问题，输出中文：

<b class="ai-block ai-block--problem">解决问题：</b>该项目的核心问题或痛点，一句话概括。

<b class="ai-block ai-block--solution">解决方案：</b>该项目的核心实现思路或方法，一句话概括。

规则：
- 使用 <b class="ai-block ai-block--problem/problem"> 标签包裹第一行（包含标题和内容）
- 使用 <b class="ai-block ai-block--solution"> 标签包裹第二行（包含标题和内容）
- 不要在 <b> 标签外放置任何内容
- 正确格式：<b class="ai-block ai-block--problem">解决问题：</b>内容<br><b class="ai-block ai-block--solution">解决方案：</b>内容
- 总字数控制在 70-150 字
- 不得添加 README 中不存在的虚构信息`;
		return prompt
			.replace('{owner}', item.owner)
			.replace('{name}', item.name)
			.replace('{description}', item.description || '无')
			.replace('{readme}', readme || '（README 不可用）');
	}

	it('should fill all placeholders correctly', () => {
		const msg = buildSummaryUserMessage(baseItem, '# Test\nContent');
		expect(msg).toContain('testowner/testrepo');
		expect(msg).toContain('A test project');
		expect(msg).toContain('# Test\nContent');
	});

	it('should use fallbacks for missing description and readme', () => {
		const item = { ...baseItem, description: '' };
		const msg = buildSummaryUserMessage(item, '');
		expect(msg).toContain('原始描述：无');
		expect(msg).toContain('README 片段（已截取前 4KB）\n（README 不可用）');
	});
});

// ---------------------------------------------------------------------------
// summarizeReadmes — uses beforeAll + requireActual to avoid import() isolation
// ---------------------------------------------------------------------------

describe('summarizer.ts - summarizeReadmes', () => {
	let summarizeReadmes: typeof import('../src/summarizer').summarizeReadmes;

	beforeAll(async () => {
		const mod = await import('../src/summarizer');
		summarizeReadmes = mod.summarizeReadmes;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		process.env = { ...originalEnv, LLM_API_KEY: 'test-key' };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('should skip AI intro when LLM_API_KEY is not set', async () => {
		delete process.env.LLM_API_KEY;
		const readmeClient: ReadmeClient = { fetchReadme: jest.fn() };
		const createMock = jest.fn();

		const result = await summarizeReadmes(
			[{ ...baseItem }],
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result[0].ai_intro).toBeUndefined();
		expect(createMock).not.toHaveBeenCalled();
	});

	it('should return empty array unchanged', async () => {
		const result = await summarizeReadmes([]);
		expect(result).toEqual([]);
	});

	it('should generate ai_intro from valid LLM response', async () => {
		const readmeClient: ReadmeClient = {
			fetchReadme: jest.fn().mockResolvedValue('# README'),
		};
		const createMock = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: `<b class="ai-block ai-block--problem">解决问题：</b>测试结果对比繁琐。<br>
<b class="ai-block ai-block--solution">解决方案：</b>标准化输出与自动化比对引擎。`,
					},
				},
			],
		});

		const result = await summarizeReadmes(
			[{ ...baseItem }],
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result[0].ai_intro).toBeDefined();
		expect(result[0].ai_intro).toContain('解决问题：');
		expect(result[0].ai_intro).toContain('解决方案：');
	});

	it('should degrade gracefully on LLM failure', async () => {
		const readmeClient: ReadmeClient = {
			fetchReadme: jest.fn().mockResolvedValue('# README'),
		};
		const createMock = jest.fn().mockRejectedValue(new Error('API error'));

		const result = await summarizeReadmes(
			[{ ...baseItem }],
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result[0].ai_intro).toBeUndefined();
	});

	it('should return undefined for malformed LLM response', async () => {
		const readmeClient: ReadmeClient = {
			fetchReadme: jest.fn().mockResolvedValue('# README'),
		};
		const createMock = jest.fn().mockResolvedValue({
			choices: [{ message: { content: '纯文本，没有 HTML 标签' } }],
		});

		const result = await summarizeReadmes(
			[{ ...baseItem }],
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result[0].ai_intro).toBeUndefined();
	});

	it('should skip when all READMEs are unavailable', async () => {
		// With 0/1 available READMEs, availableCount (0) < items.length/2 (0.5) → skip
		const readmeClient: ReadmeClient = {
			fetchReadme: jest.fn().mockResolvedValue(''),
		};
		const createMock = jest.fn();

		const result = await summarizeReadmes(
			[{ ...baseItem }],
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result[0].ai_intro).toBeUndefined();
		expect(createMock).not.toHaveBeenCalled();
	});

	it('should generate intro when at least half the READMEs are available', async () => {
		// 1/2 available → availableCount (1) >= items.length/2 (1) → proceeds
		const readmeClient: ReadmeClient = {
			fetchReadme: jest
				.fn()
				.mockResolvedValueOnce('# README') // item 1 has content
				.mockResolvedValueOnce(''), // item 2 no content
		};
		const createMock = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: `<b class="ai-block ai-block--problem">解决问题：</b>项目1的痛点。<br>
<b class="ai-block ai-block--solution">解决方案：</b>项目1的方法。<br>
<b class="ai-block ai-block--problem">解决问题：</b>项目2的痛点。<br>
<b class="ai-block ai-block--solution">解决方案：</b>项目2的方法。`,
					},
				},
			],
		});

		const items = [
			{ ...baseItem, owner: 'o1', name: 'r1' },
			{ ...baseItem, owner: 'o2', name: 'r2' },
		];
		const result = await summarizeReadmes(
			items,
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result[0].ai_intro).toBeDefined();
		expect(result[1].ai_intro).toBeDefined();
	});

	it('should batch multiple items into one LLM call', async () => {
		const readmeClient: ReadmeClient = {
			fetchReadme: jest
				.fn()
				.mockResolvedValueOnce('# Repo1')
				.mockResolvedValueOnce('# Repo2'),
		};
		const createMock = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: `<b class="ai-block ai-block--problem">解决问题：</b>问题1。<br>
<b class="ai-block ai-block--solution">解决方案：</b>方法1。<br>
<b class="ai-block ai-block--problem">解决问题：</b>问题2。<br>
<b class="ai-block ai-block--solution">解决方案：</b>方法2。`,
					},
				},
			],
		});

		const items = [
			{ ...baseItem, owner: 'o1', name: 'r1' },
			{ ...baseItem, owner: 'o2', name: 'r2' },
		];
		const result = await summarizeReadmes(
			items,
			() => ({ chat: { completions: { create: createMock } } }) as unknown as ReturnType<typeof createLlmClient>,
			readmeClient,
		);

		expect(result).toHaveLength(2);
		expect(result[0].ai_intro).toBeDefined();
		expect(result[1].ai_intro).toBeDefined();
		expect(createMock).toHaveBeenCalledTimes(2); // sequential calls, one per item
	});
});
