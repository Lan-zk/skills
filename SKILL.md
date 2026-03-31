---
name: github-trending-to-card
description: Fetches the latest GitHub Trending data and generates high-resolution, visually appealing PNG cards for each trending repository. Use this skill when you need to create shareable images of GitHub open-source trends for social media or content operations.
---

# GitHub Trending to Card Generator

## Description

This skill automates the process of converting GitHub's trending open-source repositories into high-quality PNG images. It is completely stateless and handles the entire pipeline:

1. **Data Scraping**: Fetches the top 10 trending repositories based on optional time range and language filters.
2. **Data Zoning**: Injects the scraped data into an aesthetic HTML/CSS template.
3. **Rendering & Export**: Uses headless Chromium to render the template and export it as high-resolution PNGs (Base64 encoded).

## When to Use

- When a user asks to see what's trending on GitHub in a visual format.
- When you need to generate images for a daily/weekly open-source newsletter.
- When you need to summarize and translate trending repository descriptions for Chinese audiences (simulated).

## Usage

Pass a `SkillInput` object to the entry function.

### Inputs

- `time_range` (String): The time dimension for the trending list (`daily`, `weekly`, `monthly`). Default: `daily`.
- `language` (String): Optional. Programming language filter (e.g., `python`, `javascript`).
- `spoken_language_code` (String): Optional. Natural language filter (e.g., `zh`, `en`).

### Outputs

Returns an object containing:
- `trending_cards` (Array of Strings): 10 Base64-encoded PNG image strings.
