'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetch(`/api/book/confirm?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { setBooking(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const WAIVER_URL = 'https://waiver.citytourguide.app';

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.center}><div className={styles.spinner} /></div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.checkCircle}>✓</div>
        <h1 className={styles.title}>You're Booked!</h1>
        <p className={styles.sub}>A confirmation email is on its way. See you soon!</p>

        {booking && (
          <div className={styles.details}>
            <div className={styles.detailRow}><span>📅 Date</span><strong>{booking.booking_date}</strong></div>
            <div className={styles.detailRow}><span>🕐 Time</span><strong>{booking.booking_time}</strong></div>
            <div className={styles.detailRow}><span>👥 Guests</span><strong>{booking.guests}</strong></div>
            <div className={styles.detailRow}><span>📍 Meet at</span><strong>In front of Starbucks, The Pointe Marina, Harbour Island</strong></div>
          </div>
        )}

        <div className={styles.nextStep}>
          <div className={styles.nextTitle}>📋 One more step — Sign Your Waiver</div>
          <p className={styles.nextText}>All guests must sign a digital waiver before the tour. Takes 60 seconds.</p>
          <a href={WAIVER_URL} className={styles.waiverBtn} target="_blank" rel="noopener noreferrer">
            Sign Digital Waiver →
          </a>
        </div>

        <div className={styles.meetingInfo}>
          <strong>📍 Meeting Point</strong><br />
          In front of Starbucks at The Pointe Marina, Harbour Island<br />
          Look for the City Tour Guide cart and driver in branded gear.<br />
          Ask inside Starbucks for parking validation.
        </div>

        <a href="/" className={styles.homeLink}>← Back to Tampa Guide</a>
      </div>
    </div>
  );
}

export default function BookingConfirmation() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0D1117'}}><div style={{color:'#fff',fontSize:'1.2rem'}}>Loading…</div></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
