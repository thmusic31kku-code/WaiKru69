/**
 * ============================================================================
 *  พิธีไหว้ครูดนตรี ภาคตะวันออกเฉียงเหนือ - มหาวิทยาลัยขอนแก่น
 *  Backend: Google Apps Script (Web App API)
 *  Database: Google Sheets  |  File storage: Google Drive
 * ============================================================================
 *  วิธีติดตั้ง:
 *   1. สร้าง Google Sheet เปล่า 1 ไฟล์ -> Extensions > Apps Script
 *   2. วางไฟล์นี้ทั้งหมดแทนที่ Code.gs เดิม
 *   3. รันฟังก์ชัน setupSpreadsheet() หนึ่งครั้ง (เลือกรัน -> อนุญาตสิทธิ์)
 *   4. เพิ่มแอดมินคนแรกด้วยวิธีใดวิธีหนึ่ง (หรือทั้งสองวิธี):
 *      - ผ่าน Google: ตั้ง Script property ADMIN_SEED_EMAIL แล้วรัน seedFirstAdmin()
 *      - ผ่าน username/password (ไม่ต้องพึ่ง Google เลย): ตั้ง Script properties
 *        ADMIN_SEED_USERNAME และ ADMIN_SEED_PASSWORD แล้วรัน seedFirstAdminPassword()
 *      (ทั้งสองฟังก์ชันสร้างแอดมินระดับ superadmin เสมอ — เพิ่มบัญชี staff เพิ่มได้ภายหลัง
 *      จากแดชบอร์ด แท็บ "ผู้ดูแลระบบ")
 *   5. Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   6. คัดลอก URL (.../exec) ไปใส่ public/js/config.js
 * ============================================================================
 *  หลักการเรื่องสิทธิ์ผู้ใช้งาน (role):
 *   - superadmin: เข้าถึงได้ทุกอย่าง — สถิติ, ใบตอบรับ, การบริจาค, ตั้งค่าระบบ (Config) ทุกค่า,
 *     จัดการผู้ดูแลระบบ, ประวัติการทำงาน (Logs), และเช็คอินหน้างานได้ด้วย
 *   - staff: ทำได้อย่างเดียวคือ "เช็คอินหน้างานด้วยการสแกน QR" เท่านั้น เข้าถึงข้อมูลอื่นไม่ได้เลย
 *     (ออกแบบมาสำหรับเจ้าหน้าที่จุดลงทะเบียนหน้างานโดยเฉพาะ)
 * ============================================================================
 *  หลักการเรื่องที่นั่ง: ระบบนี้ไม่จำกัดจำนวนผู้ลงทะเบียนตายตัว — รับได้ไม่จำกัดจนกว่า
 *  superadmin จะเข้าไป "ปิดรับลงทะเบียน" เองที่แท็บ "ตั้งค่าระบบ" (Config: REGISTRATION_OPEN)
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. CONSTANTS
// ---------------------------------------------------------------------------
const SHEETS = {
  CONFIG: 'Config',
  REGISTRATIONS: 'Registrations',
  DONATIONS: 'Donations',
  SEATS: 'Seats',
  ADMINS: 'Admins',
  LOGS: 'Logs'
};

// ข้อมูลการลงทะเบียนเก็บทั้งจำนวนคน, จำนวนขันไหว้ครู, ยอดเงินกำนลโดยประมาณ และเลขที่นั่งที่จัดสรรมาด้วย
const REG_HEADERS = [
  'id', 'timestamp', 'google_email', 'google_name', 'institution', 'address',
  'coordinator_name', 'coordinator_phone', 'students_count', 'teachers_count',
  'total_participants', 'khrob_khru_json', 'khan_count', 'total_amount', 'seat_numbers',
  'status', 'checked_in', 'checked_in_at', 'checked_in_by', 'qr_token', 'pdf_url', 'created_at', 'updated_at'
];

const DONATION_HEADERS = [
  'id', 'timestamp', 'donor_name', 'donor_phone', 'donor_email', 'amount', 'note',
  'slip_file_id', 'slip_file_url', 'status', 'verified_by', 'verified_at'
];

// email ใช้กับการเข้าสู่ระบบผ่าน Google, username/password_hash/password_salt ใช้กับการเข้าสู่ระบบ
// แบบพิมพ์ user/password โดยตรง (ไม่ต้องพึ่ง Google OAuth) — แอดมิน 1 คนจะมีอย่างใดอย่างหนึ่ง
// หรือทั้งสองแบบพร้อมกันก็ได้ | role: 'superadmin' (เห็น/แก้ได้ทุกอย่าง) หรือ 'staff' (เช็คอินอย่างเดียว)
const ADMIN_HEADERS = ['email', 'name', 'role', 'added_at', 'username', 'password_hash', 'password_salt'];
const LOG_HEADERS = ['timestamp', 'actor_email', 'action', 'detail'];

const SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 ชั่วโมง

// ป้ายชื่อภาษาไทยของแต่ละประเภทการครอบครู ใช้ทั้งฝั่ง PDF และการคำนวณสรุปยอด
const KHROB_TYPES = ['ching', 'sathukan', 'tra_hom_roeng', 'krabong_kan', 'bat_sakunee'];
const KHROB_LABELS = {
  ching: 'ครอบฉิ่ง', sathukan: 'สาธุการ', tra_hom_roeng: 'ตระโหมโรง',
  krabong_kan: 'กระบองกัน', bat_sakunee: 'บาทสกุณี'
};

// โลโก้ตรากิจกรรม (Main-logo.svg แปลงเป็น PNG ล่วงหน้า) — ใช้ครั้งเดียวตอน setupSpreadsheet()
// เพื่อสร้างไฟล์ใน Drive แล้วเก็บ fileId ไว้ใน Config (LOGO_FILE_ID) ให้ generateConfirmationPdf_
// เรียกใช้ซ้ำได้เร็ว ๆ โดยไม่ต้อง decode base64 ทุกครั้งที่ออก PDF
const EVENT_LOGO_BASE64_PNG = '__LOGO_BASE64_PLACEHOLDER__';

// ---------------------------------------------------------------------------
// 1. ENTRY POINTS: doGet / doPost
// ---------------------------------------------------------------------------
function doGet(e) {
  try {
    const action = e.parameter.action;
    let data;
    switch (action) {
      case 'getEventInfo':
        data = getEventInfo();
        break;
      case 'getMyRegistration':
        data = getMyRegistration(e.parameter.email, e.parameter.idToken);
        break;
      case 'getDonationSummary':
        data = getDonationSummary();
        break;
      case 'adminListRegistrations':
        requireSuperAdmin_(e.parameter.session);
        data = listAll(SHEETS.REGISTRATIONS, REG_HEADERS);
        break;
      case 'adminListDonations':
        requireSuperAdmin_(e.parameter.session);
        data = listAll(SHEETS.DONATIONS, DONATION_HEADERS);
        break;
      case 'adminListAdmins':
        requireSuperAdmin_(e.parameter.session);
        data = listAll(SHEETS.ADMINS, ADMIN_HEADERS).map(function (a) {
          return {
            email: a.email, name: a.name, role: a.role, added_at: a.added_at,
            username: a.username, hasPassword: !!a.password_hash
          };
        });
        break;
      case 'adminGetStats':
        requireSuperAdmin_(e.parameter.session);
        data = getStats();
        break;
      case 'adminWhoAmI':
        // ตรวจสอบ session ว่ายังใช้ได้ไหม โดยไม่จำกัด role (staff เรียกได้ด้วย) —
        // ใช้ตอนรีเฟรชหน้าเพื่อ "resume" session เดิมโดยไม่บังคับ superadmin
        data = requireAdminSession(e.parameter.session);
        break;
      case 'adminGetConfig':
        requireSuperAdmin_(e.parameter.session);
        data = listAll(SHEETS.CONFIG, ['key', 'value']);
        break;
      case 'adminListSeats':
        requireSuperAdmin_(e.parameter.session);
        data = listAll(SHEETS.SEATS, ['seat_number', 'zone', 'status', 'registration_id']);
        break;
      case 'adminListLogs':
        requireSuperAdmin_(e.parameter.session);
        data = getRecentLogs_();
        break;
      default:
        throw new Error('ไม่รู้จัก action: ' + action);
    }
    return jsonOut({ ok: true, data: data });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let data;
    switch (action) {
      case 'register':
        data = createRegistration(body);
        break;
      case 'donate':
        data = createDonation(body);
        break;
      case 'adminLogin':
        data = adminLogin(body.idToken);
        break;
      case 'adminLoginPassword':
        data = adminLoginPassword(body.username, body.password);
        break;
      case 'adminChangePassword':
        requireAdminSession(body.session);
        data = adminChangePassword(body.session, body.currentPassword, body.newPassword, body.newUsername);
        break;
      case 'adminUpdateRegistration':
        requireSuperAdmin_(body.session);
        data = adminUpdateRegistration(body, getSessionEmail(body.session));
        break;
      case 'adminDeleteRegistration':
        requireSuperAdmin_(body.session);
        data = adminDeleteRegistration(body.id, getSessionEmail(body.session));
        break;
      case 'adminUpdateDonation':
        requireSuperAdmin_(body.session);
        data = adminUpdateDonation(body, getSessionEmail(body.session));
        break;
      case 'adminDeleteDonation':
        requireSuperAdmin_(body.session);
        data = adminDeleteDonation(body.id, getSessionEmail(body.session));
        break;
      case 'adminCheckin':
        // เช็คอินหน้างาน: อนุญาตทั้ง staff และ superadmin (แค่ต้อง login สำเร็จ ไม่จำกัด role)
        requireAdminSession(body.session);
        data = adminCheckin(body.id, body.qr_token, getSessionEmail(body.session));
        break;
      case 'adminCheckinManual':
        // เช็คอินแบบข้ามการตรวจ QR — superadmin เท่านั้น (ใช้กรณีฉุกเฉิน)
        requireSuperAdmin_(body.session);
        data = adminCheckinManual(body.id, getSessionEmail(body.session));
        break;
      case 'adminAddAdmin':
        requireSuperAdmin_(body.session);
        data = adminAddAdmin(body, getSessionEmail(body.session));
        break;
      case 'adminRemoveAdmin':
        requireSuperAdmin_(body.session);
        data = adminRemoveAdmin(body.email, getSessionEmail(body.session));
        break;
      case 'adminUpdateSeat':
        requireSuperAdmin_(body.session);
        data = adminUpdateSeat(body.seat_number, body.status, getSessionEmail(body.session));
        break;
      case 'adminUpdateConfig':
        requireSuperAdmin_(body.session);
        data = adminUpdateConfig(body.updates || {}, getSessionEmail(body.session));
        break;
      default:
        throw new Error('ไม่รู้จัก action: ' + action);
    }
    return jsonOut({ ok: true, data: data });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// 2. SETUP (รันครั้งเดียวตอนติดตั้ง)
// ---------------------------------------------------------------------------
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // สร้างโฟลเดอร์ Drive สำหรับเก็บไฟล์
  const rootFolder = DriveApp.createFolder('WaiKhruDontri_Files_' + ss.getId());
  const slipsFolder = rootFolder.createFolder('slips');
  const pdfFolder = rootFolder.createFolder('confirmations_pdf');

  let logoFileId = '';
  try {
    const logoBlob = Utilities.newBlob(
      Utilities.base64Decode(EVENT_LOGO_BASE64_PNG), 'image/png', 'event-logo.png'
    );
    logoFileId = rootFolder.createFile(logoBlob).getId();
  } catch (e) {
    Logger.log('อัปโหลดโลโก้ไม่สำเร็จ (ไม่กระทบการทำงานหลัก แต่ PDF จะไม่มีโลโก้): ' + e.message);
  }

  const defaults = {
    EVENT_NAME: 'พิธีไหว้ครูดนตรี ภาคตะวันออกเฉียงเหนือ ประจำปีการศึกษา 2569',
    EVENT_DATE_TEXT: '25-26 กรกฎาคม 2569',
    VENUE: 'โรงละครคณะศิลปกรรมศาสตร์ มหาวิทยาลัยขอนแก่น',
    REGISTRATION_OPEN: 'TRUE', // 'FALSE' = ปิดรับลงทะเบียน (ตั้งค่าได้จากแดชบอร์ด แท็บตั้งค่าระบบ)
    BANK_ACCOUNT_NAME: 'นายวัศการก แก้วลอย',
    BANK_ACCOUNT_NO: '551-280620-1',
    BANK_NAME: 'ธนาคารไทยพาณิชย์',
    GOOGLE_CLIENT_ID: 'PUT_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE',
    DRIVE_FOLDER_SLIPS_ID: slipsFolder.getId(),
    DRIVE_FOLDER_PDF_ID: pdfFolder.getId(),
    LOGO_FILE_ID: logoFileId,
    TOTAL_SEATS: '500',
    PRICE_KHROB_CHING: '36',
    PRICE_SATHUKAN: '36',
    PRICE_TRA_HOM_ROENG: '36',
    PRICE_KRABONG_KAN: '109',
    PRICE_BAT_SAKUNEE: '509',
    PRICE_KHAN_WAI_KHRU: '59',
    REG_DEADLINE: '2569-07-20',
    COORDINATOR_NAME: 'ผู้ช่วยศาสตราจารย์ ดร.วัศการก แก้วลอย',
    COORDINATOR_EMAIL: 'peerka@kku.ac.th'
  };

  createSheetIfNeeded_(ss, SHEETS.CONFIG, ['key', 'value']);
  createSheetIfNeeded_(ss, SHEETS.REGISTRATIONS, REG_HEADERS);
  createSheetIfNeeded_(ss, SHEETS.DONATIONS, DONATION_HEADERS);
  createSheetIfNeeded_(ss, SHEETS.SEATS, ['seat_number', 'zone', 'status', 'registration_id']);
  createSheetIfNeeded_(ss, SHEETS.ADMINS, ADMIN_HEADERS);
  createSheetIfNeeded_(ss, SHEETS.LOGS, LOG_HEADERS);

  // กำหนดค่าที่นั่งเริ่มต้นตาม TOTAL_SEATS และสร้างหมายเลขที่นั่งในชีต Seats
  populateInitialSeats_(ss, Number(defaults.TOTAL_SEATS || 500));

  const configSheet = ss.getSheetByName(SHEETS.CONFIG);
  Object.keys(defaults).forEach(function (key) {
    configSheet.appendRow([key, defaults[key]]);
  });

  SpreadsheetApp.flush();
  Logger.log('ติดตั้งเรียบร้อย! อย่าลืมตั้งค่า GOOGLE_CLIENT_ID ในชีต Config '
    + 'และเพิ่มแอดมินคนแรกด้วย seedFirstAdmin() หรือ seedFirstAdminPassword()');
}

function createSheetIfNeeded_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clear();
  }
  sheet.appendRow(headers);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sheet;
}

function populateInitialSeats_(ss, totalSeats) {
  if (totalSeats <= 0) return;
  const sheet = ss.getSheetByName(SHEETS.SEATS);
  const rows = [];
  const zones = ['A', 'B', 'C'];
  const blockSize = Math.ceil(totalSeats / zones.length);
  for (let i = 0; i < totalSeats; i++) {
    const zone = zones[Math.min(Math.floor(i / blockSize), zones.length - 1)];
    const seatNumber = zone + String(i + 1).padStart(3, '0');
    rows.push([seatNumber, zone, 'available', '']);
  }
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}

function reserveAvailableSeats_(quantity, registrationId) {
  if (quantity <= 0) return [];
  const sheet = getSheet_(SHEETS.SEATS);
  const seats = sheetToObjects_(sheet, ['seat_number', 'zone', 'status', 'registration_id']);
  const available = seats.filter(function (s) { return String(s.status).toLowerCase() === 'available'; });
  if (available.length < quantity) {
    throw new Error('ที่นั่งไม่เพียงพอ กรุณาลดจำนวนผู้เข้าร่วมหรือเพิ่มที่นั่งในชีต Seats');
  }
  const selected = available.slice(0, quantity);
  selected.forEach(function (seat) {
    sheet.getRange(seat._row, 3).setValue('reserved');
    sheet.getRange(seat._row, 4).setValue(registrationId || '');
  });
  return selected.map(function (seat) { return seat.seat_number; });
}

function releaseSeatsForRegistration_(registrationId) {
  if (!registrationId) return;
  const sheet = getSheet_(SHEETS.SEATS);
  const seats = sheetToObjects_(sheet, ['seat_number', 'zone', 'status', 'registration_id']);
  seats.forEach(function (seat) {
    if (String(seat.registration_id) === String(registrationId)) {
      sheet.getRange(seat._row, 3).setValue('available');
      sheet.getRange(seat._row, 4).setValue('');
    }
  });
}

function findSeatRowByNumber_(seatNumber) {
  const sheet = getSheet_(SHEETS.SEATS);
  const rows = sheetToObjects_(sheet, ['seat_number', 'zone', 'status', 'registration_id']);
  return rows.find(function (seat) {
    return String(seat.seat_number) === String(seatNumber);
  });
}

function adminUpdateSeat(seatNumber, status, actorEmail) {
  if (!seatNumber) throw new Error('ไม่พบ seat_number ที่ต้องการอัปเดต');
  if (!status) throw new Error('ไม่พบสถานะที่ต้องการตั้งค่า');

  const row = findSeatRowByNumber_(seatNumber);
  if (!row) throw new Error('ไม่พบที่นั่ง: ' + seatNumber);

  const allowed = ['available', 'reserved', 'blocked'];
  if (allowed.indexOf(String(status).toLowerCase()) === -1) {
    throw new Error('สถานะที่นั่งไม่ถูกต้อง: ' + status);
  }

  const sheet = getSheet_(SHEETS.SEATS);
  sheet.getRange(row._row, 3).setValue(String(status).toLowerCase());
  if (String(status).toLowerCase() !== 'reserved') {
    sheet.getRange(row._row, 4).setValue('');
  }
  logAction_(actorEmail, 'adminUpdateSeat', { seat_number: seatNumber, status: status });
  return { updated: true };
}

/** ตั้ง Script property ADMIN_SEED_EMAIL = your@email.com ก่อนรันฟังก์ชันนี้ (สำหรับ login ด้วย Google) */
function seedFirstAdmin() {
  const email = PropertiesService.getScriptProperties().getProperty('ADMIN_SEED_EMAIL');
  if (!email) throw new Error('ยังไม่ได้ตั้ง Script property ADMIN_SEED_EMAIL');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ADMINS);
  sheet.appendRow([email, 'Super Admin', 'superadmin', new Date().toISOString(), '', '', '']);
  Logger.log('เพิ่ม ' + email + ' เป็น superadmin แล้ว (เข้าสู่ระบบด้วย Google)');
}

