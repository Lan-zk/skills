export type TimeRange = 'daily' | 'weekly' | 'monthly';

export interface SkillInput {
  time_range?: TimeRange;
  language?: string;
  spoken_language_code?: string;
  translate_to_chinese?: boolean; // default: true
}

export interface SkillOutput {
  trending_cards: string[]; // Base64 encoded PNG images
}

export interface TrendingItem {
  owner: string;
  name: string;
  description: string;
  language: string;
  hex: string;
  stars: string;
  new_stars: string;
  forks: string;
  contributors: string;
  license: string;
  timestamp: string;
  /** GitHub API /users/{owner} */
  owner_avatar?: string;
  owner_repos?: string;
  owner_followers?: string;
}
