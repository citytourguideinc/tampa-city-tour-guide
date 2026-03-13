/* ── Tampa City Guide — Chat App ─────────────────────────────── */

/* ── Private Data (never displayed as a list) ─────────────────── */
const _DB = [
  /* ── THINGS TO DO ──────────────────────────────────────────── */
  { name:'Curtis Hixon Waterfront Park',   url:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon',      cat:'Things To Do', sub:'City Parks',            icon:'🌿', keywords:['park','outdoor','waterfront','riverwalk','family','kids','free','picnic','nature','walk'] },
  { name:'Florida State Parks',            url:'https://www.floridastateparks.org/experiences-amenities',                      cat:'Things To Do', sub:'City Parks',            icon:'🌿', keywords:['park','nature','hike','camping','outdoor','state','family','wildlife','beach','trail'] },
  { name:'Tampa.gov — Things To Do',       url:'https://www.tampa.gov/info/things-to-do',                                      cat:'Things To Do', sub:'City Resources',        icon:'🏛', keywords:['city','government','guide','resources','official','information'] },
  { name:'Tampa Downtown Partnership',     url:'https://www.tampasdowntown.com/community-events/',                             cat:'Things To Do', sub:'City Resources',        icon:'🏛', keywords:['downtown','community','events','local','partnership','business'] },
  { name:'Benchmark International Arena', url:'https://www.benchmarkintlarena.com/events',                                    cat:'Things To Do', sub:'Entertainment & Sports', icon:'🏟', keywords:['arena','concerts','sports','hockey','lightning','events','live','music','shows','tickets'] },
  { name:'Tampa Convention Center',        url:'https://www.tampa.gov/tcc/area-attractions',                                   cat:'Things To Do', sub:'Entertainment & Sports', icon:'🏟', keywords:['convention','events','conference','attractions','waterfront','shows'] },
  { name:'Ybor Museum',                    url:'https://www.ybormuseum.org/events-programs',                                   cat:'Things To Do', sub:'Museums / Culture',     icon:'🎨', keywords:['museum','history','ybor','culture','cuban','cigar','heritage','arts'] },
  { name:'Tampa Bay History Center',       url:'https://tampabayhistorycenter.org/events/',                                    cat:'Things To Do', sub:'Museums / Culture',     icon:'🎨', keywords:['museum','history','heritage','culture','exhibits','family','kids','education'] },
  { name:'Tampa Fire Fighters Museum',     url:'https://www.tampafirefightersmuseum.org/',                                     cat:'Things To Do', sub:'Museums / Culture',     icon:'🎨', keywords:['museum','fire','firefighter','history','kids','family','education'] },
  { name:'Tampa Museum of Art',            url:'https://tampamuseum.org/',                                                     cat:'Things To Do', sub:'Museums / Culture',     icon:'🎨', keywords:['museum','art','culture','exhibits','gallery','waterfront','events'] },
  { name:'Get Your Guide',                 url:'https://www.getyourguide.com/tampa-l1187/',                                    cat:'Things To Do', sub:'Tourism & Activities',  icon:'🗺', keywords:['tours','activities','guided','tickets','golf cart','boat','kayak','sightseeing','adventure','outdoor','fun','day trip','excursion'] },
  { name:'Local City Guides',              url:'https://www.localcityguides.com/en/tampa/activities/all-activities',           cat:'Things To Do', sub:'Tourism & Activities',  icon:'🗺', keywords:['tours','activities','local','guide','sightseeing','things to do','attractions'] },
  { name:'TripAdvisor',                    url:'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html', cat:'Things To Do', sub:'Tourism & Activities',  icon:'🗺', keywords:['tours','activities','restaurants','hotels','reviews','attractions','sightseeing','things to do'] },
  { name:'Viator',                         url:'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836',            cat:'Things To Do', sub:'Tourism & Activities',  icon:'🗺', keywords:['tours','activities','booking','guided','excursion','sightseeing','golf cart','boat','kayak','adventure'] },
  { name:'Visit Florida',                  url:'https://www.visitflorida.com/places-to-go/central-west/tampa/',               cat:'Things To Do', sub:'Tourism & Activities',  icon:'🗺', keywords:['tourism','florida','travel','things to do','beaches','attractions','visit','vacation'] },
  { name:'Visit Tampa Bay',                url:'https://www.visittampabay.com/things-to-do/tours/',                           cat:'Things To Do', sub:'Tourism & Activities',  icon:'🗺', keywords:['tours','tampa','bay','tourism','activities','sightseeing','official','visitor','things to do','golf cart','boat','kayak'] },
  { name:'Meetup',                         url:'https://www.meetup.com/find/?location=us--fl--Tampa',                         cat:'Things To Do', sub:'Community',             icon:'🤝', keywords:['community','meetup','social','groups','networking','events','local','people','friends'] },
  { name:'Tampa Entertainment Guide',      url:'https://tampa-bay.events/',                                                   cat:'Things To Do', sub:'Media Platforms',       icon:'📰', keywords:['events','entertainment','guide','nightlife','shows','concerts','things to do','weekend'] },
  { name:'83 Degrees',                     url:'https://83degreesmedia.com/place/tampa/',                                     cat:'Things To Do', sub:'Media Platforms',       icon:'📰', keywords:['media','news','local','things to do','arts','culture','innovation','events'] },

  /* ── EVENTS CALENDAR ───────────────────────────────────────── */
  { name:'Tampa.gov — Events',             url:'https://www.tampa.gov/guide/tampa-events',                                    cat:'Events Calendar', sub:'City & Government',           icon:'🏛', keywords:['events','city','government','calendar','official','things to do','weekend'] },
  { name:'Tampa.gov — Arts & Nightlife',   url:'https://www.tampa.gov/guide/tampa-events#section-20466',                     cat:'Events Calendar', sub:'City & Government',           icon:'🏛', keywords:['arts','nightlife','bars','music','entertainment','events','weekend','night out'] },
  { name:'The Tampa Riverwalk',            url:'https://thetampariverwalk.com/events/event-calendar.html',                   cat:'Events Calendar', sub:'City & Government',           icon:'🌊', keywords:['riverwalk','waterfront','events','outdoor','family','free','weekend','walk','park'] },
  { name:'Straz Center',                   url:'https://www.strazcenter.org/calendar/',                                       cat:'Events Calendar', sub:'Venues & Attractions',        icon:'🎭', keywords:['theater','performing arts','shows','broadway','concerts','events','tickets','culture'] },
  { name:'Benchmark International Arena', url:'https://www.benchmarkintlarena.com/events',                                   cat:'Events Calendar', sub:'Venues & Attractions',        icon:'🏟', keywords:['arena','concerts','sports','events','tickets','shows','live','music','hockey'] },
  { name:'Armature Works',                 url:'https://www.armatureworks.com/all-events/',                                   cat:'Events Calendar', sub:'Venues & Attractions',        icon:'🏗', keywords:['events','food','market','nightlife','waterfront','social','weekend','fun'] },
  { name:"That's So Tampa",               url:'https://thatssotampa.com/events/map/',                                        cat:'Events Calendar', sub:'Local Media & Community',     icon:'📍', keywords:['events','local','guide','map','things to do','weekend','entertainment','nightlife'] },
  { name:'Patch — South Tampa',            url:'https://patch.com/florida/southtampa/calendar',                              cat:'Events Calendar', sub:'Local Media & Community',     icon:'📰', keywords:['local','news','events','calendar','south tampa','community','things to do'] },
  { name:'Creative Loafing Tampa',         url:'https://community.cltampa.com/tampa/EventSearch?neighborhoodGroup=12315336&sortType=date&v=d', cat:'Events Calendar', sub:'Local Media & Community', icon:'📰', keywords:['arts','culture','events','music','food','nightlife','weekend','local','guide'] },
  { name:'Facebook Events',               url:'https://www.facebook.com/events',                                             cat:'Events Calendar', sub:'Local Media & Community',     icon:'👥', keywords:['events','social','community','local','parties','meetups','entertainment'] },
  { name:'Visit Tampa Bay — Events',       url:'https://www.visittampabay.com/tampa-events/',                                 cat:'Events Calendar', sub:'Tourism & Visitor Resources', icon:'🌴', keywords:['events','tourism','visitor','official','things to do','calendar','weekend','tampa bay'] },
  { name:'Discover in Town',              url:'https://www.discoverintown.com/default.aspx?redirect=/contentManaged/BL-LandingPage/BL-LandingPage.aspx', cat:'Events Calendar', sub:'Tourism & Visitor Resources', icon:'🗺', keywords:['events','discover','local','guide','things to do','calendar'] },

  /* ── DEALS & DISCOUNTS ─────────────────────────────────────── */
  { name:'LivingSocial',                   url:'https://www.livingsocial.com/local/tampa/sightseeing-and-tours?page=3',       cat:'Deals & Discounts', sub:'Savings Platforms',      icon:'💰', keywords:['deals','discounts','coupons','savings','tours','sightseeing','cheap','affordable'] },
  { name:'Groupon',                        url:'https://www.groupon.com/local/tampa/sightseeing-and-tours',                   cat:'Deals & Discounts', sub:'Savings Platforms',      icon:'💰', keywords:['deals','discounts','coupons','groupon','tours','sightseeing','save','cheap','affordable','restaurants'] },
  { name:'CityPASS Tampa',                 url:'https://www.citypass.com/tampa',                                              cat:'Deals & Discounts', sub:'Savings Platforms',      icon:'🎟', keywords:['deals','pass','attractions','discount','save','family','bundle','tickets','aquarium','zoo','busch gardens'] },
  { name:'Discover Downtown Tampa',        url:'https://tampa.discoverdowntown.com/default.aspx?redirect=/specialOffers/specialOffers.aspx', cat:'Deals & Discounts', sub:'Tourism & Visitor Info', icon:'🏙', keywords:['deals','downtown','offers','discounts','restaurants','shopping','attractions'] },
  { name:'Visit Tampa Bay — Unlock Deals', url:'https://www.visittampabay.com/unlock-deals/',                                 cat:'Deals & Discounts', sub:'Tourism & Visitor Info', icon:'🌴', keywords:['deals','discounts','offers','savings','tourism','visitor','official','tampa bay'] },

  /* ── DIGITAL GUIDES ────────────────────────────────────────── */
  { name:'Tampa.gov — Downtown Guide',         url:'https://www.tampa.gov/guide/downtown-tampa',                             cat:'Digital Guides', sub:'Directories',    icon:'📍', keywords:['guide','downtown','directory','official','map','neighborhoods','things to do','city'] },
  { name:'Tampa Downtown Partnership — Places', url:'https://www.tampasdowntown.com/place_category/featured/?place_category=&orderby=post_title&post_type=place', cat:'Digital Guides', sub:'Directories', icon:'📍', keywords:['directory','places','downtown','restaurants','shops','businesses','map','guide'] },

  /* ── CITY PROJECTS ─────────────────────────────────────────── */
  { name:'Tampa.gov — City Projects',      url:'https://www.tampa.gov/project',                                              cat:'City Projects & Developments', sub:'City Government Projects', icon:'🏗', keywords:['projects','development','construction','city','government','infrastructure','plans','zoning'] },

  /* ── VOLUNTEER ─────────────────────────────────────────────── */
  { name:'Keep Tampa Bay Beautiful',                url:'https://www.keeptampabaybeautiful.org/',                            cat:'Volunteer Opportunities', sub:'Environmental Conservation', icon:'🌿', keywords:['volunteer','environment','conservation','clean','beach','community','service','bay'] },
  { name:'Keep Tampa Bay Beautiful — Volunteer',    url:'https://www.keeptampabaybeautiful.org/become-a-volunteer',          cat:'Volunteer Opportunities', sub:'Environmental Conservation', icon:'🌿', keywords:['volunteer','sign up','environment','conservation','cleanup','community','service'] },
  { name:'The Tampa Riverwalk — How to Help',       url:'https://thetampariverwalk.com/how-to-help/donate.html',            cat:'Volunteer Opportunities', sub:'Environmental Conservation', icon:'🌊', keywords:['volunteer','donate','help','riverwalk','conservation','community','waterfront'] },
  { name:'The Florida Aquarium — Volunteer',        url:'https://www.flaquarium.org/gift-give/volunteer/',                  cat:'Volunteer Opportunities', sub:'Cultural & Educational',    icon:'🐠', keywords:['volunteer','aquarium','marine','education','animals','conservation','kids','family'] },
  { name:'Tampa Bay History Center — Volunteer',    url:'https://tampabayhistorycenter.org/volunteer/',                     cat:'Volunteer Opportunities', sub:'Cultural & Educational',    icon:'🏛', keywords:['volunteer','museum','history','education','culture','community','service'] },
  { name:'Straz Center — Volunteer',                url:'https://www.strazcenter.org/about-us/volunteer-opportunities/',    cat:'Volunteer Opportunities', sub:'Cultural & Educational',    icon:'🎭', keywords:['volunteer','theater','arts','performing','usher','events','community','culture'] },
];

/* ── Suggested prompts ────────────────────────────────────────── */
const PROMPTS = [
  { icon:'🌴', label:'Things to do this weekend',    query:'things to do weekend' },
  { icon:'🗺', label:'Tours & activities',            query:'tours activities sightseeing' },
  { icon:'🎟', label:'Deals & discounts',             query:'deals discounts save' },
  { icon:'📅', label:"What's happening tonight",     query:'events tonight calendar' },
  { icon:'🎨', label:'Museums & culture',             query:'museum culture arts history' },
  { icon:'🤝', label:'Volunteer opportunities',       query:'volunteer' },
  { icon:'🌿', label:'Parks & outdoor',              query:'park outdoor nature waterfront' },
  { icon:'💰', label:'Free & cheap activities',       query:'free cheap affordable' },
];

/* ── DOM ──────────────────────────────────────────────────────── */
const chatHistory  = document.getElementById('chat-history');
const chatInput    = document.getElementById('chat-input');
const sendBtn      = document.getElementById('send-btn');
const promptsGrid  = document.getElementById('prompts-grid');

/* ── Helpers ──────────────────────────────────────────────────── */
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function search(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = _DB.map(item => {
    let score = 0;
    terms.forEach(t => {
      if (item.name.toLowerCase().includes(t))       score += 4;
      if (item.sub.toLowerCase().includes(t))        score += 3;
      if (item.cat.toLowerCase().includes(t))        score += 2;
      if (item.keywords.some(k => k.includes(t)))    score += 2;
      if (item.keywords.some(k => t.includes(k)))    score += 1;
    });
    return { item, score };
  }).filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score);
  return scored.map(x => x.item);
}