/**
 * ทางเลือกสำหรับผู้ที่ไม่ต้องการใช้ Google OAuth เลย: ตั้ง Script properties
 * ADMIN_SEED_USERNAME และ ADMIN_SEED_PASSWORD ก่อนรันฟังก์ชันนี้ เพื่อสร้างแอดมินคนแรก
 * ที่เข้าสู่ระบบด้วย username/password โดยตรง (รหัสผ่านอย่างน้อย 8 ตัวอักษร)
 */
function seedFirstAdminPassword() {
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty('ADMIN_SEED_USERNAME');
  const password = props.getProperty('ADMIN_SEED_PASSWORD');
  if (!username || !password) throw new Error('ยังไม่ได้ตั้ง Script properties ADMIN_SEED_USERNAME และ ADMIN_SEED_PASSWORD');
  if (password.length < 8) throw new Error('ADMIN_SEED_PASSWORD ต้องมีอย่างน้อย 8 ตัวอักษร');

  const salt = generateSalt_();
  const hash = hashPassword_(password, salt);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ADMINS);
  sheet.appendRow(['', 'Super Admin', 'superadmin', new Date().toISOString(), username, hash, salt]);
  Logger.log('เพิ่มผู้ใช้ ' + username + ' เป็น superadmin แล้ว (เข้าสู่ระบบด้วย username/password) '
    + '- แนะนำให้ลบ ADMIN_SEED_PASSWORD ออกจาก Script properties หลังใช้งานเสร็จเพื่อความปลอดภัย');
}

