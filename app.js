/* ── Tampa City Guide — Chat App (Phase 3: Gemini AI) ─────────── */

/* ── Local fallback DB (used if API unreachable) ──────────────── */
const _FALLBACK_DB = [
  { name:'Curtis Hixon Waterfront Park',        url:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon',      sub:'City Parks',             icon:'🌿', kw:['park','outdoor','waterfront','family','kids','free','nature','walk'] },
  { name:'Florida State Parks',                  url:'https://www.floridastateparks.org/experiences-amenities',                     sub:'City Parks',             icon:'🌿', kw:['park','nature','hike','camping','outdoor','family','wildlife','beach','trail'] },
  { name:'Tampa.gov — Things To Do',             url:'https://www.tampa.gov/info/things-to-do',                                     sub:'City Resources',         icon:'🏛', kw:['city','government','guide','official'] },
  { name:'Tampa Downtown Partnership',           url:'https://www.tampasdowntown.com/community-events/',                            sub:'City Resources',         icon:'🏛', kw:['downtown','community','events','local'] },
  { name:'Benchmark International Arena',        url:'https://www.benchmarkintlarena.com/events',                                   sub:'Entertainment & Sports', icon:'🏟', kw:['arena','concerts','sports','hockey','tickets','live','music'] },
  { name:'Tampa Convention Center',              url:'https://www.tampa.gov/tcc/area-attractions',                                  sub:'Entertainment & Sports', icon:'🏟', kw:['convention','events','conference','attractions'] },
  { name:'Ybor Museum',                          url:'https://www.ybormuseum.org/events-programs',                                  sub:'Museums / Culture',      icon:'🎨', kw:['museum','history','ybor','culture','cuban','cigar','heritage','arts'] },
  { name:'Tampa Bay History Center',             url:'https://tampabayhistorycenter.org/events/',                                   sub:'Museums / Culture',      icon:'🎨', kw:['museum','history','heritage','culture','exhibits','family','kids'] },
  { name:'Tampa Fire Fighters Museum',           url:'https://www.tampafirefightersmuseum.org/',                                    sub:'Museums / Culture',      icon:'🎨', kw:['museum','fire','firefighter','history','kids','family'] },
  { name:'Tampa Museum of Art',                  url:'https://tampamuseum.org/',                                                    sub:'Museums / Culture',      icon:'🎨', kw:['museum','art','culture','exhibits','gallery','waterfront'] },
  { name:'Get Your Guide',                       url:'https://www.getyourguide.com/tampa-l1187/',                                   sub:'Tourism & Activities',   icon:'🗺', kw:['tours','activities','guided','golf cart','boat','kayak','sightseeing','adventure','outdoor','fun'] },
  { name:'Local City Guides',                    url:'https://www.localcityguides.com/en/tampa/activities/all-activities',          sub:'Tourism & Activities',   icon:'🗺', kw:['tours','activities','local','guide','sightseeing','things to do'] },
  { name:'TripAdvisor',                          url:'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html',sub:'Tourism & Activities',   icon:'🗺', kw:['tours','activities','restaurants','hotels','reviews','attractions'] },
  { name:'Viator',                               url:'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836',          sub:'Tourism & Activities',   icon:'🗺', kw:['tours','activities','booking','guided','golf cart','boat','kayak','adventure'] },
  { name:'Visit Florida',                        url:'https://www.visitflorida.com/places-to-go/central-west/tampa/',              sub:'Tourism & Activities',   icon:'🗺', kw:['tourism','florida','travel','beaches','attractions','vacation'] },
  { name:'Visit Tampa Bay',                      url:'https://www.visittampabay.com/things-to-do/tours/',                          sub:'Tourism & Activities',   icon:'🗺', kw:['tours','tampa','bay','tourism','activities','official','visitor','golf cart'] },
  { name:'Meetup',                               url:'https://www.meetup.com/find/?location=us--fl--Tampa',                        sub:'Community',              icon:'🤝', kw:['community','meetup','social','groups','networking','events','local'] },
  { name:'Tampa Entertainment Guide',            url:'https://tampa-bay.events/',                                                   sub:'Media Platforms',        icon:'📰', kw:['events','entertainment','guide','nightlife','shows','concerts','weekend'] },
  { name:'83 Degrees',                           url:'https://83degreesmedia.com/place/tampa/',                                    sub:'Media Platforms',        icon:'📰', kw:['media','news','local','arts','culture','events'] },
  { name:'Tampa.gov — Events',                   url:'https://www.tampa.gov/guide/tampa-events',                                   sub:'City & Government',      icon:'🏛', kw:['events','city','government','calendar','official','weekend'] },
  { name:'Tampa.gov — Arts & Nightlife',         url:'https://www.tampa.gov/guide/tampa-events#section-20466',                    sub:'City & Government',      icon:'🏛', kw:['arts','nightlife','bars','music','entertainment','weekend','night out'] },
  { name:'The Tampa Riverwalk',                  url:'https://thetampariverwalk.com/events/event-calendar.html',                  sub:'City & Government',      icon:'🌊', kw:['riverwalk','waterfront','events','outdoor','family','free','weekend'] },
  { name:'Straz Center',                         url:'https://www.strazcenter.org/calendar/',                                     sub:'Venues & Attractions',   icon:'🎭', kw:['theater','performing arts','shows','broadway','concerts','tickets','culture'] },
  { name:'Armature Works',                       url:'https://www.armatureworks.com/all-events/',                                  sub:'Venues & Attractions',   icon:'🏗', kw:['events','food','market','nightlife','waterfront','weekend'] },
  { name:"That's So Tampa",                     url:'https://thatssotampa.com/events/map/',                                       sub:'Local Media',            icon:'📍', kw:['events','local','guide','map','things to do','weekend','nightlife'] },
  { name:'Patch — South Tampa',                  url:'https://patch.com/florida/southtampa/calendar',                             sub:'Local Media',            icon:'📰', kw:['local','news','events','calendar','community'] },
  { name:'Creative Loafing Tampa',               url:'https://community.cltampa.com/tampa/EventSearch?neighborhoodGroup=12315336&sortType=date&v=d', sub:'Local Media', icon:'📰', kw:['arts','culture','events','music','food','nightlife','weekend'] },
  { name:'Facebook Events',                      url:'https://www.facebook.com/events',                                           sub:'Community',              icon:'👥', kw:['events','social','community','local','parties','meetups'] },
  { name:'Visit Tampa Bay — Events',             url:'https://www.visittampabay.com/tampa-events/',                               sub:'Tourism & Visitor',      icon:'🌴', kw:['events','tourism','visitor','official','calendar','weekend'] },
  { name:'Discover in Town',                     url:'https://www.discoverintown.com/default.aspx?redirect=/contentManaged/BL-LandingPage/BL-LandingPage.aspx', sub:'Tourism & Visitor', icon:'🗺', kw:['events','discover','local','guide','things to do'] },
  { name:'LivingSocial',                         url:'https://www.livingsocial.com/local/tampa/sightseeing-and-tours?page=3',     sub:'Savings Platforms',      icon:'💰', kw:['deals','discounts','coupons','savings','tours','cheap','affordable'] },
  { name:'Groupon',                              url:'https://www.groupon.com/local/tampa/sightseeing-and-tours',                 sub:'Savings Platforms',      icon:'💰', kw:['deals','discounts','groupon','tours','save','cheap','affordable','restaurants'] },
  { name:'CityPASS Tampa',                       url:'https://www.citypass.com/tampa',                                           sub:'Savings Platforms',      icon:'🎟', kw:['deals','pass','attractions','discount','save','family','bundle','tickets'] },
  { name:'Discover Downtown Tampa',              url:'https://tampa.discoverdowntown.com/default.aspx?redirect=/specialOffers/specialOffers.aspx', sub:'Visitor Info', icon:'🏙', kw:['deals','downtown','offers','discounts','restaurants','shopping'] },
  { name:'Visit Tampa Bay — Unlock Deals',       url:'https://www.visittampabay.com/unlock-deals/',                              sub:'Visitor Info',           icon:'🌴', kw:['deals','discounts','offers','savings','tourism','official'] },
  { name:'Tampa.gov — Downtown Guide',           url:'https://www.tampa.gov/guide/downtown-tampa',                               sub:'Directories',            icon:'📍', kw:['guide','downtown','directory','official','map','neighborhoods'] },
  { name:'Tampa Downtown Partnership — Places',  url:'https://www.tampasdowntown.com/place_category/featured/?place_category=&orderby=post_title&post_type=place', sub:'Directories', icon:'📍', kw:['directory','places','downtown','restaurants','shops','businesses','map','guide'] },
  { name:'Tampa.gov — City Projects',            url:'https://www.tampa.gov/project',                                            sub:'City Government',        icon:'🏗', kw:['projects','development','construction','city','government','infrastructure'] },
  { name:'Keep Tampa Bay Beautiful',             url:'https://www.keeptampabaybeautiful.org/',                                   sub:'Environmental',          icon:'🌿', kw:['volunteer','environment','conservation','clean','beach','community','bay'] },
  { name:'Keep Tampa Bay Beautiful — Volunteer', url:'https://www.keeptampabaybeautiful.org/become-a-volunteer',                 sub:'Environmental',          icon:'🌿', kw:['volunteer','sign up','environment','conservation','cleanup','community'] },
  { name:'The Tampa Riverwalk — How to Help',    url:'https://thetampariverwalk.com/how-to-help/donate.html',                   sub:'Environmental',          icon:'🌊', kw:['volunteer','donate','help','riverwalk','conservation','waterfront'] },
  { name:'The Florida Aquarium — Volunteer',     url:'https://www.flaquarium.org/gift-give/volunteer/',                         sub:'Cultural',               icon:'🐠', kw:['volunteer','aquarium','marine','animals','conservation','kids','family'] },
  { name:'Tampa Bay History Center — Volunteer', url:'https://tampabayhistorycenter.org/volunteer/',                            sub:'Cultural',               icon:'🏛', kw:['volunteer','museum','history','education','culture','community'] },
  { name:'Straz Center — Volunteer',             url:'https://www.strazcenter.org/about-us/volunteer-opportunities/',           sub:'Cultural',               icon:'🎭', kw:['volunteer','theater','arts','performing','usher','events','community'] },
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

/* ── Local keyword fallback (when API is unavailable) ─────────── */
function localSearch(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return _FALLBACK_DB.map(item => {
    let score = 0;
    terms.forEach(t => {
      if (item.name.toLowerCase().includes(t))        score += 4;
      if (item.sub.toLowerCase().includes(t))         score += 3;
      if (item.kw.some(k => k.includes(t)))           score += 2;
      if (item.kw.some(k => t.includes(k)))           score += 1;
    });
    return { item, score };
  }).filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 8)
    .map(x => ({ name: x.item.name, url: x.item.url, sub: x.item.sub, icon: x.item.icon }));
}

/* ── API call to Gemini serverless function ───────────────────── */
async function aiSearch(query) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { reply: data.reply || null, links: data.links || [] };
  } catch (err) {
    console.warn('AI search unavailable, using local fallback:', err.message);
    return { reply: null, links: localSearch(query) };
  }
}

