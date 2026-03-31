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
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCards = renderCards;
exports.closeBrowser = closeBrowser;
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handlebars = __importStar(require("handlebars"));
let browserInstance = null;
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await playwright_1.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
    return browserInstance;
}
async function renderCards(items) {
    const templatePath = path.resolve(__dirname, '../templates/card.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateHtml);
    const browser = await getBrowser();
    const context = await browser.newContext({
        deviceScaleFactor: 2,
        viewport: { width: 850, height: 400 },
    });
    const base64Images = [];
    try {
        for (const item of items) {
            const html = template(item);
            const page = await context.newPage();
            await page.setContent(html, { waitUntil: 'networkidle' });
            // Wait for fonts if any, or just a tiny bit for render
            await page.waitForTimeout(100);
            const cardElement = await page.$('.card-container');
            if (cardElement) {
                const buffer = await cardElement.screenshot({ type: 'png' });
                base64Images.push(buffer.toString('base64'));
            }
            else {
                throw new Error('Card container not found in rendered HTML');
            }
            await page.close();
        }
    }
    finally {
        await context.close();
        // We intentionally keep the browser instance alive for subsequent skill invocations.
        // In a real serverless env, we might need to close it if the process dies.
    }
    return base64Images;
}
async function closeBrowser() {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}
