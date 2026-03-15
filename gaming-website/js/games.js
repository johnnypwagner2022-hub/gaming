/**
 * NEXUS ARCADE — games.js
 * Handles game card rendering, filtering, sorting, and pagination.
 */

/* ─── Config ──────────────────────────────── */
const CARDS_PER_PAGE = 20;
let currentPage = 1;
let filteredGames = [];

/* ─── Category metadata ───────────────────── */
const CATEGORIES = [
  { name: 'Action',      icon: '💥', cls: 'cat-action' },
  { name: 'Shooter',     icon: '🔫', cls: 'cat-shooter' },
  { name: 'Puzzle',      icon: '🧩', cls: 'cat-puzzle' },
  { name: 'Sports',      icon: '⚽', cls: 'cat-sports' },
  { name: 'Racing',      icon: '🏎️', cls: 'cat-racing' },
  { name: 'Platformer',  icon: '🕹️', cls: 'cat-platform' },
  { name: 'Multiplayer', icon: '👥', cls: 'cat-multi' },
  { name: 'Adventure',   icon: '🗺️', cls: 'cat-adventure' },
  { name: 'Strategy',    icon: '♟️', cls: 'cat-strategy' },
  { name: 'Arcade',      icon: '🎮', cls: 'cat-arcade' },
];

/* ─── Build a single game card HTML ─────────── */
function buildGameCard(game, size = 'normal') {
  const { NA } = window;
  const isFav = isFavorite(game.id);
  const favClass = isFav ? 'active' : '';
  const trendingBadge = game.trending
    ? `<span class="badge-trending">🔥 Hot</span>` : '';
  const plays = window.NexusArcade ? window.NexusArcade.formatPlays(game.plays) : game.plays;

  return `
    <div class="game-card fade-in" data-id="${game.id}" data-category="${game.category}"
         onclick="handleCardClick(${game.id}, event)">
      <div class="game-card-thumb">
        <img data-src="${game.thumbnail}"
             src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect fill='%230d1525' width='16' height='9'/%3E%3C/svg%3E"
             alt="${game.title}" loading="lazy"
             onerror="this.src='https://picsum.photos/seed/${game.id}alt/400/225'">
        <div class="game-card-cat">${game.category}</div>
        ${trendingBadge}
        <div class="game-card-thumb-overlay">
          <div class="play-btn-overlay">▶</div>
        </div>
      </div>
      <div class="game-card-body">
        <div class="game-card-title" title="${game.title}">${game.title}</div>
        <div class="game-card-meta">
          <span class="game-rating">⭐ ${game.rating}</span>
          <span class="game-plays">${plays} plays</span>
        </div>
      </div>
      <button class="fav-btn ${favClass}" aria-label="Favorite"
              onclick="toggleFavoriteBtn(${game.id}, this, event)">
        ${isFav ? '❤️' : '🤍'}
      </button>
    </div>`;
}

/* ─── Handle card click (interstitial) ──────── */
function handleCardClick(gameId, event) {
  // Ignore if fav button triggered it
  if (event.target.closest('.fav-btn')) return;
  if (window.NexusArcade) {
    window.NexusArcade.showInterstitialAd(() => {
      window.location.href = `game.html?id=${gameId}`;
    });
  } else {
    window.location.href = `game.html?id=${gameId}`;
  }
}

