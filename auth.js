/**
 * AutoCut Studio AI — CORE 1: Authentication, Strict Owner Access & Cloud Sync
 * Freeze this module once verified. Do NOT mix video editor or AI logic here.
 */
(function (window) {
  'use strict';

  const OWNER_DEFAULT_PASS = 'NGOQUOC-28-12';
  const MASTER_KEY = 'AUTOCUT_MASTER_PERSISTENT_DB';
  const LEGACY_KEYS = [
    'autocut_enterprise_saas_v18', 'autocut_enterprise_saas_v17',
    'autocut_enterprise_saas_v16', 'autocut_enterprise_saas_v15',
    'autocut_enterprise_saas_v14', 'autocut_enterprise_saas_v13',
    'autocut_enterprise_saas_v12', 'autocut_enterprise_saas_v11',
    'autocut_enterprise_saas_v10', 'autocut_enterprise_saas_v9',
    'autocut_enterprise_saas_v8', 'autocut_enterprise_saas_v7'
  ];

  const memStore = {};
  const getStore = (k) => { try { return localStorage.getItem(k); } catch { return memStore[k] || null; } };
  const setStore = (k, v) => { try { localStorage.setItem(k, v); } catch { memStore[k] = v; } };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function cleanFbUrl(u) {
    if (!u) return '';
    let url = u.trim().replace(/\/autocut_saas\.json.*$/i, '').replace(/\/+$/, '');
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }

  async function fetchTimed(url, opts = {}, ms = 4000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  function initDatabase() {
    let base = null;
    try {
      const raw = getStore(MASTER_KEY);
      if (raw) base = JSON.parse(raw);
    } catch {}

    if (!base) {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      base = {
        ownerEmail: 'admin@autocut.vn',
        ownerMasterPass: OWNER_DEFAULT_PASS,
        githubUrl: 'https://tommynguyen1557-collab.github.io/editvideo-nq-28/',
        firebaseUrl: '',
        aiProvider: 'builtin',
        aiProxyUrl: '',
        geminiApiKey: '',
        currentSession: null,
        subAccounts: [
          {
            id: 'SUB-01',
            name: 'Studio Bạc Mẫu',
            phone: '0900000000',
            email: 'silver@studio.vn',
            password: '123',
            plan: 'Pro Creator 1 Năm (1.490.000đ)',
            status: 'active',
            createdAt: new Date().toISOString(),
            expiresAt: exp.toISOString(),
            permissions: { autoEdit: true, export4k: true }
          }
        ]
      };
    }

    // Enforce owner password NGOQUOC-28-12 over any old defaults
    if (!base.ownerMasterPass || base.ownerMasterPass === 'OWNER-MASTER-2026') {
      base.ownerMasterPass = OWNER_DEFAULT_PASS;
    }
    // Invalidate unverified owner sessions
    if (base.currentSession && base.currentSession.role === 'owner' && base.currentSession.verifiedKey !== base.ownerMasterPass) {
      base.currentSession = null;
    }
    if (!base.aiProvider) base.aiProvider = 'builtin';
    if (!Array.isArray(base.subAccounts)) base.subAccounts = [];

    // Migrate accounts from any legacy version without duplicates
    const emailSet = new Set(base.subAccounts.map((u) => (u.email || '').toLowerCase()));
    LEGACY_KEYS.forEach((oldKey) => {
      try {
        const oldRaw = getStore(oldKey);
        if (!oldRaw) return;
        const oldData = JSON.parse(oldRaw);
        if (oldData.firebaseUrl && !base.firebaseUrl) base.firebaseUrl = oldData.firebaseUrl;
        if (oldData.geminiApiKey && !base.geminiApiKey) base.geminiApiKey = oldData.geminiApiKey;
        if (Array.isArray(oldData.subAccounts)) {
          oldData.subAccounts.forEach((acc) => {
            const em = (acc && acc.email || '').toLowerCase();
            if (em && !emailSet.has(em)) {
              emailSet.add(em);
              base.subAccounts.push(acc);
            }
          });
        }
      } catch {}
    });

    setStore(MASTER_KEY, JSON.stringify(base));
    return base;
  }

  let sysData = initDatabase();

  function isOwner() {
    return Boolean(
      sysData.currentSession &&
      sysData.currentSession.role === 'owner' &&
      sysData.currentSession.verifiedKey === sysData.ownerMasterPass
    );
  }

  function getPerms() {
    if (isOwner()) {
      return { role: 'owner', name: 'Chủ Sở Hữu', autoEdit: true, export4k: true, expiresAt: null };
    }
    if (sysData.currentSession && sysData.currentSession.role === 'sub') {
      const sub = sysData.subAccounts.find((u) => u.email.toLowerCase() === sysData.currentSession.email.toLowerCase());
      if (sub && sub.status === 'active' && new Date(sub.expiresAt) > new Date()) {
        return {
          role: 'sub',
          name: sub.name,
          autoEdit: Boolean(sub.permissions && sub.permissions.autoEdit),
          export4k: Boolean(sub.permissions && sub.permissions.export4k),
          expiresAt: sub.expiresAt
        };
      }
    }
    return { role: 'guest', name: 'Khách Trải Nghiệm', autoEdit: true, export4k: false, expiresAt: null };
  }

  function getAiConfig() {
    return {
      provider: sysData.aiProvider || 'builtin',
      proxyUrl: sysData.aiProxyUrl || '',
      apiKey: sysData.geminiApiKey || ''
    };
  }

  async function saveDb(pushCloud = true) {
    setStore(MASTER_KEY, JSON.stringify(sysData));
    refreshUI();
    if (pushCloud && sysData.firebaseUrl) {
      try {
        const res = await fetchTimed(`${cleanFbUrl(sysData.firebaseUrl)}/autocut_saas.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerMasterPass: sysData.ownerMasterPass,
            githubUrl: sysData.githubUrl,
            aiProvider: sysData.aiProvider,
            aiProxyUrl: sysData.aiProxyUrl,
            geminiApiKey: sysData.geminiApiKey,
            subAccounts: sysData.subAccounts
          })
        });
        return res.ok;
      } catch {
        return false;
      }
    }
    return true;
  }

  async function syncFromCloud(showAlert = false) {
    if (!sysData.firebaseUrl) return false;
    try {
      const res = await fetchTimed(`${cleanFbUrl(sysData.firebaseUrl)}/autocut_saas.json`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const remote = await res.json();
      if (!remote) {
        await saveDb(true);
      } else {
        if (Array.isArray(remote.subAccounts)) {
          const map = new Map();
          sysData.subAccounts.forEach((u) => map.set(u.email.toLowerCase(), u));
          remote.subAccounts.forEach((u) => map.set(u.email.toLowerCase(), u));
          sysData.subAccounts = Array.from(map.values());
        }
        if (remote.githubUrl) sysData.githubUrl = remote.githubUrl;
        if (remote.aiProvider) sysData.aiProvider = remote.aiProvider;
        if (remote.aiProxyUrl) sysData.aiProxyUrl = remote.aiProxyUrl;
        if (remote.geminiApiKey) sysData.geminiApiKey = remote.geminiApiKey;
        if (remote.ownerMasterPass && remote.ownerMasterPass !== 'OWNER-MASTER-2026') {
          sysData.ownerMasterPass = remote.ownerMasterPass;
        }
        setStore(MASTER_KEY, JSON.stringify(sysData));
        refreshUI();
        if (isOwner()) renderSubTable();
      }
      if (showAlert) alert('Đồng bộ thành công với Firebase Cloud!');
      return true;
    } catch (err) {
      if (showAlert) alert('Lỗi kết nối Firebase: ' + err.message + '. Hãy kiểm tra URL và bật Test Mode!');
      return false;
    }
  }

  function refreshUI() {
    const p = getPerms();
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    setText('headerUserName', p.name);
    setText('userAvatarBadge', p.name.charAt(0).toUpperCase());
    setText('cloudStatusDot', sysData.firebaseUrl ? 'Cloud: Đã nối ✓' : 'Cloud: Local');

    const aiLabel = sysData.aiProvider === 'proxy' && sysData.aiProxyUrl
      ? 'AI: Proxy Server ✓'
      : sysData.aiProvider === 'gemini' && sysData.geminiApiKey
        ? 'AI: Gemini API ✓'
        : 'AI: Tích hợp sẵn';
    setText('aiEngineStatusDot', aiLabel);

    const badge = document.getElementById('headerRoleBadge');
    const summary = document.getElementById('permissionSummaryText');
    const authBtn = document.getElementById('authBtnLabel');

    if (p.role === 'owner') {
      if (badge) {
        badge.innerText = 'CHỦ SỞ HỮU';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40';
      }
      setText('headerUserExpiry', 'Toàn quyền quản trị');
      if (summary) summary.innerHTML = 'Quyền Chủ Sở Hữu: <b>Mở khóa 100% & Xuất 4K</b>';
      if (authBtn) authBtn.innerText = 'Tài Khoản Owner';
    } else if (p.role === 'sub') {
      if (badge) {
        badge.innerText = 'TÀI KHOẢN CON';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
      }
      setText('headerUserExpiry', 'Hết hạn: ' + new Date(p.expiresAt).toLocaleDateString('vi-VN'));
      if (summary) summary.innerText = `Quyền: AI (${p.autoEdit ? '✓' : '✕'}) • 2K/4K (${p.export4k ? '✓' : '✕'})`;
      if (authBtn) authBtn.innerText = 'Đổi Tài Khoản';
    } else {
      if (badge) {
        badge.innerText = 'KHÁCH';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300';
      }
      setText('headerUserExpiry', 'Chưa đăng nhập');
      if (summary) summary.innerText = 'Chế độ Khách: Xuất tối đa 1080p.';
      if (authBtn) authBtn.innerText = 'Đăng Nhập';
    }
  }

  // Modal helpers
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  // Auth Flows
  function openAuthModal(tab = 'login') {
    openModal('authModal');
    switchAuthTab(tab);
    syncFromCloud(false);
  }

  function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('loginFormPanel').classList.toggle('hidden', !isLogin);
    document.getElementById('registerFormPanel').classList.toggle('hidden', isLogin);
    document.getElementById('authSwitchLogin').className = isLogin ? 'py-2 rounded-lg bg-indigo-600 text-white' : 'py-2 rounded-lg text-zinc-400';
    document.getElementById('authSwitchRegister').className = !isLogin ? 'py-2 rounded-lg bg-indigo-600 text-white' : 'py-2 rounded-lg text-zinc-400';
  }

  function selectPlanAndRegister(planName) {
    closeModal('pricingModal');
    openAuthModal('register');
    const sel = document.getElementById('regPlanSelect');
    if (sel) sel.value = planName;
  }

  async function handleLoginSubmit() {
    const btn = document.getElementById('loginSubmitBtn');
    const email = document.getElementById('loginEmailInput').value.trim().toLowerCase();
    const pass = document.getElementById('loginPasswordInput').value.trim();

    if (!email || !pass) return alert('Vui lòng nhập đầy đủ Email và Mật khẩu!');

    if (btn) { btn.disabled = true; btn.innerText = 'Đang xác thực...'; }
    try {
      if (sysData.firebaseUrl) await syncFromCloud(false);

      // Strict Owner Authentication
      if ((email === sysData.ownerEmail || email === 'owner' || email === 'admin') && pass === sysData.ownerMasterPass) {
        sysData.currentSession = { role: 'owner', email: sysData.ownerEmail, verifiedKey: sysData.ownerMasterPass };
        await saveDb(false);
        closeModal('authModal');
        alert('Đăng nhập thành công với quyền Chủ Sở Hữu!');
        return;
      }

      const sub = sysData.subAccounts.find((u) => u.email.toLowerCase() === email && u.password === pass);
      if (!sub) return alert('Sai Email hoặc Mật khẩu!');
      if (sub.status === 'pending') return alert('Tài khoản đang chờ Chủ Sở Hữu duyệt kích hoạt!');
      if (sub.status === 'locked') return alert('Tài khoản này đang bị Chủ Sở Hữu tạm khóa!');
      if (new Date(sub.expiresAt) < new Date()) return alert('Tài khoản đã hết hạn sử dụng. Vui lòng liên hệ gia hạn!');

      sysData.currentSession = { role: 'sub', email: sub.email };
      await saveDb(false);
      closeModal('authModal');
    } finally {
      if (btn) { btn.disabled = false; btn.innerText = 'Đăng Nhập Ngay'; }
    }
  }

  async function handleRegisterSubmit() {
    const name = document.getElementById('regNameInput').value.trim();
    const phone = document.getElementById('regPhoneInput').value.trim();
    const email = document.getElementById('regEmailInput').value.trim().toLowerCase();
    const password = document.getElementById('regPasswordInput').value.trim();
    const plan = document.getElementById('regPlanSelect').value;

    if (!name || !phone || !email || !password) {
      return alert('Vui lòng nhập đủ Họ tên, Số điện thoại/Zalo, Email và Mật khẩu!');
    }
    if (phone.replace(/\D/g, '').length < 9) {
      return alert('Số điện thoại không hợp lệ (cần tối thiểu 9 chữ số)!');
    }
    if (sysData.firebaseUrl) await syncFromCloud(false);
    if (sysData.subAccounts.some((u) => u.email.toLowerCase() === email) || email === sysData.ownerEmail) {
      return alert('Email này đã được đăng ký!');
    }

    let days = 365;
    if (plan.includes('1 Tháng')) days = 30;
    else if (plan.includes('6 Tháng')) days = 180;

    const exp = new Date();
    exp.setDate(exp.getDate() + days);

    sysData.subAccounts.unshift({
      id: 'SUB-' + Math.floor(100 + Math.random() * 900),
      name,
      phone,
      email,
      password,
      plan,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: exp.toISOString(),
      permissions: { autoEdit: true, export4k: true }
    });

    await saveDb(true);
    alert(`Đăng ký "${plan}" thành công!\nSĐT (${phone}) đã gửi tới Chủ Sở Hữu để liên hệ kích hoạt.`);
    document.getElementById('regNameInput').value = '';
    document.getElementById('regPhoneInput').value = '';
    document.getElementById('regEmailInput').value = '';
    document.getElementById('regPasswordInput').value = '';
    switchAuthTab('login');
    document.getElementById('loginEmailInput').value = email;
  }

  function logoutAccount() {
    sysData.currentSession = null;
    saveDb(false);
    closeModal('authModal');
    closeModal('ownerDashboardModal');
  }

  // Owner Dashboard
  function openOwnerDashboard() {
    openModal('ownerDashboardModal');
    if (isOwner()) {
      showOwnerUnlockedView();
    } else {
      document.getElementById('ownerAuthGate').classList.remove('hidden');
      document.getElementById('ownerControlContent').classList.add('hidden');
      document.getElementById('ownerMasterPassInput').value = '';
    }
  }

  function verifyOwnerMaster() {
    const val = document.getElementById('ownerMasterPassInput').value.trim();
    if (val === sysData.ownerMasterPass) {
      sysData.currentSession = { role: 'owner', email: sysData.ownerEmail, verifiedKey: sysData.ownerMasterPass };
      saveDb(false);
      showOwnerUnlockedView();
    } else {
      alert('Sai mật khẩu Chủ Sở Hữu!');
    }
  }

  function showOwnerUnlockedView() {
    document.getElementById('ownerAuthGate').classList.add('hidden');
    document.getElementById('ownerControlContent').classList.remove('hidden');
    document.getElementById('firebaseUrlInput').value = sysData.firebaseUrl || '';
    document.getElementById('githubUrlInput').value = sysData.githubUrl || '';
    renderSubTable();
  }

  function lockOwnerSession() {
    sysData.currentSession = null;
    saveDb(false);
    document.getElementById('ownerAuthGate').classList.remove('hidden');
    document.getElementById('ownerControlContent').classList.add('hidden');
    document.getElementById('ownerMasterPassInput').value = '';
  }

  function switchOwnerTab(tab) {
    document.querySelectorAll('.own-tab').forEach((b) => { b.className = 'own-tab py-3 px-4 text-zinc-400'; });
    document.getElementById('own-tab-' + tab).className = 'own-tab py-3 px-4 text-amber-400 border-b-2 border-amber-400';
    document.querySelectorAll('.own-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById('own-panel-' + tab).classList.remove('hidden');
  }

  async function createSubAccountByOwner() {
    if (!isOwner()) return alert('Không có quyền Chủ Sở Hữu!');
    const name = document.getElementById('newSubName').value.trim();
    const phone = document.getElementById('newSubPhone').value.trim() || 'Chưa cập nhật';
    const email = document.getElementById('newSubEmail').value.trim().toLowerCase();
    const password = document.getElementById('newSubPass').value.trim() || '123456';
    const days = parseInt(document.getElementById('newSubDuration').value, 10);

    if (!name || !email) return alert('Nhập tên và email khách hàng!');
    if (sysData.subAccounts.some((u) => u.email.toLowerCase() === email)) return alert('Email này đã tồn tại!');

    const planLabel = days === 30 ? 'Gói 1 Tháng (139k)' : days === 180 ? 'Gói 6 Tháng (699k)' : days === 365 ? 'Gói 1 Năm (1.490k)' : 'Gói 2 Năm';
    const exp = new Date();
    exp.setDate(exp.getDate() + days);

    sysData.subAccounts.unshift({
      id: 'SUB-' + Math.floor(100 + Math.random() * 900),
      name,
      phone,
      email,
      password,
      plan: planLabel,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: exp.toISOString(),
      permissions: { autoEdit: true, export4k: true }
    });

    document.getElementById('newSubName').value = '';
    document.getElementById('newSubPhone').value = '';
    document.getElementById('newSubEmail').value = '';
    await saveDb(true);
    renderSubTable();
  }

  async function toggleSubPerm(id, key) {
    if (!isOwner()) return;
    const sub = sysData.subAccounts.find((u) => u.id === id);
    if (sub) { sub.permissions[key] = !sub.permissions[key]; await saveDb(true); }
  }

  async function toggleSubStatus(id) {
    if (!isOwner()) return;
    const sub = sysData.subAccounts.find((u) => u.id === id);
    if (sub) { sub.status = sub.status === 'active' ? 'locked' : 'active'; await saveDb(true); renderSubTable(); }
  }

  async function renewSubDays(id, days) {
    if (!isOwner()) return;
    const sub = sysData.subAccounts.find((u) => u.id === id);
    if (sub) {
      const base = new Date(sub.expiresAt) > new Date() ? new Date(sub.expiresAt) : new Date();
      base.setDate(base.getDate() + days);
      sub.expiresAt = base.toISOString();
      sub.status = 'active';
      await saveDb(true);
      renderSubTable();
    }
  }

  async function deleteSub(id) {
    if (!isOwner()) return;
    if (!confirm('Xóa vĩnh viễn tài khoản khách hàng này?')) return;
    sysData.subAccounts = sysData.subAccounts.filter((u) => u.id !== id);
    await saveDb(true);
    renderSubTable();
  }

  function copyPhone(phone) {
    navigator.clipboard.writeText(phone);
    alert('Đã sao chép SĐT / Zalo: ' + phone);
  }

  function copyInvite(email, pass) {
    const msg = `AutoCut Studio AI: ${sysData.githubUrl}\nEmail: ${email}\nMật khẩu: ${pass}`;
    navigator.clipboard.writeText(msg);
    alert('Đã sao chép thông tin đăng nhập để gửi cho khách!');
  }

  function renderSubTable() {
    const tbody = document.getElementById('subAccountsTableBody');
    document.getElementById('subAccountCount').innerText = sysData.subAccounts.length;
    const now = new Date();
    let activeC = 0, pendingC = 0, expC = 0;

    tbody.innerHTML = sysData.subAccounts.map((s) => {
      const expDate = new Date(s.expiresAt);
      const daysLeft = Math.ceil((expDate - now) / 86400000);
      if (s.status === 'active' && daysLeft > 0) activeC++;
      if (s.status === 'pending') pendingC++;
      if (s.status === 'active' && daysLeft > 0 && daysLeft <= 7) expC++;

      const statusHtml = s.status === 'pending'
        ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Chờ duyệt</span>'
        : (s.status === 'locked' || daysLeft <= 0)
          ? '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">Khóa / Hết hạn</span>'
          : `<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Hoạt động (${daysLeft}d)</span>`;

      return `
        <tr class="hover:bg-zinc-900/50">
          <td class="p-2.5">
            <div class="font-bold text-white">${escapeHtml(s.name)}</div>
            <div class="text-[10px] text-zinc-400">${escapeHtml(s.email)} • <span class="text-indigo-400">${escapeHtml(s.plan || 'Gói 1 Năm')}</span></div>
          </td>
          <td class="p-2.5 whitespace-nowrap">
            <span class="font-mono text-emerald-400 font-semibold">${escapeHtml(s.phone || 'Chưa có')}</span>
            ${s.phone ? `<button type="button" onclick="AuthCore.copyPhone('${escapeHtml(s.phone)}')" class="ml-1 text-[10px] text-zinc-400 hover:text-white" title="Copy SĐT"><i class="fa-solid fa-copy"></i></button>` : ''}
          </td>
          <td class="p-2.5 font-mono text-zinc-300">${escapeHtml(s.password)}</td>
          <td class="p-2.5 text-center"><input type="checkbox" ${s.permissions && s.permissions.autoEdit ? 'checked' : ''} onchange="AuthCore.toggleSubPerm('${s.id}','autoEdit')" class="accent-indigo-500 cursor-pointer" /></td>
          <td class="p-2.5 text-center"><input type="checkbox" ${s.permissions && s.permissions.export4k ? 'checked' : ''} onchange="AuthCore.toggleSubPerm('${s.id}','export4k')" class="accent-purple-500 cursor-pointer" /></td>
          <td class="p-2.5 whitespace-nowrap">${expDate.toLocaleDateString('vi-VN')}</td>
          <td class="p-2.5 whitespace-nowrap">${statusHtml}</td>
          <td class="p-2.5 text-right space-x-1 whitespace-nowrap">
            <button type="button" onclick="AuthCore.copyInvite('${escapeHtml(s.email)}','${escapeHtml(s.password)}')" class="px-1.5 py-1 rounded bg-zinc-800 hover:bg-indigo-600 text-[10px] text-white" title="Copy thông tin gửi khách"><i class="fa-solid fa-share-nodes"></i></button>
            <button type="button" onclick="AuthCore.renewSubDays('${s.id}',30)" class="px-1.5 py-1 rounded bg-sky-600/20 text-sky-300">+1T</button>
            <button type="button" onclick="AuthCore.renewSubDays('${s.id}',180)" class="px-1.5 py-1 rounded bg-emerald-600/20 text-emerald-300">+6T</button>
            <button type="button" onclick="AuthCore.renewSubDays('${s.id}',365)" class="px-1.5 py-1 rounded bg-indigo-600/20 text-indigo-300">+1N</button>
            <button type="button" onclick="AuthCore.toggleSubStatus('${s.id}')" class="px-1.5 py-1 rounded bg-amber-500/20 text-amber-300">${s.status === 'active' ? 'Khóa' : 'Duyệt/Mở'}</button>
            <button type="button" onclick="AuthCore.deleteSub('${s.id}')" class="px-1.5 py-1 rounded bg-zinc-800 text-red-400">Xóa</button>
          </td>
        </tr>`;
    }).join('');

    document.getElementById('statActiveSubs').innerText = activeC;
    document.getElementById('statPendingSubs').innerText = pendingC;
    document.getElementById('statExpiringSubs').innerText = expC;
  }

  function exportBackupJson() {
    if (!isOwner()) return;
    const blob = new Blob([JSON.stringify(sysData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AutoCut_Accounts_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function importBackupJson(e) {
    if (!isOwner()) return;
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed.subAccounts)) {
          const map = new Map();
          sysData.subAccounts.forEach((u) => map.set(u.email.toLowerCase(), u));
          parsed.subAccounts.forEach((u) => map.set(u.email.toLowerCase(), u));
          sysData.subAccounts = Array.from(map.values());
          await saveDb(true);
          renderSubTable();
          alert(`Đã khôi phục thành công ${sysData.subAccounts.length} tài khoản!`);
        }
      } catch {
        alert('File sao lưu JSON không hợp lệ!');
      }
    };
    reader.readAsText(f);
  }

  async function saveFirebaseConfig() {
    if (!isOwner()) return;
    const statusEl = document.getElementById('firebaseTestStatus');
    sysData.firebaseUrl = cleanFbUrl(document.getElementById('firebaseUrlInput').value);
    document.getElementById('firebaseUrlInput').value = sysData.firebaseUrl;
    if (!sysData.firebaseUrl) {
      await saveDb(false);
      if (statusEl) statusEl.innerText = 'Đã ngắt kết nối';
      return;
    }
    if (statusEl) statusEl.innerText = 'Đang kiểm tra...';
    const ok = await saveDb(true);
    if (statusEl) {
      statusEl.innerText = ok ? 'Kết nối thành công ✓' : 'Lỗi kết nối ✕';
      statusEl.className = ok ? 'text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold' : 'text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold';
    }
    alert(ok ? 'Kết nối Firebase Cloud thành công!' : 'Không ghi được lên Firebase. Hãy kiểm tra URL hoặc bật Test Mode!');
  }

  async function saveGithubUrl() {
    if (!isOwner()) return;
    sysData.githubUrl = document.getElementById('githubUrlInput').value.trim();
    await saveDb(true);
    alert('Đã lưu Link Web!');
  }

  async function updateOwnerMasterPass() {
    if (!isOwner()) return;
    const next = document.getElementById('newOwnerMasterPass').value.trim();
    if (next.length < 4) return alert('Mật khẩu tối thiểu 4 ký tự!');
    sysData.ownerMasterPass = next;
    sysData.currentSession.verifiedKey = next;
    await saveDb(true);
    document.getElementById('newOwnerMasterPass').value = '';
    alert('Đã cập nhật mật khẩu Chủ Sở Hữu mới!');
  }

  // AI Settings Modal
  function openAiConfigModal() {
    document.getElementById('aiProviderSelect').value = sysData.aiProvider || 'builtin';
    document.getElementById('aiProxyUrlInput').value = sysData.aiProxyUrl || '';
    document.getElementById('aiApiKeyInput').value = sysData.geminiApiKey || '';
    openModal('aiConfigModal');
  }

  async function saveAiSettings() {
    sysData.aiProvider = document.getElementById('aiProviderSelect').value;
    sysData.aiProxyUrl = document.getElementById('aiProxyUrlInput').value.trim();
    sysData.geminiApiKey = document.getElementById('aiApiKeyInput').value.trim();
    await saveDb(isOwner());
    closeModal('aiConfigModal');
    alert('Đã lưu cấu hình AI!');
  }

  // Close active modal on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach((m) => m.classList.remove('active'));
    }
  });

  // Expose clean public API
  window.AuthCore = {
    isOwner, getPerms, getAiConfig,
    openModal, closeModal,
    openAuthModal, switchAuthTab, selectPlanAndRegister,
    handleLoginSubmit, handleRegisterSubmit, logoutAccount,
    openOwnerDashboard, verifyOwnerMaster, lockOwnerSession, switchOwnerTab,
    createSubAccountByOwner, toggleSubPerm, toggleSubStatus, renewSubDays, deleteSub,
    copyPhone, copyInvite, exportBackupJson, importBackupJson,
    saveFirebaseConfig, saveGithubUrl, updateOwnerMasterPass, syncFromCloud,
    openAiConfigModal, saveAiSettings
  };

  // Boot AuthCore
  refreshUI();
  syncFromCloud(false);
})(window);
