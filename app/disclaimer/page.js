// app/disclaimer/page.js
import { legalStyles } from '@/app/legal/styles';

export const metadata = {
  title: 'Disclaimer — Tampa City Tour Guide',
  description: 'Important disclaimers about the Tampa City Tour Guide website, partner links, and external content.',
};

export default function DisclaimerPage() {
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
          <h1 className="legalTitle">Disclaimer</h1>
          <p className="legalDate">Last updated: March 14, 2026</p>

          <div className="legalHighlight">
            Tampa City Tour Guide is a curated city discovery platform. We are not a booking agent, ticket reseller, or official representative of any business or organization listed on this site.
          </div>

          <div className="legalSection">
            <h2>General Information Only</h2>
            <p>This website provides curated directory information for discovery purposes only. All listings link directly to third-party websites where you can find current details, pricing, and availability. We do not guarantee the accuracy, completeness, or timeliness of any information provided.</p>
          </div>

          <div className="legalSection">
            <h2>Partner & Affiliate Links</h2>
            <p>Some links on this site are partner or affiliate links. If you click a partner link and make a purchase or booking, City Tour Guide may earn a commission at no extra cost to you. Partner links are clearly labeled with a <strong>💼 Partner Link</strong> badge.</p>
            <p>We only link to external services we believe may be useful to our visitors. However, inclusion of any link does not constitute endorsement, authorization, or a formal relationship with the linked business.</p>
          </div>

          <div className="legalSection">
            <h2>External Websites</h2>
            <p>All outbound links on this site open in a new tab and lead to third-party websites. We have no control over the content, policies, or practices of external sites and accept no responsibility for them. Please review the terms and privacy policies of any external site you visit.</p>
          </div>

          <div className="legalSection">
            <h2>No Endorsement</h2>
            <p>Listing a business or resource on Tampa City Tour Guide does not constitute endorsement, partnership, official status, or any formal affiliation. Businesses listed have not necessarily reviewed or approved their listing.</p>
          </div>

          <div className="legalSection">
            <h2>Pricing & Availability</h2>
            <p>Prices, dates, and availability shown on this site are estimates based on publicly available information at time of collection. Always verify current pricing and availability directly with the provider before making any purchase or booking decision.</p>
          </div>

          <div className="legalSection">
            <h2>Contact</h2>
            <p>Questions about this disclaimer? Email us at <a href="mailto:info@citytourguideinc.com">info@citytourguideinc.com</a>.</p>
          </div>
        </div>

        <footer className="legalFooter">
          <p>© 2026 City Tour Guide, Inc. · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/disclaimer">Disclaimer</a></p>
        </footer>
      </div>
    </>
  );
}
