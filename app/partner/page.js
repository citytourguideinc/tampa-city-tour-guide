'use client';
import { useState } from 'react';
import styles from './page.module.css';

const STATS = [
  { value: '10K+', label: 'Monthly visitors' },
  { value: '$199', label: 'Per month' },
  { value: '8%',   label: 'Affiliate commission' },
  { value: '#1',   label: 'Result position' },
];

const BENEFITS = [
  { icon: '⭐', title: 'Top placement', desc: 'Your card appears first in every search result — before organic listings.' },
  { icon: '🤖', title: 'AI recommendations', desc: 'Gemini AI recommends your business by name when visitors ask relevant questions.' },
  { icon: '📊', title: 'Monthly analytics', desc: 'Click reports sent monthly — see exactly how many visitors you reach.' },
  { icon: '🌴', title: 'Tampa Bay audience', desc: 'Exclusively Tampa Bay visitors actively looking for things to do and book.' },
];

export default function PartnerPage() {
  const [form, setForm] = useState({ name:'', email:'', business:'', category:'', url:'', message:'' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    // Track GA4 event
    if (typeof gtag === 'function') gtag('event', 'partner_application', { business: form.business });
    // In production: POST to /api/partner to save to Supabase vendors table
    await new Promise(r => setTimeout(r, 800)); // Simulate network
    setSubmitted(true);
    setSending(false);
  }

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <a href="/" className={styles.navLogo}>🌴 Tampa City Tour Guide</a>
        <a href="/" className={styles.navBack}>← Back to guide</a>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>🤝 Become a Partner</div>
          <h1 className={styles.h1}>Get Featured in<br />Tampa City Tour Guide</h1>
          <p className={styles.sub}>
            Put your business in front of 10,000+ monthly Tampa Bay visitors actively searching for things to do, tours, and experiences.
          </p>
          <div className={styles.stats}>
            {STATS.map(s => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.statVal}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview card */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Your card looks like this</h2>
          <div className={styles.previewWrap}>
            <div className={styles.previewCard}>
              <div className={styles.sponsoredBadge}>⭐ Sponsored</div>
              <div className={styles.previewTop}>
                <span className={styles.previewIcon}>🚤</span>
                <span className={styles.previewCat}>Tours & Activities</span>
                <span className={styles.previewSource}>Featured</span>
              </div>
              <div className={styles.previewTitle}>Tampa Bay Water Adventures</div>
              <div className={styles.previewMeta}>
                <span>📍 Channelside</span>
                <span>💰 $49–$99</span>
              </div>
              <p className={styles.previewDesc}>Award-winning boat tours and kayak rentals on Tampa Bay — unforgettable experiences year-round.</p>
              <div className={styles.previewCTA}>
                <button className={styles.previewBtn}>Book Now ↗</button>
                <span className={styles.previewHeart}>🤍</span>
              </div>
            </div>
            <div className={styles.previewNote}>
              <p>✅ Featured gold border and ⭐ Sponsored badge</p>
              <p>✅ Appears first before all organic results</p>
              <p>✅ AI mentions you by name in conversational replies</p>
              <p>✅ Links directly to your booking page</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Why partner with us</h2>
          <div className={styles.benefitsGrid}>
            {BENEFITS.map(b => (
              <div key={b.title} className={styles.benefitCard}>
                <span className={styles.benefitIcon}>{b.icon}</span>
                <h3 className={styles.benefitTitle}>{b.title}</h3>
                <p className={styles.benefitDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.h2}>Simple pricing</h2>
          <div className={styles.pricingCard}>
            <div className={styles.pricingTop}>
              <div className={styles.pricingBadge}>FEATURED SLOT</div>
              <div className={styles.pricingAmount}>$199<span>/month</span></div>
              <p className={styles.pricingNote}>No long-term contracts. Cancel anytime.</p>
            </div>
            <ul className={styles.pricingList}>
              <li>✅ #1 position in all search results</li>
              <li>✅ AI recommends your business by name</li>
              <li>✅ ⭐ Sponsored badge + gold card highlight</li>
              <li>✅ Direct booking link on every card</li>
              <li>✅ Monthly click analytics report</li>
              <li>✅ One featured slot per city (exclusive)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section className={styles.section} id="apply">
        <div className={styles.container}>
          <h2 className={styles.h2}>Apply for the featured slot</h2>
          <p className={styles.formSub}>We review all applications within 24 hours and only accept one partner per city to keep it exclusive.</p>

          {submitted ? (
            <div className={styles.successBox}>
              <span className={styles.successIcon}>🎉</span>
              <h3>Application received!</h3>
              <p>We'll be in touch within 24 hours to get you set up.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={submit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Your name *</label>
                  <input required placeholder="Jane Smith" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Business email *</label>
                  <input required type="email" placeholder="jane@yourbusiness.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Business name *</label>
                  <input required placeholder="Tampa Bay Water Adventures" value={form.business} onChange={e => set('business', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {['Tours & Activities','Food & Dining','Hotels & Lodging','Events & Entertainment','Retail & Shopping','Health & Wellness'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup + ' ' + styles.fullCol}>
                  <label>Website / booking URL *</label>
                  <input required type="url" placeholder="https://yourbusiness.com" value={form.url} onChange={e => set('url', e.target.value)} />
                </div>
                <div className={styles.formGroup + ' ' + styles.fullCol}>
                  <label>Tell us about your business</label>
                  <textarea rows={3} placeholder="What makes your business special for Tampa Bay visitors?" value={form.message} onChange={e => set('message', e.target.value)} />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={sending}>
                {sending ? 'Sending…' : '→ Submit Application'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© 2026 <strong>City Tour Guide, Inc.</strong> · <a href="/">Tampa City Tour Guide</a></p>
        </div>
      </footer>
    </div>
  );
}