/**
 * เพิ่มบัญชี "staff" คนแรกแบบเร็ว ๆ จาก Apps Script โดยตรง (ไม่ต้องผ่านแดชบอร์ด)
 * ตั้ง Script properties STAFF_SEED_USERNAME และ STAFF_SEED_PASSWORD ก่อนรัน
 * บัญชีนี้จะเข้าได้แค่หน้าจอเช็คอินหน้างานเท่านั้น เข้าดูข้อมูลอื่นไม่ได้
 */
function seedFirstStaffPassword() {
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty('STAFF_SEED_USERNAME');
  const password = props.getProperty('STAFF_SEED_PASSWORD');
  if (!username || !password) throw new Error('ยังไม่ได้ตั้ง Script properties STAFF_SEED_USERNAME และ STAFF_SEED_PASSWORD');
  if (password.length < 8) throw new Error('STAFF_SEED_PASSWORD ต้องมีอย่างน้อย 8 ตัวอักษร');

  const salt = generateSalt_();
  const hash = hashPassword_(password, salt);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ADMINS);
  sheet.appendRow(['', 'เจ้าหน้าที่จุดลงทะเบียน', 'staff', new Date().toISOString(), username, hash, salt]);
  Logger.log('เพิ่มผู้ใช้ ' + username + ' เป็น staff แล้ว (เช็คอินหน้างานได้อย่างเดียว)');
}

