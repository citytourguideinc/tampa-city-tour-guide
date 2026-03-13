// cities/miami.js — Miami city configuration (SKELETON — ready to populate)
// Activate by setting up miami.citytourguide.app subdomain in Vercel + GoDaddy

module.exports = {
  city: 'Miami',
  state: 'FL',
  emoji: '🌊',
  tagline: 'Ask me anything about Miami ✨',
  welcome: 'Hi! I\'m your <strong>Miami City Guide</strong> — here to help you discover the best of Miami.\nAsk me about tours, events, deals, museums, nightlife, or anything else you\'re looking for!',
  promptPlaceholder: 'Ask about tours, events, deals, nightlife…',
  aiContext: 'You are a helpful Miami, Florida city guide assistant.',
  db: [
    // ── TODO: populate with Miami resources ──
    // Template format:
    // { name:'', url:'', cat:'Things To Do', sub:'Tourism & Activities', icon:'🗺', kw:'tours activities miami sightseeing' },
    { name:'Visit Miami',           url:'https://www.miamiandbeaches.com/',                            cat:'Things To Do', sub:'Tourism & Activities', icon:'🌴', kw:'miami tourism travel things to do visit official beaches' },
    { name:'Miami Beach Events',    url:'https://www.miamibeach411.com/news/miami-events',              cat:'Events Calendar', sub:'Local Media',       icon:'📅', kw:'events miami beach calendar nightlife entertainment weekend' },
    { name:'Viator Miami',          url:'https://www.viator.com/Miami/d662-ttd',                       cat:'Things To Do', sub:'Tourism & Activities', icon:'🗺', kw:'tours activities miami boat kayak sightseeing guided adventure' },
    { name:'GetYourGuide Miami',    url:'https://www.getyourguide.com/miami-l179/',                    cat:'Things To Do', sub:'Tourism & Activities', icon:'🗺', kw:'tours activities miami sightseeing guided adventure boat' },
    { name:'Groupon Miami',         url:'https://www.groupon.com/local/miami',                         cat:'Deals & Discounts', sub:'Savings Platforms', icon:'💰', kw:'deals discounts groupon miami save cheap affordable restaurants' },
    { name:'Miami New Times',       url:'https://www.miaminewtimes.com/arts/best-things-to-do',        cat:'Things To Do', sub:'Media Platforms',        icon:'📰', kw:'arts culture events music food nightlife weekend local guide miami' },
  ],
};
