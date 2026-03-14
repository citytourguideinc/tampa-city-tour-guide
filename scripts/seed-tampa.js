// scripts/seed-tampa.js — Run once to populate Supabase with Tampa data
// Usage: node scripts/seed-tampa.js
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ACTIVITIES = [
  // ── Things To Do ──────────────────────────────────────────────
  { activity_name:'Curtis Hixon Waterfront Park', category:'Things To Do', neighborhood:'Downtown', icon:'🌿', official_link:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon', short_summary:'Scenic waterfront park with festivals, events, and great Hillsborough River views.', source_type:'curated', source_name:'Official', lat:27.9472, lng:-82.4626 },
  { activity_name:'Florida State Parks', category:'Things To Do', neighborhood:'City-wide', icon:'🌿', official_link:'https://www.floridastateparks.org/experiences-amenities', short_summary:'Hike, camp, kayak, and explore Florida\'s stunning state parks near Tampa Bay.', source_type:'curated', source_name:'Official' },
  { activity_name:'Tampa Museum of Art', category:'Things To Do', neighborhood:'Downtown', icon:'🎨', official_link:'https://tampamuseum.org/', short_summary:'World-class contemporary and classical art beside the Hillsborough River.', source_type:'curated', source_name:'Official', lat:27.9481, lng:-82.4601 },
  { activity_name:'Tampa Bay History Center', category:'Things To Do', neighborhood:'Channelside', icon:'🏛', official_link:'https://tampabayhistorycenter.org/events/', short_summary:'Immersive exhibits spanning thousands of years of Tampa Bay history.', source_type:'curated', source_name:'Official', lat:27.9435, lng:-82.4549 },
  { activity_name:'Ybor City Historic District', category:'Things To Do', neighborhood:'Ybor City', icon:'🏗', official_link:'https://www.ybormuseum.org/events-programs', short_summary:'Tampa\'s iconic cigar-rolling district — history, nightlife, and Cuban cuisine.', source_type:'curated', source_name:'Official', lat:27.9609, lng:-82.4386 },
  { activity_name:'Tampa Fire Fighters Museum', category:'Things To Do', neighborhood:'Downtown', icon:'🚒', official_link:'https://www.tampafirefightersmuseum.org/', short_summary:'Fascinating history of Tampa\'s fire service with vintage equipment and exhibits.', source_type:'curated', source_name:'Official' },
  { activity_name:'Benchmark International Arena', category:'Things To Do', neighborhood:'Channelside', icon:'🏟', official_link:'https://www.benchmarkintlarena.com/events', short_summary:'Home of the Tampa Bay Lightning — catch a hockey game or major concert.', source_type:'curated', source_name:'Official', lat:27.9428, lng:-82.4519 },
  { activity_name:'Straz Center Performances', category:'Things To Do', neighborhood:'Downtown', icon:'🎭', official_link:'https://www.strazcenter.org/calendar/', short_summary:'World-class Broadway shows, concerts, and performing arts on the Riverwalk.', source_type:'curated', source_name:'Official', lat:27.9490, lng:-82.4596 },
  { activity_name:'Armature Works', category:'Things To Do', neighborhood:'Heights', icon:'🍽', official_link:'https://www.armatureworks.com/all-events/', short_summary:'Stunning waterfront food hall with craft cocktails, events, and city views.', source_type:'curated', source_name:'Official', lat:27.9598, lng:-82.4649 },
  { activity_name:'The Florida Aquarium', category:'Things To Do', neighborhood:'Channelside', icon:'🐠', official_link:'https://www.flaquarium.org', short_summary:'Tampa\'s premier aquarium with marine life, dive shows, and volunteer opportunities.', source_type:'curated', source_name:'Official', lat:27.9416, lng:-82.4499 },
  // ── Tours ─────────────────────────────────────────────────────
  { activity_name:'Tampa Golf Cart Tours', category:'Tours & Activities', neighborhood:'Ybor City', icon:'🚗', booking_link:'https://www.getyourguide.com/tampa-l1187/', short_summary:'Explore Tampa and Ybor City on a fun, narrated golf cart tour — a local favourite.', source_type:'affiliate', source_name:'GetYourGuide', lat:27.9609, lng:-82.4386 },
  { activity_name:'Tampa Bay Boat Tours', category:'Tours & Activities', neighborhood:'Waterfront', icon:'⛵', booking_link:'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836', short_summary:'Cruise Tampa Bay on a scenic boat tour — dolphins, skyline, and waterfront views.', source_type:'affiliate', source_name:'Viator' },
  { activity_name:'Viator Tampa Activities', category:'Tours & Activities', neighborhood:'City-wide', icon:'🗺', booking_link:'https://www.viator.com/Tampa-tourism/d666-r47106901905-s954938836', short_summary:'Book guided tours, day trips, and unique experiences across Tampa Bay.', source_type:'affiliate', source_name:'Viator' },
  { activity_name:'GetYourGuide Tampa', category:'Tours & Activities', neighborhood:'City-wide', icon:'🗺', booking_link:'https://www.getyourguide.com/tampa-l1187/', short_summary:'Hundreds of Tampa tours and activities — golf carts, kayaks, food tours, and more.', source_type:'affiliate', source_name:'GetYourGuide' },
  { activity_name:'Visit Tampa Bay Tours', category:'Tours & Activities', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.visittampabay.com/things-to-do/tours/', short_summary:'Official visitor guide to Tampa Bay tours — from water adventures to cultural walks.', source_type:'curated', source_name:'Official' },
  // ── Events ────────────────────────────────────────────────────
  { activity_name:'The Tampa Riverwalk Events', category:'Events Calendar', neighborhood:'Downtown', icon:'🌊', official_link:'https://thetampariverwalk.com/events/event-calendar.html', short_summary:'Free outdoor events along the beautiful 2.6-mile Tampa Riverwalk.', source_type:'curated', source_name:'Official', lat:27.9476, lng:-82.4620 },
  { activity_name:'Armature Works Events', category:'Events Calendar', neighborhood:'Heights', icon:'🎪', official_link:'https://www.armatureworks.com/all-events/', short_summary:'Vibrant events, markets, and pop-ups at Tampa\'s coolest waterfront venue.', source_type:'curated', source_name:'Official', lat:27.9598, lng:-82.4649 },
  { activity_name:'That\'s So Tampa Events', category:'Events Calendar', neighborhood:'City-wide', icon:'📍', official_link:'https://thatssotampa.com/events/map/', short_summary:'Tampa\'s go-to local events map — music, food, art, and nightlife all week.', source_type:'curated', source_name:'Local Media' },
  { activity_name:'Creative Loafing Tampa', category:'Events Calendar', neighborhood:'City-wide', icon:'📰', official_link:'https://community.cltampa.com/tampa/EventSearch?neighborhoodGroup=12315336&sortType=date&v=d', short_summary:'Arts, culture, events, music, food, and nightlife from Tampa\'s best alternative weekly.', source_type:'curated', source_name:'Local Media' },
  { activity_name:'Visit Tampa Bay Events', category:'Events Calendar', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.visittampabay.com/tampa-events/', short_summary:'Official Tampa Bay events calendar — concerts, festivals, sports, and more.', source_type:'curated', source_name:'Official' },
  // ── Deals ─────────────────────────────────────────────────────
  { activity_name:'Groupon Tampa Deals', category:'Deals & Discounts', neighborhood:'City-wide', icon:'💰', booking_link:'https://www.groupon.com/local/tampa/sightseeing-and-tours', short_summary:'Save big on Tampa Bay tours, restaurants, spas, and activities with Groupon.', source_type:'partner', source_name:'Groupon' },
  { activity_name:'LivingSocial Tampa', category:'Deals & Discounts', neighborhood:'City-wide', icon:'💰', booking_link:'https://www.livingsocial.com/local/tampa/sightseeing-and-tours?page=3', short_summary:'Discounted deals on Tampa sightseeing, food, entertainment, and experiences.', source_type:'partner', source_name:'LivingSocial' },
  { activity_name:'CityPASS Tampa', category:'Deals & Discounts', neighborhood:'City-wide', icon:'🎟', booking_link:'https://www.citypass.com/tampa', short_summary:'Save up to 55% on top Tampa attractions — aquarium, zoo, Busch Gardens, and more.', source_type:'partner', source_name:'CityPASS' },
  { activity_name:'Visit Tampa Bay Deals', category:'Deals & Discounts', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.visittampabay.com/unlock-deals/', short_summary:'Exclusive discounts and offers for Tampa Bay visitors from the official tourism board.', source_type:'curated', source_name:'Official' },
  // ── Volunteer ─────────────────────────────────────────────────
  { activity_name:'Keep Tampa Bay Beautiful', category:'Volunteer', neighborhood:'City-wide', icon:'🌿', official_link:'https://www.keeptampabaybeautiful.org/become-a-volunteer', short_summary:'Volunteer for beach cleanups, park restoration, and environmental conservation across Tampa Bay.', source_type:'curated', source_name:'Nonprofit' },
  { activity_name:'The Florida Aquarium — Volunteer', category:'Volunteer', neighborhood:'Channelside', icon:'🐠', official_link:'https://www.flaquarium.org/gift-give/volunteer/', short_summary:'Volunteer at the Florida Aquarium — assist with marine education and animal care.', source_type:'curated', source_name:'Nonprofit', lat:27.9416, lng:-82.4499 },
  { activity_name:'Straz Center — Volunteer', category:'Volunteer', neighborhood:'Downtown', icon:'🎭', official_link:'https://www.strazcenter.org/about-us/volunteer-opportunities/', short_summary:'Volunteer as an usher or event helper at Tampa\'s premier performing arts center.', source_type:'curated', source_name:'Nonprofit', lat:27.9490, lng:-82.4596 },
  { activity_name:'Tampa Bay History Center — Volunteer', category:'Volunteer', neighborhood:'Channelside', icon:'🏛', official_link:'https://tampabayhistorycenter.org/volunteer/', short_summary:'Share your passion for history by volunteering at Tampa Bay\'s premier history museum.', source_type:'curated', source_name:'Nonprofit', lat:27.9435, lng:-82.4549 },
  { activity_name:'Tampa Riverwalk — Volunteer', category:'Volunteer', neighborhood:'Downtown', icon:'🌊', official_link:'https://thetampariverwalk.com/how-to-help/donate.html', short_summary:'Help beautify and maintain the beloved Tampa Riverwalk through volunteer events.', source_type:'curated', source_name:'Nonprofit', lat:27.9476, lng:-82.4620 },
];

const TAGS = [
  { name:'family', activities:['Curtis Hixon Waterfront Park','The Florida Aquarium','Tampa Bay History Center','CityPASS Tampa','Florida State Parks'] },
  { name:'free', activities:['Curtis Hixon Waterfront Park','The Tampa Riverwalk Events','Keep Tampa Bay Beautiful'] },
  { name:'outdoor', activities:['Curtis Hixon Waterfront Park','Florida State Parks','The Tampa Riverwalk Events','Tampa Bay Boat Tours','Keep Tampa Bay Beautiful'] },
  { name:'nightlife', activities:['Ybor City Historic District','Armature Works','That\'s So Tampa Events','Creative Loafing Tampa'] },
  { name:'volunteer', activities:['Keep Tampa Bay Beautiful','The Florida Aquarium — Volunteer','Straz Center — Volunteer','Tampa Bay History Center — Volunteer','Tampa Riverwalk — Volunteer'] },
  { name:'tours', activities:['Tampa Golf Cart Tours','Tampa Bay Boat Tours','Viator Tampa Activities','GetYourGuide Tampa','Visit Tampa Bay Tours'] },
  { name:'arts', activities:['Tampa Museum of Art','Straz Center Performances','Creative Loafing Tampa','Ybor City Historic District'] },
  { name:'deals', activities:['Groupon Tampa Deals','LivingSocial Tampa','CityPASS Tampa','Visit Tampa Bay Deals'] },
  { name:'waterfront', activities:['Curtis Hixon Waterfront Park','Armature Works','Tampa Bay Boat Tours','The Tampa Riverwalk Events'] },
  { name:'history', activities:['Tampa Bay History Center','Ybor City Historic District','Tampa Fire Fighters Museum'] },
];

const TOURS = [
  { activity:'Tampa Golf Cart Tours', price_min:29, price_max:59, duration:'1-2 hours', starting_location:'Ybor City', booking_required:true },
  { activity:'Tampa Bay Boat Tours',  price_min:39, price_max:89, duration:'2 hours',   starting_location:'Tampa Waterfront', booking_required:true },
  { activity:'GetYourGuide Tampa',    price_min:15, price_max:150, duration:'Varies',   starting_location:'Various', booking_required:true },
  { activity:'Viator Tampa Activities', price_min:20, price_max:200, duration:'Varies', starting_location:'Various', booking_required:true },
  { activity:'CityPASS Tampa',        price_min:89, price_max:89,  duration:'3 days',   starting_location:'City-wide', booking_required:false },
  { activity:'Groupon Tampa Deals',   price_min:10, price_max:100, duration:'Varies',   starting_location:'Various', booking_required:false },
];

async function seed() {
  console.log('🌴 Seeding Tampa data into Supabase...\n');

  // 1. Insert activities
  const { data: inserted, error: actErr } = await supabase
    .from('activities')
    .insert(
      ACTIVITIES.map(a => ({ ...a, city:'Tampa', active_status:true }))
    )
    .select('id, activity_name');

  if (actErr) { console.error('❌ Activities error:', actErr.message); process.exit(1); }
  console.log(`✅ ${inserted.length} activities inserted`);

  const nameToId = Object.fromEntries(inserted.map(a => [a.activity_name, a.id]));

  // 2. Insert tags + activity_tags
  for (const tag of TAGS) {
    const { data: tagRow } = await supabase
      .from('tags')
      .upsert({ tag_name: tag.name }, { onConflict:'tag_name' })
      .select('id')
      .single();
    if (!tagRow) continue;
    const pairs = tag.activities
      .map(n => nameToId[n])
      .filter(Boolean)
      .map(activity_id => ({ activity_id, tag_id: tagRow.id }));
    if (pairs.length) await supabase.from('activity_tags').upsert(pairs, { onConflict:'activity_id,tag_id' });
  }
  console.log(`✅ ${TAGS.length} tags + activity_tags inserted`);

  // 3. Insert tours
  for (const t of TOURS) {
    const activity_id = nameToId[t.activity];
    if (!activity_id) continue;
    const { activity, ...rest } = t;
    await supabase.from('tours').upsert({ ...rest, activity_id }, { onConflict:'activity_id' });
  }
  console.log(`✅ ${TOURS.length} tour pricing records inserted`);

  console.log('\n🚀 Seed complete! Tampa data is live in Supabase.');
}

seed().catch(console.error);
