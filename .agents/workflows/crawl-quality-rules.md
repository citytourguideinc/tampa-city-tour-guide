---
description: Crawl quality rules — how to ensure accurate dates, good titles, and clean data for the City Tour Guide trusted_items table
---

# City Tour Guide — Crawl Quality Rules

These rules define how the crawler and extractor should behave to produce clean, accurate, useful data.

## Date Extraction Rules

The extractor uses a 3-layer priority system (`lib/extractor.js`):

1. **JSON-LD `startDate`** — highest confidence. Used for EventBrite, WordPress Events Calendar, Schema.org structured data
2. **`<time datetime="...">` tag** — used for most modern CMS platforms
3. **Text regex on TRUNCATED HTML** — fallback. HTML is truncated before any of these section markers before scanning:
   - "related events", "upcoming events", "you may also like", "more events", "similar events", "other events"

> **Rule:** If a date is extracted from layer 3 (text regex), verify it's plausible relative to the page title. Dates more than 6 months in the past are suspicious.

## Data Integrity Rules

### When to KEEP a record
- Has a clear event title (not an archive/category page)
- Has a future `event_date` OR `event_date IS NULL` for evergreen content
- URL is a direct event or venue page, not a paginated index

### When to DELETE a record
- `event_date` is more than 30 days in the past (for event-type records)
- Title matches junk patterns: "Archives", "Page N", "All Events", "Newsletter", "Monday Morning Memo", "Meet the Team"
- URL contains: `/page/\d+/`, `?paged=\d+`, `/wp-json/`, `/feed/`, `/about-us/`, `/leadership/`, `/history/`
- Source is a non-Tampa Viator record (wrong geography)

### Recurring Events
- Recurring events (same title, multiple dates) are **kept as separate records**
- Search API `pickBetter()` surfaces only the nearest upcoming occurrence per title/source
- Use `fix-source-dates.mjs --domain=example.com` to correct dates after adding a new source

## Running Date Fix After New Source Added

```bash
# Fix a single source
node scripts/fix-source-dates.mjs --domain=tampasdowntown.com

# Fix all sources at once (after extractor upgrades)
node scripts/fix-source-dates.mjs --all
```

## Viator Data Rules

- Viator records must ONLY contain Tampa, FL tours
- Tampa destination ID: `732` in Viator Partner API v2
- If Viator returns non-Tampa results (e.g. Edinburgh), delete and re-seed:
  ```bash
  # Delete all Viator records
  supabase: DELETE FROM trusted_items WHERE source_name = 'Viator';
  # Re-seed
  node scripts/seed-viator.mjs
  ```
- Verify product titles contain "Tampa", "St. Pete", "Ybor", or "Gulf" before inserting

## Search Display Rules

### Grouping Hierarchy
- **No category filter active**: group results by **Category** (Events, Food, Arts, etc.)
- **Category filter active**: group results by **Source** within that category
- **Future: neighborhood filter**: group by **Neighborhood → Category → Date**

### Filtering Past Events
- Events with `event_date < today` are hidden from search results
- Exception: items with `category` in `['Discovery', 'News', 'Community']` with `event_date = null` are always shown
- Do NOT show Discovery items with a very old `event_date` (pre-2026)

## Search API Quality Gates (`app/api/search/route.js`)

The 4-pass deduplication pipeline:

| Pass | What it does |
|---|---|
| Pass 1 | Remove junk archive/index pages by title and URL pattern |
| Pass 2 | Remove past events (keep news/discovery regardless of date) |
| Pass 3 | Dedup by base URL (strip `?occurrence=` params) |
| Pass 4 | Dedup by source + normalized title, keeping nearest upcoming date |

## Adding a New Source

1. Add source config to `lib/trusted-sources.json`
2. Run `node scripts/validate-and-crawl.mjs` to dry-run first
3. Review extracted sample (check dates, titles, categories)
4. Run live crawl (omit `--dry-run`)
5. Approve results in `/admin → Items`
6. Run `node scripts/fix-source-dates.mjs --domain=newsource.com` to correct any bad dates
