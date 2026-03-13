// api/chat.js — Vercel Serverless Function
// Receives a user query, sends it to Gemini with the curated DB as context,
// returns a conversational reply + matched link objects.

const DB = [
  { name:'Curtis Hixon Waterfront Park',        url:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon',                                                              cat:'Things To Do', sub:'City Parks',             icon:'🌿', kw:'park outdoor waterfront riverwalk family kids free picnic nature walk' },
  { name:'Florida State Parks',                  url:'https://www.floridastateparks.org/experiences-amenities',                                                                             cat:'Things To Do', sub:'City Parks',             icon:'🌿', kw:'park nature hike camping outdoor state family wildlife beach trail' },
  { name:'Tampa.gov — Things To Do',             url:'https://www.tampa.gov/info/things-to-do',                                                                                             cat:'Things To Do', sub:'City Resources',         icon:'🏛', kw:'city government guide resources official information' },
  { name:'Tampa Downtown Partnership',           url:'https://www.tampasdowntown.com/community-events/',                                                                                    cat:'Things To Do', sub:'City Resources',         icon:'🏛', kw:'downtown community events local partnership business' },
  { name:'Benchmark International Arena',        url:'https://www.benchmarkintlarena.com/events',                                                                                           cat:'Things To Do', sub:'Entertainment & Sports', icon:'🏟', kw:'arena concerts sports hockey lightning events live music shows tickets' },
  { name:'Tampa Convention Center',              url:'https://www.tampa.gov/tcc/area-attractions',                                                                                          cat:'Things To Do', sub:'Entertainment & Sports', icon:'🏟', kw:'convention events conference attractions waterfront shows' },
  { name:'Ybor Museum',                          url:'https://www.ybormuseum.org/events-programs',                                                                                          cat:'Things To Do', sub:'Museums / Culture',      icon:'🎨', kw:'museum history ybor culture cuban cigar heritage arts' },
  { name:'Tampa Bay History Center',             url:'https://tampabayhistorycenter.org/events/',                                                                                           cat:'Things To Do', sub:'Museums / Culture',      icon:'🎨', kw:'museum history heritage culture exhibits family kids education' },
  { name:'Tampa Fire Fighters Museum',           url:'https://www.tampafirefightersmuseum.org/',                                                                                            cat:'Things To Do', sub:'Museums / Culture',      icon:'🎨', kw:'museum fire firefighter history kids family education' },
  { name:'Tampa Museum of Art',                  url:'https://tampamuseum.org/',                                                                                                            cat:'Things To Do', sub:'Museums / Culture',      icon:'🎨', kw:'museum art culture exhibits gallery waterfront events' },
  { name:'Get Your Guide',                       url:'https://www.getyourguide.com/tampa-l1187/',                                                                                           cat:'Things To Do', sub:'Tourism & Activities',   icon:'🗺', kw:'tours activities guided tickets golf cart boat kayak sightseeing adventure outdoor fun day trip excursion' },
  { name:'Local City Guides',                    url:'https://www.localcityguides.com/en/tampa/activities/all-activities',                                                                  cat:'Things To Do', sub:'Tourism & Activities',   icon:'🗺', kw:'tours activities local guide sightseeing things to do attractions' },
  { name:'TripAdvisor',                          url:'https://www.tripadvisor.com/Attractions-g34678-Activities-Tampa_Florida.html',                                                       cat:'Things To Do', sub:'Tourism & Activities',   icon:'🗺', kw:'tours activities restaurants hotels reviews attractions sightseeing things to do' },
  { name:'Viator',                               url:'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836',                                                                  cat:'Things To Do', sub:'Tourism & Activities',   icon:'🗺', kw:'tours activities booking guided excursion sightseeing golf cart boat kayak adventure' },
  { name:'Visit Florida',                        url:'https://www.visitflorida.com/places-to-go/central-west/tampa/',                                                                      cat:'Things To Do', sub:'Tourism & Activities',   icon:'🗺', kw:'tourism florida travel things to do beaches attractions visit vacation' },
  { name:'Visit Tampa Bay',                      url:'https://www.visittampabay.com/things-to-do/tours/',                                                                                  cat:'Things To Do', sub:'Tourism & Activities',   icon:'🗺', kw:'tours tampa bay tourism activities sightseeing official visitor things to do golf cart boat kayak' },
  { name:'Meetup',                               url:'https://www.meetup.com/find/?location=us--fl--Tampa',                                                                                cat:'Things To Do', sub:'Community',              icon:'🤝', kw:'community meetup social groups networking events local people friends' },
  { name:'Tampa Entertainment Guide',            url:'https://tampa-bay.events/',                                                                                                           cat:'Things To Do', sub:'Media Platforms',        icon:'📰', kw:'events entertainment guide nightlife shows concerts things to do weekend' },
  { name:'83 Degrees',                           url:'https://83degreesmedia.com/place/tampa/',                                                                                            cat:'Things To Do', sub:'Media Platforms',        icon:'📰', kw:'media news local things to do arts culture innovation events' },
  { name:'Tampa.gov — Events',                   url:'https://www.tampa.gov/guide/tampa-events',                                                                                           cat:'Events Calendar', sub:'City & Government',            icon:'🏛', kw:'events city government calendar official things to do weekend' },
  { name:'Tampa.gov — Arts & Nightlife',         url:'https://www.tampa.gov/guide/tampa-events#section-20466',                                                                             cat:'Events Calendar', sub:'City & Government',            icon:'🏛', kw:'arts nightlife bars music entertainment events weekend night out' },
  { name:'The Tampa Riverwalk',                  url:'https://thetampariverwalk.com/events/event-calendar.html',                                                                           cat:'Events Calendar', sub:'City & Government',            icon:'🌊', kw:'riverwalk waterfront events outdoor family free weekend walk park' },
  { name:'Straz Center',                         url:'https://www.strazcenter.org/calendar/',                                                                                              cat:'Events Calendar', sub:'Venues & Attractions',         icon:'🎭', kw:'theater performing arts shows broadway concerts events tickets culture' },
  { name:'Armature Works',                       url:'https://www.armatureworks.com/all-events/',                                                                                          cat:'Events Calendar', sub:'Venues & Attractions',         icon:'🏗', kw:'events food market nightlife waterfront social weekend fun' },
  { name:"That's So Tampa",                     url:'https://thatssotampa.com/events/map/',                                                                                               cat:'Events Calendar', sub:'Local Media & Community',      icon:'📍', kw:'events local guide map things to do weekend entertainment nightlife' },
  { name:'Patch — South Tampa',                  url:'https://patch.com/florida/southtampa/calendar',                                                                                     cat:'Events Calendar', sub:'Local Media & Community',      icon:'📰', kw:'local news events calendar south tampa community things to do' },
  { name:'Creative Loafing Tampa',               url:'https://community.cltampa.com/tampa/EventSearch?neighborhoodGroup=12315336&sortType=date&v=d',                                       cat:'Events Calendar', sub:'Local Media & Community',      icon:'📰', kw:'arts culture events music food nightlife weekend local guide' },
  { name:'Facebook Events',                      url:'https://www.facebook.com/events',                                                                                                   cat:'Events Calendar', sub:'Local Media & Community',      icon:'👥', kw:'events social community local parties meetups entertainment' },
  { name:'Visit Tampa Bay — Events',             url:'https://www.visittampabay.com/tampa-events/',                                                                                       cat:'Events Calendar', sub:'Tourism & Visitor Resources',  icon:'🌴', kw:'events tourism visitor official things to do calendar weekend tampa bay' },
  { name:'Discover in Town',                     url:'https://www.discoverintown.com/default.aspx?redirect=/contentManaged/BL-LandingPage/BL-LandingPage.aspx',                           cat:'Events Calendar', sub:'Tourism & Visitor Resources',  icon:'🗺', kw:'events discover local guide things to do calendar' },
  { name:'LivingSocial',                         url:'https://www.livingsocial.com/local/tampa/sightseeing-and-tours?page=3',                                                             cat:'Deals & Discounts', sub:'Savings Platforms',     icon:'💰', kw:'deals discounts coupons savings tours sightseeing cheap affordable' },
  { name:'Groupon',                              url:'https://www.groupon.com/local/tampa/sightseeing-and-tours',                                                                         cat:'Deals & Discounts', sub:'Savings Platforms',     icon:'💰', kw:'deals discounts coupons groupon tours sightseeing save cheap affordable restaurants' },
  { name:'CityPASS Tampa',                       url:'https://www.citypass.com/tampa',                                                                                                   cat:'Deals & Discounts', sub:'Savings Platforms',     icon:'🎟', kw:'deals pass attractions discount save family bundle tickets aquarium zoo busch gardens' },
  { name:'Discover Downtown Tampa',              url:'https://tampa.discoverdowntown.com/default.aspx?redirect=/specialOffers/specialOffers.aspx',                                        cat:'Deals & Discounts', sub:'Tourism & Visitor Info', icon:'🏙', kw:'deals downtown offers discounts restaurants shopping attractions' },
  { name:'Visit Tampa Bay — Unlock Deals',       url:'https://www.visittampabay.com/unlock-deals/',                                                                                      cat:'Deals & Discounts', sub:'Tourism & Visitor Info', icon:'🌴', kw:'deals discounts offers savings tourism visitor official tampa bay' },
  { name:'Tampa.gov — Downtown Guide',           url:'https://www.tampa.gov/guide/downtown-tampa',                                                                                        cat:'Digital Guides', sub:'Directories',   icon:'📍', kw:'guide downtown directory official map neighborhoods things to do city' },
  { name:'Tampa Downtown Partnership — Places',  url:'https://www.tampasdowntown.com/place_category/featured/?place_category=&orderby=post_title&post_type=place',                       cat:'Digital Guides', sub:'Directories',   icon:'📍', kw:'directory places downtown restaurants shops businesses map guide' },
  { name:'Tampa.gov — City Projects',            url:'https://www.tampa.gov/project',                                                                                                    cat:'City Projects', sub:'City Government',icon:'🏗', kw:'projects development construction city government infrastructure plans zoning' },
  { name:'Keep Tampa Bay Beautiful',             url:'https://www.keeptampabaybeautiful.org/',                                                                                           cat:'Volunteer', sub:'Environmental', icon:'🌿', kw:'volunteer environment conservation clean beach community service bay' },
  { name:'Keep Tampa Bay Beautiful — Volunteer', url:'https://www.keeptampabaybeautiful.org/become-a-volunteer',                                                                         cat:'Volunteer', sub:'Environmental', icon:'🌿', kw:'volunteer sign up environment conservation cleanup community service' },
  { name:'The Tampa Riverwalk — How to Help',    url:'https://thetampariverwalk.com/how-to-help/donate.html',                                                                            cat:'Volunteer', sub:'Environmental', icon:'🌊', kw:'volunteer donate help riverwalk conservation community waterfront' },
  { name:'The Florida Aquarium — Volunteer',     url:'https://www.flaquarium.org/gift-give/volunteer/',                                                                                  cat:'Volunteer', sub:'Cultural',      icon:'🐠', kw:'volunteer aquarium marine education animals conservation kids family' },
  { name:'Tampa Bay History Center — Volunteer', url:'https://tampabayhistorycenter.org/volunteer/',                                                                                     cat:'Volunteer', sub:'Cultural',      icon:'🏛', kw:'volunteer museum history education culture community service' },
  { name:'Straz Center — Volunteer',             url:'https://www.strazcenter.org/about-us/volunteer-opportunities/',                                                                    cat:'Volunteer', sub:'Cultural',      icon:'🎭', kw:'volunteer theater arts performing usher events community culture' },
];

const DB_CONTEXT = DB.map((d,i) =>
  `[${i}] ${d.name} (${d.cat} › ${d.sub}) — keywords: ${d.kw}`
).join('\n');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Missing query' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback: simple keyword search when no API key configured
    return res.status(200).json({
      reply: null,
      links: fallbackSearch(query),
    });
  }

  const prompt = `You are a helpful Tampa Bay, Florida city guide assistant.
A visitor asked: "${query.trim()}"

Below is your curated database of Tampa resources (index: name, category, subcategory, keywords):
${DB_CONTEXT}

Your task:
1. Write a short, warm, 1-2 sentence conversational reply that acknowledges what they're looking for.
2. Select the most relevant resource indices (max 8) from the database above.

Respond ONLY with valid JSON in this exact format (no markdown, no code block):
{"reply":"Your conversational sentence here.","indices":[0,1,2]}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini ${geminiRes.status}: ${errBody}`);
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const links = (parsed.indices || [])
      .filter(i => i >= 0 && i < DB.length)
      .map(i => ({ name: DB[i].name, url: DB[i].url, sub: DB[i].sub, icon: DB[i].icon }));

    return res.status(200).json({ reply: parsed.reply || null, links });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    // Return error details temporarily for debugging
    return res.status(200).json({ reply: null, links: fallbackSearch(query), _debug: err.message });
  }
}

function fallbackSearch(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return DB.map(item => {
    let score = 0;
    terms.forEach(t => {
      if (item.name.toLowerCase().includes(t)) score += 4;
      if (item.sub.toLowerCase().includes(t))  score += 3;
      if (item.kw.includes(t))                 score += 2;
    });
    return { item, score };
  })
  .filter(x => x.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)
  .map(x => ({ name: x.item.name, url: x.item.url, sub: x.item.sub, icon: x.item.icon }));
}
