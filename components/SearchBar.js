// components/SearchBar.js — Search-as-you-type with 300ms debounce
'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search-as-you-type
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e) {
    e?.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch(value.trim());
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
        type="search"
        className={styles.input}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Ask anything — tours, events, free things, nightlife…"
        autoComplete="off"
        aria-label="Search City Tour Guide"
      />
      {value && !loading && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={clear}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      {loading ? (
        <span className={styles.spinner} aria-label="Searching…" />
      ) : (
        <button
          type="submit"
          className={styles.btn}
          disabled={!value.trim()}
          aria-label="Search"
        >
          ↗
        </button>
      )}
    </form>
  );
}
