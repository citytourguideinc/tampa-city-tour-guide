'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchBar   from '@/components/SearchBar';
import ResultCard  from '@/components/ResultCard';
import SourceGroup from '@/components/SourceGroup';
import styles      from './page.module.css';

// Search suggestion prompts shown on first load
const PROMPTS = [
  { label: '🎟 Events this weekend', q: '', date: 'weekend' },
  { label: '🆓 Free things to do',   q: 'free', date: '' },
  { label: '🎵 Live music',          q: 'music', date: '' },
  { label: '🧘 Yoga & fitness',      q: 'yoga fitness', date: '' },
  { label: '🎨 Arts & culture',      q: '', date: '', category: 'Arts & Culture' },
  { label: '🍽 Food & dining',       q: 'food dining', date: '' },
  { label: '🌿 Outdoors & parks',    q: 'park outdoor', date: '' },
  { label: '👨‍👩‍👧 Family friendly',   q: 'family kids', date: '' },
];

export default function Home() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [meta,       setMeta]       = useState({ categories: [], areas: [] });
  const [category,   setCategory]   = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [featuredItems, setFeaturedItems] = useState([]);

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

  // Group standard by source
  const sourceGroups = {};
  for (const item of standard) {
    const key = item.source_name || 'Other';
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

          {/* LEFT — Logo + Brand */}
          <a href="/" className={styles.logoLink} aria-label="City Tour Guide home">
            <img src="/logo.svg" alt="City Tour Guide" className={styles.logoImg} />
          </a>

          {/* CENTER — City / Region Picker */}
          <div className={styles.cityPicker}>
            <span className={styles.cityPickerPin}>📍</span>
            <select
              className={styles.cityPickerSelect}
              defaultValue="nationwide"
              onChange={e => {
                if (e.target.value === 'tampa') {
                  // Tampa is live — could filter by city in future
                } else if (e.target.value !== 'nationwide') {
                  alert('More cities coming soon!');
                  e.target.value = 'nationwide';
                }
              }}
              aria-label="Select city or region"
            >
              <option value="nationwide">Nationwide</option>
              <option value="tampa">Tampa, FL ✓ Live</option>
              <option value="stpete" disabled>St. Pete, FL — Coming Soon</option>
              <option value="orlando" disabled>Orlando, FL — Coming Soon</option>
              <option value="miami" disabled>Miami, FL — Coming Soon</option>
              <option value="nyc" disabled>New York, NY — Coming Soon</option>
              <option value="la" disabled>Los Angeles, CA — Coming Soon</option>
            </select>
            <span className={styles.cityPickerChevron}>▾</span>
          </div>

          {/* RIGHT — Inline search (results mode only) */}
          {hasSearched && (
            <div className={styles.navSearch}>
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>
          )}
          {!hasSearched && <div className={styles.navRightSpacer} />}

        </div>
      </header>

      {/* ── Landing Hero (shown only before search) ─────────────── */}
      {!hasSearched && (
        <section className={styles.hero}>
          <div className={styles.container}>
            <p className={styles.heroEyebrow}>🌴 Your City. Your Guide.</p>
            <h1 className={styles.heroTitle}>Discover What's Happening</h1>
            <p className={styles.heroSub}>Events, activities &amp; things to do — updated daily</p>
            <div className={styles.heroSearch}>
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        </section>
      )}


      {/* ── Main ────────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ══ LANDING STATE — no search yet ══════════════════════ */}
          {!hasSearched && (
            <div className={styles.landing}>

              {/* Search prompt chips */}
              <p className={styles.landingLabel}>What are you looking for?</p>
              <div className={styles.promptGrid}>
                {PROMPTS.map(p => (
                  <button
                    key={p.label}
                    className={styles.promptChip}
                    onClick={() => applyPrompt(p)}
                  >
                    {p.label}
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
                Listings sourced from verified Tampa Bay partners · All links go to original sources
              </p>
            </div>
          )}

          {/* ══ RESULTS STATE ═══════════════════════════════════════ */}
          {hasSearched && (
            <>
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
                  {groupEntries.map(([sourceName, { items, domain, category: cat }]) => (
                    <SourceGroup key={sourceName} sourceName={sourceName}
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
