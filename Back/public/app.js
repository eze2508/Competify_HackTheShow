// app.js

// ==== CONFIG ====
const API_URL = "https://competify-hacktheshow.onrender.com";

// Guardado del token (si viene en la URL)
(function saveTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('app_token', token);
    // limpia la URL para que no quede expuesto
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();

// Util: obtener headers con Authorization si tenemos token
function getAuthHeaders() {
  const token = localStorage.getItem('app_token');
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

// ---- Login (redirecciona al backend) ----
function login() {
  window.location.href = `${API_URL}/auth/login`;
}

// ---- Requests básicos ----
function safeFetch(url, opts = {}) {
  opts.headers = Object.assign({}, opts.headers || {}, getAuthHeaders());
  opts.credentials = 'include';
  return fetch(url, opts).then(async res => {
    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      throw new Error(`HTTP ${res.status} - ${text || res.statusText}`);
    }
    return res.json().catch(()=>null);
  });
}

// ---- Current / Stats (existentes) ----
function getCurrentTrack() {
  safeFetch(`${API_URL}/me/current`)
    .then(data => mostrarEnOutput(data))
    .catch(err => mostrarEnOutput({ error: err.message }));
}

function getStats() {
  safeFetch(`${API_URL}/me/stats`)
    .then(data => mostrarEnOutput(data))
    .catch(err => mostrarEnOutput({ error: err.message }));
}

function mostrarEnOutput(data) {
  const output = document.getElementById("output");
  output.textContent = JSON.stringify(data, null, 2);
}

// ---- NEW: Search tracks ----
function searchTracks() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) {
    alert('Ingresá un término de búsqueda');
    return;
  }
  safeFetch(`${API_URL}/search?q=${encodeURIComponent(q)}`)
    .then(renderSearchResults)
    .catch(err => mostrarEnOutput({ error: err.message }));
}

// Render de resultados
function renderSearchResults(tracks) {
  const container = document.getElementById('searchResults');
  container.innerHTML = '';
  if (!tracks || tracks.length === 0) {
    container.textContent = 'No se encontraron resultados.';
    return;
  }

  tracks.forEach(t => {
    const card = document.createElement('div');
    card.className = 'track-card';
    card.onclick = () => getTopListeners(t.track_id);

    const img = document.createElement('img');
    img.src = t.album_image_url || '';
    img.alt = 'cover';

    const info = document.createElement('div');
    info.className = 'track-info';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t.name;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${t.artist} — ${t.album}`;

    info.appendChild(title);
    info.appendChild(meta);

    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
  });
}

// ---- NEW: Top listeners for a track ----
function getTopListeners(trackId) {
  safeFetch(`${API_URL}/tracks/${encodeURIComponent(trackId)}/top`)
    .then(renderTopListeners)
    .catch(err => {
      mostrarEnOutput({ error: err.message });
    });
}

function renderTopListeners(listeners) {
  const container = document.getElementById('topListeners');
  container.innerHTML = '';

  if (!listeners || listeners.length === 0) {
    container.textContent = 'No hay oyentes para esta canción.';
    return;
  }

  listeners.forEach((l, idx) => {
    const div = document.createElement('div');
    div.className = 'top-item';
    const minutes = Math.round((l.total_ms || 0) / 1000 / 60);
    div.textContent = `${idx + 1}. ${l.user} — ${minutes} minutos`;
    container.appendChild(div);
  });
}

// ---- DOM Events ----
document.getElementById('loginBtn').onclick = login;
document.getElementById('currentBtn').onclick = getCurrentTrack;
document.getElementById('statsBtn').onclick = getStats;
document.getElementById('searchBtn').onclick = searchTracks;

// also enter key on search input
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchTracks();
});
