// app/terms/page.js
import { legalStyles } from '@/app/legal/styles';

export const metadata = {
  title: 'Terms of Use — Tampa City Tour Guide',
  description: 'Terms and conditions for using the Tampa City Tour Guide website.',
};

export default function TermsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: legalStyles }} />
      <div className="legalPage">
        <nav className="legalNav">
          <a href="/" className="legalNavLogo">🌴 Tampa City Tour Guide</a>
          <a href="/" className="legalNavBack">← Back to guide</a>
        </nav>

        <div className="legalContainer">
          <div className="legalBadge">Legal</div>
          <h1 className="legalTitle">Terms of Use</h1>
          <p className="legalDate">Last updated: March 14, 2026</p>

          <div className="legalHighlight">
            By using Tampa City Tour Guide, you agree to these terms. This is a curated discovery directory — not a booking platform, ticket reseller, or marketplace.
          </div>

          <div className="legalSection">
            <h2>About This Service</h2>
            <p>Tampa City Tour Guide ("the Site") is operated by City Tour Guide, Inc. The Site provides curated links to third-party businesses, events, and local resources in the Tampa Bay area for informational and discovery purposes only.</p>
          </div>

          <div className="legalSection">
            <h2>We Are Not a Booking Agent</h2>
            <p>We do not sell tickets, process payments, or facilitate bookings. All transactions occur directly on third-party websites. City Tour Guide has no responsibility for third-party purchases, cancellations, or disputes.</p>
          </div>

          <div className="legalSection">
            <h2>Affiliate Relationships</h2>
            <p>Some links on this site are affiliate links. Clicking an affiliate link and making a purchase may result in City Tour Guide earning a commission. This does not affect the price you pay. Affiliate links are clearly labeled as <strong>💼 Partner Link</strong>.</p>
          </div>

          <div className="legalSection">
            <h2>Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Scrape, crawl, or systematically copy content from this site for commercial purposes</li>
              <li>Use this site to distribute spam or malicious content</li>
              <li>Attempt to gain unauthorized access to any part of the site or its infrastructure</li>
              <li>Misrepresent this site as an official government or business resource</li>
            </ul>
          </div>

          <div className="legalSection">
            <h2>Intellectual Property</h2>
            <p>All original content, descriptions, and design on this site are the property of City Tour Guide, Inc. Listings reference third-party sources and are provided for discovery only. We claim no ownership of third-party trademarks, content, or brand names referenced on this site.</p>
          </div>

          <div className="legalSection">
            <h2>Limitation of Liability</h2>
            <p>City Tour Guide, Inc. is not liable for any direct, indirect, incidental, or consequential damages arising from your use of this site or any third-party site linked from it. All information is provided "as is" without warranties of any kind.</p>
          </div>

          <div className="legalSection">
            <h2>Changes to These Terms</h2>
            <p>We may update these terms from time to time. The date at the top of this page indicates when it was last revised. Continued use of the site constitutes acceptance of any changes.</p>
          </div>

          <div className="legalSection">
            <h2>Contact</h2>
            <p>City Tour Guide, Inc. · <a href="mailto:info@citytourguide.app">info@citytourguide.app</a></p>
          </div>
        </div>

        <footer className="legalFooter">
          <p>© 2026 City Tour Guide, Inc. · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/disclaimer">Disclaimer</a></p>
        </footer>
      </div>
    </>
  );
}