// ---------------------------------------------------------------------------
// 3. HELPERS: sheet <-> object, config
// ---------------------------------------------------------------------------
function getSheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function getConfig_() {
  const sheet = getSheet_(SHEETS.CONFIG);
  const values = sheet.getDataRange().getValues();
  const cfg = {};
  for (let i = 1; i < values.length; i++) {
    cfg[values[i][0]] = values[i][1];
  }
  return cfg;
}

function setConfigValue_(key, value) {
  const sheet = getSheet_(SHEETS.CONFIG);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function sheetToObjects_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row, idx) {
    const obj = { _row: idx + 2 };
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findRowById_(sheet, headers, id) {
  const idCol = headers.indexOf('id');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) {
      const obj = { _row: i + 2 };
      headers.forEach(function (h, j) { obj[h] = values[i][j]; });
      return obj;
    }
  }
  return null;
}

function listAll(sheetName, headers) {
  return sheetToObjects_(getSheet_(sheetName), headers);
}

function generateId_(prefix) {
  return prefix + '-' + Utilities.getUuid().split('-')[0].toUpperCase();
}

function logAction_(actorEmail, action, detail) {
  try {
    getSheet_(SHEETS.LOGS).appendRow([new Date().toISOString(), actorEmail || 'system', action, JSON.stringify(detail || {})]);
  } catch (e) { /* ไม่ให้ log พังงานหลัก */ }
}

function getRecentLogs_() {
  const sheet = getSheet_(SHEETS.LOGS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const startRow = Math.max(2, lastRow - 199); // เอาแค่ 200 รายการล่าสุด กันโหลดหนักเกินไป
  const numRows = lastRow - startRow + 1;
  const values = sheet.getRange(startRow, 1, numRows, LOG_HEADERS.length).getValues();
  return values.map(function (row) {
    const obj = {};
    LOG_HEADERS.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  }).reverse(); // ใหม่สุดขึ้นก่อน
}

// ---------------------------------------------------------------------------
// 4. GOOGLE ID TOKEN VERIFICATION (ไม่ต้องใช้ service account)
// ---------------------------------------------------------------------------
function verifyGoogleIdToken_(idToken) {
  if (!idToken) throw new Error('ไม่พบ idToken กรุณาเข้าสู่ระบบด้วย Google ก่อน');
  const resp = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
    muteHttpExceptions: true
  });
  const json = JSON.parse(resp.getContentText());
  if (json.error) throw new Error('idToken ไม่ถูกต้อง: ' + json.error_description);
  const cfg = getConfig_();
  const expectedAud = cfg.GOOGLE_CLIENT_ID;
  if (expectedAud && expectedAud !== 'PUT_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE' && json.aud !== expectedAud) {
    throw new Error('idToken ออกให้แอปอื่น (aud ไม่ตรง)');
  }
  return { email: json.email, name: json.name || json.email, picture: json.picture || '' };
}

// ---------------------------------------------------------------------------
// 5. ADMIN SESSION (CacheService) + สองวิธีเข้าสู่ระบบ: Google หรือ Username/Password
// ---------------------------------------------------------------------------

/** สร้าง session ใหม่ให้แอดมิน 1 คน (ใช้ร่วมกันทั้ง Google login และ password login) */
function createAdminSession_(adminRecord) {
  const sessionToken = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  const identifier = adminRecord.email || adminRecord.username;
  cache.put('session_' + sessionToken, JSON.stringify({
    email: adminRecord.email || '', username: adminRecord.username || '',
    identifier: identifier, role: adminRecord.role, name: adminRecord.name
  }), SESSION_TTL_SECONDS);
  logAction_(identifier, 'adminLogin', {});
  return { session: sessionToken, email: adminRecord.email || '', username: adminRecord.username || '', name: adminRecord.name, role: adminRecord.role };
}

/** เข้าสู่ระบบแอดมินด้วยบัญชี Google (idToken จาก Google Identity Services) */
function adminLogin(idToken) {
  const user = verifyGoogleIdToken_(idToken);
  const admins = sheetToObjects_(getSheet_(SHEETS.ADMINS), ADMIN_HEADERS);
  const match = admins.find(function (a) { return a.email && a.email.toLowerCase() === user.email.toLowerCase(); });
  if (!match) throw new Error('อีเมลนี้ไม่มีสิทธิ์เข้าระบบแอดมิน: ' + user.email);
  return createAdminSession_(match);
}

/**
 * เข้าสู่ระบบแอดมินด้วย username/password โดยตรง ไม่ต้องผ่าน Google OAuth
 * รหัสผ่านเก็บแบบ salted hash (SHA-256) ไม่ได้เก็บเป็น plain text
 */
function adminLoginPassword(username, password) {
  if (!username || !password) throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
  const admins = sheetToObjects_(getSheet_(SHEETS.ADMINS), ADMIN_HEADERS);
  const match = admins.find(function (a) { return a.username && a.username.toLowerCase() === username.toLowerCase(); });
  if (!match || !match.password_hash) throw new Error('ไม่พบชื่อผู้ใช้นี้ หรือยังไม่ได้ตั้งรหัสผ่านสำหรับบัญชีนี้');

  const computedHash = hashPassword_(password, match.password_salt);
  if (computedHash !== match.password_hash) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

  return createAdminSession_(match);
}

/** แฮชรหัสผ่านด้วย SHA-256 + salt แล้วแปลงเป็น hex string */
function hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '::' + password);
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function generateSalt_() {
  return Utilities.getUuid() + Utilities.getUuid();
}

/** ค้นแถวแอดมินจาก email หรือ username (ใช้ค่าใดก็ได้ที่ไม่ว่าง) */
function findAdminRow_(identifier) {
  const sheet = getSheet_(SHEETS.ADMINS);
  const rows = sheetToObjects_(sheet, ADMIN_HEADERS);
  return rows.find(function (a) {
    return (a.email && a.email.toLowerCase() === String(identifier).toLowerCase()) ||
      (a.username && a.username.toLowerCase() === String(identifier).toLowerCase());
  });
}

/**
 * เปลี่ยน/ตั้งรหัสผ่านของตัวเอง (ต้องเข้าสู่ระบบอยู่ก่อนแล้วไม่ว่าจะด้วยวิธีใด)
 * ถ้าบัญชียังไม่เคยตั้งรหัสผ่านมาก่อน (login ด้วย Google อย่างเดียว) จะข้ามการตรวจ currentPassword
 * และอนุญาตให้ตั้ง username+password ใหม่ได้เลย (เพื่อเปิดใช้การ login แบบ username/password เพิ่มเติม)
 */
