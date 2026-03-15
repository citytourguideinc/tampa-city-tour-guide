'use client';
import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';
const TABS = ['📡 Sources', '📄 Items', '🏃 Activities', '🏪 Vendors', '✅ Setup', '🗂 Tampa Resources'];

export default function AdminPage() {
  const [authed,  setAuthed]  = useState(false);
  const [pwd,     setPwd]     = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (localStorage.getItem('ctg_admin')) setAuthed(true);
  }, []);

  function login() {
    if (pwd === ADMIN_PWD) { localStorage.setItem('ctg_admin', '1'); setAuthed(true); }
    else setError('Incorrect password.');
  }

  function logout() { localStorage.removeItem('ctg_admin'); setAuthed(false); }

  if (!authed) return (
    <div className={styles.loginPage}>
      <div className={styles.loginBox}>
        <div className={styles.loginIcon}>⚙️</div>
        <h1 className={styles.loginTitle}>City Tour Guide Admin</h1>
        <p className={styles.loginSub}>City Tour Guide, Inc. — Internal panel</p>
        <input className={styles.loginInput} type="password" placeholder="Password" value={pwd}
          onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        <button className={styles.loginBtn} onClick={login}>Sign In</button>
        {error && <p className={styles.loginErr}>{error}</p>}
      </div>
    </div>
  );

  return <Dashboard onLogout={logout} />;
}

