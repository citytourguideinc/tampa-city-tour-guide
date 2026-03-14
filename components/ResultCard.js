// components/ResultCard.js
'use client';
import styles from './ResultCard.module.css';

export default function ResultCard({ item, onSave, saved }) {
  // Support both new schema (title/destinationUrl) and legacy Supabase rows (activity_name/booking_link)
  const title       = item.title       || item.activity_name || 'Untitled';
  const description = item.description || item.short_summary || '';
  const url         = item.destinationUrl || item.booking_link || item.official_link || '#';
  const area        = item.area        || item.neighborhood   || item.city || null;
  const isPartner   = item.isMonetized === true || item.listingType === 'partner';
  const isFeatured  = item.listingType === 'featured';
  const ctaLabel    = item.ctaLabel    || (item.booking_link ? 'Go to Booking Site ↗' : 'Visit Site ↗');

  const priceLabel = item.priceRange
    ? item.priceRange
    : item.price_min != null
      ? (item.price_min === 0 ? 'Free' : `$${item.price_min}${item.price_max ? '–$' + item.price_max : '+'}`)
      : null;

  const handleClick = () => {
    if (typeof gtag === 'function') {
      gtag('event', 'card_click', {
        card_name: title,
        category:  item.category,
        listing_type: item.listingType || 'standard',
        is_monetized: !!isPartner,
      });
    }
  };

  return (
    <div className={`${styles.card} ${isFeatured ? styles.featured : ''} ${isPartner ? styles.partnerCard : ''}`}>

      {/* ── Listing-type badge ──────────────────────────────── */}
      {isPartner && (
        <div className={styles.partnerBadge}>💼 Partner Link</div>
      )}
      {isFeatured && !isPartner && (
        <div className={styles.featuredBadge}>⭐ Featured</div>
      )}

      {/* ── Top row: icon + category ────────────────────────── */}
      <div className={styles.top}>
        <span className={styles.icon}>{item.icon || '📍'}</span>
        <span className={styles.category}>{item.category}</span>
        {item.subcategory && (
          <span className={styles.subcategory}>{item.subcategory}</span>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────── */}
      <h3 className={styles.title}>{title}</h3>

      {/* ── Meta: location · date · price ───────────────────── */}
      <div className={styles.meta}>
        {area && (
          <span className={styles.metaItem}>📍 {area}</span>
        )}
        {item.event_date && (
          <span className={styles.metaItem}>
            🗓 {new Date(item.event_date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
            {item.start_time && ` · ${formatTime(item.start_time)}`}
          </span>
        )}
        {priceLabel && (
          <span className={styles.metaItem}>💰 {priceLabel}</span>
        )}
      </div>

      {/* ── Description ─────────────────────────────────────── */}
      {description && (
        <p className={styles.summary}>{description}</p>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className={styles.actions}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.cta} ${isPartner ? styles.ctaPartner : ''}`}
          onClick={handleClick}
          aria-label={`${ctaLabel} — opens in a new tab`}
        >
          {ctaLabel}
        </a>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
          onClick={() => onSave?.(item)}
          aria-label={saved ? 'Remove from saved' : 'Save this listing'}
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
