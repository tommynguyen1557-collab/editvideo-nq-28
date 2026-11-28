/**
 * AutoCut Studio AI — Add-on #5: Auto Safe-Zone Positioning (Khóa Vùng An Toàn Đa Nền Tảng)
 * Plugin cắm rời độc lập: Không sửa auth.js, crm.html, editor-ai-core.js, worker.js hay các add-on trước.
 * Đồng bộ nhánh riêng: autocut_saas/studio_addons/v7_safe_zones
 */
(function () {
  'use strict';

  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v7_safe_zones';
  const LOCAL_KEY = 'autocut_v7_safe_zones_state';

  const ZONES = {
    universal: {
      id: 'universal',
      label: '🛡️ Chuẩn Chung (TikTok + Shopee + Reels + Shorts)',
      shortName: 'Đa nền tảng',
      accent: '#10b981',
      top: 0.14,
      bottom: 0.34,
      right: 0.18,
      left: 0.05,
      cartLabel: '🛒 Vùng Giỏ Hàng / Mô Tả / Nút CTA (34%)',
      topLabel: 'Thanh trạng thái & Tab trên (14%)',
      icons: ['👤', '❤️', '💬', '🔖', '↗️']
    },
    tiktok: {
      id: 'tiktok',
      label: '🎵 TikTok & TikTok Shop',
      shortName: 'TikTok',
      accent: '#f43f5e',
      top: 0.12,
      bottom: 0.28,
      right: 0.17,
      left: 0.05,
      cartLabel: '🛍️ Giỏ Hàng Vàng TikTok + Mô Tả (28%)',
      topLabel: 'Đang follow | Dành cho bạn (12%)',
      icons: ['➕', '❤️', '💬', '⭐', '↗️']
    },
    shopee: {
      id: 'shopee',
      label: '🛒 Shopee Video (Né Thẻ Sản Phẩm Cam)',
      shortName: 'Shopee Video',
      accent: '#f97316',
      top: 0.13,
      bottom: 0.34,
      right: 0.16,
      left: 0.05,
      cartLabel: '🛒 Thẻ Giỏ Hàng Cam Shopee + Mua Ngay (34%)',
      topLabel: 'Khám phá | Đang theo dõi (13%)',
      icons: ['❤️', '💬', '↗️', '🛍️']
    },
    reels: {
      id: 'reels',
      label: '📘 Facebook & Instagram Reels',
      shortName: 'Reels',
      accent: '#3b82f6',
      top: 0.11,
      bottom: 0.26,
      right: 0.16,
      left: 0.05,
      cartLabel: '📘 Tên Fanpage + Mô Tả + Nút Nhắn Tin (26%)',
      topLabel: 'Reels & Biểu tượng Camera (11%)',
      icons: ['👍', '💬', '↗️', '⋯']
    },
    shorts: {
      id: 'shorts',
      label: '▶️ YouTube Shorts',
      shortName: 'Shorts',
      accent: '#ef4444',
      top: 0.10,
      bottom: 0.24,
      right: 0.16,
      left: 0.05,
      cartLabel: '▶️ Tên Kênh + Nút Đăng Ký + Tiêu Đề (24%)',
      topLabel: 'Tìm kiếm & Tùy chọn (10%)',
      icons: ['👍', '👎', '💬', '↗️', '🎵']
    }
  };

  function defaultState() {
    return {
      platform: 'universal',
      showGuide: true,
      autoClamp: true,
      updatedAt: 0
    };
  }

  function loadLocalState() {
    try {
      const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (s && typeof s === 'object') {
        return { ...defaultState(), ...s };
      }
    } catch (_) {}
    return defaultState();
  }

  let state = loadLocalState();
  let syncTimer = null;
  let observedCanvases = new WeakSet();

  function getZone() {
    return ZONES[state.platform] || ZONES.universal;
  }

  function hasActiveHotline() {
    const inp = document.getElementById('acbg-brand-hotline');
    if (inp) return Boolean((inp.value || '').trim());
    try {
      const bg = JSON.parse(localStorage.getItem('autocut_v7_brand_graphics_state') || 'null');
      if (bg && Array.isArray(bg.brands)) {
        const b = bg.brands.find((x) => x.id === bg.activeBrandId) || bg.brands[0];
        return Boolean(b && (b.hotline || '').trim());
      }
    } catch (_) {}
    return false;
  }

  function saveState(syncCloud = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    syncAllVisualOverlays();
    updateStatusSummary();

    if (syncCloud) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        }).catch(() => {});
      }, 600);
    }
  }

  async function pullStateFromCloud() {
    try {
      const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`);
      if (!res.ok) return;
      const remote = await res.json();
      if (remote && Number(remote.updatedAt || 0) > Number(state.updatedAt || 0)) {
        state = { ...defaultState(), ...remote };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
        syncUIWithState();
      }
    } catch (_) {}
  }

  // ================= 1. KHÓA TỌA ĐỘ TỰ ĐỘNG KHI RENDER & XUẤT VIDEO (AUTO SAFE-ZONE CLAMP) =================
  function installSafeZoneCanvasClamp() {
    if (window.__acSafeZoneClampInstalled) return;
    window.__acSafeZoneClampInstalled = true;

    const TARGET_IDS = new Set(['ac-pro-preview-canvas', 'acbg-mini-preview']);

    function isVerticalTargetCanvas(ctx) {
      if (!state.autoClamp || !ctx || !ctx.canvas) return false;
      if (!TARGET_IDS.has(ctx.canvas.id)) return false;
      return (ctx.canvas.height || 0) > (ctx.canvas.width || 0);
    }

    function getHotlineLiftDelta(h) {
      const z = getZone();
      const origHy = Math.round(h * 0.925);
      const safeBottomEdge = Math.round(h * (1 - z.bottom));
      const targetHy = safeBottomEdge - Math.round(h * 0.042);
      return Math.min(0, targetHy - origHy);
    }

    // 1. Tự động dịch chuyển Phụ đề động & Sticker vào vùng an toàn qua ctx.translate
    const origTranslate = CanvasRenderingContext2D.prototype.translate;
    CanvasRenderingContext2D.prototype.translate = function (x, y) {
      try {
        if (isVerticalTargetCanvas(this)) {
          const w = this.canvas.width;
          const h = this.canvas.height;
          const z = getZone();

          // A. Phụ đề động (vẽ ở chính giữa trục X = w/2 và vùng thấp y > 0.56*h)
          if (Math.abs(x - w / 2) < 1.5 && y > h * 0.56) {
            const hotlineReserve = hasActiveHotline() ? 0.095 : 0.045;
            const maxSubY = h * (1 - z.bottom - hotlineReserve);
            if (y > maxSubY) {
              y = maxSubY;
            }
          }
          // B. Sticker / Nhãn nổi (nằm trên vùng > 12% ngang & > 7% dọc để bỏ qua Film Grain)
          else if (x > w * 0.12 && y > h * 0.07) {
            const maxRightCenter = w * (1 - z.right - 0.17);
            const minLeftCenter = w * (z.left + 0.16);
            const minTopCenter = h * (z.top + 0.045);
            const maxBotCenter = h * (1 - z.bottom - 0.06);

            if (x > maxRightCenter && x < w * 0.92) x = maxRightCenter;
            if (x < minLeftCenter) x = minLeftCenter;
            if (y < minTopCenter) y = minTopCenter;
            if (y > maxBotCenter) y = maxBotCenter;
          }
        }
      } catch (_) {}
      return origTranslate.call(this, x, y);
    };

    // 2. Tự động nâng Thanh Hotline (Brand Kit) từ 92.5% lên ngay mép trên vùng an toàn
    const origRoundRect = CanvasRenderingContext2D.prototype.roundRect;
    if (typeof origRoundRect === 'function') {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, rw, rh, radii) {
        try {
          if (isVerticalTargetCanvas(this)) {
            const h = this.canvas.height;
            const tr = this.getTransform ? this.getTransform() : null;
            const isIdentityY = !tr || Math.abs(tr.f) < 1;
            if (isIdentityY && y > h * 0.88 && rh < h * 0.12) {
              y += getHotlineLiftDelta(h);
            }
          }
        } catch (_) {}
        return origRoundRect.call(this, x, y, rw, rh, radii);
      };
    }

    const origFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      try {
        if (isVerticalTargetCanvas(this)) {
          const h = this.canvas.height;
          const tr = this.getTransform ? this.getTransform() : null;
          const isIdentityY = !tr || Math.abs(tr.f) < 1;
          if (isIdentityY && y > h * 0.88) {
            y += getHotlineLiftDelta(h);
          }
        }
      } catch (_) {}
      return maxWidth !== undefined
        ? origFillText.call(this, text, x, y, maxWidth)
        : origFillText.call(this, text, x, y);
    };
  }

  // ================= 2. LỚP LƯỚI VÙNG AN TOÀN XEM TRƯỚC (KHÔNG GHI VÀO FILE XUẤT) =================
  function buildOverlayInnerHtml(zone, isMini) {
    const topPct = (zone.top * 100).toFixed(1);
    const botPct = (zone.bottom * 100).toFixed(1);
    const rightPct = (zone.right * 100).toFixed(1);
    const leftPct = (zone.left * 100).toFixed(1);
    const fs = isMini ? '7px' : '9.5px';
    const iconFs = isMini ? '8px' : '12px';

    return `
      <!-- Vùng che phía trên -->
      <div style="position:absolute; top:0; left:0; right:0; height:${topPct}%; background:rgba(239,68,68,0.22); border-bottom:1px dashed rgba(248,113,113,0.85); display:flex; align-items:flex-end; justify-content:center; padding-bottom:2px;">
        <span style="font-size:${fs}; font-weight:700; color:#fecaca; text-shadow:0 1px 3px #000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 4px;">${isMini ? zone.shortName : zone.topLabel}</span>
      </div>

      <!-- Cột nút tương tác bên phải -->
      <div style="position:absolute; top:${topPct}%; bottom:${botPct}%; right:0; width:${rightPct}%; background:rgba(239,68,68,0.20); border-left:1px dashed rgba(248,113,113,0.85); display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:${isMini ? '3px' : '7px'}; padding-bottom:${isMini ? '5px' : '10px'};">
        ${zone.icons.map((ic) => `<span style="font-size:${iconFs}; opacity:0.9; filter:drop-shadow(0 1px 2px #000);">${ic}</span>`).join('')}
      </div>

      <!-- Vùng che phía dưới (Giỏ hàng + Mô tả) -->
      <div style="position:absolute; bottom:0; left:0; right:0; height:${botPct}%; background:rgba(239,68,68,0.25); border-top:1px dashed rgba(248,113,113,0.9); display:flex; flex-direction:column; justify-content:flex-start; padding:${isMini ? '3px 4px' : '6px 8px'}; text-align:left;">
        <span style="font-size:${fs}; font-weight:800; color:#fde047; text-shadow:0 1px 3px #000; line-height:1.25;">${isMini ? '🛒 Vùng che dưới' : zone.cartLabel}</span>
        ${isMini ? '' : '<span style="font-size:8.5px; color:#fecaca; margin-top:2px; opacity:0.9;">Lưới chỉ hiện để căn mắt • KHÔNG dính vào video xuất</span>'}
      </div>

      <!-- Khung nét đứt xanh lá đánh dấu VÙNG AN TOÀN 100% -->
      <div style="position:absolute; top:${topPct}%; bottom:${botPct}%; left:${leftPct}%; right:${rightPct}%; border:1.5px dashed ${zone.accent}; border-radius:4px; box-sizing:border-box;">
        <span style="position:absolute; top:2px; left:4px; font-size:${isMini ? '6.5px' : '8.5px'}; font-weight:800; color:${zone.accent}; background:rgba(9,13,25,0.72); padding:1px 4px; border-radius:4px;">✓ SAFE ZONE</span>
      </div>
    `;
  }

  function syncOverlayForCanvas(canvasId, isMini) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    const overlayId = `acsz-overlay-${canvasId}`;
    let layer = document.getElementById(overlayId);
    if (!layer) {
      layer = document.createElement('div');
      layer.id = overlayId;
      layer.style.cssText = 'position:absolute; pointer-events:none; border-radius:10px; overflow:hidden; z-index:20; box-sizing:border-box;';
      parent.appendChild(layer);
    }

    const isVertical = (canvas.height || 0) > (canvas.width || 0);
    const hasBox = canvas.offsetWidth > 20 && canvas.offsetHeight > 20;

    if (!state.showGuide || !isVertical || !hasBox) {
      layer.style.display = 'none';
      return;
    }

    layer.style.display = 'block';
    layer.style.left = canvas.offsetLeft + 'px';
    layer.style.top = canvas.offsetTop + 'px';
    layer.style.width = canvas.offsetWidth + 'px';
    layer.style.height = canvas.offsetHeight + 'px';
    layer.innerHTML = buildOverlayInnerHtml(getZone(), isMini);

    if (!observedCanvases.has(canvas) && typeof ResizeObserver !== 'undefined') {
      observedCanvases.add(canvas);
      const ro = new ResizeObserver(() => syncOverlayForCanvas(canvasId, isMini));
      ro.observe(canvas);
    }
  }

  function syncAllVisualOverlays() {
    syncOverlayForCanvas('ac-pro-preview-canvas', false);
    syncOverlayForCanvas('acbg-mini-preview', true);
  }

  // Nút 1 chạm sắp xếp lại Logo & Thẻ Giá ở Add-on #3 vào góc an toàn nhất
  function autoArrangeBrandKitToSafeZone() {
    let moved = [];
    const logoPos = document.getElementById('acbg-logo-pos');
    if (logoPos && logoPos.value !== 'top_left') {
      logoPos.value = 'top_left';
      logoPos.dispatchEvent(new Event('input', { bubbles: true }));
      logoPos.dispatchEvent(new Event('change', { bubbles: true }));
      moved.push('Logo → Góc trên trái');
    }
    const ptPos = document.getElementById('acbg-pt-pos');
    if (ptPos && ptPos.value === 'top_right') {
      ptPos.value = 'mid_left';
      ptPos.dispatchEvent(new Event('change', { bubbles: true }));
      moved.push('Thẻ Giá → Giữa trái');
    }
    const scPos = document.getElementById('acbg-sc-pos');
    if (scPos && scPos.value === 'bottom_left') {
      scPos.value = 'mid_left';
      scPos.dispatchEvent(new Event('change', { bubbles: true }));
      moved.push('Bảng Thông Số → Giữa trái');
    }

    const msgEl = document.getElementById('acsz-status');
    if (msgEl) {
      msgEl.innerHTML = moved.length
        ? `<span style="color:#4ade80;">✓ Đã căn lại vào góc an toàn: ${moved.join(' • ')}</span>`
        : '<span style="color:#4ade80;">✓ Logo, Thẻ Giá & Thông Số đã nằm gọn trong góc an toàn rồi!</span>';
    }
    syncAllVisualOverlays();
  }

  // ================= 3. DỰNG THẺ ĐIỀU KHIỂN SAFE-ZONE TRONG NGĂN KÉO PRO =================
  function updateStatusSummary() {
    const el = document.getElementById('acsz-status');
    if (!el) return;
    const z = getZone();
    if (!state.autoClamp) {
      el.innerHTML = `<span style="color:#fbbf24;">⚠️ Đang tắt tự khóa vị trí — Chữ có thể bị nút ${z.shortName} che ở mép dưới.</span>`;
      return;
    }
    el.innerHTML = `<span style="color:#cbd5e1;">🎯 Đang bảo vệ <b>${z.shortName}</b>: Tự nâng Phụ đề & Hotline trên mép dưới <b>${Math.round(z.bottom * 100)}%</b>, kéo Sticker né cột phải <b>${Math.round(z.right * 100)}%</b>.</span>`;
  }

  function syncUIWithState() {
    const sel = document.getElementById('acsz-platform');
    if (sel) sel.value = state.platform || 'universal';
    const guideChk = document.getElementById('acsz-show-guide');
    if (guideChk) guideChk.checked = Boolean(state.showGuide);
    const clampChk = document.getElementById('acsz-auto-clamp');
    if (clampChk) clampChk.checked = Boolean(state.autoClamp);
    updateStatusSummary();
    syncAllVisualOverlays();
  }

  function mountSafeZonesUI() {
    const tabAuto = document.getElementById('ac-tab-auto');
    if (!tabAuto || document.getElementById('acsz-card')) return false;

    const card = document.createElement('div');
    card.id = 'acsz-card';
    card.style.cssText = 'background:#11192d; border:1px solid #047857; border-radius:12px; padding:11px; margin-bottom:11px;';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11px; font-weight:800; color:#34d399; text-transform:uppercase;">📐 Khóa Vùng An Toàn (Auto Safe-Zone)</span>
        <span style="font-size:10px; color:#4ade80; font-weight:700;">Add-on #5</span>
      </div>
      <select id="acsz-platform" class="acp-sel" style="margin-bottom:7px;">
        ${Object.values(ZONES).map((z) => `<option value="${z.id}">${z.label}</option>`).join('')}
      </select>
      <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:7px; font-size:11.5px; color:#e2e8f0;">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" id="acsz-auto-clamp" checked />
          Tự động khóa Phụ đề, Sticker & Hotline vào vùng an toàn khi xuất
        </label>
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" id="acsz-show-guide" checked />
          Hiện lưới mô phỏng nút App khi xem trước (không dính vào file xuất)
        </label>
      </div>
      <div style="display:flex; gap:6px; margin-bottom:7px;">
        <button type="button" class="acp-btn" id="acsz-fix-brand" style="flex:1; background:#065f46; font-size:11px;">✨ Đưa Logo & Thẻ Giá về góc an toàn</button>
      </div>
      <div id="acsz-status" style="background:#090e1a; border:1px solid #1e293b; border-radius:8px; padding:7px 9px; font-size:11px; line-height:1.45;"></div>
    `;

    // Đặt gọn ngay dưới thanh Add-on #3 (hoặc Add-on #2 / #1)
    const anchor = document.getElementById('acbg-quick-card') || document.getElementById('acpg-card') || document.getElementById('acpb-card');
    if (anchor && anchor.nextSibling) {
      tabAuto.insertBefore(card, anchor.nextSibling);
    } else {
      tabAuto.prepend(card);
    }

    document.getElementById('acsz-platform').onchange = (e) => {
      state.platform = e.target.value;
      saveState(true);
    };
    document.getElementById('acsz-auto-clamp').onchange = (e) => {
      state.autoClamp = e.target.checked;
      saveState(true);
    };
    document.getElementById('acsz-show-guide').onchange = (e) => {
      state.showGuide = e.target.checked;
      saveState(true);
    };
    document.getElementById('acsz-fix-brand').onclick = autoArrangeBrandKitToSafeZone;

    // Theo dõi khi Canvas xem trước ở Tab 1 được dựng lại hoặc đổi tỷ lệ khung
    const autoResult = document.getElementById('ac-auto-result');
    if (autoResult) {
      const obs = new MutationObserver(() => setTimeout(syncAllVisualOverlays, 60));
      obs.observe(autoResult, { childList: true, subtree: true });
    }

    // Cập nhật lại lưới khi chuyển tab (đặc biệt khi mở Tab 5 Đồ Họa)
    document.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('.acp-tab, #acbg-open-tab, #ac-pro-fab')) {
        setTimeout(syncAllVisualOverlays, 80);
      }
    });
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'ac-ratio-override') {
        setTimeout(syncAllVisualOverlays, 80);
      }
    });

    syncUIWithState();
    pullStateFromCloud();
    return true;
  }

  installSafeZoneCanvasClamp();

  let tries = 0;
  const bootTimer = setInterval(() => {
    tries += 1;
    if (mountSafeZonesUI() || tries > 60) {
      clearInterval(bootTimer);
    }
  }, 250);
})();
