/**
 * AutoCut Studio AI — PWA 1-Tap Installer (Android, Desktop Chrome/Edge & iOS Safari)
 */
(function () {
  'use strict';

  // 1. Tạo icon PNG 180x180 cho iPhone/iPad (Safari không nhận SVG làm icon màn hình chính)
  function injectAppleTouchIcon() {
    try {
      const c = document.createElement('canvas');
      c.width = 180;
      c.height = 180;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 180, 180);
      g.addColorStop(0, '#f59e0b');
      g.addColorStop(0.5, '#7c3aed');
      g.addColorStop(1, '#0ea5e9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 180, 180);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(72, 54);
      ctx.lineTo(72, 126);
      ctx.lineTo(128, 90);
      ctx.closePath();
      ctx.fill();

      let link = document.querySelector('link[rel="apple-touch-icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        document.head.appendChild(link);
      }
      link.href = c.toDataURL('image/png');
    } catch (_) {}
  }

  // 2. Đăng ký Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  // Nếu khách đang mở từ App đã cài rồi thì không hiện nút cài nữa
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return;

  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  function showIOSGuideModal() {
    if (document.getElementById('ac-ios-pwa-modal')) return;
    const bg = document.createElement('div');
    bg.id = 'ac-ios-pwa-modal';
    bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,18,0.82);backdrop-filter:blur(5px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif;';
    bg.innerHTML = `
      <div style="background:#101726;border:1px solid #2b3856;border-radius:16px;max-width:360px;width:100%;padding:20px;color:#f1f5f9;box-shadow:0 20px 50px rgba(0,0,0,0.65);">
        <div style="font-size:16px;font-weight:800;color:#fbbf24;margin-bottom:8px;">📲 Cài App AutoCut lên iPhone</div>
        <div style="font-size:13px;color:#cbd5e1;line-height:1.6;">
          1. Bấm biểu tượng <b>Chia sẻ (ô vuông có mũi tên lên)</b> ở thanh dưới cùng Safari.<br/>
          2. Kéo xuống chọn <b>Thêm vào MH chính (Add to Home Screen)</b>.<br/>
          3. Bấm <b>Thêm (Add)</b> ở góc phải trên cùng là xong!
        </div>
        <button id="ac-ios-pwa-close" style="margin-top:14px;width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;font-size:13px;cursor:pointer;">Đã hiểu</button>
      </div>
    `;
    document.body.appendChild(bg);
    bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
    document.getElementById('ac-ios-pwa-close').onclick = () => bg.remove();
  }

  function mountInstallButton(onClickHandler) {
    if (document.getElementById('ac-pwa-install-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ac-pwa-install-btn';
    btn.textContent = '📲 Cài App AutoCut';
    btn.style.cssText = [
      'position:fixed; right:16px; bottom:64px; z-index:9994;',
      'background:linear-gradient(135deg,#10b981,#059669); color:#fff;',
      'border:1px solid rgba(255,255,255,0.22); border-radius:999px;',
      'padding:9px 15px; font-size:12px; font-weight:700; cursor:pointer;',
      'box-shadow:0 8px 22px rgba(16,185,129,0.45); font-family:system-ui,sans-serif;'
    ].join('');
    btn.onclick = onClickHandler;
    document.body.appendChild(btn);
  }

  // Android / Chrome / Edge máy tính: Bấm 1 chạm bật hộp thoại cài App thật
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    mountInstallButton(async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        const b = document.getElementById('ac-pwa-install-btn');
        if (b) b.remove();
      }
      deferredPrompt = null;
    });
  });

  window.addEventListener('appinstalled', () => {
    const b = document.getElementById('ac-pwa-install-btn');
    if (b) b.remove();
  });

  function init() {
    injectAppleTouchIcon();
    if (isIOS) {
      mountInstallButton(showIOSGuideModal);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
