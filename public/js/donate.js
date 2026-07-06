/**
 * js/donate.js - จัดการการอัปโหลดไฟล์สลิป (แปลงเป็น Base64) และส่งข้อมูล API
 */

const DonApp = (function() {

  const state = {
    base64: null,
    mimeType: null,
    isSubmitting: false
  };

  const els = {
    form: document.getElementById('donateForm'),
    dropzone: document.getElementById('slipDropzone'),
    input: document.getElementById('slipInput'),
    preview: document.getElementById('slipPreview'),
    text: document.getElementById('slipText'),
    alert: document.getElementById('donateAlert'),
    btn: document.getElementById('btnSubmitDonate')
  };

  async function init() {
    initDropzone();
    initMobileMenu();
    await fetchBankInfo();
  }

  async function fetchBankInfo() {
    try {
      const info = await Api.get('getEventInfo');
      const bankName = document.getElementById('uiBankName');
      const accountName = document.getElementById('uiAccountName');
      const accountNo = document.getElementById('uiAccountNo');
      
      if(bankName) bankName.textContent = info.bank.bankName;
      if(accountName) accountName.textContent = info.bank.accountName;
      if(accountNo) accountNo.textContent = info.bank.accountNo;
    } catch (error) {
      console.warn('โหลดข้อมูลบัญชีไม่สำเร็จ:', error);
      showAlert('ไม่สามารถโหลดข้อมูลบัญชีได้อัตโนมัติ กรุณาอ้างอิงจากรูป QR Code', 'info');
    } finally {
      // Safely remove skeleton classes (ป้องกัน Error ถ้าไม่มีคลาสนี้)
      document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
      
      // Safely hide loader (ป้องกัน Error ถ้าไม่มี element)
      document.body.classList.remove('is-loading');
      const loader = document.getElementById('pageLoader');
      if (loader) {
        loader.classList.add('opacity-0');
        setTimeout(() => loader.remove(), 400);
      }
    }
  }

  function initMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (!navToggle || !mobileMenu) return;

    navToggle.addEventListener('click', () => {
      const isClosed = mobileMenu.classList.contains('opacity-0');
      if (isClosed) {
        mobileMenu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
        mobileMenu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        mobileMenu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      }
    });
  }

  function initDropzone() {
    if(!els.dropzone || !els.input) return;

    els.dropzone.addEventListener('click', () => els.input.click());
    
    // Accessibility: Support keyboard Enter to click
    els.dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        els.input.click();
      }
    });
    
    els.input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showAlert('ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์สลิปใหม่', 'error');
        els.input.value = "";
        return;
      }

      state.mimeType = file.type;
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        state.base64 = evt.target.result;
        els.preview.src = state.base64;
        els.preview.classList.remove('hidden');
        els.text.innerHTML = `<span class="text-success-dark">เลือกไฟล์แล้ว: ${file.name}</span>`;
        els.dropzone.classList.add('border-success-main', 'bg-success-light');
        els.dropzone.classList.remove('border-slate-300', 'bg-slate-50', 'hover:border-primary-main', 'hover:bg-primary-light');
      };
      
      reader.readAsDataURL(file);
    });
  }

  if(els.form) {
    els.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.base64) {
        showAlert('กรุณาแนบภาพสลิปการโอนเงินก่อนยืนยัน', 'error');
        return;
      }
      if (state.isSubmitting) return;
      
      state.isSubmitting = true;
      els.btn.disabled = true;
      els.btn.innerHTML = '<svg class="w-5 h-5 mr-2 inline-block border-2 border-white/20 border-t-white rounded-full animate-spin" viewBox="0 0 24 24"></svg> กำลังอัปโหลดข้อมูลเข้าสู่ระบบ...';
      els.alert.innerHTML = '';

      const payload = {
        donor_name: document.getElementById('donName').value.trim(),
        donor_phone: document.getElementById('donPhone').value.trim(),
        donor_email: document.getElementById('donEmail').value.trim(),
        amount: Number(document.getElementById('donAmount').value),
        note: document.getElementById('donNote').value.trim(),
        slip_base64: state.base64,
        slip_mime_type: state.mimeType
      };

      try {
        const res = await Api.post('donate', payload);
        showAlert(`ส่งข้อมูลสำเร็จ! รหัสอ้างอิง: <strong>${res.id}</strong> ทีมงานจะตรวจสอบยอดและปรับปรุงข้อมูลโดยเร็วที่สุด`, 'success');
        
        // Reset Form
        els.form.reset();
        state.base64 = null;
        els.preview.classList.add('hidden');
        els.preview.src = "";
        els.text.textContent = 'คลิกที่นี่เพื่อเลือกไฟล์สลิปใหม่';
        els.dropzone.classList.remove('border-success-main', 'bg-success-light');
        els.dropzone.classList.add('border-slate-300', 'bg-slate-50', 'hover:border-primary-main', 'hover:bg-primary-light');
        
      } catch (error) {
        showAlert(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
      } finally {
        state.isSubmitting = false;
        els.btn.disabled = false;
        els.btn.innerHTML = 'ยืนยันการแจ้งโอนเงิน';
      }
    });
  }

  function showAlert(html, type) {
    if(!els.alert) return;
    const cls = type === 'error' ? 'alert alert-error' : 
                type === 'success' ? 'alert alert-success' : 
                'alert alert-info';
    els.alert.innerHTML = `<div class="${cls}">${html}</div>`;
  }

  return { init };

})();

document.addEventListener('DOMContentLoaded', DonApp.init);