function adminChangePassword(sessionToken, currentPassword, newPassword, newUsername) {
  if (!newPassword || newPassword.length < 8) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
  const sess = getSessionData_(sessionToken);
  const sheet = getSheet_(SHEETS.ADMINS);
  const row = findAdminRow_(sess.identifier);
  if (!row) throw new Error('ไม่พบบัญชีแอดมิน');

  if (row.password_hash) {
    if (!currentPassword) throw new Error('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน');
    if (hashPassword_(currentPassword, row.password_salt) !== row.password_hash) {
      throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }
  }

  const salt = generateSalt_();
  const hash = hashPassword_(newPassword, salt);
  sheet.getRange(row._row, ADMIN_HEADERS.indexOf('password_hash') + 1).setValue(hash);
  sheet.getRange(row._row, ADMIN_HEADERS.indexOf('password_salt') + 1).setValue(salt);
  if (newUsername) {
    sheet.getRange(row._row, ADMIN_HEADERS.indexOf('username') + 1).setValue(newUsername);
  }
  logAction_(sess.identifier, 'adminChangePassword', {});
  return { updated: true };
}

function getSessionData_(sessionToken) {
  if (!sessionToken) throw new Error('ไม่พบ session กรุณาเข้าสู่ระบบใหม่');
  const cache = CacheService.getScriptCache();
  const raw = cache.get('session_' + sessionToken);
  if (!raw) throw new Error('session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  return JSON.parse(raw);
}

function requireAdminSession(sessionToken, requiredRole) {
  const sess = getSessionData_(sessionToken);
  if (requiredRole && sess.role !== requiredRole) {
    throw new Error('ต้องมีสิทธิ์ ' + requiredRole + ' เท่านั้น');
  }
  return sess;
}

/** ใช้กับทุก action ที่เป็นข้อมูลฝั่งบริหารจัดการ (ไม่ใช่แค่เช็คอิน) — ต้องเป็น superadmin เท่านั้น */
function requireSuperAdmin_(sessionToken) {
  return requireAdminSession(sessionToken, 'superadmin');
}

function getSessionEmail(sessionToken) {
  try { return getSessionData_(sessionToken).identifier; } catch (e) { return 'unknown'; }
}

// ---------------------------------------------------------------------------
// 6. PUBLIC READ ENDPOINTS
// ---------------------------------------------------------------------------
function getEventInfo() {
  const cfg = getConfig_();
  const regs = sheetToObjects_(getSheet_(SHEETS.REGISTRATIONS), REG_HEADERS);
  const confirmed = regs.filter(function (r) { return r.status === 'confirmed'; });
  const totalParticipants = confirmed.reduce(function (s, r) { return s + Number(r.total_participants || 0); }, 0);
  const seats = sheetToObjects_(getSheet_(SHEETS.SEATS), ['seat_number', 'zone', 'status', 'registration_id']);
  const seatsAvailable = seats.filter(function (s) { return String(s.status).toLowerCase() === 'available'; }).length;

  return {
    eventName: cfg.EVENT_NAME,
    eventDateText: cfg.EVENT_DATE_TEXT,
    venue: cfg.VENUE,
    registrationOpen: String(cfg.REGISTRATION_OPEN).toUpperCase() !== 'FALSE',
    totalRegisteredParticipants: totalParticipants,
    seatsLeft: seatsAvailable,
    totalSeats: Number(cfg.TOTAL_SEATS || seats.length),
    bank: { accountName: cfg.BANK_ACCOUNT_NAME, accountNo: cfg.BANK_ACCOUNT_NO, bankName: cfg.BANK_NAME },
    googleClientId: cfg.GOOGLE_CLIENT_ID,
    regDeadline: cfg.REG_DEADLINE,
    coordinatorName: cfg.COORDINATOR_NAME,
    coordinatorEmail: cfg.COORDINATOR_EMAIL,
    prices: {
      ching: Number(cfg.PRICE_KHROB_CHING),
      sathukan: Number(cfg.PRICE_SATHUKAN),
      tra_hom_roeng: Number(cfg.PRICE_TRA_HOM_ROENG),
      krabong_kan: Number(cfg.PRICE_KRABONG_KAN),
      bat_sakunee: Number(cfg.PRICE_BAT_SAKUNEE),
      khan: Number(cfg.PRICE_KHAN_WAI_KHRU)
    }
  };
}

function getMyRegistration(email, idToken) {
  const user = verifyGoogleIdToken_(idToken);
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('อีเมลไม่ตรงกับผู้เข้าสู่ระบบ');
  }
  const regs = sheetToObjects_(getSheet_(SHEETS.REGISTRATIONS), REG_HEADERS);
  return regs.filter(function (r) { return r.google_email.toLowerCase() === user.email.toLowerCase(); });
}

function getDonationSummary() {
  const donations = sheetToObjects_(getSheet_(SHEETS.DONATIONS), DONATION_HEADERS);
  const verified = donations.filter(function (d) { return d.status === 'verified'; });
  const total = verified.reduce(function (sum, d) { return sum + Number(d.amount || 0); }, 0);
  return { totalAmount: total, donorCount: verified.length };
}

function getStats() {
  const regs = sheetToObjects_(getSheet_(SHEETS.REGISTRATIONS), REG_HEADERS);
  const donations = sheetToObjects_(getSheet_(SHEETS.DONATIONS), DONATION_HEADERS);

  const khrobBreakdown = {};
  KHROB_TYPES.forEach(function (k) { khrobBreakdown[k] = 0; });
  regs.forEach(function (r) {
    let parsed = {};
    try { parsed = JSON.parse(r.khrob_khru_json || '{}'); } catch (e) { parsed = {}; }
    KHROB_TYPES.forEach(function (k) { khrobBreakdown[k] += Number(parsed[k] || 0); });
  });

  const seats = sheetToObjects_(getSheet_(SHEETS.SEATS), ['seat_number', 'zone', 'status', 'registration_id']);
  const seatsAvailable = seats.filter(function (s) { return String(s.status).toLowerCase() === 'available'; }).length;
  const seatsReserved = seats.filter(function (s) { return String(s.status).toLowerCase() === 'reserved'; }).length;

  return {
    totalRegistrations: regs.length,
    confirmedRegistrations: regs.filter(function (r) { return r.status === 'confirmed'; }).length,
    checkedIn: regs.filter(function (r) { return r.checked_in === true || r.checked_in === 'TRUE'; }).length,
    totalStudents: regs.reduce(function (s, r) { return s + Number(r.students_count || 0); }, 0),
    totalTeachers: regs.reduce(function (s, r) { return s + Number(r.teachers_count || 0); }, 0),
    totalParticipants: regs.reduce(function (s, r) { return s + Number(r.total_participants || 0); }, 0),
    totalKhanCount: regs.reduce(function (s, r) { return s + Number(r.khan_count || 0); }, 0),
    seatsAvailable: seatsAvailable,
    seatsReserved: seatsReserved,
    khrobBreakdown: khrobBreakdown, // จำนวนที่ประสงค์ครอบ แยกตามประเภท ทั้งหมด (ไม่ใช่ยอดเงิน)
    donationsPending: donations.filter(function (d) { return d.status === 'pending'; }).length,
    donationsVerified: donations.filter(function (d) { return d.status === 'verified'; }).length,
    donationTotalVerified: donations.filter(function (d) { return d.status === 'verified'; })
      .reduce(function (s, d) { return s + Number(d.amount || 0); }, 0)
  };
}

