import axios from 'axios';

export interface ReadmeClient {
  fetchReadme(owner: string, name: string): Promise<string>;
}

const README_MAX_BYTES = 4096;

export function createReadmeClient(): ReadmeClient {
  return {
    async fetchReadme(owner: string, name: string): Promise<string> {
      try {
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'github-trending-to-card/1.0',
        };
        const token = process.env.GITHUB_TOKEN;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await axios.get(
          `https://api.github.com/repos/${owner}/${name}/readme`,
          { timeout: 8000, headers },
        );
        const data = res.data as { content?: string; encoding?: string };
        if (!data.content || data.encoding !== 'base64') return '';

        const raw = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
        return raw.slice(0, README_MAX_BYTES);
      } catch {
        return '';
      }
    },
  };
}
