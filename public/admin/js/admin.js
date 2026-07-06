/** แดชบอร์ดแอดมิน: auth, ภาพรวม, CRUD ใบตอบรับ/บริจาค/ที่นั่ง/ผู้ดูแลระบบ (Refactored for KKU63 UI) */

const SESSION_KEY = 'wkd_admin_session';
let session = null; // { session, email, name, role }
let cache = { registrations: [], donations: [], seats: [], admins: [] };

// ---------------------------------------------------------------------------
// AUTHENTICATION
// ---------------------------------------------------------------------------
function saveSession(s) { session = s; localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
function clearSession() { session = null; localStorage.removeItem(SESSION_KEY); }

async function tryResumeSession() {
  const saved = loadSession();
  if (!saved) return false;
  session = saved;
  try {
    await Api.get('adminWhoAmI', { session: session.session });
    showDashboard();
    return true;
  } catch (e) {
    clearSession();
    return false;
  }
}

async function onAdminSignIn(user) {
  try {
    const result = await Api.post('adminLogin', { idToken: user.idToken });
    saveSession(result);
    showDashboard();
  } catch (e) {
    document.getElementById('loginAlert').innerHTML = `<div class="alert alert-error">${e.message}</div>`;
  }
}

// UI: Switch Login Tabs
document.getElementById('tabBtnPassword').addEventListener('click', function () {
  this.classList.add('active');
  document.getElementById('tabBtnGoogle').classList.remove('active');
  document.getElementById('passwordLoginForm').classList.remove('hidden');
  document.getElementById('googleLoginPanel').classList.add('hidden');
});
document.getElementById('tabBtnGoogle').addEventListener('click', function () {
  this.classList.add('active');
  document.getElementById('tabBtnPassword').classList.remove('active');
  document.getElementById('passwordLoginForm').classList.add('hidden');
  document.getElementById('googleLoginPanel').classList.remove('hidden');
});

// UI: Password Login
document.getElementById('passwordLoginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('passwordLoginBtn');
  btn.disabled = true;
  btn.innerHTML = 'กำลังตรวจสอบสิทธิ์...';
  try {
    const result = await Api.post('adminLoginPassword', {
      username: document.getElementById('loginUsername').value.trim(),
      password: document.getElementById('loginPassword').value
    });
    saveSession(result);
    showDashboard();
  } catch (err) {
    document.getElementById('loginAlert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'เข้าสู่ระบบ';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => { clearSession(); location.reload(); });

const ALL_TABS = ['overview', 'checkin', 'registrations', 'donations', 'seats', 'admins', 'config', 'logs'];

function showDashboard() {
  document.getElementById('loginWrap').classList.add('hidden');
  document.getElementById('adminShell').classList.remove('hidden');

  const displayId = session.email ? session.email : `@${session.username}`;
  document.getElementById('adminName').textContent = session.name;
  document.getElementById('adminRole').textContent = `${session.role.toUpperCase()} | ${displayId}`;

  const isSuperadmin = session.role === 'superadmin';
  document.querySelectorAll('[data-superadmin-only]').forEach(el => el.classList.toggle('hidden', !isSuperadmin));

  // staff เข้าได้แค่แท็บเดียวคือเช็คอิน — พาไปที่นั่นตรง ๆ แทนที่จะเปิด Overview ซึ่งจะถูกปฏิเสธ (403)
  goToTab(isSuperadmin ? 'overview' : 'checkin');
}

function goToTab(tab) {
  const btn = document.querySelector(`.admin-nav-btn[data-tab="${tab}"]`);
  if (btn) btn.click();
}

// ---------------------------------------------------------------------------
// TAB NAVIGATION
// ---------------------------------------------------------------------------
const TAB_TITLES = {
  overview: 'ภาพรวมระบบ (Overview)',
  checkin: 'เช็คอินหน้างาน (Check-in)',
  registrations: 'จัดการใบตอบรับ (Registrations)',
  donations: 'จัดการยอดสมทบทุน (Donations)',
  seats: 'แผนผังที่นั่ง (Seats)',
  admins: 'จัดการผู้ดูแลระบบ (Admins)',
  config: 'ตั้งค่าระบบ (Config)',
  logs: 'ประวัติการทำงาน (Logs)'
};

const PANEL_TABS = ['overview', 'checkin', 'registrations', 'donations', 'seats', 'admins', 'config', 'logs'];

document.querySelectorAll('.admin-nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.admin-nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const tab = this.dataset.tab;
    document.getElementById('tabTitle').textContent = TAB_TITLES[tab] || 'แดชบอร์ดผู้ดูแลระบบ';

    PANEL_TABS.forEach(t => {
      const panel = document.getElementById(`panel-${t}`);
      if (panel) panel.classList.toggle('hidden', t !== tab);
    });

    if (tab === 'checkin') {
      document.getElementById('tabTitle').textContent = TAB_TITLES.checkin;
    }
    if (tab === 'registrations') loadRegistrations();
    if (tab === 'donations') loadDonations();
    if (tab === 'seats') loadSeats();
    if (tab === 'admins') loadAdmins();
  });
});

// ---------------------------------------------------------------------------
// MODAL HELPER
// ---------------------------------------------------------------------------
function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target.id === 'modalOverlay') closeModal();
});

