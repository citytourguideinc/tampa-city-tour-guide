'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const TIMES = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function pad(n) { return String(n).padStart(2,'0'); }
function toDateStr(y,m,d) { return `${y}-${pad(m+1)}-${pad(d)}`; }

const REVIEWS = [
  { name: 'Emmalyn', country: 'United States', date: 'Jul 30, 2025', stars: 5, text: 'Tour went well over all. Michelle is very friendly and flexible in time. She is fun and easy to work with. We highly recommend this tour especially if you\'re new to the area. Thanks Michelle for giving us a memorable tour!' },
  { name: 'KB', country: 'United States', date: 'Jul 11, 2025', stars: 5, text: 'Tour was great and very informative! Seen beautiful parts of the city!' },
  { name: 'Jasmine T.', country: 'United States', date: 'Jul 4, 2025', stars: 5, text: 'Best thing we did in Tampa! We were a bachelorette group of 5 and had the absolute best time. Michelle let us pick all the songs and knew every landmark by heart. The golf cart was clean, comfortable and had great speakers. Already planning to come back!' },
  { name: 'Marcus D.', country: 'United States', date: 'Jun 28, 2025', stars: 5, text: 'Took my family on this tour for Father\'s Day. Kids loved the karaoke, my wife loved the waterfront views, and I loved that someone else was driving! Seriously fun experience. Worth every penny.' },
  { name: 'Priya K.', country: 'United States', date: 'Jun 15, 2025', stars: 5, text: 'Moved to Tampa 6 months ago and this was the best introduction to the city I could have asked for. We stopped at spots I never would have found on my own. Michelle is a natural guide — funny, knowledgeable, and passionate about Tampa.' },
  { name: 'Rachel & Mike', country: 'United States', date: 'Jun 1, 2025', stars: 5, text: 'Absolutely perfect date night! We sang together through Ybor City and finished with a sunset view at Harbour Island. Romantic, fun, and totally unique. We\'ve done lots of tours across the country — this is one of our favorites.' },
  { name: 'Derek O.', country: 'United States', date: 'May 24, 2025', stars: 4, text: 'Really enjoyed it. The karaoke setup was hilarious — I\'m a terrible singer but nobody judged! Great way to see the city. Knocked off one star only because we wanted to stay longer — would love a 3-hour option.' },
  { name: 'Tanya B.', country: 'United States', date: 'May 17, 2025', stars: 5, text: 'Booked this for my mom\'s birthday and she absolutely loved it. She was hesitant at first but ended up stealing the mic the whole tour! Michelle was incredibly warm and accommodating. This is a MUST do in Tampa.' },
  { name: 'James & Courtney', country: 'United States', date: 'May 10, 2025', stars: 5, text: 'We\'ve lived in Tampa for 3 years and still discovered things on this tour. The commentary was fantastic and the karaoke just made it feel like a party. Can\'t recommend enough. Go book it now!' },
  { name: 'Lindsey P.', country: 'United States', date: 'Apr 27, 2025', stars: 5, text: 'Visited Tampa for a conference and squeezed this tour in between sessions. So glad I did! In 2 hours I saw more of the real Tampa than I would have in a whole week on my own. The vibe is just different — feels personal and fun, not touristy.' },
  { name: 'Andre W.', country: 'United States', date: 'Apr 19, 2025', stars: 5, text: 'This is hands down the most fun I\'ve had on any tour, anywhere. The karaoke aspect is genius — it makes you feel like you\'re celebrating while you explore. Our guide knew every building, every story, every shortcut. 10/10.' },
  { name: 'Sofia R.', country: 'United States', date: 'Apr 6, 2025', stars: 5, text: 'Our girls\' trip highlight! We laughed the entire time. Michelle is so personable and knows Tampa inside and out. We stopped at the most gorgeous spots for photos. Don\'t overthink it — just book it.' },
  { name: 'Nathaniel G.', country: 'United States', date: 'Mar 29, 2025', stars: 5, text: 'Surprised my girlfriend for her birthday and she absolutely flipped. Perfect blend of sightseeing and entertainment. Michelle went above and beyond to make it special. The Ybor City stretch at dusk was especially beautiful.' },
  { name: 'Cassandra M.', country: 'United States', date: 'Mar 15, 2025', stars: 4, text: 'Super fun experience! We loved the karaoke and the stops around Water Street were beautiful. Guide was great — very professional and funny. Would definitely do the extended tour next time.' },
  { name: 'Sarah M.', country: 'United States', date: 'Jun 22, 2025', stars: 5, text: 'Absolutely loved it! We sang our hearts out while cruising through Tampa. The guide knew every hidden gem in the city.' },
];

