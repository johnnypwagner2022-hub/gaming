/**
 * NEXUS ARCADE — main.js
 * Core utilities: navigation, toast, interstitial ads, recently played
 */

/* ─── State ────────────────────────────────── */
let allGames = [];

/* ─── Init ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initToastContainer();
  await loadGamesData();
  initRecentlyPlayed();
  markActivePage();
});

/* ─── Load Games JSON ───────────────────────── */
async function loadGamesData() {
  try {
    const res = await fetch('data/games.json');
    allGames = await res.json();
    // Dispatch so other scripts can react
    document.dispatchEvent(new CustomEvent('gamesLoaded', { detail: allGames }));
  } catch (e) {
    console.warn('Could not load games.json — using empty array.', e);
    allGames = [];
  }
  return allGames;
}

function getGames() { return allGames; }

/* ─── Navigation ───────────────────────────── */
function initNavigation() {
  // Hamburger toggle
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      // Animate bars
      const bars = hamburger.querySelectorAll('span');
      if (isOpen) {
        bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        bars[0].style.transform = '';
        bars[1].style.opacity = '';
        bars[2].style.transform = '';
      }
    });
  }

  // Global nav search
  const navSearchInput = document.querySelector('.nav-search input');
  const dropdown = document.querySelector('.search-results-dropdown');
  if (navSearchInput && dropdown) {
    navSearchInput.addEventListener('input', () => {
      const q = navSearchInput.value.trim().toLowerCase();
      renderSearchDropdown(q, dropdown);
    });
    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = navSearchInput.value.trim();
        if (q) window.location.href = `games.html?search=${encodeURIComponent(q)}`;
      }
      if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        navSearchInput.blur();
      }
    });
    document.addEventListener('click', (e) => {
      if (!navSearchInput.closest('.nav-search').contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  // Mobile search
  const mobileSearchInput = document.querySelector('.mobile-nav .mobile-search input');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = mobileSearchInput.value.trim();
        if (q) window.location.href = `games.html?search=${encodeURIComponent(q)}`;
      }
    });
  }
}

function renderSearchDropdown(query, dropdown) {
  if (!query || query.length < 2) {
    dropdown.classList.remove('open');
    return;
  }
  const results = allGames
    .filter(g =>
      g.title.toLowerCase().includes(query) ||
      g.category.toLowerCase().includes(query) ||
      (g.tags || []).some(t => t.includes(query))
    )
    .slice(0, 6);

  if (results.length === 0) {
    dropdown.innerHTML = `<div class="search-no-results">No games found for "${query}"</div>`;
  } else {
    dropdown.innerHTML = results.map(g => `
      <div class="search-result-item" onclick="window.location.href='game.html?id=${g.id}'">
        <img src="${g.thumbnail}" alt="${g.title}" loading="lazy"
             onerror="this.src='https://picsum.photos/seed/${g.id}/48/28'">
        <div class="search-result-info">
          <div class="title">${g.title}</div>
          <div class="cat">${g.category}</div>
        </div>
      </div>
    `).join('');
  }
  dropdown.classList.add('open');
}

/* ─── Mark active page link ─────────────────── */
function markActivePage() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

/* ─── Toast Notifications ───────────────────── */
function initToastContainer() {
  if (!document.querySelector('.toast-container')) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

function showToast(message, type = 'info', duration = 3000) {
  const container = document.querySelector('.toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: '💡', fav: '❤️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─── Interstitial Ad System ────────────────── */
let skipTimer = null;

function showInterstitialAd(onComplete) {
  let overlay = document.getElementById('interstitial-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'interstitial-overlay';
    overlay.className = 'interstitial-overlay';
    overlay.innerHTML = `
      <div class="interstitial-box">
        <h3>🎮 Loading Game...</h3>
        <p class="text-muted" style="font-size:0.82rem;margin-bottom:4px;">Your game will start in a moment</p>
        <div class="interstitial-ad-space">
          <!-- Google AdSense / Adsterra placement -->
          <div class="ad-label">
            <strong>ADVERTISEMENT</strong>
            <span>728 × 250 Ad Space</span>
          </div>
        </div>
        <button class="interstitial-skip-btn" id="skip-btn" disabled>
          Wait <span id="skip-countdown">5</span>s to Skip
        </button>
        <p class="skip-timer" id="skip-timer-msg">Your game is loading in the background...</p>
      </div>`;
    document.body.appendChild(overlay);
  }

  overlay.classList.add('active');
  const skipBtn = document.getElementById('skip-btn');
  const countdown = document.getElementById('skip-countdown');
  let secs = 5;
  skipBtn.disabled = true;
  countdown.textContent = secs;

  skipTimer = setInterval(() => {
    secs--;
    countdown.textContent = secs;
    if (secs <= 0) {
      clearInterval(skipTimer);
      skipBtn.disabled = false;
      skipBtn.textContent = 'Skip & Play ▶';
    }
  }, 1000);

  skipBtn.onclick = () => {
    clearInterval(skipTimer);
    overlay.classList.remove('active');
    onComplete && onComplete();
  };
}

/* ─── Recently Played ───────────────────────── */
const RECENT_KEY = 'nexus_recent';
const MAX_RECENT = 10;

function addToRecentlyPlayed(game) {
  let recent = getRecentlyPlayed();
  recent = recent.filter(r => r.id !== game.id);
  recent.unshift({ id: game.id, title: game.title, thumbnail: game.thumbnail, category: game.category });
  if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  renderRecentlyPlayedBar();
}

function getRecentlyPlayed() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}

function initRecentlyPlayed() {
  renderRecentlyPlayedBar();
}

function renderRecentlyPlayedBar() {
  const bar = document.getElementById('recently-played-bar');
  if (!bar) return;
  const recent = getRecentlyPlayed();
  if (recent.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  const inner = bar.querySelector('.recently-played-inner');
  if (!inner) return;
  inner.innerHTML = `
    <span class="recently-label">⏱ Recent</span>
    ${recent.map(g => `
      <div class="recent-game-chip" onclick="window.location.href='game.html?id=${g.id}'">
        <img src="${g.thumbnail}" alt="${g.title}" onerror="this.src='https://picsum.photos/seed/${g.id}/32/20'">
        ${g.title}
      </div>
    `).join('')}`;
}

/* ─── Increment play count (simulated) ──────── */
function incrementPlayCount(gameId) {
  const key = `nexus_plays_${gameId}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, current + 1);
}

function getPlayCount(gameId) {
  return parseInt(localStorage.getItem(`nexus_plays_${gameId}`) || '0', 10);
}

/* ─── Format numbers ────────────────────────── */
function formatPlays(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

/* ─── Render star rating ────────────────────── */
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ─── Sanitize HTML (XSS prevention) ────────── */
function sanitize(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

/* ─── Debounce ───────────────────────────────── */
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* ─── Lazy image loading ────────────────────── */
function initLazyImages() {
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    document.querySelectorAll('img[data-src]').forEach(img => obs.observe(img));
  } else {
    // Fallback for older browsers
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
  }
}

/* ─── Get URL params ─────────────────────────── */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ─── Export globals ─────────────────────────── */
window.NexusArcade = {
  getGames,
  loadGamesData,
  showToast,
  showInterstitialAd,
  addToRecentlyPlayed,
  getRecentlyPlayed,
  incrementPlayCount,
  formatPlays,
  renderStars,
  sanitize,
  debounce,
  initLazyImages,
  getParam,
};
