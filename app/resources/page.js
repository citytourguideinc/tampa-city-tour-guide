import Link from 'next/link';
import styles from './page.module.css';
import DownloadButton from './DownloadButton';

export const metadata = {
  title: 'Tampa Resources — City Tour Guide',
  description: 'Curated directory of Tampa Bay events, parks, museums, tourism sites, and community resources — all in one place.',
};

// ── Curated resource data ─────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'things-to-do',
    label: 'Things To Do',
    emoji: '🎯',
    subgroups: [
      {
        label: 'City Parks',
        emoji: '🌳',
        links: [
          { name: 'Curtis Hixon Waterfront Park', tag: 'City Park',    url: 'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon' },
          { name: 'Florida State Parks',           tag: 'State Parks',  url: 'https://www.floridastateparks.org/experiences-amenities' },
        ],
      },
      {
        label: 'City Resources',
        emoji: '🏛️',
        links: [
          { name: 'Tampa.gov',                    tag: 'Public Resource', url: 'https://www.tampa.gov/info/things-to-do' },
          { name: 'Tampa Downtown Partnership',    tag: 'Downtown',      url: 'https://www.tampasdowntown.com/community-events/' },
        ],
      },
      {
        label: 'Entertainment & Sports',
        emoji: '🎭',
        links: [
          { name: 'Benchmark International Arena', tag: 'Arena Events',  url: 'https://www.benchmarkintlarena.com/events' },
          { name: 'Tampa Convention Center',        tag: 'Conventions',  url: 'https://www.tampa.gov/tcc/area-attractions' },
        ],
      },
      {
        label: 'Museums & Culture',
        emoji: '🏺',
        links: [
          { name: 'Ybor Museum',               tag: 'History', url: 'https://www.ybormuseum.org/events-programs' },
          { name: 'Tampa Bay History Center',   tag: 'History', url: 'https://tampabayhistorycenter.org/events/' },
          { name: 'Tampa Fire Fighters Museum', tag: 'Museum',  url: 'https://www.tampafirefightersmuseum.org/' },
          { name: 'Tampa Museum of Art',        tag: 'Art',     url: 'https://tampamuseum.org/' },
        ],
      },
      {
        label: 'Tourism & Activities',
        emoji: '✈️',
        links: [
          { name: 'Get Your Guide',    tag: 'Tours',           url: 'https://www.getyourguide.com/tampa-l1187/' },
          { name: 'Local City Guides', tag: 'Activities',      url: 'https://www.localcityguides.com/en/tampa/activities/all-activities' },
          { name: 'TripAdvisor',       tag: 'Attractions',     url: 'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html' },
          { name: 'Viator',            tag: 'Tours & Trips',   url: 'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836' },
          { name: 'Visit Florida',     tag: 'State Tourism',   url: 'https://www.visitflorida.com/places-to-go/central-west/tampa/' },
          { name: 'Visit Tampa Bay',   tag: 'Directory Listing', url: 'https://www.visittampabay.com/things-to-do/tours/' },
        ],
      },
      {
        label: 'Community',
        emoji: '🤝',
        links: [
          { name: 'Meetup — Tampa', tag: 'Local Groups', url: 'https://www.meetup.com/find/?location=us--fl--Tampa' },
        ],
      },
      {
        label: 'Media Platforms',
        emoji: '📰',
        links: [
          { name: 'Tampa Entertainment Guide', tag: 'Events Media', url: 'https://tampa-bay.events/' },
          { name: '83 Degrees',                tag: 'Local Pick',  url: 'https://83degreesmedia.com/place/tampa/' },
        ],
      },
    ],
  },
  {
    id: 'events-calendar',
    label: 'Events Calendar',
    emoji: '📅',
    links: [
      { name: 'Tampa Downtown Events',         tag: 'Downtown',         url: 'https://www.tampasdowntown.com/community-events/' },
      { name: 'Tampa Bay Events',              tag: 'Events Listings',  url: 'https://tampa-bay.events/' },
      { name: 'Tampa Bay History Center',      tag: 'Cultural Events',  url: 'https://tampabayhistorycenter.org/events/' },
      { name: 'Ybor Museum Events',            tag: 'Museum Programs',  url: 'https://www.ybormuseum.org/events-programs' },
      { name: 'Benchmark International Arena', tag: 'Live Events',      url: 'https://www.benchmarkintlarena.com/events' },
      { name: 'Meetup — Tampa',               tag: 'Community Events', url: 'https://www.meetup.com/find/?location=us--fl--Tampa' },
    ],
  },
  {
    id: 'deals',
    label: 'Deals & Discounts',
    emoji: '🏷️',
    links: [
      { name: 'Get Your Guide', tag: 'Tour Deals',     url: 'https://www.getyourguide.com/tampa-l1187/' },
      { name: 'Viator',         tag: 'Activity Deals', url: 'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836' },
      { name: 'TripAdvisor',    tag: 'Best Value',     url: 'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html' },
    ],
  },
  {
    id: 'digital-guides',
    label: 'Digital Guides',
    emoji: '📱',
    links: [
      { name: 'Visit Tampa Bay',       tag: 'Official Guide',    url: 'https://www.visittampabay.com/things-to-do/tours/' },
      { name: 'Visit Florida — Tampa', tag: 'State Guide',       url: 'https://www.visitflorida.com/places-to-go/central-west/tampa/' },
      { name: 'Local City Guides',     tag: 'City Guide',        url: 'https://www.localcityguides.com/en/tampa/activities/all-activities' },
      { name: '83 Degrees',            tag: 'Local Journalism',  url: 'https://83degreesmedia.com/place/tampa/' },
    ],
  },
  {
    id: 'city-projects',
    label: 'City Projects & Developments',
    emoji: '🏗️',
    links: [
      { name: 'Tampa.gov',                  tag: 'City Official', url: 'https://www.tampa.gov/info/things-to-do' },
      { name: 'Tampa Downtown Partnership', tag: 'Development',   url: 'https://www.tampasdowntown.com/community-events/' },
    ],
  },
  {
    id: 'volunteer',
    label: 'Volunteer Opportunities',
    emoji: '🙌',
    links: [
      { name: 'Meetup — Tampa', tag: 'Community Groups', url: 'https://www.meetup.com/find/?location=us--fl--Tampa' },
      { name: 'Tampa.gov',      tag: 'City Programs',    url: 'https://www.tampa.gov/info/things-to-do' },
    ],
  },
];

