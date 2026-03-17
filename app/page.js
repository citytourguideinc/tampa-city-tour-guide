'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar    from '@/components/SearchBar';
import SourceGroup  from '@/components/SourceGroup';
import SkeletonCard from '@/components/SkeletonCard';
import styles       from './page.module.css';

// Quick-tap tiles — single scrollable row, mapped to real DB categories + keyword searches
const QUICK_CATS = [
  { icon: '🎟', label: 'Events',    cat: 'Events' },
  { icon: '🍽', label: 'Dining',    cat: 'Food' },
  { icon: '🏛', label: 'Tours',     cat: 'Tours & Activities' },
  { icon: '🛍', label: 'Shopping',  cat: 'Shopping' },
  { icon: '🗺', label: 'Discover',  cat: 'Discovery' },
  { icon: '📅', label: 'Weekend',   cat: '', date: 'weekend' },
  { icon: '🆓', label: 'Free',      cat: '', price: 'free' },
  { icon: '🌟', label: 'All',       cat: '' },
  { icon: '🎵', label: 'Music',     cat: '', q: 'music' },
  { icon: '🏊', label: 'Sports',    cat: '', q: 'sports' },
  { icon: '🎨', label: 'Arts',      cat: '', q: 'arts' },
  { icon: '🌺', label: 'Family',    cat: '', q: 'family' },
  { icon: '🌊', label: 'Outdoor',   cat: '', q: 'outdoor' },
  { icon: '🍻', label: 'Nightlife', cat: '', q: 'nightlife' },
  { icon: '🏖', label: 'Beaches',   cat: '', q: 'beach' },
  { icon: '🏛', label: 'Historic',  cat: '', q: 'historic' },
];

const VIATOR_FALLBACK = [
  { code: 'f1', title: 'Sunset Cruise',      emoji: '🚤', url: 'https://www.viator.com/tours/Tampa/Sunset-Cruises/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f2', title: 'Zoo & Wildlife',     emoji: '🐊', url: 'https://www.viator.com/tours/Tampa/Nature-and-Wildlife/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f3', title: 'City Tours',         emoji: '🏙', url: 'https://www.viator.com/tours/Tampa/City-Tours/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f4', title: 'Events & Shows',     emoji: '🎭', url: 'https://www.viator.com/tours/Tampa/Shows-Concerts-Sports/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f5', title: 'Water Sports',       emoji: '🛶', url: 'https://www.viator.com/tours/Tampa/Water-Sports/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f6', title: 'Food & Drink',       emoji: '🍽', url: 'https://www.viator.com/tours/Tampa/Food-and-Drink/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f7', title: 'Day Trips',          emoji: '🗺', url: 'https://www.viator.com/tours/Tampa/Day-Trips/?pid=P00292624&mcid=42383&medium=link' },
  { code: 'f8', title: 'Outdoor Activities', emoji: '🌿', url: 'https://www.viator.com/tours/Tampa/Outdoor-Activities/?pid=P00292624&mcid=42383&medium=link' },
];

export default function Home() {
  const [query,          setQuery]          = useState('');
  const [results,        setResults]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [hasSearched,    setHasSearched]    = useState(false);
  const [category,       setCategory]       = useState('');
  const [area,           setArea]           = useState('');
  const [dateFilter,     setDateFilter]     = useState('');
  const [activeQuick,    setActiveQuick]    = useState('');
  const [viatorProducts, setViatorProducts] = useState([]);
  const resultsRef = useRef(null);

  // Fetch real Viator featured products on mount
  useEffect(() => {
    fetch('/api/viator-featured')
      .then(r => r.json())
      .then(d => { if (d.products?.length) setViatorProducts(d.products); })
      .catch(() => {});
  }, []);

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
    const nextQ     = isActive ? '' : (tile.q     || '');
    setCategory(nextCat);
    setDateFilter(nextDate);
    setQuery(nextQ);
    if (!isActive) {
      fetchResults(nextQ, nextCat, nextDate, area, nextPrice);
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
  const grouped = results.reduce((acc, item) => {
    const src = item.source_name || 'Other';
    if (!acc[src]) acc[src] = { items: [], domain: item.source_domain || '', categories: new Set() };
    acc[src].items.push(item);
    if (item.category) acc[src].categories.add(item.category);
    return acc;
  }, {});
  const groupEntries = Object.entries(grouped).map(([k, v]) => [k, { ...v, categories: [...v.categories] }]);

  return (
    <div className={styles.page}>

      {/* ── Navbar ── */}
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

      {/* ── Hero ── */}
      <section className={`${styles.hero} ${hasSearched ? styles.heroCompact : ''}`}>
        {!hasSearched && (
          <>
            <div className={styles.orb1} aria-hidden="true" />
            <div className={styles.orb2} aria-hidden="true" />
          </>
        )}

        <div className={styles.heroContent}>
          {/* ── TOP HERO BANNER — Owner's GYG Karaoke Golf Cart Tour ── */}
          {!hasSearched && (
            <a
              href="https://gyg.me/PBnl9fQh"
              target="_blank" rel="noopener noreferrer"
              className={styles.topBanner}
              aria-label="Book: Karaoke Golf Cart City Tour"
            >
              <span className={styles.topBannerLabel}>🎶 Featured</span>
              <span className={styles.topBannerText}>Karaoke Golf Cart City Tour &mdash; Book Now on GetYourGuide!</span>
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

          {/* Quick-tap category tiles */}
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

          {/* YouTube live stream */}
          {!hasSearched && (
            <div className={styles.videoZone}>
              <iframe
                className={styles.videoFrame}
                src="https://www.youtube.com/embed/3vHrmhfbmNk?autoplay=0&rel=0"
                title="Tampa Bay Live — City Tour Guide"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <p className={styles.videoLabel}>📡 Tampa Bay Live</p>
            </div>
          )}

          {/* Date filters in compact/results mode */}
          {hasSearched && (
            <div className={styles.dateBar}>
              {['', 'today', 'weekend'].map((d, i) => (
                <button
                  key={d}
                  className={`${styles.dateChip} ${dateFilter === d && i < 3 ? styles.dateChipActive : ''}`}
                  onClick={() => { setDateFilter(d); fetchResults(query, category, d, area); }}
                >
                  {i === 0 ? 'Any Date' : i === 1 ? 'Today' : 'This Weekend'}
                </button>
              ))}
              <input
                type="date"
                className={styles.datePicker}
                onChange={e => { setDateFilter(e.target.value); fetchResults(query, category, e.target.value, area); }}
              />
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

        {/* Viator Featured — 2-row grid, no title */}
        {!hasSearched && (
          <div className={styles.featuredSection}>
            <div className={styles.featuredGrid}>
              {(viatorProducts.length >= 8 ? viatorProducts.slice(0,8) : VIATOR_FALLBACK).map(p => (
                <a key={p.code} href={p.url} target="_blank" rel="noopener noreferrer" className={styles.featuredCard}>
                  {p.image
                    ? <img src={p.image} alt={p.title} className={styles.featuredImg} />
                    : <span className={styles.featuredEmoji}>{p.emoji || '🎟'}</span>
                  }
                  <span className={styles.featuredLabel}>{p.title}</span>
                  {p.price  && <span className={styles.featuredPrice}>{p.price}</span>}
                  {p.rating && <span className={styles.featuredRating}>★ {p.rating}</span>}
                </a>
              ))}
            </div>
            <p className={styles.featuredDisclaimer}>Powered by Viator · Affiliate links</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
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