// ---------------------------------------------------------------------------
// 1. OVERVIEW
// ---------------------------------------------------------------------------
async function loadOverview() {
  const grid = document.getElementById('statGrid');
  grid.innerHTML = '<div class="col-span-12 text-slate-500">กำลังโหลดสถิติ...</div>';
  try {
    const stats = await Api.get('adminGetStats', { session: session.session });
    const cards = [
      { label: 'ใบตอบรับทั้งหมด', value: stats.totalRegistrations, color: 'text-primary-dark' },
      { label: 'ยืนยันที่นั่งแล้ว', value: stats.confirmedRegistrations, color: 'text-primary' },
      { label: 'เช็คอินหน้างาน', value: stats.checkedIn, color: 'text-success-dark' },
      { label: 'นร./นักศึกษา (คน)', value: stats.totalStudents, color: 'text-slate-800' },
      { label: 'ครู/อาจารย์ (คน)', value: stats.totalTeachers, color: 'text-slate-800' },
      { label: 'ยอดสมทบทุน (ยืนยันแล้ว)', value: `฿${Number(stats.donationTotalVerified).toLocaleString()}`, color: 'text-primary-dark' }
    ];

    grid.innerHTML = cards.map(c => `
      <div class="kku-card p-6">
        <h4 class="text-sm font-medium text-slate-500 mb-2">${c.label}</h4>
        <div class="text-3xl font-bold ${c.color}">${c.value.toLocaleString()}</div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<div class="alert alert-error col-span-12">โหลดสถิติไม่สำเร็จ: ${e.message}</div>`;
  }
}

// ---------------------------------------------------------------------------
// 2. REGISTRATIONS
// ---------------------------------------------------------------------------
async function loadRegistrations() {
  const tbody = document.querySelector('#regTable tbody');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-500 py-8">กำลังโหลดข้อมูล...</td></tr>';
  try {
    cache.registrations = await Api.get('adminListRegistrations', { session: session.session });
    renderRegTable(cache.registrations);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-error-main py-8">โหลดไม่สำเร็จ: ${e.message}</td></tr>`;
  }
}

function getStatusBadge(status) {
  if (status === 'confirmed' || status === 'verified') return `<span class="badge badge-success">ยืนยันแล้ว</span>`;
  if (status === 'pending') return `<span class="badge badge-warning">รอตรวจสอบ</span>`;
  if (status === 'cancelled' || status === 'rejected') return `<span class="badge badge-error">ยกเลิก/ปฏิเสธ</span>`;
  return `<span class="badge badge-info">${status}</span>`;
}

function renderRegTable(rows) {
  const tbody = document.querySelector('#regTable tbody');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-500 py-8">ไม่พบข้อมูล</td></tr>'; return; }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="font-bold text-slate-700">${r.id}</td>
      <td>${r.institution}</td>
      <td>
        <div class="font-bold text-slate-800">${r.google_name}</div>
        <div class="text-xs text-slate-500">${r.google_email}</div>
      </td>
      <td>${r.students_count} / ${r.teachers_count}</td>
      <td><span class="text-xs bg-slate-100 px-2 py-1 rounded">${r.seat_numbers || '-'}</span></td>
      <td class="font-semibold text-primary">฿${Number(r.total_amount).toLocaleString()}</td>
      <td>${getStatusBadge(r.status)}</td>
      <td>${(r.checked_in === true || r.checked_in === 'TRUE' ? '<span class="badge badge-success">เช็คอินแล้ว</span>' : '<span class="text-slate-400">-</span>')}</td>
      <td class="text-right">
        <div class="flex justify-end gap-2">
          ${r.pdf_url ? `<a class="kku-btn kku-btn-text" style="padding:4px 8px; font-size:0.8rem;" href="${r.pdf_url}" target="_blank">PDF</a>` : ''}
          <button class="kku-btn kku-btn-outline" style="padding:4px 8px; font-size:0.8rem;" onclick="editRegistration('${r.id}')">แก้ไข</button>
          <button class="kku-btn kku-btn-text text-error-main" style="padding:4px 8px; font-size:0.8rem;" onclick="deleteRegistration('${r.id}')">ลบ</button>
        </div>
      </td>
    </tr>
  `).join('');
}

document.getElementById('regSearch').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderRegTable(cache.registrations.filter(r =>
    (r.institution + r.google_name + r.google_email).toLowerCase().includes(q)
  ));
});

function editRegistration(id) {
  const r = cache.registrations.find(x => x.id === id);
  openModal(`
    <h3 class="text-xl font-bold text-primary-dark border-b pb-2 mb-4">แก้ไขใบตอบรับ: ${id}</h3>
    <div class="form-group"><label class="form-label">สถาบัน</label><input id="m_institution" class="kku-input w-full" value="${r.institution || ''}" /></div>
    <div class="form-group"><label class="form-label">ผู้ประสานงาน</label><input id="m_coordinator_name" class="kku-input w-full" value="${r.coordinator_name || ''}" /></div>
    <div class="form-group"><label class="form-label">เบอร์ติดต่อ</label><input id="m_coordinator_phone" class="kku-input w-full" value="${r.coordinator_phone || ''}" /></div>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="form-group"><label class="form-label">นร./นักศึกษา</label><input type="number" class="kku-input w-full" id="m_students_count" value="${r.students_count}" /></div>
      <div class="form-group"><label class="form-label">ครู/อาจารย์</label><input type="number" class="kku-input w-full" id="m_teachers_count" value="${r.teachers_count}" /></div>
    </div>
    <div class="form-group">
      <label class="form-label">สถานะ (Status)</label>
      <select id="m_status" class="kku-input w-full bg-white">
        <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>รอตรวจสอบ (Pending)</option>
        <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>ยืนยันแล้ว (Confirmed)</option>
        <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>ยกเลิก (Cancelled)</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="kku-btn kku-btn-text" onclick="closeModal()">ยกเลิก</button>
      <button class="kku-btn kku-btn-primary" onclick="saveRegistration('${id}')">บันทึกการเปลี่ยนแปลง</button>
    </div>
  `);
}

async function saveRegistration(id) {
  try {
    await Api.post('adminUpdateRegistration', {
      session: session.session, id: id,
      institution: document.getElementById('m_institution').value,
      coordinator_name: document.getElementById('m_coordinator_name').value,
      coordinator_phone: document.getElementById('m_coordinator_phone').value,
      students_count: Number(document.getElementById('m_students_count').value),
      teachers_count: Number(document.getElementById('m_teachers_count').value),
      status: document.getElementById('m_status').value
    });
    closeModal();
    loadRegistrations();
  } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message); }
}

async function deleteRegistration(id) {
  if (!confirm(`ยืนยันลบใบตอบรับ ${id}?\nการกระทำนี้จะลบข้อมูลถาวรและคืนที่นั่งให้ระบบ`)) return;
  try {
    await Api.post('adminDeleteRegistration', { session: session.session, id: id });
    loadRegistrations();
  } catch (e) { alert('ลบไม่สำเร็จ: ' + e.message); }
}

// ---------------------------------------------------------------------------
// 3. DONATIONS
// ---------------------------------------------------------------------------
async function loadDonations() {
  const tbody = document.querySelector('#donTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-500 py-8">กำลังโหลดข้อมูล...</td></tr>';
  try {
    cache.donations = await Api.get('adminListDonations', { session: session.session });
    renderDonTable(cache.donations);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-error-main py-8">โหลดไม่สำเร็จ: ${e.message}</td></tr>`;
  }
}

