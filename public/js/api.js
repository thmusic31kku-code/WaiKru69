/**
 * ตัวช่วยเรียก Google Apps Script Web App API
 * หมายเหตุสำคัญ: Apps Script ไม่รองรับ CORS preflight (OPTIONS)
 * ดังนั้น POST ทุกครั้งต้องส่งด้วย Content-Type: text/plain
 */
window.Api = window.Api || (function () {
  function getBaseUrl() {
    if (typeof window.APP_CONFIG === 'undefined' || !window.APP_CONFIG.API_URL) {
      console.warn("ไม่พบ APP_CONFIG.API_URL ระบบอาจทำงานผิดพลาด กรุณาตรวจสอบว่าโหลด config.js แล้ว");
      return '';
    }
    return window.APP_CONFIG.API_URL;
  }

  async function get(action, params) {
    const url = getBaseUrl();
    if (!url) throw new Error("API URL is missing");
    
    const query = new URLSearchParams(Object.assign({ action: action }, params || {}));
    const res = await fetch(url + '?' + query.toString(), { method: 'GET' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
    return json.data;
  }

  async function post(action, payload) {
    const url = getBaseUrl();
    if (!url) throw new Error("API URL is missing");

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
    return json.data;
  }

  return { get: get, post: post };
})();