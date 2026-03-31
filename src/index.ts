import { SkillInput, SkillOutput } from './types';
import { scrapeTrending } from './scraper';
import { renderCards, closeBrowser } from './renderer';

/**
 * Main entry point for the GitHub Trending to Card OpenClaw Skill.
 *
 * @param input - Skill input parameters
 * @returns SkillOutput containing base64 encoded PNG images
 */
export async function executeSkill(input: SkillInput): Promise<SkillOutput> {
  try {
    // 1. Scrape data
    const trendingItems = await scrapeTrending(input);
    
    if (trendingItems.length === 0) {
      throw new Error('No trending items found.');
    }

    // 2. Render cards
    const trending_cards = await renderCards(trendingItems);

    return {
      trending_cards,
    };
  } catch (error: unknown) {
    console.error('Skill execution failed:', error);
    throw error;
  }
}

/* istanbul ignore if */
if (require.main === module) {
  (async () => {
    try {
      const result = await executeSkill({ time_range: 'daily' });
      console.log(`Successfully generated ${result.trending_cards.length} cards.`);
    } catch (e) {
      console.error(e);
    } finally {
      await closeBrowser();
    }
  })();
}