// ---------------------------------------------------------------------------
// 7. REGISTRATION (สร้างใบตอบรับ — นับจำนวนคนล้วน ๆ ไม่มีที่นั่ง/ยอดเงิน + ออก PDF/QR)
// ---------------------------------------------------------------------------
function createRegistration(body) {
  const cfg = getConfig_();
  if (String(cfg.REGISTRATION_OPEN).toUpperCase() === 'FALSE') {
    throw new Error('ขณะนี้ปิดรับลงทะเบียนแล้ว กรุณาติดต่อผู้ประสานงานของงาน');
  }

  const user = verifyGoogleIdToken_(body.idToken);

  const studentsCount = Number(body.students_count || 0);
  const teachersCount = Number(body.teachers_count || 0);
  const totalParticipants = studentsCount + teachersCount;
  if (totalParticipants <= 0) throw new Error('กรุณาระบุจำนวนผู้เข้าร่วมอย่างน้อย 1 คน');

  const khrobKhru = {};
  let khanCount = 0;
  KHROB_TYPES.forEach(function (k) {
    const count = Math.max(0, Number((body.khrob_khru || {})[k] || 0));
    khrobKhru[k] = count;
    khanCount += count;
  });

  const prices = {
    ching: Number(cfg.PRICE_KHROB_CHING),
    sathukan: Number(cfg.PRICE_SATHUKAN),
    tra_hom_roeng: Number(cfg.PRICE_TRA_HOM_ROENG),
    krabong_kan: Number(cfg.PRICE_KRABONG_KAN),
    bat_sakunee: Number(cfg.PRICE_BAT_SAKUNEE),
    khan: Number(cfg.PRICE_KHAN_WAI_KHRU)
  };

  const totalAmount = KHROB_TYPES.reduce(function (sum, k) {
    return sum + (Number(khrobKhru[k] || 0) * prices[k]);
  }, 0) + (khanCount * prices.khan);

  const id = generateId_('REG');
  const seatNumbers = reserveAvailableSeats_(totalParticipants, id);
  const seatNumbersCsv = seatNumbers.join(', ');
  const qrToken = Utilities.getUuid().split('-')[0] + Utilities.getUuid().split('-')[1];
  const now = new Date().toISOString();

  const sheet = getSheet_(SHEETS.REGISTRATIONS);
  sheet.appendRow([
    id, now, user.email, user.name, body.institution || '', body.address || '',
    body.coordinator_name || '', body.coordinator_phone || '', studentsCount, teachersCount,
    totalParticipants, JSON.stringify(khrobKhru), khanCount, totalAmount, seatNumbersCsv,
    'confirmed', false, '', '', qrToken, '', now, now
  ]);

  let pdfUrl = '';
  try {
    pdfUrl = generateConfirmationPdf_({
      id: id, name: user.name, email: user.email, institution: body.institution || '',
      coordinatorName: body.coordinator_name || '', coordinatorPhone: body.coordinator_phone || '',
      studentsCount: studentsCount, teachersCount: teachersCount, totalParticipants: totalParticipants,
      khrobKhru: khrobKhru, khanCount: khanCount, qrToken: qrToken
    });
    const values = sheet.getDataRange().getValues();
    const idCol = REG_HEADERS.indexOf('id');
    const pdfCol = REG_HEADERS.indexOf('pdf_url');
    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === id) { sheet.getRange(i + 1, pdfCol + 1).setValue(pdfUrl); break; }
    }
  } catch (e) {
    logAction_(user.email, 'pdf_generation_failed', { id: id, error: e.message });
  }

  logAction_(user.email, 'register', { id: id, totalParticipants: totalParticipants, seatNumbers: seatNumbers });
  return {
    id: id, studentsCount: studentsCount, teachersCount: teachersCount,
    totalParticipants: totalParticipants, khrobKhru: khrobKhru, khanCount: khanCount,
    totalAmount: totalAmount, seatNumbers: seatNumbers,
    pdfUrl: pdfUrl, qrToken: qrToken
  };
}

// ---------------------------------------------------------------------------
// 8. PDF + QR GENERATION (ฟอนต์ Sarabun ทางการ + โลโก้ตรากิจกรรมด้านบนสุด)
// ---------------------------------------------------------------------------