// ── Sub-component: a single link card ────────────────────────────
function ResourceCard({ name, tag, url }) {
  return (
    <a
      className={styles.card}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.cardName}>{name}</span>
      <span className={`tag ${styles.cardTag}`}>{tag}</span>
      <span className={styles.cardArrow} aria-hidden="true">↗</span>
    </a>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function ResourcesPage() {
  return (
    <div className={styles.page}>

      {/* Print styles — injected so PDF output is clean */}
      <style>{`
        @media print {
          .${styles.stickyBar}, a[href="/"] { display: none !important; }
          body { background: #fff !important; color: #111 !important; }
          .${styles.card} { border: 1px solid #ddd !important; background: #fafafa !important; }
          .${styles.header} { background: #fff !important; }
          .${styles.sectionTitle}, .${styles.h1} {
            -webkit-text-fill-color: #111 !important;
            background: none !important;
            color: #111 !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerTop}>
            <Link href="/" className={styles.backLink}>← Back to Discovery</Link>
            <DownloadButton />
          </div>
          <div className={styles.eyebrow}>
            <span className={styles.dot} /> Curated · Tampa Bay
          </div>
          <h1 className={`display ${styles.h1}`}>Tampa Resources</h1>
          <p className={styles.sub}>
            A handpicked directory of Tampa Bay events, parks, museums, and community sites —
            name-only links that open the official source.
          </p>
          <p className={styles.disclaimer}>
            ℹ️ All links open external sites in a new tab. No affiliation with linked organizations.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <div className="container">
          {CATEGORIES.map((cat) => (
            <section key={cat.id} className={styles.section} id={cat.id}>

              {/* Section heading */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionEmoji}>{cat.emoji}</span>
                <h2 className={`display ${styles.sectionTitle}`}>{cat.label}</h2>
              </div>

              {/* Category with subgroups */}
              {cat.subgroups ? (
                cat.subgroups.map((sg) => (
                  <div key={sg.label} className={styles.subgroup}>
                    <h3 className={styles.subgroupTitle}>
                      <span>{sg.emoji}</span> {sg.label}
                    </h3>
                    <div className={styles.grid}>
                      {sg.links.map((link) => (
                        <ResourceCard key={link.url} {...link} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.grid}>
                  {cat.links.map((link) => (
                    <ResourceCard key={link.url} {...link} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {/* Sticky download bar — always visible */}
      <div className={styles.stickyBar}>
        <span>📚 Tampa Resources — {CATEGORIES.reduce((acc, c) => acc + (c.links?.length || c.subgroups?.reduce((a, sg) => a + sg.links.length, 0) || 0), 0)} curated links</span>
        <DownloadButton />
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>
            © 2026 <strong>City Tour Guide, Inc.</strong> ·{' '}
            <Link href="/">← Discovery Home</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