// ── Full dashboard ─────────────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [tab,     setTab]     = useState(0);
  const [acts,    setActs]    = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [newAct,  setNewAct]  = useState({ activity_name:'', category:'', neighborhood:'', short_summary:'', booking_link:'', official_link:'', icon:'📍', source_name:'', city:'Tampa' });

  // Trusted engine state
  const [sources,     setSources]     = useState([]);
  const [items,       setItems]       = useState([]);
  const [totalItems,  setTotalItems]  = useState(0);
  const [crawling,    setCrawling]    = useState(false);
  const [crawlLog,    setCrawlLog]    = useState(null);
  const [itemFilter,  setItemFilter]  = useState({ q:'', category:'', listing_type:'', status:'pending', page: 0 });
  const [itemLoading, setItemLoading] = useState(false);

  // Tampa Resources state
  const [tampaSources,      setTampaSources]      = useState([]);
  const [tampaTotal,        setTampaTotal]        = useState(0);
  const [tampaLoading,      setTampaLoading]      = useState(false);
  const [tampaSubTab,       setTampaSubTab]       = useState('sources'); // 'sources' | 'candidates'
  const [tampaFilter,       setTampaFilter]       = useState({ q:'', neighborhood:'', category:'', status:'', tier:'', is_core:'', event_type:'', page:0 });
  const [candidates,        setCandidates]        = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const NEIGHBORHOODS = ['','Citywide','Downtown Core','Downtown / Channel District','Downtown / Riverwalk','Downtown / Water Street','Ybor City','NoHo / North Howard','SoHo / South Howard','Hyde Park','SOG / South of Gandy','Seminole Heights','Davis Islands','Westshore','Midtown','North Tampa','East Tampa'];
  const CTG_CATEGORIES = ['','Calendars','Things To Do','Dining','Restaurant Events','Events & Activities','Arts & Culture','Sports & Recreation','Family & Attractions','Transportation','Venues'];
  const EVENT_TYPES = ['','happy_hour','trivia','live_music','brunch','outdoor','festival','film','comedy','sports'];

  const loadTampaSources = useCallback(async (filter = tampaFilter) => {
    setTampaLoading(true);
    try {
      const p = new URLSearchParams({ limit: 30, page: filter.page });
      if (filter.q)           p.set('q', filter.q);
      if (filter.neighborhood) p.set('neighborhood', filter.neighborhood);
      if (filter.category)    p.set('category', filter.category);
      if (filter.status)      p.set('status', filter.status);
      if (filter.tier)        p.set('tier', filter.tier);
      if (filter.is_core)     p.set('is_core', filter.is_core);
      if (filter.event_type)  p.set('event_type', filter.event_type);
      const res  = await fetch(`/api/admin/tampa-resources?${p}`, { headers: adminHeaders });
      const data = await res.json();
      setTampaSources(data.resources || []);
      setTampaTotal(data.total || 0);
    } catch { flash('Failed to load Tampa Resources', true); }
    finally { setTampaLoading(false); }
  }, [tampaFilter]);

  const updateTampaSource = useCallback(async (id, updates) => {
    try {
      await fetch('/api/admin/tampa-resources', { method:'PATCH', headers: adminHeaders, body: JSON.stringify({ id, ...updates }) });
      setTampaSources(prev => prev.map(r => r.tables_record_id === id ? { ...r, ...updates } : r));
      flash('Source updated');
    } catch { flash('Update failed', true); }
  }, []);

  const loadCandidates = useCallback(async () => {
    setCandidatesLoading(true);
    try {
      const res  = await fetch('/api/admin/tampa-resources?candidates=1', { headers: adminHeaders });
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch { flash('Failed to load candidates', true); }
    finally { setCandidatesLoading(false); }
  }, []);

  const reviewCandidate = useCallback(async (id, action, reason = '') => {
    try {
      await fetch('/api/admin/tampa-resources', { method:'POST', headers: adminHeaders, body: JSON.stringify({ candidateId: id, action, rejection_reason: reason }) });
      setCandidates(prev => prev.filter(c => c.id !== id));
      flash(action === 'approve' ? '✅ Approved — inserted into Tampa Resources' : '🚫 Rejected — logged with reason');
    } catch { flash('Action failed', true); }
  }, []);

  const adminHeaders = { 'x-admin-secret': ADMIN_PWD, 'Content-Type': 'application/json' };

  function flash(text, isErr = false) {
    setMsg({ text, isErr });
    setTimeout(() => setMsg(''), 3500);
  }

  // ── Sources ──────────────────────────────────────────────────
  const loadSources = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/sources', { headers: adminHeaders });
      const data = await res.json();
      setSources(data.sources || []);
    } catch { flash('Failed to load sources', true); }
  }, []);

  const loadItems = useCallback(async (filter = itemFilter) => {
    setItemLoading(true);
    try {
      const params = new URLSearchParams({ limit: 25, page: filter.page });
      if (filter.q)            params.set('q', filter.q);
      if (filter.category)     params.set('category', filter.category);
      if (filter.listing_type) params.set('listing_type', filter.listing_type);
      params.set('status', filter.status || 'pending');
      const res  = await fetch(`/api/admin/items?${params}`, { headers: adminHeaders });
      const data = await res.json();
      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch { flash('Failed to load items', true); }
    finally { setItemLoading(false); }
  }, [itemFilter]);

  async function triggerCrawl(sourceNames = null) {
    setCrawling(true);
    try {
      const body = sourceNames ? JSON.stringify({ sourceNames }) : '{}';
      const res  = await fetch('/api/crawl', { method: 'POST', headers: adminHeaders, body });
      const data = await res.json();
      setCrawlLog(data);
      const extracted = data.summary?.totalItemsExtracted || data.report?.reduce((a,r) => a + r.itemsExtracted, 0) || 0;
      flash(`✅ Crawl done — ${extracted} items extracted (status: pending review)`);
      loadSources();
      // Auto-switch to Items tab showing pending review queue
      setTab(1);
      const newFilter = { q:'', category:'', listing_type:'', status:'pending', page: 0 };
      setItemFilter(newFilter);
      loadItems(newFilter);
    } catch (err) { flash(`Crawl failed: ${err.message}`, true); }
    finally { setCrawling(false); }
  }

  async function toggleSource(s) {
    try {
      await fetch('/api/admin/sources', { method:'PATCH', headers: adminHeaders, body: JSON.stringify({ id: s.id, active: !s.active }) });
      setSources(prev => prev.map(x => x.id === s.id ? { ...x, active: !s.active } : x));
      flash(`${s.source_name} ${s.active ? 'deactivated' : 'activated'}`);
    } catch { flash('Toggle failed', true); }
  }

  async function updateItem(id, updates) {
    try {
      await fetch('/api/admin/items', { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ id, ...updates }) });
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      flash('Item updated');
    } catch { flash('Update failed', true); }
  }

  async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
      await fetch('/api/admin/items', { method:'DELETE', headers: adminHeaders, body: JSON.stringify({ id }) });
      setItems(prev => prev.filter(i => i.id !== id));
      flash('Item deleted');
    } catch { flash('Delete failed', true); }
  }

  // ── Legacy activities / vendors ───────────────────────────────
  async function fetchActivities() {
    setLoading(true);
    const r = await fetch('/api/admin/activities');
    const d = await r.json();
    setActs(d.activities || []);
    setLoading(false);
  }
  async function fetchVendors() {
    setLoading(true);
    const r = await fetch('/api/admin/vendors');
    const d = await r.json();
    setVendors(d.vendors || []);
    setLoading(false);
  }
  async function toggleActive(id, current) {
    await fetch('/api/admin/activities', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, active_status: !current }) });
    setActs(prev => prev.map(a => a.id === id ? { ...a, active_status: !current } : a));
    flash(`Activity ${!current ? 'published' : 'unpublished'}.`);
  }
  async function toggleFeatured(id, current) {
    await fetch('/api/admin/activities', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, featured_status: !current }) });
    setActs(prev => prev.map(a => a.id === id ? { ...a, featured_status: !current } : a));
    flash(`Featured ${!current ? 'on' : 'off'}.`);
  }
  async function addActivity() {
    if (!newAct.activity_name || !newAct.category) return flash('Name and category are required.', true);
    const r = await fetch('/api/admin/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newAct) });
    if (r.ok) { flash('Activity added!'); fetchActivities(); setNewAct({ activity_name:'', category:'', neighborhood:'', short_summary:'', booking_link:'', official_link:'', icon:'📍', source_name:'', city:'Tampa' }); }
    else flash('Error adding activity.', true);
  }
  async function deleteActivity(id) {
    if (!confirm('Delete this activity?')) return;
    await fetch('/api/admin/activities', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    setActs(prev => prev.filter(a => a.id !== id));
    flash('Deleted.');
  }

  useEffect(() => {
    if (tab === 0) loadSources();
    if (tab === 1) loadItems();
    if (tab === 2) fetchActivities();
    if (tab === 3) fetchVendors();
    if (tab === 5) { if (tampaSubTab === 'sources') loadTampaSources(); else loadCandidates(); }
  }, [tab]);

  useEffect(() => {
    if (tab === 5) { if (tampaSubTab === 'sources') loadTampaSources(); else loadCandidates(); }
  }, [tampaSubTab]);

  return (
    <div className={styles.page}>
      {/* Flash */}
      {msg && <div className={`${styles.flash} ${msg.isErr ? styles.flashErr : ''}`}>{msg.text}</div>}

      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.logo}>⚙️ City Tour Guide Admin</span>
        <div className={styles.navRight}>
          <a href="/" target="_blank" className={styles.navLink}>View Site ↗</a>
          <button className={styles.navBtn} onClick={onLogout}>Log Out</button>
        </div>
      </nav>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={t} className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      <main className={styles.main}>

        {/* ── Sources Tab ──────────────────────────────────────── */}
        {tab === 0 && (
          <div>
            <div className={styles.sourcesHeader}>
              <h2 className={styles.sectionTitle}>Trusted Sources <span className={styles.badge}>{sources.length}</span></h2>
              <button className={`${styles.btnPrimary} ${crawling ? styles.btnDisabled : ''}`}
                onClick={() => triggerCrawl()} disabled={crawling}>
                {crawling ? '⏳ Crawling…' : '🕷️ Crawl All Sources'}
              </button>
            </div>
            {sources.length === 0 && (
              <p className={styles.muted}>No sources registered yet. Run <code>scripts/setup-trusted-engine.sql</code> in Supabase, then trigger a crawl.</p>
            )}
            <div className={styles.sourcesGrid}>
              {sources.map(s => (
                <div key={s.id} className={`${styles.sourceCard} ${s.active ? '' : styles.sourceInactive}`}>
                  <div className={styles.sourceTop}>
                    <div className={styles.sourceName}>{s.source_name}</div>
                    <span className={styles.sourceType}>{s.source_type}</span>
                  </div>
                  <div className={styles.sourceDomain}>🔗 {s.domain}</div>
                  <div className={styles.sourceMeta}>
                    <span>📄 {s.item_count || 0} items</span>
                    <span>🔢 Depth {s.allowed_depth}</span>
                    <span>🗂 {(s.subsources||[]).length} subsources</span>
                  </div>
                  {/* Health report */}
                  {s.last_crawl_at && (
                    <div className={styles.healthBar}>
                      <span title="Last crawl date">
                        {new Date(s.last_crawl_at) < new Date(Date.now()-7*86400000)
                          ? <span className={styles.healthStale}>⚠️ Stale</span>
                          : <span className={styles.healthOk}>✅</span>}
                        {' '}{new Date(s.last_crawl_at).toLocaleDateString()}
                      </span>
                      <span>🌐 {s.last_crawl_pages || 0} pages</span>
                      <span>📥 {s.last_crawl_items || 0} extracted</span>
                      {(s.last_crawl_errors||0) > 0 && <span className={styles.logErr}>⚠️ {s.last_crawl_errors} err</span>}
                    </div>
                  )}
                  {(s.subsources||[]).length > 0 && (
                    <div className={styles.subsources}>
                      {s.subsources.map((sub, i) => (
                        <span key={i} className={styles.subTag}>{sub.subcategory || sub.category}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.sourceActions}>
                    <button className={`${styles.toggleBtn} ${s.active ? styles.toggleActive : ''}`} onClick={() => toggleSource(s)}>
                      {s.active ? '✅ Active' : '⏸ Inactive'}
                    </button>
                    <button className={styles.crawlBtn} onClick={() => triggerCrawl([s.source_name])} disabled={crawling || !s.active}>
                      {crawling ? '⏳' : '🕷️'} Crawl
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {crawlLog && (
              <div className={styles.crawlLog}>
                <h3>Last Crawl — {crawlLog.crawledAt}</h3>
                {(crawlLog.report||[]).map((r, i) => (
                  <div key={i} className={styles.logCard}>
                    <strong>{r.sourceName}</strong>
                    <span>🌐 {r.pagesVisited} pages</span>
                    <span>✅ {r.itemsExtracted} extracted</span>
                    <span>⏭ {r.skipped} skipped</span>
                    {r.errors?.length > 0 && <span className={styles.logErr}>⚠️ {r.errors.length} errors</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Items Tab ────────────────────────────────────────── */}
        {tab === 1 && (
          <div>
            {/* Status filter tabs */}
            <div className={styles.statusTabs}>
              {[['pending','⏳ Pending Review'],['approved','✅ Approved'],['hidden','🙈 Hidden'],['all','📋 All']].map(([val, label]) => (
                <button key={val}
                  className={`${styles.statusTab} ${itemFilter.status===val ? styles.statusTabActive : ''}`}
                  onClick={() => { const f={...itemFilter, status:val, page:0}; setItemFilter(f); loadItems(f); }}>
                  {label}
                </button>
              ))}
            </div>

            <h2 className={styles.sectionTitle}>Crawled Items <span className={styles.badge}>{totalItems}</span>
              <span className={styles.statusHint}>
                {itemFilter.status==='pending'&&' — Needs review'}
                {itemFilter.status==='approved'&&' — Live in search'}
                {itemFilter.status==='hidden'&&' — Hidden from search'}
              </span>
            </h2>
            <div className={styles.itemFilters}>
              <input placeholder="Search title…" value={itemFilter.q}
                onChange={e => setItemFilter(f => ({...f, q: e.target.value, page: 0}))}
                className={styles.input} style={{maxWidth:260}} />
              <select value={itemFilter.category}
                onChange={e => setItemFilter(f => ({...f, category: e.target.value, page: 0}))}
                className={styles.input} style={{width:'auto'}}>
                <option value="">All Categories</option>
                {['Events','Tours & Activities','Food','Outdoors','Discovery'].map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={itemFilter.listing_type}
                onChange={e => setItemFilter(f => ({...f, listing_type: e.target.value, page: 0}))}
                className={styles.input} style={{width:'auto'}}>
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="featured">⭐ Featured</option>
                <option value="partner">💼 Partner</option>
              </select>
              <button className={styles.btnPrimary} onClick={() => loadItems(itemFilter)}>Search</button>
            </div>

            {itemLoading ? <p className={styles.muted}>Loading…</p> : (
              <div className={styles.table}>
                <div className={styles.thead}>
                  <span>Title / Source</span><span>Category</span><span>Price / Date</span><span>Type</span><span>Actions</span>
                </div>
                {items.map(item => (
                  <div key={item.id} className={styles.trow}>
                    <span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.actName}>{item.title || '(no title)'}</a>
                      <br /><span className={styles.muted} style={{fontSize:'0.75rem'}}>{item.source_name}</span>
                    </span>
                    <span><span className={styles.catBadge}>{item.category}</span></span>
                    <span className={styles.muted}>
                      {item.price || '—'}{item.event_date ? ` · ${item.event_date}` : ''}
                    </span>
                    <span>
                      <select value={item.listing_type} onChange={e => updateItem(item.id, { listing_type: e.target.value })}
                        className={styles.typeSelect}>
                        <option value="standard">Standard</option>
                        <option value="featured">⭐ Featured</option>
                        <option value="partner">💼 Partner</option>
                      </select>
                    </span>
                    <span className={styles.rowActions}>
                      {item.status !== 'approved' && (
                        <button className={`${styles.actionBtn} ${styles.approveBtn}`}
                          onClick={() => updateItem(item.id, { status:'approved' })} title="Approve — live in search">✅</button>
                      )}
                      {item.status !== 'hidden' && (
                        <button className={`${styles.actionBtn} ${styles.hideBtn}`}
                          onClick={() => updateItem(item.id, { status:'hidden' })} title="Hide from search">🙈</button>
                      )}
                      {item.status !== 'pending' && (
                        <button className={styles.actionBtn}
                          onClick={() => updateItem(item.id, { status:'pending' })} title="Return to pending">⏳</button>
                      )}
                      <select value={item.listing_type} onChange={e => updateItem(item.id, { listing_type: e.target.value })}
                        className={styles.typeSelect}>
                        <option value="standard">Std</option>
                        <option value="featured">⭐</option>
                        <option value="partner">💼</option>
                      </select>
                      <button className={`${styles.actionBtn} ${item.is_monetized ? styles.actionActive : ''}`}
                        onClick={() => updateItem(item.id, { is_monetized: !item.is_monetized })} title="Toggle Partner badge">💼</button>
                      <button className={`${styles.actionBtn} ${styles.actionDel}`} onClick={() => deleteItem(item.id)} title="Delete">✕</button>
                    </span>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className={styles.muted} style={{padding:'20px 0'}}>
                    {itemFilter.status === 'pending' ? 'No items pending review. Trigger a crawl from the Sources tab.' : 'No items match this filter.'}
                  </p>
                )}
              </div>
            )}

            {totalItems > 25 && (
              <div className={styles.pagination}>
                <button disabled={itemFilter.page === 0}
                  onClick={() => { const f={...itemFilter, page: itemFilter.page-1}; setItemFilter(f); loadItems(f); }}>← Prev</button>
                <span>Page {itemFilter.page+1} of {Math.ceil(totalItems/25)}</span>
                <button disabled={(itemFilter.page+1)*25 >= totalItems}
                  onClick={() => { const f={...itemFilter, page: itemFilter.page+1}; setItemFilter(f); loadItems(f); }}>Next →</button>
              </div>
            )}
          </div>
        )}

        {/* ── Activities Tab ────────────────────────────────────── */}
        {tab === 2 && (
          <div>
            <h2 className={styles.sectionTitle}>Add New Activity</h2>
            <div className={styles.addForm}>
              <div className={styles.formGrid}>
                <input className={styles.input} placeholder="Activity name *" value={newAct.activity_name} onChange={e => setNewAct(p=>({...p,activity_name:e.target.value}))} />
                <select className={styles.input} value={newAct.category} onChange={e => setNewAct(p=>({...p,category:e.target.value}))}>
                  <option value="">Category *</option>
                  {['Things To Do','Events Calendar','Tours & Activities','Deals & Discounts','Volunteer','Museums / Culture','Nightlife','History & Culture'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input className={styles.input} placeholder="Neighborhood" value={newAct.neighborhood} onChange={e => setNewAct(p=>({...p,neighborhood:e.target.value}))} />
                <input className={styles.input} placeholder="Source (e.g. Viator)" value={newAct.source_name} onChange={e => setNewAct(p=>({...p,source_name:e.target.value}))} />
                <input className={styles.input} placeholder="Booking link" value={newAct.booking_link} onChange={e => setNewAct(p=>({...p,booking_link:e.target.value}))} />
                <input className={styles.input} placeholder="Official link" value={newAct.official_link} onChange={e => setNewAct(p=>({...p,official_link:e.target.value}))} />
                <input className={styles.input} placeholder="Icon emoji" value={newAct.icon} onChange={e => setNewAct(p=>({...p,icon:e.target.value}))} maxLength={4} />
              </div>
              <textarea className={styles.textarea} placeholder="Short summary (1-2 sentences, neutral tone)" value={newAct.short_summary} onChange={e => setNewAct(p=>({...p,short_summary:e.target.value}))} />
              <button className={styles.btnAdd} onClick={addActivity}>+ Add Activity</button>
            </div>
            <h2 className={styles.sectionTitle} style={{marginTop:32}}>All Activities <span className={styles.badge}>{acts.length}</span></h2>
            {loading ? <p className={styles.muted}>Loading…</p> : (
              <div className={styles.table}>
                <div className={styles.thead}><span>Name</span><span>Category</span><span>Area</span><span>Source</span><span>Status</span><span>Actions</span></div>
                {acts.map(a => (
                  <div key={a.id} className={`${styles.trow} ${!a.active_status ? styles.trowDim : ''}`}>
                    <span className={styles.actName}>{a.icon} {a.activity_name}</span>
                    <span><span className={styles.catBadge}>{a.category}</span></span>
                    <span className={styles.muted}>{a.neighborhood || '—'}</span>
                    <span className={styles.muted}>{a.source_name || '—'}</span>
                    <span>
                      {a.active_status ? <span className={styles.statusOn}>● Live</span> : <span className={styles.statusOff}>○ Draft</span>}
                      {a.featured_status && <span className={styles.statusFeat}>⭐</span>}
                    </span>
                    <span className={styles.rowActions}>
                      <button className={styles.actionBtn} onClick={() => toggleActive(a.id, a.active_status)}>{a.active_status ? '📤' : '✅'}</button>
                      <button className={styles.actionBtn} onClick={() => toggleFeatured(a.id, a.featured_status)}>{a.featured_status ? '⭐' : '☆'}</button>
                      <button className={`${styles.actionBtn} ${styles.actionDel}`} onClick={() => deleteActivity(a.id)}>🗑</button>
                    </span>
                  </div>
                ))}
                {acts.length === 0 && <p className={styles.muted} style={{padding:'20px 0'}}>No activities yet.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Vendors Tab ──────────────────────────────────────── */}
        {tab === 3 && (
          <div>
            <h2 className={styles.sectionTitle}>Vendor Records <span className={styles.badge}>{vendors.length}</span></h2>
            <p className={styles.muted} style={{marginBottom:16}}>Vendors from partner application form.</p>
            {loading ? <p className={styles.muted}>Loading…</p> : (
              <div className={styles.table}>
                <div className={styles.thead}><span>Business</span><span>Contact</span><span>Email</span><span>Claim</span><span>Tier</span></div>
                {vendors.map(v => (
                  <div key={v.id} className={styles.trow}>
                    <span className={styles.actName}>{v.vendor_name}</span>
                    <span className={styles.muted}>{v.contact_name || '—'}</span>
                    <span className={styles.muted}>{v.email || '—'}</span>
                    <span><span className={`${styles.catBadge} ${v.claim_status === 'claimed' ? styles.catBadgeGreen : ''}`}>{v.claim_status}</span></span>
                    <span><span className={`${styles.catBadge} ${v.paid_status === 'featured' ? styles.catBadgeGold : ''}`}>{v.paid_status}</span></span>
                  </div>
                ))}
                {vendors.length === 0 && <p className={styles.muted} style={{padding:'20px 0'}}>No vendors yet.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Setup Tab ────────────────────────────────────────── */}
        {tab === 4 && (
          <div>
            <h2 className={styles.sectionTitle}>Setup Checklist</h2>
            <div className={styles.checklist}>
              {[
                { done: true,  label: 'Next.js V2 deployed to Vercel', detail: 'tampa.citytourguide.app is live' },
                { done: true,  label: 'Compliance refactor complete', detail: 'Disclosure bar, Partner Link badges, safe labels, legal footer' },
                { done: true,  label: 'Legal pages live', detail: '/disclaimer · /privacy · /terms' },
                { done: true,  label: '/resources page live', detail: 'Curated links with PDF download' },
                { done: true,  label: 'Trusted source engine built', detail: 'Crawler + extractor + crawl API + this admin panel' },
                { done: false, label: 'Run Supabase SQL for trusted engine', detail: 'scripts/setup-trusted-engine.sql in Supabase SQL Editor' },
                { done: false, label: 'Set CRAWL_SECRET in Vercel env vars', detail: 'Protects POST /api/crawl endpoint' },
                { done: false, label: 'Set ADMIN_SECRET in Vercel env vars', detail: 'Protects /api/admin/* endpoints' },
                { done: false, label: 'Trigger first crawl', detail: 'POST /api/crawl — ingests Tampa Downtown Partnership' },
                { done: false, label: 'Add GETYOURGUIDE_PARTNER_ID env var', detail: 'Get from partner.getyourguide.com' },
                { done: false, label: 'Add VIATOR_AFFILIATE_ID env var', detail: 'Get from partnerresources.viator.com' },
              ].map((item, i) => (
                <div key={i} className={styles.checkItem}>
                  <span className={styles.checkIcon}>{item.done ? '✅' : '⏳'}</span>
                  <div>
                    <div className={styles.checkLabel}>{item.label}</div>
                    <div className={styles.checkDetail}>{item.detail}</div>
                  </div>
                  {!item.done && <span className={styles.todo}>TODO</span>}
                </div>
              ))}
            </div>
            <h2 className={styles.sectionTitle} style={{marginTop:32}}>Required Env Vars</h2>
            <div className={styles.envTable}>
              {[
                ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase project URL'],
                ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anon key'],
                ['SUPABASE_SERVICE_ROLE_KEY', 'Required for crawl API writes'],
                ['CRAWL_SECRET', 'Protect POST /api/crawl'],
                ['ADMIN_SECRET', 'Protect /api/admin/* (or use CRAWL_SECRET)'],
                ['NEXT_PUBLIC_ADMIN_PASSWORD', 'Admin panel UI password'],
                ['FEATURED_VENDOR_NAME', 'Featured partner display name'],
                ['FEATURED_VENDOR_URL', 'Featured partner booking URL'],
                ['GETYOURGUIDE_PARTNER_ID', 'GYG affiliate partner ID'],
                ['VIATOR_AFFILIATE_ID', 'Viator MCID affiliate ID'],
              ].map(([k, v]) => (
                <div key={k} className={styles.envRow}>
                  <code className={styles.envKey}>{k}</code>
                  <span className={styles.envDesc}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ── Tampa Resources Tab ──────────────────────────────── */}
        {tab === 5 && (
          <div>
            {/* Sub-tabs */}
            <div className={styles.statusTabs} style={{marginBottom:16}}>
              <button className={`${styles.statusTab} ${tampaSubTab==='sources' ? styles.statusTabActive : ''}`}
                onClick={() => setTampaSubTab('sources')}>🗂 Tampa Resources ({tampaTotal})</button>
              <button className={`${styles.statusTab} ${tampaSubTab==='candidates' ? styles.statusTabActive : ''}`}
                onClick={() => setTampaSubTab('candidates')}>🔬 Research Queue ({candidates.length})</button>
            </div>

            {/* ── Sources list ── */}
            {tampaSubTab === 'sources' && (
              <div>
                <div className={styles.itemFilters} style={{flexWrap:'wrap', gap:8}}>
                  <input placeholder="Search name or keyword…" value={tampaFilter.q}
                    onChange={e => setTampaFilter(f => ({...f, q:e.target.value, page:0}))}
                    className={styles.input} style={{maxWidth:230}} />
                  <select value={tampaFilter.neighborhood}
                    onChange={e => setTampaFilter(f => ({...f, neighborhood:e.target.value, page:0}))}
                    className={styles.input} style={{width:'auto'}}>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n || 'All Neighborhoods'}</option>)}
                  </select>
                  <select value={tampaFilter.category}
                    onChange={e => setTampaFilter(f => ({...f, category:e.target.value, page:0}))}
                    className={styles.input} style={{width:'auto'}}>
                    {CTG_CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
                  </select>
                  <select value={tampaFilter.status}
                    onChange={e => setTampaFilter(f => ({...f, status:e.target.value, page:0}))}
                    className={styles.input} style={{width:'auto'}}>
                    <option value=''>All Status</option>
                    <option value='active'>Active</option>
                    <option value='needs_verification'>Needs Verification</option>
                    <option value='inactive'>Inactive</option>
                  </select>
                  <select value={tampaFilter.tier}
                    onChange={e => setTampaFilter(f => ({...f, tier:e.target.value, page:0}))}
                    className={styles.input} style={{width:'auto'}}>
                    <option value=''>All Tiers</option>
                    <option value='standard'>Standard</option>
                    <option value='upgraded'>⬆️ Upgraded</option>
                  </select>
                  <select value={tampaFilter.is_core}
                    onChange={e => setTampaFilter(f => ({...f, is_core:e.target.value, page:0}))}
                    className={styles.input} style={{width:'auto'}}>
                    <option value=''>All</option>
                    <option value='true'>⭐ Core Only</option>
                    <option value='false'>Non-Core</option>
                  </select>
                  <select value={tampaFilter.event_type}
                    onChange={e => setTampaFilter(f => ({...f, event_type:e.target.value, page:0}))}
                    className={styles.input} style={{width:'auto'}}>
                    {EVENT_TYPES.map(e => <option key={e} value={e}>{e || 'All Event Types'}</option>)}
                  </select>
                  <button className={styles.btnPrimary} onClick={() => loadTampaSources(tampaFilter)}>Search</button>
                </div>

                {tampaLoading ? <p className={styles.muted}>Loading…</p> : (
                  <div className={styles.table}>
                    <div className={styles.thead}>
                      <span>Name / Neighborhood</span>
                      <span>Category</span>
                      <span>URL</span>
                      <span>Tier</span>
                      <span>Core</span>
                      <span>Status</span>
                    </div>
                    {tampaSources.map(r => (
                      <div key={r.tables_record_id} className={styles.trow}>
                        <span>
                          <strong>{r.Resource || r['Resource']}</strong>
                          <br/><span className={styles.muted} style={{fontSize:'0.75rem'}}>{r.neighborhood || '—'}</span>
                        </span>
                        <span><span className={styles.catBadge}>{r.Category || r['Category']}</span></span>
                        <span className={styles.muted} style={{fontSize:'0.75rem', wordBreak:'break-all'}}>
                          <a href={r['URL Link']} target='_blank' rel='noopener noreferrer' className={styles.actName}
                            style={{fontSize:'0.75rem'}}>{(r['URL Link']||'').replace('https://','').slice(0,40)}</a>
                          {r.url_broken && <span style={{color:'#ff4d4f', marginLeft:4}}>⚠️ Broken</span>}
                        </span>
                        <span>
                          <select value={r.tier || 'standard'}
                            onChange={e => updateTampaSource(r.tables_record_id, { tier: e.target.value })}
                            className={styles.typeSelect}>
                            <option value='standard'>Standard</option>
                            <option value='upgraded'>⬆️ Upgraded</option>
                          </select>
                        </span>
                        <span>
                          <button
                            className={`${styles.actionBtn} ${r.is_core ? styles.approveBtn : ''}`}
                            onClick={() => updateTampaSource(r.tables_record_id, { is_core: !r.is_core })}
                            title={r.is_core ? 'Core — click to remove core status' : 'Not core — click to mark as core'}>
                            {r.is_core ? '⭐' : '☆'}
                          </button>
                        </span>
                        <span>
                          <select value={r.status || 'active'}
                            onChange={e => updateTampaSource(r.tables_record_id, { status: e.target.value })}
                            className={styles.typeSelect}>
                            <option value='active'>Active</option>
                            <option value='needs_verification'>⚠️ Needs Check</option>
                            <option value='inactive'>Inactive</option>
                          </select>
                        </span>
                      </div>
                    ))}
                    {tampaSources.length === 0 && (
                      <p className={styles.muted} style={{padding:'20px 0'}}>
                        No sources match this filter. Try clearing filters or importing the CSV.
                      </p>
                    )}
                  </div>
                )}

                {tampaTotal > 30 && (
                  <div className={styles.pagination}>
                    <button disabled={tampaFilter.page === 0}
                      onClick={() => { const f={...tampaFilter, page:tampaFilter.page-1}; setTampaFilter(f); loadTampaSources(f); }}>← Prev</button>
                    <span>Page {tampaFilter.page+1} of {Math.ceil(tampaTotal/30)}</span>
                    <button disabled={(tampaFilter.page+1)*30 >= tampaTotal}
                      onClick={() => { const f={...tampaFilter, page:tampaFilter.page+1}; setTampaFilter(f); loadTampaSources(f); }}>Next →</button>
                  </div>
                )}
              </div>
            )}

            {/* ── Research Queue ── */}
            {tampaSubTab === 'candidates' && (
              <div>
                <p className={styles.muted} style={{marginBottom:16}}>
                  Pending sources from AI research. Approve to insert into Tampa Resources, or reject with a reason.
                </p>
                {candidatesLoading ? <p className={styles.muted}>Loading…</p> : (
                  <div className={styles.table}>
                    <div className={styles.thead}>
                      <span>Name / URL</span>
                      <span>Category</span>
                      <span>Neighborhood</span>
                      <span>Source Type</span>
                      <span>Actions</span>
                    </div>
                    {candidates.map(c => (
                      <div key={c.id} className={styles.trow}>
                        <span>
                          <strong>{c.name}</strong>
                          <br/><a href={c.url} target='_blank' rel='noopener noreferrer'
                            className={styles.actName} style={{fontSize:'0.75rem'}}>{(c.url||'').replace('https://','').slice(0,40)}</a>
                          {c.description && <><br/><span className={styles.muted} style={{fontSize:'0.72rem'}}>{c.description.slice(0,80)}…</span></>}
                        </span>
                        <span><span className={styles.catBadge}>{c.category}</span></span>
                        <span className={styles.muted}>{c.neighborhood || '—'}</span>
                        <span className={styles.muted}>{c.source_type || '—'}</span>
                        <span className={styles.rowActions}>
                          <button className={`${styles.actionBtn} ${styles.approveBtn}`}
                            onClick={() => reviewCandidate(c.id, 'approve')} title='Approve — insert into Tampa Resources'>✅</button>
                          <button className={`${styles.actionBtn} ${styles.hideBtn}`}
                            onClick={() => {
                              const reason = prompt('Rejection reason (shown in log):');
                              if (reason !== null) reviewCandidate(c.id, 'reject', reason);
                            }} title='Reject'>🚫</button>
                        </span>
                      </div>
                    ))}
                    {candidates.length === 0 && (
                      <p className={styles.muted} style={{padding:'20px 0'}}>No pending candidates. Queue is clear! 🎉</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
