/**
 * js/ui.js — ตัวช่วย UI ที่ใช้ร่วมกันทุกหน้า
 * ซ่อนหน้าจอ loading, เปิด/ปิดเมนูมือถือ, FAQ accordion, scroll-reveal, sticky header
 *
 * เปิดให้หน้าอื่นเรียกซ่อน loader ได้ทันทีที่ข้อมูลพร้อม ผ่าน window.KKU_UI.hideLoader()
 * (ไม่ต้องรอ window.load ซึ่งรอรูปภาพ/ฟอนต์ทั้งหมดโหลดเสร็จ — ทำให้หน้าเว็บดูเร็วขึ้นมาก)
 */
(function () {
  var MIN_VISIBLE_MS = 400;
  var startedAt = Date.now();
  var hidden = false;

  function hideLoader() {
    if (hidden) return;
    hidden = true;
    var loader = document.getElementById('pageLoader');
    var elapsed = Date.now() - startedAt;
    var wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    setTimeout(function () {
      document.body.classList.remove('is-loading');
      if (loader) {
        loader.classList.add('is-hidden');
        setTimeout(function () { loader.remove(); }, 500);
      }
    }, wait);
  }

  window.KKU_UI = { hideLoader: hideLoader };

  // Safety net: hide loader once the whole page has loaded, or after 4s no matter what
  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 4000);

  document.addEventListener('DOMContentLoaded', function () {
    // ---------- Mobile nav toggle ----------
    var navToggle = document.getElementById('navToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', function () {
        mobileMenu.classList.toggle('active');
      });
      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { mobileMenu.classList.remove('active'); });
      });
    }

    // ---------- FAQ accordion ----------
    document.querySelectorAll('.kku-accordion-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.kku-accordion');
        if (!item) return;
        var wasActive = item.classList.contains('active');
        document.querySelectorAll('.kku-accordion').forEach(function (a) { a.classList.remove('active'); });
        if (!wasActive) item.classList.add('active');
      });
    });

    // ---------- Scroll reveal ----------
    var revealTargets = document.querySelectorAll('.fade-in-up, .reveal');
    if (revealTargets.length) {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        revealTargets.forEach(function (el) { observer.observe(el); });
      } else {
        revealTargets.forEach(function (el) { el.classList.add('visible'); });
      }
    }

    // ---------- Sticky header ----------
    var header = document.getElementById('mainHeader');
    if (header) {
      var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 10); };
      window.addEventListener('scroll', onScroll);
      onScroll();
    }
  });
})();