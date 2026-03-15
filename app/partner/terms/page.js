import styles from './terms.module.css';

export const metadata = { title: 'Partner Terms — City Tour Guide' };

export default function PartnerTerms() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/partner" className={styles.back}>← Partner Overview</a>
      </nav>
      <div className={styles.content}>
        <h1>Partner Agreement</h1>
        <p className={styles.updated}>Effective: March 2026 · Month-to-month · Cancel anytime</p>

        <h2>1. Founding Partner Offer</h2>
        <p>Partners who sign up before May 1, 2026 receive full access to their chosen tier at no cost through April 30, 2026. Billing begins May 1, 2026 at the monthly rate for the selected tier. No credit card is required until the trial period ends.</p>

        <h2>2. Month-to-Month Terms</h2>
        <p>All paid partnerships are month-to-month subscriptions. There are no long-term commitments or contracts. Partners may cancel at any time before their next billing date. Upon cancellation, the listing reverts to a standard (free) crawled listing.</p>

        <h2>3. What Partners Receive</h2>
        <ul>
          <li><strong>Verified ($49/mo):</strong> Verified badge, priority search ranking, curated listing, monthly visit stats.</li>
          <li><strong>Featured ($149/mo):</strong> Everything in Verified, plus featured card design, logo display, top-of-results placement, AI brand mentions, quarterly analytics reports.</li>
          <li><strong>Premier ($299/mo):</strong> Everything in Featured, plus homepage featured placement, API data feed access, dedicated profile page, monthly analytics dashboard, priority support.</li>
          <li><strong>Event Boost ($29/event):</strong> Single event featured placement for 30 days.</li>
          <li><strong>Event Premier ($79/event):</strong> Homepage event feature, highlighted card, and AI recommendations for 30 days.</li>
        </ul>

        <h2>4. Data & Listings</h2>
        <p>City Tour Guide crawls publicly available web pages and aggregates listing information for discovery purposes. All links direct users to the partner's original website. City Tour Guide does not claim ownership of partner content. Partners may request specific listing updates at any time by contacting <a href="mailto:info@citytourguideinc.com">info@citytourguideinc.com</a>.</p>

        <h2>5. API Access (Premier)</h2>
        <p>Premier partners receive API credentials within 24 hours of signup. The API allows partners to submit structured event and listing data directly, ensuring maximum accuracy. API access is subject to rate limits and usage policies provided separately.</p>

        <h2>6. Opt-Out & Removal</h2>
        <p>Any organization may request complete removal from City Tour Guide at any time by emailing <a href="mailto:info@citytourguideinc.com">info@citytourguideinc.com</a>. Removal will be completed within 48 hours. We also respect robots.txt directives.</p>

        <h2>7. Refunds</h2>
        <p>Due to the digital nature of the service, paid months are non-refundable. However, the Founding Partner free period ensures no charges occur before May 1, 2026.</p>

        <h2>8. Changes to Terms</h2>
        <p>City Tour Guide reserves the right to update these terms with 30 days' notice. Continued use of partner services constitutes acceptance of updated terms.</p>

        <h2>9. Contact</h2>
        <p>Questions? <a href="mailto:info@citytourguideinc.com">info@citytourguideinc.com</a> · City Tour Guide, Inc.</p>
      </div>
    </div>
  );
}