/* ── Render result cards ──────────────────────────────────────── */
function renderResults(links, query) {
  if (links.length === 0) {
    return `<div class="no-results">
      <div class="nr-icon">🔍</div>
      <p>No matches for <strong>"${escHtml(query)}"</strong>.<br>
      Try keywords like "tours", "museum", "volunteer", or "deals".</p>
    </div>`;
  }
  const cards = links.map(item => `
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

/* ── Chat message builders ────────────────────────────────────── */
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
    <div class="typing-dots"><span></span><span></span><span></span></div>`;
  chatHistory.appendChild(el);
  scrollBottom();
}

function removeTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

function addBotResponse(query, reply, links) {
  const introHtml = reply
    ? `<p class="response-intro ai-reply">${escHtml(reply)}</p>
       ${links.length > 0 ? `<p class="response-intro" style="margin-bottom:10px;font-size:.8rem;">Here are the best resources for you — tap any card to visit:</p>` : ''}`
    : links.length > 0
      ? `<p class="response-intro">Found <strong>${links.length}</strong> result${links.length > 1 ? 's' : ''} for <em>"${escHtml(query)}"</em> — tap any card to visit:</p>`
      : '';

  const el = document.createElement('div');
  el.className = 'bot-response';
  el.innerHTML = `
    <div class="bot-avatar">🌴</div>
    <div class="response-body">
      ${introHtml}
      ${renderResults(links, query)}
    </div>`;
  chatHistory.appendChild(el);
  scrollBottom();
}

function scrollBottom() {
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
}

/* ── Handle query ─────────────────────────────────────────────── */
async function handleQuery(query) {
  query = query.trim();
  if (!query) return;

  addUserMsg(query);
  chatInput.value = '';
  sendBtn.disabled = true;
  addTyping();

  const { reply, links } = await aiSearch(query);

  removeTyping();
  addBotResponse(query, reply, links);
  sendBtn.disabled = false;
  chatInput.focus();
}

/* ── Prompt tiles ─────────────────────────────────────────────── */
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
      chatHistory.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Events ───────────────────────────────────────────────────── */
sendBtn.addEventListener('click', () => handleQuery(chatInput.value));
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery(chatInput.value); }
});
chatInput.addEventListener('input', () => {
  sendBtn.disabled = chatInput.value.trim().length === 0;
});

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildPrompts();
  sendBtn.disabled = true;
});
