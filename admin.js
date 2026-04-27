function fmt(n) {
  return '$' + n.toLocaleString('es-CO');
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

const CLOCK_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const CHECK_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const CASH_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`;
const NEQUI_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><polyline points="8,16 8,8 16,16 16,8"/></svg>`;
const DAVI_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 8v8h2a4 4 0 0 0 0-8H9z"/></svg>`;
const BELL_SVG     = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const BELL_OFF_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

const PAYMENT_LABELS = { efectivo: 'Efectivo', nequi: 'Nequi', daviplata: 'Daviplata' };

let allOrders = {};
let timeInterval = null;
let prevPendingCount = -1;

// ── SOUND ──
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

function playBeep() {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function updateSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  if (!btn) return;
  btn.classList.toggle('active', soundEnabled);
  btn.title = soundEnabled ? 'Silenciar alertas' : 'Activar alertas de sonido';
  btn.innerHTML = soundEnabled ? BELL_SVG : BELL_OFF_SVG;
}

// ── QUEUE ──
function renderQueue(orders) {
  const queue = document.getElementById('order-queue');
  const pending = Object.entries(orders)
    .filter(([, o]) => o.estado === 'pendiente')
    .sort(([, a], [, b]) => a.turno - b.turno);

  document.getElementById('pending-badge').textContent = pending.length;

  if (pending.length === 0) {
    queue.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
        </div>
        <p>Sin pedidos pendientes</p>
      </div>`;
    return;
  }

  queue.innerHTML = '';

  pending.forEach(([key, order]) => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.key = key;

    const itemsHtml = (order.items || [])
      .map(i => `
        <div class="order-item-row">
          <span><span class="qty">${i.cantidad}×</span> ${i.nombre}</span>
          <span>${fmt(i.precio * i.cantidad)}</span>
        </div>`)
      .join('');

    const method = order.metodoPago || 'efectivo';
    const badgeIcon = method === 'efectivo' ? CASH_SVG : method === 'nequi' ? NEQUI_SVG : DAVI_SVG;
    const paymentBadge = `
      <span class="payment-badge ${method === 'efectivo' ? 'cash' : method}">
        ${badgeIcon}
        ${PAYMENT_LABELS[method] || 'Efectivo'}
      </span>`;

    card.innerHTML = `
      <div class="order-card-header">
        <div class="order-card-left">
          <div class="turno-badge">#${order.turno}</div>
          <div>
            <div class="client-name">${escapeHtml(order.nombre)}</div>
            <div class="card-meta">
              <div class="time-ago" data-ts="${order.timestamp}">${CLOCK_SVG}${timeAgo(order.timestamp)}</div>
              ${paymentBadge}
            </div>
          </div>
        </div>
        <button class="btn-complete" data-key="${key}">${CHECK_SVG}Listo</button>
      </div>
      <div class="order-items">${itemsHtml}</div>
      <div class="order-footer">
        <span class="order-total">${fmt(order.total)}</span>
      </div>
    `;

    queue.appendChild(card);
  });
}

function renderStats(orders) {
  const completed = Object.values(orders).filter(o => o.estado === 'completado');

  const revenue = completed.reduce((s, o) => s + (o.total || 0), 0);
  document.getElementById('stat-revenue').textContent = fmt(revenue);
  document.getElementById('stat-orders').textContent = completed.length;

  const itemCount = {};
  completed.forEach(order => {
    (order.items || []).forEach(i => {
      itemCount[i.nombre] = (itemCount[i.nombre] || 0) + i.cantidad;
    });
  });

  const ranked = Object.entries(itemCount).sort(([, a], [, b]) => b - a);
  const rankEl = document.getElementById('ranking-list');

  if (ranked.length === 0) {
    rankEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">Sin datos aún</p>';
    return;
  }

  rankEl.innerHTML = ranked
    .map(([name, qty]) => `
      <div class="rank-item">
        <span>${name}</span>
        <span class="rank-qty">${qty}</span>
      </div>`)
    .join('');
}

function startTimeRefresh() {
  if (timeInterval) clearInterval(timeInterval);
  timeInterval = setInterval(() => {
    document.querySelectorAll('.time-ago[data-ts]').forEach(el => {
      const svg = el.querySelector('svg');
      el.textContent = timeAgo(Number(el.dataset.ts));
      if (svg) el.prepend(svg);
    });
  }, 30000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── COMPLETE ORDER ──
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-complete');
  if (!btn) return;
  const key = btn.dataset.key;
  const card = document.querySelector(`.order-card[data-key="${key}"]`);
  btn.disabled = true;
  if (card) {
    card.classList.add('removing');
    card.addEventListener('transitionend', () => {
      db.ref(`pedidos/${key}/estado`).set('completado');
    }, { once: true });
  } else {
    db.ref(`pedidos/${key}/estado`).set('completado');
  }
});

// ── FIREBASE LISTENER ──
db.ref('pedidos').on('value', snap => {
  allOrders = snap.val() || {};
  const currentPending = Object.values(allOrders).filter(o => o.estado === 'pendiente').length;
  if (prevPendingCount >= 0 && currentPending > prevPendingCount) playBeep();
  prevPendingCount = currentPending;
  renderQueue(allOrders);
  renderStats(allOrders);
});

startTimeRefresh();
updateSoundToggle();

// ── SOUND TOGGLE ──
document.getElementById('sound-toggle').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  updateSoundToggle();
});

// ── STATS TOGGLE ──
const statsBtn = document.getElementById('stats-btn');
const statsBody = document.getElementById('stats-body');
statsBtn.addEventListener('click', () => {
  const isOpen = statsBody.classList.toggle('open');
  statsBtn.classList.toggle('open', isOpen);
});

// ── CLOSE DAY ──
document.getElementById('close-day-btn').addEventListener('click', () => {
  const confirmed = window.confirm('¿Seguro? Esto borrará todos los pedidos de hoy');
  if (!confirmed) return;
  db.ref('pedidos').remove().then(() => {
    allOrders = {};
    prevPendingCount = 0;
    renderQueue({});
    renderStats({});
  });
});
