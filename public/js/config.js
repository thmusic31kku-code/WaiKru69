/**
 * ตั้งค่าหลักของเว็บไซต์ — แก้ 2 ค่านี้หลัง deploy Apps Script และสร้าง OAuth Client ID แล้ว
 */
window.APP_CONFIG = window.APP_CONFIG || {
  // URL ของ Google Apps Script Web App (ลงท้ายด้วย /exec) จากขั้นตอน deploy ใน README.md
  API_URL: 'https://script.google.com/macros/s/AKfycbyEj3KOckQuUCNcpvV0vqnSXCZoYAVRSPqIqPmTlYkbzbR10Vb43M5F_Y4FCdaHykwN/exec',

  // OAuth Client ID จาก Google Cloud Console (ใช้กับปุ่ม Sign in with Google)
  // ค่านี้ควรตรงกับ GOOGLE_CLIENT_ID ที่ตั้งไว้ในชีต Config ของ Apps Script ด้วย
  GOOGLE_CLIENT_ID: '202323139949-cldh0a84p6qhrca9plj5tih25g355580.apps.googleusercontent.com'
};

