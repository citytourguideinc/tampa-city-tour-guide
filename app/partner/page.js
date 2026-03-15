'use client';
import { useState } from 'react';
import styles from './page.module.css';

const TIERS = [
  {
    id: 'free',
    name: 'Free Listing',
    price: '$0',
    period: '/mo',
    badge: null,
    desc: 'Get listed automatically when we crawl your site.',
    features: [
      'Crawled listing in search results',
      'Standard placement',
      'Links to your website',
      'Tampa Bay visitor audience',
    ],
    cta: 'Already listed',
    ctaStyle: 'outline',
    stripePrice: null,
  },
  {
    id: 'verified',
    name: 'Verified',
    price: '$49',
    period: '/mo',
    badge: '✓ Verified',
    desc: 'Stand out with a verified badge and priority data.',
    features: [
      'Everything in Free',
      '✓ Verified partner badge',
      'Priority ranking in results',
      'Approved & curated listing',
      'Monthly visit stats',
    ],
    cta: 'Start Free',
    ctaStyle: 'primary',
    stripePrice: 'price_verified',
  },
  {
    id: 'featured',
    name: 'Featured',
    price: '$149',
    period: '/mo',
    badge: '⭐ Featured',
    highlight: true,
    desc: 'Top-of-results card with your logo and premium placement.',
    features: [
      'Everything in Verified',
      '⭐ Featured card design',
      'Your logo displayed',
      'Top of every relevant search',
      'AI mentions your brand by name',
      'Quarterly analytics report',
    ],
    cta: 'Start Free',
    ctaStyle: 'featured',
    stripePrice: 'price_featured',
  },
  {
    id: 'premier',
    name: 'Premier',
    price: '$299',
    period: '/mo',
    badge: '🏆 Premier',
    desc: 'Maximum exposure with homepage placement and API access.',
    features: [
      'Everything in Featured',
      'Homepage featured section',
      'Priority API data feed',
      'Dedicated profile page',
      'Monthly analytics dashboard',
      'Direct partner support',
    ],
    cta: 'Start Free',
    ctaStyle: 'primary',
    stripePrice: 'price_premier',
  },
];

const VALUE_PROPS = [
  {
    icon: '🎯',
    title: 'Intent-Driven Traffic',
    desc: 'Visitors are actively searching for things to do — higher purchase intent than social media ads.',
  },
  {
    icon: '📍',
    title: 'Local Tampa Bay Focus',
    desc: 'Exclusively regional visitors and travelers looking for authentic Tampa Bay experiences.',
  },
  {
    icon: '⭐',
    title: 'AI-Powered Visibility',
    desc: 'Our AI recommends verified partners by name when users ask for recommendations.',
  },
  {
    icon: '📊',
    title: 'Real Analytics',
    desc: 'See exactly how many people clicked through to your site each month — transparent reporting.',
  },
  {
    icon: '✅',
    title: 'Verified & Trusted',
    desc: 'Your Verified badge signals authenticity to every visitor who finds your listing.',
  },
  {
    icon: '🔗',
    title: 'API Data Access',
    desc: 'Premier partners get structured data access to keep your listings perfectly accurate.',
  },
];

const FAQS = [
  {
    q: 'What is the Founding Partner offer?',
    a: 'Sign up before May 1, 2026 and your first billing cycle starts May 1. No credit card required until then. You get full access to your chosen tier from day one.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel anytime with no penalty. Your listing reverts to a standard free listing. No long-term contracts.',
  },
  {
    q: 'How do I request API access?',
    a: 'Premier tier includes API access. Select Premier during signup and our team will reach out within 24 hours with your API credentials and documentation.',
  },
  {
    q: 'How quickly will my listing be updated?',
    a: 'Verified and above partners\' listings are reviewed and updated within 24 hours of signup. Featured and Premier get immediate priority.',
  },
  {
    q: 'Is web crawling of my site authorized?',
    a: 'We crawl publicly available pages and always link back to your original content. We respect robots.txt and honor any opt-out requests. Partners can also provide a direct data feed for more accurate listings.',
  },
];

