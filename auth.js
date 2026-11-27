/**
 * AutoCut Studio AI — Core Auth, Firebase Cloud Sync, AI Proxy & VietQR Billing (v2.0)
 */
(function () {
  'use strict';

  // ================= 1. CẤU HÌNH MẶC ĐỊNH GẮN CỨNG (HARDCODE) =================
  const DEFAULTS = {
    FIREBASE_URL: 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app',
    PROXY_URL: 'https://autocut-ai-proxy.tommynguyen1557.workers.dev',
    WEB_URL: 'https://tommynguyen1557-collab.github.io/editvideo-nq-28/',
    OWNER_PASS: 'NGOQUOC-28-12',
    DB_ROOT: 'autocut_saas'
  };

  const PACKAGES = {
    '1M': { id: '1M', name: 'Gói 1 Tháng', price: 139000, days: 30, badge: 'Cơ bản' },
    '6M': { id: '6M', name: 'Gói 6 Tháng', price: 699000, days: 180, badge: 'Tiết kiệm 16%' },
    '1Y': { id: '1Y', name: 'Gói 1 Năm', price: 1190000, days: 365, badge: 'Phổ biến nhất' }
  };

  const BANKS = [
    { code: 'MB', name: 'MB Bank (Quân Đội)' },
    { code: 'VCB', name: 'Vietcombank' },
    { code: 'TCB', name: 'Techcombank' },
    { code: 'BIDV', name: 'BIDV' },
    { code: 'CTG', name: 'VietinBank' },
    { code: 'ACB', name: 'ACB (Á Châu)' },
    { code: 'VPB', name: 'VPBank' },
    { code: 'TPB', name: 'TPBank' },
    { code: 'VIB', name: 'VIB' },
    { code: 'STB', name: 'Sacombank' },
    { code: 'HDB', name: 'HDBank' },
    { code: 'OCB', name: 'OCB' },
    { code: 'MSB', name: 'MSB' }
  ];

  const STORAGE_KEYS = {
    FB_URL: 'autocut_firebase_url',
    AI_CONFIG: 'autocut_ai_config',
    OWNER_SESSION: 'autocut_owner_unlocked',
    USER_SESSION: 'autocut_current_user',
    LOCAL_USERS: 'autocut_users_cache',
    PAYMENT_CFG: 'autocut_payment_config',
    OWNER_PASS: 'autocut_owner_pass_cache',
    WEB_URL: 'autocut_web_url_cache'
  };

  // ================= 2. KHỞI TẠO TRẠNG THÁI & ĐỒNG BỘ =================
  const state = {
    firebaseUrl: (localStorage.getItem(STORAGE_KEYS.FB_URL) || DEFAULTS.FIREBASE_URL).replace(/\/+$/, ''),
    webUrl: localStorage.getItem(STORAGE_KEYS.WEB_URL) || DEFAULTS.WEB_URL,
    ownerPass: localStorage.getItem(STORAGE_KEYS.OWNER_PASS) || DEFAULTS.OWNER_PASS,
    isOwner: sessionStorage.getItem(STORAGE_KEYS.OWNER_SESSION) === '1',
    cloudConnected: false,
    aiConfig: (() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_CONFIG) || 'null');
        if (saved && (saved.proxyUrl || saved.apiKey)) return saved;
      } catch (_) {}
      return { mode: 'proxy', proxyUrl: DEFAULTS.PROXY_URL, apiKey: '' };
    })(),
    payment: (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENT_CFG) || 'null') || {
          bankCode: 'MB',
          accountNo: '',
          accountName: ''
        };
      } catch (_) {
        return { bankCode: 'MB', accountNo: '', accountName: '' };
      }
    })(),
    users: (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_USERS) || '{}') || {};
      } catch (_) {
        return {};
      }
    })(),
    currentUser: (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_SESSION) || 'null');
      } catch (_) {
        return null;
      }
    })(),
    selectedPkg: '6M'
  };

  // Lưu ngay cấu hình mặc định vào localStorage để các module khác luôn đọc được
  function persistLocal() {
    localStorage.setItem(STORAGE_KEYS.FB_URL, state.firebaseUrl);
    localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(state.aiConfig));
    localStorage.setItem('autocut_proxy_url', state.aiConfig.proxyUrl || DEFAULTS.PROXY_URL);
    localStorage.setItem('autocut_ai_mode', state.aiConfig.mode || 'proxy');
    localStorage.setItem(STORAGE_KEYS.PAYMENT_CFG, JSON.stringify(state.payment));
    localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(state.users));
    if (state.currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(state.currentUser));
    }
  }
  persistLocal();

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatVND(num) {
    return Number(num || 0).toLocaleString('vi-VN') + 'đ';
  }

  function formatDate(ts) {
    if (!ts) return 'Chưa kích hoạt';
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return 'Chưa kích hoạt';
    return d.toLocaleDateString('vi-VN');
  }

  function cleanPhone(raw) {
    return String(raw || '').replace(/[^\d]/g, '');
  }

  // ================= 3. KẾT NỐI FIREBASE REST API =================
  async function fbGet(path) {
    if (!state.firebaseUrl) return null;
    const res = await fetch(`${state.firebaseUrl}/${DEFAULTS.DB_ROOT}/${path}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function fbPut(path, data) {
    if (!state.firebaseUrl) return null;
    const res = await fetch(`${state.firebaseUrl}/${DEFAULTS.DB_ROOT}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function fbPatch(path, data) {
    if (!state.firebaseUrl) return null;
    const res = await fetch(`${state.firebaseUrl}/${DEFAULTS.DB_ROOT}/${path}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function syncFromCloud() {
    try {
      const root = await fbGet('');
      state.cloudConnected = true;

      if (root && typeof root === 'object') {
        if (root.config) {
          if (root.config.ai && (root.config.ai.proxyUrl || root.config.ai.apiKey)) {
            state.aiConfig = {
              mode: root.config.ai.mode || 'proxy',
              proxyUrl: (root.config.ai.proxyUrl || DEFAULTS.PROXY_URL).trim(),
              apiKey: (root.config.ai.apiKey || '').trim()
            };
          }
          if (root.config.payment) {
            state.payment = {
              bankCode: root.config.payment.bankCode || 'MB',
              accountNo: root.config.payment.accountNo || '',
              accountName: root.config.payment.accountName || ''
            };
          }
          if (root.config.ownerPass) {
            state.ownerPass = root.config.ownerPass;
            localStorage.setItem(STORAGE_KEYS.OWNER_PASS, state.ownerPass);
          }
          if (root.config.webUrl) {
            state.webUrl = root.config.webUrl;
            localStorage.setItem(STORAGE_KEYS.WEB_URL, state.webUrl);
          }
        }
        if (root.users && typeof root.users === 'object') {
          state.users = root.users;
          if (state.currentUser && state.currentUser.phone && state.users[state.currentUser.phone]) {
            state.currentUser = state.users[state.currentUser.phone];
          }
        }
      } else {
        // Khởi tạo nhánh mặc định trên Cloud nếu DB mới tinh
        await fbPatch('config', {
          ai: state.aiConfig,
          payment: state.payment,
          webUrl: state.webUrl,
          updatedAt: Date.now()
        });
      }
      persistLocal();
    } catch (_) {
      state.cloudConnected = false;
    }
    updateStatusIndicators();
  }

  // ================= 4. CẬP NHẬT TRẠNG THÁI GIAO DIỆN =================
  function updateStatusIndicators() {
    // Cập nhật text trạng thái dưới logo nếu tồn tại
    const allElements = document.querySelectorAll('span, div, p, small');
    allElements.forEach((el) => {
      if (el.children.length === 0) {
        const txt = (el.textContent || '').trim();
        if (txt.startsWith('AI:')) {
          el.textContent = state.aiConfig.mode === 'direct' && state.aiConfig.apiKey
            ? 'AI: Gemini Direct ✓'
            : 'AI: Proxy Server ✓';
          el.style.color = '#4ade80';
        } else if (txt.startsWith('Cloud:')) {
          el.textContent = state.cloudConnected ? 'Cloud: Đã nối ✓' : 'Cloud: Cục bộ';
          el.style.color = state.cloudConnected ? '#94a3b8' : '#fbbf24';
        }
      }
    });

    // Hiển thị / ẩn huy hiệu CHỦ SỞ HỮU
    const ownerBadges = document.querySelectorAll('[data-owner-badge], .owner-badge');
    ownerBadges.forEach((b) => {
      b.style.display = state.isOwner ? 'inline-flex' : 'none';
    });
  }

  // ================= 5. CSS & MODAL HỆ THỐNG =================
  function injectStyles() {
    if (document.getElementById('autocut-auth-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'autocut-auth-v2-style';
    style.textContent = `
      .ac-modal-backdrop {
        position: fixed; inset: 0; background: rgba(5, 8, 18, 0.82);
        backdrop-filter: blur(6px); z-index: 99999;
        display: flex; align-items: center; justify-content: center; padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .ac-modal-box {
        background: #111625; border: 1px solid #26314d; border-radius: 16px;
        width: 100%; max-width: 780px; max-height: 90vh; overflow-y: auto;
        color: #f1f5f9; box-shadow: 0 24px 60px rgba(0,0,0,0.65); padding: 24px;
      }
      .ac-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid #1e293b; padding-bottom: 14px; margin-bottom: 18px;
      }
      .ac-modal-title { font-size: 17px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px; }
      .ac-close-btn {
        background: #1e293b; border: none; color: #94a3b8; width: 32px; height: 32px;
        border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 700;
      }
      .ac-close-btn:hover { background: #334155; color: #fff; }
      .ac-tabs { display: flex; gap: 8px; border-bottom: 1px solid #1e293b; margin-bottom: 18px; }
      .ac-tab {
        padding: 10px 16px; background: transparent; border: none; border-bottom: 2px solid transparent;
        color: #94a3b8; font-weight: 600; font-size: 13px; cursor: pointer;
      }
      .ac-tab.active { color: #fbbf24; border-bottom-color: #fbbf24; }
      .ac-card {
        background: #0b0f19; border: 1px solid #1e293b; border-radius: 12px;
        padding: 16px; margin-bottom: 14px;
      }
      .ac-label { display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
      .ac-input, .ac-select {
        width: 100%; box-sizing: border-box; background: #131a2b; border: 1px solid #2b3856;
        color: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 13px; outline: none;
      }
      .ac-input:focus, .ac-select:focus { border-color: #6366f1; }
      .ac-row { display: flex; gap: 10px; align-items: center; }
      .ac-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .ac-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      @media (max-width: 640px) { .ac-grid-2, .ac-grid-3 { grid-template-columns: 1fr; } }
      .ac-btn {
        padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px;
        cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
      }
      .ac-btn:hover { opacity: 0.9; }
      .ac-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
      .ac-btn-success { background: #10b981; color: #052e16; }
      .ac-btn-warn { background: #f59e0b; color: #1c1917; }
      .ac-btn-danger { background: #ef4444; color: #fff; }
      .ac-btn-ghost { background: #1e293b; color: #cbd5e1; }
      .ac-pkg-card {
        background: #0b0f19; border: 2px solid #1e293b; border-radius: 12px;
        padding: 14px; cursor: pointer; text-align: center; transition: all 0.15s;
      }
      .ac-pkg-card.selected { border-color: #8b5cf6; background: #171c33; }
      .ac-qr-box {
        display: flex; gap: 16px; align-items: center; background: #0f172a;
        border: 1px solid #334155; border-radius: 12px; padding: 14px; margin-top: 14px;
      }
      @media (max-width: 600px) { .ac-qr-box { flex-direction: column; text-align: center; } }
      .ac-qr-img {
        width: 170px; height: 170px; border-radius: 10px; background: #fff; padding: 6px; object-fit: contain;
      }
      .ac-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .ac-table th, .ac-table td {
        padding: 9px 8px; border-bottom: 1px solid #1e293b; text-align: left;
      }
      .ac-table th { color: #94a3b8; font-weight: 600; }
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    const old = document.getElementById('ac-active-modal');
    if (old) old.remove();
  }

  // ================= 6. MODAL CÀI ĐẶT AI =================
  function openAISettingsModal() {
    injectStyles();
    closeModal();
    const wrap = document.createElement('div');
    wrap.id = 'ac-active-modal';
    wrap.className = 'ac-modal-backdrop';
    wrap.innerHTML = `
      <div class="ac-modal-box" style="max-width:520px;">
        <div class="ac-modal-header">
          <div class="ac-modal-title">⚡ Cài Đặt AI Đa Phương Thức</div>
          <button class="ac-close-btn" id="ac-close-x">✕</button>
        </div>
        <div class="ac-card">
          <label class="ac-label">Chế độ kết nối AI</label>
          <select class="ac-select" id="ac-ai-mode">
            <option value="proxy" ${state.aiConfig.mode !== 'direct' ? 'selected' : ''}>AI Thật qua Proxy Worker (Khách không cần nhập Key)</option>
            <option value="direct" ${state.aiConfig.mode === 'direct' ? 'selected' : ''}>Gọi trực tiếp bằng Gemini API Key cá nhân</option>
          </select>
        </div>
        <div class="ac-card">
          <label class="ac-label">Proxy URL (Cloudflare Worker)</label>
          <input class="ac-input" id="ac-ai-proxy" value="${esc(state.aiConfig.proxyUrl || DEFAULTS.PROXY_URL)}" placeholder="https://autocut-ai-proxy.tommynguyen1557.workers.dev" />
        </div>
        <div class="ac-card">
          <label class="ac-label">Gemini API Key (Để trống nếu dùng Proxy Worker)</label>
          <input class="ac-input" type="password" id="ac-ai-key" value="${esc(state.aiConfig.apiKey || '')}" placeholder="AIzaSy... hoặc AQ..." />
        </div>
        <div class="ac-row" style="justify-content:flex-end;">
          <button class="ac-btn ac-btn-ghost" id="ac-ai-cancel">Hủy</button>
          <button class="ac-btn ac-btn-primary" id="ac-ai-save">Lưu Cấu Hình AI</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById('ac-close-x').onclick = closeModal;
    document.getElementById('ac-ai-cancel').onclick = closeModal;
    document.getElementById('ac-ai-save').onclick = async () => {
      const mode = document.getElementById('ac-ai-mode').value;
      const proxyUrl = (document.getElementById('ac-ai-proxy').value || DEFAULTS.PROXY_URL).trim().replace(/\/+$/, '');
      const apiKey = (document.getElementById('ac-ai-key').value || '').trim();

      state.aiConfig = { mode, proxyUrl, apiKey };
      persistLocal();
      updateStatusIndicators();

      if (state.isOwner && state.cloudConnected) {
        try {
          await fbPatch('config', { ai: state.aiConfig, updatedAt: Date.now() });
          alert('Đã lưu và đồng bộ cấu hình AI lên Firebase Cloud cho toàn bộ thiết bị ✓');
        } catch (e) {
          alert('Đã lưu trên máy này (lỗi đồng bộ Cloud: ' + e.message + ')');
        }
      } else {
        alert('Đã lưu cấu hình AI ✓');
      }
      closeModal();
    };
  }

  // ================= 7. MODAL ĐĂNG KÝ / MUA GÓI & VIETQR =================
  function openAuthModal() {
    injectStyles();
    closeModal();
    const wrap = document.createElement('div');
    wrap.id = 'ac-active-modal';
    wrap.className = 'ac-modal-backdrop';

    const curPhone = state.currentUser ? state.currentUser.phone : '';
    const curName = state.currentUser ? state.currentUser.name : '';

    wrap.innerHTML = `
      <div class="ac-modal-box" style="max-width:660px;">
        <div class="ac-modal-header">
          <div class="ac-modal-title">💎 Đăng Ký Tài Khoản & Nâng Cấp Gói VIP</div>
          <button class="ac-close-btn" id="ac-close-x">✕</button>
        </div>

        ${state.currentUser ? `
          <div class="ac-card" style="border-color:#10b981;">
            <div style="font-size:13px; color:#4ade80; font-weight:700;">
              ✓ Đang đăng nhập: ${esc(state.currentUser.name)} (${esc(state.currentUser.phone)})
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">
              Gói hiện tại: <b>${esc(state.currentUser.packageName || 'Dùng thử')}</b> • Hạn dùng: <b>${formatDate(state.currentUser.expiresAt)}</b>
            </div>
          </div>
        ` : ''}

        <div class="ac-grid-2" style="margin-bottom:12px;">
          <div>
            <label class="ac-label">Họ và tên khách hàng *</label>
            <input class="ac-input" id="ac-reg-name" value="${esc(curName)}" placeholder="Ví dụ: Nguyễn Văn A" />
          </div>
          <div>
            <label class="ac-label">Số điện thoại / Zalo * (Dùng để kích hoạt)</label>
            <input class="ac-input" id="ac-reg-phone" value="${esc(curPhone)}" placeholder="Ví dụ: 0912345678" />
          </div>
        </div>

        <label class="ac-label">Chọn gói sử dụng AutoCut Studio AI</label>
        <div class="ac-grid-3" id="ac-pkg-grid">
          ${Object.values(PACKAGES).map((p) => `
            <div class="ac-pkg-card ${state.selectedPkg === p.id ? 'selected' : ''}" data-pkg="${p.id}">
              <div style="font-size:11px; color:#a78bfa; font-weight:700;">${esc(p.badge)}</div>
              <div style="font-size:15px; font-weight:700; margin:4px 0;">${esc(p.name)}</div>
              <div style="font-size:18px; font-weight:800; color:#fbbf24;">${formatVND(p.price)}</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:4px;">${p.days} ngày sử dụng</div>
            </div>
          `).join('')}
        </div>

        <div id="ac-vietqr-container"></div>

        <div class="ac-row" style="justify-content:flex-end; margin-top:16px;">
          <button class="ac-btn ac-btn-ghost" id="ac-reg-cancel">Đóng</button>
          <button class="ac-btn ac-btn-primary" id="ac-reg-submit">Xác Nhận Đăng Ký & Gửi Duyệt</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    function renderVietQR() {
      const container = document.getElementById('ac-vietqr-container');
      const pkg = PACKAGES[state.selectedPkg] || PACKAGES['6M'];
      const phone = cleanPhone(document.getElementById('ac-reg-phone').value) || 'SDT_KHACH';
      const memo = `AUTOCUT ${phone} ${pkg.id}`;
      const { bankCode, accountNo, accountName } = state.payment;

      if (!accountNo) {
        container.innerHTML = `
          <div class="ac-card" style="margin-top:14px; border-color:#f59e0b;">
            <div style="font-size:13px; color:#fbbf24; font-weight:600;">
              ℹ️ Chủ shop chưa cập nhật số tài khoản nhận VietQR tự động.
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">
              Bạn vẫn có thể bấm <b>Xác Nhận Đăng Ký</b> bên dưới để lưu SĐT lên hệ thống và liên hệ Zalo Chủ Sở Hữu kích hoạt gói <b>${esc(pkg.name)} (${formatVND(pkg.price)})</b>.
            </div>
          </div>
        `;
        return;
      }

      const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNo)}-compact2.png?amount=${pkg.price}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName || '')}`;

      container.innerHTML = `
        <div class="ac-qr-box">
          <img class="ac-qr-img" src="${qrUrl}" alt="Mã QR Chuyển Khoản VietQR" />
          <div style="flex:1; font-size:13px; line-height:1.6;">
            <div style="color:#4ade80; font-weight:700; margin-bottom:4px;">Quét mã VietQR bằng App Ngân hàng bất kỳ</div>
            <div>Ngân hàng: <b>${esc(bankCode)}</b></div>
            <div>Số tài khoản: <b>${esc(accountNo)}</b>
              <button type="button" class="ac-btn ac-btn-ghost" style="padding:2px 8px; font-size:11px; margin-left:6px;" onclick="navigator.clipboard.writeText('${esc(accountNo)}');alert('Đã copy STK!');">Copy STK</button>
            </div>
            ${accountName ? `<div>Chủ tài khoản: <b>${esc(accountName)}</b></div>` : ''}
            <div>Số tiền: <b style="color:#fbbf24;">${formatVND(pkg.price)}</b></div>
            <div>Nội dung CK: <b style="color:#38bdf8;">${esc(memo)}</b>
              <button type="button" class="ac-btn ac-btn-ghost" style="padding:2px 8px; font-size:11px; margin-left:6px;" onclick="navigator.clipboard.writeText('${esc(memo)}');alert('Đã copy nội dung chuyển khoản!');">Copy Nội Dung</button>
            </div>
          </div>
        </div>
      `;
    }

    renderVietQR();

    document.getElementById('ac-close-x').onclick = closeModal;
    document.getElementById('ac-reg-cancel').onclick = closeModal;
    document.getElementById('ac-reg-phone').addEventListener('input', renderVietQR);

    document.querySelectorAll('#ac-pkg-grid .ac-pkg-card').forEach((card) => {
      card.onclick = () => {
        state.selectedPkg = card.getAttribute('data-pkg');
        document.querySelectorAll('#ac-pkg-grid .ac-pkg-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        renderVietQR();
      };
    });

    document.getElementById('ac-reg-submit').onclick = async () => {
      const name = (document.getElementById('ac-reg-name').value || '').trim();
      const phone = cleanPhone(document.getElementById('ac-reg-phone').value);
      if (!name || phone.length < 9) {
        alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại hợp lệ!');
        return;
      }
      const pkg = PACKAGES[state.selectedPkg] || PACKAGES['6M'];
      const existing = state.users[phone] || {};
      const userObj = {
        name,
        phone,
        packageId: pkg.id,
        packageName: pkg.name,
        status: existing.status === 'active' ? 'active' : 'pending',
        expiresAt: existing.expiresAt || (Date.now() + 3 * 86400000), // Tặng sẵn 3 ngày dùng thử
        createdAt: existing.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      state.users[phone] = userObj;
      state.currentUser = userObj;
      persistLocal();

      try {
        await fbPut(`users/${phone}`, userObj);
        alert(`Đăng ký thành công cho SĐT ${phone}!\nTài khoản đã được đồng bộ lên hệ thống để Chủ Sở Hữu kích hoạt gói ${pkg.name}.`);
      } catch (_) {
        alert(`Đã lưu đăng ký cho SĐT ${phone} trên thiết bị!`);
      }
      closeModal();
    };
  }

  // ================= 8. MODAL QUẢN TRỊ CHỦ SỞ HỮU =================
  function openAdminModal() {
    injectStyles();
    if (!state.isOwner) {
      const pass = prompt('Nhập Mật Khẩu Chủ Sở Hữu Độc Quyền:');
      if (pass === null) return;
      if (pass.trim() !== state.ownerPass) {
        alert('Sai mật khẩu Chủ Sở Hữu!');
        return;
      }
      state.isOwner = true;
      sessionStorage.setItem(STORAGE_KEYS.OWNER_SESSION, '1');
      updateStatusIndicators();
    }

    closeModal();
    let activeTab = 'users';

    const wrap = document.createElement('div');
    wrap.id = 'ac-active-modal';
    wrap.className = 'ac-modal-backdrop';
    wrap.innerHTML = `
      <div class="ac-modal-box">
        <div class="ac-modal-header">
          <div class="ac-modal-title">👑 Cổng Chủ Sở Hữu Độc Quyền — Quản Trị Tài Khoản & Cloud</div>
          <button class="ac-close-btn" id="ac-close-x">✕</button>
        </div>
        <div class="ac-tabs">
          <button class="ac-tab active" data-tab="users">1. Khách Hàng & SĐT</button>
          <button class="ac-tab" data-tab="cloud">2. Firebase Cloud, VietQR & Bảo Mật</button>
          <div style="flex:1;"></div>
          <button class="ac-btn ac-btn-danger" id="ac-lock-owner" style="padding:6px 12px; font-size:12px; margin-bottom:6px;">🔒 Khóa Quyền Owner</button>
        </div>
        <div id="ac-admin-body"></div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.getElementById('ac-close-x').onclick = closeModal;
    document.getElementById('ac-lock-owner').onclick = () => {
      state.isOwner = false;
      sessionStorage.removeItem(STORAGE_KEYS.OWNER_SESSION);
      updateStatusIndicators();
      closeModal();
      alert('Đã khóa quyền Chủ Sở Hữu ✓');
    };

    function renderAdminBody() {
      const body = document.getElementById('ac-admin-body');
      if (activeTab === 'users') {
        const list = Object.values(state.users || {}).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        body.innerHTML = `
          <div class="ac-card" style="overflow-x:auto;">
            <div class="ac-row" style="justify-content:space-between; margin-bottom:10px;">
              <span style="font-size:13px; font-weight:600;">Tổng số khách hàng: <b style="color:#fbbf24;">${list.length}</b></span>
              <button class="ac-btn ac-btn-ghost" id="ac-refresh-users" style="padding:6px 12px; font-size:12px;">↻ Tải mới từ Cloud</button>
            </div>
            ${list.length === 0 ? '<div style="color:#94a3b8; font-size:13px; padding:12px 0;">Chưa có khách hàng nào đăng ký.</div>' : `
              <table class="ac-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>SĐT / Zalo</th>
                    <th>Gói & Hạn dùng</th>
                    <th>Gia hạn nhanh</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.map((u) => `
                    <tr>
                      <td><b>${esc(u.name)}</b></td>
                      <td>
                        ${esc(u.phone)}
                        <button class="ac-btn ac-btn-ghost" style="padding:2px 6px; font-size:11px; margin-left:4px;" onclick="navigator.clipboard.writeText('${esc(u.phone)}');alert('Đã copy SĐT ${esc(u.phone)}');">Copy</button>
                      </td>
                      <td>
                        <span style="color:${u.status === 'active' ? '#4ade80' : '#fbbf24'}; font-weight:600;">${esc(u.packageName || 'Dùng thử')}</span><br/>
                        <span style="color:#94a3b8;">HSD: ${formatDate(u.expiresAt)}</span>
                      </td>
                      <td>
                        <div class="ac-row" style="gap:4px;">
                          <button class="ac-btn ac-btn-success" style="padding:4px 8px; font-size:11px;" data-ext="${esc(u.phone)}" data-days="30">+1T</button>
                          <button class="ac-btn ac-btn-primary" style="padding:4px 8px; font-size:11px;" data-ext="${esc(u.phone)}" data-days="180">+6T</button>
                          <button class="ac-btn ac-btn-warn" style="padding:4px 8px; font-size:11px;" data-ext="${esc(u.phone)}" data-days="365">+1N</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        `;

        document.getElementById('ac-refresh-users').onclick = async () => {
          await syncFromCloud();
          renderAdminBody();
        };

        body.querySelectorAll('[data-ext]').forEach((btn) => {
          btn.onclick = async () => {
            const phone = btn.getAttribute('data-ext');
            const days = Number(btn.getAttribute('data-days'));
            const user = state.users[phone];
            if (!user) return;
            const base = Math.max(Date.now(), Number(user.expiresAt || 0));
            user.expiresAt = base + days * 86400000;
            user.status = 'active';
            user.packageName = days === 365 ? 'Gói 1 Năm' : days === 180 ? 'Gói 6 Tháng' : 'Gói 1 Tháng';
            user.updatedAt = Date.now();
            persistLocal();
            try {
              await fbPut(`users/${phone}`, user);
            } catch (_) {}
            renderAdminBody();
          };
        });
      } else {
        body.innerHTML = `
          <div class="ac-card">
            <div class="ac-row" style="justify-content:space-between;">
              <label class="ac-label">Firebase Realtime Database URL (Đồng bộ mọi thiết bị)</label>
              <span id="ac-fb-status" style="font-size:12px; color:${state.cloudConnected ? '#4ade80' : '#fbbf24'};">
                ${state.cloudConnected ? 'Kết nối thành công ✓' : 'Chưa kiểm tra'}
              </span>
            </div>
            <div class="ac-row">
              <input class="ac-input" id="ac-fb-url" value="${esc(state.firebaseUrl)}" />
              <button class="ac-btn ac-btn-primary" id="ac-fb-test">Kết Nối & Test</button>
            </div>
          </div>

          <div class="ac-card">
            <label class="ac-label">💳 Cấu Hình Ngân Hàng Nhận Tiền VietQR Tự Động</label>
            <div class="ac-grid-3">
              <div>
                <label class="ac-label">Ngân hàng</label>
                <select class="ac-select" id="ac-bank-code">
                  ${BANKS.map((b) => `<option value="${b.code}" ${state.payment.bankCode === b.code ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="ac-label">Số tài khoản</label>
                <input class="ac-input" id="ac-bank-acc" value="${esc(state.payment.accountNo || '')}" placeholder="Nhập số tài khoản nhận tiền" />
              </div>
              <div>
                <label class="ac-label">Tên chủ tài khoản (Không dấu)</label>
                <input class="ac-input" id="ac-bank-name" value="${esc(state.payment.accountName || '')}" placeholder="NGUYEN VAN A" />
              </div>
            </div>
            <div style="margin-top:10px; text-align:right;">
              <button class="ac-btn ac-btn-success" id="ac-save-bank">Lưu & Đồng Bộ VietQR Lên Cloud</button>
            </div>
          </div>

          <div class="ac-grid-2">
            <div class="ac-card">
              <label class="ac-label">Link Web GitHub Pages</label>
              <div class="ac-row">
                <input class="ac-input" id="ac-web-url" value="${esc(state.webUrl)}" />
                <button class="ac-btn ac-btn-success" id="ac-save-web">Lưu</button>
              </div>
            </div>
            <div class="ac-card">
              <label class="ac-label">Đổi Mật Khẩu Chủ Sở Hữu</label>
              <div class="ac-row">
                <input class="ac-input" id="ac-new-pass" placeholder="Nhập mật khẩu mới..." />
                <button class="ac-btn ac-btn-warn" id="ac-save-pass">Đổi Mã</button>
              </div>
            </div>
          </div>
        `;

        document.getElementById('ac-fb-test').onclick = async () => {
          const url = (document.getElementById('ac-fb-url').value || DEFAULTS.FIREBASE_URL).trim().replace(/\/+$/, '');
          state.firebaseUrl = url;
          persistLocal();
          try {
            await fbPatch('config', {
              ai: state.aiConfig,
              payment: state.payment,
              webUrl: state.webUrl,
              updatedAt: Date.now()
            });
            state.cloudConnected = true;
            updateStatusIndicators();
            document.getElementById('ac-fb-status').textContent = 'Kết nối thành công ✓';
            document.getElementById('ac-fb-status').style.color = '#4ade80';
            alert('Kết nối Firebase Cloud thành công ✓');
          } catch (e) {
            alert('Không ghi được lên Firebase: ' + e.message);
          }
        };

        document.getElementById('ac-save-bank').onclick = async () => {
          state.payment = {
            bankCode: document.getElementById('ac-bank-code').value,
            accountNo: (document.getElementById('ac-bank-acc').value || '').trim(),
            accountName: (document.getElementById('ac-bank-name').value || '').trim().toUpperCase()
          };
          persistLocal();
          try {
            await fbPatch('config', { payment: state.payment, updatedAt: Date.now() });
            alert('Đã lưu và đồng bộ thông tin VietQR lên Firebase Cloud ✓');
          } catch (_) {
            alert('Đã lưu thông tin VietQR trên trình duyệt ✓');
          }
        };

        document.getElementById('ac-save-web').onclick = async () => {
          state.webUrl = (document.getElementById('ac-web-url').value || DEFAULTS.WEB_URL).trim();
          localStorage.setItem(STORAGE_KEYS.WEB_URL, state.webUrl);
          try { await fbPatch('config', { webUrl: state.webUrl }); } catch (_) {}
          alert('Đã lưu Link Web ✓');
        };

        document.getElementById('ac-save-pass').onclick = async () => {
          const np = (document.getElementById('ac-new-pass').value || '').trim();
          if (np.length < 4) {
            alert('Mật khẩu mới cần tối thiểu 4 ký tự!');
            return;
          }
          state.ownerPass = np;
          localStorage.setItem(STORAGE_KEYS.OWNER_PASS, np);
          try { await fbPatch('config', { ownerPass: np }); } catch (_) {}
          alert('Đã đổi mật khẩu Chủ Sở Hữu thành công ✓');
        };
      }
    }

    document.querySelectorAll('.ac-tab').forEach((t) => {
      t.onclick = () => {
        activeTab = t.getAttribute('data-tab');
        document.querySelectorAll('.ac-tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        renderAdminBody();
      };
    });

    renderAdminBody();
  }

  // ================= 9. EXPORT API TOÀN CỤC =================
  window.AutoCutAuth = {
    defaults: DEFAULTS,
    getAIConfig: () => ({ ...state.aiConfig }),
    isOwner: () => state.isOwner,
    canUseTool: () => true,
    openAdmin: openAdminModal,
    openAISettings: openAISettingsModal,
    openAuth: openAuthModal,
    syncFromCloud
  };

  // Tương thích với các hàm gọi trực tiếp trong HTML cũ
  window.openAdminModal = openAdminModal;
  window.openAISettingsModal = openAISettingsModal;
  window.openAuthModal = openAuthModal;
  window.openPricingModal = openAuthModal;

  document.addEventListener('DOMContentLoaded', () => {
    updateStatusIndicators();
    syncFromCloud();
  });
})();
