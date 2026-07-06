# สถาปัตยกรรมระบบเว็บไซต์ "พิธีไหว้ครูดนตรี ภาคตะวันออกเฉียงเหนือ" มข.

## 1. ภาพรวมระบบ

```
┌─────────────────────────┐        HTTPS (fetch)        ┌──────────────────────────────┐
│   Netlify Static Site    │ ───────────────────────────▶│  Google Apps Script Web App   │
│   (HTML/CSS/JS ล้วน)     │◀─────────────────────────── │  (Code.gs)  = REST-like API   │
│                          │        JSON response         │                                │
│  - หน้าแรก (index.html)  │                              │  doGet()  -> อ่านข้อมูล        │
│  - บริจาค (donate.html)  │                              │  doPost() -> เขียน/แก้ข้อมูล   │
│  - ลงทะเบียน (register)  │                              │                                │
│  - แอดมิน (admin/)        │                              └───────────────┬───────────────┘
└─────────────────────────┘                                              │
        │  Google Identity Services (Sign in with Google)                │
        ▼                                                                ▼
┌─────────────────────────┐                              ┌──────────────────────────────┐
│  ผู้ใช้ Google (ผู้ลงทะเบียน)│                              │  Google Sheets (Database)      │
└─────────────────────────┘                              │  + Google Drive (ไฟล์สลิป/PDF) │
                                                          └──────────────────────────────┘
```

**หลักการ:** ฝั่งหน้าเว็บ (frontend) เป็น static site ล้วน ๆ ไม่มี server ของตัวเอง โฮสต์บน Netlify
ฝั่งข้อมูล (backend) ใช้ Google Apps Script ที่ผูกกับ Google Sheet 1 ไฟล์ ทำหน้าที่เป็น Web App
รับ-ส่ง JSON ผ่าน HTTP ทำให้ไม่ต้องเช่า server และไม่มีค่าใช้จ่ายเพิ่มเติม

---

## 2. เหตุผลเชิงเทคนิคที่ควรรู้ก่อนใช้งาน

1. **CORS ของ Apps Script Web App**: Apps Script ไม่รองรับ `doOptions` (preflight) ดังนั้นทุก
   `POST` จาก frontend จะต้องส่งด้วย `Content-Type: text/plain;charset=utf-8` (ไม่ใช่
   `application/json`) เพื่อให้ browser มองว่าเป็น "simple request" และไม่ยิง preflight
   ตัว payload จริงยังคงเป็น JSON string ฝั่ง `Code.gs` จะ `JSON.parse(e.postData.contents)` เอง
   (ดูตัวอย่างใน `public/js/api.js`)
2. **สิทธิ์การ deploy**: ต้อง deploy Apps Script เป็น Web App โดยตั้งค่า
   "Execute as: Me" และ "Who has access: Anyone" (ไม่ใช่ Anyone with Google account)
   เพื่อให้ frontend เรียกได้โดยไม่ต้องผ่านหน้า login ของ Google เอง (เราตรวจสิทธิ์เองด้วย
   id_token ที่ได้จาก Google Identity Services แทน)
3. **การยืนยันตัวตนผู้ใช้**: ใช้ Google Identity Services (GIS) ฝั่ง frontend ขอ `id_token` (JWT)
   แล้วส่งแนบไปกับ request ทุกครั้งที่ต้องยืนยันตัวตน ฝั่ง Apps Script จะยิงไปตรวจสอบที่
   `https://oauth2.googleapis.com/tokeninfo?id_token=...` (เป็น public endpoint ของ Google
   ไม่ต้องใช้ service account) เพื่อดึง email/ชื่อที่ยืนยันแล้วจริง และตรวจ `aud` ให้ตรงกับ
   Google OAuth Client ID ของเรา ป้องกันการปลอมแปลง token
