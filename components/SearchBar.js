// components/SearchBar.js — Search-as-you-type: 700ms debounce, 3-char minimum
'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch, loading, initValue = '' }) {
  const [value, setValue] = useState(initValue);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const isMounted = useRef(false);

  // Sync initValue when nav bar mounts with current query
  useEffect(() => {
    if (initValue) setValue(initValue);
  }, [initValue]);

  // Debounced search: 700ms delay + require at least 3 chars (or empty to clear)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    // Only search if 3+ chars or completely empty (to go back to landing)
    if (trimmed.length > 0 && trimmed.length < 3) return;
    debounceRef.current = setTimeout(() => {
      onSearch(trimmed);
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e) {
    e?.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(value.trim());
  }

  function clear() {
    setValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch('');
    inputRef.current?.focus();
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
        <button type="submit" className={styles.btn} disabled={!value.trim()} aria-label="Search">↗</button>
      )}
    </form>
  );
}
