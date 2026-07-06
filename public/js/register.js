/**
 * js/register.js
 */
const RegApp = (function() {
  const state = { config: null, user: null, idToken: null, isSubmitting: false, khrob: { ching: 0, sathukan: 0, tra_hom_roeng: 0, krabong_kan: 0, bat_sakunee: 0 } };
  const KHROB_META = [
    { k: 'ching', l: 'ครอบฉิ่ง' }, { k: 'sathukan', l: 'สาธุการ' },
    { k: 'tra_hom_roeng', l: 'ตระโหมโรง' }, { k: 'krabong_kan', l: 'กระบองกัน' }, { k: 'bat_sakunee', l: 'บาทสกุณี' }
  ];

  const els = {
    loader: document.getElementById('pageLoader'), 
    out: document.getElementById('authSignedOut'),
    in: document.getElementById('authSignedIn'), 
    form: document.getElementById('regForm'),
    tv: document.getElementById('ticketView'), 
    alertOut: document.getElementById('globalAlert'),
    alertIn: document.getElementById('formAlert'),
    kList: document.getElementById('dynamicKhrobList'), 
    total: document.getElementById('uiTotalAmount'),
    sCount: document.getElementById('regStudents'), 
    tCount: document.getElementById('regTeachers'),
    btn: document.getElementById('btnSubmitReg')
  };

  async function init() {
    try {
      state.config = await Api.get('getEventInfo');
      if (!state.config.registrationOpen) {
        els.out.innerHTML = `<div class="alert alert-error">ขณะนี้ระบบปิดรับลงทะเบียนชั่วคราว</div><a href="index.html" class="btn btn-outline mt-4">กลับหน้าหลัก</a>`;
      } else {
        renderKhrobUI();
        initGoogleAuth();
      }
    } catch (e) {
      els.out.innerHTML = `<div class="alert alert-error">โหลดข้อมูลไม่สำเร็จ: ${e.message}</div>`;
    } finally {
      els.loader.classList.add('is-hidden');
    }
  }

  function initGoogleAuth() {
    const intv = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(intv);
        google.accounts.id.initialize({ client_id: window.APP_CONFIG.GOOGLE_CLIENT_ID, callback: handleGsiResponse, auto_select: false });
        google.accounts.id.renderButton(document.getElementById("gsiContainer"), { theme: "outline", size: "large", shape: "pill", text: "continue_with" });
      }
    }, 100);
  }

  async function handleGsiResponse(res) {
    state.idToken = res.credential;
    state.user = JSON.parse(decodeURIComponent(atob(state.idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
    
    document.getElementById('userAvatar').src = state.user.picture;
    document.getElementById('userName').textContent = state.user.name;
    document.getElementById('userEmail').textContent = state.user.email;
    
    els.out.classList.add('d-none'); els.in.classList.remove('d-none');
    await checkExisting();
  }

  async function checkExisting() {
    showAlert('กำลังตรวจสอบสิทธิ์...', 'info', false);
    try {
      const records = await Api.get('getMyRegistration', { email: state.user.email, idToken: state.idToken });
      els.alertIn.innerHTML = '';
      els.alertOut.innerHTML = '';
      if (records && records.length) {
        const r = records[records.length - 1];
        document.getElementById('tvId').textContent = r.id;
        document.getElementById('tvCount').textContent = `${r.total_participants} คน`;
        const pdf = document.getElementById('tvPdfBtn');
        if(r.pdf_url) { pdf.href = r.pdf_url; pdf.classList.remove('disabled'); } else { pdf.classList.add('disabled'); pdf.textContent = 'กำลังสร้าง PDF...'; }
        showElement(els.tv);
      } else {
        showElement(els.form);
      }
    } catch (e) { showAlert(e.message, 'error', true); }
  }

  function renderKhrobUI() {
    els.kList.innerHTML = KHROB_META.map(i => `
      <div class="khrob-item">
        <div class="khrob-info"><strong>${i.l}</strong><span>กำนล ${state.config.prices[i.k]} บ./คน</span></div>
        <div class="khrob-ctrl">
          <button type="button" class="khrob-btn minus" onclick="RegApp.upd('${i.k}', -1)">−</button>
          <span class="khrob-val" id="q_${i.k}">0</span>
          <button type="button" class="khrob-btn plus" onclick="RegApp.upd('${i.k}', 1)">+</button>
        </div>
      </div>
    `).join('');
  }

  function updateCount(k, dir) {
    state.khrob[k] = Math.max(0, state.khrob[k] + dir);
    document.getElementById(`q_${k}`).textContent = state.khrob[k];
    calcTotal();
  }

  function calcTotal() {
    let items = 0, sum = 0;
    for (const k in state.khrob) { items += state.khrob[k]; sum += (state.khrob[k] * state.config.prices[k]); }
    sum += (items * state.config.prices.khan);
    els.total.innerHTML = `${sum.toLocaleString()} <small>บาท</small>`;
  }

  function hideElement(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.classList.add('d-none');
  }

  function showElement(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.remove('d-none');
  }

  els.sCount.addEventListener('input', calcTotal); els.tCount.addEventListener('input', calcTotal);

  els.form.addEventListener('submit', async e => {
    e.preventDefault();
    if(state.isSubmitting) return;
    const s = Number(els.sCount.value), t = Number(els.tCount.value);
    if(s + t <= 0) { showAlert('ระบุผู้เข้าร่วมอย่างน้อย 1 คน', 'error', true); return; }
    
    state.isSubmitting = true; els.btn.disabled = true; els.btn.innerHTML = '<span class="spinner-sm" style="margin-right:8px;"></span> กำลังบันทึก...';
    try {
      const res = await Api.post('register', {
        idToken: state.idToken, institution: document.getElementById('regInstitution').value.trim(),
        address: document.getElementById('regAddress').value.trim(), coordinator_name: document.getElementById('regCoordinator').value.trim(),
        coordinator_phone: document.getElementById('regPhone').value.trim(), students_count: s, teachers_count: t, khrob_khru: state.khrob
      });
      document.getElementById('tvId').textContent = res.id; document.getElementById('tvCount').textContent = `${s+t} คน`;
      document.getElementById('tvPdfBtn').href = res.pdfUrl || '#';
      hideElement(els.form); showElement(els.tv); els.tv.classList.add('fade-enter');
      window.scrollTo(0,0);
    } catch (err) {
      showAlert(err.message, 'error', true); els.btn.disabled = false; els.btn.textContent = 'บันทึกข้อมูล';
    } finally { state.isSubmitting = false; }
  });

  function signOut() {
    if (window.google) google.accounts.id.disableAutoSelect();
    location.reload();
  }

  function showAlert(msg, type, inForm = false) {
    const target = inForm ? els.alertIn : els.alertOut;
    target.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }

  return { init, signOut, upd: updateCount };
})();

document.addEventListener('DOMContentLoaded', RegApp.init);