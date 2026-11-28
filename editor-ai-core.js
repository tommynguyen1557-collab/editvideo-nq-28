/**
 * AutoCut Studio AI v7.0 — Multi-Industry Pro Suite
 * 5 Nâng cấp mới: 10 Kịch bản ngành nghề + Bộ lọc chống gậy chính sách (Policy Guard)
 * + Đồ họa ngành (Thẻ giá gạch ngang, Spec Card, Before/After Split-Screen, Multi-Brand Kit)
 * + 3 Biến thể Hook A/B/C + Khóa Vùng An Toàn Đa Nền Tảng (TikTok/Shopee/Reels)
 * CÁCH LY 100%: Không chạm auth.js, crm.html, index.html hay dữ liệu khách hàng.
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://autocut-ai-proxy.tommynguyen1557.workers.dev';
  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v6_sync'; // Giữ nguyên nhánh sync cũ để bảo toàn 100% dự án đã lưu
  const LOCAL_CACHE_KEY = 'autocut_studio_v6_cache';

  // ================= 1. 10 KỊCH BẢN CHUYÊN SÂU ĐA NGÀNH NGHỀ =================
  const INDUSTRY_PLAYBOOKS = [
    {
      id: 'auto_detect', name: '🤖 Tự nhận diện ngành (Đa dụng)',
      lut: 'tiktok_commerce', mode: 'deep_director', textStyle: 'auto', split: 'off',
      aiRule: 'Tự quan sát khung hình nhận diện đúng ngành hàng và chọn công thức dựng viral tốt nhất.'
    },
    {
      id: 'silver_jewelry', name: '💎 Trang Sức / Bạc Xi Bạch Kim',
      lut: 'silver_platinum', mode: 'brand_preserve', textStyle: 'cinematic_clean', split: 'off',
      aiRule: 'BẮT BUỘC giữ nguyên sắc bạc trắng sáng nguyên bản đã xi bạch kim, tuyệt đối khử ám vàng (lutPreset=silver_platinum), nhịp slow-motion 0.85x-0.95x tôn độ lấp lánh, SFX sparkle tinh tế, phụ đề sang trọng.'
    },
    {
      id: 'fashion', name: '👗 Thời Trang / Lookbook / Shop Quần Áo',
      lut: 'tiktok_commerce', mode: 'viral_hook', textStyle: 'karaoke_box', split: 'off',
      aiRule: 'Cắt nhanh khớp nhịp beat 1.8-2.2s/cảnh, xen kẽ góc toàn dáng và cận chất liệu vải, bật priceTag nếu có ưu đãi, phụ đề ngắn bắt trend.'
    },
    {
      id: 'cosmetics', name: '🧴 Mỹ Phẩm / Skincare / Làm Đẹp',
      lut: 'clean_studio', mode: 'sales_converter', textStyle: 'hormozi', split: 'off',
      aiRule: 'Ánh sáng sạch mịn trong trẻo, tập trung kết cấu sản phẩm và cảm nhận thực tế, TUYỆT ĐỐI tránh từ cấm y tế (không dùng trị dứt điểm/100%/kích trắng).'
    },
    {
      id: 'spa_beauty', name: '💆 Spa / Thẩm Mỹ / Làm Tóc / Nail',
      lut: 'clean_studio', mode: 'sales_converter', textStyle: 'cinematic_clean', split: 'lr',
      aiRule: 'Ưu tiên phô diễn sự thay đổi Trước & Sau (Before/After), ánh sáng mềm mượt, giọng văn tinh tế tạo niềm tin, lách từ cam kết y tế.'
    },
    {
      id: 'real_estate', name: '🏡 Bất Động Sản / Nhà Đất / Cho Thuê',
      lut: 'natural_crisp', mode: 'deep_director', textStyle: 'minimal_lower', split: 'off',
      aiRule: 'Chuyển động mượt mà ổn định, BẮT BUỘC điền specCard gồm 3 thông số cốt lõi (Vị trí, Diện tích/Kết cấu, Mức giá/Pháp lý), phụ đề gọn rõ ràng.'
    },
    {
      id: 'automotive', name: '🚗 Ô Tô / Xe Máy / Phụ Kiện Xe',
      lut: 'luxury_contrast', mode: 'viral_hook', textStyle: 'neon_glow', split: 'off',
      aiRule: 'Tương phản cao sang trọng, cắt mạnh theo nhịp bass boom/whoosh, điền specCard (Đời xe/Động cơ, Tình trạng, Giá bán), tạo cảm giác mạnh mẽ.'
    },
    {
      id: 'fnb_food', name: '🍜 F&B / Đồ Ăn / Quán Cà Phê',
      lut: 'food_rich', mode: 'viral_hook', textStyle: 'hormozi', split: 'off',
      aiRule: 'Màu sắc rực rỡ ngon mắt (food_rich), mở 3s đầu bằng cận cảnh món ăn hấp dẫn nhất, cắt nhanh giàu năng lượng, nhấn mạnh địa chỉ/món best-seller.'
    },
    {
      id: 'interior_decor', name: '🛋️ Nội Thất / Kiến Trúc / Decor',
      lut: 'warm_vlog', mode: 'storyteller', textStyle: 'cinematic_clean', split: 'lr',
      aiRule: 'Ánh sáng ấm áp tinh tế, ưu tiên so sánh Trước & Sau thi công hoặc không gian hoàn thiện, nhịp chuyển cảnh êm mượt easeInOutCubic.'
    },
    {
      id: 'education_expert', name: '🎓 Chuyên Gia / Giáo Dục / Tư Vấn B2B',
      lut: 'natural_crisp', mode: 'deep_director', textStyle: 'karaoke_box', split: 'off',
      aiRule: 'Giữ trọng tâm khuôn mặt người chia sẻ (smart_focal), cắt sạch khoảng lặng thừa, nhấn từ khóa giá trị cốt lõi trên phụ đề, bật lowerThird tên & chức danh.'
    },
    {
      id: 'tech_home', name: '📱 Công Nghệ / Đồ Gia Dụng Thông Minh',
      lut: 'tiktok_commerce', mode: 'sales_converter', textStyle: 'hormozi', split: 'off',
      aiRule: 'Mở đầu đánh thẳng vào vấn đề hằng ngày và cách sản phẩm giải quyết trong 3 giây, điền specCard 3 tính năng chính và priceTag nếu có sale.'
    }
  ];

  // ================= 2. BỘ LỌC TỪ CẤM CHÍNH SÁCH (LOCAL SCAN TỨC THÌ) =================
  const POLICY_RISKY_TERMS = [
    'trị dứt điểm', 'chữa khỏi', 'khỏi hẳn', '100%', 'tuyệt đối', 'vĩnh viễn',
    'rẻ nhất', 'tốt nhất', 'số 1', 'cấp tốc', 'siêu tốc', 'cam kết khỏi',
    'đảm bảo 100%', 'hoàn tiền 100%', 'nhất định', 'thần thánh', 'kích trắng',
    'lột da', 'giảm cân nhanh', 'triệt để', 'dứt điểm', 'độc quyền số 1',
    'bảo hành trọn đời', 'hiệu quả tức thì', 'trị mụn', 'trị nám', 'trị thâm'
  ];

  const SAFE_ZONES = {
    tiktok: { label: 'TikTok (Né nút phải & mô tả dưới)', top: 0.11, bottom: 0.76, left: 0.05, right: 0.82 },
    shopee: { label: 'Shopee Video (Né giỏ hàng cam)',    top: 0.12, bottom: 0.70, left: 0.05, right: 0.80 },
    reels:  { label: 'Facebook Reels / YT Shorts',        top: 0.11, bottom: 0.77, left: 0.05, right: 0.83 },
    none:   { label: 'Toàn khung (Không giới hạn)',       top: 0.05, bottom: 0.92, left: 0.04, right: 0.96 }
  };

  const REASONING_MODES = [
    { id: 'deep_director',   label: '🧠 Đạo Diễn Tư Duy Sâu (Claude CoT)' },
    { id: 'sales_converter', label: '💰 Tâm Lý Bán Hàng & Chốt Đơn AIDA' },
    { id: 'viral_hook',      label: '🔥 Săn Hook 3s & Nhịp Cắt TikTok' },
    { id: 'storyteller',     label: '🎬 Kể Chuyện Điện Ảnh (Anthropic)' },
    { id: 'brand_preserve',  label: '💎 Bảo Toàn Màu Gốc & Thương Hiệu' }
  ];

  const LUT_PRESETS = {
    silver_platinum: { name: 'Bạc Xi Bạch Kim (Khử ám vàng)', filter: 'brightness(106%) contrast(112%) saturate(88%) hue-rotate(4deg)', vignette: 0.14 },
    cinematic_teal:  { name: 'Điện Ảnh Teal & Orange',        filter: 'brightness(98%) contrast(115%) saturate(112%) sepia(10%)', vignette: 0.30 },
    tiktok_commerce: { name: 'Thương Mại TikTok Sắc Nét',     filter: 'brightness(104%) contrast(110%) saturate(118%)', vignette: 0.12 },
    clean_studio:    { name: 'Studio Sáng Mịn (Mỹ Phẩm)',     filter: 'brightness(108%) contrast(103%) saturate(102%)', vignette: 0.08 },
    luxury_contrast: { name: 'Luxury Tương Phản Cao',         filter: 'brightness(96%) contrast(122%) saturate(95%)', vignette: 0.34 },
    warm_vlog:       { name: 'Vlog Điện Ảnh Ấm Áp',           filter: 'brightness(102%) contrast(106%) saturate(108%) sepia(14%)', vignette: 0.22 },
    food_rich:       { name: 'Ẩm Thực Rực Rỡ Ngon Mắt',       filter: 'brightness(105%) contrast(112%) saturate(128%)', vignette: 0.16 },
    natural_crisp:   { name: 'Tự Nhiên Siêu Nét',             filter: 'brightness(102%) contrast(106%) saturate(104%)', vignette: 0.10 }
  };

  const TEXT_STYLES = [
    { id: 'auto',            label: '🤖 AI tự chọn theo thể loại' },
    { id: 'hormozi',         label: '🔥 Hormozi (Viền đen + Vàng từ khóa)' },
    { id: 'karaoke_box',     label: '🟣 Hộp Karaoke TikTok nổi bật' },
    { id: 'typewriter',      label: '⌨️ Gõ máy Typewriter' },
    { id: 'cinematic_clean', label: '✨ Tối giản Điện Ảnh' },
    { id: 'neon_glow',       label: '⚡ Neon Glow phát sáng' },
    { id: 'minimal_lower',   label: '🎞️ Phụ đề mảnh gọn thấp' }
  ];

  const PRO_SKILLS = [
    { id: 'auto_silence',  name: '🔇 Cắt Khoảng Lặng' },
    { id: 'hook_3s',       name: '🔥 Hook 3s + Title Card' },
    { id: 'smart_focal',   name: '🎯 Khóa Tiêu Điểm (x,y)' },
    { id: 'beat_sync',     name: '🥁 Bắt Nhịp Nhạc Thật' },
    { id: 'remotion_ease', name: '🌊 Easing Mượt Remotion' },
    { id: 'fx_trans',      name: '⚡ 6 Hiệu Ứng Chuyển Cảnh' },
    { id: 'film_grain',    name: '🎞️ Hạt Phim & Vignette' },
    { id: 'pro_lut',       name: '🎨 8 Bộ Màu LUT Chuẩn' },
    { id: 'kinetic_text',  name: '💬 6 Kiểu Chữ Động' },
    { id: 'lower_third',   name: '🏷️ Bảng Tên Lower-Third' },
    { id: 'stickers',      name: '✨ Biểu Tượng & Sticker' },
    { id: 'end_card',      name: '🏁 EndCard Chốt Đơn' },
    { id: 'sfx_synth',     name: '🔊 6 SFX Miễn Phí' }
  ];

  const SFX_LIST = [
    { id: 'boom',    label: '💥 Bass Boom' },
    { id: 'whoosh',  label: '💨 Whoosh' },
    { id: 'sparkle', label: '✨ Sparkle' },
    { id: 'pop',     label: '🫧 Pop' },
    { id: 'shutter', label: '📸 Shutter' },
    { id: 'riser',   label: '📈 Riser' }
  ];

  // ================= 3. TRẠNG THÁI & ĐỒNG BỘ FIREBASE CLOUD (TƯƠNG THÍCH NGƯỢC V6) =================
  function defaultSyncedData() {
    return {
      preferences: {
        industryId: 'auto_detect',
        platformSafeZone: 'tiktok',
        showSafeZoneGuide: true,
        brandTag: '',
        activeBrandKitId: '',
        reasoningMode: 'deep_director',
        textStylePref: 'auto',
        activeSkills: PRO_SKILLS.map((s) => s.id),
        bgmVol: 30,
        sfxVol: 55,
        autoDuck: true,
        muteOrig: false,
        enableSearch: true
      },
      brandKits: [],
      behavior: { totalActions: 0, recentGenres: [] },
      savedProjects: [],
      updatedAt: 0
    };
  }

  function loadLocalCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || 'null');
      if (parsed && parsed.preferences) {
        return {
          ...defaultSyncedData(),
          ...parsed,
          preferences: { ...defaultSyncedData().preferences, ...(parsed.preferences || {}) },
          brandKits: Array.isArray(parsed.brandKits) ? parsed.brandKits : [],
          savedProjects: Array.isArray(parsed.savedProjects) ? parsed.savedProjects : []
        };
      }
    } catch (_) {}
    return defaultSyncedData();
  }

  let syncData = loadLocalCache();
  let activeSkills = new Set(syncData.preferences.activeSkills || PRO_SKILLS.map((s) => s.id));
  let loadedClips = [];
  let bgmFile = null;
  let bgmUrl = null;
  let bgmBeatInfo = null;
  let attachedVoiceUrl = null;
  let attachedVoiceLabel = '';
  let lastTtsBlobUrl = null;
  let baseMasterPlan = null; // Lưu bản gốc để chuyển Hook A/B/C qua lại không mất gốc
  let currentMasterPlan = null;
  let hookVariants = [];
  let activeHookId = 'BASE';
  let splitMode = 'off'; // 'off' | 'lr' | 'tb'
  let currentCritic = null;
  let copilotHistory = [];
  let sttTranscriptLines = [];
  let isRendering = false;
  let previewAnimId = null;
  let grainCanvas = null;
  let syncTimer = null;
  const brandLogoImgCache = new Map();

  function setSyncBadge(text, color = '#4ade80') {
    const el = document.getElementById('ac-sync-badge');
    if (el) { el.textContent = text; el.style.color = color; }
  }

  function saveLocalAndScheduleCloudSync(immediate = false) {
    syncData.preferences.activeSkills = Array.from(activeSkills);
    syncData.updatedAt = Date.now();
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(syncData));
    renderBehaviorBanner();

    const pushNow = async () => {
      setSyncBadge('☁️ Đang đồng bộ...', '#38bdf8');
      try {
        const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncData)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSyncBadge('☁️ Đã đồng bộ Cloud ✓', '#4ade80');
      } catch (_) {
        setSyncBadge('☁️ Lưu cục bộ (chờ mạng)', '#fbbf24');
      }
    };

    clearTimeout(syncTimer);
    if (immediate) pushNow();
    else syncTimer = setTimeout(pushNow, 700);
  }

  async function pullFromCloudSync() {
    setSyncBadge('☁️ Đang tải đồng bộ Cloud...', '#38bdf8');
    try {
      const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote = await res.json();
      if (remote && typeof remote === 'object' && Number(remote.updatedAt || 0) >= Number(syncData.updatedAt || 0)) {
        syncData = {
          ...defaultSyncedData(),
          ...remote,
          preferences: { ...defaultSyncedData().preferences, ...(remote.preferences || {}) },
          brandKits: Array.isArray(remote.brandKits) ? remote.brandKits : [],
          behavior: { ...defaultSyncedData().behavior, ...(remote.behavior || {}) },
          savedProjects: Array.isArray(remote.savedProjects) ? remote.savedProjects : []
        };
        activeSkills = new Set(syncData.preferences.activeSkills || PRO_SKILLS.map((s) => s.id));
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(syncData));
        applyPreferencesToUI();
        renderBrandKitSelector();
        renderSavedProjectsList();
      }
      setSyncBadge(`☁️ Cloud ✓ (${syncData.savedProjects.length} dự án • ${syncData.brandKits.length} Brand Kit)`, '#4ade80');
    } catch (_) {
      setSyncBadge('☁️ Chế độ cục bộ', '#fbbf24');
    }
  }

  function archiveCurrentProjectToSync() {
    if (!currentMasterPlan) return;
    const entry = {
      id: 'prj_' + Date.now(),
      savedAt: Date.now(),
      genre: currentMasterPlan.detectedGenre || 'Dự án dựng phim',
      style: currentMasterPlan.matchedReference?.styleName || 'AutoCut v7',
      score: currentCritic?.score || null,
      plan: currentMasterPlan,
      critic: currentCritic,
      copilotHistory: copilotHistory.slice(-8)
    };
    syncData.savedProjects = [entry, ...syncData.savedProjects.filter((p) => p.id !== entry.id)].slice(0, 10);
    renderSavedProjectsList();
    saveLocalAndScheduleCloudSync(true);
  }

  function getActiveBrandKit() {
    const id = syncData.preferences.activeBrandKitId;
    return syncData.brandKits.find((b) => b.id === id) || null;
  }

  function getBrandLogoImage(kit) {
    if (!kit || !kit.logoDataUrl) return null;
    if (brandLogoImgCache.has(kit.id)) return brandLogoImgCache.get(kit.id);
    const img = new Image();
    img.src = kit.logoDataUrl;
    brandLogoImgCache.set(kit.id, img);
    return img;
  }

  // ================= 4. QUÉT TỪ CẤM CHÍNH SÁCH & TOÁN CHUYỂN ĐỘNG =================
  function scanPlanForPolicyRisks(plan) {
    if (!plan) return [];
    const texts = [
      plan.titleCard?.headline, plan.titleCard?.subline,
      plan.lowerThird?.title, plan.lowerThird?.subtitle,
      plan.endCard?.cta, plan.endCard?.subCta,
      plan.voiceoverScript,
      ...(plan.subtitles || []).map((s) => s.text),
      ...(plan.stickers || []).map((s) => s.label)
    ].filter(Boolean).join(' | ').toLowerCase();

    return POLICY_RISKY_TERMS.filter((term) => texts.includes(term));
  }

  function applyEasing(t, type = 'easeOutExpo') {
    const x = Math.min(1, Math.max(0, t));
    if (type === 'easeInOutCubic') return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    if (type === 'springPop') {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function getGrainCanvas() {
    if (grainCanvas) return grainCanvas;
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 160; grainCanvas.height = 160;
    const gctx = grainCanvas.getContext('2d');
    const img = gctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 18;
    }
    gctx.putImageData(img, 0, 0);
    return grainCanvas;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
    else {
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
  }

  function triggerSFX(audioCtx, targetNode, type, volume = 0.55) {
    if (!audioCtx || !type || type === 'none') return;
    try {
      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(targetNode);

      if (type === 'whoosh') {
        const len = Math.floor(audioCtx.sampleRate * 0.36);
        const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const f = audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.2;
        f.frequency.setValueAtTime(280, now); f.frequency.exponentialRampToValueAtTime(2400, now + 0.16); f.frequency.exponentialRampToValueAtTime(320, now + 0.35);
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(0.85, now + 0.14); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        src.connect(f); f.connect(g); g.connect(master); src.start(now); src.stop(now + 0.36);
      } else if (type === 'boom') {
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(145, now); osc.frequency.exponentialRampToValueAtTime(34, now + 0.48);
        g.gain.setValueAtTime(0.95, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        osc.connect(g); g.connect(master); osc.start(now); osc.stop(now + 0.54);
      } else if (type === 'pop') {
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(360, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        g.gain.setValueAtTime(0.7, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(g); g.connect(master); osc.start(now); osc.stop(now + 0.12);
      } else if (type === 'sparkle') {
        [1046, 1318, 1568, 2093].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
          osc.type = 'triangle'; const st = now + idx * 0.055; osc.frequency.setValueAtTime(freq, st);
          g.gain.setValueAtTime(0.001, st); g.gain.linearRampToValueAtTime(0.35, st + 0.02); g.gain.exponentialRampToValueAtTime(0.001, st + 0.32);
          osc.connect(g); g.connect(master); osc.start(st); osc.stop(st + 0.34);
        });
      } else if (type === 'shutter') {
        const len = Math.floor(audioCtx.sampleRate * 0.09);
        const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1600;
        src.connect(hp); hp.connect(master); src.start(now); src.stop(now + 0.09);
      } else if (type === 'riser') {
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(920, now + 0.65);
        const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, now); lp.frequency.exponentialRampToValueAtTime(3200, now + 0.65);
        g.gain.setValueAtTime(0.02, now); g.gain.linearRampToValueAtTime(0.38, now + 0.6); g.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
        osc.connect(lp); lp.connect(g); g.connect(master); osc.start(now); osc.stop(now + 0.7);
      }
    } catch (_) {}
  }

  // ================= 5. BEAT-SYNC, SÓNG ÂM & QUÉT ĐA CLIP =================
  async function detectMusicBeats(file) {
    try {
      const buf = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuf = await ctx.decodeAudioData(buf.slice(0));
      const ch = audioBuf.getChannelData(0);
      const sr = audioBuf.sampleRate;
      const win = Math.floor(sr * 0.05);
      const energies = [];
      for (let i = 0; i < ch.length; i += win) {
        let sum = 0; const end = Math.min(i + win, ch.length);
        for (let j = i; j < end; j++) sum += ch[j] * ch[j];
        energies.push(Math.sqrt(sum / (end - i)));
      }
      const avg = energies.reduce((a, b) => a + b, 0) / Math.max(1, energies.length);
      const beats = []; let lastBeat = -1;
      for (let i = 1; i < energies.length - 1; i++) {
        const t = i * 0.05;
        if (energies[i] > avg * 1.42 && energies[i] > energies[i - 1] && energies[i] >= energies[i + 1] && t - lastBeat >= 0.38) {
          beats.push(Number(t.toFixed(2))); lastBeat = t;
        }
      }
      ctx.close();
      let bpm = 120;
      if (beats.length >= 4) {
        const diffs = []; for (let i = 1; i < Math.min(beats.length, 20); i++) diffs.push(beats[i] - beats[i - 1]);
        const med = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)] || 0.5;
        bpm = Math.round(Math.min(180, Math.max(70, 60 / med)));
      }
      return { bpm, beats: beats.slice(0, 40) };
    } catch (_) { return null; }
  }

  function snapSegmentsToBeats(plan, beatInfo) {
    if (!plan || !Array.isArray(plan.segments) || !beatInfo?.beats?.length) return plan;
    let cursorOut = 0;
    plan.segments.forEach((seg, idx) => {
      const origOut = (seg.endSec - seg.startSec) / (seg.speed || 1);
      const best = beatInfo.beats.find((b) => b >= cursorOut + 1.2 && Math.abs(b - (cursorOut + origOut)) <= 0.85);
      if (best) {
        const desiredEnd = seg.startSec + Math.max(1.0, best - cursorOut) * (seg.speed || 1);
        const maxDur = loadedClips[seg.clipIndex]?.durationSec || (seg.endSec + 2);
        if (desiredEnd <= maxDur) seg.endSec = Number(desiredEnd.toFixed(2));
        cursorOut = best;
      } else cursorOut += origOut;
      if (idx > 0 && activeSkills.has('fx_trans')) seg.transition = idx % 2 === 0 ? 'zoom_burst' : 'flash';
    });
    return plan;
  }

  async function analyzeAudioSilence(file) {
    try {
      const buf = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuf = await ctx.decodeAudioData(buf.slice(0));
      const data = audioBuf.getChannelData(0);
      const sr = audioBuf.sampleRate;
      const winSize = Math.floor(sr * 0.5);
      const silentRanges = []; let silentStart = null;
      for (let i = 0; i < data.length; i += winSize) {
        let sum = 0; const end = Math.min(i + winSize, data.length);
        for (let j = i; j < end; j++) sum += data[j] * data[j];
        const rms = Math.sqrt(sum / (end - i));
        const t = Number((i / sr).toFixed(1));
        if (rms < 0.015) { if (silentStart === null) silentStart = t; }
        else { if (silentStart !== null && t - silentStart >= 1.0) silentRanges.push({ from: silentStart, to: t }); silentStart = null; }
      }
      ctx.close();
      return { hasAudio: true, silentRanges: silentRanges.slice(0, 8) };
    } catch (_) { return { hasAudio: false }; }
  }

  function getVideoDuration(url) {
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.muted = true; v.preload = 'metadata'; v.src = url;
      v.onloadedmetadata = () => resolve(v.duration || 10);
      v.onerror = () => resolve(10);
    });
  }

  async function scanMultiClipFrames(clips) {
    const maxTotalFrames = 8;
    const perClip = Math.max(1, Math.floor(maxTotalFrames / Math.max(1, clips.length)));
    const rawFrames = []; const frameMeta = []; const clipsInfo = [];
    for (let cIdx = 0; cIdx < clips.length; cIdx++) {
      const clip = clips[cIdx];
      await new Promise((resolve) => {
        const v = document.createElement('video');
        v.muted = true; v.crossOrigin = 'anonymous'; v.playsInline = true; v.src = clip.url;
        v.onloadedmetadata = async () => {
          const dur = v.duration || 10; clip.durationSec = dur;
          clipsInfo.push({ clipIndex: cIdx, name: clip.name, durationSec: Number(dur.toFixed(1)) });
          const count = cIdx === 0 ? Math.min(maxTotalFrames - (clips.length - 1), Math.max(perClip, clips.length === 1 ? 8 : 2)) : perClip;
          const canvas = document.createElement('canvas');
          const tw = 400; const th = Math.max(180, Math.round((v.videoHeight / (v.videoWidth || 1)) * tw));
          canvas.width = tw; canvas.height = th; const ctx = canvas.getContext('2d');
          for (let i = 0; i < count && rawFrames.length < maxTotalFrames; i++) {
            const ratio = count === 1 ? 0.35 : (0.08 + (0.84 * i) / (count - 1));
            const t = Math.min(dur - 0.1, Math.max(0.05, dur * ratio));
            await new Promise((resSeek) => {
              const done = () => {
                v.removeEventListener('seeked', done);
                ctx.drawImage(v, 0, 0, tw, th);
                const b64 = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
                if (b64) { rawFrames.push(b64); frameMeta.push({ clipIndex: cIdx, t: Number(t.toFixed(1)) }); }
                resSeek();
              };
              v.addEventListener('seeked', done);
              v.currentTime = t;
            });
          }
          resolve();
        };
        v.onerror = () => { clipsInfo.push({ clipIndex: cIdx, name: clip.name, durationSec: 10 }); resolve(); };
      });
    }
    return { rawFrames, frameMeta, clipsInfo };
  }

  function normalizePlanV7(plan, clipsInfo, brandTag) {
    const p = plan && typeof plan === 'object' ? JSON.parse(JSON.stringify(plan)) : {};
    const maxClipIdx = Math.max(0, clipsInfo.length - 1);
    if (!Array.isArray(p.segments) || !p.segments.length) {
      p.segments = clipsInfo.map((c, idx) => ({
        clipIndex: idx, startSec: 0, endSec: Math.min(3.0, c.durationSec || 3), speed: 1.0,
        zoomFrom: 1.0, zoomTo: 1.12, focalX: 0.5, focalY: 0.5, easing: 'easeOutExpo',
        transition: idx === 0 ? 'flash' : 'slide_left', sfx: idx === 0 ? 'boom' : 'whoosh', label: `Cảnh Clip #${idx + 1}`
      }));
    }
    p.segments = p.segments.map((s) => {
      const ci = Math.min(maxClipIdx, Math.max(0, Number(s.clipIndex) || 0));
      const clipDur = Math.max(2, Number(clipsInfo[ci]?.durationSec) || 10);
      const st = Math.max(0, Math.min(clipDur - 0.5, Number(s.startSec) || 0));
      const en = Math.max(st + 0.6, Math.min(clipDur, Number(s.endSec) || st + 2.5));
      return {
        clipIndex: ci, startSec: Number(st.toFixed(2)), endSec: Number(en.toFixed(2)),
        speed: Math.min(1.6, Math.max(0.7, Number(s.speed) || 1.0)),
        zoomFrom: Number(s.zoomFrom) || 1.0, zoomTo: Number(s.zoomTo) || 1.12,
        focalX: Math.min(0.85, Math.max(0.15, Number(s.focalX ?? 0.5))),
        focalY: Math.min(0.85, Math.max(0.15, Number(s.focalY ?? 0.5))),
        easing: s.easing || 'easeOutExpo', transition: s.transition || 'flash',
        sfx: s.sfx || 'whoosh', label: s.label || `Cảnh Clip #${ci + 1}`
      };
    }).slice(0, 12);

    const pb = INDUSTRY_PLAYBOOKS.find((x) => x.id === syncData.preferences.industryId);
    p.lutPreset = LUT_PRESETS[p.lutPreset] ? p.lutPreset : (pb?.lut || 'tiktok_commerce');
    if (syncData.preferences.industryId === 'silver_jewelry') p.lutPreset = 'silver_platinum';
    p.aspectRatio = ['9:16', '16:9', '1:1'].includes(p.aspectRatio) ? p.aspectRatio : '9:16';
    p.textStyle = TEXT_STYLES.some((t) => t.id === p.textStyle && t.id !== 'auto') ? p.textStyle : 'hormozi';
    p.subtitles = Array.isArray(p.subtitles) ? p.subtitles : [];
    p.stickers = Array.isArray(p.stickers) ? p.stickers : [];
    p.titleCard = p.titleCard || { enabled: true, durationSec: 1.5, headline: brandTag || 'AUTOCUT PRO', subline: p.detectedGenre || 'Bản Dựng Chuyên Nghiệp' };
    p.lowerThird = p.lowerThird || { enabled: Boolean(brandTag), startSec: 2.0, endSec: 5.5, title: brandTag || 'Điểm Nhấn Nổi Bật', subtitle: 'Chất lượng chuẩn chỉnh' };
    p.endCard = p.endCard || { enabled: true, durationSec: 1.8, cta: 'Nhắn Tin / Đặt Ngay', subCta: brandTag || 'Cảm ơn bạn đã xem' };
    p.priceTag = p.priceTag || { enabled: false, origPrice: '', salePrice: '', badge: 'ƯU ĐÃI' };
    p.specCard = p.specCard || { enabled: false, title: 'THÔNG SỐ NỔI BẬT', lines: [] };
    return p;
  }

  // ================= 6. CHẠY QUÉT ĐA NGÀNH, POLICY GUARD, HOOK A/B/C & CO-PILOT =================
  function ensureClipsAvailable() {
    if (!loadedClips.length) {
      const extVid = Array.from(document.querySelectorAll('video')).find((v) => v.src && v.readyState >= 1);
      if (extVid) loadedClips.push({ file: null, url: extVid.src, name: 'Video trên màn hình chính', durationSec: extVid.duration || 10 });
    }
    return loadedClips.length > 0;
  }

  async function runAutoScanV7() {
    const statusEl = document.getElementById('ac-auto-status');
    if (!ensureClipsAvailable()) { alert('Hãy bấm chọn ít nhất 1 Video Thô (hoặc nhiều clip cùng lúc) trước!'); return; }

    const userHint = (document.getElementById('ac-auto-hint').value || '').trim();
    const kit = getActiveBrandKit();
    const brandTag = (document.getElementById('ac-brand-tag').value || kit?.name || '').trim();
    const industryPb = INDUSTRY_PLAYBOOKS.find((x) => x.id === syncData.preferences.industryId) || INDUSTRY_PLAYBOOKS[0];
    const reasoningMode = document.getElementById('ac-reasoning-mode').value;
    const preferredTextStyle = document.getElementById('ac-text-style-pref').value;
    const enableWebSearch = document.getElementById('ac-enable-search').checked;

    syncData.preferences.brandTag = brandTag;
    syncData.preferences.reasoningMode = reasoningMode;
    syncData.preferences.textStylePref = preferredTextStyle;
    syncData.preferences.enableSearch = enableWebSearch;

    try {
      statusEl.innerHTML = `<span style="color:#38bdf8;">⏳ Bước 1/3: Đang quét ${loadedClips.length} clip thô & sóng âm theo kịch bản "${industryPb.name}"...</span>`;
      const [scanData, audioStats] = await Promise.all([
        scanMultiClipFrames(loadedClips),
        loadedClips[0]?.file ? analyzeAudioSilence(loadedClips[0].file) : Promise.resolve({ hasAudio: false })
      ]);

      statusEl.innerHTML = '<span style="color:#a78bfa;">🧠 Bước 2/3: AI đang dựng đa clip, lọc chính sách nền tảng, khóa tiêu điểm (x,y) & Beat-Sync...</span>';
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_scan_and_edit',
          rawFrames: scanData.rawFrames,
          frameMeta: scanData.frameMeta,
          clipsInfo: scanData.clipsInfo,
          durationSec: scanData.clipsInfo[0]?.durationSec || 12,
          audioStats,
          beatInfo: activeSkills.has('beat_sync') ? bgmBeatInfo : null,
          industryPlaybook: industryPb,
          platformSafeZone: syncData.preferences.platformSafeZone,
          userHint,
          brandTag: kit ? `${kit.name}${kit.hotline ? ' • ' + kit.hotline : ''}` : brandTag,
          reasoningMode,
          preferredTextStyle,
          activeSkills: Array.from(activeSkills),
          behaviorProfile: syncData.behavior,
          enableWebSearch
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      currentMasterPlan = normalizePlanV7(data.plan, scanData.clipsInfo, brandTag);
      if (preferredTextStyle !== 'auto') currentMasterPlan.textStyle = preferredTextStyle;
      if (activeSkills.has('beat_sync') && bgmBeatInfo) currentMasterPlan = snapSegmentsToBeats(currentMasterPlan, bgmBeatInfo);
      if (loadedClips.length >= 2 && industryPb.split !== 'off') splitMode = industryPb.split;

      baseMasterPlan = JSON.parse(JSON.stringify(currentMasterPlan));
      hookVariants = [];
      activeHookId = 'BASE';
      copilotHistory = [];
      currentCritic = null;

      syncData.behavior.totalActions += 1;
      if (currentMasterPlan.detectedGenre) {
        syncData.behavior.recentGenres = [currentMasterPlan.detectedGenre, ...syncData.behavior.recentGenres.filter((g) => g !== currentMasterPlan.detectedGenre)].slice(0, 6);
      }

      const ttsBox = document.getElementById('ac-tts-text');
      if (ttsBox && currentMasterPlan.voiceoverScript) ttsBox.value = currentMasterPlan.voiceoverScript;

      statusEl.innerHTML = `<span style="color:#4ade80;">✓ Đã dựng xong bản Pro v7 (${data.provider})! Kiểm tra Policy Guard, Hook A/B/C & Xuất ngay.</span>`;
      renderMasterWorkspace(currentMasterPlan, data.sources || []);
      archiveCurrentProjectToSync();
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi: ${err.message}</span>`;
    }
  }

  async function runPolicySanitize() {
    if (!currentMasterPlan) return;
    const box = document.getElementById('ac-policy-box');
    const flagged = scanPlanForPolicyRisks(currentMasterPlan);
    box.innerHTML = '<div style="font-size:11.5px; color:#38bdf8;">🛡️ AI đang tự động lách các cụm từ nhạy cảm chính sách sang ngôn từ an toàn...</div>';
    try {
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'policy_sanitize', currentPlan: currentMasterPlan, platform: syncData.preferences.platformSafeZone, flaggedWords: flagged })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Lỗi lọc chính sách');
      const clipsInfo = loadedClips.map((c, i) => ({ clipIndex: i, name: c.name, durationSec: c.durationSec || 10 }));
      currentMasterPlan = normalizePlanV7(data.plan, clipsInfo.length ? clipsInfo : [{ clipIndex: 0, name: 'Clip 1', durationSec: 15 }], syncData.preferences.brandTag);
      if (activeHookId === 'BASE') baseMasterPlan = JSON.parse(JSON.stringify(currentMasterPlan));
      const ttsBox = document.getElementById('ac-tts-text');
      if (ttsBox && currentMasterPlan.voiceoverScript) ttsBox.value = currentMasterPlan.voiceoverScript;
      renderMasterWorkspace(currentMasterPlan, []);
      const b2 = document.getElementById('ac-policy-box');
      if (b2) {
        const chHtml = (data.changes || []).slice(0, 4).map((c) => `<div>• <s style="color:#f87171;">${c.before}</s> → <b style="color:#4ade80;">${c.after}</b></div>`).join('');
        b2.innerHTML = `<div style="font-size:11.5px; color:#4ade80;">✅ ${data.summary || 'Đã lách từ an toàn chính sách!'}${chHtml}</div>`;
      }
      archiveCurrentProjectToSync();
    } catch (err) {
      box.innerHTML = `<div style="font-size:11.5px; color:#f87171;">⚠️ ${err.message}</div>`;
    }
  }

  async function runGenerateABHooks() {
    if (!currentMasterPlan) return;
    const area = document.getElementById('ac-ab-hooks-area');
    area.innerHTML = '<div style="font-size:11.5px; color:#a78bfa;">🔀 Đang nhân bản 3 biến thể Hook 3 giây đầu (A: Nỗi đau / B: Kết quả / C: Tò mò)...</div>';
    try {
      const pb = INDUSTRY_PLAYBOOKS.find((x) => x.id === syncData.preferences.industryId);
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_ab_hooks', currentPlan: baseMasterPlan || currentMasterPlan, industryName: pb?.name || '', brandTag: syncData.preferences.brandTag })
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.variants?.length) throw new Error(data.error || 'Không tạo được biến thể Hook');
      hookVariants = data.variants;
      renderABHooksBar();
    } catch (err) {
      area.innerHTML = `<div style="font-size:11.5px; color:#f87171;">⚠️ ${err.message}</div>`;
    }
  }

  function applyHookVariant(variantId) {
    if (!baseMasterPlan) baseMasterPlan = JSON.parse(JSON.stringify(currentMasterPlan));
    activeHookId = variantId;
    const next = JSON.parse(JSON.stringify(baseMasterPlan));
    // Giữ lại các cấu hình priceTag/specCard/LUT/ratio người dùng vừa chỉnh
    next.lutPreset = currentMasterPlan.lutPreset;
    next.textStyle = currentMasterPlan.textStyle;
    next.aspectRatio = currentMasterPlan.aspectRatio;
    next.priceTag = currentMasterPlan.priceTag;
    next.specCard = currentMasterPlan.specCard;

    if (variantId !== 'BASE') {
      const v = hookVariants.find((x) => x.id === variantId);
      if (v) {
        if (v.titleCard) next.titleCard = { ...next.titleCard, ...v.titleCard, enabled: true };
        if (v.firstSegmentPatch && next.segments?.[0]) next.segments[0] = { ...next.segments[0], ...v.firstSegmentPatch };
        if (v.openingSubtitle && next.subtitles?.[0]) {
          next.subtitles[0] = { ...next.subtitles[0], text: v.openingSubtitle.text, highlight: v.openingSubtitle.highlight || '' };
        }
        if (v.openingVoiceLine) {
          const rest = (next.voiceoverScript || '').split(/[.!?]\s+/).slice(1).join('. ');
          next.voiceoverScript = v.openingVoiceLine + (rest ? '. ' + rest : '');
          const ttsBox = document.getElementById('ac-tts-text');
          if (ttsBox) ttsBox.value = next.voiceoverScript;
        }
      }
    }
    currentMasterPlan = next;
    renderMasterWorkspace(currentMasterPlan, []);
  }

  function renderABHooksBar() {
    const area = document.getElementById('ac-ab-hooks-area');
    if (!area) return;
    if (!hookVariants.length) {
      area.innerHTML = '<button class="acp-btn acp-btn-main" id="ac-btn-gen-ab" style="width:100%; font-size:11.5px;">🔀 Nhân Bản 3 Biến Thể Mở Đầu (Hook A / B / C)</button>';
      document.getElementById('ac-btn-gen-ab').onclick = runGenerateABHooks;
      return;
    }
    const activeObj = hookVariants.find((v) => v.id === activeHookId);
    area.innerHTML = `
      <div style="font-size:11px; font-weight:800; color:#fbbf24; margin-bottom:5px;">🔀 CHUYỂN NHANH BIẾN THỂ MỞ ĐẦU (TEST ADS / KÊNH):</div>
      <div style="display:flex; gap:5px; flex-wrap:wrap;">
        <button class="acp-btn" data-hook-id="BASE" style="padding:5px 9px; font-size:11px; background:${activeHookId === 'BASE' ? '#4f46e5' : '#1e293b'};">Bản Gốc</button>
        ${hookVariants.map((v) => `<button class="acp-btn" data-hook-id="${v.id}" style="padding:5px 9px; font-size:11px; background:${activeHookId === v.id ? '#7c3aed' : '#1e293b'};">${v.label || ('Hook ' + v.id)}</button>`).join('')}
      </div>
      ${activeObj ? `<div style="font-size:11px; color:#cbd5e1; margin-top:5px;">💡 <b>Góc ${activeObj.id}:</b> ${activeObj.angle || ''} • <i>"${activeObj.openingSubtitle?.text || ''}"</i></div>` : ''}
    `;
    area.querySelectorAll('[data-hook-id]').forEach((b) => {
      b.onclick = () => applyHookVariant(b.getAttribute('data-hook-id'));
    });
  }

  async function runCopilotChat() {
    const inp = document.getElementById('ac-copilot-input');
    const logEl = document.getElementById('ac-copilot-log');
    const cmd = (inp?.value || '').trim();
    if (!currentMasterPlan || !cmd) return;
    inp.value = '';
    copilotHistory.push({ role: 'user', text: cmd });
    renderCopilotLog();
    logEl.insertAdjacentHTML('beforeend', '<div style="font-size:11px; color:#a78bfa; padding:4px 0;">🤖 Co-Pilot đang sửa đúng chi tiết bạn yêu cầu...</div>');
    try {
      const clipsInfo = loadedClips.map((c, i) => ({ clipIndex: i, name: c.name, durationSec: c.durationSec || 10 }));
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'copilot_refine', currentPlan: currentMasterPlan, userCommand: cmd, clipsInfo, chatHistory: copilotHistory })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Lỗi Co-Pilot');
      currentMasterPlan = normalizePlanV7(data.plan, clipsInfo.length ? clipsInfo : [{ clipIndex: 0, name: 'Clip 1', durationSec: 15 }], syncData.preferences.brandTag);
      if (activeHookId === 'BASE') baseMasterPlan = JSON.parse(JSON.stringify(currentMasterPlan));
      copilotHistory.push({ role: 'ai', text: data.reply || 'Đã sửa xong!' });
      renderMasterWorkspace(currentMasterPlan, []);
      archiveCurrentProjectToSync();
    } catch (err) {
      copilotHistory.push({ role: 'ai', text: '⚠️ Lỗi: ' + err.message });
      renderCopilotLog();
    }
  }

  function renderCopilotLog() {
    const logEl = document.getElementById('ac-copilot-log');
    if (!logEl) return;
    logEl.innerHTML = copilotHistory.map((m) => `
      <div style="margin-bottom:5px; font-size:11.5px; padding:6px 8px; border-radius:8px; background:${m.role === 'user' ? '#1e293b' : '#1b1638'}; color:${m.role === 'user' ? '#e2e8f0' : '#c4b5fd'};">
        <b>${m.role === 'user' ? 'Bạn:' : 'Co-Pilot:'}</b> ${m.text}
      </div>
    `).join('');
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function runViralCritic(autoOptimize = false) {
    const box = document.getElementById('ac-critic-body');
    if (!currentMasterPlan) {
      box.innerHTML = '<div style="color:#fbbf24; font-size:12px;">Hãy tạo hoặc mở lại 1 bản dựng trước khi chấm điểm Viral!</div>';
      return;
    }
    box.innerHTML = `<div style="color:#38bdf8; font-size:12px; padding:8px;">${autoOptimize ? '🚀 AI đang nâng cấp kịch bản lên 95+ điểm...' : '📊 Đang chấm điểm thuật toán & soạn Ảnh bìa + Caption...'}</div>`;
    try {
      const clipsInfo = loadedClips.map((c, i) => ({ clipIndex: i, name: c.name, durationSec: c.durationSec || 10 }));
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'viral_critic', currentPlan: currentMasterPlan, autoOptimize, clipsInfo, brandTag: syncData.preferences.brandTag })
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.critic) throw new Error(data.error || 'Lỗi chấm điểm');
      currentCritic = data.critic;
      if (autoOptimize && data.critic.optimizedPlan) {
        currentMasterPlan = normalizePlanV7(data.critic.optimizedPlan, clipsInfo.length ? clipsInfo : [{ clipIndex: 0, name: 'Clip 1', durationSec: 15 }], syncData.preferences.brandTag);
        baseMasterPlan = JSON.parse(JSON.stringify(currentMasterPlan));
        renderMasterWorkspace(currentMasterPlan, []);
      }
      renderCriticAndPublishKit(currentCritic);
      archiveCurrentProjectToSync();
    } catch (err) {
      box.innerHTML = `<div style="color:#f87171; font-size:12px;">⚠️ ${err.message}</div>`;
    }
  }

  async function drawThumbnailCanvas(kit) {
    const canvas = document.getElementById('ac-thumb-canvas');
    if (!canvas || !kit) return;
    canvas.width = 720; canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d1f'; ctx.fillRect(0, 0, 720, 1280);
    const segIdx = Math.min((currentMasterPlan?.segments?.length || 1) - 1, Math.max(0, Number(kit.bestSegmentIndex) || 0));
    const seg = currentMasterPlan?.segments?.[segIdx];
    const clip = loadedClips[seg?.clipIndex || 0];
    if (clip?.url) {
      await new Promise((resolve) => {
        const v = document.createElement('video');
        v.muted = true; v.crossOrigin = 'anonymous'; v.src = clip.url;
        v.onloadedmetadata = () => { v.currentTime = Math.min(v.duration - 0.1, (seg?.startSec || 0) + 0.5); };
        v.onseeked = () => {
          const lut = LUT_PRESETS[currentMasterPlan?.lutPreset] || LUT_PRESETS.tiktok_commerce;
          ctx.save(); ctx.filter = lut.filter;
          const sc = Math.max(720 / (v.videoWidth || 720), 1280 / (v.videoHeight || 1280));
          const dw = (v.videoWidth || 720) * sc; const dh = (v.videoHeight || 1280) * sc;
          ctx.drawImage(v, Math.min(0, Math.max(720 - dw, 360 - (seg?.focalX ?? 0.5) * dw)), Math.min(0, Math.max(1280 - dh, 640 - (seg?.focalY ?? 0.5) * dh)), dw, dh);
          ctx.restore(); resolve();
        };
        v.onerror = resolve;
      });
    }
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, 'rgba(0,0,0,0.62)'); grad.addColorStop(0.45, 'rgba(0,0,0,0.08)'); grad.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 720, 1280);
    if (kit.thumbnailBadge) {
      ctx.font = '800 32px system-ui, sans-serif';
      const bw = ctx.measureText(kit.thumbnailBadge).width + 44;
      ctx.fillStyle = getActiveBrandKit()?.accentColor || '#ef4444';
      drawRoundedRect(ctx, 360 - bw / 2, 145, bw, 58, 999); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(kit.thumbnailBadge, 360, 175);
    }
    const lines = []; let cur = '';
    (kit.thumbnailHeadline || 'VIDEO NỔI BẬT').toUpperCase().split(/\s+/).forEach((w) => {
      if ((cur + ' ' + w).trim().length > 14) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    ctx.font = '900 64px system-ui, sans-serif'; ctx.textAlign = 'center';
    lines.forEach((ln, idx) => {
      const y = 880 + idx * 78;
      ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(ln, 360, y);
      ctx.fillStyle = idx === 0 ? '#fde047' : '#fff'; ctx.fillText(ln, 360, y);
    });
  }

  function renderCriticAndPublishKit(c) {
    const box = document.getElementById('ac-critic-body');
    if (!box || !c) return;
    const scoreColor = c.score >= 90 ? '#4ade80' : c.score >= 75 ? '#fbbf24' : '#f87171';
    const b = c.breakdown || {}; const kit = c.publishKit || {};
    box.innerHTML = `
      <div style="background:#090f1d; border:1px solid #334155; border-radius:10px; padding:12px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-size:11px; color:#94a3b8; font-weight:700;">ĐIỂM VIRAL</div>
            <div style="font-size:32px; font-weight:900; color:${scoreColor};">${c.score || 85}<span style="font-size:14px; color:#94a3b8;">/100</span></div>
          </div>
          <div style="font-size:11px; color:#cbd5e1; line-height:1.6;">
            🔥 Hook: <b>${b.hook || 85}</b> • ✂️ Nhịp: <b>${b.pacing || 85}</b><br/>
            💬 Phụ đề: <b>${b.subtitles || 85}</b> • 🎯 CTA: <b>${b.cta || 85}</b>
          </div>
        </div>
        ${(c.weaknesses || []).length ? `<div style="margin-top:8px; font-size:11.5px; color:#fca5a5;">⚠️ ${c.weaknesses.join(' • ')}</div>` : ''}
        <button class="acp-btn acp-btn-main" id="ac-btn-optimize-95" style="width:100%; margin-top:10px;">🚀 Tự Tối Ưu Lên 95+ Điểm</button>
      </div>
      <div style="background:#090f1d; border:1px solid #334155; border-radius:10px; padding:12px; margin-top:10px;">
        <div style="font-size:12px; font-weight:800; color:#fbbf24; margin-bottom:8px;">🖼️ ẢNH BÌA & BỘ ĐĂNG BÀI</div>
        <div style="text-align:center;">
          <canvas id="ac-thumb-canvas" style="max-height:210px; border-radius:8px; border:1px solid #334155;"></canvas>
          <div style="margin-top:6px;"><button class="acp-btn acp-btn-green" id="ac-dl-thumb">⬇️ Tải Ảnh Bìa (.png)</button></div>
        </div>
        <div style="margin-top:10px;">
          ${(kit.captions || []).map((cap, idx) => `
            <div style="background:#131c31; padding:8px; border-radius:8px; margin-bottom:6px; font-size:11.5px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <b style="color:#38bdf8;">Mẫu ${idx + 1}: ${cap.style || 'Caption'}</b>
                <button class="acp-btn" data-copy-cap="${idx}" style="padding:2px 8px; font-size:10px;">Copy</button>
              </div>
              <div style="color:#e2e8f0; white-space:pre-wrap;">${cap.text || ''}</div>
            </div>
          `).join('')}
          ${kit.hashtags ? `<div style="background:#131c31; padding:8px; border-radius:8px; font-size:11.5px; display:flex; justify-content:space-between; align-items:center; gap:8px;"><span style="color:#a78bfa;">${kit.hashtags}</span><button class="acp-btn" id="ac-copy-tags" style="padding:3px 8px; font-size:10px;">Copy</button></div>` : ''}
        </div>
      </div>
    `;
    document.getElementById('ac-btn-optimize-95').onclick = () => runViralCritic(true);
    document.getElementById('ac-dl-thumb').onclick = () => {
      const a = document.createElement('a'); a.href = document.getElementById('ac-thumb-canvas').toDataURL('image/png'); a.download = `AutoCut-Thumb-${Date.now()}.png`; a.click();
    };
    box.querySelectorAll('[data-copy-cap]').forEach((btn) => {
      btn.onclick = () => { const cap = kit.captions[Number(btn.dataset.copyCap)]; navigator.clipboard.writeText(`${cap.text}\n\n${kit.hashtags || ''}`); btn.textContent = 'Đã Copy ✓'; };
    });
    const ct = document.getElementById('ac-copy-tags');
    if (ct) ct.onclick = () => { navigator.clipboard.writeText(kit.hashtags); ct.textContent = 'Đã Copy ✓'; };
    drawThumbnailCanvas(kit);
  }

  // ================= 7. GIAO DIỆN WORKSPACE BẢN DỰNG (POLICY + HOOK A/B/C + ĐỒ HỌA NGÀNH) =================
  function renderMasterWorkspace(plan, sources) {
    const el = document.getElementById('ac-auto-result');
    if (!el || !plan) return;
    const lutInfo = LUT_PRESETS[plan.lutPreset] || LUT_PRESETS.tiktok_commerce;
    const totalOutSec = plan.segments.reduce((acc, s) => acc + (s.endSec - s.startSec) / s.speed, 0) + (activeSkills.has('end_card') && plan.endCard?.enabled ? Number(plan.endCard.durationSec || 1.8) : 0);
    const riskyWords = scanPlanForPolicyRisks(plan);

    const sourcesHtml = sources.length
      ? `<div style="margin-top:6px; font-size:11px; color:#94a3b8;">🌐 <b>Xu hướng:</b> ${sources.map((s) => `<a href="${s.url}" target="_blank" style="color:#38bdf8; margin-right:6px;">${s.title.slice(0, 30)}</a>`).join('')}</div>`
      : '';

    const segsHtml = plan.segments.map((s, idx) => `
      <div style="display:flex; justify-content:space-between; gap:6px; padding:4px 0; border-bottom:1px solid #1e293b; font-size:11px;">
        <span style="color:#38bdf8; font-weight:700;">#${idx + 1} C${(s.clipIndex || 0) + 1}[${s.startSec}→${s.endSec}s]</span>
        <span style="flex:1; color:#e2e8f0;">${s.label}</span>
        <span style="color:#a78bfa;">🎯(${Math.round((s.focalX ?? 0.5) * 100)}%,${Math.round((s.focalY ?? 0.5) * 100)}%) • ${s.transition}</span>
      </div>
    `).join('');

    el.innerHTML = `
      <div style="background:#090f1d; border:1px solid #334155; border-radius:10px; padding:12px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="background:#312e81; color:#e0e7ff; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700;">🎯 ${plan.detectedGenre || 'Video Pro'}</span>
          <span style="color:#4ade80; font-size:11px; font-weight:700;">~${totalOutSec.toFixed(1)}s • ${plan.aspectRatio} ${bgmBeatInfo ? `• 🥁 ${bgmBeatInfo.bpm} BPM` : ''}</span>
        </div>
        <div style="font-size:12px; color:#e2e8f0; margin-top:6px; line-height:1.45;">🧠 ${plan.thinkingSummary || ''}</div>

        <!-- BỘ LỌC CHỐNG GẬY CHÍNH SÁCH (POLICY GUARD) -->
        <div id="ac-policy-box" style="margin-top:8px; padding:8px 10px; border-radius:8px; background:${riskyWords.length ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.12)'}; border:1px solid ${riskyWords.length ? '#ef4444' : '#10b981'};">
          ${riskyWords.length ? `
            <div style="font-size:11.5px; color:#fca5a5;">🛡️ <b>Cảnh báo chính sách (${syncData.preferences.platformSafeZone.toUpperCase()}):</b> Phát hiện từ nhạy cảm: <b style="color:#f87171;">${riskyWords.join(', ')}</b></div>
            <button class="acp-btn" id="ac-btn-policy-fix" style="margin-top:6px; width:100%; background:#dc2626; font-size:11.5px;">🛡️ Lách Từ An Toàn Chính Sách (1 Chạm)</button>
          ` : `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:#4ade80;">
              <span>🛡️ <b>Policy Guard:</b> An toàn, không dính từ cấm phổ biến ✓</span>
              <button class="acp-btn" id="ac-btn-policy-fix" style="padding:3px 8px; font-size:10px; background:#065f46;">Quét sâu AI</button>
            </div>
          `}
        </div>

        <!-- BIẾN THỂ MỞ ĐẦU HOOK A/B/C -->
        <div id="ac-ab-hooks-area" style="margin-top:8px; background:#11192e; border:1px solid #2b3856; border-radius:8px; padding:8px;"></div>

        <!-- ĐỒ HỌA CHUYÊN NGÀNH: THẺ GIÁ, SPEC CARD & BEFORE/AFTER -->
        <div style="margin-top:8px; background:#11192e; border:1px solid #2b3856; border-radius:8px; padding:9px; font-size:11px;">
          <div style="font-weight:800; color:#38bdf8; margin-bottom:6px;">🎨 ĐỒ HỌA CHUYÊN NGÀNH (VẼ TRỰC TIẾP LÊN VIDEO)</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">
            <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
              <input type="checkbox" id="ac-pt-en" ${plan.priceTag?.enabled ? 'checked' : ''} /> 🏷️ Bật Thẻ Giá Sale
            </label>
            <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
              <input type="checkbox" id="ac-sc-en" ${plan.specCard?.enabled ? 'checked' : ''} /> 📋 Bật Bảng Thông Số
            </label>
          </div>
          <div id="ac-pt-fields" style="display:${plan.priceTag?.enabled ? 'grid' : 'none'}; grid-template-columns:1fr 1fr 80px; gap:5px; margin-bottom:6px;">
            <input class="acp-inp" id="ac-pt-orig" placeholder="Giá gốc (590k)" value="${plan.priceTag?.origPrice || ''}" />
            <input class="acp-inp" id="ac-pt-sale" placeholder="Giá Sale (399k)" value="${plan.priceTag?.salePrice || ''}" />
            <input class="acp-inp" id="ac-pt-badge" placeholder="Nhãn" value="${plan.priceTag?.badge || 'SALE'}" />
          </div>
          <div id="ac-sc-fields" style="display:${plan.specCard?.enabled ? 'block' : 'none'}; margin-bottom:6px;">
            <input class="acp-inp" id="ac-sc-title" placeholder="Tiêu đề bảng (VD: THÔNG SỐ CĂN HỘ)" value="${plan.specCard?.title || 'THÔNG SỐ NỔI BẬT'}" style="margin-bottom:4px;" />
            <input class="acp-inp" id="ac-sc-lines" placeholder="3 dòng cách nhau dấu | (VD: 85m² 2PN | Trung tâm | 2.8 Tỷ)" value="${(plan.specCard?.lines || []).join(' | ')}" />
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="color:#94a3b8; white-space:nowrap;">Before/After:</span>
            <select id="ac-split-mode" class="acp-sel" style="padding:5px 8px;">
              <option value="off" ${splitMode === 'off' ? 'selected' : ''}>Tắt (Chiếu nối tiếp từng clip)</option>
              <option value="lr" ${splitMode === 'lr' ? 'selected' : ''}>Chia Trái | Phải (Clip 1 Trước • Clip 2 Sau)</option>
              <option value="tb" ${splitMode === 'tb' ? 'selected' : ''}>Chia Trên / Dưới (Clip 1 Trước • Clip 2 Sau)</option>
            </select>
          </div>
        </div>

        ${sourcesHtml}
        <div style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:700; color:#fbbf24;">✂️ TIMELINE (${plan.segments.length} cảnh • ${lutInfo.name}):</span>
            ${bgmBeatInfo ? '<button class="acp-btn" id="ac-btn-snap-beats" style="padding:3px 8px; font-size:10px; background:#0284c7;">🥁 Khớp Beat</button>' : ''}
          </div>
          ${segsHtml}
        </div>

        <!-- CHAT CO-PILOT -->
        <div style="margin-top:8px; background:#11192e; border:1px solid #3b2f6e; border-radius:9px; padding:8px;">
          <div style="font-size:11px; font-weight:800; color:#c4b5fd; margin-bottom:4px;">💬 CHAT CO-PILOT — Tinh chỉnh trực tiếp</div>
          <div id="ac-copilot-log" style="max-height:100px; overflow-y:auto; margin-bottom:5px;"></div>
          <div style="display:flex; gap:5px;">
            <input class="acp-inp" id="ac-copilot-input" placeholder="VD: Cảnh 2 chậm 0.85x, đổi phụ đề đầu thành..." />
            <button class="acp-btn" id="ac-mic-copilot" data-default-label="🎙️" style="padding:0 9px;">🎙️</button>
            <button class="acp-btn acp-btn-main" id="ac-send-copilot">Sửa</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 80px; gap:5px; margin-top:8px;">
          <select id="ac-lut-override" class="acp-sel">
            ${Object.entries(LUT_PRESETS).map(([k, v]) => `<option value="${k}" ${k === plan.lutPreset ? 'selected' : ''}>🎨 ${v.name}</option>`).join('')}
          </select>
          <select id="ac-text-override" class="acp-sel">
            ${TEXT_STYLES.filter((t) => t.id !== 'auto').map((t) => `<option value="${t.id}" ${t.id === plan.textStyle ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
          <select id="ac-ratio-override" class="acp-sel">
            <option value="9:16" ${plan.aspectRatio === '9:16' ? 'selected' : ''}>9:16</option>
            <option value="16:9" ${plan.aspectRatio === '16:9' ? 'selected' : ''}>16:9</option>
            <option value="1:1" ${plan.aspectRatio === '1:1' ? 'selected' : ''}>1:1</option>
          </select>
        </div>

        <div style="margin-top:9px; text-align:center;">
          <canvas id="ac-pro-preview-canvas" style="max-width:100%; max-height:290px; border-radius:10px; background:#000; border:1px solid #334155;"></canvas>
        </div>
        <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
          <button class="acp-btn acp-btn-main" id="ac-btn-play-edl" style="flex:1;">▶️ Xem Thử</button>
          <button class="acp-btn acp-btn-green" id="ac-btn-export-edl" style="flex:1;">⬇️ Render & Xuất (${activeHookId})</button>
          <button class="acp-btn" id="ac-btn-goto-critic" style="background:#b45309;">🏆 Viral & Đăng Bài</button>
        </div>
        <div id="ac-render-progress" style="font-size:12px; color:#fbbf24; margin-top:6px; text-align:center;"></div>
      </div>
    `;

    renderABHooksBar();
    renderCopilotLog();
    preparePreviewCanvas();

    document.getElementById('ac-btn-policy-fix').onclick = runPolicySanitize;
    const syncGraphics = () => {
      currentMasterPlan.priceTag = {
        enabled: document.getElementById('ac-pt-en').checked,
        origPrice: document.getElementById('ac-pt-orig').value.trim(),
        salePrice: document.getElementById('ac-pt-sale').value.trim(),
        badge: document.getElementById('ac-pt-badge').value.trim() || 'SALE'
      };
      currentMasterPlan.specCard = {
        enabled: document.getElementById('ac-sc-en').checked,
        title: document.getElementById('ac-sc-title').value.trim() || 'THÔNG SỐ',
        lines: document.getElementById('ac-sc-lines').value.split('|').map((x) => x.trim()).filter(Boolean).slice(0, 4)
      };
      document.getElementById('ac-pt-fields').style.display = currentMasterPlan.priceTag.enabled ? 'grid' : 'none';
      document.getElementById('ac-sc-fields').style.display = currentMasterPlan.specCard.enabled ? 'block' : 'none';
    };
    ['ac-pt-en', 'ac-pt-orig', 'ac-pt-sale', 'ac-pt-badge', 'ac-sc-en', 'ac-sc-title', 'ac-sc-lines'].forEach((id) => {
      document.getElementById(id).addEventListener('change', syncGraphics);
    });
    document.getElementById('ac-split-mode').onchange = (e) => {
      splitMode = e.target.value;
      if (splitMode !== 'off' && loadedClips.length < 2) alert('Mẹo: Hãy chọn ít nhất 2 clip (Clip 1: Trước, Clip 2: Sau) để hiển thị chia đôi màn hình đẹp nhất!');
    };

    const snapBtn = document.getElementById('ac-btn-snap-beats');
    if (snapBtn) snapBtn.onclick = () => { currentMasterPlan = snapSegmentsToBeats(currentMasterPlan, bgmBeatInfo); renderMasterWorkspace(currentMasterPlan, []); archiveCurrentProjectToSync(); };
    document.getElementById('ac-send-copilot').onclick = runCopilotChat;
    document.getElementById('ac-copilot-input').onkeydown = (e) => { if (e.key === 'Enter') runCopilotChat(); };
    document.getElementById('ac-mic-copilot').onclick = function () { toggleMicDictation('ac-copilot-input', this); };
    document.getElementById('ac-lut-override').onchange = (e) => { currentMasterPlan.lutPreset = e.target.value; };
    document.getElementById('ac-text-override').onchange = (e) => { currentMasterPlan.textStyle = e.target.value; };
    document.getElementById('ac-ratio-override').onchange = (e) => { currentMasterPlan.aspectRatio = e.target.value; preparePreviewCanvas(); };
    document.getElementById('ac-btn-play-edl').onclick = () => executeRenderPipeline(false);
    document.getElementById('ac-btn-export-edl').onclick = () => executeRenderPipeline(true);
    document.getElementById('ac-btn-goto-critic').onclick = () => { switchDrawerTab('critic'); runViralCritic(false); };
  }

  // ================= 8. BỘ VẼ CANVAS v7 (SAFE-ZONE + SPLIT-SCREEN + PRICE/SPEC + BRAND KIT) =================
  function getCanvasDims(ratio) {
    if (ratio === '16:9') return { w: 1280, h: 720 };
    if (ratio === '1:1') return { w: 720, h: 720 };
    return { w: 720, h: 1280 };
  }

  function getSafeRect(w, h) {
    const z = SAFE_ZONES[syncData.preferences.platformSafeZone] || SAFE_ZONES.tiktok;
    return { top: h * z.top, bottom: h * z.bottom, left: w * z.left, right: w * z.right, cx: w * ((z.left + z.right) / 2), sw: w * (z.right - z.left) };
  }

  function preparePreviewCanvas() {
    const canvas = document.getElementById('ac-pro-preview-canvas');
    if (!canvas || !currentMasterPlan) return;
    const { w, h } = getCanvasDims(currentMasterPlan.aspectRatio);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050814'; ctx.fillRect(0, 0, w, h);
    if (syncData.preferences.showSafeZoneGuide) drawSafeZoneOverlay(ctx, w, h);
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 26px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Sẵn sàng phát thử & xuất Pro v7', w / 2, h / 2);
  }

  function drawSafeZoneOverlay(ctx, w, h) {
    const zKey = syncData.preferences.platformSafeZone;
    if (zKey === 'none') return;
    const s = getSafeRect(w, h);
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.fillRect(0, 0, w, s.top);
    ctx.fillRect(0, s.bottom, w, h - s.bottom);
    ctx.fillRect(s.right, s.top, w - s.right, s.bottom - s.top);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.78)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(s.left, s.top, s.right - s.left, s.bottom - s.top);
    ctx.setLineDash([]);
    ctx.fillStyle = '#fde047';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`VÙNG AN TOÀN ${zKey.toUpperCase()} (Tự ẩn khi xuất)`, s.left + 10, s.top + 26);
    ctx.restore();
  }

  function drawKineticSubtitle(ctx, w, h, sub, prog, styleId, safe, accentColor) {
    if (!sub || !sub.text) return;
    ctx.save();
    const rawText = styleId === 'typewriter' ? sub.text.slice(0, Math.max(1, Math.ceil(sub.text.length * Math.min(1, prog * 1.45)))) : sub.text;
    const fontSize = Math.round(w * (styleId === 'minimal_lower' || styleId === 'cinematic_clean' ? 0.042 : 0.052));
    ctx.font = `${styleId === 'cinematic_clean' ? '700' : '900'} ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const lines = []; let cur = '';
    rawText.split(/\s+/).forEach((wd) => {
      if ((cur + ' ' + wd).trim().length > 20) { if (cur) lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim();
    });
    if (cur) lines.push(cur);

    const enter = applyEasing(Math.min(1, prog / 0.16), 'springPop');
    const blockH = lines.length * fontSize * 1.3;
    // Tự động neo bên trong vùng an toàn (không bao giờ bị giỏ hàng Shopee/mô tả TikTok đè)
    const baseY = safe.bottom - blockH / 2 - 22 + (1 - enter) * 16;
    ctx.globalAlpha = Math.min(1, prog / 0.1);
    ctx.translate(safe.cx, baseY);
    if (styleId === 'hormozi' || styleId === 'karaoke_box') { const sc = 0.88 + 0.12 * enter; ctx.scale(sc, sc); }

    const hl = (sub.highlight || '').toLowerCase();
    lines.forEach((line, idx) => {
      const y = (idx - (lines.length - 1) / 2) * (fontSize * 1.28);
      const mw = Math.min(safe.sw - 24, ctx.measureText(line).width);
      const isHL = hl && line.toLowerCase().includes(hl);
      if (styleId === 'karaoke_box') {
        ctx.fillStyle = isHL ? accentColor : 'rgba(15,23,42,0.84)';
        drawRoundedRect(ctx, -mw / 2 - 18, y - fontSize / 2 - 8, mw + 36, fontSize + 16, 14); ctx.fill();
        ctx.fillStyle = isHL ? '#fde047' : '#ffffff'; ctx.fillText(line, 0, y);
      } else if (styleId === 'neon_glow') {
        ctx.shadowColor = isHL ? '#f43f5e' : accentColor; ctx.shadowBlur = 20;
        ctx.lineWidth = 4; ctx.strokeStyle = '#0f172a'; ctx.strokeText(line, 0, y);
        ctx.fillStyle = isHL ? '#fda4af' : '#e0f2fe'; ctx.fillText(line, 0, y);
      } else if (styleId === 'cinematic_clean' || styleId === 'minimal_lower') {
        ctx.fillStyle = 'rgba(0,0,0,0.44)';
        drawRoundedRect(ctx, -mw / 2 - 16, y - fontSize / 2 - 7, mw + 32, fontSize + 14, 10); ctx.fill();
        ctx.fillStyle = isHL ? '#fbbf24' : '#f8fafc'; ctx.fillText(line, 0, y);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        drawRoundedRect(ctx, -mw / 2 - 18, y - fontSize / 2 - 8, mw + 36, fontSize + 16, 12); ctx.fill();
        ctx.lineWidth = Math.max(5, Math.round(fontSize * 0.15)); ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y); ctx.fillStyle = isHL ? '#facc15' : '#ffffff'; ctx.fillText(line, 0, y);
      }
    });
    ctx.restore();
  }

  function drawIndustryGraphicsAndBrand(ctx, w, h, plan, elapsed, safe) {
    const kit = getActiveBrandKit();
    const accent = kit?.accentColor || '#7c3aed';

    // 1. Brand Kit Logo & Hotline strip (góc trên trái vùng an toàn)
    if (kit) {
      ctx.save();
      const logoImg = getBrandLogoImage(kit);
      let textX = safe.left + 8;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const lh = Math.round(w * 0.085);
        const lw = Math.round((logoImg.naturalWidth / logoImg.naturalHeight) * lh);
        drawRoundedRect(ctx, safe.left + 4, safe.top + 6, lw + 10, lh + 10, 12);
        ctx.fillStyle = 'rgba(15,23,42,0.55)'; ctx.fill();
        ctx.drawImage(logoImg, safe.left + 9, safe.top + 11, lw, lh);
        textX = safe.left + lw + 22;
      }
      if (kit.name || kit.hotline) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 8;
        ctx.font = `800 ${Math.round(w * 0.032)}px system-ui, sans-serif`;
        if (kit.name) ctx.fillText(kit.name.slice(0, 22), textX, safe.top + 30);
        if (kit.hotline) {
          ctx.fillStyle = '#fde047';
          ctx.font = `700 ${Math.round(w * 0.026)}px system-ui, sans-serif`;
          ctx.fillText(`📞 ${kit.hotline}`, textX, safe.top + 56);
        }
      }
      ctx.restore();
    }

    // 2. Thẻ Giá Gạch Ngang (Price Tag Sale) — nằm góc trên phải trong Safe Zone
    if (plan.priceTag?.enabled && (plan.priceTag.salePrice || plan.priceTag.origPrice)) {
      const pop = applyEasing(Math.min(1, elapsed / 0.5), 'springPop');
      ctx.save();
      const bw = Math.round(w * 0.34); const bh = Math.round(w * 0.21);
      const px = safe.right - bw - 8; const py = safe.top + 10;
      ctx.translate(px + bw / 2, py + bh / 2); ctx.scale(pop, pop);
      const g = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
      g.addColorStop(0, '#dc2626'); g.addColorStop(1, accent);
      ctx.fillStyle = g; drawRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 16); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047'; ctx.font = `800 ${Math.round(w * 0.026)}px system-ui, sans-serif`;
      ctx.fillText(plan.priceTag.badge || 'ƯU ĐÃI', 0, -bh * 0.28);
      if (plan.priceTag.origPrice) {
        const fsOrig = Math.round(w * 0.031);
        ctx.font = `600 ${fsOrig}px system-ui, sans-serif`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const ow = ctx.measureText(plan.priceTag.origPrice).width;
        ctx.fillText(plan.priceTag.origPrice, 0, 2);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-ow / 2 - 4, -2); ctx.lineTo(ow / 2 + 4, -2); ctx.stroke();
      }
      ctx.fillStyle = '#ffffff'; ctx.font = `900 ${Math.round(w * 0.048)}px system-ui, sans-serif`;
      ctx.fillText(plan.priceTag.salePrice || '', 0, bh * 0.30);
      ctx.restore();
    }

    // 3. Bảng Thông Số Chuyên Ngành (Spec Card — BĐS, Ô tô, Công nghệ)
    if (plan.specCard?.enabled && Array.isArray(plan.specCard.lines) && plan.specCard.lines.length) {
      const slide = applyEasing(Math.min(1, Math.max(0, (elapsed - 0.8) / 0.45)), 'easeOutExpo');
      if (elapsed >= 0.8) {
        ctx.save(); ctx.globalAlpha = slide;
        const lines = plan.specCard.lines.slice(0, 4);
        const bw = Math.min(safe.sw * 0.72, 420); const lineH = 34; const bh = 46 + lines.length * lineH;
        const x = safe.left + 8 - (1 - slide) * 80;
        const y = safe.top + (kit ? 88 : 18);
        ctx.fillStyle = 'rgba(9, 13, 28, 0.84)'; drawRoundedRect(ctx, x, y, bw, bh, 14); ctx.fill();
        ctx.fillStyle = accent; drawRoundedRect(ctx, x, y, 7, bh, 4); ctx.fill();
        ctx.textAlign = 'left'; ctx.fillStyle = '#fde047'; ctx.font = `800 ${Math.round(w * 0.029)}px system-ui, sans-serif`;
        ctx.fillText(plan.specCard.title || 'THÔNG SỐ NỔI BẬT', x + 20, y + 28);
        ctx.fillStyle = '#f8fafc'; ctx.font = `600 ${Math.round(w * 0.027)}px system-ui, sans-serif`;
        lines.forEach((ln, idx) => ctx.fillText('▪ ' + ln.slice(0, 32), x + 20, y + 58 + idx * lineH));
        ctx.restore();
      }
    }

    // 4. Title Card (trong Safe Zone)
    if (activeSkills.has('hook_3s') && plan.titleCard?.enabled && elapsed <= (plan.titleCard.durationSec || 1.6)) {
      const p = elapsed / (plan.titleCard.durationSec || 1.6);
      const inE = applyEasing(Math.min(1, p / 0.3), 'easeOutExpo');
      ctx.save(); ctx.globalAlpha = inE * (p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1);
      const y = safe.top + (safe.bottom - safe.top)
