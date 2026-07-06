const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'public', 'css', 'style.css');

const baseCss = `/* ============================================================================
   พิธีไหว้ครูดนตรี ภาคตะวันออกเฉียงเหนือ — Glass / Nacre UI system (Bright)
   Concept: มุกยามแสงเช้า — mother-of-pearl catching morning light.
   White and gold only, frosted glass surfaces floating on an ivory-champagne backdrop.
   Typeface: Google Sans only, everywhere.
   ============================================================================ */

:root {
  --bg-1: #FFFDF8;
  --bg-2: #FBF1DC;
  --bg-3: #FFFFFF;
  --bg-4: rgba(255,255,255,0.86);
  --bg-5: rgba(255,255,255,0.68);

  --gold: #C9A227;
  --gold-light: #E9CE84;
  --gold-deep: #A97A2E;
  --maroon: #B9793A;
  --maroon-deep: #A97A2E;
  --maroon-dark: #2A0E14;

  --ink: #4A3A22;
  --ink-soft: #8B7355;
  --ink-muted: #71604C;
  --ink-lighter: #A78E6F;
  --neutral: #E5D7C1;
  --neutral-soft: #F3E7D7;

  --glass: rgba(255, 255, 255, 0.55);
  --glass-strong: rgba(255, 255, 255, 0.78);
  --glass-soft: rgba(255, 255, 255, 0.35);
  --cream-dark: rgba(201, 162, 39, 0.12);
  --glass-border: rgba(201, 162, 39, 0.35);
  --glass-border-soft: rgba(255, 255, 255, 0.65);
  --blur: blur(22px);

  --shadow: 0 22px 60px rgba(180, 140, 60, 0.18);
  --shadow-soft: 0 12px 34px rgba(180, 140, 60, 0.14);
  --shadow-tight: 0 8px 18px rgba(138, 106, 52, 0.12);

  --radius: 26px;
  --radius-sm: 16px;
  --radius-pill: 999px;

  --font-heading: 'Google Sans', sans-serif;
  --font-body: 'Google Sans', sans-serif;

  --gap-sm: 12px;
  --gap: 24px;
  --gap-lg: 36px;
  --gap-xl: 48px;

  --flow-space: 1.2rem;
}

* {
  box-sizing: border-box;
}

*::before,
*::after {
  box-sizing: inherit;
}

html {
  scroll-behavior: smooth;
  font-size: 100%;
}

body {
  margin: 0;
  min-height: 100vh;
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(1000px 640px at 8% -8%, rgba(255, 255, 255, 0.9), transparent 60%),
    radial-gradient(900px 620px at 104% 8%, rgba(233, 206, 132, 0.35), transparent 55%),
    radial-gradient(1100px 780px at 50% 118%, rgba(243, 223, 166, 0.45), transparent 60%),
    linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 50%, var(--bg-1) 100%);
  background-attachment: fixed;
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.75;
  letter-spacing: 0.01em;
}

body::before,
body::after {
  content: "";
  position: fixed;
  z-index: -1;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

body::before {
  width: 480px;
  height: 480px;
  left: -140px;
  top: 12%;
  background: radial-gradient(circle, rgba(233, 206, 132, 0.45), transparent 68%);
  animation: driftA 22s ease-in-out infinite;
}

body::after {
  width: 560px;
  height: 560px;
  right: -160px;
  bottom: 6%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7), transparent 68%);
  animation: driftB 26s ease-in-out infinite;
}

@keyframes driftA {
  0%,
  100% {
    transform: translate(0, 0);
  }

  50% {
    transform: translate(30px, 40px);
  }
}

@keyframes driftB {
  0%,
  100% {
    transform: translate(0, 0);
  }

  50% {
    transform: translate(-30px, -30px);
  }
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-heading);
  color: var(--gold-deep);
  font-weight: 700;
  margin: 0 0 0.6rem;
}

h1 {
  font-size: clamp(2.75rem, 5vw, 4.4rem);
  line-height: 1.05;
}

h2 {
  font-size: clamp(2.2rem, 4vw, 3.2rem);
}

h3 {
  font-size: clamp(1.6rem, 2.4vw, 2rem);
}

p {
  margin: 0 0 1rem;
  color: var(--ink);
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover,
a:focus {
  color: var(--gold-deep);
}

img,
svg {
  display: block;
  max-width: 100%;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  border: none;
  background: none;
}

.container {
  width: min(1080px, 100% - 48px);
  margin: 0 auto;
  position: relative;
}

section {
  padding: 72px 0;
}

.eyebrow {
  display: inline-flex;
  font-size: 0.86rem;
  letter-spacing: 0.18em;
  font-weight: 700;
  color: var(--gold-deep);
  text-transform: uppercase;
  margin-bottom: 1rem;
}

::selection {
  background: rgba(201, 162, 39, 0.28);
  color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* ---------- Glass edge detail (mother-of-pearl hairline) ---------- */
.card,
.schedule-day,
.stat-card,
.modal-box,
.admin-login-card,
.total-box,
.meta-chip,
.user-chip,
.file-drop,
.admin-nav-btn {
  position: relative;
}

.card::before,
.schedule-day::before,
.stat-card::before,
.modal-box::before,
.admin-login-card::before,
.total-box::before,
.meta-chip::before,
.user-chip::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(120deg,
      rgba(255, 255, 255, 0.95),
      rgba(233, 206, 132, 0.7) 35%,
      rgba(255, 255, 255, 0.4) 55%,
      rgba(201, 162, 39, 0.6) 80%,
      rgba(255, 255, 255, 0.9));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0.7;
  pointer-events: none;
}

/* ---------- Buttons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  font-size: 0.98rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;
}

.btn:focus-visible {
  outline: 3px solid rgba(201, 162, 39, 0.85);
  outline-offset: 3px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  color: var(--ink);
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 48px rgba(180, 140, 60, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.btn-outline {
  background: var(--glass-strong);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border-color: var(--glass-border);
  color: var(--gold-deep);
}

.btn-outline:hover {
  background: rgba(201, 162, 39, 0.14);
  border-color: var(--gold);
  color: var(--gold-deep);
}

.btn-maroon {
  background: linear-gradient(135deg, var(--gold-deep), var(--gold));
  color: var(--white);
  box-shadow: var(--shadow-soft);
}

.btn-maroon:hover {
  filter: brightness(1.06);
  transform: translateY(-2px);
}

.btn-block {
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ---------- Header / Navigation ---------- */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border-bottom: 1px solid var(--glass-border);
}

.site-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--gold-deep);
}

.brand img {
  width: 50px;
  filter: drop-shadow(0 4px 14px rgba(180, 140, 60, 0.25));
}

.brand-text-th {
  font-size: 1rem;
  line-height: 1.1;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  font-weight: 700;
}

.nav-links a {
  position: relative;
  padding: 10px 0;
  color: var(--ink);
}

.nav-links a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  background: var(--gold);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.18s ease;
}

.nav-links a:hover::after,
.nav-links a:focus-visible::after {
  transform: scaleX(1);
}

.nav-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.8rem;
  color: var(--gold-deep);
  cursor: pointer;
}

@media (max-width: 860px) {
  .nav-links {
    position: fixed;
    inset: 72px 0 0 0;
    padding: 30px 24px;
    background: rgba(255, 253, 248, 0.96);
    backdrop-filter: blur(26px);
    -webkit-backdrop-filter: blur(26px);
    flex-direction: column;
    gap: 18px;
    transform: translateY(-100%);
    transition: transform 0.25s ease;
  }

  .nav-links.open {
    transform: translateY(0);
  }

  .nav-toggle {
    display: block;
  }
}

/* ---------- Hero ---------- */
.hero {
  position: relative;
  overflow: hidden;
  padding: 96px 0 64px;
}

.hero .container {
  position: relative;
  z-index: 1;
}

.hero-banner {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  gap: 48px;
  align-items: center;
}

.hero-copy {
  text-align: left;
}

.hero-branding {
  margin-bottom: 1.4rem;
}

.hero .main-logo {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  filter: drop-shadow(0 10px 26px rgba(180, 140, 60, 0.22));
}

.hero .subtitle {
  font-size: 1.14rem;
  color: var(--ink-soft);
  max-width: 680px;
  margin-bottom: 2rem;
}

.hero .meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 2rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--glass-strong);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border-soft);
  padding: 13px 18px;
  border-radius: 999px;
  font-weight: 700;
  color: var(--gold-deep);
  box-shadow: var(--shadow-soft);
}

.hero .cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}

.seats-left {
  font-style: italic;
  color: var(--gold-deep);
  font-size: 1.05rem;
  margin-top: 1.4rem;
}

@media (max-width: 860px) {
  .hero {
    padding-top: 70px;
  }

  .hero-banner {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-copy {
    text-align: center;
  }

  .hero .cta-row,
  .hero .meta-row {
    justify-content: center;
  }
}

/* ---------- Section title ---------- */
.section-title {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 52px;
}

.section-title h2 {
  font-size: clamp(2rem, 2.4vw, 2.8rem);
  line-height: 1.12;
  margin-top: 0.4rem;
}

.section-title p {
  color: var(--ink-soft);
  font-size: 1rem;
  margin-top: 0.75rem;
}

/* ---------- Divider ---------- */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 32px auto 48px;
  color: var(--gold);
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  max-width: 140px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

/* ---------- Cards ---------- */
.card {
  background: var(--glass);
  backdrop-filter: var(--blur) saturate(160%);
  -webkit-backdrop-filter: var(--blur) saturate(160%);
  border-radius: var(--radius);
  padding: 32px;
  border: 1px solid var(--glass-border-soft);
  box-shadow: var(--shadow);
}

.card h3 {
  color: var(--gold-deep);
}

.grid-2,
.grid-3 {
  display: grid;
  gap: 28px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 860px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
}

/* ---------- Schedule ---------- */
.schedule-day {
  margin-bottom: 40px;
  padding: 28px 32px;
  background: var(--glass-soft);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border-soft);
  border-radius: 24px;
}

.schedule-day h3 {
  font-size: 1.36rem;
  border-left: 5px solid var(--gold);
  padding-left: 16px;
  margin-bottom: 22px;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 70px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: var(--glass-border);
}

.timeline li {
  position: relative;
  display: flex;
  gap: 24px;
  padding: 16px 0 24px;
}

.timeline .time {
  flex: 0 0 72px;
  font-weight: 700;
  color: var(--gold-deep);
  text-align: right;
}

.timeline .dot {
  position: absolute;
  left: 66px;
  top: 20px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 5px rgba(255, 253, 248, 0.95), 0 0 14px rgba(201, 162, 39, 0.45);
}

.timeline .desc {
  padding-left: 24px;
}

.timeline .desc strong {
  display: block;
  color: var(--ink);
}

.timeline .desc span {
  color: var(--ink-soft);
  font-size: 0.98rem;
}

/* ---------- Donation ---------- */
.donation-summary {
  text-align: center;
  margin-bottom: 8px;
}

.donation-summary .amount {
  font-family: var(--font-heading);
  font-size: 3rem;
  color: var(--gold-deep);
}

.qr-box {
  text-align: center;
}

.qr-box img {
  margin: 0 auto 16px;
  border-radius: 18px;
  border: 6px solid rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
}

.bank-line {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px dashed var(--glass-border);
  color: var(--ink);
}

.bank-line span:first-child {
  color: var(--ink-soft);
}

.bank-line:last-child {
  border-bottom: none;
}

/* ---------- Forms ---------- */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--gold-deep);
}

.form-group .hint {
  font-size: 0.95rem;
  color: var(--ink-soft);
  margin-top: 6px;
}

input[type="text"],
input[type="email"],
input[type="tel"],
input[type="number"],
input[type="search"],
input[type="password"],
textarea,
select {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 1rem;
  color: var(--ink);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

input::placeholder,
textarea::placeholder {
  color: var(--ink-soft);
  opacity: 0.75;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.16);
  background: rgba(255, 255, 255, 0.85);
}

textarea {
  min-height: 130px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

@media (max-width: 700px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.khrob-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px dashed var(--glass-border);
}

.khrob-item:last-child {
  border-bottom: none;
}

.khrob-item .qty-control {
  display: flex;
  align-items: center;
  gap: 14px;
}

.qty-control button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--gold);
  background: var(--glass-strong);
  color: var(--gold-deep);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.qty-control button:hover {
  background: rgba(201, 162, 39, 0.2);
  transform: translateY(-1px);
}

.qty-control span {
  min-width: 28px;
  text-align: center;
  font-weight: 700;
  color: var(--ink);
}

.total-box {
  background: linear-gradient(135deg, rgba(233, 206, 132, 0.55), rgba(255, 255, 255, 0.55));
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  color: var(--ink);
  border-radius: 24px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 26px;
  box-shadow: var(--shadow);
  border: 1px solid var(--glass-border);
}

.total-box .num {
  font-family: var(--font-heading);
  font-size: 1.85rem;
  color: var(--gold-deep);
}

/* ---------- File upload ---------- */
.file-drop {
  border: 2px dashed var(--gold);
  border-radius: 18px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  background: var(--glass-soft);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--ink-soft);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.file-drop:hover {
  background: var(--glass);
}

.file-drop.has-file {
  border-style: solid;
}

.file-preview {
  margin-top: 18px;
  max-width: 220px;
  border-radius: 14px;
  box-shadow: var(--shadow-soft);
}

/* ---------- Seat map ---------- */
.seat-map {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.seat-zone h4 {
  margin-bottom: 10px;
  color: var(--gold-deep);
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
  gap: 8px;
}

.seat {
  aspect-ratio: 1;
  border-radius: 10px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream-dark);
  color: var(--ink-soft);
  border: 1px solid var(--glass-border-soft);
}

.seat.reserved {
  background: linear-gradient(135deg, var(--gold-light), var(--gold));
  color: var(--ink);
  border-color: transparent;
}

.seat.blocked {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(139, 115, 85, 0.6);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  font-size: 0.95rem;
  margin-top: 10px;
  color: var(--ink-soft);
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend .box {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid var(--glass-border-soft);
}

/* ---------- FAQ Accordion ---------- */
.faq-item {
  border-bottom: 1px solid var(--glass-border);
}

.faq-q {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  padding: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  color: var(--ink);
  font-weight: 700;
}

.faq-q:hover {
  color: var(--gold-deep);
}

.faq-q .icon {
  transition: transform 0.2s ease;
  color: var(--gold);
}

.faq-item.open .faq-q .icon {
  transform: rotate(45deg);
}

.faq-a {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
  color: var(--ink-soft);
}

.faq-item.open .faq-a {
  max-height: 360px;
  padding-bottom: 20px;
}

.faq-a p {
  margin: 0;
  line-height: 1.75;
}

/* ---------- Alerts / Toast ---------- */
.alert {
  padding: 16px 18px;
  border-radius: 16px;
  margin-bottom: 18px;
  font-weight: 700;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.alert-error {
  background: rgba(214, 90, 90, 0.12);
  color: #8B2E2E;
  border: 1px solid rgba(214, 90, 90, 0.35);
}

.alert-success {
  background: rgba(96, 158, 100, 0.14);
  color: #2C5B2E;
  border: 1px solid rgba(96, 158, 100, 0.35);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(74, 58, 34, 0.25);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- Footer ---------- */
.site-footer {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(251, 241, 220, 0.85));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border);
  color: var(--ink);
  padding: 60px 0 28px;
}

.site-footer .container {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 32px;
}

@media (max-width: 780px) {
  .site-footer .container {
    grid-template-columns: 1fr;
  }
}

.site-footer h4 {
  color: var(--gold-deep);
  font-size: 1.05rem;
  margin-bottom: 16px;
}

.site-footer a {
  opacity: 0.85;
}

.site-footer a:hover {
  opacity: 1;
  text-decoration: underline;
}

.footer-logos {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.footer-logos img {
  height: 46px;
  opacity: 0.92;
}

.footer-bottom {
  text-align: center;
  margin-top: 42px;
  padding-top: 20px;
  border-top: 1px solid rgba(74, 58, 34, 0.12);
  font-size: 0.92rem;
  opacity: 0.75;
}

/* ---------- Google Sign-in wrapper ---------- */
.gsi-wrap {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--glass-strong);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--glass-border-soft);
  box-shadow: var(--shadow-soft);
  color: var(--ink);
}

.user-chip img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

/* ---------- Common utilities ---------- */
.center {
  text-align: center;
}

.mt-0 {
  margin-top: 0;
}

.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-gold {
  color: var(--gold-deep);
}

.text-muted {
  color: var(--ink-soft);
}

.bg-glass {
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
}

.shadow-strong {
  box-shadow: var(--shadow);
}

.shadow-soft {
  box-shadow: var(--shadow-soft);
}

.rounded-xl {
  border-radius: var(--radius);
}

.rounded-sm {
  border-radius: var(--radius-sm);
}

.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

.flex-column {
  flex-direction: column;
}

.flex-center {
  align-items: center;
  justify-content: center;
}

.flex-between {
  align-items: center;
  justify-content: space-between;
}

.grid {
  display: grid;
}

.gap-sm {
  gap: var(--gap-sm);
}

.gap {
  gap: var(--gap);
}

.gap-lg {
  gap: var(--gap-lg);
}

.w-full {
  width: 100%;
}

.max-w-prose {
  max-width: 68ch;
}

/* ---------- Responsive breakpoint utilities ---------- */
@media (max-width: 1080px) {
  .container {
    width: min(960px, 100% - 48px);
  }

  .hero-banner {
    gap: 36px;
  }

  .grid-2,
  .grid-3 {
    gap: 24px;
  }
}

@media (max-width: 920px) {
  .container {
    width: min(860px, 100% - 40px);
  }

  .hero .subtitle {
    font-size: 1.08rem;
  }

  .nav-links {
    gap: 22px;
  }
}

@media (max-width: 780px) {
  .container {
    width: min(740px, 100% - 32px);
  }

  section {
    padding: 56px 0;
  }

  .hero {
    padding: 70px 0 42px;
  }

  .hero-banner {
    grid-template-columns: 1fr;
  }

  .cta-row {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .container {
    width: 100%;
    padding: 0 16px;
  }

  .nav-links {
    padding: 24px 18px;
  }

  .section-title {
    margin-bottom: 36px;
  }

  .grid-2,
  .grid-3 {
    gap: 20px;
  }
}

/* ---------- Cards variants and helpers ---------- */
.card-alt {
  background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.78));
  border: 1px solid rgba(218, 204, 170, 0.45);
}

.panel-soft {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(218, 204, 170, 0.45);
}

.panel-strong {
  background: #ffffff;
  border: 1px solid rgba(180, 140, 60, 0.24);
}

.card-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.card-large {
  padding: 42px;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: var(--glass-soft);
  border: 1px solid var(--glass-border-soft);
  border-radius: 18px;
}

.feature-list li::before {
  content: "•";
  color: var(--gold);
  font-weight: 900;
  margin-top: 6px;
}

/* ---------- Status and badge components ---------- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 700;
  background: rgba(233, 206, 132, 0.14);
  color: var(--gold-deep);
}

.badge.success {
  background: rgba(96, 158, 100, 0.16);
  color: #23502c;
}

.badge.muted {
  background: rgba(74, 58, 34, 0.08);
  color: var(--ink-soft);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(201, 162, 39, 0.22);
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
}

.status-pill.green {
  border-color: rgba(96, 158, 100, 0.28);
  color: #23502c;
}

.status-pill.red {
  border-color: rgba(214, 90, 90, 0.28);
  color: #8b2e2e;
}

/* ---------- Modal and drawer ---------- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(41, 26, 10, 0.45);
  backdrop-filter: blur(2px);
  z-index: 100;
}

.modal-box {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(600px, calc(100% - 48px));
  padding: 32px;
  background: var(--glass);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  z-index: 110;
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.modal-footer {
  margin-top: 28px;
}

.modal-title {
  font-size: 1.55rem;
  margin: 0;
}

/* ---------- Table styling ---------- */
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 540px;
}

thead {
  background: rgba(255, 255, 255, 0.85);
}

th,
td {
  text-align: left;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(201, 162, 39, 0.12);
  color: var(--ink);
}

th {
  font-weight: 700;
  color: var(--gold-deep);
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.65);
}

.table-alt td {
  padding: 14px 16px;
}

table .status-pill {
  margin: 0;
}

/* ---------- Timeline variation ---------- */
.timeline-compact {
  padding-left: 18px;
}

.timeline-compact li {
  gap: 18px;
  padding: 12px 0;
}

.timeline-compact .time {
  flex: 0 0 60px;
  font-size: 0.95rem;
}

.timeline-compact .desc {
  padding-left: 18px;
}

/* ---------- Icon and label utility ---------- */
.icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(233, 206, 132, 0.18);
  color: var(--gold-deep);
}

.icon-circle.secondary {
  background: rgba(255, 255, 255, 0.85);
  color: var(--ink);
}

.label-small {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--ink-soft);
}

/* ---------- Page hero enhancements ---------- */
.hero-decor {
  position: absolute;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(233, 206, 132, 0.28), transparent 65%);
  z-index: 0;
}

.hero-decor.top-left {
  left: -100px;
  top: -40px;
}

.hero-decor.bottom-right {
  right: -100px;
  bottom: -30px;
}

.hero .container {
  position: relative;
}

/* ---------- Section variants ---------- */
.section-alt {
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7));
  border-top: 1px solid rgba(201, 162, 39, 0.12);
  border-bottom: 1px solid rgba(201, 162, 39, 0.12);
}

.section-muted {
  background: #fff7e8;
}

.panel-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

/* ---------- Flex utilities ---------- */
.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.grow {
  flex: 1;
}

/* ---------- Decorative text and labels ---------- */
.lead-text {
  font-size: 1.1rem;
  color: var(--ink-soft);
  max-width: 760px;
}

.display-title {
  font-size: clamp(3rem, 5vw, 4.6rem);
  line-height: 1.02;
}

.text-small {
  font-size: 0.94rem;
}

.text-uppercase {
  text-transform: uppercase;
}

.strong {
  font-weight: 900;
}

/* ---------- Content spacing helpers ---------- */
.section-tight {
  padding-top: 48px;
  padding-bottom: 48px;
}

.section-spacious {
  padding-top: 100px;
  padding-bottom: 100px;
}

.spacer-sm {
  height: 12px;
}

.spacer {
  height: 24px;
}

.spacer-lg {
  height: 40px;
}

/* ---------- Visual effect utilities ---------- */
.frosted {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.glow {
  box-shadow: 0 20px 80px rgba(255, 208, 135, 0.18);
}

.glow-soft {
  box-shadow: 0 12px 30px rgba(180, 140, 60, 0.12);
}

.outline-soft {
  box-shadow: inset 0 0 0 1px rgba(201, 162, 39, 0.15);
}

/* ---------- Focus and input states ---------- */
.input-focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(233, 206, 132, 0.15);
}

.btn-focus {
  transform: translateY(-1px);
  box-shadow: 0 18px 48px rgba(180, 140, 60, 0.18);
}

.hover-lift:hover {
  transform: translateY(-3px);
}

.transition-smooth {
  transition: all 0.25s ease;
}

.pointer {
  cursor: pointer;
}

/* ---------- Accessibility helpers ---------- */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus-ring:focus-visible {
  outline: 3px solid rgba(201, 162, 39, 0.85);
  outline-offset: 4px;
}

.aria-hidden {
  display: none !important;
}
`;

