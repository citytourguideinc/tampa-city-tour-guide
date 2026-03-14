'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SearchBar   from '@/components/SearchBar';
import FilterBar   from '@/components/FilterBar';
import ResultCard  from '@/components/ResultCard';
import styles      from './page.module.css';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div style={{height:480,background:'var(--surface)',borderRadius:'var(--r-lg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>🗺 Loading map…</div> });

// ── Fallback seed — new schema ───────────────────────────────────
// listingType: 'standard' | 'partner' | 'featured'
// isMonetized: true = show Partner Link badge + disclosure applies
const SEED = [
  {
    id:'s1', title:'Visit Tampa Bay',
    category:'Tours & Activities', subcategory:'Tourism', area:'Waterfront',
    icon:'🌴', listingType:'featured', sourceType:'directory', isMonetized:false, isExternal:true,
    destinationUrl:'https://www.visittampabay.com/things-to-do/tours/',
    ctaLabel:'Visit Site ↗',
    description:'Tampa Bay\'s regional tourism directory — browse tours, events, dining, and local picks across the bay area.',
    tags:['tourism','events','guides'],
  },
  {
    id:'s2', title:'Curtis Hixon Waterfront Park',
    category:'Outdoors', subcategory:'City Parks', area:'Downtown',
    icon:'🌿', listingType:'standard', sourceType:'public', isMonetized:false, isExternal:true,
    destinationUrl:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon',
    ctaLabel:'View Source ↗',
    description:'A riverside park in the heart of Downtown Tampa — open space, walking paths, and a regular host of festivals and community events.',
    tags:['park','free','outdoors','family'],
  },
  {
    id:'s3', title:'Guided Tours via Get Your Guide',
    category:'Tours & Activities', subcategory:'Guided Tours', area:'City-wide',
    icon:'🚗', listingType:'partner', sourceType:'marketplace', isMonetized:true, isExternal:true,
    destinationUrl:'https://www.getyourguide.com/tampa-l1187/',
    ctaLabel:'Go to Booking Site ↗',
    priceRange:'$25–$120',
    description:'Browse curated Tampa tours — walking tours, golf cart rides, boat trips, and more — listed on Get Your Guide.',
    tags:['tours','paid','partner'],
  },
  {
    id:'s4', title:'Tampa Deals & Discounts',
    category:'Deals & Discounts', subcategory:'Deals', area:'City-wide',
    icon:'💰', listingType:'partner', sourceType:'marketplace', isMonetized:true, isExternal:true,
    destinationUrl:'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html',
    ctaLabel:'See Deals ↗',
    description:'Discover discounted Tampa Bay activities, dining, and attractions listed across major travel and review platforms.',
    tags:['deals','discounts','partner'],
  },
  {
    id:'s5', title:'Straz Center for the Performing Arts',
    category:'Events', subcategory:'Arts & Culture', area:'Downtown',
    icon:'🎭', listingType:'standard', sourceType:'venue', isMonetized:false, isExternal:true,
    destinationUrl:'https://www.strazcenter.org/calendar/',
    ctaLabel:'Learn More ↗',
    description:'One of the largest performing arts centers in the southeastern US — Broadway productions, concerts, and community performances.',
    tags:['events','arts','culture'],
  },
  {
    id:'s6', title:'The Florida Aquarium',
    category:'Tours & Activities', subcategory:'Attractions', area:'Channelside',
    icon:'🐠', listingType:'featured', sourceType:'attraction', isMonetized:false, isExternal:true,
    destinationUrl:'https://www.flaquarium.org',
    ctaLabel:'Visit Site ↗',
    description:'A hands-on marine experience with native Florida wildlife, dive shows, and family-friendly exhibits along Tampa\'s waterfront.',
    tags:['family','attractions','outdoors'],
  },
  {
    id:'s7', title:'Armature Works',
    category:'Food', subcategory:'Food Halls', area:'Heights',
    icon:'🍽', listingType:'standard', sourceType:'venue', isMonetized:false, isExternal:true,
    destinationUrl:'https://www.armatureworks.com',
    ctaLabel:'Visit Site ↗',
    description:'A converted historic building turned vibrant food hall and event space with riverside views, local vendors, and weekend markets.',
    tags:['food','nightlife','events'],
  },
  {
    id:'s8', title:'Ybor City Historic District',
    category:'Events', subcategory:'History & Culture', area:'Ybor City',
    icon:'🏛', listingType:'standard', sourceType:'public', isMonetized:false, isExternal:true,
    destinationUrl:'https://www.ybormuseum.org/events-programs',
    ctaLabel:'Learn More ↗',
    description:'Tampa\'s National Historic Landmark neighborhood — rich in Cuban and cigar-making heritage, street-level culture, and weekend nightlife.',
    tags:['history','culture','nightlife'],
  },
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
            <span className={styles.dot} /> Curated City Discovery · Tampa Bay
          </div>
          <h1 className={styles.h1}>Tampa City Tour Guide</h1>
          <p className={styles.sub}>Discover tours, events, attractions, deals, and local favorites across Tampa Bay</p>
          <p className={styles.subMuted}>Curated city discovery with direct links to original sources</p>
          <div className={styles.searchWrap}>
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>
        </div>
      </header>

      {/* ── Disclosure bar ──────────────────────────────────────── */}
      <div className={styles.disclosureBar}>
        <span className={styles.disclosureIcon}>ℹ️</span>
        <p>Some links on this page may be partner links. City Tour Guide may earn a commission if you book or purchase through them, at no extra cost to you.</p>
      </div>

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
              {/* Third-party note */}
              <p className={styles.thirdPartyNote}>
                Listings link to third-party websites for more details and booking.
              </p>
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

              {/* Partner disclosure repeat — near cards */}
              {!loading && results.some(r => r.isMonetized) && (
                <p className={styles.partnerNote}>
                  💼 Cards marked &ldquo;Partner Link&rdquo; may generate commissions for City Tour Guide at no extra cost to you.
                </p>
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
                          <div className={styles.savedItemName}>{item.title || item.activity_name}</div>
                          <div className={styles.savedItemCat}>{item.category}</div>
                        </div>
                        <a
                          href={item.destinationUrl || item.booking_link || item.official_link || '#'}
                          target="_blank" rel="noopener noreferrer"
                          className={styles.savedItemLink}
                          aria-label="Visit site — opens in a new tab"
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
          <p className={styles.footerLinks}>
            © 2026 <span className={styles.brand}>City Tour Guide, Inc.</span>
            {' · '}<a href="/partner.html">Become a Partner</a>
            {' · '}<a href="/resources">📚 Resources</a>
            {' · '}<a href="/disclaimer">Disclaimer</a>
            {' · '}<a href="/privacy">Privacy</a>
            {' · '}<a href="/terms">Terms</a>
          </p>
          <p className={styles.footerDisclaimer}>
            Listings are curated for discovery purposes. External links lead to third-party websites.
            Some links may generate commissions for City Tour Guide at no extra cost to users.
          </p>
        </div>
      </footer>
    </div>
  );
}
