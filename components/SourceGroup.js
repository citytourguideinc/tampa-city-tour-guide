// components/SourceGroup.js — Compact source card grouping multiple events/news
'use client';
import { useState } from 'react';
import styles from './SourceGroup.module.css';

const PREVIEW_COUNT = 5;

// News/informational categories shown with a different badge
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

export default function SourceGroup({ sourceName, domain, category, items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hasMore = items.length > PREVIEW_COUNT;

  // Determine primary display type for this group
  const isNewsGroup = NEWS_CATS.some(c => (category || '').toLowerCase().includes(c));

  return (
    <div className={styles.card}>
      {/* ── Source header ─────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.sourceName}>{sourceName}</span>
        {category && (
          <span className={`${styles.categoryBadge} ${isNewsGroup ? styles.newsBadge : ''}`}>
            {isNewsGroup ? '📰 ' : ''}{category}
          </span>
        )}
        <span className={styles.count}>{items.length}</span>
      </div>

      {/* ── Event/article rows ────────────────────────── */}
      <div className={styles.eventList}>
        {visible.map(item => {
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
                {/* News badge for non-event items */}
                {isNews && <span className={`${styles.chip} ${styles.chipNews}`}>📰 article</span>}
                {/* Date only for events */}
                {!isNews && dateLabel && <span className={`${styles.chip} ${styles.chipDate}`}>{dateLabel}</span>}
                {item.price && <span className={`${styles.chip} ${styles.chipPrice}`}>{item.price}</span>}
                {item.area  && <span className={`${styles.chip} ${styles.chipArea}`}>{item.area}</span>}
              </span>

              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          );
        })}
      </div>

      {/* ── Show more ─────────────────────────────────── */}
      {hasMore && (
        <button className={styles.showMore} onClick={() => setExpanded(e => !e)} aria-expanded={expanded}>
          {expanded ? '▲ Show fewer' : `▾ ${items.length - PREVIEW_COUNT} more from ${sourceName}`}
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
