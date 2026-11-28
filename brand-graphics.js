/**
 * AutoCut Studio AI — Add-on #3: Multi-Brand Kit, Price Tag, Spec Card & Before/After Split-Screen
 * Plugin cắm rời độc lập: Không sửa auth.js, crm.html, editor-ai-core.js, worker.js, playbooks.js hay policy-guard.js.
 * Đồng bộ nhánh riêng: autocut_saas/studio_addons/v7_brand_graphics
 */
(function () {
  'use strict';

  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v7_brand_graphics';
  const LOCAL_KEY = 'autocut_v7_brand_graphics_state';

  const SPEC_PRESETS = {
    jewelry: {
      title: 'THÔNG TIN SẢN PHẨM',
      line1: 'Chất liệu: Bạc S925 xi bạch kim',
      line2: 'Bề mặt: Sáng trắng nguyên bản, bền màu',
      line3: 'Bảo hành: Làm sáng miễn phí trọn đời'
    },
    realestate: {
      title: 'THÔNG SỐ BẤT ĐỘNG SẢN',
      line1: 'Diện tích: 85m² • 2PN • Ban công thoáng',
      line2: 'Pháp lý: Sổ hồng riêng, sang tên ngay',
      line3: 'Vị trí: Trung tâm kết nối 5 phút'
    },
    auto: {
      title: 'THÔNG SỐ XE NỔI BẬT',
      line1: 'Đời xe: 2024 • ODO chuẩn 12.000 km',
      line2: 'Động cơ: Vận hành êm, tiết kiệm nhiên liệu',
      line3: 'Cam kết: Không đâm đụng, bao check hãng'
    },
    tech: {
      title: 'ĐIỂM NỔI BẬT SẢN PHẨM',
      line1: 'Công suất: Mạnh mẽ, tiết kiệm điện năng',
      line2: 'Thiết kế: Nhỏ gọn, hoàn thiện cao cấp',
      line3: 'Bảo hành: 1 đổi 1 trong 12 tháng'
    }
  };

  function defaultState() {
    return {
      activeBrandId: 'brand_default',
      brands: [
        {
          id: 'brand_default',
          name: 'Thương Hiệu Chính',
          accent: '#f59e0b',
          hotline: '',
          logoDataUrl: '',
          logoPos: 'top_right',
          logoSize: 16
        }
      ],
      priceTag: {
        enabled: false,
        badge: 'ƯU ĐÃI HÔM NAY',
        oldPrice: '850.000đ',
        newPrice: '590.000đ',
        discount: '-30%',
        pos: 'top_left'
      },
      specCard: {
        enabled: false,
        title: 'THÔNG TIN SẢN PHẨM',
        line1: 'Chất liệu: Bạc S925 xi bạch kim',
        line2: 'Hoàn thiện: Sắc nét, bền sáng',
        line3: 'Bảo hành: Hỗ trợ làm sáng miễn phí',
        pos: 'mid_left'
      },
      splitScreen: {
        mode: 'off', // off | top_bottom | left_right | wipe_slider
        beforeLabel: 'TRƯỚC',
        afterLabel: 'SAU'
      },
      updatedAt: 0
    };
  }

  function loadLocalState() {
    try {
      const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (s && typeof s === 'object') {
        const def = defaultState();
        return {
          ...def,
          ...s,
          brands: Array.isArray(s.brands) && s.brands.length ? s.brands : def.brands,
          priceTag: { ...def.priceTag, ...(s.priceTag || {}) },
          specCard: { ...def.specCard, ...(s.specCard || {}) },
          splitScreen: { ...def.splitScreen, ...(s.splitScreen || {}) }
        };
      }
    } catch (_) {}
    return defaultState();
  }

  let state = loadLocalState();
  let logoImgCache = null;
  let logoImgCacheSrc = '';
  let compareVideoEl = null;
  let compareVideoUrl = null;
  let compareFileName = '';
  let syncTimer = null;

  // Biến theo dõi chu kỳ render của #ac-pro-preview-canvas
  let renderSessionStart = performance.now();
  let lastVideoFrameWall = 0;
  let videoDrawHitCount = 0;
  let origDrawImage = null;

  function getActiveBrand() {
    return state.brands.find((b) => b.id === state.activeBrandId) || state.brands[0];
  }

  function refreshLogoImageCache() {
    const b = getActiveBrand();
    const src = (b && b.logoDataUrl) || '';
    if (!src) {
      logoImgCache = null;
      logoImgCacheSrc = '';
      return;
    }
    if (src === logoImgCacheSrc && logoImgCache) return;
    logoImgCacheSrc = src;
    const img = new Image();
    img.onload = () => {
      logoImgCache = img;
      renderMiniPreview();
    };
    img.src = src;
  }

  function saveState(syncCloud = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    refreshLogoImageCache();
    renderMiniPreview();
    updateQuickBarInTab1();

    if (syncCloud) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        }).catch(() => {});
      }, 650);
    }
  }

  async function pullStateFromCloud() {
    try {
      const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`);
      if (!res.ok) return;
      const remote = await res.json();
      if (remote && Number(remote.updatedAt || 0) > Number(state.updatedAt || 0)) {
        const def = defaultState();
        state = {
          ...def,
          ...remote,
          brands: Array.isArray(remote.brands) && remote.brands.length ? remote.brands : def.brands,
          priceTag: { ...def.priceTag, ...(remote.priceTag || {}) },
          specCard: { ...def.specCard, ...(remote.specCard || {}) },
          splitScreen: { ...def.splitScreen, ...(remote.splitScreen || {}) }
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
        refreshLogoImageCache();
        syncUIWithState();
      }
    } catch (_) {}
  }

  // ================= 1. HÀM VẼ ĐỒ HỌA CHUYÊN NGÀNH TRÊN CANVAS =================
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
    else {
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
  }

  function easeOutExpo(t) {
    const x = Math.min(1, Math.max(0, t));
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function drawCoverVideo(ctx, vid, rx, ry, rw, rh) {
    if (!vid || !origDrawImage) return;
    const vw = vid.videoWidth || 720;
    const vh = vid.videoHeight || 1280;
    const sc = Math.max(rw / vw, rh / vh);
    const dw = vw * sc;
    const dh = vh * sc;
    const dx = rx + (rw - dw) / 2;
    const dy = ry + (rh - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    origDrawImage.call(ctx, vid, dx, dy, dw, dh);
    ctx.restore();
  }

  function drawSplitBadge(ctx, text, x, y, bg, w) {
    if (!text) return;
    ctx.save();
    ctx.filter = 'none';
    const fs = Math.round(w * 0.032);
    ctx.font = `800 ${fs}px system-ui, sans-serif`;
    const tw = ctx.measureText(text).width + 26;
    const th = fs + 16;
    ctx.fillStyle = bg;
    roundRectPath(ctx, x, y, tw, th, 999);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + tw / 2, y + th / 2 + 1);
    ctx.restore();
  }

  function drawSplitScreenFrame(ctx, mainVideo, w, h, elapsedSec) {
    const mode = state.splitScreen.mode;
    const bLbl = (state.splitScreen.beforeLabel || 'TRƯỚC').trim();
    const aLbl = (state.splitScreen.afterLabel || 'SAU').trim();
    const accent = (getActiveBrand() && getActiveBrand().accent) || '#f59e0b';

    if (mode === 'top_bottom') {
      const halfH = Math.round(h / 2);
      drawCoverVideo(ctx, compareVideoEl, 0, 0, w, halfH);
      drawCoverVideo(ctx, mainVideo, 0, halfH, w, h - halfH);
      ctx.save();
      ctx.filter = 'none';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, halfH - 2, w, 4);
      ctx.restore();
      drawSplitBadge(ctx, bLbl, 20, 22, 'rgba(15,23,42,0.86)', w);
      drawSplitBadge(ctx, aLbl, 20, halfH + 18, accent, w);
    } else if (mode === 'left_right') {
      const halfW = Math.round(w / 2);
      drawCoverVideo(ctx, compareVideoEl, 0, 0, halfW, h);
      drawCoverVideo(ctx, mainVideo, halfW, 0, w - halfW, h);
      ctx.save();
      ctx.filter = 'none';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(halfW - 2, 0, 4, h);
      ctx.restore();
      drawSplitBadge(ctx, bLbl, 18, Math.round(h * 0.08), 'rgba(15,23,42,0.86)', w);
      drawSplitBadge(ctx, aLbl, halfW + 18, Math.round(h * 0.08), accent, w);
    } else if (mode === 'wipe_slider') {
      const splitX = Math.round(w * (0.2 + 0.6 * (0.5 + 0.5 * Math.sin(elapsedSec * 1.45))));
      drawCoverVideo(ctx, compareVideoEl, 0, 0, splitX, h);
      drawCoverVideo(ctx, mainVideo, splitX, 0, w - splitX, h);
      ctx.save();
      ctx.filter = 'none';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(splitX - 2, 0, 4, h);
      ctx.beginPath();
      ctx.arc(splitX, h / 2, Math.round(w * 0.032), 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(w * 0.026)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⇄', splitX, h / 2 + 1);
      ctx.restore();
      drawSplitBadge(ctx, bLbl, 18, Math.round(h * 0.08), 'rgba(15,23,42,0.86)', w);
      drawSplitBadge(ctx, aLbl, Math.max(splitX + 12, w - Math.round(w * 0.25)), Math.round(h * 0.08), accent, w);
    }
  }

  function drawBrandGraphicsOverlay(canvas, elapsedSec) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width || 720;
    const h = canvas.height || 1280;
    const brand = getActiveBrand();
    const accent = (brand && brand.accent) || '#f59e0b';

    ctx.save();
    ctx.filter = 'none';

    // 1. LOGO PNG THƯƠNG HIỆU
    if (logoImgCache && brand && brand.logoDataUrl) {
      const pct = Math.min(28, Math.max(8, Number(brand.logoSize) || 16)) / 100;
      const targetW = Math.round(w * pct);
      const ratio = (logoImgCache.naturalHeight || 1) / (logoImgCache.naturalWidth || 1);
      const targetH = Math.round(targetW * ratio);
      const pad = Math.round(w * 0.035);
      let lx = w - targetW - pad;
      let ly = pad;
      if (brand.logoPos === 'top_left') { lx = pad; ly = pad; }
      else if (brand.logoPos === 'bottom_left') { lx = pad; ly = h - targetH - Math.round(h * 0.07); }
      else if (brand.logoPos === 'bottom_right') { lx = w - targetW - pad; ly = h - targetH - Math.round(h * 0.07); }

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 10;
      if (origDrawImage) origDrawImage.call(ctx, logoImgCache, lx, ly, targetW, targetH);
      else ctx.drawImage(logoImgCache, lx, ly, targetW, targetH);
      ctx.restore();
    }

    // 2. THANH HOTLINE / ZALO THƯƠNG HIỆU CỐ ĐỊNH
    const hotline = brand && (brand.hotline || '').trim();
    if (hotline) {
      ctx.save();
      const fs = Math.round(w * 0.030);
      ctx.font = `700 ${fs}px system-ui, sans-serif`;
      const txt = `📞 ${hotline}`;
      const tw = Math.min(w * 0.86, ctx.measureText(txt).width + 32);
      const th = fs + 18;
      const hx = (w - tw) / 2;
      const hy = Math.round(h * 0.925);
      ctx.fillStyle = 'rgba(9, 13, 25, 0.82)';
      roundRectPath(ctx, hx, hy, tw, th, 999);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = accent;
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, w / 2, hy + th / 2 + 1);
      ctx.restore();
    }

    // 3. THẺ GIÁ ĐỘNG (PRICE TAG: GIÁ GỐC GẠCH NGANG -> GIÁ SALE)
    const pt = state.priceTag;
    if (pt && pt.enabled && (pt.newPrice || pt.oldPrice)) {
      const enter = easeOutExpo(Math.min(1, elapsedSec / 0.55));
      ctx.save();
      ctx.globalAlpha = enter;
      const cardW = Math.round(w * 0.44);
      const cardH = Math.round(w * 0.21);
      const pad = Math.round(w * 0.035);
      let px = pad;
      let py = Math.round(h * 0.11);
      if (pt.pos === 'top_right') { px = w - cardW - pad; py = Math.round(h * 0.11); }
      else if (pt.pos === 'mid_left') { px = pad; py = Math.round(h * 0.34); }
      px += (pt.pos === 'top_right' ? 1 : -1) * (1 - enter) * 90;

      const grad = ctx.createLinearGradient(px, py, px + cardW, py + cardH);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
      grad.addColorStop(1, 'rgba(30, 27, 75, 0.90)');
      ctx.fillStyle = grad;
      roundRectPath(ctx, px, py, cardW, cardH, 16);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = accent;
      ctx.stroke();

      // Badge nhỏ phía trên
      if (pt.badge) {
        const bf = Math.round(w * 0.024);
        ctx.font = `800 ${bf}px system-ui, sans-serif`;
        ctx.fillStyle = accent;
        ctx.textAlign = 'left';
        ctx.fillText(pt.badge.toUpperCase().slice(0, 22), px + 16, py + Math.round(cardH * 0.24));
      }

      // Tem giảm giá góc phải
      if (pt.discount) {
        const df = Math.round(w * 0.028);
        ctx.font = `900 ${df}px system-ui, sans-serif`;
        const dw = ctx.measureText(pt.discount).width + 18;
        const dh = df + 12;
        ctx.fillStyle = '#ef4444';
        roundRectPath(ctx, px + cardW - dw - 10, py + 10, dw, dh, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.discount, px + cardW - dw / 2 - 10, py + 10 + dh / 2 + 1);
      }

      // Giá gốc gạch ngang
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      if (pt.oldPrice) {
        const of = Math.round(w * 0.032);
        ctx.font = `600 ${of}px system-ui, sans-serif`;
        ctx.fillStyle = '#94a3b8';
        const oy = py + Math.round(cardH * 0.54);
        ctx.fillText(pt.oldPrice, px + 16, oy);
        const ow = ctx.measureText(pt.oldPrice).width;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px + 14, oy - of * 0.34);
        ctx.lineTo(px + 18 + ow, oy - of * 0.34);
        ctx.stroke();
      }

      // Giá bán mới nổi bật
      if (pt.newPrice) {
        const nf = Math.round(w * 0.052);
        ctx.font = `900 ${nf}px system-ui, sans-serif`;
        ctx.fillStyle = '#fde047';
        ctx.fillText(pt.newPrice, px + 16, py + Math.round(cardH * 0.88));
      }
      ctx.restore();
    }

    // 4. BẢNG THÔNG SỐ CHUYÊN NGÀNH (SPEC CARD)
    const sc = state.specCard;
    if (sc && sc.enabled) {
      const lines = [sc.line1, sc.line2, sc.line3].map((x) => (x || '').trim()).filter(Boolean);
      if (lines.length || sc.title) {
        const enter = easeOutExpo(Math.min(1, elapsedSec / 0.7));
        ctx.save();
        ctx.globalAlpha = enter;
        const boxW = Math.round(w * 0.64);
        const lineH = Math.round(w * 0.044);
        const boxH = Math.round(w * 0.075) + lines.length * lineH + 18;
        const pad = Math.round(w * 0.035);
        let sx = pad - (1 - enter) * 110;
        let sy = Math.round(h * 0.48);
        if (sc.pos === 'top_left') sy = Math.round(h * 0.14);
        else if (sc.pos === 'bottom_left') sy = Math.round(h * 0.60);

        ctx.fillStyle = 'rgba(9, 14, 28, 0.85)';
        roundRectPath(ctx, sx, sy, boxW, boxH, 14);
        ctx.fill();
        ctx.fillStyle = accent;
        roundRectPath(ctx, sx, sy, 7, boxH, 4);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = accent;
        ctx.font = `800 ${Math.round(w * 0.032)}px system-ui, sans-serif`;
        ctx.fillText((sc.title || 'THÔNG SỐ').slice(0, 34), sx + 18, sy + Math.round(w * 0.052));

        ctx.fillStyle = '#f1f5f9';
        ctx.font = `600 ${Math.round(w * 0.028)}px system-ui, sans-serif`;
        lines.forEach((ln, idx) => {
          ctx.fillText(`• ${ln.slice(0, 40)}`, sx + 18, sy + Math.round(w * 0.095) + idx * lineH);
        });
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ================= 2. BẮT KHUNG HÌNH AN TOÀN VÀO CANVAS v6.0 (KHÔNG SỬA editor-ai-core.js) =================
  function installCanvasPipelineHook() {
    if (window.__acBrandCanvasHooked) return;
    window.__acBrandCanvasHooked = true;

    origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      try {
        if (this && this.canvas && this.canvas.id === 'ac-pro-preview-canvas' && args[0] instanceof HTMLVideoElement) {
          const now = performance.now();
          if (now - lastVideoFrameWall > 650) {
            renderSessionStart = now;
            if (compareVideoEl && state.splitScreen.mode !== 'off') {
              compareVideoEl.currentTime = 0;
              compareVideoEl.play().catch(() => {});
            }
          }
          lastVideoFrameWall = now;
          videoDrawHitCount += 1;

          // Chế độ Chia Đôi Màn Hình Before / After: vẽ cả 2 clip ngay tại bước vẽ video để phụ đề vẫn nằm trên cùng
          if (state.splitScreen.mode !== 'off' && compareVideoEl && compareVideoEl.readyState >= 2) {
            const elapsed = (now - renderSessionStart) / 1000;
            drawSplitScreenFrame(this, args[0], this.canvas.width, this.canvas.height, elapsed);
            return;
          }
        }
      } catch (_) {}
      return origDrawImage.apply(this, args);
    };

    const nativeRAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) {
      return nativeRAF(function (ts) {
        const beforeHits = videoDrawHitCount;
        cb(ts);
        if (videoDrawHitCount > beforeHits) {
          const previewCanvas = document.getElementById('ac-pro-preview-canvas');
          if (previewCanvas) {
            const elapsed = (performance.now() - renderSessionStart) / 1000;
            drawBrandGraphicsOverlay(previewCanvas, elapsed);
          }
        }
      });
    };

    // Khi bấm nút Xem Thử hoặc Xuất Video, đưa clip Before về đầu và chạy đồng bộ
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('#ac-btn-play-edl, #ac-btn-export-edl');
      if (btn) {
        renderSessionStart = performance.now();
        if (compareVideoEl && state.splitScreen.mode !== 'off') {
          compareVideoEl.currentTime = 0;
          compareVideoEl.play().catch(() => {});
        }
      }
    }, true);

    // Tự dừng clip Before khi quá trình phát thử/xuất đã kết thúc
    setInterval(() => {
      if (compareVideoEl && !compareVideoEl.paused && performance.now() - lastVideoFrameWall > 900) {
        compareVideoEl.pause();
      }
    }, 800);
  }

  // ================= 3. XEM TRƯỚC TRỰC TIẾP TRONG TAB BRAND =================
  function renderMiniPreview() {
    const c = document.getElementById('acbg-mini-preview');
    if (!c) return;
    c.width = 360;
    c.height = 640;
    const ctx = c.getContext('2d');

    // Nền giả lập khung hình video 9:16
    if (state.splitScreen.mode === 'top_bottom') {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 360, 320);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 320, 360, 320);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 319, 360, 2);
      drawSplitBadge(ctx, state.splitScreen.beforeLabel || 'TRƯỚC', 10, 12, 'rgba(15,23,42,0.88)', 360);
      drawSplitBadge(ctx, state.splitScreen.afterLabel || 'SAU', 10, 330, (getActiveBrand() || {}).accent || '#f59e0b', 360);
    } else if (state.splitScreen.mode === 'left_right' || state.splitScreen.mode === 'wipe_slider') {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 180, 640);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(180, 0, 180, 640);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(179, 0, 2, 640);
      drawSplitBadge(ctx, state.splitScreen.beforeLabel || 'TRƯỚC', 10, 48, 'rgba(15,23,42,0.88)', 360);
      drawSplitBadge(ctx, state.splitScreen.afterLabel || 'SAU', 190, 48, (getActiveBrand() || {}).accent || '#f59e0b', 360);
    } else {
      const g = ctx.createLinearGradient(0, 0, 360, 640);
      g.addColorStop(0, '#111827'); g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 360, 640);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vùng hiển thị Video 9:16', 180, 495);

    drawBrandGraphicsOverlay(c, 3.0);
  }

  // Nén Logo PNG về tối đa 220px để đồng bộ cực nhanh lên Firebase
  function compressLogoToPngDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 220;
          const sc = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
          const cw = Math.max(20, Math.round(img.width * sc));
          const ch = Math.max(20, Math.round(img.height * sc));
          const c = document.createElement('canvas');
          c.width = cw; c.height = ch;
          c.getContext('2d').drawImage(img, 0, 0, cw, ch);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('File ảnh logo không hợp lệ'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Không đọc được ảnh logo'));
      reader.readAsDataURL(file);
    });
  }

  // ================= 4. GIAO DIỆN TAB THỨ 5 & THANH TRẠNG THÁI NHANH =================
  function switchToBrandTab() {
    document.querySelectorAll('#ac-pro-drawer .acp-tab').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-t') === 'brand');
    });
    ['auto', 'audio', 'voice', 'critic'].forEach((k) => {
      const el = document.getElementById('ac-tab-' + k);
      if (el) el.style.display = 'none';
    });
    const pane = document.getElementById('ac-tab-brand');
    if (pane) pane.style.display = 'block';
    renderMiniPreview();
  }

  function updateQuickBarInTab1() {
    const bar = document.getElementById('acbg-quick-summary');
    if (!bar) return;
    const b = getActiveBrand();
    const activeTags = [];
    if (b && b.logoDataUrl) activeTags.push('🖼️ Logo');
    if (b && b.hotline) activeTags.push('📞 Hotline');
    if (state.priceTag.enabled) activeTags.push(`🏷️ Giá ${state.priceTag.newPrice}`);
    if (state.specCard.enabled) activeTags.push('📋 Thông số');
    if (state.splitScreen.mode !== 'off') activeTags.push('⚡ Before/After');
    bar.innerHTML = activeTags.length
      ? `<span style="color:#4ade80;">✓ Đang bật: ${activeTags.join(' • ')}</span>`
      : `<span style="color:#94a3b8;">Thương hiệu: <b>${(b && b.name) || 'Mặc định'}</b> • Bấm nút bên phải để bật Logo, Thẻ Giá hoặc Before/After.</span>`;
  }

  function syncUIWithState() {
    const b = getActiveBrand();
    const sel = document.getElementById('acbg-brand-select');
    if (sel) {
      sel.innerHTML = state.brands.map((br) => `<option value="${br.id}" ${br.id === b.id ? 'selected' : ''}>🏢 ${br.name}</option>`).join('');
    }
    const setV = (id, val) => { const e = document.getElementById(id); if (e) e.value = val ?? ''; };
    const setC = (id, val) => { const e = document.getElementById(id); if (e) e.checked = Boolean(val); };

    if (b) {
      setV('acbg-brand-name', b.name);
      setV('acbg-brand-accent', b.accent || '#f59e0b');
      setV('acbg-brand-hotline', b.hotline || '');
      setV('acbg-logo-pos', b.logoPos || 'top_right');
      setV('acbg-logo-size', b.logoSize || 16);
      const szLbl = document.getElementById('acbg-logo-size-lbl');
      if (szLbl) szLbl.textContent = (b.logoSize || 16) + '%';
      const logoSt = document.getElementById('acbg-logo-status');
      if (logoSt) logoSt.textContent = b.logoDataUrl ? '✓ Đã gắn Logo PNG (đồng bộ Cloud)' : 'Chưa tải Logo PNG';
    }

    setC('acbg-pt-en', state.priceTag.enabled);
    setV('acbg-pt-badge', state.priceTag.badge);
    setV('acbg-pt-old', state.priceTag.oldPrice);
    setV('acbg-pt-new', state.priceTag.newPrice);
    setV('acbg-pt-disc', state.priceTag.discount);
    setV('acbg-pt-pos', state.priceTag.pos);

    setC('acbg-sc-en', state.specCard.enabled);
    setV('acbg-sc-title', state.specCard.title);
    setV('acbg-sc-l1', state.specCard.line1);
    setV('acbg-sc-l2', state.specCard.line2);
    setV('acbg-sc-l3', state.specCard.line3);
    setV('acbg-sc-pos', state.specCard.pos);

    setV('acbg-split-mode', state.splitScreen.mode);
    setV('acbg-split-before', state.splitScreen.beforeLabel);
    setV('acbg-split-after', state.splitScreen.afterLabel);

    updateQuickBarInTab1();
    renderMiniPreview();
  }

  function mountBrandGraphicsUI() {
    const tabsBar = document.querySelector('#ac-pro-drawer .acp-tabs');
    const drawerBody = document.querySelector('#ac-pro-drawer .acp-body');
    const tabAuto = document.getElementById('ac-tab-auto');
    if (!tabsBar || !drawerBody || !tabAuto || document.getElementById('ac-tab-brand')) return false;

    // Thu gọn nhẹ chữ tab để 5 tab nằm gọn 1 hàng đẹp mắt
    const style = document.createElement('style');
    style.textContent = `
      #ac-pro-drawer .acp-tab { font-size: 10.5px !important; padding: 9px 2px !important; }
      .acbg-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px; }
    `;
    document.head.appendChild(style);

    // 1. Nút Tab thứ 5: Brand & Đồ Họa
    const tabBtn = document.createElement('button');
    tabBtn.className = 'acp-tab';
    tabBtn.setAttribute('data-t', 'brand');
    tabBtn.textContent = '🎨 Đồ Họa';
    tabsBar.appendChild(tabBtn);

    // Ẩn tab Brand khi bấm các tab gốc
    tabsBar.querySelectorAll('.acp-tab').forEach((btn) => {
      if (btn.getAttribute('data-t') !== 'brand') {
        btn.addEventListener('click', () => {
          const p = document.getElementById('ac-tab-brand');
          if (p) p.style.display = 'none';
        });
      }
    });
    tabBtn.onclick = switchToBrandTab;

    // 2. Thanh trạng thái gọn ở Tab 1 (ngay dưới Policy Guard)
    const quickCard = document.createElement('div');
    quickCard.id = 'acbg-quick-card';
    quickCard.style.cssText = 'background:#11192d; border:1px solid #92400e; border-radius:12px; padding:9px 11px; margin-bottom:11px; display:flex; align-items:center; justify-content:space-between; gap:8px;';
    quickCard.innerHTML = `
      <div style="font-size:11px; line-height:1.4;">
        <div style="font-weight:800; color:#fbbf24;">🎨 ĐỒ HỌA CHUYÊN NGÀNH & BRAND KIT <span style="color:#4ade80; font-size:10px;">(Add-on #3)</span></div>
        <div id="acbg-quick-summary" style="margin-top:2px;"></div>
      </div>
      <button type="button" class="acp-btn" id="acbg-open-tab" style="background:#b45309; font-size:11px; white-space:nowrap;">Mở Cài Đặt →</button>
    `;
    const pgCard = document.getElementById('acpg-card');
    if (pgCard && pgCard.nextSibling) tabAuto.insertBefore(quickCard, pgCard.nextSibling);
    else tabAuto.prepend(quickCard);
    document.getElementById('acbg-open-tab').onclick = switchToBrandTab;

    // 3. Nội dung đầy đủ của Tab Brand & Đồ Họa
    const pane = document.createElement('div');
    pane.id = 'ac-tab-brand';
    pane.style.display = 'none';
    pane.innerHTML = `
      <!-- XEM TRƯỚC TRỰC TIẾP -->
      <div class="acp-sec" style="display:flex; gap:10px; align-items:center; border-color:#92400e;">
        <canvas id="acbg-mini-preview" style="width:108px; height:192px; border-radius:8px; border:1px solid #334155; background:#000; flex-shrink:0;"></canvas>
        <div style="font-size:11.5px; color:#cbd5e1; line-height:1.5;">
          <b style="color:#fbbf24;">👁️ Xem Trước Bố Cục 9:16</b><br/>
          Mọi thay đổi Logo, Hotline, Thẻ Giá, Thông Số & Chia Đôi Màn Hình sẽ tự động xuất hiện khi bạn bấm <b>Xem Thử</b> và <b>Render & Xuất Video</b> ở Tab 1.<br/>
          <span style="color:#4ade80; font-size:10.5px;">☁️ Tự động đồng bộ Firebase Cloud</span>
        </div>
      </div>

      <!-- 1. MULTI-BRAND KIT -->
      <div class="acp-sec">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label class="acp-label" style="margin:0;">1. Bộ Nhận Diện Đa Thương Hiệu (Brand Kit)</label>
          <div style="display:flex; gap:4px;">
            <button type="button" class="acp-btn acp-btn-main" id="acbg-new-brand" style="padding:3px 8px; font-size:10.5px;">+ Thêm Hồ Sơ</button>
            <button type="button" class="acp-btn" id="acbg-del-brand" style="padding:3px 7px; font-size:10.5px; background:#7f1d1d;">Xóa</button>
          </div>
        </div>
        <select id="acbg-brand-select" class="acp-sel" style="margin-bottom:6px;"></select>
        <div class="acbg-row">
          <input id="acbg-brand-name" class="acp-inp" placeholder="Tên thương hiệu / Shop..." />
          <div style="display:flex; gap:6px; align-items:center;">
            <input type="color" id="acbg-brand-accent" value="#f59e0b" style="width:38px; height:32px; border:none; background:none; cursor:pointer;" title="Màu nhận diện chính" />
            <input id="acbg-brand-hotline" class="acp-inp" placeholder="Hotline / Zalo / @kênh..." style="flex:1;" />
          </div>
        </div>
        <input type="file" id="acbg-logo-file" accept="image/*" style="display:none;" />
        <div style="display:flex; gap:6px; margin-top:7px; align-items:center;">
          <button type="button" class="acp-btn acp-btn-main" id="acbg-pick-logo" style="font-size:11px;">🖼️ Tải Logo PNG</button>
          <button type="button" class="acp-btn" id="acbg-rm-logo" style="font-size:11px;">Bỏ Logo</button>
          <span id="acbg-logo-status" style="font-size:10.5px; color:#94a3b8; flex:1; text-align:right;"></span>
        </div>
        <div class="acbg-row" style="align-items:center;">
          <select id="acbg-logo-pos" class="acp-sel">
            <option value="top_right">📍 Logo: Góc trên phải</option>
            <option value="top_left">📍 Logo: Góc trên trái</option>
            <option value="bottom_right">📍 Logo: Góc dưới phải</option>
            <option value="bottom_left">📍 Logo: Góc dưới trái</option>
          </select>
          <div style="font-size:11px;">
            <span>Cỡ Logo: <b id="acbg-logo-size-lbl">16%</b></span>
            <input type="range" id="acbg-logo-size" min="8" max="28" value="16" style="width:100%;" />
          </div>
        </div>
      </div>

      <!-- 2. THẺ GIÁ ĐỘNG (PRICE TAG) -->
      <div class="acp-sec">
        <label style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:6px;">
          <span class="acp-label" style="margin:0; color:#fde047;">2. Thẻ Giá Sale Động (Price Tag)</span>
          <input type="checkbox" id="acbg-pt-en" />
        </label>
        <div class="acbg-row">
          <input id="acbg-pt-badge" class="acp-inp" placeholder="Nhãn (VD: ƯU ĐÃI HÔM NAY)" />
          <input id="acbg-pt-disc" class="acp-inp" placeholder="Tem giảm (VD: -30%)" />
        </div>
        <div class="acbg-row">
          <input id="acbg-pt-old" class="acp-inp" placeholder="Giá gốc gạch ngang (850k)" />
          <input id="acbg-pt-new" class="acp-inp" placeholder="Giá Sale nổi bật (590k)" />
        </div>
        <select id="acbg-pt-pos" class="acp-sel" style="margin-top:6px;">
          <option value="top_left">📍 Vị trí Thẻ Giá: Trên trái</option>
          <option value="top_right">📍 Vị trí Thẻ Giá: Trên phải</option>
          <option value="mid_left">📍 Vị trí Thẻ Giá: Giữa trái</option>
        </select>
      </div>

      <!-- 3. BẢNG THÔNG SỐ (SPEC CARD) -->
      <div class="acp-sec">
        <label style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:6px;">
          <span class="acp-label" style="margin:0; color:#38bdf8;">3. Bảng Thông Số Chuyên Ngành (Spec Card)</span>
          <input type="checkbox" id="acbg-sc-en" />
        </label>
        <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px;">
          <button type="button" class="acp-btn" data-spec-pre="jewelry" style="padding:3px 7px; font-size:10.5px;">💎 Trang sức</button>
          <button type="button" class="acp-btn" data-spec-pre="realestate" style="padding:3px 7px; font-size:10.5px;">🏠 BĐS</button>
          <button type="button" class="acp-btn" data-spec-pre="auto" style="padding:3px 7px; font-size:10.5px;">🚗 Ô tô</button>
          <button type="button" class="acp-btn" data-spec-pre="tech" style="padding:3px 7px; font-size:10.5px;">📱 Công nghệ</button>
        </div>
        <input id="acbg-sc-title" class="acp-inp" placeholder="Tiêu đề bảng thông số..." />
        <input id="acbg-sc-l1" class="acp-inp" style="margin-top:5px;" placeholder="Thông số dòng 1..." />
        <input id="acbg-sc-l2" class="acp-inp" style="margin-top:5px;" placeholder="Thông số dòng 2..." />
        <input id="acbg-sc-l3" class="acp-inp" style="margin-top:5px;" placeholder="Thông số dòng 3..." />
        <select id="acbg-sc-pos" class="acp-sel" style="margin-top:6px;">
          <option value="mid_left">📍 Vị trí Bảng Thông Số: Giữa trái</option>
          <option value="bottom_left">📍 Vị trí Bảng Thông Số: Dưới trái (trên phụ đề)</option>
          <option value="top_left">📍 Vị trí Bảng Thông Số: Trên trái</option>
        </select>
      </div>

      <!-- 4. CHIA ĐÔI MÀN HÌNH BEFORE / AFTER -->
      <div class="acp-sec">
        <label class="acp-label" style="color:#a78bfa;">4. Chia Đôi Màn Hình So Sánh (Before / After)</label>
        <select id="acbg-split-mode" class="acp-sel">
          <option value="off">Tắt (Chạy toàn màn hình bình thường)</option>
          <option value="top_bottom">↕️ Chia Trên / Dưới (Spa, Nội thất, So sánh)</option>
          <option value="left_right">↔️ Chia Trái / Phải song song</option>
          <option value="wipe_slider">✨ Thanh Quét So Sánh Động (Wipe Slider)</option>
        </select>
        <input type="file" id="acbg-before-file" accept="video/*" style="display:none;" />
        <div style="display:flex; gap:6px; margin-top:7px;">
          <button type="button" class="acp-btn acp-btn-main" id="acbg-pick-before" style="flex:1; font-size:11px;">📂 Chọn Clip "TRƯỚC" (Chạy song song với video chính)</button>
          <button type="button" class="acp-btn" id="acbg-rm-before" style="font-size:11px;">Xóa</button>
        </div>
        <div id="acbg-before-status" style="font-size:11px; color:#94a3b8; margin-top:4px;">Chưa chọn clip đối chiếu (Clip chính ở Tab 1 sẽ làm vế "SAU").</div>
        <div class="acbg-row">
          <input id="acbg-split-before" class="acp-inp" placeholder="Nhãn vế 1 (TRƯỚC)" />
          <input id="acbg-split-after" class="acp-inp" placeholder="Nhãn vế 2 (SAU)" />
        </div>
      </div>
    `;
    drawerBody.appendChild(pane);

    // ================= GẮN SỰ KIỆN =================
    document.getElementById('acbg-brand-select').onchange = (e) => {
      state.activeBrandId = e.target.value;
      const b = getActiveBrand();
      // Tự điền tên thương hiệu sang ô v6.0 nếu có
      const mainTag = document.getElementById('ac-brand-tag');
      if (mainTag && b && b.name) {
        mainTag.value = b.name;
        mainTag.dispatchEvent(new Event('change', { bubbles: true }));
      }
      refreshLogoImageCache();
      syncUIWithState();
      saveState(true);
    };

    document.getElementById('acbg-new-brand').onclick = () => {
      if (state.brands.length >= 10) { alert('Đã đạt tối đa 10 hồ sơ thương hiệu!'); return; }
      const nm = prompt('Nhập tên thương hiệu / shop mới:', `Thương hiệu ${state.brands.length + 1}`);
      if (!nm || !nm.trim()) return;
      const nb = { id: 'br_' + Date.now(), name: nm.trim(), accent: '#8b5cf6', hotline: '', logoDataUrl: '', logoPos: 'top_right', logoSize: 16 };
      state.brands.push(nb);
      state.activeBrandId = nb.id;
      syncUIWithState();
      saveState(true);
    };

    document.getElementById('acbg-del-brand').onclick = () => {
      if (state.brands.length <= 1) { alert('Cần giữ lại ít nhất 1 hồ sơ thương hiệu!'); return; }
      if (!confirm('Xóa hồ sơ thương hiệu đang chọn?')) return;
      state.brands = state.brands.filter((x) => x.id !== state.activeBrandId);
      state.activeBrandId = state.brands[0].id;
      refreshLogoImageCache();
      syncUIWithState();
      saveState(true);
    };

    const bindBrand = (id, key, isNum = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const b = getActiveBrand();
        if (!b) return;
        b[key] = isNum ? Number(el.value) : el.value;
        if (key === 'logoSize') {
          const l = document.getElementById('acbg-logo-size-lbl');
          if (l) l.textContent = el.value + '%';
        }
        saveState(true);
      });
    };
    bindBrand('acbg-brand-name', 'name');
    bindBrand('acbg-brand-accent', 'accent');
    bindBrand('acbg-brand-hotline', 'hotline');
    bindBrand('acbg-logo-pos', 'logoPos');
    bindBrand('acbg-logo-size', 'logoSize', true);

    document.getElementById('acbg-brand-name').addEventListener('change', () => {
      const b = getActiveBrand();
      const sel = document.getElementById('acbg-brand-select');
      if (sel && b) sel.options[sel.selectedIndex].textContent = '🏢 ' + b.name;
      const mainTag = document.getElementById('ac-brand-tag');
      if (mainTag && b) { mainTag.value = b.name; mainTag.dispatchEvent(new Event('change', { bubbles: true })); }
    });

    document.getElementById('acbg-pick-logo').onclick = () => document.getElementById('acbg-logo-file').click();
    document.getElementById('acbg-logo-file').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const dataUrl = await compressLogoToPngDataUrl(f);
        const b = getActiveBrand();
        if (b) b.logoDataUrl = dataUrl;
        refreshLogoImageCache();
        syncUIWithState();
        saveState(true);
      } catch (err) { alert(err.message); }
      e.target.value = '';
    };
    document.getElementById('acbg-rm-logo').onclick = () => {
      const b = getActiveBrand();
      if (b) b.logoDataUrl = '';
      refreshLogoImageCache();
      syncUIWithState();
      saveState(true);
    };

    // Price Tag events
    const bindObj = (id, group, key, isCheck = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      const evt = isCheck || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, () => {
        state[group][key] = isCheck ? el.checked : el.value;
        saveState(true);
      });
    };
    bindObj('acbg-pt-en', 'priceTag', 'enabled', true);
    bindObj('acbg-pt-badge', 'priceTag', 'badge');
    bindObj('acbg-pt-old', 'priceTag', 'oldPrice');
    bindObj('acbg-pt-new', 'priceTag', 'newPrice');
    bindObj('acbg-pt-disc', 'priceTag', 'discount');
    bindObj('acbg-pt-pos', 'priceTag', 'pos');

    // Spec Card events
    bindObj('acbg-sc-en', 'specCard', 'enabled', true);
    bindObj('acbg-sc-title', 'specCard', 'title');
    bindObj('acbg-sc-l1', 'specCard', 'line1');
    bindObj('acbg-sc-l2', 'specCard', 'line2');
    bindObj('acbg-sc-l3', 'specCard', 'line3');
    bindObj('acbg-sc-pos', 'specCard', 'pos');

    pane.querySelectorAll('[data-spec-pre]').forEach((btn) => {
      btn.onclick = () => {
        const pre = SPEC_PRESETS[btn.getAttribute('data-spec-pre')];
        if (!pre) return;
        state.specCard = { ...state.specCard, ...pre, enabled: true };
        syncUIWithState();
        saveState(true);
      };
    });

    // Split Screen Before / After events
    bindObj('acbg-split-mode', 'splitScreen', 'mode');
    bindObj('acbg-split-before', 'splitScreen', 'beforeLabel');
    bindObj('acbg-split-after', 'splitScreen', 'afterLabel');

    document.getElementById('acbg-pick-before').onclick = () => document.getElementById('acbg-before-file').click();
    document.getElementById('acbg-before-file').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (compareVideoUrl) URL.revokeObjectURL(compareVideoUrl);
      compareVideoUrl = URL.createObjectURL(f);
      compareFileName = f.name;
      if (!compareVideoEl) {
        compareVideoEl = document.createElement('video');
        compareVideoEl.muted = true;
        compareVideoEl.loop = true;
        compareVideoEl.playsInline = true;
        compareVideoEl.crossOrigin = 'anonymous';
      }
      compareVideoEl.src = compareVideoUrl;
      compareVideoEl.load();
      if (state.splitScreen.mode === 'off') {
        state.splitScreen.mode = 'top_bottom';
        document.getElementById('acbg-split-mode').value = 'top_bottom';
        saveState(true);
      }
      document.getElementById('acbg-before-status').innerHTML = `<span style="color:#4ade80; font-weight:700;">✓ Đã nạp clip "TRƯỚC": ${compareFileName}</span>`;
      e.target.value = '';
    };
    document.getElementById('acbg-rm-before').onclick = () => {
      if (compareVideoEl) compareVideoEl.pause();
      if (compareVideoUrl) URL.revokeObjectURL(compareVideoUrl);
      compareVideoUrl = null; compareFileName = '';
      if (compareVideoEl) compareVideoEl.removeAttribute('src');
      state.splitScreen.mode = 'off';
      syncUIWithState();
      saveState(true);
      document.getElementById('acbg-before-status').textContent = 'Đã gỡ clip đối chiếu.';
    };

    refreshLogoImageCache();
    syncUIWithState();
    pullStateFromCloud();
    return true;
  }

  installCanvasPipelineHook();

  let tries = 0;
  const bootTimer = setInterval(() => {
    tries += 1;
    if (mountBrandGraphicsUI() || tries > 60) {
      clearInterval(bootTimer);
    }
  }, 250);
})();
