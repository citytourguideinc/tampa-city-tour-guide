// Shared CSS for all legal pages — reuses the app's design system tokens
export const legalStyles = `
  .legalPage {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
  }
  .legalNav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .legalNavLogo { color: var(--sunset2); font-weight: 700; text-decoration: none; font-size: 0.9rem; }
  .legalNavBack { color: var(--muted); font-size: 0.82rem; text-decoration: none; transition: color 0.2s; }
  .legalNavBack:hover { color: var(--text); }
  .legalContainer { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
  .legalBadge {
    display: inline-block;
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--teal); background: var(--teal-dim);
    padding: 3px 10px; border-radius: 99px; margin-bottom: 16px;
  }
  .legalTitle {
    font-family: 'Outfit', sans-serif;
    font-size: 2rem; font-weight: 800;
    background: var(--grad-sunset);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 6px; line-height: 1.15;
  }
  .legalDate { color: var(--dim); font-size: 0.78rem; margin-bottom: 40px; }
  .legalSection { margin-bottom: 32px; }
  .legalSection h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.1rem; font-weight: 700; color: var(--text);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }
  .legalSection p, .legalSection li {
    font-size: 0.88rem; color: var(--muted); line-height: 1.75; margin-bottom: 10px;
  }
  .legalSection ul { padding-left: 1.4rem; }
  .legalSection a { color: var(--sunset2); text-decoration: underline; }
  .legalHighlight {
    background: rgba(245,200,66,0.07);
    border-left: 3px solid rgba(245,200,66,0.4);
    padding: 12px 16px; border-radius: 0 var(--r-sm) var(--r-sm) 0;
    font-size: 0.84rem; color: var(--muted); margin-bottom: 16px;
  }
  .legalFooter {
    border-top: 1px solid var(--border);
    padding: 20px 24px; text-align: center;
    color: var(--dim); font-size: 0.75rem;
  }
  .legalFooter a { color: var(--muted); text-decoration: none; }
  .legalFooter a:hover { color: var(--sunset2); }
`;