function renderDonTable(rows) {
  const tbody = document.querySelector('#donTable tbody');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-500 py-8">ไม่พบข้อมูล</td></tr>'; return; }

  tbody.innerHTML = rows.map(d => `
    <tr>
      <td class="font-bold text-slate-700">${d.id}</td>
      <td>
        <div class="font-bold text-slate-800">${d.donor_name}</div>
        ${d.note ? `<div class="text-xs text-slate-500 italic mt-1">"${d.note}"</div>` : ''}
      </td>
      <td class="font-semibold text-primary">฿${Number(d.amount).toLocaleString()}</td>
      <td><div class="text-sm">${d.donor_phone || '-'}</div><div class="text-xs text-slate-500">${d.donor_email || '-'}</div></td>
      <td>${d.slip_file_url ? `<a href="${d.slip_file_url}" target="_blank" class="text-primary hover:underline text-sm font-semibold">ดูหลักฐาน ↗</a>` : '<span class="text-slate-400">-</span>'}</td>
      <td>${getStatusBadge(d.status)}</td>
      <td class="text-right">
        <div class="flex justify-end gap-2">
          ${d.status !== 'verified' ? `<button class="kku-btn kku-btn-outline" style="padding:4px 8px; font-size:0.8rem; border-color:var(--success-main); color:var(--success-dark);" onclick="setDonationStatus('${d.id}','verified')">✓ ยืนยันยอด</button>` : ''}
          ${d.status !== 'rejected' ? `<button class="kku-btn kku-btn-text text-error-main" style="padding:4px 8px; font-size:0.8rem;" onclick="setDonationStatus('${d.id}','rejected')">ปฏิเสธ</button>` : ''}
          <button class="kku-btn kku-btn-text text-slate-400 hover:text-error-main" style="padding:4px 8px; font-size:0.8rem;" onclick="deleteDonation('${d.id}')">ลบ</button>
        </div>
      </td>
    </tr>
  `).join('');
}