4. **Session ของแอดมิน**: หลัง verify id_token แล้วพบว่า email อยู่ในชีต `Admins` ระบบจะสร้าง
   session token แบบสุ่ม เก็บใน `CacheService` (อายุ 6 ชั่วโมง) แล้วส่งกลับให้ frontend เก็บไว้ใน
   `localStorage` (เพราะไฟล์เหล่านี้ deploy จริงบน Netlify ไม่ใช่ artifact ใน Claude จึงใช้
   localStorage ได้ตามปกติ) ทุก request ของแอดมินจะแนบ session token นี้แทนการ verify id_token
   ซ้ำทุกครั้งเพื่อลดภาระ

---

## 3. โครงสร้างฐานข้อมูล (Google Sheets)

Sheet เดียว 1 ไฟล์ ประกอบด้วยแท็บ (sheet) ดังนี้ — `setupSpreadsheet()` ใน `Code.gs` จะสร้างให้อัตโนมัติ

### 3.1 `Config` (key-value)
| key | value | คำอธิบาย |
|---|---|---|
| EVENT_NAME | พิธีไหว้ครูดนตรี ภาคตะวันออกเฉียงเหนือ 2569 | ชื่องาน |
| EVENT_DATE_TEXT | 25-26 กรกฎาคม 2569 | ข้อความวันที่แสดงหน้าเว็บ |
| VENUE | โรงละครคณะศิลปกรรมศาสตร์ มหาวิทยาลัยขอนแก่น | สถานที่ |
| TOTAL_SEATS | 500 | จำนวนที่นั่งทั้งหมด |
| BANK_ACCOUNT_NAME | นายวัศการก แก้วลอย | ชื่อบัญชีรับบริจาค |
| BANK_ACCOUNT_NO | 551-280620-1 | เลขบัญชี |
| BANK_NAME | ธนาคารไทยพาณิชย์ | ชื่อธนาคาร |
| GOOGLE_CLIENT_ID | (ใส่เอง) | OAuth Client ID จาก Google Cloud Console |
| DRIVE_FOLDER_SLIPS_ID | (auto สร้างตอน setup) | โฟลเดอร์เก็บสลิปโอนเงิน |
| DRIVE_FOLDER_PDF_ID | (auto สร้างตอน setup) | โฟลเดอร์เก็บ PDF ยืนยันที่นั่ง |
| PRICE_KHROB_CHING | 36 | ราคาเงินกำนล ครอบฉิ่ง |
| PRICE_SATHUKAN | 36 | สาธุการ |
| PRICE_TRA_HOM_ROENG | 36 | ตระโหมโรง |
| PRICE_KRABONG_KAN | 109 | กระบองกัน |
| PRICE_BAT_SAKUNEE | 509 | บาทสกุณี |
| PRICE_KHAN_WAI_KHRU | 59 | ค่าขันไหว้ครู |
| REG_DEADLINE | 2569-07-20 | วันปิดรับตอบรับ |

### 3.2 `Registrations` (ใบตอบรับเข้าร่วม)
`id, timestamp, google_email, google_name, institution, address, coordinator_name,
coordinator_phone, students_count, teachers_count, khrob_khru_json, khan_count,
total_amount, seat_numbers, status(pending/confirmed/cancelled), checked_in(TRUE/FALSE),
checked_in_at, qr_token, pdf_url, created_at, updated_at`

- `khrob_khru_json` เก็บเป็น JSON string เช่น
  `{"ching":2,"sathukan":1,"tra_hom_roeng":0,"krabong_kan":1,"bat_sakunee":0}`
- `qr_token` = สุ่ม 12 ตัวอักษร ใช้ยืนยันตอน check-in หน้างานคู่กับ `id`

### 3.3 `Donations` (ยอดบริจาค/ทำบุญ)
`id, timestamp, donor_name, donor_phone, donor_email, amount, note, slip_file_id,
slip_file_url, status(pending/verified/rejected), verified_by, verified_at`

