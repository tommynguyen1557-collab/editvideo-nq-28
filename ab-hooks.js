/**
 * AutoCut Studio AI — Add-on #4: A/B Hook Generator (Nhân Bản Nhanh 3 Biến Thể Mở Đầu A/B/C)
 * Plugin cắm rời độc lập: Không sửa auth.js, crm.html, editor-ai-core.js, worker.js hay các add-on trước.
 * Đồng bộ nhánh riêng: autocut_saas/studio_addons/v7_ab_hooks
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://autocut-ai-proxy.tommynguyen1557.workers.dev';
  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v7_ab_hooks';
  const LOCAL_KEY = 'autocut_v7_ab_hooks_state';
  const V6_CACHE_KEY = 'autocut_studio_v6_cache';

  function defaultState() {
    return {
      activeKey: 'orig', // orig | A | B | C
      baseGenre: '',
      variants: [],      // [{ key:'A'|'B'|'C', angleName, icon, headline, subline, subText, highlight, stickerIcon, stickerLabel, transition, sfx, openingSegmentIndex, voiceOpening }]
      updatedAt: 0
    };
  }

  function loadLocalState() {
    try {
      const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (s && typeof s === 'object') {
        return { ...defaultState(), ...s, variants: Array.isArray(s.variants) ? s.variants : [] };
      }
    } catch (_) {}
    return defaultState();
  }

  let state = loadLocalState();
  let basePlan = null;
  let pendingSwap = null; // { reply, plan, resolve }
  let isGenerating = false;
  let syncTimer = null;

  function deepClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return null; }
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function saveState(syncCloud = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
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
        state = { ...defaultState(), ...remote, variants: Array.isArray(remote.variants) ? remote.variants : [] };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
        renderHookPanel();
      }
    } catch (_) {}
  }

  // Khôi phục basePlan từ bộ nhớ đệm dự án v6 nếu người dùng vừa mở lại dự án
  function recoverBasePlanFromV6Cache(projectIndex = 0) {
    try {
      const cache = JSON.parse(localStorage.getItem(V6_CACHE_KEY) || 'null');
      const list = cache && Array.isArray(cache.savedProjects) ? cache.savedProjects : [];
      if (list[projectIndex] && list[projectIndex].plan) {
        return deepClone(list[projectIndex].plan);
      }
    } catch (_) {}
    return null;
  }

  function isWorkspaceReady() {
    return Boolean(document.getElementById('ac-send-copilot') && document.getElementById('ac-copilot-input'));
  }

  function ensureBasePlan() {
    if (!basePlan && isWorkspaceReady()) {
      basePlan = recoverBasePlanFromV6Cache(0);
    }
    return basePlan;
  }

  // ================= 1. BẮT KẾ HOẠCH DỰNG & CƠ CHẾ CHUYỂN ĐỔI BIẾN THỂ 0ms =================
  function installAbHookBridge() {
    if (window.__acAbHooksInstalled) return;
    window.__acAbHooksInstalled = true;

    const prevFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const isProxyPost = url.includes('autocut-ai-proxy') && init && String(init.method || 'GET').toUpperCase() === 'POST' && typeof init.body === 'string';

      if (isProxyPost) {
        let payload = null;
        try { payload = JSON.parse(init.body); } catch (_) {}

        // Chuyển biến thể Hook tức thì ngay trong lõi v6.0 mà không tốn thêm 1 lượt gọi AI
        if (payload && payload.action === 'copilot_refine' && pendingSwap) {
          const job = pendingSwap;
          pendingSwap = null;
          const synth = new Response(JSON.stringify({
            ok: true,
            reply: job.reply,
            plan: job.plan,
            provider: 'A/B Hook Generator'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          });
          setTimeout(() => { if (typeof job.resolve === 'function') job.resolve(); }, 90);
          return synth;
        }

        const res = await prevFetch(input, init);

        // Tự động ghi nhận bản dựng gốc mỗi khi AI quét xong, tối ưu hoặc Co-Pilot sửa thủ công
        if (payload && res && res.ok && ['auto_scan_and_edit', 'copilot_refine', 'viral_critic'].includes(payload.action)) {
          try {
            const data = await res.clone().json();
            if (payload.action === 'auto_scan_and_edit' && data.plan) {
              basePlan = deepClone(data.plan);
              state.activeKey = 'orig';
              state.baseGenre = basePlan.detectedGenre || '';
              state.variants = [];
              saveState(false);
              setTimeout(renderHookPanel, 120);
            } else if (payload.action === 'copilot_refine' && data.plan) {
              if (state.activeKey === 'orig') basePlan = deepClone(data.plan);
              setTimeout(renderHookPanel, 120);
            } else if (payload.action === 'viral_critic' && data.critic && data.critic.optimizedPlan) {
              basePlan = deepClone(data.critic.optimizedPlan);
              state.activeKey = 'orig';
              setTimeout(renderHookPanel, 120);
            }
          } catch (_) {}
        }
        return res;
      }

      return prevFetch(input, init);
    };

    // Ghi nhận khi người dùng bấm "Mở lại" 1 dự án cũ trong Tab 4 (Viral & Cloud)
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('[data-load-prj]');
      if (!btn) return;
      const idx = Number(btn.getAttribute('data-load-prj')) || 0;
      const loaded = recoverBasePlanFromV6Cache(idx);
      if (loaded) {
        basePlan = loaded;
        state.activeKey = 'orig';
        state.baseGenre = loaded.detectedGenre || '';
        setTimeout(renderHookPanel, 120);
      }
    }, true);
  }

  // ================= 2. SINH 3 BIẾN THỂ MỞ ĐẦU A/B/C BẰNG AI =================
  function extractJsonBlock(raw) {
    try {
      const cleaned = String(raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const s = cleaned.indexOf('{');
      const e = cleaned.lastIndexOf('}');
      if (s !== -1 && e !== -1) return JSON.parse(cleaned.slice(s, e + 1));
    } catch (_) {}
    return null;
  }

  function buildFallbackVariants(plan) {
    const genre = plan.detectedGenre || 'Sản phẩm nổi bật';
    const baseHead = (plan.titleCard && plan.titleCard.headline) || genre;
    const baseSub = (plan.subtitles && plan.subtitles[0] && plan.subtitles[0].text) || 'Xem hết 3 giây đầu để thấy khác biệt';
    const segCount = (plan.segments && plan.segments.length) || 1;
    return [
      {
        key: 'A',
        icon: '🔥',
        angleName: 'Hook A: Đánh Nỗi Đau / Sai Lầm',
        headline: 'ĐỪNG CHỌN NHẦM NỮA!',
        subline: `90% người mua ${genre} hay bỏ qua điều này`,
        subText: `Đừng vội chọn nếu chưa biết điểm này`,
        highlight: 'chưa biết',
        stickerIcon: '⚠️',
        stickerLabel: 'TRÁNH SAI LẦM',
        transition: 'flash',
        sfx: 'boom',
        openingSegmentIndex: 0,
        voiceOpening: `Đừng vội quyết định nếu bạn chưa xem kỹ điểm khác biệt quan trọng này!`
      },
      {
        key: 'B',
        icon: '🏆',
        angleName: 'Hook B: Khoe Kết Quả Ngay',
        headline: String(baseHead).toUpperCase().slice(0, 26),
        subline: 'Cận cảnh chất lượng thực tế sắc nét',
        subText: baseSub,
        highlight: 'thực tế',
        stickerIcon: '✨',
        stickerLabel: 'CHUẨN SẮC NÉT',
        transition: 'zoom_burst',
        sfx: 'sparkle',
        openingSegmentIndex: segCount > 1 ? 1 : 0,
        voiceOpening: `Nhìn trực tiếp độ hoàn thiện thực tế ngay từ giây đầu tiên — đẹp vượt mong đợi!`
      },
      {
        key: 'C',
        icon: '👀',
        angleName: 'Hook C: Gây Tò Mò / Bí Mật',
        headline: 'BÍ MẬT ÍT AI NÓI!',
        subline: 'Xem hết đến cuối để biết lý do',
        subText: 'Vì sao mẫu này đang được săn đón?',
        highlight: 'săn đón',
        stickerIcon: '👀',
        stickerLabel: 'XEM TỚI CUỐI',
        transition: 'glitch',
        sfx: 'riser',
        openingSegmentIndex: segCount > 2 ? 2 : 0,
        voiceOpening: `Có một lý do thú vị khiến ai nhìn thấy cận cảnh cũng phải dừng lại xem tiếp!`
      }
    ];
  }

  function readActiveContextHints() {
    let industryNote = '';
    let policyNote = '';
    try {
      const pb = JSON.parse(localStorage.getItem('autocut_v7_playbook_state') || 'null');
      if (pb && pb.selectedId && pb.selectedId !== 'none') industryNote = `Ngành đang khóa: ${pb.selectedId}.`;
    } catch (_) {}
    try {
      const pg = JSON.parse(localStorage.getItem('autocut_v7_policy_guard_state') || 'null');
      if (pg && pg.platform) {
        policyNote = `Tuân thủ tuyệt đối chính sách nền tảng (${pg.platform}): KHÔNG dùng từ cấm như trị dứt điểm, 100%, rẻ nhất, số 1, zalo, chuyển khoản, fake.`;
      }
    } catch (_) {}
    return [industryNote, policyNote].filter(Boolean).join(' ');
  }

  async function generate3Hooks() {
    const plan = ensureBasePlan();
    if (!plan || !isWorkspaceReady()) {
      alert('Hãy bấm "Quét Đa Clip & Tự Edit v6" (hoặc Mở lại 1 dự án ở Tab 4) trước để có bản dựng gốc!');
      return;
    }
    if (isGenerating) return;
    isGenerating = true;

    const statusEl = document.getElementById('acab-status');
    const genBtn = document.getElementById('acab-btn-gen');
    if (genBtn) genBtn.disabled = true;
    if (statusEl) statusEl.innerHTML = '<span style="color:#38bdf8;">⏳ AI đang sáng tạo 3 phiên bản mở đầu 3s (Nỗi Đau • Kết Quả • Gây Tò Mò)...</span>';

    const segListText = (plan.segments || []).map((s, i) => `Cảnh #${i}: "${s.label}" (${s.startSec}s→${s.endSec}s)`).join(' | ');
    const extraContext = readActiveContextHints();

    const prompt = `Bạn là Chuyên Gia Performance Ads & TikTok Hook Strategist.
Dựa trên bản dựng video hiện tại:
- Thể loại: ${plan.detectedGenre || 'Video thương mại'}
- Tiêu đề gốc: ${(plan.titleCard && plan.titleCard.headline) || ''}
- Phụ đề mở đầu gốc: ${(plan.subtitles && plan.subtitles[0] && plan.subtitles[0].text) || ''}
- Lời bình gốc: ${(plan.voiceoverScript || '').slice(0, 320)}
- Danh sách các cảnh hiện có: ${segListText}
${extraContext ? `- Quy chuẩn bắt buộc: ${extraContext}` : ''}

NHIỆM VỤ: Tạo ĐÚNG 3 biến thể mở đầu (3 giây đầu tiên) khác hẳn nhau để người dùng chạy A/B Test giữ chân:
- Biến thể "A": Đánh vào Nỗi Đau / Sai Lầm khách hay gặp.
- Biến thể "B": Khoe Kết Quả / Vẻ Đẹp / Lợi Ích trực diện ngay giây đầu.
- Biến thể "C": Gây Tò Mò / Bí Mật / Câu hỏi ngược kéo người xem ở lại.

BẮT BUỘC trả về DUY NHẤT 1 khối JSON hợp lệ (không giải thích ngoài JSON):
{
  "variants": [
    {
      "key": "A",
      "icon": "🔥",
      "angleName": "Hook A: Đánh Nỗi Đau / Sai Lầm",
      "headline": "TIÊU ĐỀ MỞ ĐẦU NGẮN 3-5 TỪ",
      "subline": "Dòng phụ ngắn dưới 7 từ",
      "subText": "Câu phụ đề 3 giây đầu ngắn 5-8 từ",
      "highlight": "1-2 từ khóa nổi bật nằm trong subText",
      "stickerIcon": "⚠️",
      "stickerLabel": "NHÃN NGẮN 2-3 TỪ",
      "transition": "flash",
      "sfx": "boom",
      "openingSegmentIndex": 0,
      "voiceOpening": "1-2 câu mở đầu lời bình tiếng Việt tự nhiên cho biến thể này"
    }
  ]
}
Lưu ý: openingSegmentIndex là số nguyên từ 0 đến ${Math.max(0, (plan.segments || []).length - 1)} (chọn cảnh mở màn phù hợp nhất cho mỗi biến thể).`;

    try {
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'direct', instruction: prompt })
      });
      const data = await res.json();
      const parsed = extractJsonBlock(data && data.text);
      let vars = parsed && Array.isArray(parsed.variants) && parsed.variants.length >= 3 ? parsed.variants.slice(0, 3) : null;

      if (!vars) {
        vars = buildFallbackVariants(plan);
      } else {
        const defaults = buildFallbackVariants(plan);
        const maxIdx = Math.max(0, (plan.segments || []).length - 1);
        vars = vars.map((v, i) => ({
          ...defaults[i],
          ...v,
          key: ['A', 'B', 'C'][i],
          openingSegmentIndex: Math.min(maxIdx, Math.max(0, parseInt(v.openingSegmentIndex, 10) || 0))
        }));
      }

      state.variants = vars;
      state.baseGenre = plan.detectedGenre || '';
      state.activeKey = 'orig';
      saveState(true);

      if (statusEl) statusEl.innerHTML = '<span style="color:#4ade80;">✓ Đã tạo xong 3 biến thể Hook A/B/C! Bấm chọn từng bản để Xem Thử hoặc Xuất ngay.</span>';
      renderHookPanel();
    } catch (err) {
      state.variants = buildFallbackVariants(plan);
      saveState(true);
      if (statusEl) statusEl.innerHTML = `<span style="color:#fbbf24;">⚡ Đã tạo nhanh 3 mẫu Hook dự phòng (${escHtml(err.message)}). Bạn có thể sửa chữ trực tiếp bên dưới.</span>`;
      renderHookPanel();
    } finally {
      isGenerating = false;
      if (genBtn) genBtn.disabled = false;
    }
  }

  // ================= 3. GHÉP BIẾN THỂ VÀO KẾ HOẠCH DỰNG & KÍCH HOẠT NGAY TRONG v6.0 =================
  function buildMergedPlanForKey(key) {
    const base = ensureBasePlan();
    if (!base) return null;
    const merged = deepClone(base);
    if (key === 'orig') return merged;

    const v = state.variants.find((x) => x.key === key);
    if (!v) return merged;

    // 1. Đảo cảnh mở đầu mạnh nhất cho biến thể này (giữ nguyên toàn bộ clipIndex & timestamp hợp lệ)
    if (Array.isArray(merged.segments) && merged.segments.length > 0) {
      const idx = Math.min(merged.segments.length - 1, Math.max(0, Number(v.openingSegmentIndex) || 0));
      if (idx > 0) {
        const [picked] = merged.segments.splice(idx, 1);
        merged.segments.unshift(picked);
      }
      const firstSeg = merged.segments[0];
      firstSeg.transition = ['flash', 'fade', 'slide_left', 'zoom_burst', 'glitch', 'light_leak'].includes(v.transition) ? v.transition : 'flash';
      firstSeg.sfx = ['boom', 'whoosh', 'sparkle', 'pop', 'shutter', 'riser', 'none'].includes(v.sfx) ? v.sfx : 'boom';
      firstSeg.zoomFrom = 1.0;
      firstSeg.zoomTo = Math.max(1.12, Number(firstSeg.zoomTo) || 1.14);
      firstSeg.label = `[Hook ${v.key}] ${firstSeg.label.replace(/^\[Hook [ABC]\]\s*/, '')}`;
    }

    // 2. Cập nhật Title Card mở đầu 3s
    merged.titleCard = {
      ...(merged.titleCard || {}),
      enabled: true,
      durationSec: 2.0,
      headline: v.headline || (merged.titleCard && merged.titleCard.headline) || 'AUTOCUT PRO',
      subline: v.subline || ''
    };

    // 3. Cập nhật Phụ đề câu đầu tiên (0.15s -> 2.7s)
    if (!Array.isArray(merged.subtitles)) merged.subtitles = [];
    const hookSub = {
      startSec: 0.15,
      endSec: merged.subtitles[0] ? Math.max(1.8, Number(merged.subtitles[0].endSec) || 2.6) : 2.6,
      text: v.subText || v.headline || '',
      highlight: v.highlight || ''
    };
    if (merged.subtitles.length > 0) merged.subtitles[0] = hookSub;
    else merged.subtitles.push(hookSub);

    // 4. Cập nhật Sticker mở đầu 3s
    if (!Array.isArray(merged.stickers)) merged.stickers = [];
    const hookSticker = {
      startSec: 0.35,
      endSec: 2.6,
      icon: v.stickerIcon || v.icon || '🔥',
      label: (v.stickerLabel || `HOOK ${v.key}`).toUpperCase(),
      position: 'top_right',
      sfx: v.sfx === 'sparkle' ? 'sparkle' : 'pop'
    };
    if (merged.stickers.length > 0) merged.stickers[0] = hookSticker;
    else merged.stickers.push(hookSticker);

    // 5. Thay 1 câu mở đầu trong lời bình TTS, giữ nguyên phần thân kịch bản
    if (v.voiceOpening) {
      const origScript = (base.voiceoverScript || '').trim();
      const parts = origScript.split(/(?<=[.!?])\s+/);
      const bodyTail = parts.length > 1 ? parts.slice(1).join(' ') : origScript;
      merged.voiceoverScript = `${v.voiceOpening.trim()} ${bodyTail}`.trim();
    }

    return merged;
  }

  function applyVariantToV6(key, afterAction = 'none') {
    if (!isWorkspaceReady()) {
      alert('Chưa có bản dựng nào đang mở ở phía trên!');
      return;
    }
    const merged = buildMergedPlanForKey(key);
    if (!merged) return;

    const v = state.variants.find((x) => x.key === key);
    const labelText = key === 'orig' ? '📌 Bản Gốc Ban Đầu' : `${v.icon} ${v.angleName}`;

    state.activeKey = key;
    saveState(false);

    // Cập nhật luôn ô Lời bình ở Tab 3 (TTS) khớp với Hook đang chọn
    const ttsBox = document.getElementById('ac-tts-text');
    if (ttsBox && merged.voiceoverScript) {
      ttsBox.value = merged.voiceoverScript;
    }

    return new Promise((resolve) => {
      pendingSwap = {
        reply: `Đã chuyển sang ${labelText} ✓`,
        plan: merged,
        resolve: () => {
          renderHookPanel();
          if (afterAction === 'play') {
            const pBtn = document.getElementById('ac-btn-play-edl');
            if (pBtn) pBtn.click();
          } else if (afterAction === 'export') {
            const eBtn = document.getElementById('ac-btn-export-edl');
            if (eBtn) eBtn.click();
          }
          resolve();
        }
      };

      const cpInp = document.getElementById('ac-copilot-input');
      const cpBtn = document.getElementById('ac-send-copilot');
      if (cpInp && cpBtn) {
        cpInp.value = `[A/B Hook] Chuyển sang ${labelText}`;
        cpBtn.click();
      } else {
        pendingSwap = null;
        resolve();
      }
    });
  }

  // ================= 4. GIAO DIỆN BẢNG NHÂN BẢN 3 BIẾN THỂ HOOK A/B/C =================
  function renderHookPanel() {
    const listEl = document.getElementById('acab-list');
    const statusEl = document.getElementById('acab-status');
    const origBtn = document.getElementById('acab-btn-orig');
    if (!listEl) return;

    const ready = isWorkspaceReady() && Boolean(ensureBasePlan());
    if (origBtn) {
      origBtn.style.display = state.variants.length ? 'inline-block' : 'none';
      origBtn.style.borderColor = state.activeKey === 'orig' ? '#4ade80' : '#334155';
      origBtn.style.color = state.activeKey === 'orig' ? '#4ade80' : '#cbd5e1';
    }

    if (!state.variants.length) {
      listEl.innerHTML = ready
        ? '<div style="font-size:11px; color:#cbd5e1; background:#090e1a; border:1px solid #1e293b; border-radius:8px; padding:8px;">✓ Đã nhận diện bản dựng hiện tại. Bấm <b>"⚡ Tạo 3 Biến Thể Hook A/B/C"</b> để tạo ngay 3 mở đầu test giữ chân!</div>'
        : '<div style="font-size:11px; color:#94a3b8; background:#090e1a; border:1px solid #1e293b; border-radius:8px; padding:8px;">Sau khi bấm <b>"🚀 Quét Đa Clip & Tự Edit v6"</b> ở trên, bạn có thể nhân bản ngay 3 phiên bản mở đầu A/B/C tại đây mà không cần quét lại video.</div>';
      return;
    }

    if (statusEl && !statusEl.textContent.trim()) {
      statusEl.innerHTML = `<span style="color:#a78bfa;">Đang có 3 biến thể Hook A/B/C${state.baseGenre ? ' (' + escHtml(state.baseGenre) + ')' : ''}. Bạn có thể sửa chữ trực tiếp rồi bấm Xem Thử / Xuất từng bản.</span>`;
    }

    listEl.innerHTML = state.variants.map((v, idx) => {
      const isActive = state.activeKey === v.key;
      const borderCol = isActive ? '#4ade80' : '#263452';
      const bgCol = isActive ? '#0f1f1c' : '#090e1a';
      return `
        <div style="background:${bgCol}; border:1px solid ${borderCol}; border-radius:10px; padding:9px; margin-top:7px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:6px;">
            <span style="font-size:11.5px; font-weight:800; color:${isActive ? '#4ade80' : '#fbbf24'};">${escHtml(v.icon || '🔥')} ${escHtml(v.angleName)} ${isActive ? '(ĐANG CHỌN)' : ''}</span>
            <span style="font-size:10px; color:#94a3b8;">Cảnh #${(Number(v.openingSegmentIndex) || 0) + 1} • ${escHtml(v.transition)}</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr; gap:4px; margin-bottom:6px;">
            <input class="acp-inp" data-acab-edit="${idx}" data-field="headline" value="${escHtml(v.headline)}" placeholder="Tiêu đề mở đầu 3s..." style="padding:5px 8px; font-size:11px; font-weight:700; color:#fde047;" />
            <input class="acp-inp" data-acab-edit="${idx}" data-field="subText" value="${escHtml(v.subText)}" placeholder="Phụ đề mở đầu 3s..." style="padding:5px 8px; font-size:11px;" />
          </div>
          ${v.voiceOpening ? `<div style="font-size:10.5px; color:#94a3b8; margin-bottom:7px; line-height:1.4;">🎙️ <i>"${escHtml(v.voiceOpening)}"</i></div>` : ''}
          <div style="display:flex; gap:5px;">
            <button type="button" class="acp-btn" data-acab-apply="${v.key}" style="flex:1; padding:5px 6px; font-size:11px; background:${isActive ? '#15803d' : '#312e81'};">${isActive ? '✓ Đang áp dụng' : '✓ Áp dụng'}</button>
            <button type="button" class="acp-btn acp-btn-main" data-acab-play="${v.key}" style="flex:1; padding:5px 6px; font-size:11px;">▶️ Xem Thử</button>
            <button type="button" class="acp-btn acp-btn-green" data-acab-export="${v.key}" style="flex:1; padding:5px 6px; font-size:11px;">⬇️ Xuất Bản ${v.key}</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-acab-edit]').forEach((inp) => {
      inp.oninput = () => {
        const i = Number(inp.getAttribute('data-acab-edit'));
        const field = inp.getAttribute('data-field');
        if (state.variants[i]) {
          state.variants[i][field] = inp.value;
          saveState(true);
        }
      };
    });

    listEl.querySelectorAll('[data-acab-apply]').forEach((b) => {
      b.onclick = () => applyVariantToV6(b.getAttribute('data-acab-apply'), 'none');
    });
    listEl.querySelectorAll('[data-acab-play]').forEach((b) => {
      b.onclick = () => applyVariantToV6(b.getAttribute('data-acab-play'), 'play');
    });
    listEl.querySelectorAll('[data-acab-export]').forEach((b) => {
      b.onclick = () => applyVariantToV6(b.getAttribute('data-acab-export'), 'export');
    });
  }

  function mountAbHooksUI() {
    const autoResult = document.getElementById('ac-auto-result');
    if (!autoResult || document.getElementById('acab-panel')) return false;

    const panel = document.createElement('div');
    panel.id = 'acab-panel';
    panel.style.cssText = 'margin-top:10px; background:#11192d; border:1px solid #6d28d9; border-radius:12px; padding:11px;';
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:7px;">
        <span style="font-size:11px; font-weight:800; color:#c4b5fd; text-transform:uppercase;">🔀 Nhân Bản 3 Biến Thể Mở Đầu (A/B Hook)</span>
        <span style="font-size:10px; color:#4ade80; font-weight:700;">Add-on #4</span>
      </div>
      <div style="display:flex; gap:6px; margin-bottom:7px;">
        <button type="button" class="acp-btn acp-btn-main" id="acab-btn-gen" style="flex:1; font-size:11.5px;">⚡ Tạo 3 Biến Thể Hook A/B/C</button>
        <button type="button" class="acp-btn" id="acab-btn-orig" style="display:none; font-size:11px; border:1px solid #334155;">📌 Bản Gốc</button>
      </div>
      <div id="acab-status" style="font-size:11px; margin-bottom:6px; line-height:1.4;"></div>
      <div id="acab-list"></div>
    `;

    // Gắn ngay bên dưới kết quả bản dựng v6 (độc lập nên không bị ghi đè khi v6 vẽ lại #ac-auto-result)
    autoResult.insertAdjacentElement('afterend', panel);

    document.getElementById('acab-btn-gen').onclick = generate3Hooks;
    document.getElementById('acab-btn-orig').onclick = () => applyVariantToV6('orig', 'none');

    // Theo dõi khi bản dựng v6 xuất hiện để bật trạng thái sẵn sàng tự động
    const obs = new MutationObserver(() => renderHookPanel());
    obs.observe(autoResult, { childList: true });

    renderHookPanel();
    pullStateFromCloud();
    return true;
  }

  installAbHookBridge();

  let tries = 0;
  const bootTimer = setInterval(() => {
    tries += 1;
    if (mountAbHooksUI() || tries > 60) {
      clearInterval(bootTimer);
    }
  }, 250);
})();
