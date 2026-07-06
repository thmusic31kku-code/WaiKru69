# คู่มือติดตั้งฉบับสมบูรณ์
### เว็บไซต์พิธีไหว้ครูดนตรี ภาคตะวันออกเฉียงเหนือ — มหาวิทยาลัยขอนแก่น

เอกสารนี้พาไปทีละขั้นตอนตั้งแต่เขียน `Code.gs`, ตั้งค่าแอดมิน (รวมวิธี login ด้วย
username/password โดยไม่ต้องพึ่ง Google), พัฒนา/พรีวิวในเครื่องด้วย `npm run dev`,
ไปจนถึงการนำขึ้น hosting จริงบน Netlify

สารบัญ:
- [ส่วนที่ 0 — เตรียมเครื่องมือ](#ส่วนที่-0--เตรียมเครื่องมือ)
- [ส่วนที่ 1 — เขียน Code.gs และสร้างฐานข้อมูล](#ส่วนที่-1--เขียน-codegs-และสร้างฐานข้อมูล)
- [ส่วนที่ 2 — ตั้งค่าแอดมินคนแรก](#ส่วนที่-2--ตั้งค่าแอดมินคนแรก)
- [ส่วนที่ 3 — Deploy Apps Script เป็น Web App](#ส่วนที่-3--deploy-apps-script-เป็น-web-app)
- [ส่วนที่ 4 — (ถ้าต้องการ) สร้าง Google OAuth Client ID](#ส่วนที่-4--ถ้าต้องการ-สร้าง-google-oauth-client-id)
- [ส่วนที่ 5 — ตั้งค่าไฟล์ frontend](#ส่วนที่-5--ตั้งค่าไฟล์-frontend)
- [ส่วนที่ 6 — พัฒนา/พรีวิวในเครื่องด้วย npm run dev](#ส่วนที่-6--พัฒนาพรีวิวในเครื่องด้วย-npm-run-dev)
- [ส่วนที่ 7 — นำขึ้น Hosting จริง (Netlify)](#ส่วนที่-7--นำขึ้น-hosting-จริง-netlify)
- [ส่วนที่ 8 — เช็คลิสต์ทดสอบหลัง deploy](#ส่วนที่-8--เช็คลิสต์ทดสอบหลัง-deploy)
- [ส่วนที่ 9 — จัดการแอดมิน & รหัสผ่านภายหลัง](#ส่วนที่-9--จัดการแอดมิน--รหัสผ่านภายหลัง)
- [แก้ปัญหาที่พบบ่อย](#แก้ปัญหาที่พบบ่อย)

---

## ส่วนที่ 0 — เตรียมเครื่องมือ

ก่อนเริ่ม ให้เตรียมสิ่งเหล่านี้ให้พร้อม:

| สิ่งที่ต้องมี | ใช้ทำอะไร | ดาวน์โหลด |
|---|---|---|
| บัญชี Google | สร้าง Google Sheet + Apps Script + Drive | ใช้บัญชีที่มีอยู่แล้วได้ |
| Node.js (v18 ขึ้นไป) | รัน `npm run dev` พรีวิวเว็บในเครื่อง | https://nodejs.org |
| บัญชี Netlify (ฟรี) | นำเว็บขึ้น hosting จริง | https://app.netlify.com |
| โปรแกรมแก้ไขข้อความ/โค้ด | แก้ไฟล์ config.js, Code.gs | VS Code แนะนำ |

ตรวจสอบว่าเครื่องมีคำสั่ง Node.js/npm พร้อมใช้งาน:
```bash
node -v      # ควรได้ v18 ขึ้นไป
npm -v       # ควรได้ v9 ขึ้นไป
```

---

## ส่วนที่ 1 — เขียน Code.gs และสร้างฐานข้อมูล

1. เปิด [sheets.google.com](https://sheets.google.com) กด **+ ว่างเปล่า** เพื่อสร้างสเปรดชีตใหม่
   ตั้งชื่อไฟล์ เช่น `WaiKhruDontri Database`
2. เมนู **ส่วนขยาย (Extensions) > Apps Script** ระบบจะเปิดแท็บใหม่เป็นหน้าต่างเขียนโค้ด
3. ในหน้าต่าง Apps Script จะมีไฟล์ `Code.gs` เปล่า ๆ อยู่แล้ว — **ลบโค้ดเดิมทั้งหมดออกให้หมด**
4. เปิดไฟล์ `backend/Code.gs` จากโปรเจกต์นี้ คัดลอกทั้งไฟล์ แล้ววางแทนที่ในหน้าต่าง Apps Script
5. ตั้งชื่อโปรเจกต์ Apps Script (คลิกที่ "Untitled project" ด้านบนซ้าย) เช่น `WaiKhruDontri Backend`
6. กด **บันทึก** (ไอคอนแผ่นดิสก์ หรือ Ctrl+S)
7. ที่แถบด้านบนของ editor จะมี dropdown เลือกฟังก์ชัน (ข้าง ๆ ปุ่ม Run ▶) เลือก
   **`setupSpreadsheet`** แล้วกด **Run**
   - ครั้งแรกที่รัน Google จะขอ **Authorize** สคริปต์:
     กด "Review permissions" → เลือกบัญชี Google ของท่าน → หน้าจอ "Google hasn't verified
     this app" ให้กด **Advanced** → **Go to (ชื่อโปรเจกต์) (unsafe)** → **Allow**
     (เป็นเรื่องปกติเพราะเป็นสคริปต์ที่เราเขียน/ควบคุมเองทั้งหมด ไม่ใช่แอปของบุคคลที่สาม)
   - รอสักครู่จนเห็น "Execution completed" ด้านล่าง
8. กลับไปที่แท็บ Google Sheet เดิม จะเห็นชีตใหม่ครบทั้ง 6 แท็บ: `Config`, `Registrations`,
   `Donations`, `Seats`, `Admins`, `Logs` และชีต `Seats` จะมีเลขที่นั่งเต็มจำนวน (ค่าเริ่มต้น 500 ที่)
9. เช็ค Google Drive ของท่าน จะมีโฟลเดอร์ใหม่ชื่อ `WaiKhruDontri_Files_{sheetId}` ที่มีโฟลเดอร์ย่อย
   `slips` และ `confirmations_pdf` อยู่ข้างใน

> **ปรับแต่งข้อมูลงานได้ทันที:** เปิดชีต `Config` แล้วแก้ค่าต่าง ๆ ได้เลยตรง ๆ เช่น ชื่องาน,
> วันที่, ราคาเงินกำนลแต่ละประเภท, จำนวนที่นั่งทั้งหมด, เลขบัญชีธนาคาร — ไม่ต้องแก้โค้ด

---

## ส่วนที่ 2 — ตั้งค่าแอดมินคนแรก

ระบบรองรับ **2 วิธี** ในการเข้าสู่ระบบแอดมิน เลือกอย่างใดอย่างหนึ่งหรือทำทั้งสองแบบก็ได้

### วิธี A: เข้าสู่ระบบด้วย Username/Password (ไม่ต้องใช้ Google OAuth เลย) — แนะนำถ้าต้องการง่ายและเร็ว

1. ในหน้าต่าง Apps Script เมนู **⚙️ Project Settings** (ไอคอนเฟืองด้านซ้าย)
2. เลื่อนลงหา **Script Properties** กด **Add script property** เพิ่ม 2 รายการ:
   - Property: `ADMIN_SEED_USERNAME`  Value: ชื่อผู้ใช้ที่ต้องการ เช่น `admin`
   - Property: `ADMIN_SEED_PASSWORD`  Value: รหัสผ่าน (ต้องยาวอย่างน้อย 8 ตัวอักษร) เช่น `WaiKhru2569!`
3. กด **Save script properties**
4. กลับไปแท็บ **Editor** เลือกฟังก์ชัน **`seedFirstAdminPassword`** จาก dropdown แล้วกด **Run**
5. เมื่อรันเสร็จ ("Execution completed") ท่านจะสามารถ login เข้าหน้า `/admin` ด้วย
   username/password ที่ตั้งไว้ได้ทันที **โดยไม่ต้องมี Google OAuth Client ID เลย**
6. **ด้วยเหตุผลด้านความปลอดภัย** แนะนำให้ลบ Script property `ADMIN_SEED_PASSWORD` ออกหลังใช้งาน
   เสร็จ (กลับไปที่ Project Settings แล้วกดถังขยะข้าง property นั้น) เพราะรหัสผ่านจะถูกเก็บเป็น
   plain text ไว้ใน Script Properties ตราบใดที่ยังไม่ลบออก (ตัวรหัสผ่านในชีต Admins ถูกแฮชแล้ว
   จึงปลอดภัย แต่ Script property ต้นทางยังเป็น plain text)

### วิธี B: เข้าสู่ระบบด้วยบัญชี Google

1. เมนู **⚙️ Project Settings > Script Properties > Add script property**
   - Property: `ADMIN_SEED_EMAIL`  Value: อีเมล Google ของแอดมิน เช่น `peerka@kku.ac.th`
2. กลับไปแท็บ Editor เลือกฟังก์ชัน **`seedFirstAdmin`** แล้วกด **Run**
3. วิธีนี้ต้องทำ [ส่วนที่ 4](#ส่วนที่-4--ถ้าต้องการ-สร้าง-google-oauth-client-id) เพิ่มเติม
   เพื่อให้ปุ่ม Sign in with Google ทำงานได้จริง

> ทำได้ทั้งสองวิธีพร้อมกันสำหรับแอดมินคนเดียว หรือคนละวิธีสำหรับแอดมินหลายคนก็ได้ — ในหน้า
> แดชบอร์ดแท็บ "ผู้ดูแลระบบ" แอดมินระดับ superadmin สามารถเพิ่มแอดมินคนอื่นและกำหนดวิธี
> login ให้แต่ละคนได้อีกทีหลัง deploy เสร็จ

---

## ส่วนที่ 3 — Deploy Apps Script เป็น Web App

1. มุมขวาบนของหน้าต่าง Apps Script กด **Deploy > New deployment**
2. คลิกไอคอนเฟืองข้าง "Select type" เลือก **Web app**
3. กรอก Description เช่น `v1`
4. ตั้งค่า:
   - **Execute as: Me (อีเมลของท่าน)**
   - **Who has access: Anyone**
5. กด **Deploy**
6. หากมี popup ขอ Authorize อีกครั้ง ทำตามขั้นตอนเดิมในส่วนที่ 1 ข้อ 7
7. คัดลอก **Web app URL** ที่ปรากฏ (รูปแบบ `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`)
   เก็บไว้ใช้ในส่วนที่ 5

> **สำคัญ:** ทุกครั้งที่แก้ไขโค้ดใน `Code.gs` ภายหลัง ต้องกลับมาที่ **Deploy > Manage deployments**
> กดไอคอนดินสอ (Edit) ที่ deployment เดิม เปลี่ยน Version เป็น **New version** แล้วกด **Deploy**
> ซ้ำ ไม่เช่นนั้น URL เดิมจะยังรันโค้ดเวอร์ชันเก่าอยู่ (URL จะไม่เปลี่ยนถ้าแก้แบบนี้)

---

## ส่วนที่ 4 — (ถ้าต้องการ) สร้าง Google OAuth Client ID

**ข้ามส่วนนี้ได้เลยถ้า:**
- แอดมินทุกคนใช้วิธี username/password (วิธี A) เท่านั้น, **และ**
- ไม่ต้องการให้ผู้เข้าร่วมงานลงทะเบียนผ่าน Google (หน้า `register.html`) — ในกรณีนี้ต้องปรับแก้
  หน้า register ให้ใช้วิธียืนยันตัวตนอื่นแทน (ไม่ได้รวมอยู่ในเอกสารนี้)

**ทำส่วนนี้ถ้า:** ต้องการให้ผู้เข้าร่วมงานลงทะเบียน (`register.html`) ผ่านบัญชี Google
(ระบบออกแบบมาให้หน้าลงทะเบียนสาธารณะใช้ Google เป็นหลักเพื่อป้องกันการจองที่นั่งซ้ำซ้อน)
หรือต้องการเปิดให้แอดมินบางคน login ด้วย Google ได้ด้วย (วิธี B)

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่ (มุมซ้ายบน > New Project) หรือใช้โปรเจกต์เดิม
3. เมนู **APIs & Services > OAuth consent screen**
   - User Type: **External** (สำหรับบัญชี Google ทั่วไป) กด Create
   - กรอกชื่อแอป เช่น "ไหว้ครูดนตรี มข." อีเมลติดต่อ แล้วกด Save ไปเรื่อย ๆ จนเสร็จ
4. เมนู **APIs & Services > Credentials > + Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: เช่น "WaiKhru Website"
   - **Authorized JavaScript origins** ใส่โดเมนที่จะใช้งานจริง:
     - `http://localhost:3000` (สำหรับตอนพัฒนาในเครื่องด้วย `npm run dev`)
     - `https://ชื่อเว็บของท่าน.netlify.app` (ใส่หลังจาก deploy Netlify แล้วในส่วนที่ 7 —
       ตอนนี้ยังไม่รู้ชื่อ ใส่ทีหลังได้ กลับมาแก้ที่หน้านี้ได้ตลอด)
   - กด **Create**
5. คัดลอก **Client ID** ที่ได้ (รูปแบบ `xxxxxxxx.apps.googleusercontent.com`)

---

## ส่วนที่ 5 — ตั้งค่าไฟล์ frontend

เปิดไฟล์ `public/js/config.js` แก้ 2 ค่านี้:

```js
window.APP_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',  // จากส่วนที่ 3 ข้อ 7
  GOOGLE_CLIENT_ID: 'xxxxxxxx.apps.googleusercontent.com'           // จากส่วนที่ 4 ข้อ 5
};
```

- ถ้าข้ามส่วนที่ 4 ไป ให้ปล่อย `GOOGLE_CLIENT_ID` เป็นค่าเริ่มต้นไว้ได้ — ปุ่ม Sign in with Google
  จะใช้งานไม่ได้ แต่หน้า login แอดมินแบบ username/password และ (ถ้าปรับแก้) หน้าลงทะเบียน
  ยังทำงานได้ตามปกติ
- กลับไปที่ชีต `Config` ในสเปรดชีต แก้แถว `GOOGLE_CLIENT_ID` ให้เป็นค่าเดียวกันด้วย
  (backend ใช้ค่านี้ตรวจสอบ idToken ที่ frontend ส่งมาว่าถูกออกให้แอปนี้จริง)

---

## ส่วนที่ 6 — พัฒนา/พรีวิวในเครื่องด้วย npm run dev

โปรเจกต์นี้เป็น static site (HTML/CSS/JS ล้วน ไม่มีขั้นตอน build/compile) จึงใช้
[`live-server`](https://www.npmjs.com/package/live-server) เป็นตัวเสิร์ฟไฟล์ในเครื่องพร้อม
auto-reload เวลาแก้โค้ด

1. เปิด terminal ไปที่โฟลเดอร์โปรเจกต์ (โฟลเดอร์ที่มีไฟล์ `package.json`)
2. ติดตั้ง dependencies ครั้งแรก:
   ```bash
   npm install
   ```
3. รันเซิร์ฟเวอร์พัฒนา:
   ```bash
   npm run dev
   ```
4. เบราว์เซอร์จะเปิดอัตโนมัติที่ `http://localhost:3000` (หน้าแรกของเว็บไซต์)
   - ทดสอบ `http://localhost:3000/donate.html`
   - ทดสอบ `http://localhost:3000/register.html`
   - ทดสอบ `http://localhost:3000/admin/index.html`
5. แก้ไฟล์ใด ๆ ใน `public/` แล้วบันทึก หน้าเว็บจะรีเฟรชอัตโนมัติให้เห็นผลทันที
6. กด `Ctrl + C` ใน terminal เพื่อหยุดเซิร์ฟเวอร์เมื่อพัฒนาเสร็จ

**ข้อควรรู้ตอนพรีวิวในเครื่อง:** เนื่องจาก `API_URL` ชี้ไปที่ Apps Script Web App จริงบน
Google (ไม่ใช่เซิร์ฟเวอร์ในเครื่อง) การกรอกฟอร์มบริจาค/ลงทะเบียนตอนพรีวิวในเครื่องจะ
**บันทึกข้อมูลจริงลงชีตจริง** — ถ้าต้องการทดสอบแบบไม่ปนข้อมูลจริง แนะนำสร้าง Google Sheet
+ Apps Script deployment แยกต่างหากไว้สำหรับ "ทดสอบ" แล้วสลับ `API_URL` ใน `config.js`
ระหว่างแบบทดสอบกับแบบใช้งานจริงตามความเหมาะสม

---

## ส่วนที่ 7 — นำขึ้น Hosting จริง (Netlify)

เมื่อทดสอบในเครื่องแล้วโอเค ให้นำโฟลเดอร์ `public/` ขึ้น Netlify ด้วยวิธีใดวิธีหนึ่ง:

### วิธีที่ 1: ลาก-วาง (เร็วที่สุด เหมาะกับทดสอบ/งานเดี่ยว)
1. ไปที่ [app.netlify.com/drop](https://app.netlify.com/drop)
2. ลากทั้งโฟลเดอร์ `public/` ไปวางในหน้าเว็บ (**ต้องเป็นโฟลเดอร์ `public/` เท่านั้น ไม่ใช่
   โฟลเดอร์โปรเจกต์ทั้งหมด** เพราะ `package.json`, `backend/` ไม่ต้องขึ้นเว็บ)
3. รอสักครู่ จะได้ URL ทันที เช่น `https://random-name-123.netlify.app`
4. (แนะนำ) ไปที่ **Site settings > Change site name** เปลี่ยนเป็นชื่อที่จำง่าย เช่น
   `waikhru-kku.netlify.app`

### วิธีที่ 2: เชื่อมกับ Git (แนะนำสำหรับใช้งานจริงระยะยาว)
1. Push โปรเจกต์ทั้งหมดขึ้น GitHub/GitLab (รวม `netlify.toml` ที่มีอยู่แล้ว)
2. เข้า [app.netlify.com](https://app.netlify.com) **> Add new site > Import an existing project**
3. เลือก repository ที่ push ไว้
4. ตรวจสอบ build settings (ค่าจาก `netlify.toml` จะถูกอ่านอัตโนมัติ):
   - **Publish directory: `public`**
   - Build command: เว้นว่าง
5. กด **Deploy site** — ทุกครั้งที่ push โค้ดใหม่ขึ้น Git, Netlify จะ deploy เวอร์ชันใหม่ให้อัตโนมัติ

### หลัง deploy เสร็จ (ทั้งสองวิธี)
กลับไปที่ **Google Cloud Console > Credentials > OAuth client ID** ที่สร้างไว้ในส่วนที่ 4
เพิ่มโดเมน Netlify จริงที่ได้ (เช่น `https://waikhru-kku.netlify.app`) ลงใน
**Authorized JavaScript origins** — ถ้าลืมขั้นตอนนี้ปุ่ม Sign in with Google จะขึ้น error
`redirect_uri_mismatch` หรือ `origin_mismatch`

---

## ส่วนที่ 8 — เช็คลิสต์ทดสอบหลัง deploy

- [ ] เปิดหน้าแรก (`/`) — เห็นชื่องาน วันที่ และ "ที่นั่งว่าง" ที่ดึงจากชีตจริง
- [ ] หน้า **บริจาค** (`/donate.html`) — กรอกฟอร์ม + แนบรูปทดสอบ ส่งแล้วเช็คว่ามีแถวใหม่ในชีต
      `Donations` และมีไฟล์รูปในโฟลเดอร์ Drive `slips`
- [ ] หน้า **ลงทะเบียน** (`/register.html`) — Sign in with Google (ถ้าเปิดใช้) แล้วส่งฟอร์ม
      ตรวจว่ามีแถวใหม่ในชีต `Registrations`, ที่นั่งในชีต `Seats` เปลี่ยนเป็น `reserved`,
      และมี PDF ใหม่ในโฟลเดอร์ Drive `confirmations_pdf`
- [ ] หน้า **`/admin`** — ทดสอบ login ทั้งสองแท็บ (username/password และ/หรือ Google)
      ตรวจว่าเห็นสถิติ, ตารางใบตอบรับ/บริจาค, ผังที่นั่ง ครบถ้วน
- [ ] แท็บ **ผู้ดูแลระบบ** (เฉพาะ superadmin) — ลองเพิ่ม/ลบแอดมินทดสอบ 1 คน
- [ ] ปุ่ม **🔑 เปลี่ยน/ตั้งรหัสผ่าน** ในแดชบอร์ด — ทดสอบเปลี่ยนรหัสผ่านตัวเอง แล้ว logout/login
      ใหม่ด้วยรหัสผ่านใหม่

---

## ส่วนที่ 9 — จัดการแอดมิน & รหัสผ่านภายหลัง

- **เพิ่มแอดมินใหม่:** เข้า `/admin` ด้วยบัญชี superadmin > แท็บ "ผู้ดูแลระบบ" >
  "+ เพิ่มผู้ดูแลระบบ" กรอกอีเมล Google และ/หรือ username+password ตามต้องการ
- **แอดมินคนเดิมที่ login ด้วย Google อยู่แล้ว อยากเพิ่มวิธี username/password:**
  เข้าสู่ระบบตามปกติ > กดปุ่ม **🔑 เปลี่ยน/ตั้งรหัสผ่าน** ที่แถบด้านข้าง > ตั้ง username +
  รหัสผ่านใหม่ (ไม่ต้องกรอกรหัสผ่านปัจจุบันเพราะยังไม่เคยตั้งมาก่อน) > บันทึก
- **ลืมรหัสผ่าน:** ให้ superadmin อีกคนลบแอดมินคนนั้นออกจากแท็บ "ผู้ดูแลระบบ" แล้วเพิ่มใหม่
  พร้อมตั้งรหัสผ่านใหม่ให้ (ระบบยังไม่มีฟีเจอร์ "ลืมรหัสผ่าน" ผ่านอีเมลอัตโนมัติ)
- **ลบสิทธิ์แอดมิน:** แท็บ "ผู้ดูแลระบบ" กดปุ่ม "ลบ" ที่แถวนั้น (มีผลทันที เพราะ session
  เดิมจะหมดอายุตามเวลาที่ตั้งไว้ ไม่ได้ถูกเพิกถอนทันทีจนกว่า session จะหมดอายุ — ปรับเวลาได้ที่
  `SESSION_TTL_SECONDS` ใน `Code.gs`)

---

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| หน้าแรกไม่ขึ้นข้อมูลงาน / วนโหลดตลอด | `API_URL` ใน `config.js` ยังเป็นค่าเริ่มต้น หรือผิด | ตรวจว่าคัดลอก URL จากส่วนที่ 3 ข้อ 7 มาใส่ถูกต้อง ลงท้ายด้วย `/exec` |
| กด login แล้วขึ้น "session หมดอายุ" ทันที | เวลาของเบราว์เซอร์/เครื่องคลาดเคลื่อนมาก หรือ CacheService ยังไม่พร้อม | ลอง login ใหม่อีกครั้ง ถ้ายังไม่หายให้ตรวจ Log ใน Apps Script (View > Executions) |
| Sign in with Google ขึ้น `origin_mismatch` | ยังไม่ได้เพิ่มโดเมนจริงใน Authorized JavaScript origins | กลับไปทำส่วนที่ 4 ข้อ 4 เพิ่มโดเมนที่ใช้งานจริง (รวม localhost ตอนพัฒนา) |
| อัปโหลดสลิป/บริจาคแล้ว error "ที่นั่งไม่พอ" ตอนลงทะเบียน | ที่นั่งว่างในชีต `Seats` เหลือน้อยกว่าจำนวนที่กรอก | เพิ่มแถวที่นั่งใหม่ในชีต `Seats` ด้วยมือ (seat_number, zone, status=available, เว้นว่าง registration_id) |
| แก้ `Code.gs` แล้วเว็บยังทำงานแบบเดิม | ลืม deploy เวอร์ชันใหม่ | ทำตามส่วนที่ 3 หมายเหตุ "สำคัญ" ด้านล่างตาราง Deploy |
| `npm run dev` ขึ้น error หา live-server ไม่เจอ | ยังไม่ได้รัน `npm install` | รัน `npm install` ก่อน แล้วค่อย `npm run dev` |
| ปุ่ม "ผู้ดูแลระบบ" ในแดชบอร์ดไม่ขึ้น | login ด้วยบัญชี role = staff ไม่ใช่ superadmin | เฉพาะ superadmin เท่านั้นที่เห็นแท็บนี้ (ออกแบบไว้ตั้งใจ) |
