// Shared CSS for all legal pages — explicit colors for legibility
export const legalStyles = `
  .legalPage {
    min-height: 100vh;
    background: #F8F7F4;
    color: #111827;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .legalNav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    background: #FFFFFF;
  }
  .legalNavLogo { color: #0066CC; font-weight: 700; text-decoration: none; font-size: 0.95rem; }
  .legalNavBack { color: #6B7280; font-size: 0.85rem; text-decoration: none; transition: color 0.2s; }
  .legalNavBack:hover { color: #111827; }
  .legalContainer { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
  .legalBadge {
    display: inline-block;
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: #0D7490; background: rgba(13,116,144,0.08);
    padding: 4px 12px; border-radius: 99px; margin-bottom: 16px;
  }
  .legalTitle {
    font-family: 'Outfit', sans-serif;
    font-size: 2.2rem; font-weight: 800;
    color: #111827;
    margin-bottom: 6px; line-height: 1.15;
  }
  .legalDate { color: #9CA3AF; font-size: 0.82rem; margin-bottom: 40px; }
  .legalSection { margin-bottom: 36px; }
  .legalSection h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.2rem; font-weight: 700; color: #111827;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid rgba(0,102,204,0.12);
  }
  .legalSection p, .legalSection li {
    font-size: 0.95rem; color: #374151; line-height: 1.8; margin-bottom: 12px;
  }
  .legalSection ul { padding-left: 1.4rem; }
  .legalSection a { color: #0066CC; text-decoration: underline; }
  .legalHighlight {
    background: rgba(0,102,204,0.05);
    border-left: 4px solid rgba(0,102,204,0.3);
    padding: 14px 18px; border-radius: 0 10px 10px 0;
    font-size: 0.95rem; color: #374151; margin-bottom: 28px; line-height: 1.7;
  }
  .legalFooter {
    border-top: 1px solid rgba(0,0,0,0.08);
    padding: 20px 24px; text-align: center;
    color: #9CA3AF; font-size: 0.78rem;
  }
  .legalFooter a { color: #6B7280; text-decoration: none; }
  .legalFooter a:hover { color: #0066CC; }
`;
