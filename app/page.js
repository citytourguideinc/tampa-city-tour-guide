'use client';
import { useState, useEffect, useCallback } from 'react';
import SearchBar   from '@/components/SearchBar';
import ResultCard  from '@/components/ResultCard';
import SourceGroup from '@/components/SourceGroup';
import styles      from './page.module.css';

export default function Home() {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [meta,       setMeta]       = useState({ categories: [], areas: [] });
  const [category,   setCategory]   = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Load meta (categories) once on mount
  useEffect(() => {
    fetch('/api/search/meta')
      .then(r => r.json())
      .then(data => setMeta(data))
      .catch(() => {});
  }, []);

  const fetchResults = useCallback(async (q = '', cat = '', date = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
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

  // Initial load
  useEffect(() => { fetchResults(); }, []);

  // Re-fetch when filters change
  useEffect(() => { fetchResults(query, category, dateFilter); }, [category, dateFilter]);

  function handleSearch(q) {
    setQuery(q);
    fetchResults(q, category, dateFilter);
  }

  function clearAll() {
    setQuery(''); setCategory(''); setDateFilter('');
    fetchResults('', '', '');
  }

  // ── Split featured/partner (top cards) from standard results ───
  const featuredItems = results.filter(r => r.listing_type === 'featured' || r.listing_type === 'partner');
  const standardItems = results.filter(r => !r.listing_type || r.listing_type === 'standard');

  // ── Group standard items by source ────────────────────────────
  const sourceGroups = {};
  for (const item of standardItems) {
    const key = item.source_name || 'Other';
    if (!sourceGroups[key]) sourceGroups[key] = { items: [], domain: item.source_domain, category: item.category };
    sourceGroups[key].items.push(item);
  }
  const groupEntries = Object.entries(sourceGroups)
    .sort(([, a], [, b]) => b.items.length - a.items.length); // most items first

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>
            <span className={styles.dot} /> Curated City Discovery · Tampa Bay
          </div>
          <h1 className={styles.h1}>Tampa City Tour Guide</h1>
          <p className={styles.sub}>Events, activities &amp; things to do in Downtown Tampa</p>
          <p className={styles.subMuted}>
            Sourced from verified local partners · Updated daily · All links go to original sources
          </p>
          <div className={styles.searchWrap}>
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── Filters ─────────────────────────────────────────── */}
          <div className={styles.filterRow}>
            {/* Category pills — only show categories that exist in DB */}
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

            {/* Date quick filters */}
            <div className={styles.dateFilters}>
              <button className={`${styles.datePill} ${!dateFilter ? styles.datePillActive : ''}`}
                onClick={() => setDateFilter('')}>Any date</button>
              <button className={`${styles.datePill} ${dateFilter === 'today' ? styles.datePillActive : ''}`}
                onClick={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}>Today</button>
              <button className={`${styles.datePill} ${dateFilter === 'weekend' ? styles.datePillActive : ''}`}
                onClick={() => setDateFilter(dateFilter === 'weekend' ? '' : 'weekend')}>This Weekend</button>
              <input
                type="date"
                className={styles.datePicker}
                value={dateFilter && dateFilter !== 'today' && dateFilter !== 'weekend' ? dateFilter : ''}
                min={today}
                title="Pick a specific date"
                onChange={e => setDateFilter(e.target.value || '')}
              />
            </div>
          </div>

          {/* ── Result count ─────────────────────────────────────── */}
          {!loading && (
            <p className={styles.resultCount}>
              {query ? `Results for "${query}"` : category ? category : 'All listings'}
              {' · '}<strong>{results.length}</strong> listing{results.length !== 1 ? 's' : ''}
              {groupEntries.length > 0 && ` from ${groupEntries.length} source${groupEntries.length !== 1 ? 's' : ''}`}
              {(query || category || dateFilter) && (
                <button className={styles.clearLink} onClick={clearAll}>· clear</button>
              )}
            </p>
          )}

          {/* ── Featured / Partner cards (paid tier) ─────────────── */}
          {featuredItems.length > 0 && (
            <section className={styles.featuredSection}>
              <div className={styles.featuredLabel}>⭐ Featured Listings</div>
              <div className={styles.grid}>
                {featuredItems.map(item => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* ── Source-grouped compact cards ──────────────────────── */}
          {loading ? (
            <div className={styles.loadingList}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader} />
                  <div className={styles.skeletonRow} style={{ width: '80%' }} />
                  <div className={styles.skeletonRow} style={{ width: '65%' }} />
                  <div className={styles.skeletonRow} style={{ width: '72%' }} />
                </div>
              ))}
            </div>
          ) : groupEntries.length > 0 ? (
            <div className={styles.groupGrid}>
              {groupEntries.map(([sourceName, { items, domain, category: cat }]) => (
                <SourceGroup
                  key={sourceName}
                  sourceName={sourceName}
                  domain={domain}
                  category={cat}
                  items={items}
                />
              ))}
            </div>
          ) : !loading && results.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔍</span>
              <p>{query ? `No results found for "${query}"` : 'No listings match your filters.'}</p>
              <button className={styles.clearBtn} onClick={clearAll}>Clear filters</button>
            </div>
          )}

          {/* ── Compliance disclosure ─────────────────────────────── */}
          {!loading && results.length > 0 && (
            <p className={styles.complianceNote}>
              City Tour Guide aggregates publicly available information from verified local sources for discovery purposes.
              All listings link directly to original third-party websites. City Tour Guide is not affiliated with, endorsed by,
              or responsible for content on linked sites.{featuredItems.some(r => r.is_monetized) ? ' Some featured listings are paid placements and may generate commissions.' : ''}
            </p>
          )}

        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
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
            Aggregated listings for discovery only. External links lead to third-party sites. Not affiliated with listed sources.
          </p>
        </div>
      </footer>
    </div>
  );
}
