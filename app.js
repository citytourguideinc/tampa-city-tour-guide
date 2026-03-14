/**
 * Tampa City Tour Guide — app.js
 * Handles: search filtering, category tab navigation, UI interactions
 */

(function () {
  'use strict';

  // ── Element refs ──────────────────────────────────────────────
  const searchInput  = document.getElementById('searchInput');
  const clearBtn     = document.getElementById('clearSearch');
  const catBtns      = document.querySelectorAll('.cat-btn');
  const topSections  = document.querySelectorAll('.top-section');
  const subGroups    = document.querySelectorAll('.sub-group');
  const cards        = document.querySelectorAll('.resource-card');
  const emptyState   = document.getElementById('emptyState');
  const resetSearch  = document.getElementById('resetSearch');

  let activeCategory = 'all';
  let searchQuery    = '';

  // ── Category filter ──────────────────────────────────────────
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      applyFilters();

      // Smooth scroll to content
      document.getElementById('mainContent').scrollIntoView({
        behavior: 'smooth', block: 'start'
      });
    });
  });

  // ── Search ───────────────────────────────────────────────────
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    clearBtn.classList.toggle('visible', searchQuery.length > 0);

    // If searching, reset category to "all" visually
    if (searchQuery) {
      catBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-cat="all"]').classList.add('active');
      activeCategory = 'all';
    }

    applyFilters();
  });

  clearBtn.addEventListener('click', resetFilters);
  resetSearch.addEventListener('click', resetFilters);

  function resetFilters() {
    searchInput.value = '';
    searchQuery = '';
    activeCategory = 'all';
    clearBtn.classList.remove('visible');
    catBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-cat="all"]').classList.add('active');
    applyFilters();
    searchInput.focus();
  }

  // ── Core filter logic ─────────────────────────────────────────
  function applyFilters() {
    let visibleCardCount = 0;

    // 1. Filter each card
    cards.forEach(card => {
      const name    = (card.dataset.name || '').toLowerCase();
      const catAttr = card.dataset.cat || '';

      const matchesCat    = activeCategory === 'all' || catAttr === activeCategory;
      const matchesSearch = !searchQuery || name.includes(searchQuery);
      const visible       = matchesCat && matchesSearch;

      card.classList.toggle('hidden', !visible);
      card.classList.toggle('highlight', visible && searchQuery.length > 0);

      if (visible) visibleCardCount++;
    });

    // 2. Hide sub-groups with no visible cards
    subGroups.forEach(group => {
      const hasVisible = group.querySelectorAll('.resource-card:not(.hidden)').length > 0;
      group.classList.toggle('hidden', !hasVisible);
    });

    // 3. Hide top-level sections with no visible cards
    topSections.forEach(section => {
      const catAttr = section.dataset.cat || '';
      const catMatch = activeCategory === 'all' || catAttr === activeCategory;
      const hasVisible = section.querySelectorAll('.resource-card:not(.hidden)').length > 0;

      section.classList.toggle('hidden', !catMatch || !hasVisible);
    });

    // 4. Show/hide empty state
    emptyState.style.display = visibleCardCount === 0 ? 'block' : 'none';
  }

  // ── Keyboard shortcut: "/" focuses search ────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      resetFilters();
      searchInput.blur();
    }
  });

  // ── Card entrance animations (Intersection Observer) ─────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = `opacity 0.35s ease ${i * 0.03}s, transform 0.35s ease ${i * 0.03}s, background 0.22s, border-color 0.22s, box-shadow 0.22s`;
    observer.observe(card);
  });

  // Init
  applyFilters();
})();
