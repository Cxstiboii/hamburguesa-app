const MENU = [
  { id: 'burg-sencilla',  icon: 'burger', name: 'Hamburguesa sencilla',    price: 10000 },
  { id: 'burg-doble',     icon: 'burger', name: 'Hamburguesa doble carne', price: 14000 },
  { id: 'burg-especial',  icon: 'burger', name: 'Hamburguesa especial',    price: 18000 },
  { id: 'burg-bbq',       icon: 'burger', name: 'Hamburguesa BBQ',         price: 16000 },
  { id: 'papas-pequeñas', icon: 'fries',  name: 'Papas fritas pequeñas',  price: 5000  },
  { id: 'papas-grandes',  icon: 'fries',  name: 'Papas fritas grandes',    price: 8000  },
  { id: 'gaseosa',        icon: 'drink',  name: 'Gaseosa',                 price: 3000  },
  { id: 'agua',           icon: 'water',  name: 'Agua',                    price: 2000  },
];

const ITEM_ICONS = {
  burger: `<svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 16h18"/><path d="M5 8h14c0-3.5-14-3.5-14 0z"/></svg>`,
  fries:  `<svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19h12l2-10H4L6 19z"/><path d="M9 9V4M12 9V2M15 9V5"/></svg>`,
  drink:  `<svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h14l-1.5 13A2 2 0 0 1 15.5 21h-7a2 2 0 0 1-2-1.86L5 6z"/><path d="M5 6h14M9 2h6"/></svg>`,
  water:  `<svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L6.5 9a6 6 0 1 0 11 0L12 2z"/></svg>`,
};

const MESSAGES = [
  'Tu pedido está siendo preparado.',
  'En breve estará listo.',
  'Gracias por tu pedido.',
  'Llamaremos tu número pronto.',
];

const PAYMENT_LABELS = { efectivo: 'Efectivo', nequi: 'Nequi', daviplata: 'Daviplata' };

let selectedPayment = 'efectivo';
let orderListener = null;

const quantities = {};
MENU.forEach(item => (quantities[item.id] = 0));

function fmt(n) {
  return '$' + n.toLocaleString('es-CO');
}

function getTotal() {
  return MENU.reduce((sum, item) => sum + item.price * (quantities[item.id] || 0), 0);
}

function getOrderItems() {
  return MENU
    .filter(item => quantities[item.id] > 0)
    .map(item => ({ nombre: item.name, cantidad: quantities[item.id], precio: item.price }));
}

function updateCard(id) {
  const qty = quantities[id];
  const card = document.querySelector(`[data-id="${id}"]`);
  if (!card) return;
  card.querySelector('.qty-value').textContent = qty;
  card.classList.toggle('has-quantity', qty > 0);
  card.querySelector('.qty-btn.minus').disabled = qty === 0;
}

function updateUI() {
  const total = getTotal();
  const nameVal = document.getElementById('client-name').value.trim();
  document.getElementById('total-display').textContent = fmt(total);
  document.getElementById('order-btn').disabled = !total || !nameVal;
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  grid.innerHTML = '';

  MENU.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.dataset.id = item.id;
    card.innerHTML = `
      ${ITEM_ICONS[item.icon]}
      <span class="item-name">${item.name}</span>
      <span class="item-price">${fmt(item.price)}</span>
      <div class="qty-controls">
        <button class="qty-btn minus" data-action="minus" data-id="${item.id}" disabled>−</button>
        <span class="qty-value">0</span>
        <button class="qty-btn plus" data-action="plus" data-id="${item.id}">+</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'plus') quantities[id]++;
    else if (action === 'minus' && quantities[id] > 0) quantities[id]--;
    updateCard(id);
    updateUI();
  });
}

async function getNextTurno() {
  const snap = await db.ref('pedidos').orderByChild('turno').limitToLast(1).once('value');
  let last = 0;
  snap.forEach(child => { last = child.val().turno || 0; });
  return last + 1;
}

async function submitOrder() {
  const btn = document.getElementById('order-btn');
  const name = document.getElementById('client-name').value.trim();
  const items = getOrderItems();
  if (!name || items.length === 0) return;

  btn.disabled = true;
  btn.textContent = 'Enviando…';

  try {
    const turno = await getNextTurno();
    const pedido = {
      turno,
      nombre: name,
      items,
      total: getTotal(),
      estado: 'pendiente',
      metodoPago: selectedPayment,
      timestamp: Date.now(),
    };

    const ref = await db.ref('pedidos').push(pedido);
    showConfirmation(turno, pedido, ref.key);
  } catch (err) {
    alert('Error al enviar el pedido. Intenta de nuevo.');
    btn.disabled = false;
    btn.textContent = 'Pedir';
  }
}

// ── ORDER READY NOTIFICATION ──
function playReadySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[523, 0], [659, 0.18], [784, 0.36]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.28, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.45);
    });
  } catch (e) {}
}

function onOrderReady() {
  if ('vibrate' in navigator) navigator.vibrate([180, 90, 180, 90, 350]);
  playReadySound();

  const screen = document.querySelector('.confirm-screen');
  if (screen) screen.classList.add('order-ready');
  const msg = document.getElementById('confirm-message');
  if (msg) msg.textContent = '¡Tu pedido está listo! Pasa a recogerlo.';
}

function listenForOrderCompletion(orderKey) {
  if (orderListener) {
    orderListener.ref.off('value', orderListener.fn);
    orderListener = null;
  }
  const ref = db.ref(`pedidos/${orderKey}/estado`);
  const fn = snap => {
    if (snap.val() === 'completado') {
      ref.off('value', fn);
      orderListener = null;
      onOrderReady();
    }
  };
  ref.on('value', fn);
  orderListener = { ref, fn };
}

function showConfirmation(turno, pedido, orderKey) {
  document.getElementById('menu-view').classList.add('hidden');
  document.getElementById('confirm-view').classList.remove('hidden');
  document.querySelector('.confirm-screen').classList.remove('order-ready');

  document.getElementById('confirm-turno').textContent = turno;
  document.getElementById('confirm-message').textContent =
    MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  document.getElementById('confirm-total').textContent = fmt(pedido.total);
  document.getElementById('confirm-payment').textContent =
    PAYMENT_LABELS[pedido.metodoPago] || 'Efectivo';

  const ul = document.getElementById('confirm-items');
  ul.innerHTML = pedido.items
    .map(i => `<li><span>${i.cantidad}× ${i.nombre}</span><span>${fmt(i.precio * i.cantidad)}</span></li>`)
    .join('');

  if (orderKey) listenForOrderCompletion(orderKey);
}

function resetOrder() {
  if (orderListener) {
    orderListener.ref.off('value', orderListener.fn);
    orderListener = null;
  }
  MENU.forEach(item => (quantities[item.id] = 0));
  document.getElementById('client-name').value = '';
  document.getElementById('confirm-view').classList.add('hidden');
  document.getElementById('menu-view').classList.remove('hidden');
  document.querySelector('.confirm-screen').classList.remove('order-ready');
  MENU.forEach(item => updateCard(item.id));
  selectedPayment = 'efectivo';
  document.querySelectorAll('.payment-opt').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-method="efectivo"]').classList.add('active');
  updateUI();
}

// ── INIT ──
renderMenu();
updateUI();

document.getElementById('client-name').addEventListener('input', updateUI);
document.getElementById('order-btn').addEventListener('click', submitOrder);
document.getElementById('new-order-btn').addEventListener('click', resetOrder);

document.querySelectorAll('.payment-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.payment-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPayment = btn.dataset.method;
  });
});
