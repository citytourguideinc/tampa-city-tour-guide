'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './FilterDropdowns.module.css';

const CATEGORIES = [
  { icon: '🎟', label: 'Events' },
  { icon: '🆓', label: 'Free Things' },
  { icon: '🎵', label: 'Live Music' },
  { icon: '🧘', label: 'Wellness' },
  { icon: '🎨', label: 'Arts & Culture' },
  { icon: '🍽', label: 'Food & Dining' },
  { icon: '🌿', label: 'Outdoors' },
  { icon: '👨‍👩‍👧', label: 'Family' },
  { icon: '🛍', label: 'Shopping' },
  { icon: '🏛', label: 'Tours & Activities' },
];

const NEIGHBORHOODS = [
  { icon: '🏙', label: 'Downtown' },
  { icon: '🎭', label: 'Ybor City' },
  { icon: '🌳', label: 'Hyde Park' },
  { icon: '🌊', label: 'Channelside' },
  { icon: '🚶', label: 'Riverwalk' },
  { icon: '✈️', label: 'Westshore' },
  { icon: '🎶', label: 'SoHo' },
  { icon: '🏡', label: 'Seminole Heights' },
  { icon: '🌉', label: 'Channel District' },
  { icon: '🎪', label: 'Armature Works' },
];

const DATE_OPTIONS = [
  { key: 'today',   label: 'Today' },
  { key: 'tomorrow',label: 'Tomorrow' },
  { key: 'weekend', label: 'This Weekend' },
  { key: 'week',    label: 'This Week' },
  { key: 'custom',  label: 'Pick a Date…' },
];

export default function FilterDropdowns({ onFilter }) {
  const [open,      setOpen]      = useState(null); // 'category' | 'neighborhood' | 'date'
  const [category,  setCategory]  = useState('');
  const [area,      setArea]      = useState('');
  const [date,      setDate]      = useState('');
  const [customDate,setCustomDate]= useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function fire(newCat, newArea, newDate) {
    // Map date keys to real query params
    const today = new Date();
    let dateParam = newDate;
    if (newDate === 'tomorrow') {
      const tom = new Date(today);
      tom.setDate(today.getDate() + 1);
      dateParam = tom.toISOString().slice(0, 10);
    } else if (newDate === 'week') {
      // Use nearest Monday as start — client can pass 'week' and API can handle
      dateParam = 'week';
    }
    onFilter({ category: newCat, area: newArea, date: dateParam });
    setOpen(null);
  }

  function pickCategory(label) {
    const next = category === label ? '' : label;
    setCategory(next);
    fire(next, area, date);
  }

  function pickArea(label) {
    const next = area === label ? '' : label;
    setArea(next);
    fire(category, next, date);
  }

  function pickDate(key) {
    if (key === 'custom') { setOpen('date'); return; }
    const next = date === key ? '' : key;
    setDate(next);
    setCustomDate('');
    fire(category, area, next);
  }

  function pickCustomDate(val) {
    setCustomDate(val);
    setDate(val);
    if (val) fire(category, area, val);
  }

  const catLabel  = category  || 'Category';
  const areaLabel = area      || 'Neighborhood';
  const dateLabel = date === 'today'   ? 'Today'
                  : date === 'tomorrow'? 'Tomorrow'
                  : date === 'weekend' ? 'This Weekend'
                  : date === 'week'    ? 'This Week'
                  : customDate         ? customDate
                  : 'Date';

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.bar} ref={ref}>

      {/* ── Category ── */}
      <div className={styles.dropWrapper}>
        <button
          className={`${styles.pill} ${category ? styles.pillActive : ''}`}
          onClick={() => setOpen(open === 'category' ? null : 'category')}
        >
          <span className={styles.pillIcon}>🎯</span>
          <span className={styles.pillLabel}>{catLabel}</span>
          <span className={`${styles.arrow} ${open === 'category' ? styles.arrowUp : ''}`}>▾</span>
        </button>
        {open === 'category' && (
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Browse by Category</p>
            <div className={styles.optionGrid}>
              {CATEGORIES.map(c => (
                <button
                  key={c.label}
                  className={`${styles.option} ${category === c.label ? styles.optionActive : ''}`}
                  onClick={() => pickCategory(c.label)}
                >
                  <span className={styles.optionIcon}>{c.icon}</span>
                  <span className={styles.optionLabel}>{c.label}</span>
                  {category === c.label && <span className={styles.check}>✓</span>}
                </button>
              ))}
            </div>
            {category && (
              <button className={styles.clearBtn} onClick={() => { setCategory(''); fire('', area, date); }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Neighborhood ── */}
      <div className={styles.dropWrapper}>
        <button
          className={`${styles.pill} ${area ? styles.pillActive : ''}`}
          onClick={() => setOpen(open === 'neighborhood' ? null : 'neighborhood')}
        >
          <span className={styles.pillIcon}>📍</span>
          <span className={styles.pillLabel}>{areaLabel}</span>
          <span className={`${styles.arrow} ${open === 'neighborhood' ? styles.arrowUp : ''}`}>▾</span>
        </button>
        {open === 'neighborhood' && (
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Tampa Neighborhoods</p>
            <div className={styles.optionGrid}>
              {NEIGHBORHOODS.map(n => (
                <button
                  key={n.label}
                  className={`${styles.option} ${area === n.label ? styles.optionActive : ''}`}
                  onClick={() => pickArea(n.label)}
                >
                  <span className={styles.optionIcon}>{n.icon}</span>
                  <span className={styles.optionLabel}>{n.label}</span>
                  {area === n.label && <span className={styles.check}>✓</span>}
                </button>
              ))}
            </div>
            {area && (
              <button className={styles.clearBtn} onClick={() => { setArea(''); fire(category, '', date); }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Date ── */}
      <div className={styles.dropWrapper}>
        <button
          className={`${styles.pill} ${date ? styles.pillActive : ''}`}
          onClick={() => setOpen(open === 'date' ? null : 'date')}
        >
          <span className={styles.pillIcon}>📅</span>
          <span className={styles.pillLabel}>{dateLabel}</span>
          <span className={`${styles.arrow} ${open === 'date' ? styles.arrowUp : ''}`}>▾</span>
        </button>
        {open === 'date' && (
          <div className={`${styles.panel} ${styles.panelDate}`}>
            <p className={styles.panelTitle}>When?</p>
            {DATE_OPTIONS.map(d => (
              d.key === 'custom' ? (
                <div key="custom" className={styles.customDateRow}>
                  <span className={styles.optionLabel} style={{color:'#94A3B8',fontSize:'0.82rem'}}>Pick a specific date</span>
                  <input
                    type="date"
                    className={styles.datePicker}
                    value={customDate}
                    min={today}
                    onChange={e => pickCustomDate(e.target.value)}
                  />
                </div>
              ) : (
                <button
                  key={d.key}
                  className={`${styles.dateOption} ${date === d.key ? styles.optionActive : ''}`}
                  onClick={() => pickDate(d.key)}
                >
                  {d.label}
                  {date === d.key && <span className={styles.check}>✓</span>}
                </button>
              )
            ))}
            {date && (
              <button className={styles.clearBtn} onClick={() => { setDate(''); setCustomDate(''); fire(category, area, ''); }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
