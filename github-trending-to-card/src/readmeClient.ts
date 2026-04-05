import axios from 'axios';

export interface ReadmeClient {
  fetchReadme(owner: string, name: string): Promise<string>;
}

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
            maxContentLength: 4096,
          });
          return res.data.slice(0, 4096);
        } catch {
          // try next branch
        }
      }
      return '';
    },
  };
}
