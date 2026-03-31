import { executeSkill } from '../src/index';
import * as scraper from '../src/scraper';
import * as renderer from '../src/renderer';

jest.mock('../src/scraper');
jest.mock('../src/renderer');

describe('index.ts - executeSkill', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully execute skill and return cards', async () => {
    const mockItems = [
      {
        name: 'test/repo',
        description: 'A test repo',
        language: 'TypeScript',
        hex: '#3178c6',
        stars: '100',
        new_stars: '10',
      }
    ];

    (scraper.scrapeTrending as jest.Mock).mockResolvedValue(mockItems);
    (renderer.renderCards as jest.Mock).mockResolvedValue(['base64string1']);

    const result = await executeSkill({ time_range: 'daily' });

    expect(scraper.scrapeTrending).toHaveBeenCalledWith({ time_range: 'daily' });
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
