// components/SearchBar.js — Submit-only search (Enter or button click)
'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch, loading, initValue = '' }) {
  const [value, setValue] = useState(initValue);
  const inputRef = useRef(null);

  // Sync initValue when nav bar mounts with current query
  useEffect(() => {
    if (initValue) setValue(initValue);
  }, [initValue]);

  function submit(e) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  function clear() {
    setValue('');
    onSearch('');
    inputRef.current?.focus();
  }

  return (
    <form className={styles.wrap} onSubmit={submit} role="search">
      <span className={styles.icon}>🔍</span>
      <input
        ref={inputRef}
        id="main-search"
        type="text"
        className={styles.input}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search tours, events, dining, nightlife…"
        autoComplete="off"
        aria-label="Search City Tour Guide"
      />
      {value && !loading && (
        <button type="button" className={styles.clearBtn} onClick={clear} aria-label="Clear search">✕</button>
      )}
      {loading ? (
        <span className={styles.spinner} aria-label="Searching…" />
      ) : (
        <button type="submit" className={styles.btn} disabled={!value.trim()} aria-label="Search">Search</button>
      )}
    </form>
  );
}
