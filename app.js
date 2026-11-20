/* IDN-GO Laundry Management — frontend demo
   Data disimpan di localStorage browser. Untuk multi-device, WhatsApp otomatis,
   autentikasi aman, dan sinkronisasi server diperlukan backend/API.
*/
(() => {
  'use strict';
  const STORAGE_KEY = 'idn-go-laundry-v1';
  const $ = (selector, root = document) => root.querySelector(selector); const $\$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const nowISO = () => new Date().toISOString();

  // Format lokal YYYY-MM-DDTHH:mm (24 jam)
  const localDateTime = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const addDays = (n, hour = 17) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return localDateTime(d);
  };

  // Format tanggal & jam 24 jam penuh (HH:mm)
  const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const shortDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
  const dateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    const tgl = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    const jam = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${tgl}, ${jam}`;
  };
  const clockTime24 = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
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
    search: '<circle cx="10.8" cy="10.8" r="6
