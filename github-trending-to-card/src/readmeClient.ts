import axios from 'axios';

export interface ReadmeClient {
  fetchReadme(owner: string, name: string): Promise<string>;
}

const README_MAX_BYTES = 4096;

export function createReadmeClient(): ReadmeClient {
  return {
    async fetchReadme(owner: string, name: string): Promise<string> {
      const branches = ['main', 'master'];
      for (const branch of branches) {
        try {
          const url = `https://github.com/${owner}/${name}/raw/${branch}/README.md`;
          const res = await axios.get<string>(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'github-trending-to-card/1.0' },
            responseType: 'text',
            // No maxContentLength — truncate after receiving to avoid error on large READMEs
          });
          return res.data.slice(0, README_MAX_BYTES);
        } catch {
          // try next branch
        }
      }
      return '';
    },
  };
}
