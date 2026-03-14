'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchBar  from '@/components/SearchBar';
import ResultCard from '@/components/ResultCard';
import ResultRow  from '@/components/ResultRow';
import styles     from './page.module.css';

export default function Home() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [meta,     setMeta]     = useState({ categories: [], areas: [], minDate: null, maxDate: null });
  const [saved,    setSaved]    = useState([]);

  // Active filters
  const [category,  setCategory]  = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 'today' | 'weekend' | YYYY-MM-DD | ''

  // Load saved from localStorage
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem('ctg_saved') || '[]')); } catch {}
  }, []);

  // Persist saved
  useEffect(() => {
    localStorage.setItem('ctg_saved', JSON.stringify(saved));
  }, [saved]);

  // Load meta (categories/dates) once
  useEffect(() => {
    fetch('/api/search/meta')
      .then(r => r.json())
      .then(data => setMeta(data))
      .catch(() => {});
  }, []);

  // Fetch results whenever query/filters change
  const fetchResults = useCallback(async (q = query, cat = category, date = dateFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '80' });
      if (q)    params.set('q', q);
      if (cat)  params.set('category', cat);
      if (date) params.set('date', date);
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, dateFilter]);

  // Initial load
  useEffect(() => { fetchResults('', '', ''); }, []);

  // Refetch on filter changes
  useEffect(() => { fetchResults(query, category, dateFilter); }, [category, dateFilter]);

  function handleSearch(q) {
    setQuery(q);
    fetchResults(q, category, dateFilter);
  }

  function toggleSave(item) {
    setSaved(prev => {
      const exists = prev.some(s => s.id === item.id);
      return exists ? prev.filter(s => s.id !== item.id) : [...prev, item];
    });
  }
  const isSaved = useCallback((id) => saved.some(s => s.id === id), [saved]);

  // Split: featured/partner go to cards section, standard goes to list
  const featuredItems  = results.filter(r => r.listing_type === 'featured' || r.listing_type === 'partner');
  const standardItems  = results.filter(r => !r.listing_type || r.listing_type === 'standard');

  // Group standard items by date for the CL-style display
  const groupedByDate = {};
  for (const item of standardItems) {
    const key = item.event_date || '__no_date';
    if (!groupedByDate[key]) groupedByDate[key] = [];
    groupedByDate[key].push(item);
  }
  const dateGroups = Object.entries(groupedByDate).sort(([a], [b]) => {
    if (a === '__no_date') return 1;
    if (b === '__no_date') return -1;
    return a.localeCompare(b);
  });

  function formatGroupDate(dateKey) {
    if (dateKey === '__no_date') return 'Ongoing / No Date';
    const d = new Date(dateKey + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return `Today — ${d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}`;
    if (diff === 1) return `Tomorrow — ${d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}`;
    return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const weekendDate = (() => {
    const d = new Date();
    const sat = new Date(d);
    sat.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
    return sat.toISOString().slice(0, 10);
  })();

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>
            <span className={styles.dot} /> Curated City Discovery · Tampa Bay
          </div>
          <h1 className={styles.h1}>Tampa City Tour Guide</h1>
          <p className={styles.sub}>Events, activities, and things to do in Downtown Tampa</p>
          <p className={styles.subMuted}>Sourced from Tampa Downtown Partnership · Updated daily</p>
          <div className={styles.searchWrap}>
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── Filters ─────────────────────────────────────────────── */}
          <div className={styles.filterRow}>
            {/* Category pills */}
            <div className={styles.filterPills}>
              <button
                className={`${styles.pill} ${!category ? styles.pillActive : ''}`}
                onClick={() => setCategory('')}
              >All</button>
              {meta.categories.map(cat => (
                <button
                  key={cat.name}
                  className={`${styles.pill} ${category === cat.name ? styles.pillActive : ''}`}
                  onClick={() => setCategory(category === cat.name ? '' : cat.name)}
                >
                  {cat.name}
                  <span className={styles.pillCount}>{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Date quick-filters */}
            <div className={styles.dateFilters}>
              <button className={`${styles.datePill} ${!dateFilter ? styles.datePillActive : ''}`}
                onClick={() => setDateFilter('')}>Any date</button>
              <button className={`${styles.datePill} ${dateFilter === 'today' ? styles.datePillActive : ''}`}
                onClick={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}>Today</button>
              <button className={`${styles.datePill} ${dateFilter === 'weekend' ? styles.datePillActive : ''}`}
                onClick={() => setDateFilter(dateFilter === 'weekend' ? '' : 'weekend')}>This Weekend</button>
              {/* Date picker  */}
              <input
                type="date"
                className={styles.datePicker}
                value={dateFilter && dateFilter !== 'today' && dateFilter !== 'weekend' ? dateFilter : ''}
                min={today}
                onChange={e => setDateFilter(e.target.value || '')}
                title="Pick a specific date"
              />
            </div>
          </div>

          {/* ── Result count ────────────────────────────────────────── */}
          {!loading && (
            <p className={styles.resultCount}>
              {query
                ? `Results for "${query}"`
                : category
                  ? category
                  : 'All listings'}
              {' · '}<strong>{results.length}</strong> found
              {' · '}<span className={styles.sourceTag}>Tampa Downtown Partnership</span>
            </p>
          )}

          {/* ── Featured / Partner cards (paid tier) ────────────────── */}
          {featuredItems.length > 0 && (
            <section className={styles.featuredSection}>
              <div className={styles.featuredLabel}>⭐ Featured Listings</div>
              <div className={styles.grid}>
                {featuredItems.map(item => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    saved={isSaved(item.id)}
                    onSave={toggleSave}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Craigslist-style list ────────────────────────────────── */}
          {loading ? (
            <div className={styles.loadingList}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={styles.skeletonRow} style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          ) : standardItems.length > 0 ? (
            <section className={styles.listSection}>
              {dateGroups.map(([dateKey, items]) => (
                <div key={dateKey}>
                  <div className={styles.dateGroupHeader}>
                    {formatGroupDate(dateKey)}
                    <span className={styles.groupCount}>{items.length}</span>
                  </div>
                  {items.map(item => (
                    <ResultRow key={item.id} item={item} />
                  ))}
                </div>
              ))}
            </section>
          ) : !loading && results.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔍</span>
              <p>{query ? `No results found for "${query}"` : 'No listings match your filters.'}</p>
              <button className={styles.clearBtn} onClick={() => { setCategory(''); setDateFilter(''); setQuery(''); fetchResults('', '', ''); }}>
                Clear filters
              </button>
            </div>
          )}

          {/* ── Partner disclosure ───────────────────────────────────── */}
          {featuredItems.some(r => r.is_monetized) && (
            <p className={styles.partnerNote}>
              💼 Featured listings marked "Partner Link" may generate commissions for City Tour Guide at no extra cost to you.
            </p>
          )}

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p className={styles.footerLinks}>
            © 2026 <span className={styles.brand}>City Tour Guide, Inc.</span>
            {' · '}<a href="/partner.html">Become a Partner</a>
            {' · '}<a href="/resources">📚 Resources</a>
            {' · '}<a href="/disclaimer">Disclaimer</a>
            {' · '}<a href="/privacy">Privacy</a>
            {' · '}<a href="/terms">Terms</a>
          </p>
          <p className={styles.footerDisclaimer}>
            Listings sourced from Tampa Downtown Partnership. External links lead to third-party websites.
          </p>
        </div>
      </footer>
    </div>
  );
}
