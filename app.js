/* IDN-GO Laundry Management — frontend demo
   Data disimpan di localStorage browser. Untuk multi-device, WhatsApp otomatis,
   autentikasi aman, dan sinkronisasi server diperlukan backend/API.
*/
(() => {
  'use strict';
  const STORAGE_KEY = 'idn-go-laundry-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const nowISO = () => new Date().toISOString();
  const localDateTime = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const addDays = (n, hour = 17, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(hour, minute, 0, 0);
    return localDateTime(d);
  };
  const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const shortDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
  // Format 24 jam eksplisit (hour12: false)
  const dateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';
    const tgl = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${tgl}, ${jam}`;
  };
  const clockTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const initials = (name = 'IDN') => name.trim().split(/\s+/).slice(0, 2).map(s => s[0] || '').join('').toUpperCase() || 'ID';
  const makeId = (prefix = 'ID') => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const isOverdue = order => order.status !== 'Diambil' && order.dueAt && new Date(order.dueAt).getTime() < Date.now();
  const isPaid = order => Number(order.paid || 0) >= Number(order.total || 0);
  const statusClass = status => ({ 'Aktif': 'status-aktif', 'Proses': 'status-proses', 'Selesai': 'status-selesai', 'Diambil': 'status-diambil' }[status] || 'status-aktif');

  const iconPaths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    package: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/>',
    shirt: '<path d="m8 4 4 2 4-2 5 4-3 4-3-2v10H9V10l-3 2-3-4 5-4Z"/>',
    boxes: '<path d="m3 7 6-3 6 3-6 3-6-3Z"/><path d="M3 7v7l6 3 6-3V7M9 10v7M15 10l3-1.5 3 1.5-3 1.5-3-1.5Z"/><path d="M15 10v7l3 1.5 3-1.5v-7"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    wallet: '<rect x="2" y="5" width="20" height="15" rx="2"/><path d="M2 9h20M16 14h2"/><path d="M5 5V3h14v2"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>',
    history: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    scan: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M7 12h10M9 9v6M12 9v6M15 9v6"/>',
    truck: '<path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.8Z" transform="translate(-1 -1) scale(1.08)"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
    whatsapp: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8 8.5c.5 2.5 2.5 4.5 5 5l1.3-1.2 2 .9"/>',
    edit: '<path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 20h16"/>',
    filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
    alert: '<path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4m0 3h.01"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M2 6h20v3H2zM12 6H8.5a2.5 2.5 0 1 1 2.5-2c0 2 1 2 1 2Zm0 0h3.5a2.5 2.5 0 1 0-2.5-2c0 2-1 2-1 2Z"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.5 0-2.5.8-2.5 1.8 0 3 6 1.2 6 4.2 0 1.2-1.1 2-3 2-1.3 0-2.4-.4-3.2-1.2M12 5.5v13"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.grid}</svg>`;
  const navLabels = { dashboard: 'Dashboard', kasir: 'Kasir', orders: 'Daftar Pesanan', products: 'Produk & Kategori', stock: 'Stok', customers: 'Pelanggan', expenses: 'Pengeluaran', reports: 'Laporan', history: 'Riwayat', tracking: 'Tracking Pesanan', booking: 'Booking Jemput', settings: 'Pengaturan' };

  const demoData = () => {
    const d1 = addDays(-1, 15), d2 = addDays(0, 19), d3 = addDays(1, 15);
    return {
      settings: { businessName: 'IDN-GO Laundry', phone: '081234567890', address: 'Jl. Contoh No. 12, Indonesia', ownerPin: '1234', currency: 'IDR', pickupReminderHours: 24 },
      role: 'Owner', currentPage: 'dashboard',
      categories: ['Kiloan', 'Satuan', 'Paket'],
      products: [
        { id: 'PRD-001', name: 'Cuci Komplit', category: 'Kiloan', unit: 'kg', price: 8000, description: 'Cuci, kering, dan setrika', active: true },
        { id: 'PRD-002', name: 'Cuci Kering', category: 'Kiloan', unit: 'kg', price: 6000, description: 'Cuci dan pengeringan', active: true },
        { id: 'PRD-003', name: 'Setrika', category: 'Kiloan', unit: 'kg', price: 5000, description: 'Setrika pakaian', active: true },
        { id: 'PRD-004', name: 'Bed Cover', category: 'Satuan', unit: 'pcs', price: 25000, description: 'Cuci bed cover', active: true },
        { id: 'PRD-005', name: 'Jas / Blazer', category: 'Satuan', unit: 'pcs', price: 35000, description: 'Perawatan khusus', active: true },
        { id: 'PRD-006', name: 'Sepatu', category: 'Satuan', unit: 'pasang', price: 30000, description: 'Cuci sepatu', active: true },
        { id: 'PRD-007', name: 'Paket Hemat 5kg', category: 'Paket', unit: 'paket', price: 35000, description: 'Paket cuci komplit 5 kg', active: true }
      ],
      stock: [
        { id: 'STK-001', name: 'Detergen cair', unit: 'liter', qty: 12, min: 5 },
        { id: 'STK-002', name: 'Pewangi laundry', unit: 'liter', qty: 8, min: 4 },
        { id: 'STK-003', name: 'Plastik kemasan', unit: 'pak', qty: 3, min: 5 },
        { id: 'STK-004', name: 'Hanger', unit: 'pcs', qty: 75, min: 20 }
      ],
      customers: [
        { id: 'CUS-001', name: 'Andi Pratama', phone: '081234567801', address: '', points: 24, joinedAt: nowISO() },
        { id: 'CUS-002', name: 'Siti Rahma', phone: '081234567802', address: '', points: 12, joinedAt: nowISO() },
        { id: 'CUS-003', name: 'Budi Santoso', phone: '081234567803', address: '', points: 0, joinedAt: nowISO() }
      ],
      orders: [
        { id: 'ORD-0272', code: 'TRX-0272', createdAt: addDays(-3, 9), dueAt: d1, customerId: 'CUS-001', customerName: 'Andi Pratama', phone: '081234567801', items: [{ productId: 'PRD-004', name: 'Bed Cover', qty: 1, unit: 'pcs', price: 25000 }], subtotal: 25000, discount: 0, shippingCost: 0, extraFee: 0, extraFeeNote: '', ppnEnabled: false, ppnAmount: 0, total: 25000, paid: 25000, paymentMethod: 'Cash', status: 'Selesai', rack: 'Rak 6B', notes: '', beforePhoto: '', afterPhoto: '', pointsAwarded: true, stockUsed: [] },
        { id: 'ORD-0304', code: 'TRX-0304', createdAt: addDays(-1, 10), dueAt: d2, customerId: 'CUS-002', customerName: 'Siti Rahma', phone: '081234567802', items: [{ productId: 'PRD-001', name: 'Cuci Komplit', qty: 3, unit: 'kg', price: 8000 }], subtotal: 24000, discount: 0, shippingCost: 5000, extraFee: 0, extraFeeNote: '', ppnEnabled: false, ppnAmount: 0, total: 29000, paid: 10000, paymentMethod: 'QRIS', status: 'Proses', rack: 'Rak A3', notes: 'Pisahkan pakaian putih', beforePhoto: '', afterPhoto: '', pointsAwarded: false, stockUsed: [] },
        { id: 'ORD-0305', code: 'TRX-0305', createdAt: nowISO(), dueAt: d3, customerId: 'CUS-003', customerName: 'Budi Santoso', phone: '081234567803', items: [{ productId: 'PRD-002', name: 'Cuci Kering', qty: 2, unit: 'kg', price: 6000 }, { productId: 'PRD-003', name: 'Setrika', qty: 2, unit: 'kg', price: 5000 }], subtotal: 22000, discount: 2000, shippingCost: 0, extraFee: 0, extraFeeNote: '', ppnEnabled: true, ppnAmount: 2200, total: 22200, paid: 0, paymentMethod: 'Transfer', status: 'Aktif', rack: 'Rak A1', notes: '', beforePhoto: '', afterPhoto: '', pointsAwarded: false, stockUsed: [] },
        { id: 'ORD-0306', code: 'TRX-0306', createdAt: addDays(-5, 11), dueAt: addDays(-2, 15), customerId: 'CUS-001', customerName: 'Andi Pratama', phone: '081234567801', items: [{ productId: 'PRD-005', name: 'Jas / Blazer', qty: 1, unit: 'pcs', price: 35000 }], subtotal: 35000, discount: 0, shippingCost: 0, extraFee: 0, extraFeeNote: '', ppnEnabled: false, ppnAmount: 0, total: 35000, paid: 35000, paymentMethod: 'Cash', status: 'Diambil', rack: 'Rak B2', notes: '', beforePhoto: '', afterPhoto: '', pointsAwarded: true, stockUsed: [] }
      ],
      expenses: [{ id: 'EXP-001', date: todayISO(), category: 'Operasional', description: 'Pembelian detergen', amount: 75000 }, { id: 'EXP-002', date: todayISO(), category: 'Listrik & Air', description: 'Tagihan listrik', amount: 125000 }],
      bookings: [],
      history: [{ id: makeId('LOG'), at: nowISO(), action: 'Aplikasi dimulai', detail: 'Data contoh IDN-GO berhasil dimuat.' }]
    };
  };

  const loadData = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.products)) {
        return { ...demoData(), ...parsed, settings: { ...demoData().settings, ...(parsed.settings || {}) } };
      }
    } catch (e) { console.warn('Data lokal tidak dapat dibaca, memuat data awal.', e); }
    const fresh = demoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  };

  let data = loadData();
  let currentPage = data.currentPage || 'dashboard';
  let orderFilter = 'Semua';
  let orderSearch = '';
  let productCategoryFilter = 'Semua';
  let cart = [];
  let cashierStockUsage = {}; // { [stockId]: qty }
  let cashierBeforePhoto = '';
  let cashierAfterPhoto = '';
  let trackingQuery = '';
  let trackingResult = null;
  let reportPeriod = 'month';
  let settingsTab = 'business';
  let scannerStream = null;
  let scannerTimer = null;

  function saveData() {
    data.currentPage = currentPage;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { toast('Penyimpanan browser penuh. Hapus foto atau ekspor cadangan data.', 'error'); console.error(e); }
    updateShell();
  }
  function log(action, detail) {
    data.history.unshift({ id: makeId('LOG'), at: nowISO(), action, detail });
    data.history = data.history.slice(0, 500);
  }
  function toast(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.innerHTML = `${icon(type === 'error' ? 'alert' : 'checkCircle')}<span>${esc(message)}</span>`;
    $('#toastRegion').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  function updateShell() {
    const name = data.settings.businessName || 'IDN-GO Laundry';
    $('#sidebarBusinessName').textContent = name;
    $('#topBusinessName').textContent = name;
    $('#topRole').textContent = data.role;
    $('#sidebarRole').textContent = data.role === 'Owner' ? 'Administrator' : 'Kasir';
    $('#notificationDot').style.display = data.orders.some(isOverdue) ? 'block' : 'none';
    $('#activeOrderCount').textContent = data.orders.filter(o => o.status !== 'Diambil').length;
    $('#todayLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
    $('#footerYear').textContent = new Date().getFullYear();
    const online = navigator.onLine;
    $('#connectionDot').classList.toggle('online', online);
    $('#connectionText').textContent = online ? 'Mode Online' : 'Mode Offline';
    $$('.nav-link[data-page]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === currentPage);
      if (data.role === 'Kasir' && ['expenses', 'reports', 'settings'].includes(btn.dataset.page)) {
        btn.classList.add('hidden');
      } else {
        btn.classList.remove('hidden');
      }
    });
    $('#pageCrumb').textContent = navLabels[currentPage] || 'Dashboard';
  }
  function pageHeading(title, subtitle, actions = '') {
    return `<div class="page-heading"><div><p class="eyebrow">IDN-GO / WORKSPACE</p><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
  }
  function statusBadge(status) { return `<span class="status-badge ${statusClass(status)}">${esc(status)}</span>`; }
  function paymentBadge(order) { return isPaid(order) ? '<span class="pay-badge pay-paid">Lunas</span>' : '<span class="pay-badge pay-unpaid">Belum Bayar</span>'; }
  function totalItems(order) { return order.items.reduce((sum, item) => sum + Number(item.qty || 0), 0); }
  function orderItemsLabel(order) { return `${totalItems(order)} item`; }
  function getCustomer(id) { return data.customers.find(c => c.id === id); }
  function getOrder(id) { return data.orders.find(o => o.id === id || o.code === id); }
  function ownerOnly() { if (data.role !== 'Owner') { toast('Menu ini hanya dapat diakses Owner.', 'error'); return false; } return true; }
  function setPage(page) {
    if (!navLabels[page]) page = 'dashboard';
    if (data.role === 'Kasir' && ['expenses', 'reports', 'settings'].includes(page)) { toast('Akses Owner diperlukan.', 'error'); return; }
    currentPage = page;
    saveData();
    renderPage();
    $('#sidebar').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderPage() {
    updateShell();
    const routes = { dashboard: renderDashboard, kasir: renderCashier, orders: renderOrders, products: renderProducts, stock: renderStock, customers: renderCustomers, expenses: renderExpenses, reports: renderReports, history: renderHistory, tracking: renderTracking, booking: renderBooking, settings: renderSettings };
    $('#pageContent').innerHTML = (routes[currentPage] || renderDashboard)();
    if (currentPage === 'dashboard') drawDashboardChart();
    if (currentPage === 'kasir') updateCartUI();
  }
  function statCard(label, value, sub, iconName) {
    return `<article class="card stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon(iconName)}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${sub}</div></article>`;
  }

  function renderDashboard() {
    const today = todayISO();
    const todayOrders = data.orders.filter(o => o.createdAt.slice(0, 10) === today);
    const monthKey = today.slice(0, 7);
    const monthOrders = data.orders.filter(o => o.createdAt.slice(0, 7) === monthKey);
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.paid || 0), 0);
    const active = data.orders.filter(o => o.status !== 'Diambil').length;
    const overdue = data.orders.filter(isOverdue).length;
    const statuses = ['Aktif', 'Proses', 'Selesai', 'Diambil'];
    const max = Math.max(1, ...statuses.map(s => data.orders.filter(o => o.status === s).length));
    const recent = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    return `${pageHeading('Dashboard', 'Ringkasan operasional dan performa usaha laundry Anda.', `<button class="btn btn-primary" data-action="go-cashier">${icon('plus')} Transaksi Baru</button>`)}
      <div class="stat-grid">${statCard('Pemasukan Bulan Ini', rupiah(monthRevenue), `<strong>${monthOrders.length}</strong> transaksi tercatat`, 'wallet')}${statCard('Pesanan Aktif', active, `${overdue ? `<strong class="overdue-text">${overdue} terlambat</strong>` : 'Semua sesuai jadwal'}`, 'package')}${statCard('Pesanan Hari Ini', todayOrders.length, 'Order baru masuk hari ini', 'receipt')}${statCard('Total Pelanggan', data.customers.length, 'Pelanggan terdaftar', 'users')}</div>
      <div class="dashboard-grid"><div class="card panel"><div class="panel-head"><div><h3>Ringkasan Pemasukan</h3><p>Perkiraan pemasukan berdasarkan pembayaran yang diterima · 7 hari terakhir</p></div><div class="legend-row"><span><i class="legend-dot"></i>Pemasukan</span></div></div><div class="chart-wrap"><canvas id="dashboardChart" aria-label="Grafik pemasukan mingguan"></canvas></div></div>
      <div class="card panel"><div class="panel-head"><div><h3>Status Pesanan</h3><p>Distribusi seluruh transaksi</p></div><span class="stat-icon">${icon('chart')}</span></div><div class="status-summary">${statuses.map((s, i) => { const n = data.orders.filter(o => o.status === s).length; return `<div class="status-line"><span>${s}</span><strong>${n}</strong><div class="progress-track"><i class="${i === 0 ? 'light' : i === 2 ? 'mid' : ''}" style="width:${n / max * 100}%"></i></div></div>`; }).join('')}</div>${overdue ? `<div class="settings-note" style="margin-top:19px"><strong class="overdue-text">${icon('alert')} ${overdue} pesanan melewati estimasi</strong><br>Periksa daftar pesanan dan hubungi pelanggan terkait.</div>` : ''}</div>
      <div class="card panel"><div class="panel-head"><div><h3>Pesanan Terbaru</h3><p>Transaksi yang terakhir dibuat</p></div><button class="text-link" data-page="orders">Lihat semua →</button></div><div class="recent-list">${recent.length ? recent.map(o => `<div class="recent-row"><div class="order-mini-icon">${icon('package')}</div><div class="recent-info"><strong>${esc(o.code)} · ${esc(o.customerName)}</strong><small>${esc(orderItemsLabel(o))} · ${esc(o.rack || 'Belum ada rak')}</small></div><div class="recent-price"><strong>${rupiah(o.total)}</strong><small>${esc(o.status)} · ${esc(o.paymentMethod || 'Cash')}</small></div></div>`).join('') : '<div class="empty-state">Belum ada pesanan.</div>'}</div></div>
      <div class="card panel"><div class="panel-head"><div><h3>Perlu Perhatian</h3><p>Pesanan terlambat dan stok minimum</p></div><span class="stat-icon">${icon('alert')}</span></div>${overdue ? `<div class="recent-list">${data.orders.filter(isOverdue).slice(0, 3).map(o => `<div class="recent-row"><div class="order-mini-icon">${icon('clock')}</div><div class="recent-info"><strong>${esc(o.code)} · ${esc(o.customerName)}</strong><small class="overdue-text">Lewat ${dateTime(o.dueAt)}</small></div><button class="btn btn-small" data-action="order-detail" data-id="${o.id}">Detail</button></div>`).join('')}</div>` : `<div class="empty-state" style="padding:16px"><div class="empty-icon">${icon('checkCircle')}</div><h3>Semua terkendali</h3><p>Tidak ada pesanan yang terlambat.</p></div>`}${data.stock.filter(s => s.qty <= s.min).length ? `<div class="settings-note">${data.stock.filter(s => s.qty <= s.min).length} barang stok menipis: ${data.stock.filter(s => s.qty <= s.min).map(s => `${esc(s.name)} (${s.qty} ${esc(s.unit)})`).join(', ')}</div>` : ''}</div></div>`;
  }
  function drawDashboardChart() {
    const canvas = $('#dashboardChart'); if (!canvas) return; const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1; canvas.width = Math.max(300, rect.width * ratio); canvas.height = Math.max(160, rect.height * ratio); const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio); const w = rect.width, h = rect.height;
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0, 10); days.push({ key, label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d) }); }
    const vals = days.map(d => data.orders.filter(o => o.createdAt.slice(0, 10) === d.key).reduce((sum, o) => sum + Number(o.paid || 0), 0)); const max = Math.max(10000, ...vals) * 1.2; const pad = { l: 7, r: 8, t: 12, b: 25 }; const plotH = h - pad.t - pad.b; ctx.clearRect(0, 0, w, h); ctx.font = '9px DM Sans'; ctx.fillStyle = '#aaa'; ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const y = pad.t + plotH * i / 3; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
    const step = (w - pad.l - pad.r) / days.length; vals.forEach((v, i) => { const x = pad.l + step * i + step * .26; const bw = step * .48; const bh = (v / max) * plotH; const y = pad.t + plotH - bh; ctx.fillStyle = '#171717'; const r = 5; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + bw, y, x + bw, y + r, r); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x, y + bh); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.fill(); ctx.fillStyle = '#999'; ctx.textAlign = 'center'; ctx.fillText(days[i].label, x + bw / 2, h - 7); });
  }

  function orderCard(o) {
    const late = isOverdue(o);
    const next = ['Aktif', 'Proses', 'Selesai', 'Diambil'][Math.min(3, ['Aktif', 'Proses', 'Selesai', 'Diambil'].indexOf(o.status) + 1)];
    return `<article class="card order-card ${late ? 'overdue' : ''}"><div class="order-top"><span class="order-code">${esc(o.code)}</span><div class="inline-actions">${late ? '<span class="priority-badge">Terlambat</span>' : ''}${statusBadge(o.status)}</div></div><div class="order-due ${late ? 'overdue-text' : ''}">${icon('clock')} AMBIL ${esc(dateTime(o.dueAt).toUpperCase())} WIB</div><div class="order-customer"><div class="customer-avatar">${esc(initials(o.customerName))}</div><div><strong>${esc(o.customerName)}</strong><small>${esc(o.phone || 'No. HP belum diisi')} · ${esc(orderItemsLabel(o))}</small></div></div><div class="order-meta"><div class="meta-item"><small>LOKASI PENYIMPANAN</small><strong>${esc(o.rack || 'Belum ditentukan')}</strong></div><div class="meta-item"><small>PEMBAYARAN (${esc(o.paymentMethod || 'Cash')})</small><strong>${paymentBadge(o)}</strong></div></div><div class="order-bottom"><div class="order-total"><small>TOTAL TRANSAKSI</small><strong>${rupiah(o.total)}</strong></div><div class="order-actions"><button class="btn btn-small" data-action="order-detail" data-id="${o.id}">Detail</button>${o.status !== 'Diambil' ? `<button class="btn btn-small btn-primary" data-action="order-next" data-id="${o.id}" title="Ubah ke ${next}">${next}</button>` : ''}<button class="btn btn-small btn-danger order-delete-btn" data-action="order-delete" data-id="${o.id}" title="Hapus pesanan ${esc(o.code)}" aria-label="Hapus pesanan ${esc(o.code)}">${icon('trash')}<span>Hapus</span></button></div></div></article>`;
  }
  function renderOrders() {
    const statuses = ['Semua', 'Aktif', 'Proses', 'Selesai', 'Diambil'];
    const filtered = data.orders.filter(o => {
      const q = orderSearch.toLowerCase();
      const match = !q || [o.code, o.customerName, o.phone, o.paymentMethod].some(v => String(v || '').toLowerCase().includes(q));
      return (orderFilter === 'Semua' || o.status === orderFilter) && match;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return `${pageHeading('Daftar Pesanan', 'Pantau alur cucian, pembayaran, dan jadwal pengambilan.', `<button class="btn btn-primary" data-action="go-cashier">${icon('plus')} Pesanan Baru</button>`)}
      <div class="toolbar"><div class="search-box">${icon('search')}<input id="orderSearch" value="${esc(orderSearch)}" placeholder="Cari nama, nomor HP, metode bayar, atau kode transaksi…"><button class="icon-btn subtle" data-action="scanner-open" title="Pindai QR / barcode">${icon('scan')}</button></div><div class="search-actions"><button class="btn" data-action="export-orders">${icon('download')} Ekspor CSV</button></div></div>
      <div class="filter-tabs">${statuses.map(s => `<button class="filter-tab ${orderFilter === s ? 'active' : ''}" data-action="order-filter" data-filter="${s}">${s} <span class="muted">${s === 'Semua' ? data.orders.length : data.orders.filter(o => o.status === s).length}</span></button>`).join('')}</div>
      ${filtered.length ? `<div class="order-grid">${filtered.map(orderCard).join('')}</div>` : `<div class="card empty-state"><div class="empty-icon">${icon('package')}</div><h3>Pesanan tidak ditemukan</h3><p>Ubah kata kunci atau filter status pesanan.</p></div>`}`;
  }

  function renderCashier() {
    const activeProducts = data.products.filter(p => p.active !== false);
    const defaultDue = addDays(1, 17, 0);
    const defaultDate = defaultDue.slice(0, 10);
    const defaultHour = defaultDue.slice(11, 13);
    const defaultMinute = defaultDue.slice(14, 16);

    const hoursOptions = Array.from({ length: 24 }, (_, h) => {
      const val = String(h).padStart(2, '0');
      return `<option value="${val}" ${val === defaultHour ? 'selected' : ''}>${val}:00</option>`;
    }).join('');

    const minutesOptions = ['00', '15', '30', '45'].map(m => `<option value="${m}" ${m === defaultMinute ? 'selected' : ''}>:${m}</option>`).join('');

    return `${pageHeading('Kasir', 'Catat pesanan baru dengan cepat, akurat, dan terhubung langsung ke stok.', `<button class="btn" data-page="orders">${icon('package')} Daftar Pesanan</button>`)}
      <div class="cashier-layout">
        <section class="card cashier-card">
          <div class="panel-head"><div><h3>Informasi Pelanggan & Jadwal</h3><p>Masukkan data pelanggan dan estimasi selesai (Format 24 Jam)</p></div><span class="stat-icon">${icon('users')}</span></div>
          <form id="checkoutForm">
            <div class="form-grid">
              <div class="field"><label for="cashCustomer">Nama pelanggan *</label><input id="cashCustomer" name="customerName" list="customerSuggestions" placeholder="Nama lengkap" required><datalist id="customerSuggestions">${data.customers.map(c => `<option value="${esc(c.name)}">${esc(c.phone)}</option>`).join('')}</datalist></div>
              <div class="field"><label for="cashPhone">Nomor WhatsApp *</label><input id="cashPhone" name="phone" inputmode="tel" placeholder="08xxxxxxxxxx" required></div>

              <div class="field full">
                <label>Estimasi selesai / ambil (Format 24 Jam) *</label>
                <div class="due-24-grid">
                  <input id="cashDueDate" type="date" value="${defaultDate}" required aria-label="Tanggal estimasi selesai">
                  <select id="cashDueHour" aria-label="Jam estimasi selesai (24 jam)">${hoursOptions}</select>
                  <select id="cashDueMinute" aria-label="Menit estimasi selesai">${minutesOptions}</select>
                </div>
                <div class="due-presets">
                  <button type="button" class="btn btn-small btn-soft" data-action="due-preset" data-days="0" data-hour="20">Hari ini 20:00</button>
                  <button type="button" class="btn btn-small btn-soft" data-action="due-preset" data-days="1" data-hour="17">Besok 17:00</button>
                  <button type="button" class="btn btn-small btn-soft" data-action="due-preset" data-days="2" data-hour="17">+2 Hari 17:00</button>
                  <button type="button" class="btn btn-small btn-soft" data-action="due-preset" data-days="3" data-hour="17">+3 Hari 17:00</button>
                </div>
                <span class="help">Waktu menggunakan standar 24 jam (00:00 – 23:59 WIB).</span>
              </div>

              <div class="field"><label for="cashRack">Lokasi rak</label><input id="cashRack" name="rack" placeholder="Contoh: Rak A3"></div>
              <div class="field"><label for="cashStatus">Status awal pesanan</label><select id="cashStatus"><option>Aktif</option><option>Proses</option></select></div>

              <div class="field full"><label for="cashNotes">Catatan khusus cucian</label><textarea id="cashNotes" name="notes" placeholder="Contoh: Pisahkan baju putih, noda di bagian kerah…"></textarea></div>

              <div class="form-section-title">Bukti kondisi cucian (opsional)</div>
              <div class="field"><label for="beforePhoto">Foto sebelum dicuci</label><input id="beforePhoto" type="file" accept="image/*" capture="environment"><span class="help" id="beforePhotoLabel">Belum ada foto dipilih</span></div>
              <div class="field"><label for="afterPhoto">Foto setelah dicuci</label><input id="afterPhoto" type="file" accept="image/*" capture="environment"><span class="help" id="afterPhotoLabel">Belum ada foto dipilih</span></div>
            </div>

            <div class="panel-head" style="margin:21px 0 10px;padding-top:15px;border-top:1px solid #eee"><div><h3>Tambah Layanan</h3><p>Pilih kiloan, satuan, atau paket laundry</p></div></div>
            <div class="product-pick-row">
              <div class="field"><label for="cashProduct">Produk / layanan</label><select id="cashProduct"><option value="">Pilih layanan…</option>${activeProducts.map(p => `<option value="${p.id}">${esc(p.name)} · ${rupiah(p.price)}/${esc(p.unit)}</option>`).join('')}</select></div>
              <div class="field"><label for="cashQty">Jumlah</label><input id="cashQty" type="number" min="0.1" step="0.1" value="1"></div>
              <button type="button" class="btn btn-primary" data-action="cart-add">${icon('plus')} Tambah</button>
            </div>

            <div class="panel-head" style="margin:21px 0 10px;padding-top:15px;border-top:1px solid #eee">
              <div><h3>Pemakaian Sabun & Bahan Stok</h3><p>Otomatis mengurangi stok inventori saat transaksi disimpan</p></div>
              <span class="stat-icon">${icon('boxes')}</span>
            </div>
            <div id="cashierStockList" class="cashier-stock-grid">${cashierStockMarkup()}</div>

            <div style="margin-top:12px" id="cashierPhotoPreview"></div>
          </form>
        </section>

        <aside class="card cart-card">
          <div class="panel-head"><div><h3>Ringkasan Transaksi</h3><p>Rincian layanan, pajak, biaya tambahan & pembayaran</p></div><span class="stat-icon">${icon('receipt')}</span></div>
          <div id="cartLines">${cartMarkup()}</div>
          <div id="cartStockSummary"></div>

          <div class="cart-total">
            <div class="total-row"><span>Subtotal Layanan</span><strong id="cartSubtotal">${rupiah(0)}</strong></div>

            <div class="two-col" style="gap:8px">
              <div class="field"><label for="cashDiscount">Diskon (Rp)</label><input id="cashDiscount" type="number" min="0" value="0"></div>
              <div class="field"><label for="cashShipping">Ongkir (Rp)</label><input id="cashShipping" type="number" min="0" value="0"></div>
            </div>

            <div class="two-col" style="gap:8px">
              <div class="field"><label for="cashExtraFee">Biaya Tambahan (Rp)</label><input id="cashExtraFee" type="number" min="0" value="0"></div>
              <div class="field"><label for="cashExtraNote">Ket. Biaya Tambahan</label><input id="cashExtraNote" type="text" placeholder="Express / Hanger / dll"></div>
            </div>

            <label class="ppn-toggle" for="cashPpnCheck">
              <input type="checkbox" id="cashPpnCheck">
              <span>Kenakan PPN 11% Otomatis</span>
              <strong id="cartPpnAmount">${rupiah(0)}</strong>
            </label>

            <div class="total-row grand"><span>Total Tagihan</span><strong id="cartGrandTotal">${rupiah(0)}</strong></div>

            <div class="field">
              <label>Metode Pembayaran</label>
              <div class="pay-method-pills" id="payMethodPills">
                ${['Cash', 'Transfer', 'QRIS', 'Custom'].map((m, idx) => `<button type="button" class="pay-pill ${idx === 0 ? 'active' : ''}" data-action="pay-method-pick" data-method="${m}">${m}</button>`).join('')}
              </div>
              <input type="hidden" id="cashPaymentMethod" value="Cash">
              <input type="text" id="cashCustomPayment" class="hidden" placeholder="Tulis metode pembayaran (mis. Debit BCA, GoPay)…" style="margin-top:6px">
            </div>

            <div class="field">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <label for="cashPaid">Pembayaran diterima (Rp)</label>
                <button type="button" class="text-link" data-action="pay-full" style="font-size:9px">Bayar Lunas →</button>
              </div>
              <input id="cashPaid" type="number" min="0" value="0" placeholder="0 = belum bayar">
            </div>
          </div>

          <div class="cart-actions">
            <button class="btn btn-primary" data-action="checkout-submit">${icon('check')} Simpan Transaksi</button>
            <button class="btn" data-action="cart-clear">Kosongkan Keranjang</button>
          </div>
          <p class="help" style="text-align:center;margin-top:10px">Nomor transaksi dibuat otomatis setelah disimpan.</p>
        </aside>
      </div>`;
  }

  function cashierStockMarkup() {
    if (!data.stock.length) return '<p class="muted" style="font-size:10px">Belum ada data stok sabun/bahan di menu Stok.</p>';
    return data.stock.map(s => {
      const used = Number(cashierStockUsage[s.id] || 0);
      const sisa = Math.max(0, Number((Number(s.qty) - used).toFixed(2)));
      const outOfStock = Number(s.qty) <= 0;
      return `<div class="stock-pick-item ${used > 0 ? 'selected' : ''} ${outOfStock ? 'empty-stock' : ''}">
        <div class="stock-pick-info">
          <strong>${esc(s.name)}</strong>
          <small>Tersedia: <b>${sisa}</b> / ${s.qty} ${esc(s.unit)}${s.qty <= s.min ? ' · <span class="overdue-text">Menipis</span>' : ''}</small>
        </div>
        <div class="stock-stepper">
          <button type="button" class="step-btn" data-action="cash-stock-qty" data-id="${s.id}" data-delta="-1" ${used <= 0 ? 'disabled' : ''} aria-label="Kurangi ${esc(s.name)}">−</button>
          <span class="step-val">${used} <small>${esc(s.unit)}</small></span>
          <button type="button" class="step-btn" data-action="cash-stock-qty" data-id="${s.id}" data-delta="1" ${sisa <= 0 ? 'disabled' : ''} aria-label="Tambah ${esc(s.name)}">+</button>
        </div>
      </div>`;
    }).join('');
  }

  function cartMarkup() {
    return cart.length ? cart.map((item, i) => `<div class="cart-line"><div><strong>${esc(item.name)}</strong><small>${rupiah(item.price)} / ${esc(item.unit)}</small></div><div class="cart-line-right"><strong>${rupiah(item.price * item.qty)}</strong><div class="qty-controls"><button type="button" data-action="cart-qty" data-index="${i}" data-delta="-1">−</button><span>${item.qty} ${esc(item.unit)}</span><button type="button" data-action="cart-qty" data-index="${i}" data-delta="1">+</button><button type="button" data-action="cart-remove" data-index="${i}" title="Hapus">×</button></div></div></div>`).join('') : '<div class="cart-empty">Keranjang masih kosong.<br>Pilih layanan untuk memulai transaksi.</div>';
  }

  function calculateCashierTotals() {
    const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
    const discount = Math.min(subtotal, Math.max(0, Number($('#cashDiscount')?.value || 0)));
    const shippingCost = Math.max(0, Number($('#cashShipping')?.value || 0));
    const extraFee = Math.max(0, Number($('#cashExtraFee')?.value || 0));
    const ppnEnabled = Boolean($('#cashPpnCheck')?.checked);
    const taxableBase = Math.max(0, subtotal - discount);
    const ppnAmount = ppnEnabled ? Math.round(taxableBase * 0.11) : 0;
    const total = taxableBase + ppnAmount + shippingCost + extraFee;
    return { subtotal, discount, shippingCost, extraFee, ppnEnabled, ppnAmount, total };
  }

  function updateCartUI() {
    const lines = $('#cartLines');
    if (!lines) return;
    lines.innerHTML = cartMarkup();

    const stockListEl = $('#cashierStockList');
    if (stockListEl) stockListEl.innerHTML = cashierStockMarkup();

    const usedEntries = Object.entries(cashierStockUsage).filter(([, q]) => q > 0);
    const stockSummaryEl = $('#cartStockSummary');
    if (stockSummaryEl) {
      stockSummaryEl.innerHTML = usedEntries.length
        ? `<div class="cart-stock-box"><small>Pemakaian Stok Terpilih:</small><div>${usedEntries.map(([sid, q]) => {
            const st = data.stock.find(x => x.id === sid);
            return st ? `<span class="stock-chip">${esc(st.name)}: −${q} ${esc(st.unit)}</span>` : '';
          }).join('')}</div></div>`
        : '';
    }

    const calc = calculateCashierTotals();
    if ($('#cartSubtotal')) $('#cartSubtotal').textContent = rupiah(calc.subtotal);
    if ($('#cartPpnAmount')) $('#cartPpnAmount').textContent = rupiah(calc.ppnAmount);
    if ($('#cartGrandTotal')) $('#cartGrandTotal').textContent = rupiah(calc.total);
  }

  function addCartItem() {
    const id = $('#cashProduct')?.value;
    const qty = Number($('#cashQty')?.value || 0);
    const p = data.products.find(x => x.id === id);
    if (!p) { toast('Pilih produk terlebih dahulu.', 'error'); return; }
    if (!(qty > 0)) { toast('Jumlah harus lebih dari 0.', 'error'); return; }
    const existing = cart.find(x => x.productId === p.id);
    if (existing) existing.qty = Number((existing.qty + qty).toFixed(2));
    else cart.push({ productId: p.id, name: p.name, qty, unit: p.unit, price: Number(p.price) });
    updateCartUI();
    toast(`${p.name} ditambahkan.`);
  }

  function generateCode() {
    const max = data.orders.reduce((m, o) => Math.max(m, Number((o.code || '').replace(/\D/g, '')) || 0), 270);
    return `TRX-${String(max + 1).padStart(4, '0')}`;
  }

  function findOrCreateCustomer(name, phone) {
    let c = data.customers.find(x => x.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
    if (!c) { c = { id: makeId('CUS'), name, phone, address: '', points: 0, joinedAt: nowISO() }; data.customers.push(c); }
    else { c.name = name; c.phone = phone; }
    return c;
  }

  function compressImage(file, max = 1000) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', .72));
        };
        img.onerror = () => resolve('');
        img.src = reader.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoInput(inputId, which) {
    const file = $(`#${inputId}`).files?.[0];
    if (!file) return;
    const dataURL = await compressImage(file);
    if (which === 'before') cashierBeforePhoto = dataURL;
    else cashierAfterPhoto = dataURL;
    const label = $(`#${inputId === 'beforePhoto' ? 'beforePhotoLabel' : 'afterPhotoLabel'}`);
    if (label) label.textContent = file.name;
    const preview = $('#cashierPhotoPreview');
    if (preview) preview.innerHTML = `<div class="inline-actions">${cashierBeforePhoto ? `<img class="photo-preview" src="${cashierBeforePhoto}" alt="Foto sebelum" style="max-width:100px">` : ''}${cashierAfterPhoto ? `<img class="photo-preview" src="${cashierAfterPhoto}" alt="Foto sesudah" style="max-width:100px">` : ''}</div>`;
  }

  function checkout() {
    const form = $('#checkoutForm');
    if (!form.reportValidity()) return;
    if (!cart.length) { toast('Keranjang layanan masih kosong.', 'error'); return; }
    const fd = new FormData(form);
    const name = String(fd.get('customerName') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const dueDate = $('#cashDueDate')?.value || '';
    const dueHour = $('#cashDueHour')?.value || '17';
    const dueMinute = $('#cashDueMinute')?.value || '00';
    const dueAt = dueDate ? `${dueDate}T${dueHour}:${dueMinute}` : '';

    if (!name || !phone || !dueAt) { toast('Lengkapi data pelanggan dan estimasi selesai.', 'error'); return; }

    // Validasi & siapkan pengurangan stok sabun/bahan
    const stockUsedList = [];
    for (const [stockId, usedQty] of Object.entries(cashierStockUsage)) {
      if (usedQty <= 0) continue;
      const stockItem = data.stock.find(s => s.id === stockId);
      if (!stockItem) continue;
      if (usedQty > Number(stockItem.qty)) {
        toast(`Stok ${stockItem.name} tidak mencukupi (tersedia ${stockItem.qty} ${stockItem.unit}).`, 'error');
        return;
      }
      stockUsedList.push({ stockId: stockItem.id, name: stockItem.name, qty: usedQty, unit: stockItem.unit, note: 'Pemakaian transaksi kasir', at: nowISO() });
    }

    const calc = calculateCashierTotals();
    const extraFeeNote = String($('#cashExtraNote')?.value || '').trim();
    const rawMethod = $('#cashPaymentMethod')?.value || 'Cash';
    const customMethod = String($('#cashCustomPayment')?.value || '').trim();
    const paymentMethod = rawMethod === 'Custom' ? (customMethod || 'Custom') : rawMethod;
    const paid = Math.min(calc.total, Math.max(0, Number($('#cashPaid')?.value || 0)));
    const customer = findOrCreateCustomer(name, phone);

    // Kurangi stok secara permanen saat transaksi disimpan
    stockUsedList.forEach(u => {
      const stockItem = data.stock.find(s => s.id === u.stockId);
      if (stockItem) {
        stockItem.qty = Math.max(0, Number((Number(stockItem.qty) - u.qty).toFixed(2)));
      }
    });

    const order = {
      id: makeId('ORD'),
      code: generateCode(),
      createdAt: nowISO(),
      dueAt,
      customerId: customer.id,
      customerName: name,
      phone,
      items: cart.map(x => ({ ...x })),
      subtotal: calc.subtotal,
      discount: calc.discount,
      shippingCost: calc.shippingCost,
      extraFee: calc.extraFee,
      extraFeeNote,
      ppnEnabled: calc.ppnEnabled,
      ppnAmount: calc.ppnAmount,
      total: calc.total,
      paid,
      paymentMethod,
      status: $('#cashStatus').value,
      rack: String(fd.get('rack') || '').trim(),
      notes: String(fd.get('notes') || '').trim(),
      beforePhoto: cashierBeforePhoto,
      afterPhoto: cashierAfterPhoto,
      pointsAwarded: false,
      stockUsed: stockUsedList
    };

    data.orders.unshift(order);
    if (isPaid(order)) awardPoints(order);
    const stockLogDetail = stockUsedList.length ? ` · Stok terpakai: ${stockUsedList.map(u => `${u.name} (${u.qty} ${u.unit})`).join(', ')}` : '';
    log('Transaksi dibuat', `${order.code} · ${name} · ${rupiah(calc.total)} (${paymentMethod})${stockLogDetail}`);
    saveData();

    cart = [];
    cashierStockUsage = {};
    cashierBeforePhoto = '';
    cashierAfterPhoto = '';
    toast(`Transaksi ${order.code} berhasil disimpan & stok diperbarui.`);
    setPage('orders');
    showReceipt(order.id);
  }

  function awardPoints(order) {
    if (order.pointsAwarded) return;
    const customer = getCustomer(order.customerId);
    if (!customer) return;
    const earned = Math.floor(Number(order.total || 0) / 10000);
    customer.points = (customer.points || 0) + earned;
    order.pointsAwarded = true;
    if (earned) log('Poin loyalitas ditambahkan', `${customer.name} memperoleh ${earned} poin dari ${order.code}`);
  }

  function renderProducts() {
    const products = data.products.filter(p => productCategoryFilter === 'Semua' || p.category === productCategoryFilter);
    return `${pageHeading('Produk & Kategori', 'Atur layanan kiloan, item satuan, dan paket laundry.', `<button class="btn" data-action="category-add">${icon('plus')} Kategori</button><button class="btn btn-primary" data-action="product-add">${icon('plus')} Tambah Produk</button>`)}<div class="toolbar"><div class="category-pills">${['Semua', ...data.categories].map(c => `<button class="category-pill ${productCategoryFilter === c ? 'active' : ''}" data-action="product-filter" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div><span class="muted" style="font-size:9px">${products.length} produk ditampilkan</span></div>${products.length ? `<div class="product-cards">${products.map(p => `<article class="card product-card"><div class="product-visual">${icon(p.category === 'Kiloan' ? 'shirt' : p.category === 'Paket' ? 'gift' : 'package')}</div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${esc(p.description || 'Layanan laundry')}</p><div class="product-card-bottom"><div><strong>${rupiah(p.price)}</strong><small> / ${esc(p.unit)}</small></div><div class="inline-actions"><button class="icon-btn" data-action="product-edit" data-id="${p.id}" title="Edit">${icon('edit')}</button><button class="icon-btn" data-action="product-delete" data-id="${p.id}" title="Hapus">${icon('trash')}</button></div></div></article>`).join('')}</div>` : `<div class="card empty-state"><div class="empty-icon">${icon('shirt')}</div><h3>Belum ada produk</h3><p>Tambahkan layanan laundry pertama Anda.</p></div>`}`;
  }
  function productForm(p = {}) {
    const editing = !!p.id;
    openModal(editing ? 'Edit Produk' : 'Tambah Produk', `<form id="productForm"><div class="form-grid"><div class="field full"><label>Nama produk *</label><input name="name" required value="${esc(p.name || '')}" placeholder="Contoh: Cuci Komplit"></div><div class="field"><label>Kategori *</label><select name="category" required>${data.categories.map(c => `<option ${p.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label>Satuan *</label><input name="unit" required value="${esc(p.unit || 'kg')}" placeholder="kg / pcs / paket"></div><div class="field"><label>Harga (Rp) *</label><input name="price" type="number" min="0" required value="${p.price ?? ''}"></div><div class="field"><label>Status</label><select name="active"><option value="true" ${p.active !== false ? 'selected' : ''}>Aktif</option><option value="false" ${p.active === false ? 'selected' : ''}>Nonaktif</option></select></div><div class="field full"><label>Deskripsi</label><textarea name="description">${esc(p.description || '')}</textarea></div></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="product-save" data-id="${p.id || ''}">Simpan Produk</button>`);
  }
  function saveProduct(id) {
    const form = $('#productForm'); if (!form.reportValidity()) return; const fd = new FormData(form);
    const obj = { id: id || makeId('PRD'), name: String(fd.get('name')).trim(), category: String(fd.get('category')), unit: String(fd.get('unit')).trim(), price: Number(fd.get('price')), active: fd.get('active') === 'true', description: String(fd.get('description') || '').trim() };
    if (id) { const i = data.products.findIndex(p => p.id === id); if (i >= 0) data.products[i] = obj; log('Produk diperbarui', obj.name); }
    else { data.products.push(obj); log('Produk ditambahkan', obj.name); }
    saveData(); closeModal(); renderPage(); toast('Produk berhasil disimpan.');
  }
  function addCategory() {
    openModal('Tambah Kategori', `<form id="categoryForm"><div class="field"><label>Nama kategori</label><input name="name" required placeholder="Contoh: Express"></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="category-save">Tambah Kategori</button>`);
  }

  function renderStock() {
    const low = data.stock.filter(s => s.qty <= s.min).length;
    return `${pageHeading('Manajemen Stok', 'Pantau perlengkapan operasional (sabun, pewangi, kemasan) yang terhubung otomatis dengan Kasir.', `<button class="btn btn-primary" data-action="stock-add">${icon('plus')} Tambah Barang</button>`)}<div class="stat-grid">${statCard('Jenis Barang', data.stock.length, 'Item inventaris tercatat', 'boxes')}${statCard('Stok Menipis', low, low ? 'Perlu segera restock' : 'Semua stok aman', 'alert')}${statCard('Total Kuantitas', Number(data.stock.reduce((s, x) => s + Number(x.qty), 0).toFixed(2)), 'Gabungan jumlah barang', 'package')}${statCard('Kategori Layanan', data.categories.length, 'Kategori produk aktif', 'shirt')}</div><div class="card table-card"><div class="table-scroll"><table><thead><tr><th>NAMA BARANG</th><th>STOK SAAT INI</th><th>SATUAN</th><th>BATAS MINIMUM</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>${data.stock.map(s => `<tr><td><strong>${esc(s.name)}</strong></td><td><strong>${s.qty}</strong></td><td>${esc(s.unit)}</td><td>${s.min}</td><td>${s.qty <= s.min ? '<span class="pay-badge pay-unpaid">Stok menipis</span>' : '<span class="pay-badge pay-paid">Aman</span>'}</td><td><div class="table-actions"><button class="btn btn-small" data-action="stock-adjust" data-id="${s.id}">Atur Stok</button><button class="icon-btn" data-action="stock-edit" data-id="${s.id}">${icon('edit')}</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function stockForm(s = {}) {
    openModal(s.id ? 'Edit Barang' : 'Tambah Barang', `<form id="stockForm"><div class="form-grid"><div class="field full"><label>Nama barang *</label><input name="name" required value="${esc(s.name || '')}"></div><div class="field"><label>Jumlah saat ini</label><input name="qty" type="number" min="0" step="0.1" value="${s.qty ?? 0}"></div><div class="field"><label>Satuan</label><input name="unit" value="${esc(s.unit || 'pcs')}"></div><div class="field"><label>Batas minimum</label><input name="min" type="number" min="0" step="0.1" value="${s.min ?? 0}"></div></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="stock-save" data-id="${s.id || ''}">Simpan</button>`);
  }
  function saveStock(id) {
    const f = $('#stockForm'); if (!f.reportValidity()) return; const fd = new FormData(f);
    const s = { id: id || makeId('STK'), name: String(fd.get('name')).trim(), qty: Number(fd.get('qty')), unit: String(fd.get('unit')).trim(), min: Number(fd.get('min')) };
    if (id) { const i = data.stock.findIndex(x => x.id === id); data.stock[i] = s; log('Stok diperbarui', s.name); }
    else { data.stock.push(s); log('Barang stok ditambahkan', s.name); }
    saveData(); closeModal(); renderPage(); toast('Data stok tersimpan.');
  }
  function adjustStock(id) {
    const s = data.stock.find(x => x.id === id); if (!s) return;
    openModal('Penyesuaian Stok', `<p style="font-size:10px;color:#777;margin-top:0">Barang: <strong>${esc(s.name)}</strong> · stok sekarang ${s.qty} ${esc(s.unit)}.</p><form id="stockAdjustForm"><div class="form-grid"><div class="field"><label>Jenis penyesuaian</label><select name="type"><option value="add">Stok masuk (+)</option><option value="sub">Stok keluar (−)</option><option value="set">Set jumlah aktual</option></select></div><div class="field"><label>Jumlah</label><input name="qty" type="number" min="0" step="0.1" value="1" required></div><div class="field full"><label>Catatan</label><input name="note" placeholder="Contoh: Pembelian dari supplier"></div></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="stock-adjust-save" data-id="${id}">Simpan Penyesuaian</button>`);
  }

  function renderCustomers() {
    return `${pageHeading('Pelanggan', 'Database pelanggan, kontak, dan poin loyalitas.', `<button class="btn btn-primary" data-action="customer-add">${icon('plus')} Tambah Pelanggan</button>`)}<div class="toolbar"><div class="search-box">${icon('search')}<input id="customerSearch" placeholder="Cari nama atau nomor HP…"></div><span class="muted" style="font-size:9px">${data.customers.length} pelanggan</span></div><div class="card table-card"><div class="table-scroll"><table><thead><tr><th>PELANGGAN</th><th>NOMOR HP</th><th>ALAMAT</th><th>POIN</th><th>BERGABUNG</th><th>AKSI</th></tr></thead><tbody id="customerRows">${customerRows(data.customers)}</tbody></table></div></div>`;
  }
  function customerRows(rows) {
    return rows.length ? rows.map(c => `<tr><td><div class="table-person"><div class="customer-avatar">${esc(initials(c.name))}</div><strong>${esc(c.name)}</strong></div></td><td>${esc(c.phone)}</td><td>${esc(c.address || '—')}</td><td><strong>${c.points || 0} poin</strong></td><td>${shortDate(c.joinedAt)}</td><td><div class="table-actions"><button class="icon-btn" data-action="customer-edit" data-id="${c.id}">${icon('edit')}</button><button class="icon-btn" data-action="customer-delete" data-id="${c.id}">${icon('trash')}</button></div></td></tr>`).join('') : '<tr><td colspan="6" class="muted">Belum ada pelanggan.</td></tr>';
  }
  function customerForm(c = {}) {
    openModal(c.id ? 'Edit Pelanggan' : 'Tambah Pelanggan', `<form id="customerForm"><div class="form-grid"><div class="field"><label>Nama pelanggan *</label><input name="name" required value="${esc(c.name || '')}"></div><div class="field"><label>Nomor HP *</label><input name="phone" required value="${esc(c.phone || '')}"></div><div class="field full"><label>Alamat</label><textarea name="address">${esc(c.address || '')}</textarea></div><div class="field"><label>Poin loyalitas</label><input name="points" type="number" min="0" value="${c.points || 0}"></div></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="customer-save" data-id="${c.id || ''}">Simpan</button>`);
  }
  function saveCustomer(id) {
    const f = $('#customerForm'); if (!f.reportValidity()) return; const fd = new FormData(f);
    const obj = { id: id || makeId('CUS'), name: String(fd.get('name')).trim(), phone: String(fd.get('phone')).trim(), address: String(fd.get('address') || '').trim(), points: Number(fd.get('points') || 0), joinedAt: id ? (getCustomer(id)?.joinedAt || nowISO()) : nowISO() };
    const dup = data.customers.find(c => c.phone.replace(/\D/g, '') === obj.phone.replace(/\D/g, '') && c.id !== id);
    if (dup) { toast('Nomor HP sudah terdaftar.', 'error'); return; }
    if (id) { const i = data.customers.findIndex(c => c.id === id); data.customers[i] = obj; log('Data pelanggan diperbarui', obj.name); }
    else { data.customers.push(obj); log('Pelanggan ditambahkan', obj.name); }
    saveData(); closeModal(); renderPage(); toast('Data pelanggan tersimpan.');
  }

  function renderExpenses() {
    if (!ownerOnly()) return renderDashboard();
    const sum = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
    return `${pageHeading('Pengeluaran', 'Catat biaya operasional agar arus kas lebih terkontrol.', `<button class="btn btn-primary" data-action="expense-add">${icon('plus')} Catat Pengeluaran</button>`)}<div class="stat-grid">${statCard('Total Pengeluaran', rupiah(sum), 'Seluruh catatan pengeluaran', 'wallet')}${statCard('Catatan Biaya', data.expenses.length, 'Transaksi biaya tercatat', 'receipt')}${statCard('Bulan Ini', rupiah(data.expenses.filter(e => e.date.slice(0, 7) === todayISO().slice(0, 7)).reduce((s, e) => s + Number(e.amount), 0)), 'Pengeluaran bulan berjalan', 'calendar')}${statCard('Kategori', new Set(data.expenses.map(e => e.category)).size, 'Kategori biaya digunakan', 'filter')}</div><div class="card table-card"><div class="table-scroll"><table><thead><tr><th>TANGGAL</th><th>KATEGORI</th><th>KETERANGAN</th><th>NOMINAL</th><th>AKSI</th></tr></thead><tbody>${[...data.expenses].sort((a, b) => b.date.localeCompare(a.date)).map(e => `<tr><td>${shortDate(e.date)}</td><td><span class="category-pill">${esc(e.category)}</span></td><td><strong>${esc(e.description)}</strong></td><td><strong>${rupiah(e.amount)}</strong></td><td><button class="icon-btn" data-action="expense-delete" data-id="${e.id}">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Belum ada pengeluaran.</td></tr>'}</tbody></table></div></div>`;
  }
  function expenseForm() {
    openModal('Catat Pengeluaran', `<form id="expenseForm"><div class="form-grid"><div class="field"><label>Tanggal</label><input name="date" type="date" value="${todayISO()}" required></div><div class="field"><label>Kategori</label><select name="category"><option>Operasional</option><option>Listrik & Air</option><option>Gaji</option><option>Bahan Laundry</option><option>Perawatan Mesin</option><option>Sewa</option><option>Lainnya</option></select></div><div class="field full"><label>Keterangan</label><input name="description" required placeholder="Contoh: Pembelian detergen"></div><div class="field full"><label>Nominal (Rp)</label><input name="amount" type="number" min="1" required></div></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="expense-save">Simpan Pengeluaran</button>`);
  }

  function getFilteredReportData() {
    const now = new Date();
    let start = new Date(now);
    let periodLabel = 'Bulan Ini';
    if (reportPeriod === 'week') { start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); periodLabel = '7 Hari Terakhir'; }
    else if (reportPeriod === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); periodLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now); }
    else { start = new Date(2000, 0, 1); periodLabel = 'Semua Periode'; }

    const filteredOrders = data.orders.filter(o => new Date(o.createdAt) >= start);
    const filteredExpenses = data.expenses.filter(e => new Date(e.date) >= new Date(start.toISOString().slice(0, 10)));
    const income = filteredOrders.reduce((s, o) => s + Number(o.paid || 0), 0);
    const gross = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalPpn = filteredOrders.reduce((s, o) => s + Number(o.ppnAmount || 0), 0);
    const totalShipping = filteredOrders.reduce((s, o) => s + Number(o.shippingCost || 0), 0);
    const totalExtra = filteredOrders.reduce((s, o) => s + Number(o.extraFee || 0), 0);
    const expensesSum = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const balance = income - expensesSum;

    return { filteredOrders, filteredExpenses, income, gross, totalPpn, totalShipping, totalExtra, expensesSum, balance, periodLabel };
  }

  function renderReports() {
    if (!ownerOnly()) return renderDashboard();
    const { filteredOrders, income, gross, totalPpn, expensesSum, balance } = getFilteredReportData();
    const byProduct = {};
    filteredOrders.forEach(o => o.items.forEach(i => byProduct[i.name] = (byProduct[i.name] || 0) + i.qty));
    const max = Math.max(1, ...Object.values(byProduct));

    return `${pageHeading('Laporan Usaha', 'Evaluasi pendapatan, transaksi, dan pengeluaran usaha.', `<button class="btn" data-action="report-print">${icon('print')} Cetak Laporan</button><button class="btn btn-primary" data-action="report-export">${icon('download')} Ekspor Data</button>`)}
      <div class="toolbar"><span class="muted" style="font-size:9px">Periode laporan</span><div class="filter-tabs" style="margin:0">${[['week', '7 Hari'], ['month', 'Bulan Ini'], ['all', 'Semua']].map(([k, v]) => `<button class="filter-tab ${reportPeriod === k ? 'active' : ''}" data-action="report-period" data-period="${k}">${v}</button>`).join('')}</div></div>
      <div class="report-hero"><div><small>ESTIMASI LABA / ARUS KAS BERSIH</small><h2>${rupiah(balance)}</h2><div class="hero-note">Pemasukan diterima dikurangi pengeluaran tercatat</div></div><div class="hero-chip">${icon('chart')}</div></div>
      <div class="stat-grid">${statCard('Total Tagihan', rupiah(gross), `${filteredOrders.length} transaksi (PPN: ${rupiah(totalPpn)})`, 'receipt')}${statCard('Pembayaran Diterima', rupiah(income), 'Kas masuk dari pesanan', 'wallet')}${statCard('Pengeluaran', rupiah(expensesSum), 'Biaya operasional tercatat', 'wallet')}${statCard('Rata-rata Transaksi', rupiah(filteredOrders.length ? gross / filteredOrders.length : 0), 'Nilai per pesanan', 'chart')}</div>
      <div class="report-grid">
        <div class="card panel"><div class="panel-head"><div><h3>Layanan Terjual</h3><p>Jumlah satuan per layanan</p></div></div><div class="bar-list">${Object.entries(byProduct).sort((a, b) => b[1] - a[1]).map(([name, qty]) => `<div class="bar-row"><label>${esc(name)}</label><div class="progress-track"><i style="width:${qty / max * 100}%"></i></div><b>${qty}</b></div>`).join('') || '<p class="muted">Belum ada penjualan pada periode ini.</p>'}</div></div>
        <div class="card panel"><div class="panel-head"><div><h3>Ringkasan Status & Metode Bayar</h3><p>Distribusi transaksi periode berjalan</p></div></div><div class="status-summary">${['Aktif', 'Proses', 'Selesai', 'Diambil'].map(s => `<div class="status-line"><span>${s}</span><strong>${filteredOrders.filter(o => o.status === s).length}</strong><div class="progress-track"><i style="width:${filteredOrders.length ? filteredOrders.filter(o => o.status === s).length / filteredOrders.length * 100 : 0}%"></i></div></div>`).join('')}</div><div class="settings-note">Klik tombol <b>Cetak Laporan</b> di atas untuk menghasilkan laporan formal yang rapi dan siap cetak/PDF.</div></div>
      </div>`;
  }

  function renderHistory() {
    return `${pageHeading('Riwayat Aktivitas', 'Jejak aktivitas aplikasi dan perubahan transaksi.', `<button class="btn" data-action="history-clear">${icon('trash')} Bersihkan Riwayat</button>`)}<div class="card panel"><div class="activity-list">${data.history.length ? data.history.map(h => `<div class="activity-item"><div class="activity-rail">${icon('history')}</div><div class="activity-copy"><strong>${esc(h.action)}</strong><p>${esc(h.detail)}</p><time>${dateTime(h.at)}</time></div></div>`).join('') : '<div class="empty-state">Belum ada riwayat aktivitas.</div>'}</div></div>`;
  }

  function renderTracking() {
    return `${pageHeading('Tracking Pesanan', 'Halaman pencarian status cucian untuk pelanggan.', `<button class="btn" data-action="go-orders">${icon('package')} Kelola Pesanan</button>`)}<section class="tracking-hero"><h2>Lacak cucian Anda.</h2><p>Masukkan kode transaksi atau nomor WhatsApp yang terdaftar untuk melihat status pesanan.</p><div class="tracking-search"><input id="trackingInput" value="${esc(trackingQuery)}" placeholder="Contoh: TRX-0304 atau 0812xxxx"><button class="btn btn-primary" data-action="tracking-search">Lacak Pesanan ${icon('chevron')}</button></div></section>${trackingResult ? trackingResultMarkup(trackingResult) : `<div class="card panel"><div class="empty-state"><div class="empty-icon">${icon('scan')}</div><h3>Masukkan kode transaksi</h3><p>Status, estimasi selesai, dan sisa pembayaran akan muncul di sini.</p></div></div>`}`;
  }
  function trackingResultMarkup(o) {
    const steps = ['Aktif', 'Proses', 'Selesai', 'Diambil'];
    const idx = steps.indexOf(o.status);
    const remaining = Math.max(0, Number(o.total) - Number(o.paid));
    return `<section class="card tracking-result"><div class="order-top"><div><p class="eyebrow">HASIL PELACAKAN</p><div class="order-code" style="font-size:15px">${esc(o.code)}</div></div>${statusBadge(o.status)}</div><div class="detail-grid" style="margin-top:15px"><div class="detail-box"><small>NAMA PELANGGAN</small><strong>${esc(o.customerName)}</strong></div><div class="detail-box"><small>ESTIMASI PENGAMBILAN</small><strong>${dateTime(o.dueAt)} WIB</strong></div><div class="detail-box"><small>LOKASI RAK</small><strong>${esc(o.rack || 'Menunggu penempatan')}</strong></div><div class="detail-box"><small>TOTAL TAGIHAN</small><strong>${rupiah(o.total)}</strong></div></div><div class="tracking-steps">${steps.map((s, i) => `<div class="tracking-step ${i <= idx ? 'done' : ''}"><div class="step-dot">${i <= idx ? icon('check') : `${i + 1}`}</div><strong>${s}</strong><small>${i === idx ? 'Status saat ini' : ''}</small></div>`).join('')}</div><div class="detail-item"><span>Pembayaran (${esc(o.paymentMethod || 'Cash')})</span><strong>${paymentBadge(o)}</strong></div><div class="detail-item"><span>Sisa tagihan</span><strong>${rupiah(remaining)}</strong></div>${o.notes ? `<div class="settings-note">Catatan: ${esc(o.notes)}</div>` : ''}</section>`;
  }
  function doTrackingSearch() {
    const q = String($('#trackingInput')?.value || '').trim();
    trackingQuery = q;
    if (!q) { toast('Masukkan kode transaksi atau nomor HP.', 'error'); return; }
    const normalized = q.replace(/\D/g, '');
    const found = data.orders.filter(o => o.code.toLowerCase() === q.toLowerCase() || (normalized.length >= 8 && o.phone.replace(/\D/g, '') === normalized));
    if (found.length === 1) { trackingResult = found[0]; renderPage(); }
    else if (found.length > 1) { openModal('Pilih Pesanan', `<p style="font-size:10px;color:#777">Nomor HP ini memiliki beberapa transaksi. Pilih kode yang ingin dilacak.</p>${found.map(o => `<button class="btn" style="width:100%;justify-content:space-between;margin:4px 0" data-action="tracking-pick" data-id="${o.id}">${esc(o.code)} · ${esc(o.status)} <span>${dateTime(o.dueAt)}</span></button>`).join('')}`, '<button class="btn" data-action="modal-close">Tutup</button>'); }
    else { trackingResult = null; renderPage(); toast('Pesanan tidak ditemukan. Periksa kembali kode atau nomor HP.', 'error'); }
  }

  function renderBooking() {
    return `${pageHeading('Booking Jemput', 'Terima permintaan penjemputan cucian dari pelanggan.', `<button class="btn" data-action="booking-export">${icon('download')} Ekspor Booking</button>`)}<div class="cashier-layout"><section class="card booking-card"><div class="panel-head"><div><h3>Form Booking Jemput</h3><p>Isi permintaan pelanggan untuk dijadwalkan kurir.</p></div><span class="stat-icon">${icon('truck')}</span></div><form id="bookingForm"><div class="form-grid"><div class="field"><label>Nama pelanggan *</label><input name="name" required placeholder="Nama lengkap"></div><div class="field"><label>Nomor WhatsApp *</label><input name="phone" required placeholder="08xxxxxxxxxx"></div><div class="field full"><label>Alamat penjemputan *</label><textarea name="address" required placeholder="Alamat lengkap / patokan rumah"></textarea><div class="inline-actions"><button type="button" class="btn btn-small" data-action="booking-location">${icon('pin')} Ambil pin lokasi saya</button><span class="help" id="bookingGeoLabel">Koordinat lokasi opsional</span></div><input type="hidden" name="latitude" id="bookingLat"><input type="hidden" name="longitude" id="bookingLng"></div><div class="field"><label>Jadwal penjemputan *</label><input name="pickupAt" type="datetime-local" value="${addDays(1, 9)}" required></div><div class="field"><label>Perkiraan berat (kg)</label><input name="weight" type="number" min="0" step="0.5" placeholder="Contoh: 4"></div><div class="field full"><label>Catatan khusus</label><textarea name="notes" placeholder="Pisahkan baju putih, ada noda, dll."></textarea></div></div><div class="form-footer"><button class="btn btn-primary" type="submit">${icon('check')} Simpan Booking</button></div></form></section><section class="card panel"><div class="panel-head"><div><h3>Info Layanan Jemput</h3><p>Catatan operasional kurir</p></div></div><div class="activity-list"><div class="activity-item"><div class="activity-rail">${icon('pin')}</div><div class="activity-copy"><strong>Konfirmasi lokasi</strong><p>Hubungi pelanggan untuk memastikan alamat dan patokan lokasi.</p></div></div><div class="activity-item"><div class="activity-rail">${icon('clock')}</div><div class="activity-copy"><strong>Jadwal penjemputan</strong><p>Pastikan kurir datang pada rentang waktu yang disepakati.</p></div></div><div class="activity-item"><div class="activity-rail">${icon('camera')}</div><div class="activity-copy"><strong>Dokumentasi cucian</strong><p>Ambil foto kondisi cucian saat diterima untuk dokumentasi.</p></div></div></div></section></div><div style="height:15px"></div><div class="panel-head"><div><h3>Daftar Booking</h3><p>${data.bookings.length} permintaan penjemputan</p></div></div><div class="card table-card"><div class="table-scroll"><table><thead><tr><th>PELANGGAN</th><th>JADWAL</th><th>ALAMAT</th><th>PERKIRAAN</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>${data.bookings.map(b => `<tr><td><strong>${esc(b.name)}</strong><br><span class="muted">${esc(b.phone)}</span></td><td>${dateTime(b.pickupAt)}</td><td>${esc(b.address)}${b.latitude && b.longitude ? `<br><button class="text-link" data-action="booking-map" data-id="${b.id}">Lihat pin peta ↗</button>` : ''}</td><td>${b.weight ? `${b.weight} kg` : '—'}</td><td><span class="pay-badge ${b.status === 'Dijemput' ? 'pay-paid' : 'pay-unpaid'}">${esc(b.status)}</span></td><td><div class="table-actions"><button class="btn btn-small" data-action="booking-status" data-id="${b.id}">${b.status === 'Menunggu' ? 'Tandai Dijemput' : 'Selesai'}</button><button class="icon-btn" data-action="booking-delete" data-id="${b.id}">${icon('trash')}</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Belum ada booking yang masuk.</td></tr>'}</tbody></table></div></div>`;
  }

  function renderSettings() {
    if (!ownerOnly()) return renderDashboard();
    return `${pageHeading('Pengaturan', 'Konfigurasi identitas usaha dan pengelolaan aplikasi.', `<button class="btn" data-action="export-backup">${icon('download')} Backup Data</button>`)}<div class="settings-layout"><div class="card settings-nav">${[['business', 'IDN-GO', 'settings'], ['access', 'Hak Akses', 'users'], ['data', 'Data & Backup', 'download'], ['about', 'Tentang Aplikasi', 'grid']].map(([k, label, ic]) => `<button class="${settingsTab === k ? 'active' : ''}" data-action="settings-tab" data-tab="${k}">${icon(ic)} ${label}</button>`).join('')}</div><section class="card settings-panel">${settingsTab === 'business' ? `<h3>Profil Usaha</h3><p>Informasi ini digunakan pada struk, laporan cetak, dan identitas aplikasi.</p><form id="businessSettings"><div class="form-grid"><div class="field full"><label>Nama usaha</label><input name="businessName" value="${esc(data.settings.businessName)}" required></div><div class="field"><label>Nomor WhatsApp usaha</label><input name="phone" value="${esc(data.settings.phone || '')}"></div><div class="field"><label>Pengingat pesanan selesai (jam)</label><input name="pickupReminderHours" type="number" min="1" value="${data.settings.pickupReminderHours || 24}"></div><div class="field full"><label>Alamat usaha</label><textarea name="address">${esc(data.settings.address || '')}</textarea></div></div><div class="form-footer"><button class="btn btn-primary" type="submit">Simpan Pengaturan</button></div></form>` : settingsTab === 'access' ? `<h3>Hak Akses & Shift</h3><p>Ubah mode pengguna untuk membatasi menu kasir.</p><div class="form-grid"><div class="field"><label>Mode pengguna saat ini</label><select id="roleSetting"><option ${data.role === 'Owner' ? 'selected' : ''}>Owner</option><option ${data.role === 'Kasir' ? 'selected' : ''}>Kasir</option></select></div><div class="field"><label>PIN Owner</label><input id="ownerPinSetting" value="${esc(data.settings.ownerPin || '1234')}" maxlength="8"></div></div><div class="settings-note"><strong>Hak akses Owner:</strong> seluruh menu termasuk laporan, pengeluaran, pengaturan, dan backup.<br><strong>Hak akses Kasir:</strong> kasir, pesanan, produk, stok, pelanggan, tracking, dan booking.</div><div class="form-footer"><button class="btn btn-primary" data-action="role-save">Simpan Hak Akses</button></div>` : settingsTab === 'data' ? `<h3>Data & Backup</h3><p>Data tersimpan di localStorage browser/perangkat ini.</p><div class="two-col"><div class="mini-stat"><small>Jumlah Pesanan</small><strong>${data.orders.length}</strong></div><div class="mini-stat"><small>Jumlah Pelanggan</small><strong>${data.customers.length}</strong></div><div class="mini-stat"><small>Produk</small><strong>${data.products.length}</strong></div><div class="mini-stat"><small>Aktivitas</small><strong>${data.history.length}</strong></div></div><div class="inline-actions" style="margin-top:16px;flex-wrap:wrap"><button class="btn btn-primary" data-action="export-backup">${icon('download')} Unduh Backup JSON</button><button class="btn" data-action="import-backup">${icon('upload')} Pulihkan Backup</button><button class="btn btn-danger" data-action="reset-data">Reset Data Demo</button><input id="backupFile" type="file" accept="application/json" class="hidden"></div>` : `<h3>Tentang IDN-GO</h3><p>Panel manajemen usaha laundry berbasis web.</p><div class="detail-grid"><div class="detail-box"><small>VERSI</small><strong>1.1.0 · Full Features</strong></div><div class="detail-box"><small>TEKNOLOGI</small><strong>HTML · CSS · JavaScript</strong></div><div class="detail-box"><small>PENYIMPANAN</small><strong>Browser localStorage</strong></div><div class="detail-box"><small>FORMAT WAKTU</small><strong>24 Jam (WIB)</strong></div></div>`}</section></div>`;
  }

  function openModal(title, body, footer = '') {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = body;
    $('#modalFooter').innerHTML = footer;
    $('#modalBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    $$('[data-icon]', $('#modalBackdrop')).forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  }
  function closeModal() {
    $('#modalBackdrop').hidden = true;
    $('#modalBody').innerHTML = '';
    $('#modalFooter').innerHTML = '';
    document.body.style.overflow = '';
  }

  function recalculateOrderTotals(o) {
    o.subtotal = o.items.reduce((sum, i) => sum + Number(i.qty || 0) * Number(i.price || 0), 0);
    o.discount = Math.min(Number(o.discount || 0), o.subtotal);
    const taxableBase = Math.max(0, o.subtotal - o.discount);
    o.ppnAmount = o.ppnEnabled ? Math.round(taxableBase * 0.11) : 0;
    o.total = taxableBase + o.ppnAmount + Number(o.shippingCost || 0) + Number(o.extraFee || 0);
  }

  function addBillItemForm(id) {
    const o = getOrder(id); if (!o) return;
    const products = data.products.filter(p => p.active !== false);
    if (!products.length) { toast('Belum ada produk aktif di Produk & Kategori.', 'error'); return; }
    openModal('Tambah Item Tagihan', `<form id="billItemForm"><div class="field"><label>Produk</label><select name="productId" required>${products.map(p => `<option value="${esc(p.id)}">${esc(p.name)} · ${rupiah(p.price)}/${esc(p.unit)}</option>`).join('')}</select></div><div class="field"><label>Jumlah</label><input name="qty" type="number" min="0.1" step="0.1" value="1" required></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="bill-item-save" data-id="${esc(id)}">Tambah</button>`);
  }
  function saveBillItem(id) {
    const o = getOrder(id), form = $('#billItemForm'); if (!o || !form || !form.reportValidity()) return;
    const fd = new FormData(form), p = data.products.find(x => x.id === fd.get('productId')), qty = Number(fd.get('qty')); if (!p || qty <= 0) return;
    o.items.push({ productId: p.id, name: p.name, qty, unit: p.unit, price: Number(p.price) });
    recalculateOrderTotals(o);
    log('Item tambahan ditambahkan', `${o.code} · ${p.name} × ${qty}`);
    saveData(); closeModal(); showOrderDetail(id); toast('Item ditambahkan ke tagihan.');
  }
  function stockUsageForm(id) {
    const o = getOrder(id); if (!o) return;
    if (!data.stock.length) { toast('Belum ada barang di menu Stok.', 'error'); return; }
    openModal('Catat Pemakaian Stok', `<form id="stockUsageForm"><div class="field"><label>Barang stok</label><select name="stockId" required>${data.stock.map(s => `<option value="${esc(s.id)}">${esc(s.name)} · tersedia ${s.qty} ${esc(s.unit)}</option>`).join('')}</select></div><div class="field"><label>Jumlah pemakaian</label><input name="qty" type="number" min="0.1" step="0.1" value="1" required></div><div class="field"><label>Catatan</label><input name="note" placeholder="Opsional"></div></form>`, `<button class="btn" data-action="modal-close">Batal</button><button class="btn btn-primary" data-action="stock-use-save" data-id="${esc(id)}">Catat Pemakaian</button>`);
  }
  function saveStockUsage(id) {
    const o = getOrder(id), form = $('#stockUsageForm'); if (!o || !form || !form.reportValidity()) return;
    const fd = new FormData(form), s = data.stock.find(x => x.id === fd.get('stockId')), qty = Number(fd.get('qty')); if (!s || qty <= 0) return;
    if (qty > Number(s.qty)) { toast('Stok tidak mencukupi.', 'error'); return; }
    s.qty = Number((Number(s.qty) - qty).toFixed(2));
    o.stockUsed = o.stockUsed || [];
    o.stockUsed.push({ stockId: s.id, name: s.name, qty, unit: s.unit, note: String(fd.get('note') || ''), at: nowISO() });
    log('Pemakaian stok dicatat', `${o.code} · ${s.name} ${qty} ${s.unit}`);
    saveData(); closeModal(); showOrderDetail(id); toast('Pemakaian stok tercatat.');
  }

  function showOrderDetail(id) {
    const o = getOrder(id); if (!o) return;
    const remaining = Math.max(0, o.total - o.paid);
    const images = (o.beforePhoto || o.afterPhoto) ? `<div class="detail-section"><h4>Foto Kondisi Cucian</h4><div class="inline-actions">${o.beforePhoto ? `<div><small class="muted">Sebelum</small><br><img class="photo-preview" src="${o.beforePhoto}" alt="Foto sebelum"></div>` : ''}${o.afterPhoto ? `<div><small class="muted">Sesudah</small><br><img class="photo-preview" src="${o.afterPhoto}" alt="Foto sesudah"></div>` : ''}</div></div>` : '';
    openModal(`Detail ${o.code}`, `
      <div class="order-top">${statusBadge(o.status)}${paymentBadge(o)}</div>
      <div class="detail-grid" style="margin-top:14px">
        <div class="detail-box"><small>PELANGGAN</small><strong>${esc(o.customerName)}</strong></div>
        <div class="detail-box"><small>NOMOR WHATSAPP</small><strong>${esc(o.phone)}</strong></div>
        <div class="detail-box"><small>TANGGAL MASUK</small><strong>${dateTime(o.createdAt)} WIB</strong></div>
        <div class="detail-box"><small>ESTIMASI AMBIL</small><strong>${dateTime(o.dueAt)} WIB</strong></div>
        <div class="detail-box"><small>LOKASI RAK</small><strong>${esc(o.rack || 'Belum ditentukan')}</strong></div>
        <div class="detail-box"><small>METODE PEMBAYARAN</small><strong>${esc(o.paymentMethod || 'Cash')}</strong></div>
      </div>
      <div class="detail-section">
        <h4>Rincian Layanan & Biaya</h4>
        ${o.items.map(i => `<div class="detail-item"><span>${esc(i.name)} · ${i.qty} ${esc(i.unit)}</span><strong>${rupiah(i.qty * i.price)}</strong></div>`).join('')}
        <div class="detail-item"><span>Subtotal Layanan</span><strong>${rupiah(o.subtotal)}</strong></div>
        ${o.discount ? `<div class="detail-item"><span>Diskon</span><strong>− ${rupiah(o.discount)}</strong></div>` : ''}
        ${o.ppnEnabled || o.ppnAmount ? `<div class="detail-item"><span>PPN 11%</span><strong>${rupiah(o.ppnAmount)}</strong></div>` : ''}
        ${o.shippingCost ? `<div class="detail-item"><span>Ongkir</span><strong>${rupiah(o.shippingCost)}</strong></div>` : ''}
        ${o.extraFee ? `<div class="detail-item"><span>Biaya Tambahan${o.extraFeeNote ? ` (${esc(o.extraFeeNote)})` : ''}</span><strong>${rupiah(o.extraFee)}</strong></div>` : ''}
        <div class="detail-item"><strong>Total Tagihan</strong><strong>${rupiah(o.total)}</strong></div>
        <div class="detail-item"><span>Dibayar (${esc(o.paymentMethod || 'Cash')})</span><strong>${rupiah(o.paid)}</strong></div>
        <div class="detail-item"><span>Sisa tagihan</span><strong>${rupiah(remaining)}</strong></div>
      </div>
      ${o.notes ? `<div class="settings-note">Catatan: ${esc(o.notes)}</div>` : ''}
      ${images}
      ${o.stockUsed?.length ? `<div class="detail-section"><h4>Pemakaian Sabun & Stok</h4>${o.stockUsed.map(u => `<div class="detail-item"><span>${esc(u.name)} · ${u.qty} ${esc(u.unit)}${u.note ? ` — ${esc(u.note)}` : ''}</span><small>${dateTime(u.at)}</small></div>`).join('')}</div>` : ''}
      <div class="detail-section no-print">
        <h4>Ubah Status / Pembayaran</h4>
        <div class="form-grid">
          <div class="field"><label>Status pesanan</label><select id="detailStatus">${['Aktif', 'Proses', 'Selesai', 'Diambil'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Tambah pembayaran (Rp)</label><input id="detailPayment" type="number" min="0" value="0"></div>
          <div class="field"><label>Metode pembayaran</label><input id="detailPaymentMethod" value="${esc(o.paymentMethod || 'Cash')}" placeholder="Cash / Transfer / QRIS"></div>
          <div class="field"><label>Lokasi rak</label><input id="detailRack" value="${esc(o.rack || '')}"></div>
          <div class="field full"><label>Foto kondisi (tambahan)</label><input id="detailPhoto" type="file" accept="image/*" capture="environment"></div>
        </div>
      </div>`,
      `<button class="btn" data-action="order-add-item" data-id="${o.id}">${icon('plus')} Tambah Item</button><button class="btn" data-action="order-stock-use" data-id="${o.id}">${icon('boxes')} Stok</button><button class="btn" data-action="modal-close">Tutup</button><button class="btn" data-action="order-whatsapp" data-id="${o.id}">${icon('whatsapp')} WhatsApp</button><button class="btn" data-action="order-print" data-id="${o.id}">${icon('print')} Cetak Struk</button><button class="btn btn-primary" data-action="order-detail-save" data-id="${o.id}">Simpan</button>`
    );
  }
  function saveOrderDetail(id) {
    const o = getOrder(id); if (!o) return;
    const status = $('#detailStatus')?.value;
    if (status) o.status = status;
    const payment = Math.max(0, Number($('#detailPayment')?.value || 0));
    if (payment > 0) { o.paid = Math.min(o.total, Number(o.paid || 0) + payment); }
    const pm = String($('#detailPaymentMethod')?.value || '').trim();
    if (pm) o.paymentMethod = pm;
    o.rack = String($('#detailRack')?.value || '').trim();
    const file = $('#detailPhoto')?.files?.[0];
    const finish = async () => {
      if (file) { o.afterPhoto = await compressImage(file); }
      if (isPaid(o)) awardPoints(o);
      log('Pesanan diperbarui', `${o.code} · status ${o.status}`);
      saveData(); closeModal(); renderPage(); toast('Perubahan pesanan tersimpan.');
    };
    finish();
  }
  function updateOrderStatus(id) {
    const o = getOrder(id); if (!o) return;
    const statuses = ['Aktif', 'Proses', 'Selesai', 'Diambil'];
    const idx = statuses.indexOf(o.status); if (idx < 0 || idx === 3) return;
    o.status = statuses[idx + 1];
    if (o.status === 'Diambil' && !isPaid(o)) toast('Pesanan ditandai diambil, tetapi masih ada sisa pembayaran.', 'error');
    if (isPaid(o)) awardPoints(o);
    log('Status pesanan diperbarui', `${o.code} → ${o.status}`);
    saveData(); renderPage(); toast(`${o.code} sekarang ${o.status}.`);
  }

  function deleteOrder(id) {
    const order = getOrder(id);
    if (!order) return;
    const warning = `Hapus pesanan ${order.code} atas nama ${order.customerName}?\n\nPesanan akan hilang dari Daftar Pesanan, Tracking, dan perhitungan laporan. Stok yang terpakai pada transaksi ini akan dikembalikan.`;
    if (!window.confirm(warning)) return;

    if (Number(order.paid || 0) > 0 || order.status === 'Diambil') {
      const paymentWarning = `Perhatian: pesanan ini sudah menerima pembayaran ${rupiah(order.paid || 0)} dan berstatus ${order.status}.\n\nMenghapusnya juga akan mengurangi angka pemasukan pada laporan. Lanjutkan?`;
      if (!window.confirm(paymentWarning)) return;
    }

    // Kembalikan stok sabun/bahan jika transaksi dihapus
    if (Array.isArray(order.stockUsed) && order.stockUsed.length) {
      order.stockUsed.forEach(u => {
        const s = data.stock.find(x => x.id === u.stockId);
        if (s) s.qty = Number((Number(s.qty) + Number(u.qty || 0)).toFixed(2));
      });
    }

    if (order.pointsAwarded) {
      const customer = getCustomer(order.customerId);
      if (customer) {
        const earned = Math.floor(Number(order.total || 0) / 10000);
        customer.points = Math.max(0, Number(customer.points || 0) - earned);
      }
    }

    data.orders = data.orders.filter(item => item.id !== id);
    if (trackingResult?.id === id) { trackingResult = null; trackingQuery = ''; }
    log('Pesanan dihapus', `${order.code} · ${order.customerName} · ${rupiah(order.total)}`);
    saveData();
    renderPage();
    toast(`Pesanan ${order.code} dihapus & stok dikembalikan.`);
  }

  function sendWhatsApp(order) {
    const number = String(order.phone || '').replace(/\D/g, '').replace(/^0/, '62');
    if (!number) { toast('Nomor WhatsApp pelanggan belum tersedia.', 'error'); return; }
    const due = `${dateTime(order.dueAt)} WIB`;
    const remaining = Math.max(0, order.total - order.paid);
    const message = `Halo ${order.customerName}, update dari ${data.settings.businessName}.\n\nKode transaksi: ${order.code}\nStatus cucian: ${order.status}\nEstimasi pengambilan: ${due}\nMetode bayar: ${order.paymentMethod || 'Cash'}\nTotal: ${rupiah(order.total)}\nSisa pembayaran: ${rupiah(remaining)}\n\nTerima kasih.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  function showReceipt(id) {
    const o = getOrder(id); if (!o) return;
    const biz = data.settings;
    const remaining = Math.max(0, o.total - o.paid);
    openModal('Pratinjau Struk Transaksi', `<div class="print-area"><div class="receipt">
      <div class="receipt-header">
        <h2>${esc(biz.businessName)}</h2>
        <p>${esc(biz.address || '')}</p>
        <p>Telp / WA: ${esc(biz.phone || '')}</p>
      </div>
      <hr>
      <div class="receipt-meta-grid">
        <div class="receipt-row"><span>No. Transaksi</span><b>${esc(o.code)}</b></div>
        <div class="receipt-row"><span>Tanggal Masuk</span><span>${dateTime(o.createdAt)} WIB</span></div>
        <div class="receipt-row"><span>Pelanggan</span><b>${esc(o.customerName)} (${esc(o.phone || '-')})</b></div>
        <div class="receipt-row"><span>Estimasi Ambil</span><b>${dateTime(o.dueAt)} WIB</b></div>
        <div class="receipt-row"><span>Lokasi Rak</span><span>${esc(o.rack || '—')}</span></div>
        <div class="receipt-row"><span>Metode Bayar</span><b>${esc(o.paymentMethod || 'Cash')}</b></div>
      </div>
      <hr>
      <div class="receipt-items-head"><span>LAYANAN</span><span>JUMLAH</span></div>
      ${o.items.map(i => `<div class="receipt-item-block"><div class="receipt-item-name">${esc(i.name)}</div><div class="receipt-row"><span>${i.qty} ${esc(i.unit)} × ${rupiah(i.price)}</span><span>${rupiah(i.qty * i.price)}</span></div></div>`).join('')}
      <hr>
      <div class="receipt-row"><span>Subtotal</span><span>${rupiah(o.subtotal)}</span></div>
      ${o.discount ? `<div class="receipt-row"><span>Diskon</span><span>− ${rupiah(o.discount)}</span></div>` : ''}
      ${o.ppnEnabled || o.ppnAmount ? `<div class="receipt-row"><span>PPN 11%</span><span>${rupiah(o.ppnAmount)}</span></div>` : ''}
      ${o.shippingCost ? `<div class="receipt-row"><span>Ongkir</span><span>${rupiah(o.shippingCost)}</span></div>` : ''}
      ${o.extraFee ? `<div class="receipt-row"><span>Biaya Tambahan${o.extraFeeNote ? ` (${esc(o.extraFeeNote)})` : ''}</span><span>${rupiah(o.extraFee)}</span></div>` : ''}
      <div class="receipt-row receipt-total"><span>TOTAL TAGIHAN</span><span>${rupiah(o.total)}</span></div>
      <div class="receipt-row"><span>Dibayar (${esc(o.paymentMethod || 'Cash')})</span><span>${rupiah(o.paid)}</span></div>
      <div class="receipt-row"><span>Sisa Tagihan</span><b>${rupiah(remaining)} (${remaining === 0 ? 'LUNAS' : 'BELUM LUNAS'})</b></div>
      ${o.notes ? `<hr><p style="text-align:left"><strong>Catatan:</strong> ${esc(o.notes)}</p>` : ''}
      <hr>
      <div class="receipt-footer">
        <p>Terima kasih telah mempercayakan cucian Anda kepada kami.</p>
        <p>Simpan struk ini sebagai bukti pengambilan cucian.</p>
      </div>
    </div></div>`, `<button class="btn" data-action="modal-close">Tutup</button><button class="btn btn-primary" data-action="print-now">${icon('print')} Cetak Struk (Full Halaman)</button>`);
  }
  function printCurrentModal() { window.print(); }

  function showNotifications() {
    const overdue = data.orders.filter(isOverdue);
    const almost = data.orders.filter(o => o.status !== 'Diambil' && !isOverdue(o) && o.dueAt && new Date(o.dueAt) - Date.now() < 6 * 60 * 60 * 1000);
    openModal('Notifikasi Operasional', `<div class="activity-list">${overdue.map(o => `<div class="activity-item"><div class="activity-rail">${icon('alert')}</div><div class="activity-copy"><strong class="overdue-text">${esc(o.code)} melewati estimasi</strong><p>${esc(o.customerName)} · jadwal ${dateTime(o.dueAt)} WIB</p><button class="text-link" data-action="order-detail" data-id="${o.id}">Lihat detail</button></div></div>`).join('')}${almost.map(o => `<div class="activity-item"><div class="activity-rail">${icon('clock')}</div><div class="activity-copy"><strong>${esc(o.code)} mendekati estimasi</strong><p>${esc(o.customerName)} · jadwal ${dateTime(o.dueAt)} WIB</p></div></div>`).join('')}${!overdue.length && !almost.length ? `<div class="empty-state"><div class="empty-icon">${icon('checkCircle')}</div><h3>Tidak ada notifikasi</h3><p>Semua pesanan masih dalam jadwal.</p></div>` : ''}</div>`, '<button class="btn" data-action="modal-close">Tutup</button>');
  }

  function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csvEscape(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }
  function exportOrders() {
    const rows = [['Kode', 'Tanggal Masuk', 'Estimasi Ambil', 'Nama', 'Telepon', 'Layanan', 'Jumlah Item', 'Rak', 'Metode Bayar', 'Status', 'PPN 11%', 'Ongkir', 'Biaya Tambahan', 'Total', 'Dibayar', 'Sisa']];
    data.orders.forEach(o => rows.push([o.code, dateTime(o.createdAt), dateTime(o.dueAt), o.customerName, o.phone, o.items.map(i => i.name).join('; '), totalItems(o), o.rack, o.paymentMethod || 'Cash', o.status, o.ppnAmount || 0, o.shippingCost || 0, o.extraFee || 0, o.total, o.paid, Math.max(0, o.total - o.paid)]));
    downloadFile(`IDN-GO-pesanan-${todayISO()}.csv`, '\uFEFF' + rows.map(r => r.map(csvEscape).join(',')).join('\n'), 'text/csv;charset=utf-8');
    toast('File CSV pesanan berhasil diunduh.');
  }
  function exportReport() {
    const { filteredOrders } = getFilteredReportData();
    const rows = [['Kode', 'Tanggal', 'Pelanggan', 'Metode Bayar', 'Status', 'Subtotal', 'Diskon', 'PPN 11%', 'Ongkir', 'Biaya Tambahan', 'Total', 'Dibayar', 'Sisa'], ...filteredOrders.map(o => [o.code, dateTime(o.createdAt), o.customerName, o.paymentMethod || 'Cash', o.status, o.subtotal, o.discount || 0, o.ppnAmount || 0, o.shippingCost || 0, o.extraFee || 0, o.total, o.paid, Math.max(0, o.total - o.paid)])];
    downloadFile(`IDN-GO-laporan-${todayISO()}.csv`, '\uFEFF' + rows.map(r => r.map(csvEscape).join(',')).join('\n'), 'text/csv;charset=utf-8');
    toast('Data laporan berhasil diekspor.');
  }
  function exportBackup() { downloadFile(`IDN-GO-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json'); toast('Backup berhasil diunduh.'); }
  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.orders) || !Array.isArray(parsed.products) || !Array.isArray(parsed.customers)) throw new Error('Format file tidak sesuai');
        if (!confirm('Pulihkan backup? Data aplikasi saat ini akan diganti.')) return;
        data = { ...demoData(), ...parsed };
        currentPage = 'dashboard';
        saveData(); renderPage(); toast('Backup berhasil dipulihkan.');
      } catch (e) { toast(`Gagal memulihkan backup: ${e.message}`, 'error'); }
    };
    reader.readAsText(file);
  }
  function exportBookings() {
    const rows = [['Nama', 'Telepon', 'Alamat', 'Jadwal', 'Berat kg', 'Catatan', 'Status'], ...data.bookings.map(b => [b.name, b.phone, b.address, dateTime(b.pickupAt), b.weight, b.notes, b.status])];
    downloadFile(`IDN-GO-booking-${todayISO()}.csv`, rows.map(r => r.map(csvEscape).join(',')).join('\n'), 'text/csv;charset=utf-8');
  }

  // ===== CETAK LAPORAN USAHA PROFESIONAL & RAPI =====
  function exportPagePrint() {
    const { filteredOrders, filteredExpenses, income, gross, totalPpn, totalShipping, totalExtra, expensesSum, balance, periodLabel } = getFilteredReportData();
    const biz = data.settings;
    const printedAt = `${dateTime(nowISO())} WIB`;

    const byProduct = {};
    filteredOrders.forEach(o => o.items.forEach(i => {
      if (!byProduct[i.name]) byProduct[i.name] = { qty: 0, unit: i.unit, total: 0 };
      byProduct[i.name].qty += Number(i.qty || 0);
      byProduct[i.name].total += Number(i.qty || 0) * Number(i.price || 0);
    }));

    const byPayment = {};
    filteredOrders.forEach(o => {
      const m = o.paymentMethod || 'Cash';
      byPayment[m] = (byPayment[m] || 0) + Number(o.paid || 0);
    });

    const win = window.open('', '_blank');
    if (!win) { toast('Popup diblokir browser. Izinkan popup untuk mencetak laporan.', 'error'); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Usaha — ${esc(biz.businessName)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin: 0; padding: 0; font-size: 11px; line-height: 1.5; background: #fff; }
    .report-sheet { max-width: 100%; margin: 0 auto; }
    .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #111; padding-bottom: 14px; margin-bottom: 18px; }
    .letterhead h1 { margin: 0; font-size: 20px; letter-spacing: -0.3px; }
    .letterhead p { margin: 3px 0 0; color: #555; font-size: 10.5px; }
    .doc-meta { text-align: right; }
    .doc-badge { display: inline-block; background: #111; color: #fff; font-weight: 700; font-size: 10px; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.08em; }
    .doc-meta p { margin: 5px 0 0; font-size: 10px; color: #444; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .kpi-box { border: 1px solid #d4d4d4; border-radius: 8px; padding: 11px 12px; background: #fafafa; }
    .kpi-box.highlight { background: #111; color: #fff; border-color: #111; }
    .kpi-box small { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; font-weight: 700; }
    .kpi-box.highlight small { color: #bbb; }
    .kpi-box strong { display: block; font-size: 15px; margin-top: 5px; }
    .kpi-box span { display: block; font-size: 9px; color: #777; margin-top: 2px; }
    .kpi-box.highlight span { color: #aaa; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-left: 3.5px solid #111; padding-left: 8px; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #f2f2f2; color: #222; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 9px; border: 1px solid #d8d8d8; text-align: left; }
    td { padding: 7px 9px; border: 1px solid #e2e2e2; font-size: 10px; vertical-align: top; }
    tr:nth-child(even) td { background: #fcfcfc; }
    .num { text-align: right; white-space: nowrap; }
    .center { text-align: center; }
    .total-row td { background: #f3f3f3 !important; font-weight: 700; border-top: 1.5px solid #999; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .sign-area { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
    .sign-box { width: 200px; text-align: center; font-size: 10px; }
    .sign-line { margin-top: 52px; border-top: 1px solid #333; padding-top: 4px; font-weight: 700; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="report-sheet">
    <div class="letterhead">
      <div>
        <h1>${esc(biz.businessName)}</h1>
        <p>${esc(biz.address || 'Alamat usaha belum diatur')}</p>
        <p>Telepon / WhatsApp: ${esc(biz.phone || '-')}</p>
      </div>
      <div class="doc-meta">
        <span class="doc-badge">LAPORAN KEUANGAN & OPERASIONAL</span>
        <p><strong>Periode:</strong> ${esc(periodLabel)}</p>
        <p><strong>Dicetak:</strong> ${esc(printedAt)}</p>
        <p><strong>Dicetak oleh:</strong> ${esc(data.role)}</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-box">
        <small>Total Tagihan Kotor</small>
        <strong>${rupiah(gross)}</strong>
        <span>${filteredOrders.length} transaksi tercatat</span>
      </div>
      <div class="kpi-box">
        <small>Kas Masuk (Dibayar)</small>
        <strong>${rupiah(income)}</strong>
        <span>PPN: ${rupiah(totalPpn)} · Ongkir: ${rupiah(totalShipping)}</span>
      </div>
      <div class="kpi-box">
        <small>Total Pengeluaran</small>
        <strong>${rupiah(expensesSum)}</strong>
        <span>${filteredExpenses.length} pos pengeluaran</span>
      </div>
      <div class="kpi-box highlight">
        <small>Arus Kas Bersih</small>
        <strong>${rupiah(balance)}</strong>
        <span>Kas Masuk − Pengeluaran</span>
      </div>
    </div>

    <div class="two-col">
      <div>
        <div class="section-title">Rekap Layanan Terjual</div>
        <table>
          <thead><tr><th>Layanan</th><th class="num">Qty</th><th class="num">Pendapatan</th></tr></thead>
          <tbody>
            ${Object.entries(byProduct).sort((a, b) => b[1].total - a[1].total).map(([name, v]) => `<tr><td>${esc(name)}</td><td class="num">${v.qty} ${esc(v.unit)}</td><td class="num">${rupiah(v.total)}</td></tr>`).join('') || '<tr><td colspan="3" class="center">Tidak ada data layanan</td></tr>'}
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-title">Kas Masuk per Metode Pembayaran</div>
        <table>
          <thead><tr><th>Metode Pembayaran</th><th class="num">Total Diterima</th></tr></thead>
          <tbody>
            ${Object.entries(byPayment).sort((a, b) => b[1] - a[1]).map(([m, val]) => `<tr><td>${esc(m)}</td><td class="num">${rupiah(val)}</td></tr>`).join('') || '<tr><td colspan="2" class="center">Belum ada pembayaran</td></tr>'}
            <tr class="total-row"><td>TOTAL KAS MASUK</td><td class="num">${rupiah(income)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="section-title">Rincian Transaksi Pesanan (${filteredOrders.length})</div>
    <table>
      <thead>
        <tr>
          <th>Kode</th>
          <th>Tanggal</th>
          <th>Pelanggan</th>
          <th>Metode</th>
          <th>Status</th>
          <th class="num">PPN 11%</th>
          <th class="num">Ongkir & Tamb.</th>
          <th class="num">Total</th>
          <th class="num">Dibayar</th>
        </tr>
      </thead>
      <tbody>
        ${filteredOrders.map(o => `<tr>
          <td><strong>${esc(o.code)}</strong></td>
          <td>${dateTime(o.createdAt)}</td>
          <td>${esc(o.customerName)}</td>
          <td>${esc(o.paymentMethod || 'Cash')}</td>
          <td>${esc(o.status)}</td>
          <td class="num">${rupiah(o.ppnAmount || 0)}</td>
          <td class="num">${rupiah((Number(o.shippingCost || 0) + Number(o.extraFee || 0)))}</td>
          <td class="num"><strong>${rupiah(o.total)}</strong></td>
          <td class="num">${rupiah(o.paid)}</td>
        </tr>`).join('') || '<tr><td colspan="9" class="center">Tidak ada transaksi pada periode ini.</td></tr>'}
        ${filteredOrders.length ? `<tr class="total-row">
          <td colspan="5">TOTAL KESELURUHAN</td>
          <td class="num">${rupiah(totalPpn)}</td>
          <td class="num">${rupiah(totalShipping + totalExtra)}</td>
          <td class="num">${rupiah(gross)}</td>
          <td class="num">${rupiah(income)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="section-title">Rincian Pengeluaran Operasional (${filteredExpenses.length})</div>
    <table>
      <thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="num">Nominal</th></tr></thead>
      <tbody>
        ${filteredExpenses.map(e => `<tr><td>${shortDate(e.date)}</td><td>${esc(e.category)}</td><td>${esc(e.description)}</td><td class="num">${rupiah(e.amount)}</td></tr>`).join('') || '<tr><td colspan="4" class="center">Tidak ada pengeluaran pada periode ini.</td></tr>'}
        ${filteredExpenses.length ? `<tr class="total-row"><td colspan="3">TOTAL PENGELUARAN</td><td class="num">${rupiah(expensesSum)}</td></tr>` : ''}
      </tbody>
    </table>

    <div class="sign-area">
      <div class="sign-box">
        <div>Dibuat oleh,</div>
        <div class="sign-line">${esc(data.role)}</div>
      </div>
      <div class="sign-box">
        <div>Mengetahui / Pemilik Usaha,</div>
        <div class="sign-line">${esc(biz.businessName)}</div>
      </div>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`);
    win.document.close();
  }

  async function openScanner() {
    $('#scannerBackdrop').hidden = false; $('#scannerHint').textContent = 'Memeriksa dukungan kamera…'; $('#scannerVideo').classList.remove('active');
    if (!('BarcodeDetector' in window)) { $('#scannerHint').textContent = 'Browser ini belum mendukung pemindai QR/barcode otomatis. Ketik kode transaksi pada kolom di bawah.'; return; }
    try {
      const detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'] });
      scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = $('#scannerVideo'); video.srcObject = scannerStream; video.classList.add('active'); await video.play();
      $('#scannerHint').textContent = 'Arahkan kamera ke QR / barcode transaksi.';
      const scan = async () => {
        if ($('#scannerBackdrop').hidden) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length && codes[0].rawValue) {
            const value = codes[0].rawValue; closeScanner(); orderSearch = value; setPage('orders'); $('#orderSearch').value = value; $('#orderSearch').dispatchEvent(new Event('input', { bubbles: true })); return;
          }
        } catch (e) { console.warn('Scan error', e); }
        scannerTimer = setTimeout(scan, 450);
      }; scan();
    } catch (e) { $('#scannerHint').textContent = 'Kamera tidak dapat diakses. Pastikan izin kamera aktif dan gunakan HTTPS atau localhost.'; }
  }
  function closeScanner() {
    if (scannerTimer) clearTimeout(scannerTimer);
    if (scannerStream) scannerStream.getTracks().forEach(t => t.stop());
    scannerStream = null; $('#scannerVideo').srcObject = null; $('#scannerVideo').classList.remove('active'); $('#scannerBackdrop').hidden = true;
  }

  function handleAction(action, el) {
    const id = el.dataset.id;
    switch (action) {
      case 'go-cashier': cart = []; cashierStockUsage = {}; cashierBeforePhoto = ''; cashierAfterPhoto = ''; setPage('kasir'); break;
      case 'go-orders': setPage('orders'); break;
      case 'order-filter': orderFilter = el.dataset.filter; renderPage(); break;
      case 'order-detail': showOrderDetail(id); break;
      case 'order-add-item': addBillItemForm(id); break;
      case 'bill-item-save': saveBillItem(id); break;
      case 'order-stock-use': stockUsageForm(id); break;
      case 'stock-use-save': saveStockUsage(id); break;
      case 'order-next': updateOrderStatus(id); break;
      case 'order-delete': deleteOrder(id); break;
      case 'order-detail-save': saveOrderDetail(id); break;
      case 'order-whatsapp': { const o = getOrder(id); if (o) sendWhatsApp(o); break; }
      case 'order-print': showReceipt(id); break;
      case 'print-now': printCurrentModal(); break;
      case 'scanner-open': openScanner(); break;
      case 'cart-add': addCartItem(); break;
      case 'cart-clear': cart = []; cashierStockUsage = {}; updateCartUI(); break;
      case 'cart-remove': cart.splice(Number(el.dataset.index), 1); updateCartUI(); break;
      case 'cart-qty': {
        const item = cart[Number(el.dataset.index)];
        if (item) { item.qty = Number((item.qty + Number(el.dataset.delta)).toFixed(2)); if (item.qty <= 0) cart.splice(Number(el.dataset.index), 1); }
        updateCartUI(); break;
      }
      case 'cash-stock-qty': {
        const s = data.stock.find(x => x.id === id);
        if (!s) break;
        const delta = Number(el.dataset.delta);
        const cur = Number(cashierStockUsage[id] || 0);
        const next = Math.max(0, Math.min(Number(s.qty), Number((cur + delta).toFixed(2))));
        if (next === 0) delete cashierStockUsage[id];
        else cashierStockUsage[id] = next;
        updateCartUI();
        break;
      }
      case 'due-preset': {
        const days = Number(el.dataset.days || 0);
        const hour = Number(el.dataset.hour || 17);
        const target = addDays(days, hour, 0);
        if ($('#cashDueDate')) $('#cashDueDate').value = target.slice(0, 10);
        if ($('#cashDueHour')) $('#cashDueHour').value = target.slice(11, 13);
        if ($('#cashDueMinute')) $('#cashDueMinute').value = target.slice(14, 16);
        break;
      }
      case 'pay-method-pick': {
        const method = el.dataset.method;
        $$('#payMethodPills .pay-pill').forEach(b => b.classList.toggle('active', b === el));
        if ($('#cashPaymentMethod')) $('#cashPaymentMethod').value = method;
        const customInput = $('#cashCustomPayment');
        if (customInput) {
          customInput.classList.toggle('hidden', method !== 'Custom');
          if (method === 'Custom') customInput.focus();
        }
        break;
      }
      case 'pay-full': {
        const calc = calculateCashierTotals();
        if ($('#cashPaid')) $('#cashPaid').value = calc.total;
        break;
      }
      case 'checkout-submit': checkout(); break;
      case 'product-filter': productCategoryFilter = el.dataset.filter; renderPage(); break;
      case 'product-add': productForm(); break;
      case 'product-edit': { const p = data.products.find(x => x.id === id); if (p) productForm(p); break; }
      case 'product-save': saveProduct(el.dataset.id || ''); break;
      case 'product-delete': if (confirm('Hapus produk ini?')) { data.products = data.products.filter(p => p.id !== id); log('Produk dihapus', id); saveData(); renderPage(); toast('Produk dihapus.'); } break;
      case 'category-add': addCategory(); break;
      case 'category-save': { const f = $('#categoryForm'); if (!f.reportValidity()) return; const name = new FormData(f).get('name').trim(); if (data.categories.some(c => c.toLowerCase() === name.toLowerCase())) { toast('Kategori sudah ada.', 'error'); return; } data.categories.push(name); productCategoryFilter = 'Semua'; log('Kategori ditambahkan', name); saveData(); closeModal(); renderPage(); toast('Kategori berhasil ditambahkan.'); break; }
      case 'stock-add': stockForm(); break;
      case 'stock-edit': { const s = data.stock.find(x => x.id === id); if (s) stockForm(s); break; }
      case 'stock-save': saveStock(el.dataset.id || ''); break;
      case 'stock-adjust': adjustStock(id); break;
      case 'stock-adjust-save': { const s = data.stock.find(x => x.id === id); const f = $('#stockAdjustForm'); if (!s || !f.reportValidity()) return; const fd = new FormData(f); const qty = Number(fd.get('qty')); if (fd.get('type') === 'add') s.qty += qty; else if (fd.get('type') === 'sub') s.qty = Math.max(0, s.qty - qty); else s.qty = qty; log('Penyesuaian stok', `${s.name}: ${s.qty} ${s.unit} · ${fd.get('note') || ''}`); saveData(); closeModal(); renderPage(); toast('Stok berhasil diperbarui.'); break; }
      case 'customer-add': customerForm(); break;
      case 'customer-edit': { const c = getCustomer(id); if (c) customerForm(c); break; }
      case 'customer-save': saveCustomer(el.dataset.id || ''); break;
      case 'customer-delete': if (confirm('Hapus pelanggan ini? Riwayat transaksi tidak akan dihapus.')) { const c = getCustomer(id); data.customers = data.customers.filter(x => x.id !== id); log('Pelanggan dihapus', c?.name || id); saveData(); renderPage(); toast('Pelanggan dihapus.'); } break;
      case 'expense-add': expenseForm(); break;
      case 'expense-save': { const f = $('#expenseForm'); if (!f.reportValidity()) return; const fd = new FormData(f); const exp = { id: makeId('EXP'), date: String(fd.get('date')), category: String(fd.get('category')), description: String(fd.get('description')).trim(), amount: Number(fd.get('amount')) }; data.expenses.unshift(exp); log('Pengeluaran dicatat', `${exp.description} · ${rupiah(exp.amount)}`); saveData(); closeModal(); renderPage(); toast('Pengeluaran tersimpan.'); break; }
      case 'expense-delete': if (confirm('Hapus catatan pengeluaran ini?')) { data.expenses = data.expenses.filter(e => e.id !== id); log('Catatan pengeluaran dihapus', id); saveData(); renderPage(); toast('Catatan dihapus.'); } break;
      case 'report-period': reportPeriod = el.dataset.period; renderPage(); break;
      case 'report-export': exportReport(); break;
      case 'report-print': exportPagePrint(); break;
      case 'history-clear': if (confirm('Bersihkan seluruh riwayat aktivitas?')) { data.history = []; saveData(); renderPage(); toast('Riwayat dibersihkan.'); } break;
      case 'tracking-search': doTrackingSearch(); break;
      case 'tracking-pick': { const o = getOrder(id); if (o) { trackingResult = o; closeModal(); renderPage(); } break; }
      case 'booking-export': exportBookings(); break;
      case 'booking-location': { const label = $('#bookingGeoLabel'); if (!navigator.geolocation) { toast('Browser tidak mendukung akses lokasi.', 'error'); break; } if (label) label.textContent = 'Meminta izin lokasi…'; navigator.geolocation.getCurrentPosition(pos => { const lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6); $('#bookingLat').value = lat; $('#bookingLng').value = lng; if (label) label.textContent = `Pin tersimpan: ${lat}, ${lng}`; toast('Koordinat lokasi berhasil diambil.'); }, () => { if (label) label.textContent = 'Lokasi tidak tersedia'; toast('Tidak dapat mengambil lokasi.', 'error'); }, { enableHighAccuracy: true, timeout: 10000 }); break; }
      case 'booking-map': { const b = data.bookings.find(x => x.id === id); if (b && b.latitude && b.longitude) window.open(`https://www.google.com/maps?q=${b.latitude},${b.longitude}`, '_blank', 'noopener'); break; }
      case 'booking-status': { const b = data.bookings.find(x => x.id === id); if (b) { b.status = b.status === 'Menunggu' ? 'Dijemput' : 'Selesai'; log('Status booking diperbarui', `${b.name}: ${b.status}`); saveData(); renderPage(); } break; }
      case 'booking-delete': if (confirm('Hapus booking ini?')) { data.bookings = data.bookings.filter(x => x.id !== id); saveData(); renderPage(); } break;
      case 'settings-tab': settingsTab = el.dataset.tab; renderPage(); break;
      case 'role-save': { const role = $('#roleSetting').value; const pin = $('#ownerPinSetting').value.trim(); if (pin.length < 4) { toast('PIN Owner minimal 4 karakter.', 'error'); return; } data.settings.ownerPin = pin; data.role = role; log('Hak akses diubah', `Mode pengguna: ${role}`); saveData(); renderPage(); toast('Pengaturan hak akses disimpan.'); break; }
      case 'export-backup': exportBackup(); break;
      case 'import-backup': $('#backupFile').click(); break;
      case 'reset-data': if (confirm('Reset seluruh data dan kembali ke data demo? Tindakan ini tidak dapat dibatalkan.')) { data = demoData(); currentPage = 'dashboard'; saveData(); renderPage(); toast('Data demo berhasil direset.'); } break;
      case 'modal-close': closeModal(); break;
      default: break;
    }
  }

  document.addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) { event.preventDefault(); handleAction(actionEl.dataset.action, actionEl); return; }
    const pageEl = event.target.closest('[data-page]');
    if (pageEl) { event.preventDefault(); setPage(pageEl.dataset.page); }
  });
  $('#menuToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#notificationBtn').addEventListener('click', showNotifications);
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', e => { if (e.target === $('#modalBackdrop')) closeModal(); });
  $('#scannerClose').addEventListener('click', closeScanner);
  $('#scannerBackdrop').addEventListener('click', e => { if (e.target === $('#scannerBackdrop')) closeScanner(); });
  $('#scannerManualGo').addEventListener('click', () => { const v = $('#scannerManualInput').value.trim(); if (!v) { toast('Masukkan kode transaksi.', 'error'); return; } closeScanner(); orderSearch = v; setPage('orders'); $('#orderSearch').value = v; $('#orderSearch').dispatchEvent(new Event('input', { bubbles: true })); });
  $('#pageContent').addEventListener('input', event => {
    if (event.target.id === 'orderSearch') { orderSearch = event.target.value; const pos = event.target.selectionStart; renderPage(); const next = $('#orderSearch'); if (next) { next.focus(); next.setSelectionRange(pos, pos); } }
    if (event.target.id === 'customerSearch') { const q = event.target.value.toLowerCase(); $('#customerRows').innerHTML = customerRows(data.customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))); }
    if (['cashDiscount', 'cashShipping', 'cashExtraFee'].includes(event.target.id)) updateCartUI();
  });
  $('#pageContent').addEventListener('change', event => {
    if (event.target.id === 'cashPpnCheck') updateCartUI();
    if (event.target.id === 'beforePhoto') handlePhotoInput('beforePhoto', 'before');
    if (event.target.id === 'afterPhoto') handlePhotoInput('afterPhoto', 'after');
    if (event.target.id === 'backupFile') importBackup(event.target.files?.[0]);
  });
  $('#pageContent').addEventListener('submit', event => {
    if (event.target.id === 'checkoutForm') { event.preventDefault(); checkout(); }
    if (event.target.id === 'bookingForm') { event.preventDefault(); const f = event.target; if (!f.reportValidity()) return; const fd = new FormData(f); const b = { id: makeId('BKG'), name: String(fd.get('name')).trim(), phone: String(fd.get('phone')).trim(), address: String(fd.get('address')).trim(), latitude: String(fd.get('latitude') || ''), longitude: String(fd.get('longitude') || ''), pickupAt: String(fd.get('pickupAt')), weight: Number(fd.get('weight') || 0), notes: String(fd.get('notes') || ''), status: 'Menunggu', createdAt: nowISO() }; data.bookings.unshift(b); log('Booking jemput dibuat', `${b.name} · ${dateTime(b.pickupAt)}`); saveData(); renderPage(); toast('Booking jemput berhasil disimpan.'); }
    if (event.target.id === 'businessSettings') { event.preventDefault(); const fd = new FormData(event.target); data.settings.businessName = String(fd.get('businessName')).trim(); data.settings.phone = String(fd.get('phone') || '').trim(); data.settings.address = String(fd.get('address') || '').trim(); data.settings.pickupReminderHours = Number(fd.get('pickupReminderHours') || 24); log('Pengaturan usaha diperbarui', data.settings.businessName); saveData(); renderPage(); toast('Profil usaha berhasil diperbarui.'); }
  });
  $('#topRole').addEventListener('click', () => {
    if (data.role === 'Owner') { if (confirm('Beralih ke mode Kasir? Menu laporan, pengeluaran, dan pengaturan akan disembunyikan.')) { data.role = 'Kasir'; log('Mode pengguna diubah', 'Beralih ke Kasir'); saveData(); if (['expenses', 'reports', 'settings'].includes(currentPage)) currentPage = 'dashboard'; renderPage(); } }
    else { const pin = prompt('Masukkan PIN Owner untuk membuka akses penuh:'); if (pin === null) return; if (pin === String(data.settings.ownerPin || '1234')) { data.role = 'Owner'; log('Mode pengguna diubah', 'Beralih ke Owner'); saveData(); renderPage(); toast('Mode Owner aktif.'); } else toast('PIN Owner salah.', 'error'); }
  });
  window.addEventListener('online', updateShell);
  window.addEventListener('offline', updateShell);
  window.addEventListener('resize', () => { if (currentPage === 'dashboard') drawDashboardChart(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(); closeScanner(); } if (event.key === 'F2') { event.preventDefault(); setPage('kasir'); } });

  $$(`[data-icon]`).forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  if (!data.history.length) { log('Aplikasi dimulai', 'IDN-GO siap digunakan.'); saveData(); }
  renderPage();
})();