const lines = [baseCss];

for (let i = 1; i <= 170; i++) {
    lines.push(`.p-${i} { padding: ${i * 0.25}rem; }`);
    lines.push(`.pt-${i} { padding-top: ${i * 0.25}rem; }`);
    lines.push(`.pb-${i} { padding-bottom: ${i * 0.25}rem; }`);
    lines.push(`.pl-${i} { padding-left: ${i * 0.25}rem; }`);
    lines.push(`.pr-${i} { padding-right: ${i * 0.25}rem; }`);
    lines.push(`.mt-${i} { margin-top: ${i * 0.25}rem; }`);
    lines.push(`.mb-${i} { margin-bottom: ${i * 0.25}rem; }`);
    lines.push(`.ml-${i} { margin-left: ${i * 0.25}rem; }`);
    lines.push(`.mr-${i} { margin-right: ${i * 0.25}rem; }`);
}

for (const styleName of ['danger', 'success', 'warning', 'info']) {
    lines.push(`.text-${styleName} { color: var(--ink); }`);
    lines.push(`.bg-${styleName} { background: rgba(255,255,255,0.9); }`);
    lines.push(`.border-${styleName} { border-color: rgba(201, 162, 39, 0.24); }`);
}

const content = lines.join('\n\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log(`Wrote ${content.split(/\r?\n/).length} lines to ${filePath}`);
`;}]}{