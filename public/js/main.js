/** ตรรกะหน้าแรก: ดึงข้อมูลงาน, ยอดบริจาค, นับถอยหลัง (นาฬิกาเรือนแก้ว) */

var EVENT_START = new Date('2026-07-25T17:00:00+07:00');

function clearSkeleton(el) {
  if (el) el.classList.remove('skeleton');
}

function updateCountdown() {
  var el = document.getElementById('countdownText');
  if (!el) return;
  var diffMs = EVENT_START.getTime() - Date.now();
  if (diffMs <= 0) {
    el.textContent = 'พิธีได้เริ่มขึ้นแล้ว';
    return;
  }
  var days = Math.floor(diffMs / 86400000);
  var hours = Math.floor((diffMs % 86400000) / 3600000);
  if (days > 0) {
    el.textContent = 'อีก ' + days.toLocaleString('th-TH') + ' วัน ' + hours + ' ชม. ถึงวันงาน';
  } else {
    var minutes = Math.floor((diffMs % 3600000) / 60000);
    el.textContent = 'อีก ' + hours + ' ชม. ' + minutes + ' นาที ถึงวันงาน';
  }
}
updateCountdown();
setInterval(updateCountdown, 60000);

async function loadHomepageData() {
  try {
    const info = await Api.get('getEventInfo');
    const metaDateEl = document.getElementById('metaDate');
    const metaVenueEl = document.getElementById('metaVenue');
    const eventSubtitleEl = document.getElementById('eventSubtitle');
    if (metaDateEl) { metaDateEl.textContent = info.eventDateText; clearSkeleton(metaDateEl); }
    if (metaVenueEl) { metaVenueEl.textContent = info.venue; clearSkeleton(metaVenueEl); }
    if (eventSubtitleEl) eventSubtitleEl.textContent = info.eventName;
    const seatsLeftEl = document.getElementById('seatsLeftText');
    if (seatsLeftEl) {
      seatsLeftEl.textContent = info.seatsLeft > 0
        ? 'เหลือที่นั่งว่างอีก ' + info.seatsLeft.toLocaleString('th-TH') + ' ที่ จากทั้งหมด ' + info.totalSeats.toLocaleString('th-TH') + ' ที่'
        : 'ที่นั่งเต็มแล้ว กรุณาติดต่อผู้ประสานงาน';
    }
  } catch (e) {
    console.warn('โหลดข้อมูลงานไม่สำเร็จ (ตรวจสอบว่าตั้งค่า API_URL ใน config.js แล้วหรือยัง):', e.message);
    ['metaDate', 'metaVenue'].forEach(function (id) { clearSkeleton(document.getElementById(id)); });
  }

  try {
    const summary = await Api.get('getDonationSummary');
    const totalEl = document.getElementById('donationTotal');
    const countEl = document.getElementById('donationCount');
    if (totalEl) { totalEl.textContent = '฿ ' + Number(summary.totalAmount).toLocaleString('th-TH'); clearSkeleton(totalEl); }
    if (countEl) { countEl.textContent = summary.donorCount.toLocaleString('th-TH') + ' ท่าน'; clearSkeleton(countEl); }
  } catch (e) {
    console.warn('โหลดยอดบริจาคไม่สำเร็จ:', e.message);
    ['donationTotal', 'donationCount'].forEach(function (id) { clearSkeleton(document.getElementById(id)); });
  }
}

loadHomepageData();