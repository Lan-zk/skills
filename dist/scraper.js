"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeTrending = scrapeTrending;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const cheerio = __importStar(require("cheerio"));
// Configure axios with retries and timeout
const client = axios_1.default.create({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
});
(0, axios_retry_1.default)(client, {
    retries: 3,
    retryDelay: axios_retry_1.default.exponentialDelay,
});
/**
 * Mock LLM function for summarizing missing descriptions or translating.
 * In a real OpenClaw skill environment, this would call the provided LLM service.
 */
async function mockLlmProcess(text, task) {
    // Mocking the LLM behavior
    if (task === 'summarize') {
        return `[Summarized] ${text.substring(0, 50)}...`;
    }
    return `[Translated] ${text}`;
}
async function scrapeTrending(input) {
    const { time_range = 'daily', language = '', spoken_language_code = '' } = input;
    // Construct URL
    const baseUrl = 'https://github.com/trending';
    const urlPath = language ? `/${encodeURIComponent(language)}` : '';
    const params = new URLSearchParams();
    if (time_range)
        params.append('since', time_range);
    if (spoken_language_code)
        params.append('spoken_language_code', spoken_language_code);
    const url = `${baseUrl}${urlPath}?${params.toString()}`;
    try {
        const response = await client.get(url);
        const $ = cheerio.load(response.data);
        const items = [];
        const articles = $('article.Box-row').slice(0, 10);
        for (const element of articles) {
            const $el = $(element);
            // Extract Name
            const nameNode = $el.find('h2.h3 a');
            const name = nameNode.text().replace(/\s+/g, '').trim();
            // Extract Description
            let description = $el.find('p').text().trim();
            if (!description) {
                // Fallback: Fetch repo page to get description
                try {
                    const repoUrl = `https://github.com/${name}`;
                    const repoRes = await client.get(repoUrl);
                    const $repo = cheerio.load(repoRes.data);
                    const about = $repo('p.f4').first().text().trim() || $repo('meta[name="description"]').attr('content') || '';
                    description = await mockLlmProcess(about || name, 'summarize');
                }
                catch {
                    description = 'No description available.';
                }
            }
            else {
                // Translate using mock LLM
                description = await mockLlmProcess(description, 'translate');
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
            items.push({
                name,
                description,
                language: languageText,
                hex,
                stars,
                new_stars,
            });
        }
        return items;
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to scrape GitHub trending: ${msg}`, { cause: error });
    }
}
