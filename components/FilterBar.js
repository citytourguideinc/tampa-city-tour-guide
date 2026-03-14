// components/FilterBar.js
'use client';
import { useState } from 'react';
import styles from './FilterBar.module.css';

const QUICK_CHIPS = [
  { label: 'This Weekend', icon: '📅', filter: { date: 'weekend' } },
  { label: 'Nightlife',    icon: '🌙', filter: { category: 'Nightlife' } },
  { label: 'Family',       icon: '👨‍👩‍👧', filter: { tag: 'family' } },
  { label: 'Free',         icon: '🎁', filter: { tag: 'free' } },
  { label: 'Tours',        icon: '🗺',  filter: { category: 'Tours & Activities' } },
  { label: 'Deals',        icon: '💰', filter: { category: 'Deals & Discounts' } },
  { label: 'Volunteer',    icon: '🤝', filter: { category: 'Volunteer' } },
  { label: 'Beaches',      icon: '🏖', filter: { tag: 'beach' } },
  { label: 'Sports',       icon: '🏆', filter: { category: 'Sports & Entertainment' } },
];

const AREAS = ['Downtown', 'Ybor City', 'Hyde Park', 'Channelside', 'South Tampa', 'Heights', 'Seminole Heights', 'St. Petersburg', 'Clearwater', 'North Tampa', 'City-wide'];
const CATEGORIES = [
  'Things To Do',
  'Beaches & Outdoors',
  'Restaurants & Dining',
  'Nightlife',
  'Sports & Entertainment',
  'Shopping',
  'Events Calendar',
  'Tours & Activities',
  'Deals & Discounts',
  'Wellness',
  'Volunteer',
];
const PRICES = [
  { label: 'Any price', value: '' },
  { label: 'Free only', value: 0 },
  { label: 'Under $25', value: 25 },
  { label: 'Under $50', value: 50 },
  { label: 'Under $100', value: 100 },
];

export default function FilterBar({ filters, onChange }) {
  const [activeChip, setActiveChip] = useState(null);

  function applyChip(chip, idx) {
    const isActive = activeChip === idx;
    setActiveChip(isActive ? null : idx);
    onChange(isActive ? {} : chip.filter);
  }

  function handleSelect(key, value) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className={styles.wrap}>
      {/* Quick-action chips */}
      <div className={styles.chips}>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={chip.label}
            className={`${styles.chip} ${activeChip === i ? styles.chipActive : ''}`}
            onClick={() => applyChip(chip, i)}
          >
            <span>{chip.icon}</span> {chip.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className={styles.filters}>
        <select
          className={styles.select}
          value={filters.category || ''}
          onChange={e => handleSelect('category', e.target.value)}
          aria-label="Category"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <input
          type="date"
          className={styles.select}
          value={filters.date || ''}
          onChange={e => handleSelect('date', e.target.value)}
          aria-label="Date"
          style={{ colorScheme:'dark' }}
        />

        <select
          className={styles.select}
          value={filters.area || ''}
          onChange={e => handleSelect('area', e.target.value)}
          aria-label="Neighborhood"
        >
          <option value="">All Areas</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          className={styles.select}
          value={filters.price_max ?? ''}
          onChange={e => handleSelect('price_max', e.target.value !== '' ? Number(e.target.value) : undefined)}
          aria-label="Max price"
        >
          {PRICES.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
        </select>

        {Object.values(filters).some(Boolean) && (
          <button className={styles.clear} onClick={() => { onChange({}); setActiveChip(null); }}>
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