const EXTENSION_STOPS = ['Davis Islands 🏝️','Hyde Park Village 🌳','SoHo / South Howard 🍹','University of Tampa 🏛️'];
const EXTENSION_PRICE_PER_PERSON = 20; // +1hr, $20/person

function BookPageContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [guests,       setGuests]       = useState(2);
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [special,      setSpecial]      = useState('');
  const [extension,    setExtension]    = useState(false); // +1hr add-on
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [avail,        setAvail]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [step,         setStep]         = useState(1); // 1=pick date, 2=details, 3=pay

  const fetchAvail = useCallback(async (y, m) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/book/availability?year=${y}&month=${m+1}`);
      const d = await r.json();
      setAvail(d);
    } catch { setAvail(null); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAvail(calYear, calMonth); }, [calYear, calMonth, fetchAvail]);

  const settings = avail?.settings || { min_advance_hours: 24, max_advance_days: 90, max_guests: 5, price_cents: 4900 };
  const blocked      = new Set(avail?.blockedDates || []);
  const bookMap      = avail?.bookingMap || {};
  const blockedSlots = avail?.blockedSlots || {};
  const basePricePerPerson  = settings.price_cents / 100; // $49
  const discountPerPerson   = refCode ? 5 : 0;            // $5 off if referred
  const pricePerPerson      = basePricePerPerson - discountPerPerson; // $44 or $49
  const extensionPerPerson  = extension ? EXTENSION_PRICE_PER_PERSON : 0;
  const totalPrice = ((pricePerPerson + extensionPerPerson) * guests).toFixed(2);

  function isDayDisabled(y, m, d) {
    const dateStr = toDateStr(y, m, d);
    const date    = new Date(`${dateStr}T12:00:00`);
    const now     = new Date();
    const hoursAhead = (date - now) / (1000 * 60 * 60);
    if (hoursAhead < settings.min_advance_hours) return true;
    if (hoursAhead > settings.max_advance_days * 24) return true;
    if (blocked.has(dateStr)) return true;
    return false;
  }

  function isTimeDisabled(time) {
    if (!selectedDate) return false;
    const key = `${selectedDate}::${time}`;
    // Blocked by 2-hour buffer from another tour
    if (blockedSlots[key]) return true;
    // Slot is full on guest count
    const booked = bookMap[key] || 0;
    return booked + guests > 5;
  }

  // Calendar cells
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); }
    else setCalMonth(m => m-1);
    setSelectedDate(null); setSelectedTime(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); }
    else setCalMonth(m => m+1);
    setSelectedDate(null); setSelectedTime(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/book/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate, time: selectedTime, guests,
          name, email, phone, specialRequests: special,
          tourType: 'karaoke',
          referralCode: refCode || null,
          extensionHour: extension,
        }),
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else alert(d.error || 'Something went wrong. Please try again.');
    } catch { alert('Network error. Please try again.'); }
    setSubmitting(false);
  }

  return (
    <div className={styles.page}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.badge}>⭐ 4.7 · Top Rated · 15 reviews</div>
          <h1 className={styles.heroTitle}>Karaoke Golf Cart City Tour</h1>
          <p className={styles.heroSub}>Sing, Explore & Fall in Love with Tampa!</p>
          <div className={styles.heroPills}>
            <span>🕐 2 Hours</span>
            <span>👥 Max 5 Guests</span>
            <span>🎤 Wireless Mics</span>
            <span>⚡ Luxury Electric Cart</span>
          </div>
        </div>
      </div>

      {/* ── Photo Gallery ─────────────────────────────────────────── */}
      <div className={styles.gallery}>
        {[
          {
            src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80',
            alt: 'Night city lights tour experience'
          },
          {
            src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80',
            alt: 'Karaoke fun and singing'
          },
          {
            src: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=900&q=80',
            alt: 'Tampa downtown waterfront'
          },
          {
            src: 'https://images.unsplash.com/photo-1467803738586-46b7eb7b16a1?w=900&q=80',
            alt: 'Group tour and sightseeing fun'
          },
        ].map((photo, i) => (
          <div key={i} className={styles.galleryItem}>
            <img src={photo.src} alt={photo.alt} className={styles.galleryImg} />
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        {/* ── Left: Tour Info ─────────────────────────────────────── */}
        <div className={styles.infoCol}>
          {/* About */}
          <section className={styles.section}>
            <h2>About This Experience</h2>
            <p>There's no better way to experience Downtown Tampa than from the back of a luxury electric golf cart guided by a true Tampa native who has spent a lifetime exploring and sharing this city.</p>
            <p>Sing your favorite songs through wireless karaoke as you cruise past iconic landmarks — Harbour Island, Water Street, Ybor City, the Channel District, Downtown Tampa, and Tampa Heights. Your private guide handles the driving so you can focus on the memories.</p>
          </section>

          {/* Highlights */}
          <section className={styles.section}>
            <h2>Highlights</h2>
            <ul className={styles.list}>
              <li>🎤 Wireless karaoke with full playlist control and on-screen lyrics</li>
              <li>🔊 Geo-triggered audio narration through cart speakers</li>
              <li>📸 Scenic photo stops at iconic Downtown Tampa landmarks</li>
              <li>🗺️ Guided by a true Tampa native with lifelong local knowledge</li>
              <li>🎉 Perfect for birthdays, bachelorettes, date nights, locals & newcomers</li>
            </ul>
          </section>

          {/* Itinerary */}
          <section className={styles.section}>
            <h2>Tour Route</h2>
            <div className={styles.itinerary}>
              {[
                { loc: 'The Pointe Marina, Harbour Island', type: 'start', note: 'Meet in front of Starbucks · Look for branded CTG cart' },
                { loc: 'Harbour Island', type: 'stop', note: 'Photo stop · Sightseeing · Scenic views' },
                { loc: 'Water Street', type: 'stop', note: 'Sightseeing · Scenic drive' },
                { loc: 'Channel District', type: 'stop', note: 'Sightseeing · Scenic views' },
                { loc: 'Ybor City', type: 'stop', note: 'Sightseeing · Historic district' },
                { loc: 'Downtown Tampa', type: 'stop', note: 'Photo stop · Sightseeing' },
                { loc: 'Tampa Heights', type: 'stop', note: 'Photo stop · Scenic views' },
                { loc: 'The Pointe Marina, Harbour Island', type: 'end', note: 'Return to start' },
              ].map((s, i) => (
                <div key={i} className={`${styles.iStop} ${styles['iStop_' + s.type]}`}>
                  <div className={styles.iDot} />
                  <div>
                    <div className={styles.iLoc}>{s.loc}</div>
                    <div className={styles.iNote}>{s.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Includes */}
          <section className={styles.section}>
            <h2>What's Included</h2>
            <div className={styles.includesGrid}>
              <div>
                {['Private local guide','Black luxury electric golf cart','Access to CityTourGuide.app','Bathroom breaks upon request','Scenic photo stops at key landmarks','Wireless microphones for every guest','Geo-triggered audio narration'].map(item => (
                  <div key={item} className={styles.includeRow}>
                    <span className={styles.check}>✓</span> {item}
                  </div>
                ))}
              </div>
              <div>
                {['Food and drinks','Gratuities (optional but appreciated)','Hotel pickup or drop-off','Admission to attractions or venues','Personal expenses during stops'].map(item => (
                  <div key={item} className={styles.includeRow}>
                    <span className={styles.cross}>✕</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Meeting point */}
          <section className={styles.section}>
            <h2>Meeting Point</h2>
            <div className={styles.meetingBox}>
              <div className={styles.meetingIcon}>📍</div>
              <div>
                <div className={styles.meetingName}>In front of Starbucks at The Pointe Marina</div>
                <div className={styles.meetingAddr}>Harbour Island, Tampa, FL</div>
                <div className={styles.meetingNote}>Look for the City Tour Guide cart and driver in branded gear. Ask inside Starbucks for parking validation.</div>
                <a href="https://maps.google.com/?q=The+Pointe+Marina+Harbour+Island+Tampa+FL" target="_blank" rel="noopener noreferrer" className={styles.mapsLink}>Open in Google Maps →</a>
              </div>
            </div>
          </section>

          {/* Policies */}
          <section className={styles.section}>
            <h2>Policies</h2>
            <div className={styles.policyRow}><span className={styles.policyIcon}>✅</span><div><strong>Free cancellation</strong><br/>Cancel up to 24 hours in advance for a full refund</div></div>
            <div className={styles.policyRow}><span className={styles.policyIcon}>⚠️</span><div><strong>Not suitable for</strong><br/>People with back problems · Smoking not allowed in vehicle</div></div>
            <div className={styles.policyRow}><span className={styles.policyIcon}>⚖️</span><div><strong>Weight limit</strong><br/>Golf cart holds max 1,200 lbs including driver</div></div>
          </section>

          {/* Reviews */}
          <section className={styles.section}>
            <h2>Customer Reviews</h2>
            <div className={styles.ratingBar}>
              <div className={styles.ratingBig}>4.7</div>
              <div>
                <div className={styles.stars}>★★★★½</div>
                <div className={styles.ratingCount}>15 verified reviews · Top Rated</div>
              </div>
            </div>
            <div className={styles.reviews}>
              {(showAllReviews ? REVIEWS : REVIEWS.slice(0, 5)).map((r,i) => (
                <div key={i} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAvatar}>{r.name[0]}</div>
                    <div>
                      <div className={styles.reviewName}>{r.name} <span className={styles.reviewCountry}>· {r.country}</span></div>
                      <div className={styles.reviewDate}>{r.date} · Verified booking</div>
                    </div>
                    <div className={styles.reviewStars}>{'★'.repeat(r.stars)}</div>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAllReviews(v => !v)}
              style={{
                marginTop: '16px', width: '100%', padding: '12px',
                background: 'none', border: '2px solid #E5E7EB', borderRadius: '12px',
                color: '#374151', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => e.target.style.borderColor='#1D4ED8'}
              onMouseOut={e => e.target.style.borderColor='#E5E7EB'}
            >
              {showAllReviews ? '▲ Show fewer reviews' : `▼ Show all ${REVIEWS.length} reviews`}
            </button>
          </section>
        </div>

        {/* ── Right: Booking Widget ────────────────────────────────── */}
        <div className={styles.bookingCol}>
          <div className={styles.bookingCard}>
            <div className={styles.priceHeader}>
              <div className={styles.price}>
                {refCode ? <><span style={{textDecoration:'line-through',color:'#9CA3AF',fontSize:'1.2rem'}}>${basePricePerPerson}</span> ${pricePerPerson}</> : `$${pricePerPerson}`}
                <span>/person</span>
              </div>
              {refCode && <div className={styles.priceNote} style={{color:'#10B981'}}>🔗 Affiliate discount applied — you save $5/person</div>}
              {!refCode && <div className={styles.priceNote}>Free cancellation · Book with confidence</div>}
            </div>

            {step === 1 && (
              <>
                {/* Guest count */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Number of Guests</label>
                  <div className={styles.guestPicker}>
                    <button className={styles.guestBtn} onClick={() => setGuests(g => Math.max(1,g-1))} disabled={guests<=1}>−</button>
                    <span className={styles.guestCount}>{guests} {guests===1?'guest':'guests'}</span>
                    <button className={styles.guestBtn} onClick={() => setGuests(g => Math.min(5,g+1))} disabled={guests>=5}>+</button>
                  </div>
                  <div className={styles.guestNote}>Max 5 per booking</div>
                </div>

                {/* Calendar */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Select Date</label>
                  <div className={styles.calendar}>
                    <div className={styles.calNav}>
                      <button className={styles.calNavBtn} onClick={prevMonth}>‹</button>
                      <span className={styles.calMonthLabel}>{MONTHS[calMonth]} {calYear}</span>
                      <button className={styles.calNavBtn} onClick={nextMonth}>›</button>
                    </div>
                    <div className={styles.calGrid}>
                      {DAYS.map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}
                      {cells.map((d, i) => {
                        if (!d) return <div key={`e${i}`} />;
                        const ds = toDateStr(calYear, calMonth, d);
                        const disabled = isDayDisabled(calYear, calMonth, d);
                        const sel = ds === selectedDate;
                        return (
                          <button key={ds}
                            className={`${styles.calDay} ${disabled?styles.calDayDisabled:''} ${sel?styles.calDaySelected:''}`}
                            disabled={disabled}
                            onClick={() => { setSelectedDate(ds); setSelectedTime(null); }}
                          >{d}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Select Start Time</label>
                    <div className={styles.timeGrid}>
                      {TIMES.map(t => {
                        const disabled = isTimeDisabled(t);
                        return (
                          <button key={t}
                            className={`${styles.timeSlot} ${disabled?styles.timeSlotFull:''} ${selectedTime===t?styles.timeSlotSelected:''}`}
                            disabled={disabled}
                            onClick={() => setSelectedTime(t)}
                          >{t}{disabled?' (Full)':''}</button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <div className={styles.selectionSummary}>
                    <div>📅 {new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
                    <div>🕐 {selectedTime} · 2 hours</div>
                    <div>👥 {guests} {guests===1?'guest':'guests'} · <strong>${totalPrice} total</strong></div>
                  </div>
                )}

                <button
                  className={styles.ctaBtn}
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(2)}
                >
                  {selectedDate && selectedTime ? 'Continue to Details →' : 'Select a Date & Time'}
                </button>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className={styles.detailsForm}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>← Back to calendar</button>

                <div className={styles.confirmBox}>
                  <div>📅 {new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
                  <div>🕐 {selectedTime} · 2 hours</div>
                  <div>👥 {guests} {guests===1?'guest':'guests'} · <strong>${totalPrice} total</strong></div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Full Name *</label>
                  <input className={styles.input} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address *</label>
                  <input className={styles.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone Number</label>
                  <input className={styles.input} type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Special Requests or Notes</label>
                  <textarea className={styles.textarea} value={special} onChange={e=>setSpecial(e.target.value)} placeholder="Birthdays, bachelorette, accessibility needs, song requests..." rows={3} />
                </div>

                {/* Extension add-on */}
                <div className={styles.fieldGroup} style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'12px',padding:'14px 16px'}}>
                  <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'}}>
                    <input type="checkbox" checked={extension} onChange={e=>setExtension(e.target.checked)}
                      style={{marginTop:'3px',width:'16px',height:'16px',accentColor:'#10B981'}} />
                    <div>
                      <div style={{fontWeight:700,fontSize:'0.9rem',color:'#065F46'}}>➕ Extend Tour +1 Hour <span style={{color:'#10B981',fontWeight:800}}>+${EXTENSION_PRICE_PER_PERSON}/person</span></div>
                      <div style={{fontSize:'0.78rem',color:'#047857',marginTop:'4px'}}>Add 4 more Tampa gems:</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginTop:'6px'}}>
                        {EXTENSION_STOPS.map(s=><span key={s} style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',color:'#065F46',fontSize:'0.72rem',padding:'2px 8px',borderRadius:'999px'}}>{s}</span>)}
                      </div>
                    </div>
                  </label>
                </div>

                <div className={styles.priceSummary}>
                  <div className={styles.priceLine}><span>${basePricePerPerson} × {guests} {guests===1?'guest':'guests'}</span><span>${(basePricePerPerson*guests).toFixed(2)}</span></div>
                  {refCode && <div className={styles.priceLine} style={{color:'#10B981'}}><span>🔗 Affiliate discount (−$5 × {guests})</span><span>−${(5*guests).toFixed(2)}</span></div>}
                  {extension && <div className={styles.priceLine} style={{color:'#059669'}}><span>➕ +1hr extension (${EXTENSION_PRICE_PER_PERSON} × {guests})</span><span>+${(EXTENSION_PRICE_PER_PERSON*guests).toFixed(2)}</span></div>}
                  <div className={`${styles.priceLine} ${styles.priceTotal}`}><span>Total</span><span>${totalPrice}</span></div>
                  <div className={styles.priceNote2}>✅ Free cancellation up to 24 hours before · Secure payment via Stripe</div>
                </div>

                <button type="submit" className={styles.ctaBtn} disabled={submitting}>
                  {submitting ? 'Processing...' : `Pay $${totalPrice} · Confirm Booking`}
                </button>
              </form>
            )}
          </div>

          {/* Trust badges */}
          <div className={styles.trustBadges}>
            <div className={styles.trustBadge}><span>🔒</span> Secure Checkout</div>
            <div className={styles.trustBadge}><span>✅</span> Free Cancellation</div>
            <div className={styles.trustBadge}><span>⭐</span> 4.7/5 Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#F8F9FA'}} />}>
      <BookPageContent />
    </Suspense>
  );
}
