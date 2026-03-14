'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SearchBar   from '@/components/SearchBar';
import FilterBar   from '@/components/FilterBar';
import ResultCard  from '@/components/ResultCard';
import styles      from './page.module.css';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div style={{height:480,background:'var(--surface)',borderRadius:'var(--r-lg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>🗺 Loading map…</div> });

// ── Fallback seed for when Supabase isn't yet connected ──────────
const SEED = [
  { id:'s1', activity_name:'Visit Tampa Bay', category:'Tourism & Activities', neighborhood:'Waterfront', icon:'🌴', official_link:'https://www.visittampabay.com', short_summary:'Official Tampa Bay visitor guide — tours, events, deals and more.' },
  { id:'s2', activity_name:'Curtis Hixon Waterfront Park', category:'City Parks', neighborhood:'Downtown', icon:'🌿', official_link:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon', short_summary:'Scenic waterfront park with events, festivals, and great views of the Hillsborough River.' },
  { id:'s3', activity_name:'Tampa Golf Cart Tours', category:'Tours & Activities', neighborhood:'Ybor City', icon:'🚗', booking_link:'https://www.getyourguide.com/tampa-l1187/', short_summary:'Explore Tampa and Ybor City on a fun guided golf cart tour — a local favourite.' },
  { id:'s4', activity_name:'Groupon Tampa Deals', category:'Deals & Discounts', neighborhood:'City-wide', icon:'💰', booking_link:'https://www.groupon.com/local/tampa/sightseeing-and-tours', short_summary:'Save big on Tampa Bay tours, restaurants, and activities.' },
  { id:'s5', activity_name:'Straz Center Performances', category:'Arts & Culture', neighborhood:'Downtown', icon:'🎭', official_link:'https://www.strazcenter.org/calendar/', short_summary:'World-class Broadway shows, concerts, and performing arts.' },
  { id:'s6', activity_name:'The Florida Aquarium', category:'Attractions', neighborhood:'Channelside', icon:'🐠', booking_link:'https://www.flaquarium.org', short_summary:'Tampa\'s premier aquarium with marine life, dive shows, and volunteer opportunities.' },
  { id:'s7', activity_name:'Armature Works', category:'Food & Nightlife', neighborhood:'Heights', icon:'🍽', official_link:'https://www.armatureworks.com', short_summary:'Stunning waterfront food hall with craft cocktails, events, and city views.' },
  { id:'s8', activity_name:'Ybor City Historic District', category:'History & Culture', neighborhood:'Ybor City', icon:'🏛', official_link:'https://www.ybormuseum.org', short_summary:'Tampa\'s iconic cigar-rolling district — history, nightlife, and Cuban cuisine.' },
];

export default function Home() {
  const [query,   setQuery]   = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState(SEED);
  const [reply,   setReply]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [mapMode,   setMapMode]   = useState(false);

  // Load saved from localStorage
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem('ctg_saved') || '[]')); } catch {}
  }, []);

  // Persist saved
  useEffect(() => {
    localStorage.setItem('ctg_saved', JSON.stringify(saved));
  }, [saved]);

  // Initial load — fetch all activities from Supabase on mount
  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      try {
        const res  = await fetch('/api/search');
        const data = await res.json();
        if (data.results?.length) setResults(data.results);
        // else keep SEED as fallback
      } catch { /* keep SEED */ }
      finally { setLoading(false); }
    }
    initialLoad();
  }, []);

  // Filter-bar changes → re-fetch
  useEffect(() => {
    const hasFilter = Object.values(filters).some(v => v !== undefined && v !== '');
    if (hasFilter) fetchFiltered();
    else setResults(SEED);
  }, [filters]);

  async function fetchFiltered() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v); });
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results?.length ? data.results : SEED);
      setReply(null);
    } catch { setResults(SEED); }
    finally  { setLoading(false); }
  }

  async function handleSearch(q) {
    setQuery(q);
    setLoading(true);
    setReply(null);
    try {
      // Try AI search first
      const chatRes  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const chatData = await chatRes.json();
      if (chatData.reply) setReply(chatData.reply);

      // If AI returned results use them, else fall back to keyword search
      if (chatData.results?.length) {
        setResults(chatData.results);
      } else {
        const searchRes  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const searchData = await searchRes.json();
        setResults(searchData.results?.length ? searchData.results : SEED);
      }
    } catch {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results?.length ? data.results : SEED);
      } catch { setResults(SEED); }
    }
    finally { setLoading(false); }
  }

  function toggleSave(item) {
    setSaved(prev => {
      const exists = prev.some(s => s.id === item.id);
      return exists ? prev.filter(s => s.id !== item.id) : [...prev, item];
    });
  }

  const isSaved = useCallback((id) => saved.some(s => s.id === id), [saved]);

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>
            <span className={styles.dot} /> AI-Powered · Tampa Bay
          </div>
          <h1 className={styles.h1}>Tampa City Tour Guide</h1>
          <p className={styles.sub}>Discover the best tours, events, deals, and things to do in Tampa Bay</p>
          <div className={styles.searchWrap}>
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* AI reply */}
          {reply && (
            <div className={styles.aiReply}>
              <span className={styles.aiAvatar}>🤖</span>
              <p>{reply}</p>
            </div>
          )}

          {/* Toolbar: filters + map + saved toggle */}
          <div className={styles.toolbar}>
            <FilterBar filters={filters} onChange={setFilters} />
            <div className={styles.toolbarActions}>
              <button
                className={`${styles.toolBtn} ${mapMode ? styles.toolBtnActive : ''}`}
                onClick={() => setMapMode(m => !m)}
                title="Toggle map"
              >
                🗺 {mapMode ? 'List' : 'Map'}
              </button>
              <button
                className={`${styles.toolBtn} ${showSaved ? styles.toolBtnActive : ''}`}
                onClick={() => setShowSaved(s => !s)}
                title="Saved places"
              >
                ❤️ Saved {saved.length > 0 && <span className={styles.savedCount}>{saved.length}</span>}
              </button>
            </div>
          </div>

          {/* Results section */}
          <div className={styles.content}>
            <div className={styles.resultsArea}>
              {/* Count */}
              {!loading && results.length > 0 && (
                <p className={styles.resultCount}>
                  {query ? `Results for "${query}"` : 'Popular in Tampa Bay'} · {results.length} found
                </p>
              )}

              {/* Map view */}
              {mapMode && <MapView results={results} />}

              {/* Loading */}
              {!mapMode && loading && (
                <div className={styles.loadingGrid}>
                  {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
                </div>
              )}

              {/* Results grid */}
              {!mapMode && !loading && results.length > 0 && (
                <div className={styles.grid}>
                  {results.map(item => (
                    <ResultCard
                      key={item.id}
                      item={item}
                      saved={isSaved(item.id)}
                      onSave={toggleSave}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!mapMode && !loading && results.length === 0 && (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🔍</span>
                  <p>No results found. Try a different search or clear your filters.</p>
                </div>
              )}
            </div>

            {/* Saved list drawer */}
            {showSaved && (
              <aside className={styles.savedDrawer}>
                <div className={styles.savedHeader}>
                  <h2>❤️ Saved Places</h2>
                  <button className={styles.closeBtn} onClick={() => setShowSaved(false)}>✕</button>
                </div>
                {saved.length === 0 ? (
                  <p className={styles.savedEmpty}>Heart any card to save it here.</p>
                ) : (
                  <div className={styles.savedList}>
                    {saved.map(item => (
                      <div key={item.id} className={styles.savedItem}>
                        <span>{item.icon || '📍'}</span>
                        <div className={styles.savedItemBody}>
                          <div className={styles.savedItemName}>{item.activity_name}</div>
                          <div className={styles.savedItemCat}>{item.category}</div>
                        </div>
                        <a
                          href={item.booking_link || item.official_link || '#'}
                          target="_blank" rel="noopener noreferrer"
                          className={styles.savedItemLink}
                        >↗</a>
                        <button className={styles.savedItemRemove} onClick={() => toggleSave(item)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>
            © 2026 <span className={styles.brand}>City Tour Guide, Inc.</span> ·{' '}
            <a href="/partner.html">Become a Partner</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
