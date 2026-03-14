// app/privacy/page.js
import { legalStyles } from '@/app/legal/styles';

export const metadata = {
  title: 'Privacy Policy — Tampa City Tour Guide',
  description: 'How Tampa City Tour Guide collects, uses, and protects your data.',
};

export default function PrivacyPage() {
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
          <h1 className="legalTitle">Privacy Policy</h1>
          <p className="legalDate">Last updated: March 14, 2026</p>

          <div className="legalHighlight">
            We designed Tampa City Tour Guide to be a low-data, discovery-first platform. We do not sell your personal information.
          </div>

          <div className="legalSection">
            <h2>What We Collect</h2>
            <ul>
              <li><strong>Usage data:</strong> Pages visited, search queries, and clicks — collected anonymously via Google Analytics (if enabled). No personally identifiable information is tied to this data.</li>
              <li><strong>Partner application form:</strong> If you submit a partner application, we collect your name, business email, and business name for the purpose of responding to your inquiry.</li>
              <li><strong>Cookies:</strong> We may use essential cookies for session management. Analytics cookies are only set with your consent.</li>
            </ul>
          </div>

          <div className="legalSection">
            <h2>What We Do Not Collect</h2>
            <ul>
              <li>Payment information — we do not process transactions</li>
              <li>Precise location data</li>
              <li>Sensitive personal information</li>
              <li>Account or login data (no user accounts on this site)</li>
            </ul>
          </div>

          <div className="legalSection">
            <h2>Third-Party Links</h2>
            <p>This site links to third-party websites, including affiliate and partner destinations. Once you leave this site, their own privacy policies apply. We encourage you to review those policies before making any transaction.</p>
          </div>

          <div className="legalSection">
            <h2>Analytics</h2>
            <p>We use Google Analytics 4 to understand aggregate usage patterns (popular searches, most-clicked categories). This data is anonymised and used solely to improve the site. You can opt out via the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out browser add-on</a>.</p>
          </div>

          <div className="legalSection">
            <h2>Data Retention</h2>
            <p>Partner application data is retained only as long as necessary to respond to your inquiry. Analytics data is retained for 14 months per Google Analytics default settings.</p>
          </div>

          <div className="legalSection">
            <h2>Your Rights</h2>
            <p>You have the right to request access to, correction of, or deletion of any personal information we hold. Contact us at <a href="mailto:info@citytourguide.app">info@citytourguide.app</a>.</p>
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
