// components/ResultRow.js — Craigslist-style single-line listing
'use client';
import styles from './ResultRow.module.css';

const CATEGORY_ICONS = {
  'Events': '🎟',
  'Tours & Activities': '🗺',
  'Discovery': '📍',
  'Food': '🍽',
  'Outdoors': '🌿',
  'Nightlife': '🌙',
  'Arts & Culture': '🎨',
  'Sports': '⚽',
  'Health & Wellness': '🧘',
  'Shopping': '🛍',
  'News': '📰',
  'Community': '🤝',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00'); // force local parse
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ResultRow({ item }) {
  const title = item.title || 'Untitled';
  const url   = item.url || item.destinationUrl || '#';
  const icon  = CATEGORY_ICONS[item.category] || '📍';
  const dateLabel = formatDate(item.event_date);
  const isNew = item.event_date === new Date().toISOString().slice(0, 10);

  const handleClick = () => {
    if (typeof gtag === 'function') {
      gtag('event', 'row_click', {
        item_title: title,
        category: item.category,
        listing_type: item.listing_type || 'standard',
      });
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.row}
      onClick={handleClick}
      aria-label={`${title} — opens in a new tab`}
    >
      {/* Date */}
      <span className={styles.date}>
        {dateLabel || <span style={{opacity:0.3}}>—</span>}
      </span>

      {/* Title */}
      <span className={styles.title}>
        {icon} {title}
      </span>

      {/* NEW badge */}
      {isNew && <span className={styles.newBadge}>NEW</span>}

      {/* Category */}
      <span className={styles.cat}>{item.subcategory || item.category}</span>

      {/* Price */}
      {item.price && (
        <>
          <span className={styles.dot}>·</span>
          <span className={styles.price}>{item.price}</span>
        </>
      )}

      {/* Area */}
      {item.area && (
        <>
          <span className={styles.dot}>·</span>
          <span className={styles.area}>{item.area}</span>
        </>
      )}

      {/* Source */}
      <span className={styles.dot}>·</span>
      <span className={styles.source}>{item.source_name}</span>
    </a>
  );
}