function generateConfirmationPdf_(info) {
  const cfg = getConfig_();
  const qrData = 'WAIKHRU|' + info.id + '|' + info.qrToken;
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(qrData);
  const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob().setName('qr_' + info.id + '.png');

  const doc = DocumentApp.create('ใบยืนยันการเข้าร่วม_' + info.id);
  const body = doc.getBody();
  body.setPageWidth(595).setPageHeight(842); // ขนาดประมาณ A4
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(48).setMarginRight(48);

  // ---- ตรากิจกรรม (Main-logo.svg) อยู่บนสุดของเอกสารเสมอ ----
  try {
    const logoFileId = cfg.LOGO_FILE_ID;
    if (logoFileId) {
      const logoBlob = DriveApp.getFileById(logoFileId).getBlob();
      const logoImage = body.appendImage(logoBlob);
      const ratio = logoImage.getHeight() / logoImage.getWidth();
      logoImage.setWidth(220);
      logoImage.setHeight(Math.round(220 * ratio));
      logoImage.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
  } catch (e) {
    Logger.log('แทรกโลโก้ไม่สำเร็จ (ข้ามไปแสดงเฉพาะข้อความ): ' + e.message);
  }

  body.appendParagraph(cfg.EVENT_NAME).setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph(cfg.VENUE + '  |  ' + cfg.EVENT_DATE_TEXT).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('ใบยืนยันการเข้าร่วมพิธีไหว้ครูดนตรี').setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph(' ');

  // ---- ข้อมูลผู้ลงทะเบียน ----
  const infoTable = body.appendTable([
    ['เลขที่ใบตอบรับ', info.id],
    ['ชื่อผู้ลงทะเบียน', info.name],
    ['อีเมล', info.email],
    ['สถาบัน', info.institution],
    ['ผู้ประสานงาน', info.coordinatorName || '-'],
    ['เบอร์ติดต่อ', info.coordinatorPhone || '-']
  ]);
  for (let r = 0; r < infoTable.getNumRows(); r++) infoTable.getRow(r).getCell(0).setWidth(150);

  // ---- แจกแจงจำนวนผู้เข้าร่วมอย่างละเอียด ----
  body.appendParagraph(' ');
  body.appendParagraph('จำนวนผู้เข้าร่วม').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  const peopleTable = body.appendTable([
    ['นักเรียน / นักศึกษา', String(info.studentsCount) + ' คน'],
    ['ครู / อาจารย์', String(info.teachersCount) + ' คน'],
    ['รวมทั้งหมด', String(info.totalParticipants) + ' คน']
  ]);
  for (let r = 0; r < peopleTable.getNumRows(); r++) {
    peopleTable.getRow(r).getCell(0).setWidth(150);
    if (r === peopleTable.getNumRows() - 1) {
      peopleTable.getRow(r).getCell(0).editAsText().setBold(true);
      peopleTable.getRow(r).getCell(1).editAsText().setBold(true);
    }
  }

  // ---- แจกแจงรายการประสงค์ครอบครู (นับเป็นจำนวนคน ไม่ใช่ยอดเงิน) ----
  body.appendParagraph(' ');
  body.appendParagraph('รายการประสงค์เข้าร่วมพิธีครอบครู').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  const khrobRows = [['ประเภทการครอบครู', 'จำนวน (คน)']];
  KHROB_TYPES.forEach(function (k) {
    khrobRows.push([KHROB_LABELS[k], String(info.khrobKhru[k] || 0) + ' คน']);
  });
  khrobRows.push(['รวมจำนวนขันไหว้ครูที่ต้องเตรียม', String(info.khanCount) + ' ขัน']);
  const khrobTable = body.appendTable(khrobRows);
  khrobTable.getRow(0).getCell(0).editAsText().setBold(true);
  khrobTable.getRow(0).getCell(1).editAsText().setBold(true);
  const lastKhrobRow = khrobTable.getRow(khrobTable.getNumRows() - 1);
  lastKhrobRow.getCell(0).editAsText().setBold(true);
  lastKhrobRow.getCell(1).editAsText().setBold(true);

  body.appendParagraph(' ');
  body.appendParagraph('หมายเหตุ: เงินกำนลของแต่ละรายการเตรียมโดยผู้เข้าร่วมด้วยตนเอง ณ วันงาน '
    + '(ดูอัตราเงินกำนลอ้างอิงได้ที่หน้าเว็บไซต์งาน) ทางผู้จัดเตรียมขันไหว้ครูไว้ให้ตามจำนวนข้างต้น')
    .setFontSize(9).setForegroundColor('#6B5847');

  // ---- QR สำหรับเจ้าหน้าที่ (Staff) สแกนเช็คอินหน้างานเท่านั้น ----
  body.appendParagraph(' ');
  body.appendParagraph('สำหรับเจ้าหน้าที่จุดลงทะเบียน (Staff)').setHeading(DocumentApp.ParagraphHeading.HEADING2).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('กรุณาแสดง QR Code นี้ต่อเจ้าหน้าที่เพื่อสแกนเช็คอินเข้าร่วมพิธี').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  const qrImage = body.appendImage(qrBlob);
  qrImage.setWidth(170).setHeight(170);
  qrImage.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // รหัสสำรองแบบตัวอักษรล้วน (กรณีกล้องสแกนไม่ได้หน้างาน เจ้าหน้าที่พิมพ์เข้าระบบเองได้)
  body.appendParagraph('รหัสสำรอง (กรณีสแกน QR ไม่ได้): ' + info.id + ' / ' + info.qrToken)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(9).setForegroundColor('#6B5847');

  // ---- บังคับใช้ฟอนต์ทางการ "Sarabun" กับข้อความทั้งเอกสาร (รวมในตาราง) ----
  try {
    body.editAsText().setFontFamily('Sarabun');
  } catch (e) {
    Logger.log('ตั้งฟอนต์ Sarabun ไม่สำเร็จ (เอกสารยังใช้งานได้ปกติด้วยฟอนต์ตั้งต้น): ' + e.message);
  }

  doc.saveAndClose();

  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  const pdfFolder = DriveApp.getFolderById(cfg.DRIVE_FOLDER_PDF_ID);
  const pdfFile = pdfFolder.createFile(pdfBlob).setName('ใบยืนยัน_' + info.id + '.pdf');
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // ลบไฟล์ Google Doc ชั่วคราว เก็บไว้แค่ PDF
  DriveApp.getFileById(doc.getId()).setTrashed(true);

  return 'https://drive.google.com/file/d/' + pdfFile.getId() + '/view';
}

// ---------------------------------------------------------------------------
// 9. DONATIONS (บริจาค/ทำบุญ + อัปโหลดสลิป)
// ---------------------------------------------------------------------------
function createDonation(body) {
  if (!body.donor_name) throw new Error('กรุณาระบุชื่อผู้บริจาค');
  if (!body.amount || Number(body.amount) <= 0) throw new Error('กรุณาระบุยอดเงินที่ถูกต้อง');

  const cfg = getConfig_();
  let slipFileId = '';
  let slipFileUrl = '';
  if (body.slip_base64) {
    const folder = DriveApp.getFolderById(cfg.DRIVE_FOLDER_SLIPS_ID);
    const decoded = Utilities.base64Decode(body.slip_base64.split(',').pop());
    const mime = (body.slip_mime_type || 'image/jpeg');
    const blob = Utilities.newBlob(decoded, mime, 'slip_' + Date.now() + '_' + (body.donor_name || 'donor'));
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    slipFileId = file.getId();
    slipFileUrl = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  }

  const id = generateId_('DON');
  const now = new Date().toISOString();
  getSheet_(SHEETS.DONATIONS).appendRow([
    id, now, body.donor_name, body.donor_phone || '', body.donor_email || '',
    Number(body.amount), body.note || '', slipFileId, slipFileUrl, 'pending', '', ''
  ]);
  logAction_(body.donor_email || body.donor_name, 'donate', { id: id, amount: body.amount });
  return { id: id, slipFileUrl: slipFileUrl };
}

// ---------------------------------------------------------------------------
// 10. ADMIN CRUD ACTIONS (ทั้งหมดนี้ต้องเป็น superadmin เท่านั้น ยกเว้น adminCheckin)
// ---------------------------------------------------------------------------
function adminUpdateRegistration(body, actorEmail) {
  const sheet = getSheet_(SHEETS.REGISTRATIONS);
  const row = findRowById_(sheet, REG_HEADERS, body.id);
  if (!row) throw new Error('ไม่พบใบตอบรับ id: ' + body.id);

  const editable = ['institution', 'address', 'coordinator_name', 'coordinator_phone',
    'students_count', 'teachers_count', 'status'];
  editable.forEach(function (field) {
    if (body[field] !== undefined) {
      const col = REG_HEADERS.indexOf(field);
      sheet.getRange(row._row, col + 1).setValue(body[field]);
    }
  });

  // ถ้าแก้จำนวนนักเรียน/ครู ให้คำนวณ total_participants ใหม่อัตโนมัติ
  if (body.students_count !== undefined || body.teachers_count !== undefined) {
    const newStudents = Number(body.students_count !== undefined ? body.students_count : row.students_count);
    const newTeachers = Number(body.teachers_count !== undefined ? body.teachers_count : row.teachers_count);
    sheet.getRange(row._row, REG_HEADERS.indexOf('total_participants') + 1).setValue(newStudents + newTeachers);
  }

  sheet.getRange(row._row, REG_HEADERS.indexOf('updated_at') + 1).setValue(new Date().toISOString());
  logAction_(actorEmail, 'adminUpdateRegistration', body);
  return { updated: true };
}

function adminDeleteRegistration(id, actorEmail) {
  const sheet = getSheet_(SHEETS.REGISTRATIONS);
  const row = findRowById_(sheet, REG_HEADERS, id);
  if (!row) throw new Error('ไม่พบใบตอบรับ id: ' + id);
  releaseSeatsForRegistration_(id);
  sheet.deleteRow(row._row);
  logAction_(actorEmail, 'adminDeleteRegistration', { id: id });
  return { deleted: true };
}

function adminUpdateDonation(body, actorEmail) {
  const sheet = getSheet_(SHEETS.DONATIONS);
  const row = findRowById_(sheet, DONATION_HEADERS, body.id);
  if (!row) throw new Error('ไม่พบรายการบริจาค id: ' + body.id);

  const editable = ['donor_name', 'donor_phone', 'donor_email', 'amount', 'note', 'status'];
  editable.forEach(function (field) {
    if (body[field] !== undefined) {
      const col = DONATION_HEADERS.indexOf(field);
      sheet.getRange(row._row, col + 1).setValue(body[field]);
    }
  });
  if (body.status === 'verified') {
    sheet.getRange(row._row, DONATION_HEADERS.indexOf('verified_by') + 1).setValue(actorEmail);
    sheet.getRange(row._row, DONATION_HEADERS.indexOf('verified_at') + 1).setValue(new Date().toISOString());
  }
  logAction_(actorEmail, 'adminUpdateDonation', body);
  return { updated: true };
}

function adminDeleteDonation(id, actorEmail) {
  const sheet = getSheet_(SHEETS.DONATIONS);
  const row = findRowById_(sheet, DONATION_HEADERS, id);
  if (!row) throw new Error('ไม่พบรายการบริจาค id: ' + id);
  sheet.deleteRow(row._row);
  logAction_(actorEmail, 'adminDeleteDonation', { id: id });
  return { deleted: true };
}

/**
 * เช็คอินหน้างานจากการสแกน QR — เป็น action เดียวที่ role "staff" เรียกได้
 * (superadmin เรียกได้เช่นกัน เผื่อช่วยหน้างาน)
 */
function adminCheckin(id, qrToken, actorEmail) {
  const sheet = getSheet_(SHEETS.REGISTRATIONS);
  const row = findRowById_(sheet, REG_HEADERS, id);
  if (!row) throw new Error('ไม่พบใบตอบรับ id: ' + id);
  if (String(row.qr_token) !== String(qrToken)) throw new Error('QR ไม่ถูกต้องหรือปลอมแปลง');
  if (row.checked_in === true || row.checked_in === 'TRUE') throw new Error('เช็คอินไปแล้วเมื่อ ' + row.checked_in_at + ' โดย ' + row.checked_in_by);

  sheet.getRange(row._row, REG_HEADERS.indexOf('checked_in') + 1).setValue(true);
  sheet.getRange(row._row, REG_HEADERS.indexOf('checked_in_at') + 1).setValue(new Date().toISOString());
  sheet.getRange(row._row, REG_HEADERS.indexOf('checked_in_by') + 1).setValue(actorEmail);
  logAction_(actorEmail, 'adminCheckin', { id: id });
  return {
    checkedIn: true, name: row.google_name, institution: row.institution,
    studentsCount: row.students_count, teachersCount: row.teachers_count,
    totalParticipants: row.total_participants
  };
}

/**
 * เช็คอินแบบ "ข้าม" การตรวจ QR — สำหรับ superadmin เท่านั้น ใช้กรณีฉุกเฉินหน้างาน
 * เช่น มือถือผู้เข้าร่วมแบตหมด/ใบพิมพ์ QR ชำรุดอ่านไม่ออก แต่ยืนยันตัวตนได้ด้วยวิธีอื่น
 * (ต่างจาก adminCheckin ตรงที่ "ไม่ต้องมี qrToken ตรงกัน" — จึงจำกัดสิทธิ์ไว้แค่ superadmin
 * และบันทึก log แยกชัดเจนเพื่อการตรวจสอบย้อนหลัง)
 */
function adminCheckinManual(id, actorEmail) {
  const sheet = getSheet_(SHEETS.REGISTRATIONS);
  const row = findRowById_(sheet, REG_HEADERS, id);
  if (!row) throw new Error('ไม่พบใบตอบรับ id: ' + id);
  if (row.checked_in === true || row.checked_in === 'TRUE') {
    throw new Error('เช็คอินไปแล้วเมื่อ ' + row.checked_in_at + ' โดย ' + row.checked_in_by);
  }

  sheet.getRange(row._row, REG_HEADERS.indexOf('checked_in') + 1).setValue(true);
  sheet.getRange(row._row, REG_HEADERS.indexOf('checked_in_at') + 1).setValue(new Date().toISOString());
  sheet.getRange(row._row, REG_HEADERS.indexOf('checked_in_by') + 1).setValue(actorEmail + ' (manual override)');
  logAction_(actorEmail, 'adminCheckinManual', { id: id });
  return {
    checkedIn: true, name: row.google_name, institution: row.institution,
    studentsCount: row.students_count, teachersCount: row.teachers_count,
    totalParticipants: row.total_participants
  };
}

function adminAddAdmin(body, actorEmail) {
  if (!body.email && !body.username) throw new Error('กรุณาระบุอีเมล (สำหรับ Google) หรือ username (สำหรับ username/password) อย่างน้อยหนึ่งอย่าง');
  if (body.role !== 'staff' && body.role !== 'superadmin') throw new Error('role ต้องเป็น staff หรือ superadmin เท่านั้น');
  let hash = '', salt = '';
  if (body.password) {
    if (body.password.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    salt = generateSalt_();
    hash = hashPassword_(body.password, salt);
  }
  getSheet_(SHEETS.ADMINS).appendRow([
    body.email || '', body.name || body.email || body.username, body.role || 'staff',
    new Date().toISOString(), body.username || '', hash, salt
  ]);
  logAction_(actorEmail, 'adminAddAdmin', { email: body.email, username: body.username, role: body.role });
  return { added: true };
}

/** identifier รับได้ทั้ง email หรือ username */
function adminRemoveAdmin(identifier, actorEmail) {
  const sheet = getSheet_(SHEETS.ADMINS);
  const row = findAdminRow_(identifier);
  if (!row) throw new Error('ไม่พบแอดมิน: ' + identifier);
  sheet.deleteRow(row._row);
  logAction_(actorEmail, 'adminRemoveAdmin', { identifier: identifier });
  return { removed: true };
}

/**
 * แก้ไขค่าตั้งค่าระบบ (Config) จากแดชบอร์ดได้โดยตรง — รับ object แบบ { KEY: value, ... }
 * ใช้ทั้งกรณีแก้ทีละค่า (เช่นสลับ REGISTRATION_OPEN) และแก้หลายค่าพร้อมกัน (บันทึกทั้งหมด)
 */
function adminUpdateConfig(updates, actorEmail) {
  const keys = Object.keys(updates || {});
  if (!keys.length) throw new Error('ไม่มีข้อมูลให้บันทึก');
  keys.forEach(function (key) { setConfigValue_(key, updates[key]); });
  logAction_(actorEmail, 'adminUpdateConfig', updates);
  return { updated: true, keys: keys };
}