export default function PartnerPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedTier, setSelectedTier] = useState('featured');

  const FOUNDING_DEADLINE = 'April 30, 2026';

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <a href="/" className={styles.navLogo}>
          <img src="/logo.png" alt="City Tour Guide" height="48" style={{objectFit:'contain'}} />
        </a>
        <a href="/" className={styles.navBack}>← Back to guide</a>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.foundingBanner}>
            🎉 <strong>Founding Partner Offer</strong> — Free through {FOUNDING_DEADLINE}. No credit card required.
          </div>
          <div className={styles.eyebrow}>🤝 Partner With Us</div>
          <h1 className={styles.h1}>Grow Your Reach.<br />Reach Tampa Bay.</h1>
          <p className={styles.sub}>
            City Tour Guide connects Tampa Bay visitors and locals with the best events, venues, and activities.
            Partner with us to put your business in front of thousands of people actively looking for what you offer.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}><strong>500K+</strong><span>Annual Visitors (projected)</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>2,000+</strong><span>Listings indexed</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Daily</strong><span>Data refresh</span></div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Free</strong><span>Through Apr 30</span></div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Partner With City Tour Guide?</h2>
          <div className={styles.valueGrid}>
            {VALUE_PROPS.map(v => (
              <div key={v.title} className={styles.valueCard}>
                <span className={styles.valueIcon}>{v.icon}</span>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={`${styles.section} ${styles.pricingSection}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
          <p className={styles.sectionSub}>Month-to-month. Cancel anytime. All paid tiers free through {FOUNDING_DEADLINE}.</p>
          <div className={styles.tierGrid}>
            {TIERS.map(tier => (
              <div
                key={tier.id}
                className={`${styles.tierCard} ${tier.highlight ? styles.tierHighlight : ''} ${selectedTier === tier.id ? styles.tierSelected : ''}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.highlight && <div className={styles.popularBadge}>Most Popular</div>}
                {tier.badge && <div className={styles.tierBadge}>{tier.badge}</div>}
                <h3 className={styles.tierName}>{tier.name}</h3>
                <div className={styles.tierPrice}>
                  <span className={styles.tierAmount}>{tier.price}</span>
                  <span className={styles.tierPeriod}>{tier.period}</span>
                </div>
                {tier.price !== '$0' && (
                  <p className={styles.tierFree}>Free through {FOUNDING_DEADLINE}</p>
                )}
                <p className={styles.tierDesc}>{tier.desc}</p>
                <ul className={styles.tierFeatures}>
                  {tier.features.map(f => (
                    <li key={f} className={styles.tierFeature}><span className={styles.check}>✓</span>{f}</li>
                  ))}
                </ul>
                {tier.id !== 'free' && (
                  <a
                    href={`/partner/signup?tier=${tier.id}`}
                    className={`${styles.tierCta} ${styles[`cta_${tier.ctaStyle}`]}`}
                  >
                    {tier.cta}
                  </a>
                )}
                {tier.id === 'free' && (
                  <span className={styles.tierCtaDisabled}>Already listed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Common Questions</h2>
          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                <button className={styles.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <span className={styles.faqArrow}>{openFaq === i ? '▲' : '▼'}</span>
                </button>
                {openFaq === i && <p className={styles.faqA}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={`${styles.section} ${styles.ctaSection}`}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to Grow With Tampa Bay?</h2>
          <p className={styles.ctaSub}>Join as a Founding Partner — free through {FOUNDING_DEADLINE}.</p>
          <a href="/partner/signup" className={styles.ctaBtn}>Become a Partner →</a>
          <p className={styles.ctaNote}>No credit card · Cancel anytime · Month-to-month</p>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 City Tour Guide, Inc. · <a href="/disclaimer">Disclaimer</a> · <a href="/privacy">Privacy</a> · <a href="/partner/terms">Partner Terms</a> · <a href="mailto:info@citytourguideinc.com">Contact</a></p>
      </footer>
    </div>
  );
}
