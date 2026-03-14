// components/SourceGroup.js — Compact source card grouping multiple events
'use client';
import { useState } from 'react';
import styles from './SourceGroup.module.css';

const PREVIEW_COUNT = 5; // show this many events before "show more"

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

  const visible = expanded ? items : items.slice(0, PREVIEW_COUNT);
  const hasMore  = items.length > PREVIEW_COUNT;

  return (
    <div className={styles.card}>
      {/* ── Source header ──────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.sourceName}>{sourceName}</span>
        {category && (
          <span className={styles.categoryBadge}>{category}</span>
        )}
        <span className={styles.count}>{items.length} listing{items.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Event rows ─────────────────────────────── */}
      <div className={styles.eventList}>
        {visible.map(item => {
          const url       = item.url || item.destinationUrl || '#';
          const dateLabel = formatDate(item.event_date);
          // Strip source name suffix from title for cleaner display
          const cleanTitle = item.title
            ? item.title.replace(/ [-–|·] .*?(Partnership|Tampa|Downtown|Inc).*$/i, '').trim()
            : 'Untitled';

          return (
            <a
              key={item.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.eventRow}
              onClick={() => trackClick(item)}
              title={`${cleanTitle} — opens ${sourceName} in a new tab`}
              aria-label={`${cleanTitle}${dateLabel ? ', ' + dateLabel : ''}${item.price ? ', ' + item.price : ''} — via ${sourceName}, opens in a new tab`}
            >
              {/* Title */}
              <span className={styles.eventTitle}>{cleanTitle}</span>

              {/* Short description */}
              {item.summary && (
                <span className={styles.eventDesc}>{item.summary.slice(0, 60)}{item.summary.length > 60 ? '…' : ''}</span>
              )}

              {/* Meta chips */}
              <span className={styles.meta}>
                {dateLabel && <span className={`${styles.chip} ${styles.chipDate}`}>{dateLabel}</span>}
                {item.price && <span className={`${styles.chip} ${styles.chipPrice}`}>{item.price}</span>}
                {item.area  && <span className={`${styles.chip} ${styles.chipArea}`}>{item.area}</span>}
              </span>

              {/* External arrow */}
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          );
        })}
      </div>

      {/* ── Show more toggle ─────────────────────── */}
      {hasMore && (
        <button
          className={styles.showMore}
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded
            ? `▲ Show fewer`
            : `▾ Show ${items.length - PREVIEW_COUNT} more from ${sourceName}`}
        </button>
      )}

      {/* ── Legal attribution ────────────────────── */}
      <div className={styles.attribution}>
        Content sourced from{' '}
        <a
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${sourceName} website — opens in a new tab`}
        >
          {domain}
        </a>
        . City Tour Guide is not affiliated with {sourceName}. Listings link to original sources and are provided for discovery purposes only.
      </div>
    </div>
  );
}
