---
name: github-trending-to-card
description: Fetches the latest GitHub Trending data and generates high-resolution, visually appealing PNG cards for each trending repository. Use this skill when you need to create shareable images of GitHub open-source trends for social media or content operations.
---

# GitHub Trending to Card Generator

## Description

This skill automates the process of converting GitHub's trending open-source repositories into high-quality PNG images. It is completely stateless and handles the entire pipeline:

1. **Data Scraping**: Fetches the top 10 trending repositories based on optional time range and language filters.
2. **Description Fallback**: When a repository has no description on the trending page, fetches the repo page for meta description.
3. **AI Intro**: Fetches each project's README, uses LLM to generate a concise Chinese project analysis (problem solved + solution approach).
4. **Translation**: Translates project descriptions to Chinese via LLM.
5. **Rendering & Export**: Injects the data into an HTML/CSS template and uses headless Chromium to export it as high-resolution PNGs (Base64 encoded).
6. **Markdown Export**: Generates one `.md` file per project in the same output folder, containing project name, URL, translated description, and AI analysis.

## When to Use

- When a user asks to see what's trending on GitHub in a visual format.
- When you need to generate images for a daily/weekly open-source newsletter.
- When you need high-quality GitHub trending cards for social media or content distribution.

## Usage

Pass a `SkillInput` object to the entry function.

### Inputs

- `time_range` (String): The time dimension for the trending list (`daily`, `weekly`, `monthly`). Default: `daily`.
- `language` (String): Optional. Programming language filter (e.g., `python`, `javascript`).
- `spoken_language_code` (String): Optional. Natural language filter (e.g., `zh`, `en`).
- `template` (String): Optional. Card template to use. `card` (default) uses the editorial magazine style; `jojo-card` uses a JOJO Stand Panel aesthetic with radar chart and A-E grading.

### Outputs

Returns an object containing:
- `trending_cards` (Array of Strings): 10 Base64-encoded PNG image strings.
- `markdown_files` (Array of Strings, optional): Absolute paths to generated markdown files. Present only when `outputDir` is passed to `executeSkill`.