### 3.4 `Seats` (ผังที่นั่ง)
`seat_number, zone, status(available/reserved/blocked), registration_id`
- สร้างอัตโนมัติตามจำนวน `TOTAL_SEATS` ตอน setup (โซน A/B/C ตามสัดส่วน)

### 3.5 `Admins`
`email, name, role(superadmin/staff), added_at, username, password_hash, password_salt`

- แอดมิน 1 คนมีได้ 2 วิธีเข้าสู่ระบบพร้อมกัน: **(ก)** Google (ใช้ฟิลด์ `email`) หรือ **(ข)**
  username/password (ใช้ฟิลด์ `username` + `password_hash` + `password_salt`) — เว้นว่างฟิลด์
  ที่ไม่ได้ใช้ได้ เช่น แอดมินที่ไม่ต้องการผูกกับ Google เลยก็ใส่แค่ username/password
- `password_hash` คำนวณจาก SHA-256(`salt::password`) ไม่มีการเก็บรหัสผ่านจริงในชีต และ API จะ
  ไม่ส่งฟิลด์ `password_hash`/`password_salt` กลับไปยัง frontend เด็ดขาด (ดู `adminListAdmins`)

### 3.6 `Logs` (audit log)
`timestamp, actor_email, action, detail`

---

## 4. Web App API (Code.gs)

Base URL: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`

### GET (`doGet`) — อ่านข้อมูล อ่านได้อิสระไม่ต้อง login
| action | parameter | คำอธิบาย |
|---|---|---|
| `getEventInfo` | – | ข้อมูลงาน, ราคา, กำหนดการ, ที่นั่งคงเหลือ |
| `getSeatMap` | – | ผังที่นั่งทั้งหมดพร้อมสถานะ |
| `getMyRegistration` | `email` | ใบตอบรับของผู้ใช้ (ยืนยันด้วย idToken ที่ query แนบ) |
| `getDonationSummary` | – | ยอดบริจาครวม (เฉพาะที่ verified) แสดงหน้าแรกแบบ real-time |
| `adminListRegistrations` | `session` | (แอดมิน) รายการตอบรับทั้งหมด |
| `adminListDonations` | `session` | (แอดมิน) รายการบริจาคทั้งหมด |
| `adminGetStats` | `session` | (แอดมิน) สรุปแดชบอร์ด |

### POST (`doPost`) — body เป็น JSON string ส่งแบบ text/plain, มี field `action`
| action | ใครเรียกได้ | คำอธิบาย |
|---|---|---|
| `register` | ผู้ใช้ (แนบ `idToken`) | สร้างใบตอบรับ + จองที่นั่งอัตโนมัติ + สร้าง PDF + QR |
| `donate` | สาธารณะ | บันทึกรายการบริจาค + อัปโหลดสลิป (base64) ขึ้น Drive |
| `adminLogin` | ผู้ใช้ (แนบ `idToken`) | เข้าสู่ระบบแอดมินด้วยบัญชี Google คืน session token |
| `adminLoginPassword` | สาธารณะ (แนบ `username`,`password`) | เข้าสู่ระบบแอดมินด้วย username/password โดยตรง **ไม่ต้องผ่าน Google OAuth** คืน session token |
| `adminChangePassword` | แอดมิน (session) | ตั้ง/เปลี่ยนรหัสผ่าน + username ของตนเอง (ใช้เปิดใช้งานการ login แบบ username/password ภายหลัง) |
| `adminUpdateRegistration` | แอดมิน | แก้ไข/ยืนยัน/ยกเลิกใบตอบรับ (CRUD) |
| `adminDeleteRegistration` | แอดมิน | ลบใบตอบรับ + คืนที่นั่ง |
| `adminUpdateDonation` | แอดมิน | เปลี่ยนสถานะยืนยันสลิป (CRUD) |
| `adminDeleteDonation` | แอดมิน | ลบรายการบริจาค |
| `adminCheckin` | แอดมิน | ยืนยันเช็คอินหน้างานจากการสแกน QR (ตรวจ id+token) |
| `adminUpdateSeat` | แอดมิน | บล็อค/ปลดบล็อคที่นั่งเป็นรายที่ |

ทุก response คืนรูปแบบเดียวกัน: `{ ok: true, data: ... }` หรือ `{ ok: false, error: "..." }`

---

## 5. โครงสร้างไฟล์ Frontend (deploy บน Netlify)

```
public/                     ← Netlify publish directory
├── index.html               หน้าแรก: ข้อมูลงาน, กำหนดการ, ปุ่มบริจาค/ลงทะเบียน, FAQ
├── donate.html              ฟอร์มบริจาค + QR/เลขบัญชี + อัปโหลดสลิป
├── register.html            Sign in with Google + ฟอร์มตอบรับ + เลือกที่นั่ง + ออกใบยืนยัน
├── admin/
│   ├── index.html           แดชบอร์ดแอดมิน (login 2 แบบ: username/password หรือ Google + CRUD + สถิติ)
│   └── js/admin.js
├── css/
│   ├── style.css            ธีมหลัก (ทอง/ครีม/แดงเลือดหมู ตามโปสเตอร์งาน)
│   └── admin.css
├── js/
│   ├── config.js            ค่าคงที่ (API URL, Google Client ID)
│   ├── api.js                ตัวช่วยเรียก GAS API (GET/POST แบบไม่ preflight)
│   ├── main.js               ตรรกะหน้าแรก
│   ├── register.js           ตรรกะหน้าลงทะเบียน + Google Sign-In
│   └── donate.js              ตรรกะหน้าบริจาค + แปลงไฟล์เป็น base64
└── assets/
    ├── Main-logo.svg
    ├── FA-logo.svg
    └── KKU-main.svg

