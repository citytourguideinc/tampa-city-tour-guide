'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar    from '@/components/SearchBar';
import ResultCard   from '@/components/ResultCard';
import SourceGroup  from '@/components/SourceGroup';
import SkeletonCard from '@/components/SkeletonCard';
import styles       from './page.module.css';

// Search suggestion prompts shown on first load
const PROMPTS = [
  { icon: '🎟', label: 'Events',         sub: 'This Weekend',      q: '',            date: 'weekend', grad: 'linear-gradient(135deg,#FF6B35,#F7C59F)' },
  { icon: '🆓', label: 'Free Things',    sub: 'No Cost Activities', q: 'free',        date: '',        grad: 'linear-gradient(135deg,#11998e,#38ef7d)' },
  { icon: '🎵', label: 'Live Music',     sub: 'Bars & Venues',     q: 'music',       date: '',        grad: 'linear-gradient(135deg,#7b4397,#dc2430)' },
  { icon: '🧘', label: 'Wellness',       sub: 'Yoga & Fitness',    q: 'yoga fitness',date: '',        grad: 'linear-gradient(135deg,#1CB5E0,#000851)' },
  { icon: '🎨', label: 'Arts & Culture', sub: 'Galleries & Shows', q: '',            date: '',        category: 'Arts & Culture', grad: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { icon: '🍽', label: 'Food & Dining',  sub: 'Restaurants',       q: 'food dining', date: '',       grad: 'linear-gradient(135deg,#FA8231,#f7b731)' },
  { icon: '🌿', label: 'Outdoors',       sub: 'Parks & Nature',    q: 'park outdoor',date: '',       grad: 'linear-gradient(135deg,#134E5E,#71B280)' },
  { icon: '👨‍👩‍👧', label: 'Family', sub: 'Kid-Friendly Fun',  q: 'family kids', date: '', grad: 'linear-gradient(135deg,#4481eb,#04befe)' },
];

export default function Home() {
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [meta,         setMeta]         = useState({ categories: [], areas: [] });
  const [category,     setCategory]     = useState('');
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

          {/* App Download Badges — only on landing */}
          {!hasSearched && (
            <div className={styles.appBadges}>
              <a
                href="https://play.google.com/store/apps/details?id=com.mytoursapp.android.app7801"
                target="_blank" rel="noopener noreferrer"
                className={`${styles.appBadge} ${styles.appBadgeAndroid}`}
                aria-label="Get it on Google Play"
              >
                <span className={styles.appBadgeIcon}>▶</span>
                <span><span style={{fontSize:'0.65rem',display:'block',opacity:0.6}}>GET IT ON</span>Google Play</span>
              </a>
              <a
                href="https://citytourguide.stqry.app/"
                target="_blank" rel="noopener noreferrer"
                className={`${styles.appBadge} ${styles.appBadgeWeb}`}
                aria-label="Open Web App"
              >
                <span className={styles.appBadgeIcon}>🌐</span>
                <span><span style={{fontSize:'0.65rem',display:'block',opacity:0.6}}>OPEN</span>Web App</span>
              </a>
              <span className={`${styles.appBadge} ${styles.appBadgeIos}`} title="Coming soon to iOS">
                <span className={styles.appBadgeIcon} style={{fontFamily:'serif',fontStyle:'italic',fontWeight:700,fontSize:'1.1rem'}}></span>
                <span><span style={{fontSize:'0.65rem',display:'block'}}>COMING SOON</span>App Store</span>
              </span>
            </div>
          )}
        </div>
      </section>


      {/* ── Main ────────────────────────────────────────────────── */}
      <main className={styles.main} ref={resultsRef}>
        <div className={styles.container}>

          {/* ══ LANDING STATE — category cards + featured ════════════ */}
          {!hasSearched && (
            <div className={styles.landing}>

              {/* Premium category icon cards — vibrant gradients */}
              <p className={styles.landingLabel}>Explore by Category</p>
              <div className={styles.promptGrid}>
                {PROMPTS.map(p => (
                  <button
                    key={p.label}
                    className={styles.promptCard}
                    style={{ background: p.grad }}
                    onClick={() => applyPrompt(p)}
                  >
                    <span className={styles.promptCardIcon}>{p.icon}</span>
                    <span className={styles.promptCardLabel} style={{ color: '#fff' }}>{p.label}</span>
                    <span className={styles.promptCardSub} style={{ color: 'rgba(255,255,255,0.75)' }}>{p.sub}</span>
                  </button>
                ))}
              </div>

              {/* Featured listings — always visible */}
              {featuredItems.length > 0 && (
                <div className={styles.landingFeatured}>
                  <p className={styles.landingLabel}>⭐ Featured</p>
                  <div className={styles.grid}>
                    {featuredItems.map(item => (
                      <ResultCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Source credit */}
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

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.footerLinks}>
            © 2026 <span className={styles.brand}>City Tour Guide, Inc.</span>
            {' · '}<a href="/partner">Become a Partner</a>
            {' · '}<a href="/disclaimer">Disclaimer</a>
            {' · '}<a href="/privacy">Privacy</a>
            {' · '}<a href="/terms">Terms</a>
            {' · '}<a href="mailto:info@citytourguideinc.com">Contact</a>
          </p>
          <p className={styles.footerDisclaimer}>
            Discovery only · External links lead to third-party sites · Not affiliated with listed sources
          </p>
        </div>
      </footer>
    </div>
  );
}
