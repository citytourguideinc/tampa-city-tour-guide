/* ── Tampa City Tour Guide — app.js ─────────────────────────── */

const APP_DATA = [
  {
    id: 'things-to-do',
    label: 'Things To Do',
    icon: '🌴',
    subcategories: [
      {
        id: 'city-parks',
        label: 'City Parks',
        icon: '🌿',
        links: [
          { name: 'Curtis Hixon Waterfront Park', url: 'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon' },
          { name: 'Florida State Parks',           url: 'https://www.floridastateparks.org/experiences-amenities' },
        ]
      },
      {
        id: 'city-resources',
        label: 'City Resources',
        icon: '🏛',
        links: [
          { name: 'Tampa.gov',                url: 'https://www.tampa.gov/info/things-to-do' },
          { name: 'Tampa Downtown Partnership', url: 'https://www.tampasdowntown.com/community-events/' },
        ]
      },
      {
        id: 'entertainment-sports',
        label: 'Entertainment & Sports',
        icon: '🏟',
        links: [
          { name: 'Benchmark International Arena', url: 'https://www.benchmarkintlarena.com/events' },
          { name: 'Tampa Convention Center',        url: 'https://www.tampa.gov/tcc/area-attractions' },
        ]
      },
      {
        id: 'museums-culture',
        label: 'Museums / Culture',
        icon: '🎨',
        links: [
          { name: 'Ybor Museum',              url: 'https://www.ybormuseum.org/events-programs' },
          { name: 'Tampa Bay History Center', url: 'https://tampabayhistorycenter.org/events/' },
          { name: 'Tampa Fire Fighters Museum', url: 'https://www.tampafirefightersmuseum.org/' },
          { name: 'Tampa Museum of Art',      url: 'https://tampamuseum.org/' },
        ]
      },
      {
        id: 'tourism-activities',
        label: 'Tourism & Activities',
        icon: '🗺',
        links: [
          { name: 'Get Your Guide',      url: 'https://www.getyourguide.com/tampa-l1187/' },
          { name: 'Local City Guides',   url: 'https://www.localcityguides.com/en/tampa/activities/all-activities' },
          { name: 'TripAdvisor',         url: 'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html' },
          { name: 'Viator',              url: 'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836' },
          { name: 'Visit Florida',       url: 'https://www.visitflorida.com/places-to-go/central-west/tampa/' },
          { name: 'Visit Tampa Bay',     url: 'https://www.visittampabay.com/things-to-do/tours/' },
        ]
      },
      {
        id: 'community',
        label: 'Community',
        icon: '🤝',
        links: [
          { name: 'Meetup', url: 'https://www.meetup.com/find/?location=us--fl--Tampa' },
        ]
      },
      {
        id: 'media-platforms',
        label: 'Media Platforms',
        icon: '📰',
        links: [
          { name: 'Tampa Entertainment Guide', url: 'https://tampa-bay.events/' },
          { name: '83 Degrees',                url: 'https://83degreesmedia.com/place/tampa/' },
        ]
      },
    ]
  },
  { id: 'events',        label: 'Events Calendar',            icon: '📅', subcategories: [] },
  { id: 'deals',         label: 'Deals & Discounts',          icon: '🎟',  subcategories: [] },
  { id: 'guides',        label: 'Digital Guides',             icon: '📖', subcategories: [] },
  { id: 'projects',      label: 'City Projects & Developments', icon: '🏗', subcategories: [] },
  { id: 'volunteer',     label: 'Volunteer Opportunities',    icon: '🙌', subcategories: [] },
];

/* ── State ─────────────────────────────────────────────── */
let activeCategory = APP_DATA[0].id;
let searchQuery    = '';

/* ── DOM Refs ──────────────────────────────────────────── */
const topNav           = document.getElementById('top-nav');
const categoriesWrap   = document.getElementById('categories-wrap');
const searchInput      = document.getElementById('search');
const searchClear      = document.getElementById('search-clear');
const searchPanel      = document.getElementById('search-results-panel');
const searchResultsBody = document.getElementById('search-results-body');
const searchCountEl    = document.getElementById('search-count');

/* ── Helpers ───────────────────────────────────────────── */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

/* ── Build Nav ─────────────────────────────────────────── */
function buildNav() {
  topNav.innerHTML = APP_DATA.map(cat => `
    <button
      class="top-nav-btn${cat.id === activeCategory ? ' active' : ''}"
      data-cat="${cat.id}"
      id="nav-${cat.id}"
      aria-pressed="${cat.id === activeCategory}"
    >
      <span class="nav-icon">${cat.icon}</span>
      ${escapeHtml(cat.label)}
    </button>
  `).join('');

  topNav.querySelectorAll('.top-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setCategory(btn.dataset.cat);
    });
  });
}