document.getElementById('donSearch').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderDonTable(cache.donations.filter(d => d.donor_name.toLowerCase().includes(q)));
});

async function setDonationStatus(id, status) {
  try {
    await Api.post('adminUpdateDonation', { session: session.session, id: id, status: status });
    loadDonations();
    loadOverview();
  } catch (e) { alert('อัปเดตไม่สำเร็จ: ' + e.message); }
}

async function deleteDonation(id) {
  if (!confirm(`ยืนยันลบรายการสมทบทุน ${id}?`)) return;
  try {
    await Api.post('adminDeleteDonation', { session: session.session, id: id });
    loadDonations();
  } catch (e) { alert('ลบไม่สำเร็จ: ' + e.message); }
}

// ---------------------------------------------------------------------------
// 4. SEATS
// ---------------------------------------------------------------------------
async function loadSeats() {
  const container = document.getElementById('seatZones');
  container.innerHTML = '<div class="text-center py-8 text-slate-500">กำลังโหลดผังที่นั่ง...</div>';
  try {
    cache.seats = await Api.get('adminListSeats', { session: session.session });
    renderSeats();
  } catch (e) {
    container.innerHTML = `<div class="alert alert-error">โหลดไม่สำเร็จ: ${e.message}</div>`;
  }
}

function renderSeats() {
  const zones = {};
  cache.seats.forEach(s => { (zones[s.zone] = zones[s.zone] || []).push(s); });
  const container = document.getElementById('seatZones');

  container.innerHTML = Object.keys(zones).sort().map(zone => {
    const seats = zones[zone];
    return `
      <div class="mb-8">
        <h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">โซน ${zone} <span class="text-sm font-normal text-slate-500">(${seats.length} ที่นั่ง)</span></h4>
        <div class="seat-admin-grid">
          ${seats.map(s => {
      const cls = s.status === 'reserved' ? 'reserved' : (s.status === 'blocked' ? 'blocked' : '');
      return `<div class="seat-admin ${cls}" onclick="toggleSeat('${s.seat_number}','${s.status}')" title="ที่นั่ง: ${s.seat_number}\nสถานะ: ${s.status}">${s.seat_number}</div>`;
    }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function toggleSeat(seatNumber, currentStatus) {
  if (currentStatus === 'reserved') {
    alert('ที่นั่งนี้ถูกจองโดยผู้ลงทะเบียนแล้ว\nหากต้องการปลดจอง กรุณาลบ/แก้ไขใบตอบรับที่เกี่ยวข้องในแท็บ "ใบตอบรับ" แทน');
    return;
  }
  const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
  try {
    await Api.post('adminUpdateSeat', { session: session.session, seat_number: seatNumber, status: newStatus });
    loadSeats();
  } catch (e) { alert('อัปเดตไม่สำเร็จ: ' + e.message); }
}

// ---------------------------------------------------------------------------
// 5. ADMINS (Superadmin Only)
// ---------------------------------------------------------------------------
async function loadAdmins() {
  const tbody = document.querySelector('#adminTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-500">กำลังโหลด...</td></tr>';
  try {
    cache.admins = await Api.get('adminListAdmins', { session: session.session });
    tbody.innerHTML = cache.admins.map(a => {
      const identifier = a.email || a.username;
      return `<tr>
        <td>${a.email || '<span class="text-slate-400">-</span>'}</td>
        <td class="font-medium">@${a.username || '<span class="text-slate-400">-</span>'}</td>
        <td class="font-bold text-slate-800">${a.name}</td>
        <td><span class="badge ${a.role === 'superadmin' ? 'badge-warning' : 'bg-slate-200 text-slate-700'}">${a.role.toUpperCase()}</span></td>
        <td>${a.hasPassword ? '<span class="text-success-main font-bold">✓ ตั้งแล้ว</span>' : '<span class="text-slate-400">ยังไม่ตั้ง</span>'}</td>
        <td class="text-sm">${new Date(a.added_at).toLocaleDateString('th-TH')}</td>
        <td class="text-right"><button class="kku-btn kku-btn-text text-error-main" style="padding:4px 8px; font-size:0.8rem;" onclick="removeAdmin('${identifier}')">ลบสิทธิ์</button></td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-error-main py-8">โหลดไม่สำเร็จ: ${e.message}</td></tr>`;
  }
}

document.getElementById('addAdminBtn').addEventListener('click', function () {
  openModal(`
    <h3 class="text-xl font-bold text-primary-dark border-b pb-2 mb-4">เพิ่มผู้ดูแลระบบ</h3>
    <p class="text-sm text-slate-500 mb-4">ตั้งค่าการเข้าสู่ระบบผ่าน Google หรือระบุ Username/Password</p>
    <div class="form-group"><label class="form-label">อีเมล Google (@kku.ac.th)</label><input id="m_new_email" class="kku-input w-full" placeholder="name@kku.ac.th" /></div>
    <div class="form-group"><label class="form-label">ชื่อ - สกุล</label><input id="m_new_name" class="kku-input w-full" /></div>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="form-group"><label class="form-label">Username</label><input id="m_new_username" class="kku-input w-full" /></div>
      <div class="form-group"><label class="form-label">รหัสผ่าน (ขั้นต่ำ 8 ตัว)</label><input type="password" id="m_new_password" class="kku-input w-full" /></div>
    </div>
    <div class="form-group">
      <label class="form-label">ระดับสิทธิ์ (Role)</label>
      <select id="m_new_role" class="kku-input w-full bg-white">
        <option value="staff">Staff (สแกนเช็คอินหน้างานเท่านั้น)</option>
        <option value="superadmin">Superadmin (จัดการระบบทั้งหมด)</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="kku-btn kku-btn-text" onclick="closeModal()">ยกเลิก</button>
      <button class="kku-btn kku-btn-primary" onclick="saveNewAdmin()">เพิ่มผู้ใช้</button>
    </div>
  `);
});

async function saveNewAdmin() {
  try {
    await Api.post('adminAddAdmin', {
      session: session.session,
      email: document.getElementById('m_new_email').value.trim(),
      name: document.getElementById('m_new_name').value.trim(),
      username: document.getElementById('m_new_username').value.trim(),
      password: document.getElementById('m_new_password').value,
      role: document.getElementById('m_new_role').value
    });
    closeModal();
    loadAdmins();
  } catch (e) { alert('เพิ่มไม่สำเร็จ: ' + e.message); }
}

async function removeAdmin(identifier) {
  if (!confirm(`ยืนยันลบสิทธิ์ผู้ดูแลระบบของ: ${identifier} ?`)) return;
  try {
    await Api.post('adminRemoveAdmin', { session: session.session, email: identifier });
    loadAdmins();
  } catch (e) { alert('ลบไม่สำเร็จ: ' + e.message); }
}

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------
document.getElementById('changePasswordBtn').addEventListener('click', function () {
  openModal(`
    <h3 class="text-xl font-bold text-primary-dark border-b pb-2 mb-4">เปลี่ยน/ตั้งรหัสผ่าน</h3>
    <div class="form-group"><label class="form-label">รหัสผ่านปัจจุบัน <span class="text-xs font-normal text-slate-500">(เว้นว่างได้หากเข้าสู่ระบบด้วย Google)</span></label><input type="password" id="m_current_password" class="kku-input w-full" /></div>
    <div class="form-group"><label class="form-label">Username ใหม่</label><input type="text" id="m_new_username" class="kku-input w-full" value="${session.username || ''}" /></div>
    <div class="form-group"><label class="form-label">รหัสผ่านใหม่ <span class="text-xs font-normal text-slate-500">(อย่างน้อย 8 ตัวอักษร)</span></label><input type="password" id="m_new_password" class="kku-input w-full" /></div>
    <div class="modal-actions">
      <button class="kku-btn kku-btn-text" onclick="closeModal()">ยกเลิก</button>
      <button class="kku-btn kku-btn-primary" onclick="saveNewPassword()">บันทึกรหัสผ่าน</button>
    </div>
  `);
});

async function saveNewPassword() {
  try {
    await Api.post('adminChangePassword', {
      session: session.session,
      currentPassword: document.getElementById('m_current_password').value,
      newPassword: document.getElementById('m_new_password').value,
      newUsername: document.getElementById('m_new_username').value.trim()
    });
    session.username = document.getElementById('m_new_username').value.trim() || session.username;
    saveSession(session);
    closeModal();
    alert('ตั้งรหัสผ่านเรียบร้อยแล้ว ครั้งต่อไปสามารถเข้าสู่ระบบด้วย username/password ได้');
  } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message); }
}

