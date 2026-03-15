'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar        from '@/components/SearchBar';
import ResultCard       from '@/components/ResultCard';
import SourceGroup      from '@/components/SourceGroup';
import SkeletonCard     from '@/components/SkeletonCard';
import FilterDropdowns  from '@/components/FilterDropdowns';
import styles           from './page.module.css';


export default function Home() {
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [meta,         setMeta]         = useState({ categories: [], areas: [] });
  const [category,     setCategory]     = useState('');
  const [area,         setArea]         = useState('');
  const [dateFilter,   setDateFilter]   = useState('');
  const [featuredItems,setFeaturedItems]= useState([]);
  const resultsRef = useRef(null);

  // Load meta once
  useEffect(() => {
    fetch('/api/search/meta')
      .then(r => r.json())
      .then(data => setMeta(data))
      .catch(() => {});
  }, []);

  // Load featured items once for the landing page
  useEffect(() => {
    fetch('/api/search?listing_type=featured&limit=3')
      .then(r => r.json())
      .then(data => {
        const featured = (data.results || []).filter(r =>
          r.listing_type === 'featured' || r.listing_type === 'partner'
        );
        setFeaturedItems(featured);
      })
      .catch(() => {});
  }, []);

  const fetchResults = useCallback(async (q = '', cat = '', date = '') => {
    setLoading(true);
    setHasSearched(true);
    // Scroll to results after a short delay (let render happen first)
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    try {
      const params = new URLSearchParams({ limit: '300' });
      if (q)    params.set('q',        q);
      if (cat)  params.set('category', cat);
      if (date) params.set('date',     date);
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
    if (q.trim()) {
      fetchResults(q, category, dateFilter);
    } else if (category || dateFilter) {
      fetchResults('', category, dateFilter);
    } else {
      // Cleared search with no filters — go back to landing
      setHasSearched(false);
      setResults([]);
    }
  }

  function applyPrompt(prompt) {
    setQuery(prompt.q || '');
    setDateFilter(prompt.date || '');
    setCategory(prompt.category || '');
    fetchResults(prompt.q || '', prompt.category || '', prompt.date || '');
  }

  function applyFilter({ category: cat, area: ar, date }) {
    const nextCat  = cat  !== undefined ? cat  : category;
    const nextDate = date !== undefined ? date : dateFilter;
    if (cat  !== undefined) setCategory(cat);
    if (ar   !== undefined) setArea(ar || '');
    if (date !== undefined) setDateFilter(date);
    fetchResults(query, nextCat, nextDate);
  }

  function applyCategory(cat) {
    setCategory(cat);
    if (cat || query || dateFilter) {
      fetchResults(query, cat, dateFilter);
    }
  }

  function applyDate(date) {
    setDateFilter(date);
    if (date || query || category) {
      fetchResults(query, category, date);
    }
  }

  function clearAll() {
    setQuery(''); setCategory(''); setDateFilter('');
    setHasSearched(false); setResults([]);
  }

  // Split featured vs standard
  const featured  = hasSearched ? results.filter(r => r.listing_type === 'featured' || r.listing_type === 'partner') : [];
  const standard  = hasSearched ? results.filter(r => !r.listing_type || r.listing_type === 'standard') : [];

  // Adaptive grouping:
  // - if category filter active → group by SOURCE (you already know the category)
  // - otherwise → group by CATEGORY for better hierarchy
  const groupByCategory = !category && hasSearched;

  const sourceGroups = {};
  for (const item of standard) {
    const key = groupByCategory
      ? (item.category || 'Other')           // group by category
      : (item.source_name || 'Other');       // group by source (default)
    if (!sourceGroups[key]) sourceGroups[key] = { items: [], domain: item.source_domain, category: item.category };
    sourceGroups[key].items.push(item);
  }
  const groupEntries = Object.entries(sourceGroups)
    .sort(([, a], [, b]) => b.items.length - a.items.length);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.page}>

      {/* ── Sticky 3-col Navbar ──────────────────────────────────── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>

          <a href="/" className={styles.logoLink} aria-label="City Tour Guide home">
            <img src="/logo.png" alt="City Tour Guide" className={styles.logoImg} />
          </a>

          {/* CENTER — City / Region Picker */}
          <div className={styles.cityPicker}>
            <span className={styles.cityPickerPin}>📍</span>
            <select
              className={styles.cityPickerSelect}
              defaultValue="tampa"
              onChange={e => {
                if (e.target.value !== 'tampa') {
                  alert('More cities coming soon!');
                  e.target.value = 'tampa';
                }
              }}
              aria-label="Select city or region"
            >
              <option value="tampa">Tampa, FL</option>
              <option value="stpete" disabled>St. Pete, FL — Coming Soon</option>
              <option value="orlando" disabled>Orlando, FL — Coming Soon</option>
              <option value="miami" disabled>Miami, FL — Coming Soon</option>
              <option value="nyc" disabled>New York, NY — Coming Soon</option>
              <option value="la" disabled>Los Angeles, CA — Coming Soon</option>
            </select>
            <span className={styles.cityPickerChevron}>▾</span>
          </div>

          {hasSearched && (
            <div className={styles.navSearch}>
              <SearchBar onSearch={handleSearch} loading={loading} initValue={query} />
            </div>
          )}
          {!hasSearched && <div className={styles.navRightSpacer} />}

        </div>
      </header>

      {/* ── Landing Hero — ALWAYS visible, compresses when results show ── */}
      <section className={`${styles.hero} ${hasSearched ? styles.heroCompact : ''}`}>
        <div className={styles.container}>
          {!hasSearched && (
            <>
              <p className={styles.heroEyebrow}>🌴 Your City. Your Guide.</p>
              <h1 className={styles.heroTitle}>Discover What&apos;s Happening</h1>
              <p className={styles.heroSub}>Events, activities &amp; things to do. Updated daily.</p>
            </>
          )}

          {/* Search — always in hero */}
          <div className={styles.heroSearchRow}>
            <div className={styles.heroSearch}>
              <SearchBar onSearch={handleSearch} loading={loading} initValue={query} />
            </div>
            {hasSearched && (
              <button className={styles.backToBrowse} onClick={clearAll} aria-label="Back to browse">
                ← Browse All
              </button>
            )}
          </div>

          {/* Filter Dropdowns — always visible in both states */}
          <FilterDropdowns onFilter={applyFilter} />
        </div>
      </section>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className={styles.main} ref={resultsRef}>
        <div className={styles.container}>

          {/* ══ LANDING STATE — featured only (filters moved to hero) ════ */}
          {!hasSearched && featuredItems.length > 0 && (
            <div className={styles.landing}>
              <p className={styles.landingLabel}>⭐ Featured</p>
              <div className={styles.grid}>
                {featuredItems.map(item => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
              <p className={styles.landingCredit}>
                Listings sourced from verified Tampa Bay partners. All links go to original sources.
              </p>
            </div>
          )}

          {/* ══ RESULTS STATE ═══════════════════════════════════════ */}
          {hasSearched && (
            <>
              {/* Skeleton loading */}
              {loading && (
                <div className={styles.groupGrid}>
                  {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                </div>
              )}
              {/* Filters */}
              <div className={styles.filterRow}>
                <div className={styles.filterPills}>
                  <button className={`${styles.pill} ${!category ? styles.pillActive : ''}`}
                    onClick={() => applyCategory('')}>All</button>
                  {meta.categories.map(cat => (
                    <button key={cat.name}
                      className={`${styles.pill} ${category === cat.name ? styles.pillActive : ''}`}
                      onClick={() => applyCategory(category === cat.name ? '' : cat.name)}>
                      {cat.name}<span className={styles.pillCount}>{cat.count}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.dateFilters}>
                  <button className={`${styles.datePill} ${!dateFilter ? styles.datePillActive : ''}`}
                    onClick={() => applyDate('')}>Any date</button>
                  <button className={`${styles.datePill} ${dateFilter === 'today' ? styles.datePillActive : ''}`}
                    onClick={() => applyDate(dateFilter === 'today' ? '' : 'today')}>Today</button>
                  <button className={`${styles.datePill} ${dateFilter === 'weekend' ? styles.datePillActive : ''}`}
                    onClick={() => applyDate(dateFilter === 'weekend' ? '' : 'weekend')}>This Weekend</button>
                  <input type="date" className={styles.datePicker}
                    value={dateFilter && !['today','weekend'].includes(dateFilter) ? dateFilter : ''}
                    min={today} title="Pick a date"
                    onChange={e => applyDate(e.target.value || '')} />
                </div>
              </div>

              {/* Count */}
              {!loading && (
                <p className={styles.resultCount}>
                  {query ? `"${query}"` : category || 'All listings'}
                  {' · '}<strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''}
                  {groupEntries.length > 0 && ` · ${groupEntries.length} source${groupEntries.length !== 1 ? 's' : ''}`}
                  <button className={styles.clearLink} onClick={clearAll}> · clear</button>
                </p>
              )}

              {/* Featured cards */}
              {featured.length > 0 && (
                <section className={styles.featuredSection}>
                  <div className={styles.featuredLabel}>⭐ Featured</div>
                  <div className={styles.grid}>
                    {featured.map(item => <ResultCard key={item.id} item={item} />)}
                  </div>
                </section>
              )}

              {/* Grouped results */}
              {loading ? (
                <div className={styles.loadingList}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={styles.skeletonCard}>
                      <div className={styles.skeletonHeader} />
                      <div className={styles.skeletonRow} style={{ width: '75%' }} />
                      <div className={styles.skeletonRow} style={{ width: '60%' }} />
                    </div>
                  ))}
                </div>
              ) : groupEntries.length > 0 ? (
                <div className={styles.groupGrid}>
                  {groupEntries.map(([groupKey, { items, domain, category: cat }]) => (
                    <SourceGroup key={groupKey}
                      sourceName={groupByCategory ? (items[0]?.source_name || groupKey) : groupKey}
                      groupLabel={groupByCategory ? groupKey : null}
                      domain={domain} category={cat} items={items} />
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🔍</span>
                  <p>No results found{query ? ` for "${query}"` : ''}.</p>
                  <button className={styles.clearBtn} onClick={clearAll}>Try a different search</button>
                </div>
              )}

              {/* Compliance */}
              {results.length > 0 && (
                <p className={styles.complianceNote}>
                  Listings aggregated from verified local sources for discovery purposes. All links go to original third-party sites.
                  City Tour Guide is not affiliated with listed sources.
                  {featured.some(r => r.is_monetized) ? ' Featured listings may generate commissions.' : ''}
                </p>
              )}
            </>
          )}

        </div>
      </main>

      {/* ── Sticky Bottom Bar ────────────────────────────────────────── */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyBadges}>
          {/* Google Play */}
          <a href="https://play.google.com/store/apps/details?id=com.mytoursapp.android.app7801"
             target="_blank" rel="noopener noreferrer"
             className={styles.stickyBadge} aria-label="Get it on Google Play">
            <svg width="16" height="18" viewBox="0 0 24 27" fill="none" aria-hidden="true">
              <path d="M1.5 0.5L13.5 13.5L1.5 26.5C0.7 26.1 0 25.1 0 23.9V3.1C0 1.9 0.7 0.9 1.5 0.5Z" fill="#EA4335"/>
              <path d="M20 9L13.5 13.5L20 18L23.3 16.1C24.2 15.6 24.2 14.4 23.3 13.9L20 9Z" fill="#FBBC04"/>
              <path d="M1.5 0.5L13.5 13.5L20 9L4.5 0.1C3.5 -0.4 2.3 -0.1 1.5 0.5Z" fill="#4285F4"/>
              <path d="M1.5 26.5L13.5 13.5L20 18L4.5 26.9C3.5 27.4 2.3 27.1 1.5 26.5Z" fill="#34A853"/>
            </svg>
            <span><small>GET IT ON</small><strong>Google Play</strong></span>
          </a>

          {/* Web App */}
          <a href="https://citytourguide.stqry.app/" target="_blank" rel="noopener noreferrer"
             className={styles.stickyBadge} aria-label="Open Web App">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/>
              <path d="M2 12h20"/>
            </svg>
            <span><small>OPEN</small><strong>Web App</strong></span>
          </a>

          {/* App Store */}
          <span className={`${styles.stickyBadge} ${styles.stickyBadgeDim}`} title="Coming soon to iOS">
            <svg width="14" height="17" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
              <path d="M814 700c-3 130-100 210-150 230-80 30-150-20-200-20s-110 25-195 25C180 935 0 760 0 555c0-180 115-270 225-275 85-5 165 55 215 55s130-65 225-55c38 2 145 15 215 120-190 115-160 330 35 300zm-280-460c-5-90 75-175 165-185 15 110-95 200-165 185z"/>
            </svg>
            <span><small>COMING SOON</small><strong>App Store</strong></span>
          </span>
        </div>

        <div className={styles.stickyLinks}>
          <span>© 2026 City Tour Guide, Inc.</span>
          <a href="/partner">Partner</a>
          <a href="/disclaimer">Disclaimer</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="mailto:info@citytourguideinc.com">Contact</a>
        </div>
      </div>
    </div>
  );
}
