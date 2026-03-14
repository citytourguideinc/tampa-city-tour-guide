// components/SourceGroup.js — Compact source card grouping multiple events
'use client';
import { useState } from 'react';
import styles from './SourceGroup.module.css';

const PREVIEW_COUNT = 5;

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Strip source name suffix from title (e.g. "Jazz Jam - Tampa Downtown Partnership" → "Jazz Jam")
function cleanTitle(title, sourceName) {
  if (!title) return 'Untitled';
  const firstWord = (sourceName || '').split(' ')[0];
  return title
    .replace(new RegExp(`\\s*[-–|·]\\s*${firstWord}.*$`, 'i'), '')
    .replace(/\s*[-–|·]\s*(Tampa|Downtown|Partnership|Inc|LLC).*$/i, '')
    .trim() || title;
}

function trackClick(item) {
  if (typeof gtag === 'function') {
    gtag('event', 'listing_click', {
      item_title:   item.title,
      category:     item.category,
      source_name:  item.source_name,
      listing_type: item.listing_type || 'standard',
    });
  }
}

export default function SourceGroup({ sourceName, domain, category, items }) {
  const [expanded, setExpanded] = useState(false);
  const visible  = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hasMore  = items.length > PREVIEW_COUNT;

  return (
    <div className={styles.card}>
      {/* ── Source header ─────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.sourceName}>{sourceName}</span>
        {category && <span className={styles.categoryBadge}>{category}</span>}
        <span className={styles.count}>{items.length}</span>
      </div>

      {/* ── Event rows ────────────────────────────────── */}
      <div className={styles.eventList}>
        {visible.map(item => {
          const url        = item.url || '#';
          const title      = cleanTitle(item.title, sourceName);
          const dateLabel  = formatDate(item.event_date);

          return (
            <a
              key={item.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.eventRow}
              onClick={() => trackClick(item)}
              aria-label={`${title}${dateLabel ? ', ' + dateLabel : ''}${item.price ? ', ' + item.price : ''} — via ${sourceName}, opens in new tab`}
            >
              <span className={styles.eventTitle}>{title}</span>

              <span className={styles.meta}>
                {dateLabel && <span className={`${styles.chip} ${styles.chipDate}`}>{dateLabel}</span>}
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
        <button
          className={styles.showMore}
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded ? '▲ Show fewer' : `▾ ${items.length - PREVIEW_COUNT} more from ${sourceName}`}
        </button>
      )}

      {/* ── Legal attribution ─────────────────────────── */}
      <div className={styles.attribution}>
        Via{' '}
        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
          {domain}
        </a>
        {' '}· Not affiliated · Links go to original source
      </div>
    </div>
  );
}
