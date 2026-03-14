// components/SearchBar.js
'use client';
import { useState, useRef } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  function submit(e) {
    e?.preventDefault();
    const q = value.trim();
    if (q) onSearch(q);
  }

  function handleKey(e) {
    if (e.key === 'Enter') submit();
  }

  return (
    <form className={styles.wrap} onSubmit={submit} role="search">
      <span className={styles.icon}>🔍</span>
      <input
        ref={inputRef}
        id="main-search"
        type="search"
        className={styles.input}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask anything — tours, events, free things, nightlife…"
        autoComplete="off"
        aria-label="Search Tampa City Tour Guide"
      />
      {loading ? (
        <span className={styles.spinner} aria-label="Searching…">⏳</span>
      ) : (
        <button type="submit" className={styles.btn} disabled={!value.trim()} aria-label="Search">
          <span>↗</span>
        </button>
      )}
    </form>
  );
}
