# GitHub Trending to Card — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the GitHub Trending to Card skill by removing the mock LLM layer and updating the SKILL.md to reflect the final API-only implementation.

**Architecture:** The pipeline is already implemented across 4 source files. The primary changes are: (1) strip the LLM wrapper from the scraper so it returns raw description text, (2) fix test expectations, (3) update SKILL.md.

**Tech Stack:** TypeScript, axios, cheerio, axios-retry, handlebars, playwright, jest

---

## Gap Analysis

| Spec Requirement | Current Status |
|-----------------|---------------|
| Raw description (no LLM translation) | ❌ Mock LLM wraps all descriptions |
| Raw description on fallback | ❌ Mock `[Summarized]` prefix instead of returning raw meta text |
| SKILL.md reflects actual behavior | ❌ References "AI translation" capability not implemented |
| All tests pass with 80% coverage | ⚠️ Tests expect LLM prefixes |
| Precommit passes | ⚠️ Will fail until above is fixed |

---

## File Map

```
github-trending-to-card/
├── SKILL.md                   # Modify: update description, remove LLM references
├── src/
│   ├── index.ts               # Already correct — no changes needed
│   ├── scraper.ts             # Modify: remove mockLlmProcess, return raw text
│   ├── renderer.ts            # Already correct — no changes needed
│   └── types.ts               # Already correct — no changes needed
├── templates/
│   └── card.html              # Already correct — no changes needed
└── evals/
    ├── scraper.test.ts        # Modify: remove [Translated]/[Summarized] expectations
    ├── renderer.test.ts       # Already correct — no changes needed
    └── index.test.ts          # Already correct — no changes needed
```

---

## Tasks

### Task 1: Remove mock LLM from scraper.ts

**Files:**
- Modify: `github-trending-to-card/src/scraper.ts`

**Current behavior:** Every description gets passed through `mockLlmProcess()` which wraps text with `[Translated]` or `[Summarized]` prefixes.

**Target behavior:** Return raw description text as-is from the trending page or the fallback source. The calling Agent handles translation.

- [ ] **Step 1: Read the current scraper.ts to confirm exact line positions**

- [ ] **Step 2: Remove the mockLlmProcess function**

Delete this entire function from `scraper.ts`:
```typescript
async function mockLlmProcess(text: string, task: 'summarize' | 'translate'): Promise<string> {
  // Mocking the LLM behavior
  if (task === 'summarize') {
    return `[Summarized] ${text.substring(0, 50)}...`;
  }
  return `[Translated] ${text}`;
}
```

- [ ] **Step 3: Remove mockLlmProcess call from the description branch**

Change the description handling in `scrapeTrending` from:
```typescript
// Translate using mock LLM
description = await mockLlmProcess(description, 'translate');
```
To:
```typescript
// No LLM translation — return raw description text
```

- [ ] **Step 4: Remove mockLlmProcess call from the fallback branch**

Change from:
```typescript
description = await mockLlmProcess(about || name, 'summarize');
```
To:
```typescript
description = about || name;
```

- [ ] **Step 5: Verify the function still compiles**

Run: `npx tsc --noEmit src/scraper.ts`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add github-trending-to-card/src/scraper.ts
git commit -m "fix: remove mock LLM wrapper, return raw description text"
```

---

### Task 2: Fix scraper tests for raw description expectations

**Files:**
- Modify: `github-trending-to-card/evals/scraper.test.ts`

The tests currently expect `[Translated]` and `[Summarized]` prefixes. Update them to expect raw text.

- [ ] **Step 1: Update test "should scrape basic trending data"**

Change the expected description from:
```typescript
description: '[Translated] A great project',
```
To:
```typescript
description: 'A great project',
```

- [ ] **Step 2: Update test "should handle missing description via fallback"**

Change the expected description from:
```typescript
expect(items[0].description).toBe('[Summarized] This is from repo page meta...');
```
To:
```typescript
expect(items[0].description).toBe('This is from repo page meta');
```

- [ ] **Step 3: Update test "should handle missing fields gracefully"**

Change the expected description from:
```typescript
description: '[Translated] Has desc',
```
To:
```typescript
description: 'Has desc',
```

- [ ] **Step 4: Verify all scraper tests pass**

Run: `npm run test -- --testPathPattern=scraper.test.ts`
Expected: All 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add github-trending-to-card/evals/scraper.test.ts
git commit -m "test: update scraper tests for raw description output"
```

---

### Task 3: Update SKILL.md to reflect final implementation

**Files:**
- Modify: `github-trending-to-card/SKILL.md`

The current SKILL.md mentions AI translation which is not implemented. Update it to accurately describe the API-only skill.

- [ ] **Step 1: Read current SKILL.md**

- [ ] **Step 2: Rewrite the description section**

Replace the current description (which incorrectly mentions AI translation) with:

```markdown
## Description

This skill automates the process of converting GitHub's trending open-source repositories into high-quality PNG images. It is completely stateless and handles the entire pipeline:

1. **Data Scraping**: Fetches the top 10 trending repositories based on optional time range and language filters.
2. **Description Fallback**: When a repository has no description on the trending page, fetches the repo page for meta description.
3. **Rendering & Export**: Injects the data into an HTML/CSS template and uses headless Chromium to export it as high-resolution PNGs (Base64 encoded).

**Note:** The skill returns raw description text. Translation/enrichment is handled by the invoking Agent.
```

- [ ] **Step 3: Commit**

```bash
git add github-trending-to-card/SKILL.md
git commit -m "docs: update SKILL.md, remove LLM references, clarify description fallback"
```

---

### Task 4: Full verification — run precommit

**Files:**
- No modifications — verification only

- [ ] **Step 1: Run full precommit check**

Run: `npm run precommit`
Location: `github-trending-to-card/`

Expected output: lint passes, type-check passes, all tests pass, build succeeds.

If coverage threshold fails: investigate which lines are uncovered and add targeted tests or document why they're excluded.

- [ ] **Step 2: Push to remote**

```bash
git push
```

---

## Spec Coverage Checklist

| Spec Section | Implemented By |
|-------------|---------------|
| Step 1: Data Scraping (axios + cheerio) | `src/scraper.ts` (already done, Task 1 confirms raw output) |
| Step 2: Description Fallback | `src/scraper.ts` (already done, Task 1 removes LLM wrapper) |
| Step 3: Card Rendering (Playwright) | `src/renderer.ts` (already done) |
| Data model interfaces | `src/types.ts` (already done) |
| Error handling (throw, don't swallow) | `src/scraper.ts`, `src/renderer.ts`, `src/index.ts` (already done) |
| Template slots | `templates/card.html` (already done) |
| Unit tests for scraper | `evals/scraper.test.ts` (Task 2 fixes) |
| Unit tests for renderer | `evals/renderer.test.ts` (already done) |
| Integration test | `evals/index.test.ts` (already done) |
| SKILL.md accuracy | Task 3 |
