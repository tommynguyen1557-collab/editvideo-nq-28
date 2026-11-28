/**
 * AutoCut Studio AI — Add-on #2: TikTok / Shopee / Facebook Policy Guard (Bộ Lọc Chống Gậy Chính Sách)
 * Plugin cắm rời độc lập: Không sửa auth.js, crm.html, editor-ai-core.js, worker.js hay playbooks.js.
 * Đồng bộ nhánh riêng: autocut_saas/studio_addons/v7_policy_guard
 */
(function () {
  'use strict';

  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v7_policy_guard';
  const LOCAL_KEY = 'autocut_v7_policy_guard_state';

  const PLATFORMS = [
    {
      id: 'all',
      label: '🛡️ Đa nền tảng (TikTok + Shopee + FB)',
      aiRule: 'BẮT BUỘC tuân thủ chính sách quảng cáo đa nền tảng (TikTok Shop, Shopee Video, Facebook Reels): KHÔNG dùng từ khẳng định tuyệt đối (100%, số 1, tốt nhất, rẻ nhất), KHÔNG dùng từ khẳng định chữa bệnh/y tế (trị dứt điểm, chữa khỏi, đặc trị, cấp tốc), KHÔNG điều hướng sang ứng dụng ngoài (Zalo, chuyển khoản trước, sđt, link ngoài).'
    },
    {
      id: 'tiktok',
      label: '🎵 TikTok & TikTok Shop',
      aiRule: 'BẮT BUỘC tuân thủ chính sách TikTok & TikTok Shop: TUYỆT ĐỐI tránh nhắc tên nền tảng khác (Shopee, Facebook, Zalo), tránh đòi inbox/số điện thoại/chuyển khoản, tránh cam kết hiệu quả 100%, trị dứt điểm, giảm cân cấp tốc hoặc hàng fake/rep 1:1. Ưu tiên kêu gọi bấm giỏ hàng màu vàng hoặc để lại bình luận.'
    },
    {
      id: 'shopee',
      label: '🛒 Shopee Video',
      aiRule: 'BẮT BUỘC tuân thủ chính sách Shopee Video: TUYỆT ĐỐI tránh dẫn link ngoài, tránh nhắc TikTok/Facebook/Zalo/số điện thoại/chuyển khoản ngoài sàn, tránh cam kết chữa trị y tế hoặc khẳng định rẻ nhất/số 1. Ưu tiên kêu gọi bấm giỏ hàng cam góc trái.'
    },
    {
      id: 'facebook',
      label: '📘 Facebook Reels & Ads',
      aiRule: 'BẮT BUỘC tuân thủ chính sách Facebook Ads & Reels: tránh cam kết y tế/giảm cân/trị mụn dứt điểm, tránh khẳng định tuyệt đối 100%, tránh từ ngữ tài chính làm giàu nhanh hoặc chỉ trích ngoại hình cá nhân.'
    }
  ];

  // Kho quy tắc lách từ an toàn (tự động sắp xếp cụm dài trước để không đè nhau)
  const BASE_RULES = [
    // 1. Y tế / Mỹ phẩm / Spa
    { bad: 'trị mụn dứt điểm', safe: 'hỗ trợ làm dịu và cải thiện da mụn', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'trị nám tận gốc', safe: 'hỗ trợ làm đều màu và sáng da', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'chữa khỏi hoàn toàn', safe: 'hỗ trợ cải thiện rõ rệt', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'trị dứt điểm', safe: 'hỗ trợ cải thiện hiệu quả', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'diệt tận gốc', safe: 'hỗ trợ làm sạch sâu', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'đặc trị', safe: 'chăm sóc chuyên sâu', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'chữa khỏi', safe: 'hỗ trợ cải thiện', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'giảm cân cấp tốc', safe: 'hỗ trợ giữ dáng khoa học', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'trắng da cấp tốc', safe: 'giúp da trông tươi sáng rạng rỡ', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'trắng bật tông sau 3 ngày', safe: 'giúp làn da trông sáng mịn hơn', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'trắng da sau 3 ngày', safe: 'giúp da trông rạng rỡ hơn', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'không tác dụng phụ', safe: 'dịu nhẹ lành tính cho người dùng', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'thần dược', safe: 'giải pháp chăm sóc nổi bật', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'cấp tốc', safe: 'nhanh gọn tiện lợi', cat: 'Y tế/Mỹ phẩm', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },

    // 2. Khẳng định tuyệt đối / Quảng cáo quá đà
    { bad: 'cam kết hoàn tiền 100%', safe: 'chính sách hỗ trợ đổi trả minh bạch', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'cam kết hiệu quả 100%', safe: 'được nhiều khách hàng tin dùng', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'hiệu quả 100%', safe: 'hiệu quả rõ rệt', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'cam kết 100%', safe: 'tự tin về chất lượng', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'không đâu rẻ bằng', safe: 'mức giá tối ưu cho khách mới', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'rẻ nhất thị trường', safe: 'mức giá cực kỳ tối ưu', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'rẻ nhất', safe: 'mức giá rất tốt', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'tốt nhất thị trường', safe: 'chất lượng rất đáng trải nghiệm', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'tốt nhất', safe: 'chất lượng nổi bật', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'số 1 việt nam', safe: 'được đông đảo khách hàng yêu thích', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'số 1', safe: 'hàng đầu được yêu thích', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'tuyệt đối', safe: 'vượt trội', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'vĩnh viễn', safe: 'bền đẹp lâu dài', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: '100%', safe: 'trọn vẹn', cat: 'Tuyệt đối', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },

    // 3. Điều hướng ngoài nền tảng (TikTok / Shopee nhạy cảm nhất)
    { bad: 'kết bạn zalo', safe: 'nhắn tin trực tiếp tại trang', cat: 'Điều hướng', platforms: ['all', 'tiktok', 'shopee'] },
    { bad: 'nhắn tin zalo', safe: 'trao đổi trực tiếp tại đây', cat: 'Điều hướng', platforms: ['all', 'tiktok', 'shopee'] },
    { bad: 'chuyển khoản trước', safe: 'đặt hàng ngay tại giỏ hàng', cat: 'Điều hướng', platforms: ['all', 'tiktok', 'shopee'] },
    { bad: 'chuyển khoản', safe: 'đặt đơn nhanh', cat: 'Điều hướng', platforms: ['all', 'tiktok', 'shopee'] },
    { bad: 'số điện thoại', safe: 'thông tin liên hệ tại trang', cat: 'Điều hướng', platforms: ['all', 'tiktok', 'shopee'] },
    { bad: 'zalo', safe: 'tin nhắn trực tiếp', cat: 'Điều hướng', platforms: ['all', 'tiktok', 'shopee'] },
    { bad: 'link bio', safe: 'giỏ hàng bên dưới', cat: 'Điều hướng', platforms: ['all', 'shopee'] },
    { bad: 'inbox ngay', safe: 'bình luận hoặc bấm giỏ hàng', cat: 'Điều hướng', platforms: ['tiktok', 'shopee'] },
    { bad: 'ib ngay', safe: 'bình luận ngay bên dưới', cat: 'Điều hướng', platforms: ['tiktok', 'shopee'] },
    { bad: 'shopee', safe: 'gian hàng chính hãng', cat: 'Khác sàn', platforms: ['tiktok'] },
    { bad: 'facebook', safe: 'trang chính thức', cat: 'Khác sàn', platforms: ['tiktok', 'shopee'] },
    { bad: 'tiktok', safe: 'kênh video chính thức', cat: 'Khác sàn', platforms: ['shopee'] },

    // 4. Hàng hiệu / Xả kho quá đà
    { bad: 'super fake', safe: 'thiết kế thời trang cao cấp', cat: 'Bản quyền', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'hàng fake', safe: 'mẫu thiết kế phổ thông', cat: 'Bản quyền', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'rep 1:1', safe: 'phiên bản hoàn thiện tỉ mỉ', cat: 'Bản quyền', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'auth tuồn', safe: 'phiên bản số lượng giới hạn', cat: 'Bản quyền', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'xả kho lỗ vốn', safe: 'ưu đãi tri ân khách hàng', cat: 'Bán hàng', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'phá sản', safe: 'chương trình ưu đãi đặc biệt', cat: 'Bán hàng', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },

    // 5. Tài chính
    { bad: 'làm giàu nhanh', safe: 'xây dựng thu nhập bền vững', cat: 'Tài chính', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'cam kết sinh lời', safe: 'tiềm năng gia tăng giá trị', cat: 'Tài chính', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: '1 vốn 4 lời', safe: 'tối ưu biên lợi nhuận', cat: 'Tài chính', platforms: ['all', 'tiktok', 'shopee', 'facebook'] },
    { bad: 'kiếm tiền dễ dàng', safe: 'cơ hội phát triển thu nhập', cat: 'Tài chính', platforms: ['all', 'tiktok', 'shopee', 'facebook'] }
  ];

  // ================= TRẠNG THÁI & ĐỒNG BỘ FIREBASE CÁCH LY =================
  function defaultState() {
    return {
      platform: 'all',
      autoClean: true,
      customRules: [], // [{ bad, safe }]
      updatedAt: 0
    };
  }

  function loadLocalState() {
    try {
      const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (s && typeof s === 'object') return { ...defaultState(), ...s, customRules: Array.isArray(s.customRules) ? s.customRules : [] };
    } catch (_) {}
    return defaultState();
  }

  let state = loadLocalState();
  let lastAudit = { totalCaught: 0, fixedItems: [], checkedAt: 0, sourceLabel: '' };

  function saveState(syncCloud = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    if (syncCloud) {
      fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(() => {});
    }
  }

  async function pullStateFromCloud() {
    try {
      const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`);
      if (!res.ok) return;
      const remote = await res.json();
      if (remote && Number(remote.updatedAt || 0) > Number(state.updatedAt || 0)) {
        state = { ...defaultState(), ...remote, customRules: Array.isArray(remote.customRules) ? remote.customRules : [] };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
        syncUIWithState();
      }
    } catch (_) {}
  }

  // ================= LÕI QUÉT & LÁCH TỪ TIẾNG VIỆT CHUẨN UNICODE =================
  function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getActiveRules() {
    const plat = state.platform || 'all';
    const base = BASE_RULES.filter((r) => plat === 'all' ? r.platforms.includes('all') : (r.platforms.includes(plat) || r.platforms.includes('all')));
    const custom = (state.customRules || [])
      .filter((r) => r && r.bad && r.bad.trim())
      .map((r) => ({ bad: r.bad.trim(), safe: (r.safe || '').trim() || 'nội dung phù hợp', cat: 'Tùy chỉnh' }));
    return [...custom, ...base].sort((a, b) => b.bad.length - a.bad.length);
  }

  function scanAndCleanText(text, applyReplace = true) {
    if (typeof text !== 'string' || !text.trim()) return { text: text || '', hits: [] };
    const rules = getActiveRules();
    let out = text;
    const hits = [];

    for (const rule of rules) {
      const pattern = new RegExp(`(^|[\\s,.;:!?()\\[\\]"'“”/\\\\-])(${escapeRegex(rule.bad)})(?=$|[\\s,.;:!?()\\[\\]"'“”/\\\\-])`, 'gi');
      let matched = false;
      if (applyReplace) {
        out = out.replace(pattern, (full, pre, found) => {
          matched = true;
          // Giữ chữ viết hoa đầu câu nếu từ gốc viết hoa
          const isAllUpper = found === found.toUpperCase() && found !== found.toLowerCase();
          const isCap = found[0] === found[0].toUpperCase() && found[0] !== found[0].toLowerCase();
          let rep = rule.safe;
          if (isAllUpper) rep = rep.toUpperCase();
          else if (isCap) rep = rep.charAt(0).toUpperCase() + rep.slice(1);
          return pre + rep;
        });
      } else if (pattern.test(out)) {
        matched = true;
      }
      if (matched) {
        hits.push({ bad: rule.bad, safe: rule.safe, cat: rule.cat });
      }
    }
    return { text: out, hits };
  }

  function sanitizePlanObject(plan, applyReplace = true) {
    if (!plan || typeof plan !== 'object') return [];
    const allHits = [];
    const cleanField = (obj, key) => {
      if (!obj || typeof obj[key] !== 'string') return;
      const r = scanAndCleanText(obj[key], applyReplace);
      if (r.hits.length) {
        if (applyReplace) obj[key] = r.text;
        allHits.push(...r.hits);
      }
    };

    cleanField(plan, 'voiceoverScript');
    if (plan.titleCard) { cleanField(plan.titleCard, 'headline'); cleanField(plan.titleCard, 'subline'); }
    if (plan.lowerThird) { cleanField(plan.lowerThird, 'title'); cleanField(plan.lowerThird, 'subtitle'); }
    if (plan.endCard) { cleanField(plan.endCard, 'cta'); cleanField(plan.endCard, 'subCta'); }
    if (Array.isArray(plan.subtitles)) {
      plan.subtitles.forEach((s) => { cleanField(s, 'text'); cleanField(s, 'highlight'); });
    }
    if (Array.isArray(plan.stickers)) {
      plan.stickers.forEach((st) => cleanField(st, 'label'));
    }
    return allHits;
  }

  function sanitizeCriticObject(critic, applyReplace = true) {
    if (!critic || typeof critic !== 'object') return [];
    const allHits = [];
    const kit = critic.publishKit;
    if (kit) {
      ['thumbnailHeadline', 'thumbnailBadge'].forEach((k) => {
        if (typeof kit[k] === 'string') {
          const r = scanAndCleanText(kit[k], applyReplace);
          if (r.hits.length) { if (applyReplace) kit[k] = r.text; allHits.push(...r.hits); }
        }
      });
      if (Array.isArray(kit.captions)) {
        kit.captions.forEach((c) => {
          if (typeof c.text === 'string') {
            const r = scanAndCleanText(c.text, applyReplace);
            if (r.hits.length) { if (applyReplace) c.text = r.text; allHits.push(...r.hits); }
          }
        });
      }
    }
    if (critic.optimizedPlan) {
      allHits.push(...sanitizePlanObject(critic.optimizedPlan, applyReplace));
    }
    return allHits;
  }

  function dedupeHits(hits) {
    const map = new Map();
    hits.forEach((h) => map.set(h.bad.toLowerCase(), h));
    return Array.from(map.values());
  }

  function recordAudit(hits, sourceLabel) {
    const unique = dedupeHits(hits);
    lastAudit = {
      totalCaught: unique.length,
      fixedItems: unique,
      checkedAt: Date.now(),
      sourceLabel
    };
    renderAuditBox();
  }

  // ================= KẾT NỐI 2 CHIỀU AN TOÀN VÀO LUỒNG AI (KHÔNG SỬA worker.js / playbooks.js) =================
  function installPolicyFetchGuard() {
    if (window.__acPolicyGuardInstalled) return;
    window.__acPolicyGuardInstalled = true;

    const prevFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      let nextInit = init;
      let interceptedAction = null;

      try {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const isProxyPost = url.includes('autocut-ai-proxy') && init && String(init.method || 'GET').toUpperCase() === 'POST' && typeof init.body === 'string';
        if (isProxyPost) {
          const payload = JSON.parse(init.body);
          interceptedAction = payload && payload.action;
          const platInfo = PLATFORMS.find((p) => p.id === state.platform) || PLATFORMS[0];

          if (interceptedAction === 'auto_scan_and_edit') {
            const cur = (payload.userHint || '').trim();
            payload.userHint = `${cur ? cur + '\n\n' : ''}[POLICY GUARD — CHỐNG GẬY CHÍNH SÁCH]: ${platInfo.aiRule}`;
            nextInit = { ...init, body: JSON.stringify(payload) };
          } else if (interceptedAction === 'copilot_refine' && payload.userCommand) {
            payload.userCommand = `${payload.userCommand} (Lưu ý giữ ngôn từ sạch, tránh từ cấm ${platInfo.label})`;
            nextInit = { ...init, body: JSON.stringify(payload) };
          }
        }
      } catch (_) {}

      const res = await prevFetch(input, nextInit);

      if (interceptedAction && ['auto_scan_and_edit', 'copilot_refine', 'viral_critic'].includes(interceptedAction) && res && res.ok) {
        try {
          const cloned = res.clone();
          const data = await cloned.json();
          const hits = [];
          const shouldReplace = Boolean(state.autoClean);

          if (data.plan) hits.push(...sanitizePlanObject(data.plan, shouldReplace));
          if (data.critic) hits.push(...sanitizeCriticObject(data.critic, shouldReplace));

          recordAudit(hits, interceptedAction === 'viral_critic' ? 'Bộ Đăng Bài & Caption' : 'Kịch bản & Phụ đề AI');

          if (shouldReplace && hits.length > 0) {
            return new Response(JSON.stringify(data), {
              status: res.status,
              statusText: res.statusText,
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
        } catch (_) {}
      }

      return res;
    };
  }

  // ================= GIAO DIỆN HIỂN THỊ & KIỂM TRA 1 CHẠM =================
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderAuditBox() {
    const box = document.getElementById('acpg-audit-box');
    if (!box) return;
    if (!lastAudit.checkedAt) {
      box.innerHTML = '<span style="color:#94a3b8;">Sẵn sàng tự động quét Phụ đề, Lời bình, Thẻ tiêu đề & Caption trước khi Render.</span>';
      return;
    }
    if (lastAudit.totalCaught === 0) {
      box.innerHTML = `<span style="color:#4ade80; font-weight:700;">✓ Sạch 100% (${escHtml(lastAudit.sourceLabel)}) — Không phát hiện từ cấm chính sách!</span>`;
      return;
    }
    const modeTag = state.autoClean
      ? `<span style="color:#4ade80; font-weight:700;">🛡️ Đã tự lách ${lastAudit.totalCaught} cụm từ rủi ro (${escHtml(lastAudit.sourceLabel)}):</span>`
      : `<span style="color:#f87171; font-weight:700;">⚠️ Phát hiện ${lastAudit.totalCaught} cụm từ dễ ăn gậy (${escHtml(lastAudit.sourceLabel)}):</span>`;

    const listHtml = lastAudit.fixedItems.slice(0, 8).map((it) => `
      <div style="margin-top:3px; font-size:11px;">
        <span style="background:rgba(239,68,68,0.2); color:#fca5a5; padding:1px 5px; border-radius:4px; text-decoration:line-through;">${escHtml(it.bad)}</span>
        <span style="color:#94a3b8;"> → </span>
        <span style="background:rgba(16,185,129,0.2); color:#6ee7b7; padding:1px 5px; border-radius:4px;">${escHtml(it.safe)}</span>
        <span style="color:#64748b; font-size:10px;">(${escHtml(it.cat)})</span>
      </div>
    `).join('');

    box.innerHTML = `${modeTag}${listHtml}`;
  }

  function renderCustomRules() {
    const wrap = document.getElementById('acpg-custom-list');
    if (!wrap) return;
    if (!state.customRules.length) {
      wrap.innerHTML = '<div style="font-size:10.5px; color:#64748b;">Chưa có từ cấm riêng của shop.</div>';
      return;
    }
    wrap.innerHTML = state.customRules.map((r, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; background:#090e1a; padding:4px 7px; border-radius:6px; margin-top:4px; font-size:11px;">
        <span><b style="color:#fca5a5;">${escHtml(r.bad)}</b> → <b style="color:#6ee7b7;">${escHtml(r.safe)}</b></span>
        <button type="button" data-acpg-del="${idx}" style="border:none; background:#7f1d1d; color:#fff; border-radius:4px; padding:1px 6px; font-size:10px; cursor:pointer;">✕</button>
      </div>
    `).join('');
    wrap.querySelectorAll('[data-acpg-del]').forEach((b) => {
      b.onclick = () => {
        state.customRules.splice(Number(b.getAttribute('data-acpg-del')), 1);
        saveState(true);
        renderCustomRules();
      };
    });
  }

  function syncUIWithState() {
    const sel = document.getElementById('acpg-platform');
    if (sel) sel.value = state.platform || 'all';
    const chk = document.getElementById('acpg-autoclean');
    if (chk) chk.checked = Boolean(state.autoClean);
    renderCustomRules();
    renderAuditBox();
  }

  function runQuickCleanOnTextarea(textareaId, statusTargetId, label) {
    const ta = document.getElementById(textareaId);
    if (!ta) return;
    const raw = (ta.value || '').trim();
    if (!raw) {
      if (statusTargetId) {
        const s = document.getElementById(statusTargetId);
        if (s) s.innerHTML = '<span style="color:#fbbf24;">Chưa có nội dung để quét!</span>';
      }
      return;
    }
    const res = scanAndCleanText(raw, true);
    ta.value = res.text;
    recordAudit(res.hits, label);
    if (statusTargetId) {
      const s = document.getElementById(statusTargetId);
      if (s) {
        s.innerHTML = res.hits.length
          ? `<span style="color:#4ade80;">🛡️ Đã tự lách an toàn <b>${res.hits.length}</b> cụm từ cấm: ${res.hits.map((h) => `"${escHtml(h.bad)}" → "${escHtml(h.safe)}"`).join(', ')}</span>`
          : '<span style="color:#4ade80;">✓ Văn bản sạch 100%, không có từ vi phạm chính sách!</span>';
      }
    }
  }

  function mountPolicyGuardUI() {
    const tabAuto = document.getElementById('ac-tab-auto');
    if (!tabAuto || document.getElementById('acpg-card')) return false;

    const card = document.createElement('div');
    card.id = 'acpg-card';
    card.style.cssText = 'background:#11192d; border:1px solid #0f766e; border-radius:12px; padding:11px; margin-bottom:11px;';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11px; font-weight:800; color:#2dd4bf; text-transform:uppercase;">🛡️ Chống Gậy Chính Sách (Policy Guard)</span>
        <span style="font-size:10px; color:#4ade80; font-weight:700;">Add-on #2</span>
      </div>
      <select id="acpg-platform" class="acp-sel" style="margin-bottom:7px;">
        ${PLATFORMS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}
      </select>
      <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:#e2e8f0; cursor:pointer; margin-bottom:7px;">
        <input type="checkbox" id="acpg-autoclean" checked />
        Tự động lách từ cấm cho Phụ đề, Lời bình & Caption khi AI dựng
      </label>
      <div style="display:flex; gap:6px; margin-bottom:7px;">
        <button type="button" class="acp-btn" id="acpg-scan-hint" style="flex:1; background:#0f766e; font-size:11px;">🧹 Quét & Lách ô Yêu cầu</button>
        <button type="button" class="acp-btn" id="acpg-toggle-custom" style="font-size:11px;">+ Từ cấm riêng</button>
      </div>
      <div id="acpg-custom-box" style="display:none; background:#0a0f1d; border:1px solid #23304d; border-radius:8px; padding:8px; margin-bottom:7px;">
        <div style="font-size:10.5px; color:#94a3b8; margin-bottom:5px;">Thêm từ nhạy cảm riêng ngành của bạn (tự đồng bộ Cloud):</div>
        <div style="display:flex; gap:5px;">
          <input id="acpg-bad-inp" class="acp-inp" placeholder="Từ cấm..." style="flex:1; padding:6px 8px;" />
          <input id="acpg-safe-inp" class="acp-inp" placeholder="Đổi thành..." style="flex:1; padding:6px 8px;" />
          <button type="button" class="acp-btn acp-btn-green" id="acpg-add-rule" style="padding:6px 10px;">Lưu</button>
        </div>
        <div id="acpg-custom-list" style="margin-top:5px;"></div>
      </div>
      <div id="acpg-audit-box" style="background:#090e1a; border:1px solid #1e293b; border-radius:8px; padding:7px 9px; font-size:11px; line-height:1.45;"></div>
    `;

    // Đặt ngay dưới thẻ Playbooks (Add-on #1) hoặc ngay dưới khung Học Hành Vi
    const pbCard = document.getElementById('acpb-card');
    const firstSec = tabAuto.querySelector('.acp-sec');
    if (pbCard && pbCard.nextSibling) {
      tabAuto.insertBefore(card, pbCard.nextSibling);
    } else if (firstSec && firstSec.nextSibling) {
      tabAuto.insertBefore(card, firstSec.nextSibling);
    } else {
      tabAuto.prepend(card);
    }

    // Gắn thêm nút kiểm tra 1 chạm ngay dưới ô Lời Bình TTS ở Tab 3
    const ttsText = document.getElementById('ac-tts-text');
    if (ttsText && !document.getElementById('acpg-tts-bar')) {
      const ttsBar = document.createElement('div');
      ttsBar.id = 'acpg-tts-bar';
      ttsBar.style.cssText = 'margin-top:6px; background:#090e1a; border:1px solid #0f766e; border-radius:8px; padding:7px 9px;';
      ttsBar.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <span style="font-size:11px; color:#2dd4bf; font-weight:700;">🛡️ Kiểm tra lời bình trước khi đọc AI</span>
          <button type="button" class="acp-btn" id="acpg-clean-tts-btn" style="padding:4px 9px; font-size:11px; background:#0f766e;">Lách Từ Cấm (1 chạm)</button>
        </div>
        <div id="acpg-tts-status" style="font-size:11px; margin-top:4px; line-height:1.4;"></div>
      `;
      ttsText.insertAdjacentElement('afterend', ttsBar);
      document.getElementById('acpg-clean-tts-btn').onclick = () => runQuickCleanOnTextarea('ac-tts-text', 'acpg-tts-status', 'Lời bình TTS');
    }

    document.getElementById('acpg-platform').onchange = (e) => {
      state.platform = e.target.value;
      saveState(true);
    };
    document.getElementById('acpg-autoclean').onchange = (e) => {
      state.autoClean = e.target.checked;
      saveState(true);
      renderAuditBox();
    };
    document.getElementById('acpg-scan-hint').onclick = () => runQuickCleanOnTextarea('ac-auto-hint', null, 'Ô Yêu cầu');
    document.getElementById('acpg-toggle-custom').onclick = () => {
      const b = document.getElementById('acpg-custom-box');
      b.style.display = b.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('acpg-add-rule').onclick = () => {
      const bad = (document.getElementById('acpg-bad-inp').value || '').trim();
      const safe = (document.getElementById('acpg-safe-inp').value || '').trim();
      if (!bad || !safe) { alert('Nhập đủ "Từ cấm" và cụm từ "Đổi thành"!'); return; }
      state.customRules = [{ bad, safe }, ...state.customRules.filter((r) => r.bad.toLowerCase() !== bad.toLowerCase())].slice(0, 30);
      document.getElementById('acpg-bad-inp').value = '';
      document.getElementById('acpg-safe-inp').value = '';
      saveState(true);
      renderCustomRules();
    };

    syncUIWithState();
    pullStateFromCloud();
    return true;
  }

  installPolicyFetchGuard();

  let tries = 0;
  const bootTimer = setInterval(() => {
    tries += 1;
    if (mountPolicyGuardUI() || tries > 60) {
      clearInterval(bootTimer);
    }
  }, 250);
})();