// ---------------------------------------------------------------------------
// CSV EXPORT (Helpers)
// ---------------------------------------------------------------------------
function exportCsv(rows, headers, filename) {
  const csvRows = [headers.join(',')];
  rows.forEach(r => {
    csvRows.push(headers.map(h => `"${String(r[h] === undefined ? '' : r[h]).replace(/"/g, '""')}"`).join(','));
  });
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('exportRegBtn').addEventListener('click', () => exportCsv(cache.registrations, ['id', 'timestamp', 'google_email', 'google_name', 'institution', 'address', 'coordinator_name', 'coordinator_phone', 'students_count', 'teachers_count', 'khan_count', 'total_amount', 'seat_numbers', 'status', 'checked_in'], 'registrations_data.csv'));
document.getElementById('exportDonBtn').addEventListener('click', () => exportCsv(cache.donations, ['id', 'timestamp', 'donor_name', 'donor_phone', 'donor_email', 'amount', 'note', 'status'], 'donations_data.csv'));

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
async function init() {
  const resumed = await tryResumeSession();
  if (resumed) return;
  const waitForGoogle = setInterval(() => {
    if (window.google && window.google.accounts) {
      clearInterval(waitForGoogle);
      GoogleAuth.init(onAdminSignIn);
      GoogleAuth.renderButton('gsiButtonAdmin');
    }
  }, 200);
}
init();