'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar    from '@/components/SearchBar';
import SourceGroup  from '@/components/SourceGroup';
import SkeletonCard from '@/components/SkeletonCard';
import ViatorWidget from '@/components/ViatorWidget';
import styles       from './page.module.css';

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

      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logoLink} aria-label="City Tour Guide">
            <img src="/logo.png" alt="City Tour Guide" className={styles.logoImg} />
          </a>
          <a
            href="https://www.viator.com/Tampa/d663?pid=P00292624&mcid=42383&medium=link"
            target="_blank" rel="noopener noreferrer"
            className={styles.navBannerAd}
            aria-label="Sponsored: Book Tampa tours"
          >
            <span className={styles.navBannerAdLabel}>✦ Sponsored</span>
            <span className={styles.navBannerAdText}>Book Tampa Bay Tours &amp; Experiences — Sunset Cruises, City Tours, Family Fun &amp; More</span>
            <span className={styles.navBannerAdCta}>Book Now →</span>
          </a>
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
            /* ── TOP PREMIUM BANNER ── */
            <a
              href="https://www.viator.com/Tampa/d663?pid=P00292624&mcid=42383&medium=link"
              target="_blank" rel="noopener noreferrer"
              className={styles.topBanner}
              aria-label="Sponsored: Book Tampa tours on Viator"
            >
              <span className={styles.topBannerLabel}>✨ Sponsored</span>
              <span className={styles.topBannerText}>Book Tampa Bay Tours &amp; Experiences on Viator</span>
              <span className={styles.topBannerCta}>Book Now →</span>
            </a>
          )}

          {!hasSearched && (
            <>
              <p className={styles.eyebrow}>Your City. Your Guide.</p>
              {/* City picker inside hero */}
              <div className={styles.heroCityPicker}>
                <span>📍</span>
                <select
                  className={styles.heroCitySelect}
                  defaultValue="tampa"
                  onChange={e => { if (e.target.value !== 'tampa') { alert('More cities coming soon!'); e.target.value = 'tampa'; } }}
                  aria-label="Select city"
                >
                  <option value="tampa">Tampa, FL</option>
                  <option value="stpete" disabled>St. Pete — Soon</option>
                  <option value="orlando" disabled>Orlando — Soon</option>
                </select>
                <span>▾</span>
              </div>
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

          {/* ── BOTTOM FEATURED VIATOR BANNER ── */}
          {!hasSearched && (
            <div className={styles.featuredBanner}>
              <p className={styles.featuredBannerTitle}>🏆 Featured Tampa Experiences</p>
              <div className={styles.featuredCards}>
                {[
                  { emoji: '🚤', label: 'Sunset Cruise',   href: 'https://www.viator.com/Tampa-Bay/d663-g15953/tours-cruises?pid=P00292624&mcid=42383&medium=link' },
                  { emoji: '🐊', label: 'Zoo & Wildlife',  href: 'https://www.viator.com/Tampa/d663-g3/tours-nature?pid=P00292624&mcid=42383&medium=link' },
                  { emoji: '🏙', label: 'City Tours',      href: 'https://www.viator.com/Tampa/d663-g9/tours-city?pid=P00292624&mcid=42383&medium=link' },
                  { emoji: '🎭', label: 'Events & Shows',  href: 'https://www.viator.com/Tampa/d663-g12/tours-shows?pid=P00292624&mcid=42383&medium=link' },
                ].map(({ emoji, label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={styles.featuredCard}>
                    <span className={styles.featuredEmoji}>{emoji}</span>
                    <span className={styles.featuredLabel}>{label}</span>
                  </a>
                ))}
              </div>
              <p className={styles.featuredDisclaimer}>Powered by Viator · Affiliate links</p>
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

      {/* ── Footer bar ── */}
      <div className={styles.bottomBar}>
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
