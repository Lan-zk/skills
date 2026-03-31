"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSkill = executeSkill;
const scraper_1 = require("./scraper");
const renderer_1 = require("./renderer");
/**
 * Main entry point for the GitHub Trending to Card OpenClaw Skill.
 *
 * @param input - Skill input parameters
 * @returns SkillOutput containing base64 encoded PNG images
 */
async function executeSkill(input) {
    try {
        // 1. Scrape data
        const trendingItems = await (0, scraper_1.scrapeTrending)(input);
        if (trendingItems.length === 0) {
            throw new Error('No trending items found.');
        }
        // 2. Render cards
        const trending_cards = await (0, renderer_1.renderCards)(trendingItems);
        return {
            trending_cards,
        };
    }
    catch (error) {
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
        }
        catch (e) {
            console.error(e);
        }
        finally {
            await (0, renderer_1.closeBrowser)();
        }
    })();
}