package.json                 ← สคริปต์ npm สำหรับพรีวิวเว็บในเครื่อง (npm run dev) ก่อน deploy จริง
netlify.toml                 ← กำหนด publish directory และ redirect กฎพื้นฐาน (SPA-like สำหรับ /admin)
```

ขั้นตอนติดตั้งแบบละเอียดทุกขั้นตอน (ตั้งแต่เขียน Code.gs จนถึง npm run dev และ deploy hosting)
อยู่ใน **`INSTALL.md`**

---

## 6. ขั้นตอน Deploy โดยสรุป

1. สร้าง Google Sheet เปล่า 1 ไฟล์ → เปิด Extensions > Apps Script → วางโค้ด `backend/Code.gs`
2. รันฟังก์ชัน `setupSpreadsheet` ครั้งเดียว (จะสร้างทุกชีต + โฟลเดอร์ Drive + ใส่ราคาตั้งต้น)
3. ไปที่ Project Settings > Script Properties เพิ่ม `ADMIN_SEED_EMAIL` = อีเมลแอดมินคนแรก
   แล้วรัน `seedFirstAdmin` เพื่อเพิ่มตัวเองเป็น superadmin
4. Deploy > New deployment > Web app > Execute as "Me", Who has access "Anyone"
5. คัดลอก URL ที่ได้ (ลงท้ายด้วย `/exec`) ไปใส่ใน `public/js/config.js` -> `API_URL`
6. สร้าง OAuth Client ID (Web application) ใน Google Cloud Console ใส่โดเมน Netlify เป็น
   Authorized JavaScript origin แล้วนำ Client ID ไปใส่ใน `config.js` -> `GOOGLE_CLIENT_ID`
7. Push โฟลเดอร์ `public/` ขึ้น Netlify (ลาก-วางหรือเชื่อม Git) ตั้ง publish directory = `public`
8. ทดสอบ: เปิดหน้าเว็บ > ลองบริจาค > ลองลงทะเบียน > เข้า `/admin` ด้วยอีเมลแอดมิน

รายละเอียดทุกขั้นตอนอยู่ใน `README.md`
