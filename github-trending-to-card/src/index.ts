import { SkillInput, SkillOutput } from './types';
import { scrapeTrending } from './scraper';
import { translateDescriptions } from './translator';
import { renderCards, closeBrowser } from './renderer';
import * as fs from 'fs';
import * as path from 'path';

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

    // 2. Translate descriptions (if enabled)
    const translatedItems =
      input.translate_to_chinese !== false
        ? await translateDescriptions(trendingItems)
        : trendingItems;

    // 3. Render cards
    const trending_cards = await renderCards(translatedItems);

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
    const outputDir = path.resolve(__dirname, '../output');
    fs.mkdirSync(outputDir, { recursive: true });

    try {
      const result = await executeSkill({ time_range: 'daily' });
      console.log(`Successfully generated ${result.trending_cards.length} cards.`);

      for (let i = 0; i < result.trending_cards.length; i++) {
        const filePath = path.join(outputDir, `card-${String(i + 1).padStart(2, '0')}.png`);
        fs.writeFileSync(filePath, Buffer.from(result.trending_cards[i], 'base64'));
        console.log(`  Saved: ${filePath}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      await closeBrowser();
    }
  })();
}
