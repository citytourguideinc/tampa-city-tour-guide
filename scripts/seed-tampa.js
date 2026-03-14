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
  { activity_name:'Curtis Hixon Waterfront Park', category:'Things To Do', neighborhood:'Downtown', icon:'🌿', official_link:'https://www.tampa.gov/parks-and-recreation/featured-parks/curtis-hixon', short_summary:'Scenic waterfront park with festivals, events, and stunning Hillsborough River views.', source_type:'curated', source_name:'Public Resource', lat:27.9472, lng:-82.4626 },
  { activity_name:'Tampa Museum of Art', category:'Things To Do', neighborhood:'Downtown', icon:'🎨', official_link:'https://tampamuseum.org/', short_summary:'World-class contemporary and classical art beside the Hillsborough River.', source_type:'curated', source_name:'Public Resource', lat:27.9481, lng:-82.4601 },
  { activity_name:'Tampa Bay History Center', category:'Things To Do', neighborhood:'Channelside', icon:'🏛', official_link:'https://tampabayhistorycenter.org/', short_summary:'Immersive exhibits spanning thousands of years of Tampa Bay history.', source_type:'curated', source_name:'Public Resource', lat:27.9435, lng:-82.4549 },
  { activity_name:'Ybor City Historic District', category:'Things To Do', neighborhood:'Ybor City', icon:'🏗', official_link:'https://www.ybormuseum.org/', short_summary:'Tampa\'s iconic cigar-rolling district — history, nightlife, and Cuban cuisine.', source_type:'curated', source_name:'Public Resource', lat:27.9609, lng:-82.4386 },
  { activity_name:'Tampa Fire Fighters Museum', category:'Things To Do', neighborhood:'Downtown', icon:'🚒', official_link:'https://www.tampafirefightersmuseum.org/', short_summary:'Fascinating history of Tampa\'s fire service with vintage equipment and exhibits.', source_type:'curated', source_name:'Public Resource' },
  { activity_name:'Benchmark International Arena', category:'Things To Do', neighborhood:'Channelside', icon:'🏟', official_link:'https://www.benchmarkintlarena.com/events', short_summary:'Home of the Tampa Bay Lightning — catch a hockey game or major concert at this world-class arena.', source_type:'curated', source_name:'Public Resource', lat:27.9428, lng:-82.4519 },
  { activity_name:'Straz Center Performances', category:'Things To Do', neighborhood:'Downtown', icon:'🎭', official_link:'https://www.strazcenter.org/calendar/', short_summary:'World-class Broadway shows, concerts, and performing arts on the Riverwalk.', source_type:'curated', source_name:'Public Resource', lat:27.9490, lng:-82.4596 },
  { activity_name:'Armature Works', category:'Things To Do', neighborhood:'Heights', icon:'🍽', official_link:'https://www.armatureworks.com/all-events/', short_summary:'Stunning waterfront food hall, events, markets, and pop-ups at Tampa\'s coolest venue.', source_type:'curated', source_name:'Public Resource', lat:27.9598, lng:-82.4649 },
  { activity_name:'The Florida Aquarium', category:'Things To Do', neighborhood:'Channelside', icon:'🐠', official_link:'https://www.flaquarium.org', short_summary:'Tampa\'s premier aquarium with marine life, dive shows, and conservation programs.', source_type:'curated', source_name:'Public Resource', lat:27.9416, lng:-82.4499 },
  { activity_name:'ZooTampa at Lowry Park', category:'Things To Do', neighborhood:'North Tampa', icon:'🦁', official_link:'https://www.zootampa.org/', short_summary:'Award-winning zoo with 1,000+ animals, manatee exhibits, and safari experiences.', source_type:'curated', source_name:'Public Resource', lat:27.9952, lng:-82.4726 },
  { activity_name:'Busch Gardens Tampa', category:'Things To Do', neighborhood:'Temple Terrace', icon:'🎢', official_link:'https://buschgardens.com/tampa/', short_summary:'Thrilling coasters, safari animals, live entertainment, and world-class rides.', source_type:'curated', source_name:'Public Resource', lat:28.0378, lng:-82.4208 },
  { activity_name:'Henry B. Plant Museum', category:'Things To Do', neighborhood:'Downtown', icon:'🏰', official_link:'https://www.plantmuseum.com/', short_summary:'Gilded Age grandeur inside a National Historic Landmark on the UT campus.', source_type:'curated', source_name:'Public Resource', lat:27.9437, lng:-82.4654 },
  { activity_name:'Tampa Riverwalk', category:'Things To Do', neighborhood:'Downtown', icon:'🌊', official_link:'https://thetampariverwalk.com/', short_summary:'Beautiful 2.6-mile waterfront promenade linking parks, museums, restaurants, and bars.', source_type:'curated', source_name:'Public Resource', lat:27.9476, lng:-82.4620 },
  { activity_name:'Glazer Children\'s Museum', category:'Things To Do', neighborhood:'Downtown', icon:'👶', official_link:'https://www.glazermuseum.org/', short_summary:'Hands-on interactive museum for kids with 170+ exhibits across 53,000 sq ft.', source_type:'curated', source_name:'Public Resource', lat:27.9477, lng:-82.4588 },
  { activity_name:'Florida State Parks', category:'Things To Do', neighborhood:'City-wide', icon:'🌲', official_link:'https://www.floridastateparks.org/', short_summary:'Hike, camp, kayak, and explore Florida\'s stunning state parks near Tampa Bay.', source_type:'curated', source_name:'Public Resource' },
  // ── Beaches & Outdoors ────────────────────────────────────────
  { activity_name:'Clearwater Beach', category:'Beaches & Outdoors', neighborhood:'Clearwater', icon:'🏖', official_link:'https://www.visitstpeteclearwater.com/clearwater-beach', short_summary:'Consistently ranked America\'s #1 beach — white sand, crystal water, and epic sunsets.', source_type:'curated', source_name:'Public Resource', lat:27.9778, lng:-82.8275 },
  { activity_name:'St. Pete Beach', category:'Beaches & Outdoors', neighborhood:'St. Pete Beach', icon:'🌅', official_link:'https://www.visitstpeteclearwater.com/st-pete-beach', short_summary:'Seven-mile barrier island beach with colorful resorts, shops, and restaurants.', source_type:'curated', source_name:'Public Resource', lat:27.7225, lng:-82.7415 },
  { activity_name:'Caladesi Island State Park', category:'Beaches & Outdoors', neighborhood:'Dunedin', icon:'🏝', official_link:'https://www.floridastateparks.org/parks-and-trails/caladesi-island-state-park', short_summary:'Pristine undeveloped island beach accessible only by ferry — Florida at its best.', source_type:'curated', source_name:'Public Resource', lat:28.0489, lng:-82.8195 },
  { activity_name:'Hillsborough River State Park', category:'Beaches & Outdoors', neighborhood:'Thonotosassa', icon:'🚣', official_link:'https://www.floridastateparks.org/parks-and-trails/hillsborough-river-state-park', short_summary:'Kayak, canoe, swim, and hike through lush Florida wilderness just north of Tampa.', source_type:'curated', source_name:'Public Resource', lat:28.1458, lng:-82.2325 },
  { activity_name:'Ballast Point Park', category:'Beaches & Outdoors', neighborhood:'South Tampa', icon:'🎣', official_link:'https://www.tampa.gov/parks-and-recreation/featured-parks/ballast-point', short_summary:'Popular South Tampa waterfront park with fishing pier, playground, and bay views.', source_type:'curated', source_name:'Public Resource', lat:27.9044, lng:-82.4867 },
  // ── Restaurants & Dining ──────────────────────────────────────
  { activity_name:'Columbia Restaurant Ybor City', category:'Restaurants & Dining', neighborhood:'Ybor City', icon:'🥘', official_link:'https://www.columbiarestaurant.com/ybor-city/', short_summary:'Florida\'s oldest restaurant (1905) — legendary Cuban cuisine, flamenco shows, and history.', source_type:'curated', source_name:'Public Resource', lat:27.9605, lng:-82.4355 },
  { activity_name:'Ulele Restaurant', category:'Restaurants & Dining', neighborhood:'Heights', icon:'🌽', official_link:'https://ulele.com/', short_summary:'Native Florida cuisine in a stunning 1903 water works building on the Hillsborough River.', source_type:'curated', source_name:'Public Resource', lat:27.9570, lng:-82.4667 },
  { activity_name:'Bern\'s Steakhouse', category:'Restaurants & Dining', neighborhood:'Hyde Park', icon:'🥩', official_link:'https://www.bernssteakhouse.com/', short_summary:'Legendary Tampa institution — world\'s largest wine list and dry-aged steaks since 1956.', source_type:'curated', source_name:'Public Resource', lat:27.9305, lng:-82.4835 },
  { activity_name:'Oxford Exchange', category:'Restaurants & Dining', neighborhood:'Hyde Park', icon:'☕', official_link:'https://oxfordexchange.com/', short_summary:'Beautifully designed marketplace, restaurant, and café — Tampa\'s most instagrammable brunch spot.', source_type:'curated', source_name:'Public Resource', lat:27.9409, lng:-82.4806 },
  { activity_name:'Rooster & the Till', category:'Restaurants & Dining', neighborhood:'Seminole Heights', icon:'🍳', official_link:'https://www.roosterandthetill.com/', short_summary:'James Beard-nominated neighborhood bistro in Seminole Heights with creative New American fare.', source_type:'curated', source_name:'Public Resource', lat:27.9878, lng:-82.4577 },
  { activity_name:'Ella\'s Americana Folk Art Cafe', category:'Restaurants & Dining', neighborhood:'Seminole Heights', icon:'🎸', official_link:'https://www.ellasfolkartcafe.com/', short_summary:'Eclectic Seminole Heights gem with live music, folk art décor, and amazing burgers.', source_type:'curated', source_name:'Public Resource', lat:27.9888, lng:-82.4598 },
  // ── Nightlife ─────────────────────────────────────────────────
  { activity_name:'Ybor City Nightlife', category:'Nightlife', neighborhood:'Ybor City', icon:'🌙', official_link:'https://www.visittampabay.com/things-to-do/arts-culture-entertainment/nightlife/', short_summary:'Tampa\'s electric entertainment district — clubs, bars, live music, and late-night eats in historic Ybor City.', source_type:'curated', source_name:'Public Resource', lat:27.9609, lng:-82.4386 },
  { activity_name:'SoHo District Bars', category:'Nightlife', neighborhood:'Hyde Park', icon:'🍹', official_link:'https://www.visittampabay.com/', short_summary:'South Howard Ave\'s walkable stretch of trendy restaurants, rooftop bars, and nightlife.', source_type:'curated', source_name:'Public Resource', lat:27.9351, lng:-82.4894 },
  { activity_name:'Seminole Heights Bar Scene', category:'Nightlife', neighborhood:'Seminole Heights', icon:'🍺', official_link:'https://thatssotampa.com/', short_summary:'Tampa\'s hippest neighborhood with craft breweries, cocktail bars, and live music venues.', source_type:'curated', source_name:'Public Resource', lat:27.9878, lng:-82.4577 },
  { activity_name:'Heights Rooftop at Armature Works', category:'Nightlife', neighborhood:'Heights', icon:'🥂', official_link:'https://www.armatureworks.com/', short_summary:'Tampa\'s most scenic rooftop bar with panoramic river views, craft cocktails, and sunsets.', source_type:'curated', source_name:'Public Resource', lat:27.9598, lng:-82.4649 },
  // ── Sports & Entertainment ────────────────────────────────────
  { activity_name:'Tampa Bay Lightning Games', category:'Sports & Entertainment', neighborhood:'Channelside', icon:'⚡', official_link:'https://www.nhl.com/lightning/schedule', short_summary:'Cheer on the 3x Stanley Cup champions at Benchmark International Arena — one of Tampa\'s best live experiences.', source_type:'curated', source_name:'Public Resource', lat:27.9428, lng:-82.4519 },
  { activity_name:'Tampa Bay Buccaneers Games', category:'Sports & Entertainment', neighborhood:'Downtown', icon:'🏈', official_link:'https://www.buccaneers.com/schedule/', short_summary:'NFL football at Raymond James Stadium — home of the Super Bowl champion Buccaneers.', source_type:'curated', source_name:'Public Resource', lat:27.9758, lng:-82.5033 },
  { activity_name:'Tampa Bay Rays Games', category:'Sports & Entertainment', neighborhood:'St. Petersburg', icon:'⚾', official_link:'https://www.mlb.com/rays/schedule', short_summary:'MLB baseball at Tropicana Field — fun for the whole family with affordable tickets.', source_type:'curated', source_name:'Public Resource', lat:27.7683, lng:-82.6534 },
  { activity_name:'Tampa Bay Rowdies Soccer', category:'Sports & Entertainment', neighborhood:'St. Petersburg', icon:'⚽', official_link:'https://www.rowdiessoccer.com/schedule', short_summary:'USL Championship soccer at Al Lang Stadium on the beautiful St. Pete waterfront.', source_type:'curated', source_name:'Public Resource', lat:27.7724, lng:-82.6310 },
  // ── Shopping ─────────────────────────────────────────────────
  { activity_name:'Hyde Park Village', category:'Shopping', neighborhood:'Hyde Park', icon:'🛍', official_link:'https://www.hydeparkvillage.com/', short_summary:'Charming open-air shopping center with boutiques, restaurants, and weekend events.', source_type:'curated', source_name:'Public Resource', lat:27.9364, lng:-82.4860 },
  { activity_name:'International Plaza', category:'Shopping', neighborhood:'Airport Area', icon:'🛍', official_link:'https://www.shopinternationalplaza.com/', short_summary:'Upscale indoor mall with luxury brands, restaurants, and Tampa\'s best shopping.', source_type:'curated', source_name:'Public Resource', lat:27.9604, lng:-82.5149 },
  { activity_name:'Ybor Saturday Market', category:'Shopping', neighborhood:'Ybor City', icon:'🥦', official_link:'https://www.ybormarket.com/', short_summary:'Ybor City\'s beloved Saturday farmers market with fresh produce, arts, crafts, and food.', source_type:'curated', source_name:'Public Resource', lat:27.9603, lng:-82.4354 },
  // ── Events Calendar ───────────────────────────────────────────

  { activity_name:'That\'s So Tampa Events', category:'Events Calendar', neighborhood:'City-wide', icon:'📍', official_link:'https://thatssotampa.com/events/map/', short_summary:'Tampa\'s go-to local events map — music, food, art, markets, and nightlife all week.', source_type:'curated', source_name:'Local Pick' },
  { activity_name:'Creative Loafing Tampa Events', category:'Events Calendar', neighborhood:'City-wide', icon:'📰', official_link:'https://cltampa.com/', short_summary:'Arts, culture, music, food, and nightlife from Tampa\'s best alternative weekly.', source_type:'curated', source_name:'Local Pick' },
  { activity_name:'Visit Tampa Bay Events', category:'Events Calendar', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.visittampabay.com/tampa-events/', short_summary:'Official Tampa Bay events calendar — festivals, concerts, sports, and cultural events.', source_type:'curated', source_name:'Public Resource' },

  { activity_name:'Gasparilla Events', category:'Events Calendar', neighborhood:'Downtown', icon:'☠', official_link:'https://www.gasparillapiratefest.com/', short_summary:'Tampa\'s iconic pirate festival — parades, live music, and citywide festivities in January.', source_type:'curated', source_name:'Public Resource' },
  { activity_name:'Tampa Bay Food & Wine Festival', category:'Events Calendar', neighborhood:'City-wide', icon:'🍷', official_link:'https://tampabaywff.com/', short_summary:'Annual celebration of local chefs, restaurants, and vintners across Tampa Bay — April 7-11, 2026.', source_type:'curated', source_name:'Public Resource' },
  // ── Tours & Activities ────────────────────────────────────────
  { activity_name:'Tampa Golf Cart Tours', category:'Tours & Activities', neighborhood:'Ybor City', icon:'🚗', booking_link:'https://www.getyourguide.com/tampa-l1187/golf-cart-tours-tc199/', short_summary:'Explore Tampa and Ybor City on a fun, narrated golf cart tour — a local favourite.', source_type:'affiliate', source_name:'GetYourGuide', lat:27.9609, lng:-82.4386 },
  { activity_name:'Tampa Bay Boat Tours', category:'Tours & Activities', neighborhood:'Waterfront', icon:'⛵', booking_link:'https://www.viator.com/Tampa-tourism/d666-g6-t25905', short_summary:'Cruise Tampa Bay on a scenic boat tour — dolphins, skyline views, and waterfront magic.', source_type:'affiliate', source_name:'Viator', lat:27.9416, lng:-82.4499 },
  { activity_name:'Tampa Kayak & Paddleboard', category:'Tours & Activities', neighborhood:'Waterfront', icon:'🚣', booking_link:'https://www.getyourguide.com/tampa-l1187/kayaking-canoeing-tc52/', short_summary:'Paddle Tampa\'s scenic waterways — mangroves, manatees, and bioluminescent bays.', source_type:'affiliate', source_name:'GetYourGuide' },
  { activity_name:'Ybor City Food Tour', category:'Tours & Activities', neighborhood:'Ybor City', icon:'🥙', booking_link:'https://www.getyourguide.com/tampa-l1187/food-drink-tours-tc55/', short_summary:'Taste Tampa\'s Cuban and multicultural food scene on a guided walking food tour.', source_type:'affiliate', source_name:'GetYourGuide', lat:27.9609, lng:-82.4386 },
  { activity_name:'Tampa Bay Sunset Cruise', category:'Tours & Activities', neighborhood:'Waterfront', icon:'🌅', booking_link:'https://www.viator.com/Tampa-tourism/d666-g6-t25905', short_summary:'Romantic sunset sailing cruise on Tampa Bay with drinks and panoramic city views.', source_type:'affiliate', source_name:'Viator' },
  { activity_name:'Visit Tampa Bay Tours', category:'Tours & Activities', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.visittampabay.com/things-to-do/tours/', short_summary:'Official visitor guide to Tampa Bay tours — water adventures, cultural walks, and more.', source_type:'curated', source_name:'Public Resource' },
  // ── Deals & Discounts ─────────────────────────────────────────
  { activity_name:'Groupon Tampa Deals', category:'Deals & Discounts', neighborhood:'City-wide', icon:'💰', booking_link:'https://www.groupon.com/local/tampa/sightseeing-and-tours', short_summary:'Save big on Tampa Bay tours, restaurants, spas, and activities with Groupon.', source_type:'partner', source_name:'Groupon' },
  { activity_name:'CityPASS Tampa', category:'Deals & Discounts', neighborhood:'City-wide', icon:'🎟', booking_link:'https://www.citypass.com/tampa', short_summary:'Save up to 55% on top Tampa attractions — aquarium, zoo, Busch Gardens, and more.', source_type:'partner', source_name:'CityPASS' },
  { activity_name:'Visit Tampa Bay Deals', category:'Deals & Discounts', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.visittampabay.com/unlock-deals/', short_summary:'Exclusive visitor discounts and offers from the official Tampa Bay tourism board.', source_type:'curated', source_name:'Public Resource' },
  { activity_name:'Florida Resident Discounts', category:'Deals & Discounts', neighborhood:'City-wide', icon:'🌴', official_link:'https://www.floridastateparks.org/', short_summary:'Florida residents save on state parks, attractions, and local offers year-round.', source_type:'curated', source_name:'Public Resource' },
  // ── Wellness ──────────────────────────────────────────────────
  { activity_name:'Tampa Yoga Studios', category:'Wellness', neighborhood:'City-wide', icon:'🧘', official_link:'https://thatssotampa.com/', short_summary:'Discover Tampa\'s best yoga, pilates, and mindfulness studios from South Tampa to Seminole Heights.', source_type:'curated', source_name:'Local Pick' },
  { activity_name:'Float Tampa', category:'Wellness', neighborhood:'South Tampa', icon:'💧', official_link:'https://floattampa.com/', short_summary:'Sensory deprivation float therapy for deep relaxation, recovery, and mental clarity.', source_type:'curated', source_name:'Public Resource' },
  { activity_name:'Tampa Spa Day', category:'Wellness', neighborhood:'City-wide', icon:'💆', booking_link:'https://www.groupon.com/local/tampa/spas', short_summary:'Indulge in a spa day with massages, facials, and treatments at Tampa\'s top spas.', source_type:'partner', source_name:'Groupon' },
  // ── Volunteer ─────────────────────────────────────────────────
  { activity_name:'Keep Tampa Bay Beautiful', category:'Volunteer', neighborhood:'City-wide', icon:'🌿', official_link:'https://www.keeptampabaybeautiful.org/become-a-volunteer', short_summary:'Volunteer for beach cleanups, park restoration, and environmental conservation.', source_type:'curated', source_name:'Nonprofit' },

];

const TAGS = [
  { name:'family',    activities:['Curtis Hixon Waterfront Park','The Florida Aquarium','Tampa Bay History Center','CityPASS Tampa','Florida State Parks','ZooTampa at Lowry Park','Busch Gardens Tampa','Glazer Children\'s Museum'] },
  { name:'free',      activities:['Curtis Hixon Waterfront Park','Tampa Riverwalk','Keep Tampa Bay Beautiful','Ballast Point Park','Florida Resident Discounts'] },
  { name:'outdoor',   activities:['Curtis Hixon Waterfront Park','Florida State Parks','Tampa Riverwalk','Tampa Bay Boat Tours','Keep Tampa Bay Beautiful','Clearwater Beach','St. Pete Beach','Caladesi Island State Park','Hillsborough River State Park','Ballast Point Park','Tampa Kayak & Paddleboard'] },
  { name:'nightlife', activities:['Ybor City Historic District','Armature Works','That\'s So Tampa Events','Creative Loafing Tampa Events','Ybor City Nightlife','SoHo District Bars','Seminole Heights Bar Scene','Heights Rooftop at Armature Works'] },
  { name:'volunteer', activities:['Keep Tampa Bay Beautiful','The Florida Aquarium','Straz Center Performances','Tampa Bay History Center','Tampa Riverwalk'] },
  { name:'tours',     activities:['Tampa Golf Cart Tours','Tampa Bay Boat Tours','Tampa Kayak & Paddleboard','Ybor City Food Tour','Tampa Bay Sunset Cruise','Visit Tampa Bay Tours'] },
  { name:'arts',      activities:['Tampa Museum of Art','Straz Center Performances','Creative Loafing Tampa Events','Ybor City Historic District','Henry B. Plant Museum'] },
  { name:'deals',     activities:['Groupon Tampa Deals','CityPASS Tampa','Visit Tampa Bay Deals','Florida Resident Discounts','Tampa Spa Day'] },
  { name:'waterfront',activities:['Curtis Hixon Waterfront Park','Armature Works','Tampa Bay Boat Tours','Tampa Riverwalk','Ulele Restaurant','Ballast Point Park','Tampa Bay Sunset Cruise'] },
  { name:'history',   activities:['Tampa Bay History Center','Ybor City Historic District','Tampa Fire Fighters Museum','Henry B. Plant Museum','Columbia Restaurant Ybor City'] },
  { name:'food',      activities:['Columbia Restaurant Ybor City','Ulele Restaurant','Bern\'s Steakhouse','Oxford Exchange','Rooster & the Till','Ella\'s Americana Folk Art Cafe','Ybor Saturday Market','Ybor City Food Tour'] },
  { name:'sports',    activities:['Tampa Bay Lightning Games','Tampa Bay Buccaneers Games','Tampa Bay Rays Games','Tampa Bay Rowdies Soccer','Benchmark International Arena'] },
  { name:'beach',     activities:['Clearwater Beach','St. Pete Beach','Caladesi Island State Park','Ballast Point Park'] },
  { name:'wellness',  activities:['Tampa Yoga Studios','Float Tampa','Tampa Spa Day'] },
  { name:'shopping',  activities:['Hyde Park Village','International Plaza','Ybor Saturday Market'] },
  { name:'events',    activities:['Armature Works','Gasparilla Events','Tampa Bay Food & Wine Festival','Tampa Riverwalk','Straz Center Performances','Visit Tampa Bay Events','That\'s So Tampa Events'] },
];

const TOURS = [
  { activity:'Tampa Golf Cart Tours',    price_min:29,  price_max:59,  duration:'1-2 hours', starting_location:'Ybor City',    booking_required:true },
  { activity:'Tampa Bay Boat Tours',     price_min:39,  price_max:89,  duration:'2 hours',   starting_location:'Tampa Waterfront', booking_required:true },
  { activity:'Tampa Kayak & Paddleboard',price_min:25,  price_max:65,  duration:'2-3 hours', starting_location:'Various', booking_required:true },
  { activity:'Ybor City Food Tour',      price_min:55,  price_max:85,  duration:'3 hours',   starting_location:'Ybor City', booking_required:true },
  { activity:'Tampa Bay Sunset Cruise',  price_min:49,  price_max:99,  duration:'2 hours',   starting_location:'Tampa Waterfront', booking_required:true },
  { activity:'CityPASS Tampa',           price_min:89,  price_max:89,  duration:'3 days',    starting_location:'City-wide', booking_required:false },
  { activity:'Groupon Tampa Deals',      price_min:10,  price_max:100, duration:'Varies',    starting_location:'Various', booking_required:false },
  { activity:'Busch Gardens Tampa',      price_min:89,  price_max:149, duration:'Full day',  starting_location:'Temple Terrace', booking_required:false },
  { activity:'ZooTampa at Lowry Park',   price_min:28,  price_max:38,  duration:'3-4 hours', starting_location:'North Tampa', booking_required:false },
  { activity:'The Florida Aquarium',     price_min:30,  price_max:40,  duration:'2-3 hours', starting_location:'Channelside', booking_required:false },
  { activity:'Tampa Spa Day',            price_min:50,  price_max:200, duration:'Varies',    starting_location:'City-wide', booking_required:true },
  { activity:'Float Tampa',              price_min:65,  price_max:85,  duration:'60-90 min', starting_location:'South Tampa', booking_required:true },
];

async function seed() {
  console.log('🌴 Seeding Tampa data into Supabase...\n');

  // 0. Clear existing data to avoid duplicates
  console.log('🗑  Clearing existing activities...');
  const adminSB = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  await adminSB.from('activity_tags').delete().neq('activity_id', '00000000-0000-0000-0000-000000000000');
  await adminSB.from('tours').delete().neq('activity_id', '00000000-0000-0000-0000-000000000000');
  await adminSB.from('events').delete().neq('activity_id', '00000000-0000-0000-0000-000000000000');
  await adminSB.from('activities').delete().eq('city', 'Tampa');
  await adminSB.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');

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
    await supabase.from('tours').insert({ ...rest, activity_id });
  }
  console.log(`✅ ${TOURS.length} tour pricing records inserted`);

  console.log('\n🚀 Seed complete! Tampa data is live in Supabase.');
}

seed().catch(console.error);
