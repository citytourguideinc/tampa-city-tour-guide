'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'citytourguide2026';

const TABS = ['🏃 Activities', '🏪 Vendors', '✅ Setup'];

export default function AdminPage() {
  const [authed,   setAuthed]   = useState(false);
  const [pwd,      setPwd]      = useState('');
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState(0);
  const [acts,     setActs]     = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');
  const [newAct,   setNewAct]   = useState({ activity_name:'', category:'', neighborhood:'', short_summary:'', booking_link:'', official_link:'', icon:'📍', source_name:'', city:'Tampa' });

  useEffect(() => {
    if (localStorage.getItem('ctg_admin')) setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed && tab === 0) fetchActivities();
    if (authed && tab === 1) fetchVendors();
  }, [authed, tab]);

  function login() {
    if (pwd === ADMIN_PWD) { localStorage.setItem('ctg_admin','1'); setAuthed(true); }
    else setError('Incorrect password.');
  }

  function logout() { localStorage.removeItem('ctg_admin'); setAuthed(false); }

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

  function flash(text, isErr = false) {
    setMsg({ text, isErr });
    setTimeout(() => setMsg(''), 3000);
  }

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

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.logo}>⚙️ City Tour Guide Admin</span>
        <div className={styles.navRight}>
          <a href="/" target="_blank" className={styles.navLink}>View Site ↗</a>
          <button className={styles.navBtn} onClick={logout}>Log Out</button>
        </div>
      </nav>

      {/* Flash message */}
      {msg && <div className={`${styles.flash} ${msg.isErr ? styles.flashErr : ''}`}>{msg.text}</div>}

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={t} className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      <main className={styles.main}>

        {/* ── Activities Tab ── */}
        {tab === 0 && (
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

            <h2 className={styles.sectionTitle} style={{marginTop:32}}>
              All Activities <span className={styles.badge}>{acts.length}</span>
            </h2>
            {loading ? <p className={styles.muted}>Loading…</p> : (
              <div className={styles.table}>
                <div className={styles.thead}>
                  <span>Name</span><span>Category</span><span>Area</span><span>Source</span><span>Status</span><span>Actions</span>
                </div>
                {acts.map(a => (
                  <div key={a.id} className={`${styles.trow} ${!a.active_status ? styles.trowDim : ''}`}>
                    <span className={styles.actName}>{a.icon} {a.activity_name}</span>
                    <span><span className={styles.catBadge}>{a.category}</span></span>
                    <span className={styles.muted}>{a.neighborhood || '—'}</span>
                    <span className={styles.muted}>{a.source_name || '—'}</span>
                    <span>
                      {a.active_status
                        ? <span className={styles.statusOn}>● Live</span>
                        : <span className={styles.statusOff}>○ Draft</span>}
                      {a.featured_status && <span className={styles.statusFeat}>⭐</span>}
                    </span>
                    <span className={styles.rowActions}>
                      <button className={styles.actionBtn} onClick={() => toggleActive(a.id, a.active_status)} title="Toggle live/draft">
                        {a.active_status ? '📤' : '✅'}
                      </button>
                      <button className={styles.actionBtn} onClick={() => toggleFeatured(a.id, a.featured_status)} title="Toggle featured">
                        {a.featured_status ? '⭐' : '☆'}
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionDel}`} onClick={() => deleteActivity(a.id)} title="Delete">🗑</button>
                    </span>
                  </div>
                ))}
                {acts.length === 0 && <p className={styles.muted} style={{padding:'20px 0'}}>No activities yet. Add Supabase env vars and run the seed script.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Vendors Tab ── */}
        {tab === 1 && (
          <div>
            <h2 className={styles.sectionTitle}>Vendor Records <span className={styles.badge}>{vendors.length}</span></h2>
            <p className={styles.muted} style={{marginBottom:16}}>Vendors added via the partner application form. Approve/upgrade to featured here.</p>
            {loading ? <p className={styles.muted}>Loading…</p> : (
              <div className={styles.table}>
                <div className={styles.thead}>
                  <span>Business</span><span>Contact</span><span>Email</span><span>Claim</span><span>Tier</span>
                </div>
                {vendors.map(v => (
                  <div key={v.id} className={styles.trow}>
                    <span className={styles.actName}>{v.vendor_name}</span>
                    <span className={styles.muted}>{v.contact_name || '—'}</span>
                    <span className={styles.muted}>{v.email || '—'}</span>
                    <span><span className={`${styles.catBadge} ${v.claim_status === 'claimed' ? styles.catBadgeGreen : ''}`}>{v.claim_status}</span></span>
                    <span><span className={`${styles.catBadge} ${v.paid_status === 'featured' ? styles.catBadgeGold : ''}`}>{v.paid_status}</span></span>
                  </div>
                ))}
                {vendors.length === 0 && <p className={styles.muted} style={{padding:'20px 0'}}>No vendors yet. They appear here when applications come in via /partner.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Setup Checklist Tab ── */}
        {tab === 2 && (
          <div>
            <h2 className={styles.sectionTitle}>Setup Checklist</h2>
            <div className={styles.checklist}>
              {[
                { done: true,  label: 'Next.js V2 deployed to Vercel', detail:'tampa.citytourguide.app is live' },
                { done: true,  label: 'Gemini AI search working', detail:'gemini-2.5-flash-lite via API' },
                { done: true,  label: 'Leaflet map view wired', detail:'Toggle map button on main page' },
                { done: true,  label: 'Seed script ready', detail:'scripts/seed-tampa.js — 29 activities' },
                { done: false, label: 'Create Supabase project', detail:'supabase.com → New project (free)' },
                { done: false, label: 'Run schema SQL', detail:'Paste supabase/schema.sql in SQL Editor' },
                { done: false, label: 'Run seed script', detail:'node scripts/seed-tampa.js (add .env.local first)' },
                { done: false, label: 'Add Supabase env vars to Vercel', detail:'NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY' },
                { done: false, label: 'Add GA4 Measurement ID', detail:'Replace G-XXXXXXXXXX in app/layout.js' },
                { done: false, label: 'GetYourGuide partner signup', detail:'partner.getyourguide.com — free, 8% commission' },
                { done: false, label: 'Viator affiliate signup', detail:'partnerresources.viator.com — free, 8% commission' },
                { done: false, label: 'Sign first featured vendor ($199/mo)', detail:'Direct outreach to local tour operators' },
                { done: false, label: 'Set up GCP billing budget alert ($5)',  detail:'Prevent unexpected Gemini API charges' },
                { done: false, label: 'Pitch first hotel / condo property', detail:'White-label licensing strategy' },
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

            <h2 className={styles.sectionTitle} style={{marginTop:32}}>Featured Vendor Slot</h2>
            <p className={styles.muted} style={{marginBottom:12}}>Set these in <strong>Vercel → Settings → Environment Variables</strong> — no code changes needed.</p>
            <div className={styles.envTable}>
              {[
                ['FEATURED_VENDOR_NAME', 'Business display name'],
                ['FEATURED_VENDOR_URL', 'Booking/website URL'],
                ['FEATURED_VENDOR_SUB', 'Category label (e.g. Tours & Activities)'],
                ['FEATURED_VENDOR_ICON', 'Emoji icon (e.g. 🚤)'],
                ['GETYOURGUIDE_PARTNER_ID', 'Your GYG partner ID'],
                ['VIATOR_AFFILIATE_ID', 'Your Viator MCID'],
                ['NEXT_PUBLIC_ADMIN_PASSWORD', 'Change from default (citytourguide2026)'],
              ].map(([k, v]) => (
                <div key={k} className={styles.envRow}>
                  <code className={styles.envKey}>{k}</code>
                  <span className={styles.envDesc}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
