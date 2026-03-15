/**
 * NEXUS ARCADE — search.js
 * Page-level live search for the games page.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageSearch();
});

function initPageSearch() {
  const searchInput = document.getElementById('page-search-input');
  if (!searchInput) return;

  // Debounced handler
  const handler = window.NexusArcade
    ? window.NexusArcade.debounce(handleSearch, 200)
    : handleSearch;

  searchInput.addEventListener('input', handler);

  // Pre-fill from URL param
  const q = new URLSearchParams(window.location.search).get('search');
  if (q) {
    searchInput.value = q;
    // Trigger search once games are loaded
    document.addEventListener('gamesLoaded', () => handler());
  }
}

function handleSearch() {
  const input = document.getElementById('page-search-input');
  const q = input ? input.value.trim() : '';

  // Trigger re-filter on the games page
  if (window.applyFilters) {
    window.applyFilters();
  }
}

/* ─── Highlight search term in text ─────────── */
function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:rgba(0,229,255,0.25);color:var(--cyan);border-radius:2px;">$1</mark>');
}

window.NexusSearch = { highlightText };
