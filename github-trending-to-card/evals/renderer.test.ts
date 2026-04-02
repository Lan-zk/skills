import { renderCards, closeBrowser } from '../src/renderer';
import { chromium } from 'playwright';
import * as fs from 'fs';

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

jest.mock('fs');

describe('renderer.ts - renderCards', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;
  let mockElementHandle: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    mockElementHandle = {
      screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
    };

    mockPage = {
      setContent: jest.fn(),
      waitForTimeout: jest.fn(),
      $: jest.fn().mockResolvedValue(mockElementHandle),
      close: jest.fn(),
    };

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn(),
    };

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (fs.readFileSync as jest.Mock).mockReturnValue('<div>{{name}}</div>');
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await closeBrowser();
  });

  it('should render cards and return base64 images', async () => {
    const items = [
      {
        owner: 'test',
        name: 'repo',
        description: 'desc',
        language: 'TS',
        hex: '#000',
        stars: '10',
        new_stars: '1',
        forks: '0',
        contributors: '0',
        license: 'MIT',
        timestamp: '2026-04-01 00:00',
        owner_avatar: 'https://avatars.githubusercontent.com/u/1',
        owner_repos: '5',
        owner_followers: '10',
      },
    ];

    const results = await renderCards(items);

    expect(results).toHaveLength(1);
    expect(results[0]).toBe(Buffer.from('mock-image-data').toString('base64'));
    expect(mockPage.setContent).toHaveBeenCalledWith('<div>repo</div>', { waitUntil: 'networkidle' });
    expect(mockPage.$).toHaveBeenCalledWith('.card-container');
    expect(mockElementHandle.screenshot).toHaveBeenCalledWith({ type: 'png' });
  });

  it('should reuse browser instance', async () => {
    const items = [
      {
        owner: 'test',
        name: 'repo',
        description: 'desc',
        language: 'TS',
        hex: '#000',
        stars: '10',
        new_stars: '1',
        forks: '0',
        contributors: '0',
        license: 'MIT',
        timestamp: '2026-04-01 00:00',
      },
    ];

    await renderCards(items);
    await renderCards(items);

    expect(chromium.launch).toHaveBeenCalledTimes(1);
  });

  it('should close browser gracefully if it is null', async () => {
    await closeBrowser();
    expect(mockBrowser.close).not.toHaveBeenCalled();
  });

  it('should throw error if card-container not found', async () => {
    mockPage.$ = jest.fn().mockResolvedValue(null);

    const items = [
      {
        owner: 'test',
        name: 'repo',
        description: 'desc',
        language: 'TS',
        hex: '#000',
        stars: '10',
        new_stars: '1',
        forks: '0',
        contributors: '0',
        license: 'MIT',
        timestamp: '2026-04-01 00:00',
      },
    ];

    await expect(renderCards(items)).rejects.toThrow('Card container not found in rendered HTML');
  });
});
