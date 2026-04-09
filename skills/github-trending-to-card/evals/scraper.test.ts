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

const client = axios.create();

describe('scraper.ts - scrapeTrending', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  // Helper: build mock implementation based on URL pattern
  const withUserApi = (
    mockHtml: string,
    opts: {
      repoHtml?: string;
      ownerData?: { avatar_url: string; public_repos: number; followers: number };
      repoPageError?: boolean;
      ownerApiError?: boolean;
    } = {},
  ) => {
    (client.get as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/trending')) {
        return { data: mockHtml };
      }
      if (url.includes('/api.github.com/users/')) {
        if (opts.ownerApiError) throw new Error('User not found');
        return {
          data: opts.ownerData ?? {
            avatar_url: 'https://avatars.githubusercontent.com/u/123',
            public_repos: 100,
            followers: 500,
          },
        };
      }
      // Repo page — match both /{name} and /{owner}/{name}
      if (url.match(/\/github\.com\/[^/]+\/?[^/]*$/)) {
        if (opts.repoPageError) throw new Error('Repo page error');
        return { data: opts.repoHtml ?? '<html><body></body></html>' };
      }
      throw new Error('Unexpected URL: ' + url);
    });
  };

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

    withUserApi(mockHtml);

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
    expect(items[0].owner_avatar).toBe('https://avatars.githubusercontent.com/u/123');
    expect(items[0].owner_repos).toBe('100');
    expect(items[0].owner_followers).toBe('500');
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

    withUserApi(mockHtml, { repoHtml: mockRepoHtml });

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

    withUserApi(mockHtml);

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

    withUserApi(mockHtml, { repoPageError: true });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items.length).toBe(1);
    expect(items[0].description).toBe('No description available.');
  });

  it('should scrape contributors and license from repo page', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/foo/bar">foo / bar</a></h2>
          <p>Desc</p>
          <span itemprop="programmingLanguage">Go</span>
          <span class="repo-language-color" style="background-color:#00ADD8"></span>
          <a href="/foo/bar/stargazers">500</a>
          <span class="float-sm-right">10 stars today</span>
        </article>
      </body></html>
    `;

    const mockRepoHtml = `
      <html><body>
        <a href="/foo/bar/graphs/contributors">
          <span class="text-bold">1,234</span> contributors
        </a>
        <a href="/foo/bar/blob/main/LICENSE">Apache-2.0 License</a>
      </body></html>
    `;

    withUserApi(mockHtml, { repoHtml: mockRepoHtml });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items[0].contributors).toBe('1234');
    expect(items[0].license).toBe('Apache-2.0 License');
  });

  it('should use license fallback when no LICENSE link found', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/baz/qux">baz / qux</a></h2>
          <p>Desc</p>
          <span itemprop="programmingLanguage">Rust</span>
          <span class="repo-language-color" style="background-color:#dea584"></span>
          <a href="/baz/qux/stargazers">200</a>
          <span class="float-sm-right">5 stars today</span>
        </article>
      </body></html>
    `;

    const mockRepoHtml = `
      <html><body>
        <a href="/baz/qux/graphs/contributors">
          <span class="text-bold">500</span> contributors
        </a>
        <span itemprop="license">GPL-3.0</span>
      </body></html>
    `;

    withUserApi(mockHtml, { repoHtml: mockRepoHtml });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items[0].license).toBe('GPL-3.0');
  });

  it('should default contributors and license when repo page fails', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/fail/repo">fail / repo</a></h2>
          <p>Desc</p>
          <span itemprop="programmingLanguage">Python</span>
          <span class="repo-language-color" style="background-color:#3572A5"></span>
          <a href="/fail/repo/stargazers">99</a>
          <span class="float-sm-right">2 stars today</span>
        </article>
      </body></html>
    `;

    withUserApi(mockHtml, { repoPageError: true });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items[0].contributors).toBe('—');
    expect(items[0].license).toBe('No license');
  });

  it('should fall back gracefully when GitHub API fails for owner data', async () => {
    const mockHtml = `
      <html><body>
        <article class="Box-row">
          <h2 class="h3"><a href="/org/secret">org / secret</a></h2>
          <p>Private org project</p>
          <span itemprop="programmingLanguage">TypeScript</span>
          <span class="repo-language-color" style="background-color:#3178c6"></span>
          <a href="/org/secret/stargazers">99</a>
          <span class="float-sm-right">1 star today</span>
        </article>
      </body></html>
    `;

    withUserApi(mockHtml, { ownerApiError: true });

    const items = await scrapeTrending({ time_range: 'daily' });

    expect(items.length).toBe(1);
    expect(items[0].owner_avatar).toBe('');
    expect(items[0].owner_repos).toBe('');
    expect(items[0].owner_followers).toBe('');
  });

  it('should throw an error when request fails', async () => {
    (client.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(scrapeTrending({})).rejects.toThrow('Failed to scrape GitHub trending: Network error');
  });
});
