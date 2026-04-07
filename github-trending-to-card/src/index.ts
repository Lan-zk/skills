import { SkillInput, SkillOutput, TemplateName } from './types';
import { scrapeTrending } from './scraper';
import { summarizeReadmes } from './summarizer';
import { translateDescriptions } from './translator';
import { renderCards, closeBrowser } from './renderer';
import { writeMarkdownFiles } from './markdownWriter';
import * as fs from 'fs';
import * as path from 'path';

/** Parse CLI args: --since daily|weekly|monthly, --template card|jojo-card, --no-translate */
function parseCliArgs(): Partial<SkillInput> {
  const args = process.argv.slice(2);
  const input: Partial<SkillInput> = { time_range: 'daily' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--since' && args[i + 1]) {
      const val = args[++i];
      if (['daily', 'weekly', 'monthly'].includes(val)) {
        input.time_range = val as SkillInput['time_range'];
      }
    } else if (arg === '--template' && args[i + 1]) {
      const val = args[++i];
      if (['card', 'jojo-card'].includes(val)) {
        input.template = val as TemplateName;
      }
    } else if (arg === '--no-translate') {
      input.translate_to_chinese = false;
    }
  }
  return input;
}

/**
 * Main entry point for the GitHub Trending to Card OpenClaw Skill.
 *
 * @param input - Skill input parameters
 * @returns SkillOutput containing base64 encoded PNG images
 */
export async function executeSkill(
  input: SkillInput,
  outputDir?: string,
): Promise<SkillOutput> {
  try {
    // 1. Scrape data
    const trendingItems = await scrapeTrending(input);

    if (trendingItems.length === 0) {
      throw new Error('No trending items found.');
    }

    // 2. Generate AI project intro from README
    const summarizedItems = await summarizeReadmes(trendingItems);

    // 3. Translate descriptions
    const translatedItems =
      input.translate_to_chinese !== false
        ? await translateDescriptions(summarizedItems)
        : summarizedItems;

    // 4. Render cards
    const templateName: TemplateName = input.template || 'card';
    const trending_cards = await renderCards(translatedItems, templateName);

    // 5. Save outputs to disk if outputDir is provided
    let markdown_files: string[] | undefined;
    if (outputDir) {
      fs.mkdirSync(outputDir, { recursive: true });
      for (let i = 0; i < trending_cards.length; i++) {
        const pngPath = path.join(
          outputDir,
          `card-${String(i + 1).padStart(2, '0')}.png`,
        );
        fs.writeFileSync(pngPath, Buffer.from(trending_cards[i], 'base64'));
      }
      markdown_files = writeMarkdownFiles(translatedItems, outputDir);
    }

    return {
      trending_cards,
      ...(markdown_files ? { markdown_files } : {}),
    };
  } catch (error: unknown) {
    console.error('Skill execution failed:', error);
    throw error;
  }
}

/* istanbul ignore if */
if (require.main === module) {
  (async () => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const outputDir = path.resolve(__dirname, `../output/${dateStr}`);

    try {
      const cliInput = parseCliArgs();
    const result = await executeSkill(cliInput, outputDir);
    console.log(`[${cliInput.time_range}] Successfully generated ${result.trending_cards.length} cards.`);
      for (let i = 0; i < result.trending_cards.length; i++) {
        const filePath = path.join(outputDir, `card-${String(i + 1).padStart(2, '0')}.png`);
        console.log(`  PNG: ${filePath}`);
      }
      if (result.markdown_files) {
        for (const mdPath of result.markdown_files) {
          console.log(`  MD:  ${mdPath}`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      await closeBrowser();
    }
  })();
}
