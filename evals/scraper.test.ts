import axios from 'axios';
import { scrapeTrending } from '../src/scraper';

jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
    isAxiosError: jest.fn(),
  };
});

// Import the mocked instance so we can configure it
const client = axios.create();

describe('scraper.ts - scrapeTrending', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should scrape basic trending data', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/owner/repo">owner / repo</a></h2>
          <p>A great project</p>
          <span itemprop="programmingLanguage">TypeScript</span>
          <span class="repo-language-color" style="background-color: #3178c6;"></span>
          <a href="/owner/repo/stargazers">1,234</a>
          <span class="float-sm-right">100 stars today</span>
        </article>
      </body></html>
    `;

    (client.get as jest.Mock).mockResolvedValue({ data: mockHtml });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({
      owner: 'owner',
      name: 'repo',
      description: 'A great project',
      language: 'TypeScript',
      hex: '#3178c6',
      stars: '1234',
      new_stars: '100',
    });
    expect(items[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('should handle missing description via fallback', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/owner/repo-no-desc">owner / repo-no-desc</a></h2>
          <span itemprop="programmingLanguage">JavaScript</span>
          <span class="repo-language-color" style="background-color: #f1e05a;"></span>
          <a href="/owner/repo-no-desc/stargazers">5,000</a>
          <span class="float-sm-right">50 stars today</span>
        </article>
      </body></html>
    `;

    const mockRepoHtml = `
      <html><body>
        <meta name="description" content="This is from repo page meta">
      </body></html>
    `;

    (client.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockHtml }) // trending page
      .mockResolvedValueOnce({ data: mockRepoHtml }); // repo page

    const items = await scrapeTrending({ time_range: 'weekly' });

    expect(items.length).toBe(1);
    expect(items[0].description).toBe('This is from repo page meta');
    expect(items[0].owner).toBe('owner');
    expect(items[0].name).toBe('repo-no-desc');
  });

  it('should handle missing fields gracefully', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/owner/repo-empty">owner / repo-empty</a></h2>
          <p>Has desc</p>
        </article>
      </body></html>
    `;

    (client.get as jest.Mock).mockResolvedValueOnce({ data: mockHtml });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items.length).toBe(1);
    expect(items[0]).toMatchObject({
      owner: 'owner',
      name: 'repo-empty',
      description: 'Has desc',
      language: 'Unknown',
      hex: '#cccccc',
      stars: '0',
      new_stars: '0',
    });
    expect(items[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('should handle error without message', async () => {
    (client.get as jest.Mock).mockRejectedValue('String error');

    await expect(scrapeTrending({})).rejects.toThrow('Failed to scrape GitHub trending: String error');
  });

  it('should handle missing description fallback error', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/owner/repo-fail">owner / repo-fail</a></h2>
        </article>
      </body></html>
    `;

    (client.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockHtml }) // trending page
      .mockRejectedValueOnce(new Error('Repo page error')); // repo page

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items.length).toBe(1);
    expect(items[0].description).toBe('No description available.');
  });

  it('should throw an error when request fails', async () => {
    (client.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(scrapeTrending({})).rejects.toThrow('Failed to scrape GitHub trending: Network error');
  });
});