/* ── Render result cards ──────────────────────────────────────── */
function renderResults(results, query) {
  if (results.length === 0) {
    return `<div class="no-results">
      <div class="nr-icon">🔍</div>
      <p>No matches for <strong>"${escHtml(query)}"</strong>.<br>
      Try different keywords like "tours", "museum", or "volunteer".</p>
    </div>`;
  }

  const cards = results.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer"
       class="result-card" aria-label="${escHtml(item.name)}">
      <div class="result-card-top">
        <div class="result-card-icon">${item.icon}</div>
        <span class="result-card-arrow">↗</span>
      </div>
      <div class="result-card-name">${escHtml(item.name)}</div>
      <span class="result-card-tag">${escHtml(item.sub)}</span>
    </a>
  `).join('');

  return `<div class="results-grid">${cards}</div>`;
}

/* ── Add message to chat ──────────────────────────────────────── */
function addUserMsg(text) {
  const el = document.createElement('div');
  el.className = 'user-msg';
  el.innerHTML = `<div class="user-bubble">${escHtml(text)}</div>`;
  chatHistory.appendChild(el);
  scrollBottom();
}

function addTyping() {
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.id = 'typing';
  el.innerHTML = `
    <div class="bot-avatar">🌴</div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>`;
  chatHistory.appendChild(el);
  scrollBottom();
  return el;
}

function removeTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

function addBotResponse(query, results) {
  const intro = results.length > 0
    ? `Found <strong>${results.length}</strong> match${results.length > 1 ? 'es' : ''} for <em>"${escHtml(query)}"</em> — tap any card to visit the site:`
    : `Here's what I found:`;

  const el = document.createElement('div');
  el.className = 'bot-response';
  el.innerHTML = `
    <div class="bot-avatar">🌴</div>
    <div class="response-body">
      <p class="response-intro">${intro}</p>
      ${renderResults(results, query)}
    </div>`;
  chatHistory.appendChild(el);
  scrollBottom();
}

