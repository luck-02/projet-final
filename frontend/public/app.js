const CATALOGUE_URL = '/api/catalogue';
const ORDERS_URL = '/api/orders';

function log(level, message) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message }));
}

async function loadProducts() {
  try {
    const res = await fetch(`${CATALOGUE_URL}/products`);
    const products = await res.json();
    const tbody = document.getElementById('products-body');
    const select = document.getElementById('product-select');

    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${parseFloat(p.price).toFixed(2)}</td>
        <td>${p.stock}</td>
      </tr>
    `).join('');

    select.innerHTML = '<option value="">-- choisir --</option>' +
      products.map(p => `<option value="${p.id}">${p.name} — ${parseFloat(p.price).toFixed(2)} €</option>`).join('');
  } catch (err) {
    log('error', `loadProducts: ${err.message}`);
    document.getElementById('products-body').innerHTML =
      '<tr><td colspan="4" class="muted">Erreur de chargement</td></tr>';
  }
}

async function loadOrders() {
  try {
    const res = await fetch(`${ORDERS_URL}/orders`);
    const orders = await res.json();
    const list = document.getElementById('orders-list');

    if (orders.length === 0) {
      list.innerHTML = '<li class="muted">Aucune commande pour l\'instant.</li>';
      return;
    }

    list.innerHTML = orders.map(o => `
      <li>
        <strong>#${o.id}</strong> — ${o.name} × ${o.quantity}
        <span class="muted" style="float:right">${new Date(o.created_at).toLocaleString('fr-FR')}</span>
      </li>
    `).join('');
  } catch (err) {
    log('error', `loadOrders: ${err.message}`);
    document.getElementById('orders-list').innerHTML =
      '<li class="muted">Erreur de chargement</li>';
  }
}

document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('order-status');
  const productId = document.getElementById('product-select').value;
  const quantity = parseInt(document.getElementById('quantity').value, 10);

  if (!productId) return;

  try {
    const res = await fetch(`${ORDERS_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: parseInt(productId), quantity }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    status.textContent = 'Commande passée avec succès !';
    status.className = 'success';
    document.getElementById('order-form').reset();
    await Promise.all([loadProducts(), loadOrders()]);
  } catch (err) {
    log('error', `submitOrder: ${err.message}`);
    status.textContent = `Erreur : ${err.message}`;
    status.className = 'error';
  }

  setTimeout(() => { status.textContent = ''; }, 3000);
});

loadProducts();
loadOrders();
