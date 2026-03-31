export type TimeRange = 'daily' | 'weekly' | 'monthly';

export interface SkillInput {
  time_range?: TimeRange;
  language?: string;
  spoken_language_code?: string;
}

export interface SkillOutput {
  trending_cards: string[]; // Base64 encoded PNG images
}

export interface TrendingItem {
  name: string;
  description: string;
  language: string;
  hex: string;
  stars: string;
  new_stars: string;
}