/* ── Build Category Panels ─────────────────────────────── */
function buildPanels() {
  categoriesWrap.innerHTML = APP_DATA.map(cat => {
    let body = '';

    if (cat.subcategories.length === 0) {
      body = `
        <div class="coming-soon">
          <div class="coming-soon-icon">${cat.icon}</div>
          <span class="coming-soon-badge">Coming Soon</span>
          <h3>${escapeHtml(cat.label)}</h3>
          <p>This section is being curated. Check back soon for hand-picked Tampa resources.</p>
        </div>`;
    } else {
      body = cat.subcategories.map((sub, i) => `
        <div class="subcategory-section" id="sub-${sub.id}">
          <div class="subcategory-header">
            <div class="subcategory-icon">${sub.icon}</div>
            <span class="subcategory-title">${escapeHtml(sub.label)}</span>
            <span class="subcategory-count">${sub.links.length}</span>
          </div>
          <div class="links-grid">
            ${sub.links.map(link => `
              <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card"
                 id="link-${sub.id}-${link.name.replace(/\s+/g,'-').toLowerCase()}"
                 data-name="${escapeHtml(link.name)}"
                 data-sub="${escapeHtml(sub.label)}"
                 data-cat="${escapeHtml(cat.label)}">
                <span class="link-card-icon">🔗</span>
                <span class="link-card-name">${escapeHtml(link.name)}</span>
                <span class="link-card-arrow">↗</span>
              </a>
            `).join('')}
          </div>
          ${i < cat.subcategories.length - 1 ? '<div class="section-divider"></div>' : ''}
        </div>
      `).join('');
    }

    return `
      <div class="category-panel${cat.id === activeCategory ? ' active' : ''}"
           id="panel-${cat.id}"
           role="tabpanel"
           aria-labelledby="nav-${cat.id}">
        ${body}
      </div>`;
  }).join('');
}

/* ── Set Active Category ───────────────────────────────── */
function setCategory(id) {
  activeCategory = id;
  clearSearch();

  // Update nav buttons
  topNav.querySelectorAll('.top-nav-btn').forEach(btn => {
    const isActive = btn.dataset.cat === id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  // Update panels
  categoriesWrap.querySelectorAll('.category-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${id}`);
  });
}

/* ── Search ────────────────────────────────────────────── */
function doSearch(query) {
  searchQuery = query.trim().toLowerCase();

  if (!searchQuery) {
    clearSearch();
    return;
  }

  // Hide category panels, show search panel
  categoriesWrap.querySelectorAll('.category-panel').forEach(p => p.classList.remove('active'));
  searchPanel.classList.add('active');
  searchClear.classList.add('visible');

  // Deactivate nav
  topNav.querySelectorAll('.top-nav-btn').forEach(btn => btn.classList.remove('active'));

  // Gather matches across all data
  const matches = [];
  APP_DATA.forEach(cat => {
    cat.subcategories.forEach(sub => {
      sub.links.forEach(link => {
        if (link.name.toLowerCase().includes(searchQuery)) {
          matches.push({ link, sub, cat });
        }
      });
    });
  });

  // Render
  searchCountEl.textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''}`;

  if (matches.length === 0) {
    searchResultsBody.innerHTML = `
      <div class="search-no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results for <strong>"${escapeHtml(query)}"</strong><br>Try a different search term.</p>
      </div>`;
    return;
  }

  searchResultsBody.innerHTML = `
    <div class="links-grid">
      ${matches.map(({ link, sub, cat }) => `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card">
          <span class="link-card-icon">🔗</span>
          <span class="link-card-name">
            ${highlight(link.name, query)}
            <br>
            <span class="search-result-tag">${escapeHtml(sub.label)}</span>
          </span>
          <span class="link-card-arrow">↗</span>
        </a>
      `).join('')}
    </div>`;
}

function clearSearch() {
  searchInput.value = '';
  searchQuery = '';
  searchPanel.classList.remove('active');
  searchClear.classList.remove('visible');

  // Re-show the active category panel
  categoriesWrap.querySelectorAll('.category-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${activeCategory}`);
  });

  // Re-activate the nav button
  topNav.querySelectorAll('.top-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === activeCategory);
  });
}

/* ── Event Listeners ───────────────────────────────────── */
searchInput.addEventListener('input', e => {
  const val = e.target.value;
  if (val.trim()) {
    searchClear.classList.add('visible');
    doSearch(val);
  } else {
    clearSearch();
  }
});

searchClear.addEventListener('click', () => {
  clearSearch();
  searchInput.focus();
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    clearSearch();
    searchInput.blur();
  }
});

/* ── Init ──────────────────────────────────────────────── */
function init() {
  buildNav();
  buildPanels();
}

document.addEventListener('DOMContentLoaded', init);
