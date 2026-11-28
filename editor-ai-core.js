/**
 * AutoCut Studio AI v5.0 — Claude Skills Master Edition (Zero-Cost Browser Engine)
 * Cách ly 100% với auth.js, crm.html và dữ liệu tài khoản khách hàng.
 * Tích hợp: 5 Chế độ đọc hiểu Claude + Remotion Easing/Grain/Cards/Lower-Third
 * + 6 Hiệu ứng chuyển cảnh + 6 Phong cách Text động + Sticker/Icon nảy lò xo
 * + Bộ tổng hợp 6 SFX Web Audio miễn phí + Trộn âm đa kênh (Video + BGM Auto-Ducking + Giọng AI TTS)
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://autocut-ai-proxy.tommynguyen1557.workers.dev';
  const FIREBASE_URL = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const BEHAVIOR_KEY = 'autocut_claude_behavior_v5';

  // ================= 1. CẤU HÌNH KHO SKILL, MÀU LUT, CHẾ ĐỘ ĐỌC HIỂU =================
  const REASONING_MODES = [
    { id: 'deep_director',   label: '🧠 Đạo Diễn Tư Duy Sâu (Claude CoT)', desc: 'Phân tích mạch nội dung nhiều bước, chọn cảnh đắt giá & motion chuẩn' },
    { id: 'sales_converter', label: '💰 Tâm Lý Bán Hàng & Chốt Đơn AIDA',  desc: 'Đẩy USP lên đầu, chèn nhãn nổi bật & End Card kêu gọi mua hàng' },
    { id: 'viral_hook',      label: '🔥 Săn Hook 3s & Nhịp Cắt TikTok',     desc: 'Cắt nhanh 2s/cảnh, Flash/Zoom Burst + SFX bùng nổ giữ chân' },
    { id: 'storyteller',     label: '🎬 Kể Chuyện Điện Ảnh (Anthropic)',    desc: 'Chuyển động êm mượt easeInOut, Film Grain nhẹ, chữ tối giản sang trọng' },
    { id: 'brand_preserve',  label: '💎 Bảo Toàn Màu Gốc & Thương Hiệu',    desc: 'Khóa màu trung thực vật liệu (Bạc xi bạch kim không ám vàng)' }
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
    { id: 'typewriter',      label: '⌨️ Gõ máy Typewriter (Claude Plugin)' },
    { id: 'cinematic_clean', label: '✨ Tối giản Điện Ảnh (Anthropic)' },
    { id: 'neon_glow',       label: '⚡ Neon Glow phát sáng' },
    { id: 'minimal_lower',   label: '🎞️ Phụ đề mảnh gọn thấp' }
  ];

  const PRO_SKILLS = [
    { id: 'auto_silence',  name: '🔇 Cắt Khoảng Lặng',      desc: 'Quét sóng âm loại bỏ đoạn chết im lặng' },
    { id: 'hook_3s',       name: '🔥 Hook 3s + Title Card', desc: 'Mở đầu ấn tượng với thẻ tiêu đề 3 thuộc tính' },
    { id: 'remotion_ease', name: '🌊 Easing Mượt Remotion', desc: 'Zoom/Chuyển động theo đường cong vật lý easeOutExpo' },
    { id: 'fx_trans',      name: '⚡ 6 Hiệu Ứng Chuyển Cảnh', desc: 'Flash, Fade, Slide, Zoom Burst, Glitch RGB, Light Leak' },
    { id: 'film_grain',    name: '🎞️ Hạt Phim & Vignette',  desc: 'Lớp Film Grain điện ảnh chống thô cứng' },
    { id: 'pro_lut',       name: '🎨 Chỉnh Màu LUT Chuẩn',  desc: '8 bộ màu thương mại & bảo toàn màu bạc xi bạch kim' },
    { id: 'kinetic_text',  name: '💬 6 Kiểu Chữ Động',      desc: 'Hormozi, Karaoke, Typewriter, Neon, Anthropic Clean' },
    { id: 'lower_third',   name: '🏷️ Bảng Tên Lower-Third', desc: 'Nhãn trượt thương hiệu & điểm nhấn sản phẩm' },
    { id: 'stickers',      name: '✨ Biểu Tượng & Sticker', desc: 'Icon/Badge nảy lò xo đúng thời điểm vàng' },
    { id: 'end_card',      name: '🎯 Thẻ Chốt Đơn EndCard', desc: 'Khung CTA cuối video tăng chuyển đổi' },
    { id: 'sfx_synth',     name: '🔊 SFX Âm Thanh Tự Động', desc: '6 hiệu ứng Whoosh/Pop/Boom/Sparkle miễn phí' },
    { id: 'auto_reframe',  name: '📱 Tự Đóng Khung 9:16',   desc: 'Khung dọc sắc nét kèm nền mờ nghệ thuật' }
  ];

  const SFX_LIST = [
    { id: 'boom',    label: '💥 Bass Boom (Mở Hook)' },
    { id: 'whoosh',  label: '💨 Whoosh (Chuyển cảnh)' },
    { id: 'sparkle', label: '✨ Sparkle (Lấp lánh)' },
    { id: 'pop',     label: '🫧 Pop (Bật chữ/Icon)' },
    { id: 'shutter', label: '📸 Shutter (Cận cảnh)' },
    { id: 'riser',   label: '📈 Riser (Đẩy cao trào)' }
  ];

  // ================= 2. TRẠNG THÁI STUDIO =================
  function loadBehavior() {
    try {
      const saved = JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || 'null');
      if (saved) return saved;
    } catch (_) {}
    return {
      totalActions: 0,
      preferredMode: 'deep_director',
      recentGenres: [],
      learnedStyleNote: 'Sẵn sàng quét video thô và học phong cách dựng của bạn.'
    };
  }

  let behavior = loadBehavior();
  let activeSkills = new Set(PRO_SKILLS.map((s) => s.id));
  let rawVideoFile = null;
  let rawVideoUrl = null;
  let bgmFile = null;
  let bgmUrl = null;
  let attachedVoiceUrl = null;
  let attachedVoiceLabel = '';
  let lastTtsBlobUrl = null;
  let currentMasterPlan = null;
  let isRendering = false;
  let previewAnimId = null;
  let grainCanvas = null;

  function saveBehavior(syncCloud = false) {
    const top = behavior.recentGenres.slice(0, 3).join(', ');
    behavior.learnedStyleNote = behavior.totalActions > 0
      ? `Đã học ${behavior.totalActions} phiên dựng${top ? ' • Chủ đề: ' + top : ''} • Chế độ ưu thích: ${(REASONING_MODES.find((m) => m.id === behavior.preferredMode) || {}).label || behavior.preferredMode}`
      : 'Sẵn sàng áp dụng bộ Claude Skills lên video thô của bạn.';
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior));
    const el = document.getElementById('ac-behavior-summary');
    if (el) el.innerHTML = `<b>🧠 Lõi Đọc Hiểu & Học Hành Vi:</b> ${behavior.learnedStyleNote}`;
    // Lưu vào nhánh addon tách biệt hoàn toàn, KHÔNG chạm nhánh tài khoản
    if (syncCloud) {
      fetch(`${FIREBASE_URL}/autocut_saas/studio_addons/behavior_v5.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...behavior, updatedAt: Date.now() })
      }).catch(() => {});
    }
  }

  // ================= 3. ĐƯỜNG CONG CHUYỂN ĐỘNG REMOTION & HẠT PHIM =================
  function applyEasing(t, type = 'easeOutExpo') {
    const x = Math.min(1, Math.max(0, t));
    if (type === 'easeInOutCubic') return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    if (type === 'springPop') {
      const c4 = (2 * Math.PI) / 3;
      return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); // easeOutExpo mặc định
  }

  function getGrainPatternCanvas() {
    if (grainCanvas) return grainCanvas;
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 160;
    grainCanvas.height = 160;
    const gctx = grainCanvas.getContext('2d');
    const img = gctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 18;
    }
    gctx.putImageData(img, 0, 0);
    return grainCanvas;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // ================= 4. MÁY TỔNG HỢP 6 HIỆU ỨNG ÂM THANH SFX MIỄN PHÍ (WEB AUDIO) =================
  function triggerSFX(audioCtx, targetNode, type, volume = 0.55) {
    if (!audioCtx || !type || type === 'none') return;
    try {
      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(volume, now);
      master.connect(targetNode);

      if (type === 'whoosh') {
        const bufSize = Math.floor(audioCtx.sampleRate * 0.36);
        const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(280, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.16);
        filter.frequency.exponentialRampToValueAtTime(320, now + 0.35);
        filter.Q.value = 2.2;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.85, now + 0.14);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        src.connect(filter); filter.connect(g); g.connect(master);
        src.start(now); src.stop(now + 0.36);
      } else if (type === 'boom') {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(34, now + 0.48);
        g.gain.setValueAtTime(0.95, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.54);
      } else if (type === 'pop') {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        g.gain.setValueAtTime(0.7, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.12);
      } else if (type === 'sparkle') {
        [1046, 1318, 1568, 2093].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'triangle';
          const st = now + idx * 0.055;
          osc.frequency.setValueAtTime(freq, st);
          g.gain.setValueAtTime(0.001, st);
          g.gain.linearRampToValueAtTime(0.35, st + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, st + 0.32);
          osc.connect(g); g.connect(master);
          osc.start(st); osc.stop(st + 0.34);
        });
      } else if (type === 'shutter') {
        const bufSize = Math.floor(audioCtx.sampleRate * 0.09);
        const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1600;
        src.connect(hp); hp.connect(master);
        src.start(now); src.stop(now + 0.09);
      } else if (type === 'riser') {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.65);
        const lp = audioCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(400, now);
        lp.frequency.exponentialRampToValueAtTime(3200, now + 0.65);
        g.gain.setValueAtTime(0.02, now);
        g.gain.linearRampToValueAtTime(0.38, now + 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
        osc.connect(lp); lp.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.7);
      }
    } catch (_) {}
  }

  function previewSingleSFX(type) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    triggerSFX(ctx, ctx.destination, type, 0.65);
    setTimeout(() => ctx.close().catch(() => {}), 900);
  }

  // ================= 5. QUÉT VIDEO THÔ & SÓNG ÂM =================
  async function analyzeAudioTrack(file) {
    try {
      const arrBuf = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuf = await ctx.decodeAudioData(arrBuf.slice(0));
      const data = audioBuf.getChannelData(0);
      const sr = audioBuf.sampleRate;
      const winSize = Math.floor(sr * 0.5);
      const silentRanges = [];
      const highEnergyPeaks = [];
      let silentStart = null;

      for (let i = 0; i < data.length; i += winSize) {
        let sum = 0;
        const end = Math.min(i + winSize, data.length);
        for (let j = i; j < end; j++) sum += data[j] * data[j];
        const rms = Math.sqrt(sum / (end - i));
        const t = Number((i / sr).toFixed(1));
        if (rms < 0.015) {
          if (silentStart === null) silentStart = t;
        } else {
          if (silentStart !== null && t - silentStart >= 1.0) silentRanges.push({ from: silentStart, to: t });
          silentStart = null;
          if (rms > 0.14 && highEnergyPeaks.length < 10) highEnergyPeaks.push(t);
        }
      }
      ctx.close();
      return { hasAudio: true, durationSec: Number(audioBuf.duration.toFixed(1)), silentRanges: silentRanges.slice(0, 8), highEnergyPeaks };
    } catch (_) {
      return { hasAudio: false };
    }
  }

  async function scanFullVideoFrames(videoUrl, count = 8) {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.muted = true;
      v.crossOrigin = 'anonymous';
      v.playsInline = true;
      v.src = videoUrl;
      v.onloadedmetadata = async () => {
        const dur = v.duration || 10;
        const frames = [];
        const timestamps = [];
        const canvas = document.createElement('canvas');
        const targetW = 420;
        const targetH = Math.max(200, Math.round((v.videoHeight / (v.videoWidth || 1)) * targetW));
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < count; i++) {
          const ratio = 0.05 + (0.90 * i) / Math.max(1, count - 1);
          const t = Math.min(dur - 0.1, Math.max(0.05, dur * ratio));
          await new Promise((resSeek) => {
            const onSeeked = () => {
              v.removeEventListener('seeked', onSeeked);
              ctx.drawImage(v, 0, 0, targetW, targetH);
              const b64 = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
              if (b64) { frames.push(b64); timestamps.push(Number(t.toFixed(1))); }
              resSeek();
            };
            v.addEventListener('seeked', onSeeked);
            v.currentTime = t;
          });
        }
        resolve({ frames, timestamps, durationSec: dur });
      };
      v.onerror = () => reject(new Error('Không đọc được file video thô. Hãy chọn định dạng MP4/MOV/WebM chuẩn.'));
    });
  }

  function normalizePlan(plan, durationSec, brandTag) {
    const safeDur = Math.max(3, Number(durationSec) || 12);
    const p = plan && typeof plan === 'object' ? { ...plan } : {};
    if (!Array.isArray(p.segments) || !p.segments.length) {
      const segLen = Math.min(3.2, safeDur / 3);
      p.segments = [
        { startSec: 0, endSec: segLen, speed: 1.0, zoomFrom: 1.0, zoomTo: 1.12, easing: 'easeOutExpo', transition: 'flash', sfx: 'boom', label: 'Hook mở đầu' },
        { startSec: Math.min(safeDur - segLen, safeDur * 0.36), endSec: Math.min(safeDur, safeDur * 0.36 + segLen), speed: 1.05, zoomFrom: 1.08, zoomTo: 1.0, easing: 'easeInOutCubic', transition: 'slide_left', sfx: 'whoosh', label: 'Cận cảnh điểm nhấn' },
        { startSec: Math.max(0, safeDur - segLen), endSec: safeDur, speed: 1.0, zoomFrom: 1.0, zoomTo: 1.10, easing: 'easeOutExpo', transition: 'light_leak', sfx: 'sparkle', label: 'Chốt thông điệp' }
      ];
    }
    p.segments = p.segments.map((s) => {
      const st = Math.max(0, Math.min(safeDur - 0.5, Number(s.startSec) || 0));
      const en = Math.max(st + 0.6, Math.min(safeDur, Number(s.endSec) || st + 2.5));
      return {
        startSec: Number(st.toFixed(2)),
        endSec: Number(en.toFixed(2)),
        speed: Math.min(1.6, Math.max(0.7, Number(s.speed) || 1.0)),
        zoomFrom: Number(s.zoomFrom) || 1.0,
        zoomTo: Number(s.zoomTo) || 1.12,
        easing: s.easing || 'easeOutExpo',
        transition: s.transition || 'flash',
        sfx: s.sfx || 'whoosh',
        label: s.label || 'Phân đoạn'
      };
    }).slice(0, 10);

    p.lutPreset = LUT_PRESETS[p.lutPreset] ? p.lutPreset : 'tiktok_commerce';
    p.aspectRatio = ['9:16', '16:9', '1:1'].includes(p.aspectRatio) ? p.aspectRatio : '9:16';
    p.textStyle = TEXT_STYLES.some((t) => t.id === p.textStyle && t.id !== 'auto') ? p.textStyle : 'hormozi';
    p.subtitles = Array.isArray(p.subtitles) ? p.subtitles : [];
    p.stickers = Array.isArray(p.stickers) ? p.stickers : [];
    p.titleCard = p.titleCard || { enabled: true, durationSec: 1.5, headline: brandTag || 'AUTOCUT PRO', subline: p.detectedGenre || 'Bản Dựng Chuyên Nghiệp' };
    p.lowerThird = p.lowerThird || { enabled: Boolean(brandTag), startSec: 2.0, endSec: 5.5, title: brandTag || 'Điểm Nhấn Nổi Bật', subtitle: 'Chất lượng cao cấp' };
    p.endCard = p.endCard || { enabled: true, durationSec: 1.8, cta: 'Đặt Ngay Hôm Nay', subCta: brandTag || 'Cảm ơn bạn đã xem' };
    return p;
  }

  // ================= 6. CHẠY QUÉT VIDEO THÔ & LẬP KỊCH BẢN CLAUDE SKILLS =================
  async function runClaudeMasterScan() {
    const statusEl = document.getElementById('ac-auto-status');
    if (!rawVideoUrl) {
      const extVid = Array.from(document.querySelectorAll('video')).find((v) => v.src && v.readyState >= 1);
      if (extVid) rawVideoUrl = extVid.src;
    }
    if (!rawVideoUrl) {
      alert('Hãy bấm chọn 1 Video Thô trước để AI quét và tự dựng!');
      return;
    }

    const userHint = (document.getElementById('ac-auto-hint').value || '').trim();
    const brandTag = (document.getElementById('ac-brand-tag').value || '').trim();
    const reasoningMode = document.getElementById('ac-reasoning-mode').value;
    const preferredTextStyle = document.getElementById('ac-text-style-pref').value;
    const enableWebSearch = document.getElementById('ac-enable-search').checked;

    try {
      statusEl.innerHTML = '<span style="color:#38bdf8;">⏳ Bước 1/3: Đang quét 8 mốc hình & đo sóng âm khoảng lặng...</span>';
      const [scanData, audioStats] = await Promise.all([
        scanFullVideoFrames(rawVideoUrl, 8),
        rawVideoFile ? analyzeAudioTrack(rawVideoFile) : Promise.resolve({ hasAudio: false })
      ]);

      statusEl.innerHTML = '<span style="color:#a78bfa;">🧠 Bước 2/3: Đang chạy chế độ đọc hiểu Claude Skills (Motion + SFX + Text + Sticker)...</span>';
      const selectedSkillNames = Array.from(activeSkills).map((id) => {
        const s = PRO_SKILLS.find((x) => x.id === id);
        return s ? `${s.name} (${s.desc})` : id;
      });

      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_scan_and_edit',
          rawFrames: scanData.frames,
          frameTimestamps: scanData.timestamps,
          durationSec: scanData.durationSec,
          audioStats,
          userHint,
          brandTag,
          reasoningMode,
          preferredTextStyle,
          activeSkills: selectedSkillNames,
          behaviorProfile: behavior,
          enableWebSearch
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      currentMasterPlan = normalizePlan(data.plan, scanData.durationSec, brandTag);
      if (preferredTextStyle !== 'auto') currentMasterPlan.textStyle = preferredTextStyle;

      behavior.totalActions += 1;
      behavior.preferredMode = reasoningMode;
      if (currentMasterPlan.detectedGenre) {
        behavior.recentGenres = [currentMasterPlan.detectedGenre, ...behavior.recentGenres.filter((g) => g !== currentMasterPlan.detectedGenre)].slice(0, 6);
      }
      saveBehavior(true);

      const ttsBox = document.getElementById('ac-tts-text');
      if (ttsBox && currentMasterPlan.voiceoverScript) ttsBox.value = currentMasterPlan.voiceoverScript;

      statusEl.innerHTML = `<span style="color:#4ade80;">✓ Hoàn tất phân tích (${data.provider})! Bấm Xem Thử hoặc Xuất Video ngay.</span>`;
      renderMasterReport(currentMasterPlan, data.sources || []);
      preparePreviewCanvas();
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi: ${err.message}</span>`;
    }
  }

  function renderMasterReport(plan, sources) {
    const el = document.getElementById('ac-auto-result');
    const lutInfo = LUT_PRESETS[plan.lutPreset] || LUT_PRESETS.tiktok_commerce;
    const totalOutSec = plan.segments.reduce((acc, s) => acc + (s.endSec - s.startSec) / s.speed, 0) + (activeSkills.has('end_card') && plan.endCard?.enabled ? Number(plan.endCard.durationSec || 1.8) : 0);

    const sourcesHtml = sources.length
      ? `<div style="margin-top:6px; font-size:11px; color:#94a3b8;">🌐 <b>Nguồn tham khảo:</b> ${sources.map((s) => `<a href="${s.url}" target="_blank" style="color:#38bdf8; margin-right:8px;">${s.title.slice(0, 34)}</a>`).join('')}</div>`
      : '';

    const segsHtml = plan.segments.map((s, idx) => `
      <div style="display:flex; justify-content:space-between; gap:6px; padding:5px 0; border-bottom:1px solid #1e293b; font-size:11px;">
        <span style="color:#38bdf8; font-weight:700;">#${idx + 1} [${s.startSec}s→${s.endSec}s]</span>
        <span style="flex:1; color:#e2e8f0;">${s.label}</span>
        <span style="color:#a78bfa;">${s.transition} • 🔊${s.sfx}</span>
      </div>
    `).join('');

    el.innerHTML = `
      <div style="background:#090f1d; border:1px solid #334155; border-radius:10px; padding:12px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="background:#312e81; color:#e0e7ff; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700;">🎯 ${plan.detectedGenre || 'Video Thương Mại'}</span>
          <span style="color:#4ade80; font-size:11px; font-weight:700;">Thành phẩm: ~${totalOutSec.toFixed(1)}s • ${plan.aspectRatio}</span>
        </div>
        <div style="font-size:12px; color:#e2e8f0; margin-top:8px; line-height:1.45;">🧠 <b>Tư duy đạo diễn:</b> ${plan.thinkingSummary || ''}</div>
        <div style="margin-top:8px; background:#131c31; padding:8px 10px; border-radius:8px; font-size:11px; line-height:1.55;">
          <div>🔥 <b>Phong cách:</b> <span style="color:#fbbf24;">${plan.matchedReference?.styleName || 'Claude Motion Pro'}</span></div>
          <div>🎨 <b>LUT màu:</b> <span style="color:#4ade80;">${lutInfo.name}</span> • <b>Sticker:</b> ${plan.stickers.length} nhãn • <b>Phụ đề:</b> ${plan.subtitles.length} câu</div>
          <div>🎙️ <b>Âm thanh trộn kèm:</b> ${bgmUrl ? '✓ Nhạc BGM' : 'Chưa gắn BGM'} • ${attachedVoiceUrl ? '✓ Giọng đọc AI' : 'Chưa gắn Giọng AI'} • ${activeSkills.has('sfx_synth') ? '✓ 6 SFX tự động' : 'Tắt SFX'}</div>
        </div>
        ${sourcesHtml}
        <div style="margin-top:8px;">
          <div style="font-size:11px; font-weight:700; color:#fbbf24; margin-bottom:4px;">✂️ TIMELINE THỰC THI (${plan.segments.length} cảnh):</div>
          ${segsHtml}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 90px; gap:6px; margin-top:10px;">
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
        <div style="margin-top:10px; text-align:center;">
          <canvas id="ac-pro-preview-canvas" style="max-width:100%; max-height:290px; border-radius:10px; background:#000; border:1px solid #334155;"></canvas>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="acp-btn acp-btn-main" id="ac-btn-play-edl" style="flex:1;">▶️ Xem Thử (Có SFX)</button>
          <button class="acp-btn acp-btn-green" id="ac-btn-export-edl" style="flex:1;">⬇️ Render & Xuất Video</button>
        </div>
        <div id="ac-render-progress" style="font-size:12px; color:#fbbf24; margin-top:6px; text-align:center;"></div>
      </div>
    `;

    document.getElementById('ac-lut-override').onchange = (e) => { currentMasterPlan.lutPreset = e.target.value; };
    document.getElementById('ac-text-override').onchange = (e) => { currentMasterPlan.textStyle = e.target.value; };
    document.getElementById('ac-ratio-override').onchange = (e) => { currentMasterPlan.aspectRatio = e.target.value; preparePreviewCanvas(); };
    document.getElementById('ac-btn-play-edl').onclick = () => executeRenderPipeline(false);
    document.getElementById('ac-btn-export-edl').onclick = () => executeRenderPipeline(true);
  }

  // ================= 7. BỘ VẼ CANVAS: 6 KIỂU CHỮ, STICKER, TITLE CARD, LOWER THIRD, END CARD =================
  function getCanvasDims(ratio) {
    if (ratio === '16:9') return { w: 1280, h: 720 };
    if (ratio === '1:1') return { w: 720, h: 720 };
    return { w: 720, h: 1280 };
  }

  function preparePreviewCanvas() {
    const canvas = document.getElementById('ac-pro-preview-canvas');
    if (!canvas || !currentMasterPlan) return;
    const { w, h } = getCanvasDims(currentMasterPlan.aspectRatio);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050814'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 26px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Sẵn sàng phát thử & xuất bản dựng Claude Skills', w / 2, h / 2);
  }

  function drawKineticSubtitle(ctx, w, h, sub, prog, styleId) {
    if (!sub || !sub.text) return;
    ctx.save();
    const isType = styleId === 'typewriter';
    const rawText = isType ? sub.text.slice(0, Math.max(1, Math.ceil(sub.text.length * Math.min(1, prog * 1.45)))) : sub.text;
    const fontSize = Math.round(w * (styleId === 'minimal_lower' || styleId === 'cinematic_clean' ? 0.044 : 0.056));
    ctx.font = `${styleId === 'cinematic_clean' ? '700' : '900'} ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = rawText.split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach((wd) => {
      if ((cur + ' ' + wd).trim().length > 22) { if (cur) lines.push(cur); cur = wd; }
      else cur = (cur + ' ' + wd).trim();
    });
    if (cur) lines.push(cur);

    const enter = applyEasing(Math.min(1, prog / 0.16), 'springPop');
    const riseY = (1 - enter) * 18;
    const baseY = h * (styleId === 'minimal_lower' ? 0.86 : 0.77) - ((lines.length - 1) * fontSize * 0.65) + riseY;

    ctx.globalAlpha = Math.min(1, prog / 0.1);
    ctx.translate(w / 2, baseY);
    if (styleId === 'hormozi' || styleId === 'karaoke_box') {
      const sc = 0.88 + 0.12 * enter;
      ctx.scale(sc, sc);
    }

    const hl = (sub.highlight || '').toLowerCase();
    lines.forEach((line, idx) => {
      const y = idx * (fontSize * 1.3);
      const mw = ctx.measureText(line).width;
      const isHL = hl && line.toLowerCase().includes(hl);

      if (styleId === 'karaoke_box') {
        ctx.fillStyle = isHL ? '#7c3aed' : 'rgba(15, 23, 42, 0.82)';
        drawRoundedRect(ctx, -mw / 2 - 22, y - fontSize / 2 - 10, mw + 44, fontSize + 20, 16);
        ctx.fill();
        ctx.fillStyle = isHL ? '#fde047' : '#ffffff';
        ctx.fillText(line, 0, y);
      } else if (styleId === 'neon_glow') {
        ctx.shadowColor = isHL ? '#f43f5e' : '#38bdf8';
        ctx.shadowBlur = 22;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0f172a';
        ctx.strokeText(line, 0, y);
        ctx.fillStyle = isHL ? '#fda4af' : '#e0f2fe';
        ctx.fillText(line, 0, y);
      } else if (styleId === 'cinematic_clean' || styleId === 'minimal_lower') {
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        drawRoundedRect(ctx, -mw / 2 - 18, y - fontSize / 2 - 8, mw + 36, fontSize + 16, 10);
        ctx.fill();
        ctx.fillStyle = isHL ? '#fbbf24' : '#f8fafc';
        ctx.fillText(line, 0, y);
      } else {
        // hormozi & typewriter
        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        drawRoundedRect(ctx, -mw / 2 - 20, y - fontSize / 2 - 9, mw + 40, fontSize + 18, 14);
        ctx.fill();
        ctx.lineWidth = Math.max(5, Math.round(fontSize * 0.16));
        ctx.strokeStyle = '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y);
        ctx.fillStyle = isHL ? '#facc15' : '#ffffff';
        ctx.fillText(line, 0, y);
      }
    });
    ctx.restore();
  }

  function drawTitleCardOverlay(ctx, w, h, card, elapsed) {
    if (!card || !card.enabled || elapsed > (card.durationSec || 1.6)) return;
    const dur = card.durationSec || 1.6;
    const p = elapsed / dur;
    const inEase = applyEasing(Math.min(1, p / 0.3), 'easeOutExpo');
    const outAlpha = p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1;

    ctx.save();
    ctx.globalAlpha = inEase * outAlpha;
    const y = h * 0.20 + (1 - inEase) * 28;
    const fMain = Math.round(w * 0.068);
    ctx.font = `900 ${fMain}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const tw = Math.min(w * 0.88, Math.max(ctx.measureText(card.headline || '').width + 56, w * 0.56));
    const bh = fMain * 2.15;

    const grad = ctx.createLinearGradient(w / 2 - tw / 2, y - bh / 2, w / 2 + tw / 2, y + bh / 2);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.84)');
    grad.addColorStop(1, 'rgba(49, 46, 129, 0.84)');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, w / 2 - tw / 2, y - bh / 2, tw, bh, 20);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(card.headline || '', w / 2, y - fMain * 0.16);
    if (card.subline) {
      ctx.font = `600 ${Math.round(w * 0.034)}px system-ui, sans-serif`;
      ctx.fillStyle = '#fde047';
      ctx.fillText(card.subline, w / 2, y + fMain * 0.55);
    }
    ctx.restore();
  }

  function drawLowerThird(ctx, w, h, lt, elapsed) {
    if (!lt || !lt.enabled || elapsed < lt.startSec || elapsed > lt.endSec) return;
    const dur = Math.max(0.5, lt.endSec - lt.startSec);
    const local = (elapsed - lt.startSec) / dur;
    const slideIn = applyEasing(Math.min(1, local / 0.18), 'easeOutExpo');
    const slideOut = local > 0.85 ? Math.max(0, 1 - (local - 0.85) / 0.15) : 1;

    ctx.save();
    ctx.globalAlpha = slideIn * slideOut;
    const x = 28 - (1 - slideIn) * 140;
    const y = h * 0.62;
    const bw = Math.min(w * 0.72, 430);
    const bh = 86;

    ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
    drawRoundedRect(ctx, x, y, bw, bh, 14);
    ctx.fill();
    ctx.fillStyle = '#8b5cf6';
    drawRoundedRect(ctx, x, y, 8, bh, 4);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = `800 ${Math.round(w * 0.038)}px system-ui, sans-serif`;
    ctx.fillText((lt.title || '').slice(0, 28), x + 22, y + 34);
    ctx.fillStyle = '#38bdf8';
    ctx.font = `600 ${Math.round(w * 0.028)}px system-ui, sans-serif`;
    ctx.fillText((lt.subtitle || '').slice(0, 36), x + 22, y + 64);
    ctx.restore();
  }

  function drawAnimatedStickers(ctx, w, h, stickers, elapsed) {
    if (!Array.isArray(stickers)) return;
    stickers.forEach((st) => {
      if (elapsed < st.startSec || elapsed > st.endSec) return;
      const local = (elapsed - st.startSec) / Math.max(0.2, st.endSec - st.startSec);
      const pop = applyEasing(Math.min(1, local / 0.25), 'springPop');
      const alpha = local > 0.85 ? Math.max(0, 1 - (local - 0.85) / 0.15) : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      const posX = st.position === 'top_left' ? w * 0.24 : st.position === 'mid_right' ? w * 0.74 : w * 0.74;
      const posY = st.position === 'mid_right' ? h * 0.44 : h * 0.14;
      const floatY = Math.sin(elapsed * 5) * 5;

      ctx.translate(posX, posY + floatY);
      ctx.scale(pop, pop);

      const text = `${st.icon || '✨'} ${st.label || ''}`.trim();
      const fs = Math.round(w * 0.036);
      ctx.font = `800 ${fs}px system-ui, sans-serif`;
      const tw = ctx.measureText(text).width + 32;
      const th = fs + 24;

      const grad = ctx.createLinearGradient(-tw / 2, -th / 2, tw / 2, th / 2);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      drawRoundedRect(ctx, -tw / 2, -th / 2, tw, th, 999);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 0, 1);
      ctx.restore();
    });
  }

  function drawEndCardFrame(ctx, w, h, card, prog) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090d1f');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090d1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const ease = applyEasing(Math.min(1, prog / 0.35), 'springPop');
    ctx.translate(w / 2, h / 2);
    ctx.scale(0.8 + 0.2 * ease, 0.8 + 0.2 * ease);
    ctx.textAlign = 'center';

    const fBig = Math.round(w * 0.072);
    ctx.font = `900 ${fBig}px system-ui, sans-serif`;
    ctx.fillStyle = '#fde047';
    ctx.fillText(card.cta || 'Đặt Ngay Hôm Nay', 0, -24);

    if (card.subCta) {
      ctx.font = `700 ${Math.round(w * 0.04)}px system-ui, sans-serif`;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(card.subCta, 0, 44);
    }
    ctx.restore();
  }

  function drawVideoFrameV5(ctx, video, w, h, seg, segProgress, lut, elapsedOutSec, plan) {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const canvasRatio = w / h;
    const videoRatio = vw / vh;

    // 1. Easing zoom kiểu Remotion
    const easedP = activeSkills.has('remotion_ease') ? applyEasing(segProgress, seg.easing) : segProgress;
    let zoom = seg.zoomFrom + (seg.zoomTo - seg.zoomFrom) * easedP;
    let offsetX = 0;

    // Hiệu ứng chuyển cảnh hình học đầu cảnh
    const transActive = activeSkills.has('fx_trans') && segProgress < 0.16;
    const transP = transActive ? 1 - segProgress / 0.16 : 0;
    if (transActive && seg.transition === 'slide_left') offsetX = transP * w * 0.25;
    if (transActive && seg.transition === 'zoom_burst') zoom *= (1 + transP * 0.22);

    const filterStr = activeSkills.has('pro_lut') ? lut.filter : 'none';

    if (activeSkills.has('auto_reframe') && Math.abs(canvasRatio - videoRatio) > 0.35) {
      ctx.save();
      ctx.filter = `blur(24px) brightness(52%) ${filterStr !== 'none' ? filterStr : ''}`;
      const bgScale = Math.max(w / vw, h / vh) * 1.1;
      ctx.drawImage(video, (w - vw * bgScale) / 2, (h - vh * bgScale) / 2, vw * bgScale, vh * bgScale);
      ctx.restore();

      ctx.save();
      ctx.filter = filterStr;
      const fgScale = Math.min(w / vw, h / vh) * zoom * 1.06;
      ctx.drawImage(video, (w - vw * fgScale) / 2 + offsetX, (h - vh * fgScale) / 2, vw * fgScale, vh * fgScale);
      ctx.restore();
    } else {
      ctx.save();
      ctx.filter = filterStr;
      const coverScale = Math.max(w / vw, h / vh) * zoom;
      ctx.drawImage(video, (w - vw * coverScale) / 2 + offsetX, (h - vh * coverScale) / 2, vw * coverScale, vh * coverScale);
      ctx.restore();
    }

    // 2. Lớp hạt phim Film Grain + Vignette
    if (activeSkills.has('film_grain')) {
      const pattern = ctx.createPattern(getGrainPatternCanvas(), 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = 0.26;
        ctx.translate((Math.random() * 40) | 0, (Math.random() * 40) | 0);
        ctx.fillStyle = pattern;
        ctx.fillRect(-40, -40, w + 80, h + 80);
        ctx.restore();
      }
      if (lut.vignette > 0) {
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${lut.vignette})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // 3. Hiệu ứng ánh sáng / Glitch chuyển cảnh
    if (transActive) {
      if (seg.transition === 'flash') {
        ctx.fillStyle = `rgba(255,255,255,${(transP * 0.58).toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      } else if (seg.transition === 'light_leak') {
        const lg = ctx.createLinearGradient(0, 0, w, h);
        lg.addColorStop(0, `rgba(251, 146, 60, ${(transP * 0.52).toFixed(2)})`);
        lg.addColorStop(1, `rgba(168, 85, 247, ${(transP * 0.35).toFixed(2)})`);
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, w, h);
      } else if (seg.transition === 'glitch') {
        ctx.fillStyle = `rgba(56, 189, 248, ${(transP * 0.25).toFixed(2)})`;
        ctx.fillRect(0, Math.random() * h * 0.6, w, 28);
        ctx.fillStyle = `rgba(244, 63, 94, ${(transP * 0.25).toFixed(2)})`;
        ctx.fillRect(0, Math.random() * h * 0.8, w, 18);
      } else if (seg.transition === 'fade') {
        ctx.fillStyle = `rgba(0,0,0,${(transP * 0.78).toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // 4. Title Card, Lower-Third, Stickers & Kinetic Subtitles
    if (activeSkills.has('hook_3s')) drawTitleCardOverlay(ctx, w, h, plan.titleCard, elapsedOutSec);
    if (activeSkills.has('lower_third')) drawLowerThird(ctx, w, h, plan.lowerThird, elapsedOutSec);
    if (activeSkills.has('stickers')) drawAnimatedStickers(ctx, w, h, plan.stickers, elapsedOutSec);

    if (activeSkills.has('kinetic_text') && plan.subtitles.length) {
      const sub = plan.subtitles.find((s) => elapsedOutSec >= Number(s.startSec) && elapsedOutSec <= Number(s.endSec));
      if (sub) {
        const subProg = (elapsedOutSec - Number(sub.startSec)) / Math.max(0.2, Number(sub.endSec) - Number(sub.startSec));
        drawKineticSubtitle(ctx, w, h, sub, subProg, plan.textStyle);
      }
    }
    ctx.restore();
  }

  // ================= 8. ĐỘNG CƠ RENDER & TRỘN ÂM ĐA KÊNH (VIDEO + BGM AUTO-DUCKING + GIỌNG AI + SFX) =================
  async function executeRenderPipeline(exportFile = false) {
    if (!currentMasterPlan || !rawVideoUrl || isRendering) return;
    isRendering = true;

    const progEl = document.getElementById('ac-render-progress');
    const canvas = document.getElementById('ac-pro-preview-canvas');
    const { w, h } = getCanvasDims(currentMasterPlan.aspectRatio);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const lut = LUT_PRESETS[currentMasterPlan.lutPreset] || LUT_PRESETS.tiktok_commerce;

    const v = document.createElement('video');
    v.src = rawVideoUrl; v.crossOrigin = 'anonymous'; v.playsInline = true; v.muted = false;

    const bgmAudio = bgmUrl ? new Audio(bgmUrl) : null;
    const voiceAudio = attachedVoiceUrl ? new Audio(attachedVoiceUrl) : null;
    if (bgmAudio) { bgmAudio.loop = true; bgmAudio.crossOrigin = 'anonymous'; }
    if (voiceAudio) { voiceAudio.crossOrigin = 'anonymous'; }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const mixBus = audioCtx.createGain();
    mixBus.connect(audioCtx.destination);
    const destNode = exportFile ? audioCtx.createMediaStreamDestination() : null;
    if (destNode) mixBus.connect(destNode);

    const bgmVol = Number(document.getElementById('ac-bgm-vol')?.value || 30) / 100;
    const autoDuck = Boolean(document.getElementById('ac-auto-duck')?.checked);
    const origMute = Boolean(document.getElementById('ac-mute-orig')?.checked);
    const sfxVol = Number(document.getElementById('ac-sfx-vol')?.value || 55) / 100;

    let mediaRecorder = null;
    const recordedChunks = [];

    try {
      await new Promise((res, rej) => {
        v.onloadedmetadata = res;
        v.onerror = () => rej(new Error('Không thể nạp video để render'));
      });

      // Kết nối nguồn âm thanh vào Mixer
      try {
        const vSrc = audioCtx.createMediaElementSource(v);
        const vGain = audioCtx.createGain();
        vGain.gain.value = origMute ? 0 : 1;
        vSrc.connect(vGain); vGain.connect(mixBus);
      } catch (_) {}

      if (bgmAudio) {
        const bSrc = audioCtx.createMediaElementSource(bgmAudio);
        const bGain = audioCtx.createGain();
        // Auto-Ducking: tự hạ nhạc nền khi có gắn giọng đọc AI
        bGain.gain.value = (voiceAudio && autoDuck) ? bgmVol * 0.35 : bgmVol;
        bSrc.connect(bGain); bGain.connect(mixBus);
      }
      if (voiceAudio) {
        const voSrc = audioCtx.createMediaElementSource(voiceAudio);
        const voGain = audioCtx.createGain();
        voGain.gain.value = 1.05;
        voSrc.connect(voGain); voGain.connect(mixBus);
      }

      let chosenMime = 'video/webm';
      let fileExt = 'webm';
      if (exportFile) {
        const stream = canvas.captureStream(30);
        if (destNode) destNode.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        const cands = [
          { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
          { mime: 'video/mp4', ext: 'mp4' },
          { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
          { mime: 'video/webm', ext: 'webm' }
        ];
        const found = cands.find((c) => window.MediaRecorder && MediaRecorder.isTypeSupported(c.mime));
        if (found) { chosenMime = found.mime; fileExt = found.ext; }
        mediaRecorder = new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: 5200000 });
        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.start(250);
      }

      if (bgmAudio) await bgmAudio.play().catch(() => {});
      if (voiceAudio) await voiceAudio.play().catch(() => {});

      const segs = currentMasterPlan.segments;
      const triggeredStickers = new Set();
      let elapsedOut = 0;

      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        progEl.textContent = exportFile
          ? `🎬 Đang Render & Xuất cảnh ${i + 1}/${segs.length}: ${seg.label}...`
          : `▶️ Phát thử cảnh ${i + 1}/${segs.length}: ${seg.label}`;

        v.playbackRate = seg.speed;
        v.currentTime = seg.startSec;
        await new Promise((r) => {
          const done = () => { v.removeEventListener('seeked', done); r(); };
          v.addEventListener('seeked', done);
        });

        if (activeSkills.has('sfx_synth') && seg.sfx && seg.sfx !== 'none') {
          triggerSFX(audioCtx, mixBus, seg.sfx, sfxVol);
        }

        await v.play();
        const segStartWall = performance.now();
        const segOutDur = (seg.endSec - seg.startSec) / seg.speed;

        await new Promise((resolveSeg) => {
          function tick() {
            const localElapsed = (performance.now() - segStartWall) / 1000;
            const prog = Math.min(1, localElapsed / Math.max(0.1, segOutDur));
            const curOut = elapsedOut + localElapsed;

            // Bật SFX cho sticker khi vừa xuất hiện
            if (activeSkills.has('sfx_synth') && activeSkills.has('stickers')) {
              currentMasterPlan.stickers.forEach((st, idx) => {
                if (!triggeredStickers.has(idx) && curOut >= st.startSec) {
                  triggeredStickers.add(idx);
                  triggerSFX(audioCtx, mixBus, st.sfx || 'pop', sfxVol * 0.75);
                }
              });
            }

            drawVideoFrameV5(ctx, v, w, h, seg, prog, lut, curOut, currentMasterPlan);
            if (v.currentTime >= seg.endSec || v.ended || localElapsed >= segOutDur + 0.08) {
              v.pause();
              cancelAnimationFrame(previewAnimId);
              resolveSeg();
              return;
            }
            previewAnimId = requestAnimationFrame(tick);
          }
          previewAnimId = requestAnimationFrame(tick);
        });
        elapsedOut += segOutDur;
      }

      // Render End Card CTA nếu đang bật
      if (activeSkills.has('end_card') && currentMasterPlan.endCard?.enabled) {
        const endDur = Number(currentMasterPlan.endCard.durationSec || 1.8);
        if (activeSkills.has('sfx_synth')) triggerSFX(audioCtx, mixBus, 'sparkle', sfxVol);
        const endStart = performance.now();
        await new Promise((resEnd) => {
          function tickEnd() {
            const le = (performance.now() - endStart) / 1000;
            drawEndCardFrame(ctx, w, h, currentMasterPlan.endCard, Math.min(1, le / endDur));
            if (le >= endDur) { cancelAnimationFrame(previewAnimId); resEnd(); return; }
            previewAnimId = requestAnimationFrame(tickEnd);
          }
          previewAnimId = requestAnimationFrame(tickEnd);
        });
      }

      if (exportFile && mediaRecorder) {
        await new Promise((resStop) => { mediaRecorder.onstop = resStop; mediaRecorder.stop(); });
        const blob = new Blob(recordedChunks, { type: chosenMime });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `AutoCut-ClaudeSkills-v5-${Date.now()}.${fileExt}`;
        document.body.appendChild(a); a.click(); a.remove();
        progEl.innerHTML = `<span style="color:#4ade80;">✓ Đã xuất xong video thành phẩm (.${fileExt}) kèm đầy đủ hiệu ứng & âm thanh!</span>`;
      } else {
        progEl.innerHTML = `<span style="color:#4ade80;">✓ Phát thử xong! Bấm "Render & Xuất Video" để lưu về máy.</span>`;
      }
    } catch (err) {
      progEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi Render: ${err.message}</span>`;
    } finally {
      v.pause();
      if (bgmAudio) { bgmAudio.pause(); bgmAudio.currentTime = 0; }
      if (voiceAudio) { voiceAudio.pause(); voiceAudio.currentTime = 0; }
      audioCtx.close().catch(() => {});
      isRendering = false;
    }
  }

  // ================= 9. PHÒNG THU GIỌNG NÓI 2 CHIỀU (STT <-> TTS + GẮN THẲNG VÀO RENDER) =================
  let recognition = null;
  let isListening = false;

  function toggleMicDictation(targetId, btnEl) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { alert('Hãy mở bằng Google Chrome hoặc Microsoft Edge để dùng Micro trực tiếp!'); return; }
    if (isListening && recognition) { recognition.stop(); return; }
    recognition = new SpeechRec();
    recognition.lang = 'vi-VN'; recognition.continuous = true; recognition.interimResults = true;
    const target = document.getElementById(targetId);
    const baseText = target ? target.value.trim() : '';

    recognition.onstart = () => { isListening = true; btnEl.textContent = '🔴 Đang nghe... (Dừng)'; btnEl.style.background = '#dc2626'; };
    recognition.onresult = (event) => {
      let tr = '';
      for (let i = 0; i < event.results.length; i++) tr += event.results[i][0].transcript;
      if (target) target.value = (baseText ? baseText + ' ' : '') + tr.trim();
    };
    recognition.onend = () => { isListening = false; btnEl.textContent = btnEl.dataset.defaultLabel; btnEl.style.background = ''; };
    recognition.start();
  }

  async function transcribeAudioFile(file) {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { alert('File âm thanh bóc băng nên nhỏ hơn 12MB.'); return; }
    const st = document.getElementById('ac-stt-status');
    st.textContent = '⏳ AI đang nghe và chuyển sang văn bản + phụ đề...';
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = String(reader.result).split(',')[1];
        const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
        const res = await fetch(proxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'transcribe', audioBase64: b64, audioMime: file.type || 'audio/mp3' })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Lỗi bóc băng');
        document.getElementById('ac-tts-text').value = data.fullText || '';
        if (currentMasterPlan && Array.isArray(data.subtitles) && data.subtitles.length) {
          currentMasterPlan.subtitles = data.subtitles;
        }
        st.innerHTML = `<span style="color:#4ade80;">✓ Đã chuyển sang chữ thành công (${data.subtitles?.length || 0} dòng phụ đề)!</span>`;
      } catch (e) { st.innerHTML = `<span style="color:#f87171;">⚠️ ${e.message}</span>`; }
    };
    reader.readAsDataURL(file);
  }

  async function runTextToSpeech() {
    const text = (document.getElementById('ac-tts-text').value || '').trim();
    const voice = document.getElementById('ac-tts-voice').value;
    const speed = parseFloat(document.getElementById('ac-tts-speed').value || '1.0');
    const st = document.getElementById('ac-tts-status');
    const playerWrap = document.getElementById('ac-tts-player');
    if (!text) { alert('Hãy nhập lời bình trước!'); return; }

    st.textContent = '⏳ Đang tạo giọng đọc AI Studio...';
    playerWrap.innerHTML = '';
    try {
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tts', text, voice, speed })
      });
      const data = await res.json();
      if (data.audioBase64) {
        if (lastTtsBlobUrl) URL.revokeObjectURL(lastTtsBlobUrl);
        const bin = atob(data.audioBase64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const ext = (data.audioMime || '').includes('wav') ? 'wav' : 'mp3';
        const blob = new Blob([arr], { type: data.audioMime || 'audio/wav' });
        lastTtsBlobUrl = URL.createObjectURL(blob);
        st.innerHTML = `<span style="color:#4ade80;">✓ Đã tạo giọng đọc (${data.provider || 'AI Studio'})!</span>`;
        playerWrap.innerHTML = `
          <audio controls autoplay src="${lastTtsBlobUrl}" style="width:100%; height:36px; margin-top:6px;"></audio>
          <div style="display:flex; gap:8px; margin-top:6px; align-items:center;">
            <button class="acp-btn acp-btn-main" id="ac-attach-tts" style="flex:1;">🎙️ Gắn Giọng Này Vào Video Render</button>
            <a href="${lastTtsBlobUrl}" download="autocut-voice.${ext}" class="acp-btn" style="text-decoration:none;">⬇️ Tải (.${ext})</a>
          </div>
        `;
        document.getElementById('ac-attach-tts').onclick = () => {
          attachedVoiceUrl = lastTtsBlobUrl;
          attachedVoiceLabel = `Giọng AI Studio (${voice})`;
          updateAudioBadge();
          alert('Đã gắn giọng đọc AI vào bộ trộn Render! Nhạc nền BGM sẽ tự động giảm âm lượng khi giọng nói vang lên.');
        };
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN'; u.rate = speed;
      const vi = window.speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().includes('vi'));
      if (vi) u.voice = vi;
      window.speechSynthesis.speak(u);
      st.innerHTML = '<span style="color:#4ade80;">🔊 Đang phát giọng đọc tiếng Việt trực tiếp trên trình duyệt!</span>';
    } catch (e) { st.innerHTML = `<span style="color:#f87171;">⚠️ ${e.message}</span>`; }
  }

  function updateAudioBadge() {
    const el = document.getElementById('ac-audio-summary');
    if (!el) return;
    el.innerHTML = `🎵 BGM: <b>${bgmFile ? bgmFile.name : 'Chưa chọn'}</b> • 🎙️ Giọng lồng: <b>${attachedVoiceLabel || 'Chưa gắn'}</b>`;
  }

  // ================= 10. DỰNG GIAO DIỆN NGĂN KÉO PRO v5.0 =================
  function mountProStudio() {
    if (document.getElementById('ac-pro-fab')) return;

    const style = document.createElement('style');
    style.textContent = `
      #ac-pro-fab {
        position: fixed; left: 16px; bottom: 16px; z-index: 9995;
        background: linear-gradient(135deg, #d97706, #7c3aed, #2563eb); color: #fff;
        border: 1px solid rgba(255,255,255,0.25); border-radius: 999px;
        padding: 11px 18px; font-size: 13px; font-weight: 800; cursor: pointer;
        box-shadow: 0 10px 30px rgba(124, 58, 237, 0.55); font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer {
        position: fixed; top: 0; right: -510px; width: 490px; max-width: 96vw; height: 100vh;
        background: #0b1120; border-left: 1px solid #26324d; z-index: 9998;
        box-shadow: -16px 0 48px rgba(0,0,0,0.78); transition: right 0.25s ease;
        display: flex; flex-direction: column; color: #f1f5f9; font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer.open { right: 0; }
      .acp-head { padding: 14px 16px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
      .acp-tabs { display: flex; border-bottom: 1px solid #1e293b; background: #0f172a; }
      .acp-tab { flex: 1; padding: 10px 6px; border: none; background: transparent; color: #94a3b8; font-size: 12px; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; }
      .acp-tab.active { color: #fbbf24; border-bottom-color: #fbbf24; background: #131c31; }
      .acp-body { padding: 14px 16px; overflow-y: auto; flex: 1; }
      .acp-sec { background: #131b2e; border: 1px solid #23304d; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
      .acp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; display: block; }
      .acp-inp, .acp-sel, .acp-ta { width: 100%; box-sizing: border-box; background: #0a0f1d; border: 1px solid #2b3856; color: #f8fafc; border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none; }
      .acp-ta { min-height: 58px; resize: vertical; }
      .acp-btn { border: none; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: #fff; background: #334155; }
      .acp-btn-main { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      .acp-btn-green { background: #10b981; color: #052e16; }
      .acp-skill { display: inline-block; padding: 4px 8px; margin: 2px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #2e3b5b; background: #0b1120; color: #cbd5e1; }
      .acp-skill.on { background: #312e81; border-color: #a78bfa; color: #fff; }
      .acp-drop { border: 2px dashed #4f46e5; border-radius: 10px; padding: 12px; text-align: center; cursor: pointer; background: #0e1529; }
    `;
    document.head.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'ac-pro-fab';
    fab.textContent = '✨ Claude Skills Pro v5';
    document.body.appendChild(fab);

    const drawer = document.createElement('div');
    drawer.id = 'ac-pro-drawer';
    drawer.innerHTML = `
      <div class="acp-head">
        <div>
          <div style="font-size:15px; font-weight:800; color:#fbbf24;">✨ AUTOCUT CLAUDE SKILLS v5.0</div>
          <div style="font-size:11px; color:#94a3b8;">5 Chế độ đọc hiểu • 12 Pro Skills • 6 SFX Miễn Phí • 6 Kiểu Chữ</div>
        </div>
        <button class="acp-btn" id="ac-pro-close">✕</button>
      </div>
      <div class="acp-tabs">
        <button class="acp-tab active" data-t="auto">🎬 Tự Dựng Pro</button>
        <button class="acp-tab" data-t="audio">🎵 Âm Thanh & SFX</button>
        <button class="acp-tab" data-t="voice">🎙️ Giọng Nói AI</button>
      </div>
      <div class="acp-body">
        <!-- TAB 1: TỰ DỰNG CLAUDE SKILLS -->
        <div id="ac-tab-auto">
          <div class="acp-sec" style="border-color:#4c1d95;">
            <div id="ac-behavior-summary" style="font-size:12px; color:#ddd6fe; line-height:1.45;"></div>
          </div>

          <div class="acp-sec">
            <label class="acp-label">1. Video Thô & Nhãn Thương Hiệu (Không cần Video Mẫu)</label>
            <input type="file" id="ac-raw-input" accept="video/*" style="display:none;" />
            <div class="acp-drop" id="ac-raw-drop">
              <div style="font-size:13px; font-weight:700; color:#a5b4fc;">📂 Bấm chọn 1 Video Thô từ máy tính</div>
              <div id="ac-raw-filename" style="font-size:11px; color:#94a3b8; margin-top:4px;">Hoặc tự nhận video đang nạp sẵn ngoài màn hình chính</div>
            </div>
            <input class="acp-inp" id="ac-brand-tag" style="margin-top:8px;" placeholder="Tên thương hiệu / Nhãn hàng (hiện trên Lower-Third & EndCard)..." />
          </div>

          <div class="acp-sec">
            <label class="acp-label">2. Chế Độ Đọc Hiểu Thông Minh & Phong Cách Chữ</label>
            <select class="acp-sel" id="ac-reasoning-mode" style="margin-bottom:8px;">
              ${REASONING_MODES.map((m) => `<option value="${m.id}">${m.label}</option>`).join('')}
            </select>
            <select class="acp-sel" id="ac-text-style-pref">
              ${TEXT_STYLES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}
            </select>
          </div>

          <div class="acp-sec">
            <label class="acp-label">3. Kho 12 Claude Video Skills (Bấm bật/tắt)</label>
            <div id="ac-skills-wrap">
              ${PRO_SKILLS.map((s) => `<span class="acp-skill on" data-sid="${s.id}" title="${s.desc}">${s.name}</span>`).join('')}
            </div>
            <label style="display:flex; align-items:center; gap:6px; margin-top:8px; font-size:12px; color:#cbd5e1; cursor:pointer;">
              <input type="checkbox" id="ac-enable-search" checked />
              🌐 Tìm nguồn xu hướng Viral mới nhất qua Google Search
            </label>
          </div>

          <div class="acp-sec">
            <label class="acp-label">4. Yêu Cầu Dựng Phim (Gõ tự nhiên hoặc nói qua Mic)</label>
            <textarea class="acp-ta" id="ac-auto-hint" placeholder="Ví dụ: Làm video bán lắc tay bạc xi bạch kim giữ màu trắng chuẩn, nhịp sang trọng, chèn chữ nổi và SFX lấp lánh..."></textarea>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="acp-btn" id="ac-mic-hint" data-default-label="🎙️ Nói lệnh">🎙️ Nói lệnh</button>
              <button class="acp-btn acp-btn-main" id="ac-btn-auto-scan" style="flex:1;">🚀 Quét & Tự Edit Claude Skills</button>
            </div>
            <div id="ac-auto-status" style="font-size:12px; margin-top:8px;"></div>
            <div id="ac-auto-result"></div>
          </div>
        </div>

        <!-- TAB 2: ÂM THANH, NHẠC NỀN BGM & KHO 6 SFX MIỄN PHÍ -->
        <div id="ac-tab-audio" style="display:none;">
          <div class="acp-sec">
            <div id="ac-audio-summary" style="font-size:12px; color:#38bdf8; margin-bottom:8px;"></div>
            <label class="acp-label">Nhạc Nền (BGM) trộn trực tiếp khi Xuất Video</label>
            <input type="file" id="ac-bgm-input" accept="audio/*" style="display:none;" />
            <div style="display:flex; gap:8px;">
              <button class="acp-btn acp-btn-main" id="ac-btn-bgm" style="flex:1;">🎵 Chọn File Nhạc Nền (.mp3/.wav)</button>
              <button class="acp-btn" id="ac-clear-bgm">Xóa nhạc</button>
            </div>
            <div style="margin-top:10px; font-size:12px;">
              <label style="display:flex; justify-content:space-between;"><span>Âm lượng nhạc nền BGM:</span><b id="ac-bgm-vol-lbl">30%</b></label>
              <input type="range" id="ac-bgm-vol" min="5" max="100" value="30" style="width:100%;" />
              <label style="display:flex; justify-content:space-between; margin-top:6px;"><span>Âm lượng hiệu ứng SFX:</span><b id="ac-sfx-vol-lbl">55%</b></label>
              <input type="range" id="ac-sfx-vol" min="10" max="100" value="55" style="width:100%;" />
            </div>
            <label style="display:flex; align-items:center; gap:6px; margin-top:8px; font-size:12px; cursor:pointer;">
              <input type="checkbox" id="ac-auto-duck" checked /> 🎧 Auto-Ducking (Tự hạ nhỏ nhạc nền khi có giọng đọc AI)
            </label>
            <label style="display:flex; align-items:center; gap:6px; margin-top:6px; font-size:12px; cursor:pointer;">
              <input type="checkbox" id="ac-mute-orig" /> 🔇 Tắt tiếng gốc của video thô (chỉ dùng nhạc + giọng AI)
            </label>
          </div>

          <div class="acp-sec">
            <label class="acp-label">Kho 6 Hiệu Ứng Âm Thanh SFX Tự Tổng Hợp (Bấm nghe thử)</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
              ${SFX_LIST.map((s) => `<button class="acp-btn" data-test-sfx="${s.id}" style="text-align:left;">${s.label}</button>`).join('')}
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-top:8px;">Tất cả SFX được tạo bằng Web Audio API ngay trên trình duyệt — 100% miễn phí, không dính bản quyền TikTok/YouTube và tự động nổ đúng giây chuyển cảnh.</div>
          </div>
        </div>

        <!-- TAB 3: PHÒNG THU GIỌNG NÓI 2 CHIỀU -->
        <div id="ac-tab-voice" style="display:none;">
          <div class="acp-sec">
            <label class="acp-label">Giọng Nói → Văn Bản & Phụ Đề (STT)</label>
            <input type="file" id="ac-stt-file" accept="audio/*,video/*" style="display:none;" />
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="acp-btn" id="ac-btn-stt-file">📂 Bóc băng từ File Video/Audio</button>
              <button class="acp-btn" id="ac-mic-tts" data-default-label="🎙️ Đọc Micro → Chữ">🎙️ Đọc Micro → Chữ</button>
            </div>
            <div id="ac-stt-status" style="font-size:12px; margin-top:6px;"></div>
          </div>

          <div class="acp-sec">
            <label class="acp-label">Văn Bản → Giọng Đọc AI Studio (TTS)</label>
            <textarea class="acp-ta" id="ac-tts-text" style="min-height:110px;" placeholder="Lời bình AI tự viết sau khi quét video hoặc văn bản của bạn..."></textarea>
            <div style="display:flex; gap:6px; margin-top:8px;">
              <select class="acp-sel" id="ac-tts-voice" style="flex:1;">
                <option value="nova">Giọng Nữ Truyền Cảm</option>
                <option value="alloy">Giọng Tự Nhiên</option>
                <option value="onyx">Giọng Nam Trầm Ấm</option>
                <option value="shimmer">Giọng Nữ Năng Động</option>
              </select>
              <select class="acp-sel" id="ac-tts-speed" style="width:76px;">
                <option value="0.9">0.9x</option>
                <option value="1.0" selected>1.0x</option>
                <option value="1.15">1.15x</option>
                <option value="1.25">1.25x</option>
              </select>
              <button class="acp-btn acp-btn-green" id="ac-run-tts">🔊 Tạo Giọng</button>
            </div>
            <div id="ac-tts-status" style="font-size:12px; margin-top:6px;"></div>
            <div id="ac-tts-player"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    fab.onclick = () => drawer.classList.toggle('open');
    document.getElementById('ac-pro-close').onclick = () => drawer.classList.remove('open');
    document.getElementById('ac-reasoning-mode').value = behavior.preferredMode || 'deep_director';

    drawer.querySelectorAll('.acp-tab').forEach((tab) => {
      tab.onclick = () => {
        drawer.querySelectorAll('.acp-tab').forEach((x) => x.classList.remove('active'));
        tab.classList.add('active');
        const t = tab.getAttribute('data-t');
        document.getElementById('ac-tab-auto').style.display = t === 'auto' ? 'block' : 'none';
        document.getElementById('ac-tab-audio').style.display = t === 'audio' ? 'block' : 'none';
        document.getElementById('ac-tab-voice').style.display = t === 'voice' ? 'block' : 'none';
      };
    });

    document.getElementById('ac-raw-drop').onclick = () => document.getElementById('ac-raw-input').click();
    document.getElementById('ac-raw-input').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (rawVideoUrl) URL.revokeObjectURL(rawVideoUrl);
      rawVideoFile = f; rawVideoUrl = URL.createObjectURL(f);
      document.getElementById('ac-raw-filename').innerHTML = `<span style="color:#4ade80; font-weight:700;">✓ Đã nạp: ${f.name} (${(f.size / 1048576).toFixed(1)} MB)</span>`;
    };

    document.getElementById('ac-btn-bgm').onclick = () => document.getElementById('ac-bgm-input').click();
    document.getElementById('ac-bgm-input').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (bgmUrl) URL.revokeObjectURL(bgmUrl);
      bgmFile = f; bgmUrl = URL.createObjectURL(f);
      updateAudioBadge();
    };
    document.getElementById('ac-clear-bgm').onclick = () => {
      if (bgmUrl) URL.revokeObjectURL(bgmUrl);
      bgmFile = null; bgmUrl = null; updateAudioBadge();
    };
    document.getElementById('ac-bgm-vol').oninput = (e) => { document.getElementById('ac-bgm-vol-lbl').textContent = e.target.value + '%'; };
    document.getElementById('ac-sfx-vol').oninput = (e) => { document.getElementById('ac-sfx-vol-lbl').textContent = e.target.value + '%'; };

    drawer.querySelectorAll('[data-test-sfx]').forEach((b) => {
      b.onclick = () => previewSingleSFX(b.getAttribute('data-test-sfx'));
    });

    drawer.querySelectorAll('#ac-skills-wrap .acp-skill').forEach((el) => {
      el.onclick = () => {
        const sid = el.getAttribute('data-sid');
        if (activeSkills.has(sid)) { activeSkills.delete(sid); el.classList.remove('on'); }
        else { activeSkills.add(sid); el.classList.add('on'); }
      };
    });

    document.getElementById('ac-btn-auto-scan').onclick = runClaudeMasterScan;
    document.getElementById('ac-mic-hint').onclick = function () { toggleMicDictation('ac-auto-hint', this); };
    document.getElementById('ac-mic-tts').onclick = function () { toggleMicDictation('ac-tts-text', this); };
    document.getElementById('ac-btn-stt-file').onclick = () => document.getElementById('ac-stt-file').click();
    document.getElementById('ac-stt-file').onchange = (e) => transcribeAudioFile(e.target.files[0]);
    document.getElementById('ac-run-tts').onclick = runTextToSpeech;

    updateAudioBadge();
    saveBehavior(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountProStudio);
  } else {
    mountProStudio();
  }
})();
