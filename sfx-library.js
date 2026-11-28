/**
 * AutoCut Studio AI — Add-on #6: Pro Multi-Source SFX Library (36 Studio SFX + Free Web CC0 Search + Custom Importer)
 * Plugin cắm rời độc lập: Không sửa auth.js, crm.html, editor-ai-core.js, worker.js hay các add-on trước.
 * Đồng bộ nhánh riêng: autocut_saas/studio_addons/v7_sfx_library
 */
(function () {
  'use strict';

  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v7_sfx_library';
  const LOCAL_KEY = 'autocut_v7_sfx_library_state';

  const CATEGORIES = [
    { id: 'all',        label: 'Tất cả' },
    { id: 'fav',        label: '⭐ Yêu thích' },
    { id: 'transition', label: '💨 Chuyển cảnh' },
    { id: 'impact',     label: '💥 Hook' },
    { id: 'sales',      label: '💰 Bán hàng' },
    { id: 'luxury',     label: '💎 Trang sức' },
    { id: 'fnb',        label: '🍜 Ẩm thực' },
    { id: 'viral',      label: '😂 Viral/Hài' },
    { id: 'text',       label: '🔔 Phụ đề' },
    { id: 'custom',     label: '🌐 Kho Web/Máy' }
  ];

  const BUILTIN_SFX = [
    // 1. Chuyển cảnh (6)
    { id: 'cinematic_whoosh', cat: 'transition', icon: '💨', name: 'Whoosh Điện Ảnh',     tags: 'whoosh chuyen canh gio' },
    { id: 'whip_pan',         cat: 'transition', icon: '⚡', name: 'Whip Pan Vút Nhanh',  tags: 'whip pan nhanh tiktok' },
    { id: 'air_swish',        cat: 'transition', icon: '🍃', name: 'Lướt Gió Mềm',        tags: 'swish em muot vlog' },
    { id: 'glitch_zap',       cat: 'transition', icon: '📺', name: 'Glitch Nhiễu Điện',   tags: 'glitch dien tu cong nghe' },
    { id: 'tape_rewind',      cat: 'transition', icon: '⏪', name: 'Tua Băng Rewind',     tags: 'rewind tua nguoc viral' },
    { id: 'light_sweep',      cat: 'transition', icon: '✨', name: 'Lướt Ánh Sáng',       tags: 'light leak sang trong' },

    // 2. Hook & Điểm nhấn (5)
    { id: 'vine_boom',        cat: 'impact',     icon: '💥', name: 'Vine Boom TikTok',    tags: 'boom bass hook manh' },
    { id: 'sub_drop',         cat: 'impact',     icon: '🔊', name: 'Sub Bass Drop',       tags: 'sub drop tram phim' },
    { id: 'cinematic_hit',    cat: 'impact',     icon: '🥁', name: 'Đập Trống Điện Ảnh',  tags: 'hit drum impact trailer' },
    { id: 'epic_riser',       cat: 'impact',     icon: '📈', name: 'Riser Đẩy Cao Trào',  tags: 'riser cang thang mo man' },
    { id: 'heartbeat',        cat: 'impact',     icon: '💓', name: 'Nhịp Tim Hồi Hộp',    tags: 'heartbeat tim hoi hop' },

    // 3. Bán hàng & Chốt đơn (6)
    { id: 'cash_register',    cat: 'sales',      icon: '💸', name: 'Tiền Về Ka-Ching!',   tags: 'cash tien sale chot don' },
    { id: 'coin_drop',        cat: 'sales',      icon: '🪙', name: 'Rơi Xu Vàng',         tags: 'coin xu gia hoi giam gia' },
    { id: 'noti_ding',        cat: 'sales',      icon: '🔔', name: 'Ting Thông Báo Đơn',  tags: 'ding thong bao tin nhan' },
    { id: 'bubble_pop',       cat: 'sales',      icon: '🫧', name: 'Bong Bóng Pop',       tags: 'pop bat nhan sticker' },
    { id: 'mouse_click',      cat: 'sales',      icon: '🖱️', name: 'Click Giỏ Hàng',      tags: 'click bam mua gio hang' },
    { id: 'typewriter_tap',   cat: 'sales',      icon: '⌨️', name: 'Gõ Máy Chữ',          tags: 'typewriter go chu' },

    // 4. Trang sức & Sang trọng (5)
    { id: 'diamond_sparkle',  cat: 'luxury',     icon: '💎', name: 'Lấp Lánh Kim Cương',  tags: 'sparkle bac trang suc lap lanh' },
    { id: 'magic_chime',      cat: 'luxury',     icon: '🪄', name: 'Chuông Phép Thuật',   tags: 'magic chime dep lung linh' },
    { id: 'crystal_ting',     cat: 'luxury',     icon: '🥂', name: 'Kính Pha Lê Ting',    tags: 'crystal glass sang chanh' },
    { id: 'harp_gliss',       cat: 'luxury',     icon: '🎼', name: 'Đàn Hạc Sang Trọng',  tags: 'harp luxury spa tham my' },
    { id: 'velvet_shimmer',   cat: 'luxury',     icon: '🌟', name: 'Ánh Bạc Mềm Mại',     tags: 'shimmer bac xi bach kim' },

    // 5. Ẩm thực & Đời sống (5)
    { id: 'camera_shutter',   cat: 'fnb',        icon: '📸', name: 'Chụp Ảnh Shutter',    tags: 'camera chup anh can canh' },
    { id: 'sizzle_fry',       cat: 'fnb',        icon: '🍳', name: 'Xèo Chảo Nóng',       tags: 'sizzle xao nau do an fnb' },
    { id: 'crunch_bite',      cat: 'fnb',        icon: '🍟', name: 'Cắn Giòn Rụm',        tags: 'crunch gion an uong' },
    { id: 'fizz_pour',        cat: 'fnb',        icon: '🥤', name: 'Rót Nước Có Gas',     tags: 'fizz nuoc uong ca phe tra sua' },
    { id: 'clock_tick',       cat: 'fnb',        icon: '⏱️', name: 'Đếm Ngược Tích Tắc',  tags: 'tick dong ho flash sale' },

    // 6. TikTok Viral & Hài hước (5)
    { id: 'record_scratch',   cat: 'viral',      icon: '💿', name: 'Xước Đĩa Đứng Hình',  tags: 'scratch hai huoc dung hinh meme' },
    { id: 'boing_spring',     cat: 'viral',      icon: '🌀', name: 'Lò Xo Nảy Boing',     tags: 'boing hai vui nhon' },
    { id: 'wrong_buzzer',     cat: 'viral',      icon: '🚨', name: 'Còi Báo Sai',         tags: 'buzzer sai lam canh bao' },
    { id: 'tada_fanfare',     cat: 'viral',      icon: '🎉', name: 'Ta-Da Thành Công!',   tags: 'tada ket qua before after' },
    { id: 'laser_pew',        cat: 'viral',      icon: '🔫', name: 'Tia Laser Pew',       tags: 'laser game cong nghe' },

    // 7. Nhấn Phụ đề & Chữ (4)
    { id: 'wood_pop',         cat: 'text',       icon: '🪵', name: 'Gõ Mộc Tinh Tế',      tags: 'wood pop phu de' },
    { id: 'soft_bloop',       cat: 'text',       icon: '💧', name: 'Bloop Nhẹ Nhàng',     tags: 'bloop nuoc nhe' },
    { id: 'snap_finger',      cat: 'text',       icon: '🫰', name: 'Búng Tay Nhịp',       tags: 'snap bung tay beat' },
    { id: 'bell_double',      cat: 'text',       icon: '🛎️', name: 'Chuông Đôi Chú Ý',    tags: 'bell chuong luu y' }
  ];

  const COMBO_PACKS = [
    { id: 'luxury',  label: '💎 Trang sức', slots: { hook: 'velvet_shimmer', transA: 'light_sweep',      transB: 'diamond_sparkle', end: 'crystal_ting' } },
    { id: 'sales',   label: '💰 Chốt đơn',  slots: { hook: 'vine_boom',      transA: 'whip_pan',         transB: 'cash_register',   end: 'noti_ding' } },
    { id: 'fnb',     label: '🍜 Ẩm thực',   slots: { hook: 'sizzle_fry',     transA: 'air_swish',        transB: 'crunch_bite',     end: 'camera_shutter' } },
    { id: 'viral',   label: '😂 Viral/Hài', slots: { hook: 'record_scratch', transA: 'glitch_zap',       transB: 'boing_spring',    end: 'tada_fanfare' } },
    { id: 'cinema',  label: '🎬 Điện ảnh',  slots: { hook: 'cinematic_hit',  transA: 'cinematic_whoosh', transB: 'sub_drop',        end: 'epic_riser' } }
  ];

  const SLOT_META = [
    { key: 'hook',   label: '1. Mở Hook 3s' },
    { key: 'transA', label: '2. Chuyển cảnh A' },
    { key: 'transB', label: '3. Chuyển cảnh B' },
    { key: 'end',    label: '4. Chốt EndCard' }
  ];

  const FREE_WEB_SOURCES = [
    { name: 'Pixabay SFX',   url: 'https://pixabay.com/sound-effects/' },
    { name: 'Mixkit Free',   url: 'https://mixkit.co/free-sound-effects/' },
    { name: 'Freesound CC0', url: 'https://freesound.org/search/?q=&f=license%3A%22Creative+Commons+0%22' },
    { name: 'Uppbeat SFX',   url: 'https://uppbeat.io/sfx' }
  ];

  // ================= 1. TRẠNG THÁI & ĐỒNG BỘ FIREBASE CÁCH LY =================
  function defaultState() {
    return {
      replaceBasicSfx: true,
      slots: {
        hook: 'vine_boom',
        transA: 'cinematic_whoosh',
        transB: 'bubble_pop',
        end: 'diamond_sparkle'
      },
      favorites: ['vine_boom', 'cinematic_whoosh', 'cash_register', 'diamond_sparkle', 'camera_shutter'],
      customUrlSfx: [], // [{ id, name, url, source }]
      updatedAt: 0
    };
  }

  function loadLocalState() {
    try {
      const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (s && typeof s === 'object') {
        const d = defaultState();
        return {
          ...d,
          ...s,
          slots: { ...d.slots, ...(s.slots || {}) },
          favorites: Array.isArray(s.favorites) ? s.favorites : d.favorites,
          customUrlSfx: Array.isArray(s.customUrlSfx) ? s.customUrlSfx : []
        };
      }
    } catch (_) {}
    return defaultState();
  }

  let state = loadLocalState();
  let sessionLocalSfx = []; // [{ id, name, bytes (ArrayBuffer), source:'Máy tính' }]
  const rawBytesCache = new Map(); // id -> ArrayBuffer
  const decodedCache = new WeakMap(); // AudioContext -> Map(id -> AudioBuffer)

  let selectedCat = 'all';
  let searchTerm = '';
  let activeTargetSlot = 'hook';
  let syncTimer = null;

  // Biến cầu nối Render AudioContext
  let lastRenderClickAt = 0;
  let activeRenderCtx = null;
  let playingProSfx = false;
  let lastTriggeredSeg = 0;
  let lastSegTriggerWall = 0;
  let lastTotalSegs = 0;
  let endCardFired = false;
  let progressObserver = null;

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getAllSfxItems() {
    const customUrls = (state.customUrlSfx || []).map((c) => ({
      id: c.id, cat: 'custom', icon: '🌐', name: c.name, url: c.url, source: c.source || 'Web', tags: 'web custom url ' + c.name.toLowerCase()
    }));
    const locals = sessionLocalSfx.map((c) => ({
      id: c.id, cat: 'custom', icon: '📁', name: c.name, isLocal: true, source: 'Máy tính', tags: 'file local ' + c.name.toLowerCase()
    }));
    return [...locals, ...customUrls, ...BUILTIN_SFX];
  }

  function findSfxById(id) {
    return getAllSfxItems().find((x) => x.id === id) || null;
  }

  function getSfxVolume() {
    const el = document.getElementById('ac-sfx-vol');
    return Math.min(1, Math.max(0.05, Number(el ? el.value : 55) / 100));
  }

  function saveState(syncCloud = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    renderSlotsBar();
    renderSfxCatalog();
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
        const d = defaultState();
        state = {
          ...d,
          ...remote,
          slots: { ...d.slots, ...(remote.slots || {}) },
          favorites: Array.isArray(remote.favorites) ? remote.favorites : d.favorites,
          customUrlSfx: Array.isArray(remote.customUrlSfx) ? remote.customUrlSfx : []
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
        syncUIWithState();
      }
    } catch (_) {}
  }

  // ================= 2. BỘ TỔNG HỢP 36 SFX STUDIO CHẤT LƯỢNG CAO (WEB AUDIO ENGINE) =================
  function createNoiseBuf(ctx, durationSec) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function playSynthSfx(ctx, targetNode, id, volume = 0.6) {
    if (!ctx || !targetNode || !id || id === 'none') return;
    const prevFlag = playingProSfx;
    playingProSfx = true;
    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(targetNode);

      const tone = (type, fStart, fEnd, dur, gainPeak = 0.6, delay = 0) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const st = now + delay;
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(20, fStart), st);
        if (fEnd && fEnd !== fStart) osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), st + dur);
        g.gain.setValueAtTime(0.0008, st);
        g.gain.linearRampToValueAtTime(gainPeak, st + Math.min(0.02, dur * 0.25));
        g.gain.exponentialRampToValueAtTime(0.0008, st + dur);
        osc.connect(g); g.connect(master);
        osc.start(st); osc.stop(st + dur + 0.02);
      };

      const noise = (dur, filterType, fStart, fEnd, q = 1.5, gainPeak = 0.7, delay = 0) => {
        const src = ctx.createBufferSource();
        src.buffer = createNoiseBuf(ctx, dur);
        const flt = ctx.createBiquadFilter();
        const st = now + delay;
        flt.type = filterType;
        flt.Q.value = q;
        flt.frequency.setValueAtTime(Math.max(40, fStart), st);
        if (fEnd && fEnd !== fStart) flt.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), st + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0008, st);
        g.gain.linearRampToValueAtTime(gainPeak, st + Math.min(0.04, dur * 0.35));
        g.gain.exponentialRampToValueAtTime(0.0008, st + dur);
        src.connect(flt); flt.connect(g); g.connect(master);
        src.start(st); src.stop(st + dur + 0.02);
      };

      switch (id) {
        // --- 1. CHUYỂN CẢNH ---
        case 'cinematic_whoosh':
          noise(0.45, 'bandpass', 180, 2600, 1.8, 0.85);
          tone('sine', 160, 48, 0.38, 0.45, 0.06);
          break;
        case 'whip_pan':
          noise(0.18, 'bandpass', 500, 4200, 2.5, 0.9);
          tone('triangle', 600, 140, 0.16, 0.4);
          break;
        case 'air_swish':
          noise(0.32, 'highpass', 1200, 3600, 1.0, 0.45);
          break;
        case 'glitch_zap':
          for (let i = 0; i < 4; i++) {
            tone('sawtooth', 900 - i * 160, 220 + i * 240, 0.045, 0.4, i * 0.045);
            noise(0.04, 'bandpass', 2400, 800, 4, 0.45, i * 0.045);
          }
          break;
        case 'tape_rewind':
          tone('sawtooth', 260, 1800, 0.28, 0.35);
          tone('triangle', 320, 2200, 0.28, 0.28, 0.02);
          noise(0.26, 'bandpass', 900, 3200, 3, 0.28);
          break;
        case 'light_sweep':
          [523, 784, 1046, 1568].forEach((f, i) => tone('sine', f, f * 1.04, 0.35, 0.22, i * 0.04));
          noise(0.35, 'highpass', 2800, 5000, 0.8, 0.18);
          break;

        // --- 2. HOOK & ĐIỂM NHẤN ---
        case 'vine_boom':
          tone('sine', 130, 30, 0.65, 1.0);
          tone('triangle', 95, 28, 0.55, 0.55);
          noise(0.12, 'lowpass', 450, 80, 1, 0.5);
          break;
        case 'sub_drop':
          tone('sine', 110, 26, 0.85, 0.95);
          break;
        case 'cinematic_hit':
          tone('sine', 180, 36, 0.55, 0.95);
          noise(0.32, 'lowpass', 1600, 160, 1.2, 0.8);
          tone('sawtooth', 120, 42, 0.25, 0.35);
          break;
        case 'epic_riser':
          tone('sawtooth', 140, 1100, 0.78, 0.38);
          noise(0.78, 'bandpass', 300, 3800, 2.2, 0.55);
          break;
        case 'heartbeat':
          tone('sine', 92, 38, 0.16, 0.95, 0);
          tone('sine', 82, 34, 0.19, 0.75, 0.22);
          break;

        // --- 3. BÁN HÀNG & CHỐT ĐƠN ---
        case 'cash_register':
          noise(0.06, 'highpass', 2600, 5000, 2, 0.45, 0);
          tone('triangle', 1568, 1568, 0.18, 0.5, 0.06);
          tone('sine', 2093, 2093, 0.48, 0.6, 0.11);
          tone('sine', 3136, 3136, 0.42, 0.32, 0.11);
          break;
        case 'coin_drop':
          tone('sine', 988, 988, 0.09, 0.55, 0);
          tone('sine', 1318, 1318, 0.35, 0.6, 0.08);
          break;
        case 'noti_ding':
          tone('sine', 880, 880, 0.16, 0.48, 0);
          tone('sine', 1318, 1318, 0.32, 0.52, 0.1);
          break;
        case 'bubble_pop':
          tone('sine', 320, 920, 0.09, 0.72);
          break;
        case 'mouse_click':
          noise(0.025, 'highpass', 2400, 4800, 1.5, 0.75, 0);
          tone('triangle', 1400, 400, 0.025, 0.45, 0.012);
          break;
        case 'typewriter_tap':
          [0, 0.07, 0.14, 0.22].forEach((d, idx) => {
            noise(0.022, 'bandpass', 2200 + idx * 200, 1200, 2.5, 0.6, d);
            tone('square', 900, 300, 0.018, 0.22, d);
          });
          break;

        // --- 4. TRANG SỨC & SANG TRỌNG ---
        case 'diamond_sparkle':
          [1318, 1760, 2093, 2637, 3136].forEach((f, i) => tone('sine', f, f * 1.02, 0.34, 0.26, i * 0.05));
          break;
        case 'magic_chime':
          [1046, 1244, 1568, 2093, 2489].forEach((f, i) => tone('triangle', f, f, 0.4, 0.25, i * 0.055));
          break;
        case 'crystal_ting':
          tone('sine', 2349, 2349, 0.55, 0.42, 0);
          tone('sine', 3520, 3520, 0.42, 0.22, 0.01);
          break;
        case 'harp_gliss':
          [523, 587, 659, 784, 880, 1046, 1318].forEach((f, i) => tone('triangle', f, f, 0.36, 0.24, i * 0.042));
          break;
        case 'velvet_shimmer':
          [659, 987, 1318, 1975].forEach((f, i) => tone('sine', f, f * 1.01, 0.5, 0.2, i * 0.06));
          break;

        // --- 5. ẨM THỰC & ĐỜI SỐNG ---
        case 'camera_shutter':
          noise(0.045, 'highpass', 1800, 4200, 1.4, 0.8, 0);
          noise(0.05, 'bandpass', 1200, 600, 2, 0.55, 0.06);
          break;
        case 'sizzle_fry':
          noise(0.55, 'highpass', 3200, 4600, 0.9, 0.52, 0);
          noise(0.45, 'bandpass', 1800, 2800, 1.2, 0.3, 0.05);
          break;
        case 'crunch_bite':
          [0, 0.04, 0.09, 0.13].forEach((d) => noise(0.045, 'bandpass', 1400 + Math.random() * 900, 500, 1.8, 0.72, d));
          break;
        case 'fizz_pour':
          noise(0.5, 'highpass', 3800, 6000, 0.8, 0.42, 0);
          tone('sine', 420, 760, 0.35, 0.18, 0.05);
          break;
        case 'clock_tick':
          [0, 0.22, 0.44].forEach((d, i) => tone('triangle', i % 2 === 0 ? 1200 : 950, 300, 0.035, 0.55, d));
          break;

        // --- 6. TIKTOK VIRAL & HÀI ---
        case 'record_scratch':
          tone('sawtooth', 980, 190, 0.16, 0.5, 0);
          tone('sawtooth', 240, 1150, 0.14, 0.45, 0.16);
          noise(0.28, 'bandpass', 1600, 900, 2.2, 0.45, 0);
          break;
        case 'boing_spring':
          tone('sine', 190, 540, 0.14, 0.65, 0);
          tone('sine', 540, 260, 0.14, 0.5, 0.13);
          tone('sine', 260, 460, 0.16, 0.38, 0.26);
          break;
        case 'wrong_buzzer':
          tone('sawtooth', 155, 145, 0.36, 0.48, 0);
          tone('sawtooth', 163, 152, 0.36, 0.42, 0);
          break;
        case 'tada_fanfare':
          tone('triangle', 523, 523, 0.12, 0.48, 0);
          tone('triangle', 659, 659, 0.12, 0.48, 0.11);
          tone('triangle', 784, 784, 0.12, 0.48, 0.22);
          tone('triangle', 1046, 1046, 0.42, 0.55, 0.33);
          tone('sine', 1318, 1318, 0.4, 0.35, 0.33);
          break;
        case 'laser_pew':
          tone('sawtooth', 1600, 140, 0.22, 0.52);
          break;

        // --- 7. NHẤN PHỤ ĐỀ & CHỮ ---
        case 'wood_pop':
          tone('sine', 640, 320, 0.065, 0.68);
          break;
        case 'soft_bloop':
          tone('sine', 380, 580, 0.12, 0.52);
          break;
        case 'snap_finger':
          noise(0.035, 'bandpass', 2600, 1400, 3.2, 0.85, 0);
          tone('triangle', 1800, 520, 0.025, 0.4, 0);
          break;
        case 'bell_double':
          tone('sine', 1568, 1568, 0.16, 0.45, 0);
          tone('sine', 1568, 1568, 0.28, 0.48, 0.14);
          break;

        default:
          tone('sine', 360, 860, 0.09, 0.6);
      }
    } catch (_) {
    } finally {
      playingProSfx = prevFlag;
    }
  }

  // Nạp & giải mã AudioBuffer từ URL (CORS) hoặc File máy tính để ghi cứng vào file video xuất
  async function ensureCustomBuffer(ctx, item) {
    if (!ctx || !item) return null;
    let ctxMap = decodedCache.get(ctx);
    if (!ctxMap) { ctxMap = new Map(); decodedCache.set(ctx, ctxMap); }
    if (ctxMap.has(item.id)) return ctxMap.get(item.id);

    let bytes = rawBytesCache.get(item.id);
    if (!bytes && item.url) {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      bytes = await res.arrayBuffer();
      rawBytesCache.set(item.id, bytes);
    }
    if (!bytes) return null;
    const audioBuf = await ctx.decodeAudioData(bytes.slice(0));
    ctxMap.set(item.id, audioBuf);
    return audioBuf;
  }

  async function playSfxById(id, ctx, targetNode, volume = 0.6) {
    if (!id || id === 'none' || !ctx || !targetNode) return;
    const item = findSfxById(id);
    if (item && item.cat === 'custom') {
      try {
        const audioBuf = await ensureCustomBuffer(ctx, item);
        if (audioBuf) {
          const prevFlag = playingProSfx;
          playingProSfx = true;
          try {
            const src = ctx.createBufferSource();
            src.buffer = audioBuf;
            const g = ctx.createGain();
            g.gain.value = volume;
            src.connect(g);
            g.connect(targetNode);
            src.start(ctx.currentTime);
            // Tự dừng nếu âm quá dài (tối đa 3.2s cho 1 SFX)
            if (audioBuf.duration > 3.2) src.stop(ctx.currentTime + 3.2);
          } finally {
            playingProSfx = prevFlag;
          }
          return;
        }
      } catch (_) {
        // Fallback nếu link web chặn CORS khi đang nghe thử trực tiếp (không phải render)
        if (!ctx.__acIsRenderCtx && item.url) {
          try {
            const a = new Audio(item.url);
            a.volume = volume;
            a.play().catch(() => {});
            return;
          } catch (__) {}
        }
      }
      // Nếu lỗi mạng khi render thì fallback mượt về Whoosh nội bộ
      playSynthSfx(ctx, targetNode, 'cinematic_whoosh', volume);
      return;
    }
    playSynthSfx(ctx, targetNode, id, volume);
  }

  async function previewSfxNow(id) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    await playSfxById(id, ctx, ctx.destination, getSfxVolume());
    setTimeout(() => ctx.close().catch(() => {}), 3500);
  }

  // ================= 3. CẦU NỐI AN TOÀN VÀO BỘ TRỘN RENDER v6.0 (KHÔNG SỬA editor-ai-core.js) =================
  function installRenderAudioBridge() {
    if (window.__acSfxLibBridgeInstalled) return;
    window.__acSfxLibBridgeInstalled = true;

    const AudioCtxProto = (window.AudioContext || window.webkitAudioContext).prototype;

    // 1. Ghi nhận mixBus (GainNode đầu tiên của phiên Render)
    const origCreateGain = AudioCtxProto.createGain;
    AudioCtxProto.createGain = function () {
      const g = origCreateGain.apply(this, arguments);
      if (!this.__acMixBus && (performance.now() - lastRenderClickAt < 1800)) {
        this.__acIsRenderCtx = true;
        this.__acMixBus = g;
        activeRenderCtx = this;
        lastTriggeredSeg = 0;
        lastTotalSegs = 0;
        endCardFired = false;

        // Giải mã trước các âm thanh Custom đang gán vào 4 khe để phát 0ms không trễ
        Object.values(state.slots || {}).forEach((sid) => {
          const it = findSfxById(sid);
          if (it && it.cat === 'custom') ensureCustomBuffer(this, it).catch(() => {});
        });
      }
      return g;
    };

    // 2. Dọn trạng thái khi Render kết thúc
    const origClose = AudioCtxProto.close;
    AudioCtxProto.close = function () {
      if (this === activeRenderCtx) {
        activeRenderCtx = null;
        lastTriggeredSeg = 0;
      }
      return origClose.apply(this, arguments);
    };

    // 3. Tắt 6 SFX cơ bản của v6 khi người dùng bật "Dùng Kho SFX Pro thay thế" (tránh chồng 2 tiếng cùng lúc)
    const origCreateOsc = AudioCtxProto.createOscillator;
    AudioCtxProto.createOscillator = function () {
      const osc = origCreateOsc.apply(this, arguments);
      if (this.__acIsRenderCtx && state.replaceBasicSfx && !playingProSfx) {
        // Phát hiện điểm nổ EndCard ở cuối video
        if (lastTotalSegs > 0 && lastTriggeredSeg >= lastTotalSegs && !endCardFired && (performance.now() - lastSegTriggerWall > 550)) {
          endCardFired = true;
          if (state.slots.end && state.slots.end !== 'none') {
            playSfxById(state.slots.end, this, this.__acMixBus, getSfxVolume());
          }
        }
        osc.start = function () {};
        osc.stop = function () {};
      }
      return osc;
    };

    const origCreateBufSrc = AudioCtxProto.createBufferSource;
    AudioCtxProto.createBufferSource = function () {
      const src = origCreateBufSrc.apply(this, arguments);
      if (this.__acIsRenderCtx && state.replaceBasicSfx && !playingProSfx) {
        src.start = function () {};
        src.stop = function () {};
      }
      return src;
    };

    // 4. Bắt thời điểm bấm Xem Thử / Xuất Video & theo dõi chuyển cảnh qua #ac-render-progress
    function attachProgressWatcher() {
      const progEl = document.getElementById('ac-render-progress');
      if (!progEl) return;
      if (progressObserver) progressObserver.disconnect();
      progressObserver = new MutationObserver(() => {
        if (!activeRenderCtx || !activeRenderCtx.__acMixBus || !state.replaceBasicSfx) return;
        const txt = progEl.textContent || '';
        const m = txt.match(/cảnh\s+(\d+)\s*\/\s*(\d+)/i);
        if (!m) return;
        const segNum = parseInt(m[1], 10);
        const total = parseInt(m[2], 10);
        if (!segNum || segNum === lastTriggeredSeg) return;

        lastTriggeredSeg = segNum;
        lastTotalSegs = total;
        lastSegTriggerWall = performance.now();

        let slotId = state.slots.hook;
        if (segNum > 1) slotId = segNum % 2 === 0 ? state.slots.transA : state.slots.transB;
        if (slotId && slotId !== 'none') {
          playSfxById(slotId, activeRenderCtx, activeRenderCtx.__acMixBus, getSfxVolume());
        }
      });
      progressObserver.observe(progEl, { childList: true, characterData: true, subtree: true });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('#ac-btn-play-edl, #ac-btn-export-edl');
      if (btn) {
        lastRenderClickAt = performance.now();
        attachProgressWatcher();
      }
    }, true);
  }

  // ================= 4. TÌM KIẾM TRỰC TIẾP KHO WEB MIỄN PHÍ CC0 (WIKIMEDIA COMMONS CORS-SAFE) =================
  async function searchOnlineFreeSfx(query) {
    const resBox = document.getElementById('acsfx-web-results');
    const q = (query || '').trim();
    if (!q || !resBox) return;
    resBox.innerHTML = '<div style="font-size:11px; color:#38bdf8; padding:6px 0;">⏳ Đang quét kho âm thanh miễn phí CC0 (Wikimedia Audio)...</div>';

    try {
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(q + ' filetype:audio')}&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      const pages = data && data.query && data.query.pages ? Object.values(data.query.pages) : [];
      const audioItems = pages
        .map((p) => {
          const info = p.imageinfo && p.imageinfo[0];
          if (!info || !info.url) return null;
          const mime = (info.mime || '').toLowerCase();
          if (!mime.startsWith('audio/') && !/\.(ogg|mp3|wav)$/i.test(info.url)) return null;
          const cleanName = String(p.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
          return { name: cleanName.slice(0, 34), url: info.url, sizeKb: Math.round((info.size || 0) / 1024) };
        })
        .filter(Boolean)
        .slice(0, 6);

      if (!audioItems.length) {
        resBox.innerHTML = '<div style="font-size:11px; color:#fbbf24; padding:4px 0;">Không thấy kết quả phù hợp. Thử từ khóa tiếng Anh ngắn như: <b>bell, applause, laugh, whoosh, camera, ding, car</b> hoặc bấm 4 kho lớn bên dưới.</div>';
        return;
      }

      resBox.innerHTML = audioItems.map((it, idx) => `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:5px; background:#090e1a; border:1px solid #1e293b; border-radius:7px; padding:5px 7px; margin-top:4px; font-size:11px;">
          <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escHtml(it.name)}">
            🌐 <b>${escHtml(it.name)}</b> <span style="color:#64748b;">(${it.sizeKb}KB)</span>
          </div>
          <button type="button" class="acp-btn" data-web-play="${idx}" style="padding:3px 7px; font-size:10px;">▶️</button>
          <button type="button" class="acp-btn acp-btn-green" data-web-add="${idx}" style="padding:3px 7px; font-size:10px;">+ Lưu</button>
        </div>
      `).join('');

      resBox.querySelectorAll('[data-web-play]').forEach((b) => {
        b.onclick = () => {
          const it = audioItems[Number(b.getAttribute('data-web-play'))];
          if (!it) return;
          const a = new Audio(it.url);
          a.volume = getSfxVolume();
          a.play().catch(() => alert('Trình duyệt không phát được định dạng file này, hãy thử file khác.'));
        };
      });

      resBox.querySelectorAll('[data-web-add]').forEach((b) => {
        b.onclick = () => {
          const it = audioItems[Number(b.getAttribute('data-web-add'))];
          if (!it) return;
          const newId = 'web_' + Date.now();
          state.customUrlSfx = [{ id: newId, name: it.name, url: it.url, source: 'Wikimedia CC0' }, ...state.customUrlSfx].slice(0, 25);
          state.slots[activeTargetSlot] = newId;
          selectedCat = 'custom';
          saveState(true);
          renderCategoryTabs();
          b.textContent = '✓ Đã lưu';
        };
      });
    } catch (err) {
      resBox.innerHTML = `<div style="font-size:11px; color:#f87171;">⚠️ Lỗi tìm kiếm: ${escHtml(err.message)}</div>`;
    }
  }

  // ================= 5. GIAO DIỆN KHO SFX TRONG TAB 2 (🥁 Beat & SFX) =================
  function renderSlotsBar() {
    const wrap = document.getElementById('acsfx-slots-grid');
    if (!wrap) return;
    wrap.innerHTML = SLOT_META.map((sl) => {
      const sid = state.slots[sl.key] || 'none';
      const item = findSfxById(sid);
      const isSelected = activeTargetSlot === sl.key;
      return `
        <div data-pick-slot="${sl.key}" style="cursor:pointer; background:${isSelected ? '#1e1b4b' : '#090e1a'}; border:1px solid ${isSelected ? '#a78bfa' : '#23304d'}; border-radius:8px; padding:6px 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:${isSelected ? '#fde047' : '#94a3b8'}; font-weight:700;">
            <span>${sl.label}</span>
            ${item ? `<button type="button" data-slot-play="${sid}" style="border:none; background:none; color:#38bdf8; cursor:pointer; font-size:11px; padding:0;" title="Nghe thử khe này">▶️</button>` : ''}
          </div>
          <div style="font-size:11px; font-weight:700; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${item ? `${item.icon} ${escHtml(item.name)}` : '🔇 Tắt âm khe này'}
          </div>
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('[data-pick-slot]').forEach((box) => {
      box.onclick = (e) => {
        if (e.target && e.target.closest('[data-slot-play]')) return;
        activeTargetSlot = box.getAttribute('data-pick-slot');
        renderSlotsBar();
      };
    });
    wrap.querySelectorAll('[data-slot-play]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        previewSfxNow(b.getAttribute('data-slot-play'));
      };
    });

    const targetHint = document.getElementById('acsfx-active-slot-hint');
    if (targetHint) {
      const m = SLOT_META.find((x) => x.key === activeTargetSlot) || SLOT_META[0];
      targetHint.innerHTML = `Đang chọn gán cho: <b style="color:#fde047;">${m.label}</b> (Bấm 📌 ở danh sách dưới để gán)`;
    }
  }

  function renderCategoryTabs() {
    const bar = document.getElementById('acsfx-cat-bar');
    if (!bar) return;
    bar.innerHTML = CATEGORIES.map((c) => `
      <button type="button" data-sfx-cat="${c.id}" style="padding:3px 7px; border-radius:999px; font-size:10.5px; font-weight:700; cursor:pointer; border:1px solid ${selectedCat === c.id ? '#a78bfa' : '#263452'}; background:${selectedCat === c.id ? '#312e81' : '#090e1a'}; color:${selectedCat === c.id ? '#fff' : '#cbd5e1'};">${c.label}</button>
    `).join('');
    bar.querySelectorAll('[data-sfx-cat]').forEach((b) => {
      b.onclick = () => {
        selectedCat = b.getAttribute('data-sfx-cat');
        renderCategoryTabs();
        renderSfxCatalog();
      };
    });
  }

  function renderSfxCatalog() {
    const listEl = document.getElementById('acsfx-catalog-list');
    if (!listEl) return;
    const kw = searchTerm.toLowerCase().trim();
    const items = getAllSfxItems().filter((it) => {
      if (selectedCat === 'fav' && !state.favorites.includes(it.id)) return false;
      if (selectedCat !== 'all' && selectedCat !== 'fav' && it.cat !== selectedCat) return false;
      if (kw && !it.name.toLowerCase().includes(kw) && !(it.tags || '').toLowerCase().includes(kw)) return false;
      return true;
    });

    const countEl = document.getElementById('acsfx-count-lbl');
    if (countEl) countEl.textContent = `${items.length} hiệu ứng`;

    if (!items.length) {
      listEl.innerHTML = '<div style="font-size:11px; color:#94a3b8; text-align:center; padding:12px;">Không tìm thấy SFX phù hợp. Bạn có thể tìm thêm ở mục Kho Web Miễn Phí bên dưới.</div>';
      return;
    }

    listEl.innerHTML = items.map((it) => {
      const isFav = state.favorites.includes(it.id);
      const isAssigned = state.slots[activeTargetSlot] === it.id;
      const isCustom = it.cat === 'custom';
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:5px; background:${isAssigned ? '#132421' : '#090e1a'}; border:1px solid ${isAssigned ? '#10b981' : '#1e293b'}; border-radius:8px; padding:5px 7px; margin-bottom:4px; font-size:11.5px;">
          <div style="flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <span>${it.icon}</span> <b style="color:#f1f5f9;">${escHtml(it.name)}</b>
            ${it.source ? `<span style="font-size:9.5px; color:#38bdf8;">(${escHtml(it.source)})</span>` : ''}
          </div>
          <div style="display:flex; gap:3px; flex-shrink:0;">
            <button type="button" class="acp-btn" data-sfx-play="${it.id}" style="padding:3px 7px; font-size:10.5px;" title="Nghe thử">▶️</button>
            <button type="button" class="acp-btn" data-sfx-assign="${it.id}" style="padding:3px 7px; font-size:10.5px; background:${isAssigned ? '#059669' : '#4f46e5'};" title="Gán vào khe đang chọn">${isAssigned ? '✓' : '📌'}</button>
            <button type="button" class="acp-btn" data-sfx-fav="${it.id}" style="padding:3px 6px; font-size:10.5px; background:${isFav ? '#92400e' : '#1e293b'};" title="Yêu thích">${isFav ? '⭐' : '☆'}</button>
            ${isCustom ? `<button type="button" class="acp-btn" data-sfx-del="${it.id}" style="padding:3px 6px; font-size:10px; background:#7f1d1d;" title="Xóa khỏi kho">✕</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-sfx-play]').forEach((b) => {
      b.onclick = () => previewSfxNow(b.getAttribute('data-sfx-play'));
    });
    listEl.querySelectorAll('[data-sfx-assign]').forEach((b) => {
      b.onclick = () => {
        state.slots[activeTargetSlot] = b.getAttribute('data-sfx-assign');
        saveState(true);
      };
    });
    listEl.querySelectorAll('[data-sfx-fav]').forEach((b) => {
      b.onclick = () => {
        const id = b.getAttribute('data-sfx-fav');
        if (state.favorites.includes(id)) state.favorites = state.favorites.filter((x) => x !== id);
        else state.favorites.push(id);
        saveState(true);
      };
    });
    listEl.querySelectorAll('[data-sfx-del]').forEach((b) => {
      b.onclick = () => {
        const id = b.getAttribute('data-sfx-del');
        state.customUrlSfx = state.customUrlSfx.filter((x) => x.id !== id);
        sessionLocalSfx = sessionLocalSfx.filter((x) => x.id !== id);
        rawBytesCache.delete(id);
        saveState(true);
      };
    });
  }

  function syncUIWithState() {
    const chk = document.getElementById('acsfx-replace-chk');
    if (chk) chk.checked = Boolean(state.replaceBasicSfx);
    renderSlotsBar();
    renderCategoryTabs();
    renderSfxCatalog();
  }

  function mountSfxLibraryUI() {
    const tabAudio = document.getElementById('ac-tab-audio');
    if (!tabAudio || document.getElementById('acsfx-pro-sec')) return false;

    // Cập nhật nhãn tab 2 gọn đẹp để khách thấy ngay kho SFX mới
    const tabBtn = document.querySelector('#ac-pro-drawer .acp-tab[data-t="audio"]');
    if (tabBtn && !tabBtn.textContent.includes('+')) {
      tabBtn.textContent = '🥁 Beat & SFX+';
    }

    const sec = document.createElement('div');
    sec.id = 'acsfx-pro-sec';
    sec.className = 'acp-sec';
    sec.style.borderColor = '#0284c7';
    sec.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase;">🎛️ Kho SFX Studio Đa Nguồn (36+ Âm & Web)</span>
        <span style="font-size:10px; color:#4ade80; font-weight:700;">Add-on #6</span>
      </div>

      <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:#e2e8f0; cursor:pointer; margin-bottom:8px;">
        <input type="checkbox" id="acsfx-replace-chk" checked />
        Dùng Kho SFX Pro (4 khe dưới) thay 6 SFX cơ bản khi Xem Thử & Xuất
      </label>

      <!-- 5 COMBO 1 CHẠM THEO NGÀNH -->
      <div style="font-size:10.5px; color:#94a3b8; font-weight:700; margin-bottom:4px;">⚡ COMBO SFX PHỐI SẴN THEO NGÀNH (1 CHẠM):</div>
      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
        ${COMBO_PACKS.map((p) => `<button type="button" class="acp-btn" data-sfx-combo="${p.id}" style="padding:4px 8px; font-size:10.5px; background:#1e293b; border:1px solid #334155;">${p.label}</button>`).join('')}
      </div>

      <!-- 4 KHE GÁN TỰ ĐỘNG -->
      <div id="acsfx-slots-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:6px;"></div>
      <div id="acsfx-active-slot-hint" style="font-size:10.5px; color:#94a3b8; margin-bottom:7px;"></div>

      <!-- TÌM KIẾM & LỌC DANH MỤC -->
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
        <input id="acsfx-search-inp" class="acp-inp" placeholder="🔍 Tìm nhanh SFX (whoosh, tiền, xèo, bạc, cười)..." style="flex:1; padding:6px 9px;" />
        <span id="acsfx-count-lbl" style="font-size:10.5px; color:#38bdf8; font-weight:700; white-space:nowrap;"></span>
      </div>
      <div id="acsfx-cat-bar" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:7px;"></div>
      <div id="acsfx-catalog-list" style="max-height:220px; overflow-y:auto; padding-right:2px;"></div>

      <!-- CỔNG GOM TỪ WEB MIỄN PHÍ & NẠP FILE RIÊNG -->
      <div style="margin-top:10px; padding-top:9px; border-top:1px solid #23304d;">
        <div style="font-size:11px; font-weight:800; color:#fbbf24; margin-bottom:5px;">🌐 GOM THÊM SFX TỪ CÁC WEB MIỄN PHÍ</div>
        <div style="display:flex; gap:5px;">
          <input id="acsfx-web-q" class="acp-inp" placeholder="Tìm kho CC0 trực tiếp (VD: applause, bell, laugh, car)..." style="flex:1; padding:6px 8px;" />
          <button type="button" class="acp-btn acp-btn-main" id="acsfx-web-search-btn" style="padding:6px 10px; font-size:11px;">Tìm</button>
        </div>
        <div id="acsfx-web-results" style="margin-bottom:7px;"></div>

        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:7px;">
          ${FREE_WEB_SOURCES.map((w) => `<a href="${w.url}" target="_blank" rel="noopener" style="text-decoration:none; background:#0f172a; border:1px solid #334155; color:#38bdf8; padding:4px 8px; border-radius:6px; font-size:10.5px; font-weight:700;">↗ ${w.name}</a>`).join('')}
        </div>

        <input type="file" id="acsfx-local-files" accept="audio/*" multiple style="display:none;" />
        <div style="display:flex; gap:5px; margin-bottom:6px;">
          <button type="button" class="acp-btn acp-btn-green" id="acsfx-upload-btn" style="flex:1; font-size:11px;">📂 Nạp File SFX Đã Tải (.mp3/.wav/.ogg)</button>
          <button type="button" class="acp-btn" id="acsfx-toggle-url-btn" style="font-size:11px;">🔗 Dán Link</button>
        </div>
        <div id="acsfx-url-box" style="display:none; background:#090e1a; border:1px solid #23304d; border-radius:8px; padding:7px;">
          <input id="acsfx-url-name" class="acp-inp" placeholder="Đặt tên SFX (VD: Tiếng vỗ tay)..." style="margin-bottom:5px; padding:6px 8px;" />
          <div style="display:flex; gap:5px;">
            <input id="acsfx-url-link" class="acp-inp" placeholder="Dán link trực tiếp .mp3 / .wav / .ogg..." style="flex:1; padding:6px 8px;" />
            <button type="button" class="acp-btn acp-btn-main" id="acsfx-url-save" style="padding:6px 10px; font-size:11px;">Lưu</button>
          </div>
        </div>
      </div>
    `;

    tabAudio.appendChild(sec);

    // Gắn sự kiện điều khiển
    document.getElementById('acsfx-replace-chk').onchange = (e) => {
      state.replaceBasicSfx = e.target.checked;
      saveState(true);
    };

    sec.querySelectorAll('[data-sfx-combo]').forEach((b) => {
      b.onclick = () => {
        const pack = COMBO_PACKS.find((x) => x.id === b.getAttribute('data-sfx-combo'));
        if (!pack) return;
        state.slots = { ...pack.slots };
        saveState(true);
        previewSfxNow(pack.slots.hook);
      };
    });

    document.getElementById('acsfx-search-inp').oninput = (e) => {
      searchTerm = e.target.value || '';
      renderSfxCatalog();
    };

    document.getElementById('acsfx-web-search-btn').onclick = () => {
      searchOnlineFreeSfx(document.getElementById('acsfx-web-q').value);
    };
    document.getElementById('acsfx-web-q').onkeydown = (e) => {
      if (e.key === 'Enter') searchOnlineFreeSfx(e.target.value);
    };

    document.getElementById('acsfx-upload-btn').onclick = () => document.getElementById('acsfx-local-files').click();
    document.getElementById('acsfx-local-files').onchange = async (e) => {
      const files = Array.from(e.target.files || []).slice(0, 15);
      for (const f of files) {
        try {
          const bytes = await f.arrayBuffer();
          const newId = 'loc_' + Date.now() + '_' + Math.floor(Math.random() * 999);
          const cleanName = f.name.replace(/\.[^.]+$/, '').slice(0, 32);
          rawBytesCache.set(newId, bytes);
          sessionLocalSfx.unshift({ id: newId, name: cleanName, source: 'Máy tính' });
          state.slots[activeTargetSlot] = newId;
        } catch (_) {}
      }
      selectedCat = 'custom';
      renderCategoryTabs();
      saveState(false);
      e.target.value = '';
    };

    document.getElementById('acsfx-toggle-url-btn').onclick = () => {
      const box = document.getElementById('acsfx-url-box');
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('acsfx-url-save').onclick = () => {
      const nm = (document.getElementById('acsfx-url-name').value || '').trim();
      const link = (document.getElementById('acsfx-url-link').value || '').trim();
      if (!link || !/^https?:\/\//i.test(link)) { alert('Hãy dán đường link âm thanh hợp lệ bắt đầu bằng https://'); return; }
      const newId = 'url_' + Date.now();
      state.customUrlSfx = [{ id: newId, name: nm || 'SFX Web Riêng', url: link, source: 'Link Web' }, ...state.customUrlSfx].slice(0, 25);
      state.slots[activeTargetSlot] = newId;
      document.getElementById('acsfx-url-name').value = '';
      document.getElementById('acsfx-url-link').value = '';
      selectedCat = 'custom';
      renderCategoryTabs();
      saveState(true);
    };

    syncUIWithState();
    pullStateFromCloud();
    return true;
  }

  installRenderAudioBridge();

  let tries = 0;
  const bootTimer = setInterval(() => {
    tries += 1;
    if (mountSfxLibraryUI() || tries > 60) {
      clearInterval(bootTimer);
    }
  }, 250);
})();
