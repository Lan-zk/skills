import { executeSkill } from '../src/index';
import * as scraper from '../src/scraper';
import * as renderer from '../src/renderer';
import * as translator from '../src/translator';

jest.mock('../src/scraper');
jest.mock('../src/renderer');
jest.mock('../src/translator');

describe('index.ts - executeSkill', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully execute skill with translation and return cards', async () => {
    const mockItems = [
      {
        owner: 'test',
        name: 'repo',
        description: 'A test repo',
        language: 'TypeScript',
        hex: '#3178c6',
        stars: '100',
        new_stars: '10',
        timestamp: '2026-04-01 00:00',
      },
    ];

    const translatedItems = [
      {
        ...mockItems[0],
        description: '一个测试仓库',
      },
    ];

    (scraper.scrapeTrending as jest.Mock).mockResolvedValue(mockItems);
    (translator.translateDescriptions as jest.Mock).mockResolvedValue(translatedItems);
    (renderer.renderCards as jest.Mock).mockResolvedValue(['base64string1']);

    const result = await executeSkill({ time_range: 'daily' });

    expect(scraper.scrapeTrending).toHaveBeenCalledWith({ time_range: 'daily' });
    expect(translator.translateDescriptions).toHaveBeenCalledWith(mockItems);
    expect(renderer.renderCards).toHaveBeenCalledWith(translatedItems);
    expect(result.trending_cards).toEqual(['base64string1']);
  });

  it('should skip translation when translate_to_chinese is false', async () => {
    const mockItems = [
      {
        owner: 'test',
        name: 'repo',
        description: 'A test repo',
        language: 'TypeScript',
        hex: '#3178c6',
        stars: '100',
        new_stars: '10',
        timestamp: '2026-04-01 00:00',
      },
    ];

    (scraper.scrapeTrending as jest.Mock).mockResolvedValue(mockItems);
    (renderer.renderCards as jest.Mock).mockResolvedValue(['base64string1']);

    const result = await executeSkill({ time_range: 'daily', translate_to_chinese: false });

    expect(translator.translateDescriptions).not.toHaveBeenCalled();
    expect(renderer.renderCards).toHaveBeenCalledWith(mockItems);
    expect(result.trending_cards).toEqual(['base64string1']);
  });

  it('should throw an error if no items found', async () => {
    (scraper.scrapeTrending as jest.Mock).mockResolvedValue([]);

    await expect(executeSkill({ time_range: 'daily' })).rejects.toThrow('No trending items found.');
    expect(renderer.renderCards).not.toHaveBeenCalled();
  });

  it('should propagate errors from scraper', async () => {
    (scraper.scrapeTrending as jest.Mock).mockRejectedValue(new Error('Scrape error'));

    await expect(executeSkill({ time_range: 'daily' })).rejects.toThrow('Scrape error');
  });
});
