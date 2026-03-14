// components/ResultCard.js
'use client';
import styles from './ResultCard.module.css';

export default function ResultCard({ item, onSave, saved }) {
  const priceLabel = item.price_min
    ? `$${item.price_min}${item.price_max ? '–$' + item.price_max : '+'}`
    : item.price_min === 0 ? 'Free' : null;

  const handleClick = () => {
    if (typeof gtag === 'function') {
      gtag('event', 'card_click', {
        card_name: item.activity_name,
        category: item.category,
        source: item.source_name,
        featured: !!item.featured_status,
      });
    }
  };

  return (
    <div className={`${styles.card} ${item.featured_status ? styles.featured : ''}`}>
      {item.featured_status && (
        <div className={styles.sponsoredBadge}>⭐ Sponsored</div>
      )}
      <div className={styles.top}>
        <span className={styles.icon}>{item.icon || '📍'}</span>
        <span className={styles.category}>{item.category}</span>
        {item.source_name && (
          <span className={styles.source}>{item.source_name}</span>
        )}
      </div>
      <h3 className={styles.title}>{item.activity_name}</h3>
      <div className={styles.meta}>
        {item.neighborhood && <span className={styles.metaItem}>📍 {item.neighborhood}</span>}
        {item.event_date && (
          <span className={styles.metaItem}>
            🗓 {new Date(item.event_date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
            {item.start_time && ` · ${formatTime(item.start_time)}`}
          </span>
        )}
        {priceLabel && <span className={styles.metaItem}>💰 {priceLabel}</span>}
      </div>
      {item.short_summary && (
        <p className={styles.summary}>{item.short_summary}</p>
      )}
      <div className={styles.actions}>
        <a
          href={item.booking_link || item.official_link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
          onClick={handleClick}
        >
          {item.booking_link ? 'Book Now' : 'View'} ↗
        </a>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
          onClick={() => onSave?.(item)}
          aria-label={saved ? 'Remove from saved' : 'Save'}
          title={saved ? 'Remove from saved' : 'Save'}
        >
          {saved ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  );
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}
