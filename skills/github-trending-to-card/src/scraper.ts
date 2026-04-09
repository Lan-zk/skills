import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import { SkillInput, TrendingItem } from './types';

// Configure axios with retries and timeout
const client = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  },
});

axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

export async function scrapeTrending(input: SkillInput): Promise<TrendingItem[]> {
  const { time_range = 'daily', language = '', spoken_language_code = '' } = input;

  // Construct URL
  const baseUrl = 'https://github.com/trending';
  const urlPath = language ? `/${encodeURIComponent(language)}` : '';
  const params = new URLSearchParams();
  if (time_range) params.append('since', time_range);
  if (spoken_language_code) params.append('spoken_language_code', spoken_language_code);

  const url = `${baseUrl}${urlPath}?${params.toString()}`;

  try {
    const response = await client.get(url);
    const $ = cheerio.load(response.data);

    const items: TrendingItem[] = [];
    const articles = $('article.Box-row').slice(0, 10);

    // Generate timestamp once per scrape — same for all 10 cards
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    for (const element of articles) {
      const $el = $(element);

      // Extract Owner and Name
      const nameNode = $el.find('h2.h3 a');
      const fullName = nameNode.text().replace(/\s+/g, '').trim();
      const slashIndex = fullName.indexOf('/');
      const owner = slashIndex > -1 ? fullName.substring(0, slashIndex) : '';
      const name = slashIndex > -1 ? fullName.substring(slashIndex + 1) : fullName;

      // Extract Description
      let description = $el.find('p').text().trim();

      if (!description) {
        // Fallback: Fetch repo page to get description
        try {
          const repoUrl = `https://github.com/${name}`;
          const repoRes = await client.get(repoUrl);
          const $repo = cheerio.load(repoRes.data);
          const about = $repo('p.f4').first().text().trim() || $repo('meta[name="description"]').attr('content') || '';
          description = about || name;
        } catch {
          description = 'No description available.';
        }
      }

      // Extract Language and Color
      const langNode = $el.find('span[itemprop="programmingLanguage"]');
      const languageText = langNode.length ? langNode.text().trim() : 'Unknown';
      const colorNode = $el.find('.repo-language-color');
      const hexMatch = colorNode.attr('style')?.match(/background-color:\s*(#[0-9a-fA-F]{3,6})/);
      const hex = hexMatch ? hexMatch[1] : '#cccccc';

      // Extract Stars
      const starLink = $el.find('a[href$="/stargazers"]');
      const stars = starLink.length ? starLink.text().trim().replace(/,/g, '') : '0';

      // Extract New Stars
      const newStarsNode = $el.find('span.float-sm-right');
      const newStarsText = newStarsNode.text().trim();
      const newStarsMatch = newStarsText.match(/([\d,]+)\s*stars today/);
      const new_stars = newStarsMatch ? newStarsMatch[1].replace(/,/g, '') : '0';

      // Extract Forks
      const forkLink = $el.find('a[href$="/network/members"]');
      const forks = forkLink.length ? forkLink.text().trim().replace(/,/g, '') : '0';

      // Fetch repo page for contributors + license
      let contributors = '—';
      let license = 'No license';
      try {
        const repoUrl = `https://github.com/${owner}/${name}`;
        const repoRes = await client.get(repoUrl);
        const $repo = cheerio.load(repoRes.data);

        // Contributors: e.g. <a href=".../graphs/contributors"><span class="text-bold">3,247</span> contributors</a>
        const contribLink = $repo('a[href$="/graphs/contributors"]').first();
        const contribMatch = contribLink.find('.text-bold').first().text().trim()
          || contribLink.clone().children().remove().end().text().trim().match(/[\d,]+/)?.[0]
          || contribLink.text().trim().match(/[\d,]+/)?.[0];
        if (contribMatch) {
          contributors = contribMatch.replace(/,/g, '');
        }

        // License: e.g. <a href=".../blob/main/LICENSE">MIT License</a>
        const licenseLink = $repo('a[href*="/blob/"][href*="LICENSE"]').first();
        if (licenseLink.length) {
          const licenseText = licenseLink.text().trim();
          license = licenseText || 'MIT License';
        } else {
          // Fallback: look for license in the about section
          const licenseFallback = $repo('span[itemprop="license"]').first().text().trim();
          if (licenseFallback) license = licenseFallback;
        }
      } catch {
        // ignore — contributors/license are optional
      }

      // Fetch owner data from GitHub API (public, no auth required)
      let ownerAvatar = '';
      let ownerRepos = '';
      let ownerFollowers = '';
      try {
        const userRes = await client.get(`https://api.github.com/users/${owner}`);
        ownerAvatar = userRes.data.avatar_url || '';
        ownerRepos = userRes.data.public_repos != null ? String(userRes.data.public_repos) : '';
        ownerFollowers = userRes.data.followers != null ? String(userRes.data.followers) : '';
      } catch {
        // ignore — owner data is optional, card falls back gracefully
      }

      items.push({
        owner,
        name,
        description,
        language: languageText,
        hex,
        stars,
        new_stars,
        forks,
        contributors,
        license,
        timestamp,
        owner_avatar: ownerAvatar,
        owner_repos: ownerRepos,
        owner_followers: ownerFollowers,
      });
    }

    return items;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to scrape GitHub trending: ${msg}`, { cause: error });
  }
}