/* ─── Render grid of cards ───────────────────── */
function renderGamesGrid(container, games, showSkeleton = false) {
  if (!container) return;
  if (showSkeleton) {
    container.innerHTML = Array(8).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`).join('');
    return;
  }
  if (games.length === 0) {
    container.innerHTML = `
      <div class="no-results" style="grid-column:1/-1">
        <span class="icon">🔍</span>
        <h3>No games found</h3>
        <p>Try adjusting your filters or search query.</p>
      </div>`;
    return;
  }
  container.innerHTML = games.map(g => buildGameCard(g)).join('');
  if (window.NexusArcade) window.NexusArcade.initLazyImages();
}

/* ─── Category cards ────────────────────────── */
function renderCategoriesGrid(container, games) {
  if (!container) return;
  const counts = {};
  games.forEach(g => {
    counts[g.category] = (counts[g.category] || 0) + 1;
  });
  container.innerHTML = CATEGORIES.map(cat => `
    <div class="category-card ${cat.cls}" onclick="window.location.href='categories.html?cat=${encodeURIComponent(cat.name)}'">
      <div class="category-icon">${cat.icon}</div>
      <h3>${cat.name}</h3>
      <span class="count">${counts[cat.name] || 0} games</span>
    </div>`).join('');
}

/* ─── Filter & Sort ─────────────────────────── */
function filterAndSortGames(games, { search = '', category = 'All', sort = 'popular' } = {}) {
  let result = [...games];

  // Search
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (g.description || '').toLowerCase().includes(q)
    );
  }

  // Category filter
  if (category && category !== 'All') {
    result = result.filter(g => g.category === category);
  }

  // Sort
  switch (sort) {
    case 'popular':
      result.sort((a, b) => b.plays - a.plays); break;
    case 'newest':
      result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)); break;
    case 'alpha':
      result.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating); break;
    case 'trending':
      result.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.plays - a.plays); break;
    default:
      result.sort((a, b) => b.plays - a.plays);
  }

  return result;
}

/* ─── Paginate ──────────────────────────────── */
function paginateGames(games, page, perPage = CARDS_PER_PAGE) {
  const start = (page - 1) * perPage;
  return games.slice(start, start + perPage);
}

function renderPagination(container, totalGames, currentPage, perPage = CARDS_PER_PAGE) {
  if (!container) return;
  const totalPages = Math.ceil(totalGames / perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div style="display:flex;justify-content:center;gap:8px;padding:32px 0;flex-wrap:wrap;">';
  if (currentPage > 1) {
    html += `<button class="btn btn-ghost btn-sm" onclick="changePage(${currentPage - 1})">← Prev</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="btn btn-primary btn-sm">${i}</button>`;
    } else if (Math.abs(i - currentPage) <= 2 || i === 1 || i === totalPages) {
      html += `<button class="btn btn-ghost btn-sm" onclick="changePage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 3) {
      html += `<span style="padding:7px 6px;color:var(--text-muted)">...</span>`;
    }
  }
  if (currentPage < totalPages) {
    html += `<button class="btn btn-ghost btn-sm" onclick="changePage(${currentPage + 1})">Next →</button>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

/* changePage is set globally from the page that uses pagination */
function changePage(page) {
  currentPage = page;
  const container = document.getElementById('games-grid');
  const paginationEl = document.getElementById('pagination');
  if (container) {
    const paginated = paginateGames(filteredGames, page);
    renderGamesGrid(container, paginated);
    renderPagination(paginationEl, filteredGames.length, page);
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ─── Featured / Trending helpers ─────────── */
function getFeaturedGames(games, n = 6) {
  return games.filter(g => g.featured).slice(0, n);
}

function getTrendingGames(games, n = 8) {
  return games
    .filter(g => g.trending)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, n);
}

function getRecentGames(games, n = 8) {
  return [...games]
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, n);
}

function getRelatedGames(game, games, n = 4) {
  return games
    .filter(g => g.id !== game.id && g.category === game.category)
    .sort(() => Math.random() - 0.5)
    .slice(0, n);
}

/* ─── Favorites helpers (dependency-aware) ──── */
function isFavorite(id) {
  if (window.NexusFavorites) return window.NexusFavorites.isFavorite(id);
  try {
    const favs = JSON.parse(localStorage.getItem('nexus_favs') || '[]');
    return favs.some(f => f.id === id);
  } catch { return false; }
}

function toggleFavoriteBtn(gameId, btn, event) {
  event.stopPropagation();
  if (window.NexusFavorites) {
    const isNowFav = window.NexusFavorites.toggle(gameId);
    btn.classList.toggle('active', isNowFav);
    btn.textContent = isNowFav ? '❤️' : '🤍';
    window.NexusArcade?.showToast(
      isNowFav ? 'Added to favorites!' : 'Removed from favorites',
      isNowFav ? 'fav' : 'info'
    );
  }
}

/* ─── Export ─────────────────────────────── */
window.NexusGames = {
  buildGameCard,
  renderGamesGrid,
  renderCategoriesGrid,
  filterAndSortGames,
  paginateGames,
  renderPagination,
  getFeaturedGames,
  getTrendingGames,
  getRecentGames,
  getRelatedGames,
  CATEGORIES,
  get filteredGames() { return filteredGames; },
  set filteredGames(v) { filteredGames = v; },
  get currentPage() { return currentPage; },
  set currentPage(v) { currentPage = v; },
};

// Also expose for inline onclick
window.handleCardClick = handleCardClick;
window.toggleFavoriteBtn = toggleFavoriteBtn;
window.changePage = changePage;
