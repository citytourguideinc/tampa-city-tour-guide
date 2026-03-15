'use client';
import { useState } from 'react';
import styles from './signup.module.css';

const TIERS = [
  { id: 'verified', name: 'Verified — $49/mo',  desc: 'Verified badge, priority ranking, monthly stats' },
  { id: 'featured', name: 'Featured — $149/mo', desc: 'Featured card, logo, top of search, AI mentions' },
  { id: 'premier',  name: 'Premier — $299/mo',  desc: 'Homepage placement, API access, analytics dashboard' },
];

export default function PartnerSignup() {
  const [form, setForm] = useState({
    name: '', email: '', business: '', website: '', category: '', tier: 'featured', message: '', requestApi: false
  });
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/partner/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // Stripe checkout redirect
      } else {
        setStep(2); // Free or no-stripe path
      }
    } catch {
      setError('Something went wrong. Please email info@citytourguideinc.com');
    } finally {
      setLoading(false);
    }
  }

  if (step === 2) return (
    <div className={styles.page}>
      <div className={styles.successBox}>
        <div className={styles.successIcon}>🎉</div>
        <h1>You&apos;re a Founding Partner!</h1>
        <p>We&apos;ll review your listing and reach out within 24 hours.</p>
        <p className={styles.successNote}>Free through April 30, 2026 — billing starts May 1 if you continue.</p>
        <a href="/" className={styles.backBtn}>← Back to City Tour Guide</a>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/" className={styles.navLogo}><img src="/logo.png" alt="City Tour Guide" height="44" style={{objectFit:'contain'}} /></a>
        <a href="/partner" className={styles.navBack}>← Partner Overview</a>
      </nav>

      <div className={styles.formWrap}>
        <div className={styles.formHeader}>
          <div className={styles.foundingTag}>🎉 Founding Partner — Free through April 30, 2026</div>
          <h1 className={styles.formTitle}>Partner Sign Up</h1>
          <p className={styles.formSub}>No credit card required until May 1. Cancel anytime.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Tier selection */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Choose Your Tier</legend>
            {TIERS.map(t => (
              <label key={t.id} className={`${styles.tierOption} ${form.tier === t.id ? styles.tierOptionActive : ''}`}>
                <input type="radio" name="tier" value={t.id} checked={form.tier === t.id} onChange={() => set('tier', t.id)} />
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.desc}</span>
                </div>
              </label>
            ))}
          </fieldset>

          {/* Contact info */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Your Name *</label>
              <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className={styles.field}>
              <label>Email Address *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@yourbusiness.com" />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Business / Organization Name *</label>
              <input required type="text" value={form.business} onChange={e => set('business', e.target.value)} placeholder="Tampa Downtown Partnership" />
            </div>
            <div className={styles.field}>
              <label>Website URL *</label>
              <input required type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourbusiness.com" />
            </div>
          </div>
          <div className={styles.field}>
            <label>Business Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select a category…</option>
              <option>Events & Entertainment</option>
              <option>Food & Dining</option>
              <option>Tours & Activities</option>
              <option>Arts & Culture</option>
              <option>Wellness & Fitness</option>
              <option>Shopping & Retail</option>
              <option>Nightlife</option>
              <option>Accommodation</option>
              <option>Other</option>
            </select>
          </div>

          {/* API request */}
          {form.tier === 'premier' && (
            <label className={styles.checkboxField}>
              <input type="checkbox" checked={form.requestApi} onChange={e => set('requestApi', e.target.checked)} />
              I want API access for my data feed (Premier only)
            </label>
          )}

          <div className={styles.field}>
            <label>Anything else? (optional)</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3} placeholder="Tell us about your business or any special requirements…" />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing…' : `Start as Founding Partner →`}
          </button>
          <p className={styles.submitNote}>
            By submitting you agree to our <a href="/partner/terms">Partner Terms</a>.
            Free through April 30, 2026. Month-to-month after.
          </p>
        </form>
      </div>
    </div>
  );
}
