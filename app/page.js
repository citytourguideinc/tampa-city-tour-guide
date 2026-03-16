'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar   from '@/components/SearchBar';
import ResultCard  from '@/components/ResultCard';
import SourceGroup from '@/components/SourceGroup';
import SkeletonCard from '@/components/SkeletonCard';
import styles      from './page.module.css';

// Quick-tap category tiles — mapped to ACTUAL DB categories
const QUICK_CATS = [
  { icon: '🎟', label: 'Events',    cat: 'Events' },
  { icon: '🍽', label: 'Dining',    cat: 'Food' },
  { icon: '🏛', label: 'Tours',     cat: 'Tours & Activities' },
  { icon: '🛍', label: 'Shopping',  cat: 'Shopping' },
  { icon: '🗺', label: 'Discovery', cat: 'Discovery' },
  { icon: '📅', label: 'This Week', cat: '', date: 'weekend' },
  { icon: '🆓', label: 'Free',      cat: '', price: 'free' },
  { icon: '🌟', label: 'Browse All',cat: '' },
];

export default function Home() {
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [category,    setCategory]    = useState('');
  const [area,        setArea]        = useState('');
  const [dateFilter,  setDateFilter]  = useState('');
  const [activeQuick, setActiveQuick] = useState('');
  const resultsRef = useRef(null);

  const fetchResults = useCallback(async (q = '', cat = '', date = '', ar = '', price = '') => {
    setLoading(true);
    setHasSearched(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    try {
      const params = new URLSearchParams({ limit: '300' });
      if (q)     params.set('q', q);
      if (cat)   params.set('category', cat);
      if (date)  params.set('date', date);
      if (ar)    params.set('area', ar);
      if (price) params.set('price', price);
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(q) {
    setQuery(q);
    setActiveQuick('');
    if (q.trim() || category || dateFilter) {
      fetchResults(q, category, dateFilter, area);
    } else {
      setHasSearched(false);
      setResults([]);
    }
  }

  function pickCategory(tile) {
    const isActive = activeQuick === tile.label;
    setActiveQuick(isActive ? '' : tile.label);
    const nextCat   = isActive ? '' : (tile.cat   || '');
    const nextDate  = isActive ? '' : (tile.date  || '');
    const nextPrice = isActive ? '' : (tile.price || '');
    setCategory(nextCat);
    setDateFilter(nextDate);
    setQuery('');
    if (!isActive) {
      fetchResults('', nextCat, nextDate, area, nextPrice);
    } else {
      setHasSearched(false);
      setResults([]);
    }
  }

  function clearAll() {
    setQuery(''); setCategory(''); setDateFilter(''); setArea('');
    setHasSearched(false); setResults([]); setActiveQuick('');
  }

  // Group results by source
  const sourceGroups = {};
  for (const item of results) {
    const key = item.source_name || 'Other';
    if (!sourceGroups[key]) sourceGroups[key] = { items: [], domain: item.source_domain, categories: {} };
    sourceGroups[key].items.push(item);
    const c = item.category || 'Other';
    if (!sourceGroups[key].categories[c]) sourceGroups[key].categories[c] = [];
    sourceGroups[key].categories[c].push(item);
  }
  const groupEntries = Object.entries(sourceGroups).sort(([, a], [, b]) => b.items.length - a.items.length);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.page}>

      {/* ── Slim Sticky Navbar ── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logoLink} aria-label="City Tour Guide">
            <img src="/logo.png" alt="City Tour Guide" className={styles.logoImg} />
          </a>
          <div className={styles.cityPill}>
            <span>📍</span>
            <select
              className={styles.citySelect}
              defaultValue="tampa"
              onChange={e => { if (e.target.value !== 'tampa') { alert('More cities coming soon!'); e.target.value = 'tampa'; } }}
              aria-label="Select city"
            >
              <option value="tampa">Tampa, FL</option>
              <option value="stpete" disabled>St. Pete — Soon</option>
              <option value="orlando" disabled>Orlando — Soon</option>
            </select>
            <span className={styles.chevron}>▾</span>
          </div>
        </div>
      </header>

      {/* ── Hero — full-viewport immersive ── */}
      <section className={`${styles.hero} ${hasSearched ? styles.heroCompact : ''}`}>
        {!hasSearched && (
          <>
            <div className={styles.orb1} aria-hidden="true" />
            <div className={styles.orb2} aria-hidden="true" />
          </>
        )}

        <div className={styles.heroContent}>
          {!hasSearched && (
            <>
              <p className={styles.eyebrow}>Your City. Your Guide.</p>
              <h1 className={styles.headline}>Discover What&apos;s<br />Happening</h1>
              <p className={styles.subline}>Events, dining, tours &amp; nightlife in Tampa Bay</p>
            </>
          )}

          {/* Search bar */}
          <div className={styles.searchWrap}>
            <SearchBar onSearch={handleSearch} loading={loading} initValue={query} />
            {hasSearched && (
              <button className={styles.clearBtn} onClick={clearAll} aria-label="Back">← Back</button>
            )}
          </div>

          {/* Quick-tap category tiles — only on landing */}
          {!hasSearched && (
            <div className={styles.quickGrid}>
              {QUICK_CATS.map(tile => (
                <button
                  key={tile.label}
                  className={`${styles.quickTile} ${activeQuick === tile.label ? styles.quickActive : ''}`}
                  onClick={() => pickCategory(tile)}
                >
                  <span className={styles.quickIcon}>{tile.icon}</span>
                  <span className={styles.quickLabel}>{tile.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Date filters when results are shown */}
          {hasSearched && (
            <div className={styles.dateBar}>
              {['', 'today', 'weekend'].map((d, i) => (
                <button key={i}
                  className={`${styles.dateChip} ${dateFilter === d ? styles.dateChipActive : ''}`}
                  onClick={() => { setDateFilter(d); fetchResults(query, category, d, area); }}>
                  {d === '' ? 'Any date' : d === 'today' ? 'Today' : 'This Weekend'}
                </button>
              ))}
              <input type="date" className={styles.datePicker} min={today}
                onChange={e => { setDateFilter(e.target.value); fetchResults(query, category, e.target.value, area); }} />
            </div>
          )}
        </div>
      </section>

      {/* ── Results ── */}
      <main className={styles.main} ref={resultsRef}>
        {hasSearched && (
          <div className={styles.container}>
            {loading && (
              <div className={styles.groupGrid}>
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            )}
            {!loading && (
              <>
                <p className={styles.resultMeta}>
                  {activeQuick || (query ? `"${query}"` : 'All')}
                  {' · '}<strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''}
                  {groupEntries.length > 1 && ` · ${groupEntries.length} sources`}
                  <button className={styles.clearInline} onClick={clearAll}> · clear</button>
                </p>

                {groupEntries.length > 0 ? (
                  <div className={styles.groupGrid}>
                    {groupEntries.map(([key, { items: srcItems, domain, categories: cats }]) => (
                      <SourceGroup key={key} sourceName={key} domain={domain} categories={cats} items={srcItems} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <span>🔍</span>
                    <p>No results found{query ? ` for "${query}"` : ''}.</p>
                    <button onClick={clearAll}>Try something else</button>
                  </div>
                )}

                {results.length > 0 && (
                  <p className={styles.compliance}>
                    Listings aggregated from verified local sources. All links go to original third-party sites. City Tour Guide is not affiliated with listed sources.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ── Sticky bottom bar ── */}
      <div className={styles.bottomBar}>
        <div className={styles.appLinks}>
          <a href="https://play.google.com/store/apps/details?id=com.mytoursapp.android.app7801"
             target="_blank" rel="noopener noreferrer" className={styles.appBtn}>
            <svg width="14" height="16" viewBox="0 0 24 27" fill="none" aria-hidden="true">
              <path d="M1.5 0.5L13.5 13.5L1.5 26.5C0.7 26.1 0 25.1 0 23.9V3.1C0 1.9 0.7 0.9 1.5 0.5Z" fill="#EA4335"/>
              <path d="M20 9L13.5 13.5L20 18L23.3 16.1C24.2 15.6 24.2 14.4 23.3 13.9L20 9Z" fill="#FBBC04"/>
              <path d="M1.5 0.5L13.5 13.5L20 9L4.5 0.1C3.5 -0.4 2.3 -0.1 1.5 0.5Z" fill="#4285F4"/>
              <path d="M1.5 26.5L13.5 13.5L20 18L4.5 26.9C3.5 27.4 2.3 27.1 1.5 26.5Z" fill="#34A853"/>
            </svg>
            <span><small>GET IT ON</small><strong>Google Play</strong></span>
          </a>
          <a href="https://citytourguide.stqry.app/" target="_blank" rel="noopener noreferrer" className={styles.appBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/>
            </svg>
            <span><small>OPEN</small><strong>Web App</strong></span>
          </a>
        </div>
        <nav className={styles.footerNav}>
          <span>© 2026 City Tour Guide, Inc.</span>
          <a href="/partner">Partner</a>
          <a href="/disclaimer">Disclaimer</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </div>
    </div>
  );
}
