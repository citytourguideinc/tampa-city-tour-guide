// components/SourceGroup.js — Source card with category tabs inside
'use client';
import { useState } from 'react';
import styles from './SourceGroup.module.css';

const PREVIEW_PER_CAT = 2; // show 2 items per category initially

const NEWS_CATS = ['discovery', 'news', 'community'];

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function cleanTitle(title, sourceName) {
  if (!title) return 'Untitled';
  const word = (sourceName || '').split(' ')[0];
  return title
    .replace(new RegExp(`\\s*[-–|·]\\s*${word}.*$`, 'i'), '')
    .replace(/\s*[-–|·]\s*(Tampa|Downtown|Partnership|Inc).*$/i, '')
    .trim() || title;
}

function trackClick(item) {
  if (typeof gtag === 'function') {
    gtag('event', 'listing_click', {
      item_title: item.title, category: item.category,
      source_name: item.source_name, listing_type: item.listing_type || 'standard',
    });
  }
}

export default function SourceGroup({ sourceName, domain, categories = {}, items = [] }) {
  const [activeCat, setActiveCat] = useState(null); // null = show all categories preview
  const [expanded, setExpanded] = useState(false);

  const catEntries = Object.entries(categories).sort(([,a],[,b]) => b.length - a.length);
  const totalCount = items.length;

  // If a category tab is selected, show only that category's items
  // Otherwise show PREVIEW_PER_CAT items from each category
  let visibleItems;
  if (activeCat) {
    const catItems = categories[activeCat] || [];
    visibleItems = expanded ? catItems : catItems.slice(0, 5);
  } else {
    // Show first 2 from each category (preview mode)
    visibleItems = [];
    for (const [, catItems] of catEntries) {
      visibleItems.push(...catItems.slice(0, PREVIEW_PER_CAT));
    }
  }

  const showExpandBtn = activeCat
    ? (categories[activeCat]?.length || 0) > 5
    : totalCount > visibleItems.length;

  return (
    <div className={styles.card}>
      {/* ── Source header ─────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.sourceName}>{sourceName}</span>
        <span className={styles.count}>{totalCount}</span>
      </div>

      {/* ── Category tabs ─────────────────────────────── */}
      {catEntries.length > 1 && (
        <div className={styles.catTabs}>
          <button
            className={`${styles.catTab} ${!activeCat ? styles.catTabActive : ''}`}
            onClick={() => { setActiveCat(null); setExpanded(false); }}
          >
            All <span className={styles.catTabCount}>{totalCount}</span>
          </button>
          {catEntries.map(([cat, catItems]) => (
            <button
              key={cat}
              className={`${styles.catTab} ${activeCat === cat ? styles.catTabActive : ''}`}
              onClick={() => { setActiveCat(activeCat === cat ? null : cat); setExpanded(false); }}
            >
              {cat} <span className={styles.catTabCount}>{catItems.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Single category — just show the badge inline */}
      {catEntries.length === 1 && (
        <div className={styles.catSingle}>
          <span className={`${styles.categoryBadge} ${NEWS_CATS.some(c => catEntries[0][0].toLowerCase().includes(c)) ? styles.newsBadge : ''}`}>
            {catEntries[0][0]}
          </span>
        </div>
      )}

      {/* ── Event/article rows ────────────────────────── */}
      <div className={styles.eventList}>
        {visibleItems.map(item => {
          const url       = item.url || '#';
          const title     = cleanTitle(item.title, sourceName);
          const dateLabel = formatDate(item.event_date);
          const isNews    = item.isNews || (!item.event_date && NEWS_CATS.some(c => (item.category||'').toLowerCase().includes(c)));

          return (
            <a key={item.id} href={url} target="_blank" rel="noopener noreferrer"
              className={styles.eventRow} onClick={() => trackClick(item)}
              aria-label={`${title}${dateLabel ? ', ' + dateLabel : ''} — via ${sourceName}, opens in new tab`}
            >
              <span className={styles.eventTitle}>{title}</span>

              <span className={styles.meta}>
                {isNews && <span className={`${styles.chip} ${styles.chipNews}`}>📰 article</span>}
                {!isNews && dateLabel && <span className={`${styles.chip} ${styles.chipDate}`}>{dateLabel}</span>}
                {item.price && <span className={`${styles.chip} ${styles.chipPrice}`}>{item.price}</span>}
                {item.area  && <span className={`${styles.chip} ${styles.chipArea}`}>{item.area}</span>}
                {/* Show category chip only in "All" view */}
                {!activeCat && catEntries.length > 1 && (
                  <span className={`${styles.chip} ${styles.chipCat}`}>{item.category || 'Other'}</span>
                )}
              </span>

              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          );
        })}
      </div>

      {/* ── Show more ─────────────────────────────────── */}
      {showExpandBtn && (
        <button className={styles.showMore} onClick={() => {
          if (!activeCat) {
            // In "All" view, clicking expand selects the largest category
            setActiveCat(catEntries[0]?.[0] || null);
          } else {
            setExpanded(e => !e);
          }
        }} aria-expanded={expanded}>
          {activeCat && expanded
            ? '▲ Show fewer'
            : activeCat
              ? `▾ ${(categories[activeCat]?.length || 0) - 5} more`
              : `▾ ${totalCount - visibleItems.length} more from ${sourceName}`
          }
        </button>
      )}

      {/* ── Legal attribution ─────────────────────────── */}
      <div className={styles.attribution}>
        Via{' '}
        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">{domain}</a>
        {' '}· Not affiliated · Links go to original source
      </div>
    </div>
  );
}