function scrollBottom() {
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
}

/* ── Handle a query ───────────────────────────────────────────── */
function handleQuery(query) {
  query = query.trim();
  if (!query) return;

  addUserMsg(query);
  chatInput.value = '';
  sendBtn.disabled = true;

  const typing = addTyping();

  setTimeout(() => {
    removeTyping();
    const results = search(query);
    addBotResponse(query, results);
    sendBtn.disabled = false;
    chatInput.focus();
  }, 600);
}

/* ── Build prompt tiles ───────────────────────────────────────── */
function buildPrompts() {
  promptsGrid.innerHTML = PROMPTS.map(p => `
    <button class="prompt-btn" data-query="${escHtml(p.query)}">
      <span class="p-icon">${p.icon}</span>
      <span>${escHtml(p.label)}</span>
    </button>
  `).join('');

  promptsGrid.querySelectorAll('.prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleQuery(btn.dataset.query);
      // Scroll past prompts to chat history
      chatHistory.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Events ───────────────────────────────────────────────────── */
sendBtn.addEventListener('click', () => handleQuery(chatInput.value));

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleQuery(chatInput.value);
  }
});

chatInput.addEventListener('input', () => {
  sendBtn.disabled = chatInput.value.trim().length === 0;
});

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildPrompts();
  sendBtn.disabled = true;
});
