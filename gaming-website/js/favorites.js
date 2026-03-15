/**
 * NEXUS ARCADE — favorites.js
 * LocalStorage-based favorites system.
 */

const FAV_KEY = 'nexus_favs';

/* ─── Core Ops ──────────────────────────── */
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  } catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function isFavorite(id) {
  return getFavorites().some(f => f.id === id);
}

function addFavorite(game) {
  const favs = getFavorites();
  if (!favs.some(f => f.id === game.id)) {
    favs.unshift({
      id: game.id,
      title: game.title,
      thumbnail: game.thumbnail,
      category: game.category,
      rating: game.rating,
      plays: game.plays,
    });
    saveFavorites(favs);
    return true;
  }
  return false;
}

function removeFavorite(id) {
  const favs = getFavorites().filter(f => f.id !== id);
  saveFavorites(favs);
}

function toggleFavorite(id) {
  const games = window.NexusArcade ? window.NexusArcade.getGames() : [];
  if (isFavorite(id)) {
    removeFavorite(id);
    return false;
  } else {
    const game = games.find(g => g.id === id);
    if (game) addFavorite(game);
    return true;
  }
}

/* ─── Render Favorites Page ─────────────── */
function renderFavoritesPage() {
  const container = document.getElementById('favorites-grid');
  const emptyState = document.getElementById('favorites-empty');
  const countEl = document.getElementById('fav-count');
  if (!container) return;

  const favs = getFavorites();

  if (countEl) countEl.textContent = favs.length;

  if (favs.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  // Merge with full game data for complete card
  const allGames = window.NexusArcade ? window.NexusArcade.getGames() : [];
  const fullFavs = favs.map(f => {
    const full = allGames.find(g => g.id === f.id);
    return full || f;
  });

  if (window.NexusGames) {
    window.NexusGames.renderGamesGrid(container, fullFavs);
  }
}

/* ─── Sync all fav buttons on page ──────── */
function syncFavButtons() {
  document.querySelectorAll('.fav-btn[data-id]').forEach(btn => {
    const id = parseInt(btn.dataset.id, 10);
    const active = isFavorite(id);
    btn.classList.toggle('active', active);
    btn.textContent = active ? '❤️' : '🤍';
  });
}

/* ─── Init on favorites page ─────────────── */
document.addEventListener('gamesLoaded', () => {
  if (document.getElementById('favorites-grid')) {
    renderFavoritesPage();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('favorites-grid')) {
    renderFavoritesPage();
  }
  syncFavButtons();
});

/* ─── Export ─────────────────────────────── */
window.NexusFavorites = {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggle: toggleFavorite,
  renderFavoritesPage,
  syncFavButtons,
};
