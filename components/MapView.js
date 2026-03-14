// components/MapView.js — Leaflet.js map with activity pins
// Uses dynamic import to avoid SSR issues (Leaflet requires window)
'use client';
import { useEffect, useRef } from 'react';
import styles from './MapView.module.css';

export default function MapView({ results }) {
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    async function initMap() {
      const L = (await import('leaflet')).default;

      // Init map once
      if (!leafRef.current) {
        leafRef.current = L.map(mapRef.current, {
          center:    [27.9506, -82.4572], // Tampa center
          zoom:      13,
          zoomControl: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(leafRef.current);
      }

      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add new markers
      const withCoords = (results || []).filter(r => r.lat && r.lng);
      withCoords.forEach(item => {
        const icon = L.divIcon({
          html: `<div class="ctg-pin">${item.icon || '📍'}</div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 36],
        });
        const marker = L.marker([item.lat, item.lng], { icon })
          .addTo(leafRef.current)
          .bindPopup(`
            <div class="ctg-popup">
              <strong>${item.activity_name}</strong>
              <span>${item.category}</span>
              ${item.booking_link || item.official_link
                ? `<a href="${item.booking_link || item.official_link}" target="_blank" rel="noopener">View →</a>`
                : ''}
            </div>
          `);
        markersRef.current.push(marker);
      });

      // Fit map to markers if any
      if (withCoords.length > 1) {
        const group = L.featureGroup(markersRef.current);
        leafRef.current.fitBounds(group.getBounds().pad(0.15));
      }
    }

    initMap();
  }, [results]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (leafRef.current) { leafRef.current.remove(); leafRef.current = null; }
  }, []);

  return (
    <div className={styles.wrap}>
      {/* Leaflet CSS — injected inline to avoid next/head issues */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .ctg-pin {
          font-size: 22px; line-height: 36px; text-align: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          cursor: pointer;
        }
        .ctg-popup { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
        .ctg-popup strong { font-size: 0.87rem; color: #111; }
        .ctg-popup span { font-size: 0.72rem; color: #666; }
        .ctg-popup a { font-size: 0.78rem; color: #ff6a2f; font-weight: 600; text-decoration: none; margin-top: 4px; }
        .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .leaflet-container { font-family: 'Inter', sans-serif; }
      `}</style>
      <div ref={mapRef} className={styles.map} />
      {(!results || results.filter(r => r.lat && r.lng).length === 0) && (
        <div className={styles.noLocations}>
          📍 Map pins appear for activities with location data.<br/>
          Connect Supabase and seed Tampa data to see pins.
        </div>
      )}
    </div>
  );
}
