/**
 * AutoCut Studio AI v6.0 — Autonomous Multi-Clip Director, Chat Co-Pilot, Real Beat-Sync,
 * Smart Focal Tracking, Viral Critic & Publish Kit + Isolated Firebase Cloud Sync
 * CÁCH LY 100%: Không chạm auth.js, crm.html, autocut_saas/users hay autocut_crm_isolated.
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://autocut-ai-proxy.tommynguyen1557.workers.dev';
  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v6_sync';
  const LOCAL_CACHE_KEY = 'autocut_studio_v6_cache';

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

  // ================= 1. TRẠNG THÁI & ĐỒNG BỘ FIREBASE CLOUD (CÁCH LY HOÀN TOÀN) =================
  function defaultSyncedData() {
    return {
      preferences: {
        brandTag: '',
        reasoningMode: 'deep_director',
        textStylePref: 'auto',
        activeSkills: PRO_SKILLS.map((s) => s.id),
        bgmVol: 30,
        sfxVol: 55,
        autoDuck: true,
        muteOrig: false,
        enableSearch: true
      },
      behavior: { totalActions: 0, recentGenres: [] },
      savedProjects: [],
      updatedAt: 0
    };
  }

  function loadLocalCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || 'null');
      if (parsed && parsed.preferences) return { ...defaultSyncedData(), ...parsed };
    } catch (_) {}
    return defaultSyncedData();
  }

  let syncData = loadLocalCache();
  let activeSkills = new Set(syncData.preferences.activeSkills || PRO_SKILLS.map((s) => s.id));
  let loadedClips = []; // [{ file, url, name, durationSec }]
  let bgmFile = null;
  let bgmUrl = null;
  let bgmBeatInfo = null; // { bpm, beats: [] }
  let attachedVoiceUrl = null;
  let attachedVoiceLabel = '';
  let lastTtsBlobUrl = null;
  let currentMasterPlan = null;
  let currentCritic = null;
  let copilotHistory = [];
  let sttTranscriptLines = [];
  let isRendering = false;
  let previewAnimId = null;
  let grainCanvas = null;
  let syncTimer = null;

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
    setSyncBadge('☁️ Đang tải dữ liệu đồng bộ...', '#38bdf8');
    try {
      const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote = await res.json();
      if (remote && typeof remote === 'object' && Number(remote.updatedAt || 0) >= Number(syncData.updatedAt || 0)) {
        syncData = {
          ...defaultSyncedData(),
          ...remote,
          preferences: { ...defaultSyncedData().preferences, ...(remote.preferences || {}) },
          behavior: { ...defaultSyncedData().behavior, ...(remote.behavior || {}) },
          savedProjects: Array.isArray(remote.savedProjects) ? remote.savedProjects : []
        };
        activeSkills = new Set(syncData.preferences.activeSkills || PRO_SKILLS.map((s) => s.id));
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(syncData));
        applyPreferencesToUI();
        renderSavedProjectsList();
      }
      setSyncBadge(`☁️ Đã đồng bộ Cloud (${syncData.savedProjects.length} dự án) ✓`, '#4ade80');
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
      style: currentMasterPlan.matchedReference?.styleName || 'AutoCut v6',
      score: currentCritic?.score || null,
      plan: currentMasterPlan,
      critic: currentCritic,
      copilotHistory: copilotHistory.slice(-8)
    };
    syncData.savedProjects = [entry, ...syncData.savedProjects.filter((p) => p.id !== entry.id)].slice(0, 10);
    renderSavedProjectsList();
    saveLocalAndScheduleCloudSync(true);
  }

  // ================= 2. TOÁN CHUYỂN ĐỘNG & SFX MIỄN PHÍ =================
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

  // ================= 3. ĐO NHỊP NHẠC THẬT (REAL BEAT-SYNC) & SÓNG ÂM =================
  async function detectMusicBeats(file) {
    try {
      const buf = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuf = await ctx.decodeAudioData(buf.slice(0));
      const ch = audioBuf.getChannelData(0);
      const sr = audioBuf.sampleRate;
      const win = Math.floor(sr * 0.05); // 50ms
      const energies = [];
      for (let i = 0; i < ch.length; i += win) {
        let sum = 0;
        const end = Math.min(i + win, ch.length);
        for (let j = i; j < end; j++) sum += ch[j] * ch[j];
        energies.push(Math.sqrt(sum / (end - i)));
      }
      const avg = energies.reduce((a, b) => a + b, 0) / Math.max(1, energies.length);
      const beats = [];
      let lastBeat = -1;
      for (let i = 1; i < energies.length - 1; i++) {
        const t = i * 0.05;
        if (energies[i] > avg * 1.42 && energies[i] > energies[i - 1] && energies[i] >= energies[i + 1]) {
          if (t - lastBeat >= 0.38) {
            beats.push(Number(t.toFixed(2)));
            lastBeat = t;
          }
        }
      }
      ctx.close();
      let bpm = 120;
      if (beats.length >= 4) {
        const diffs = [];
        for (let i = 1; i < Math.min(beats.length, 20); i++) diffs.push(beats[i] - beats[i - 1]);
        const med = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)] || 0.5;
        bpm = Math.round(Math.min(180, Math.max(70, 60 / med)));
      }
      return { bpm, beats: beats.slice(0, 40) };
    } catch (_) {
      return null;
    }
  }

  function snapSegmentsToBeats(plan, beatInfo) {
    if (!plan || !Array.isArray(plan.segments) || !beatInfo || !beatInfo.beats?.length) return plan;
    const beats = beatInfo.beats;
    let cursorOut = 0;
    plan.segments.forEach((seg, idx) => {
      const origOutDur = (seg.endSec - seg.startSec) / (seg.speed || 1);
      const targetOut = cursorOut + origOutDur;
      // Tìm mốc rơi beat gần nhất cách ít nhất 1.2s so với cursorOut
      const bestBeat = beats.find((b) => b >= cursorOut + 1.2 && Math.abs(b - targetOut) <= 0.85);
      if (bestBeat) {
        const newOutDur = Math.max(1.0, bestBeat - cursorOut);
        const maxClipDur = loadedClips[seg.clipIndex]?.durationSec || (seg.endSec + 2);
        const desiredEnd = seg.startSec + newOutDur * (seg.speed || 1);
        if (desiredEnd <= maxClipDur) seg.endSec = Number(desiredEnd.toFixed(2));
        cursorOut = bestBeat;
      } else {
        cursorOut += origOutDur;
      }
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
      const silentRanges = [];
      let silentStart = null;
      for (let i = 0; i < data.length; i += winSize) {
        let sum = 0;
        const end = Math.min(i + winSize, data.length);
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

  // ================= 4. QUÉT ĐA CLIP THÔ (MULTI-CLIP SCANNER) =================
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
    const rawFrames = [];
    const frameMeta = [];
    const clipsInfo = [];

    for (let cIdx = 0; cIdx < clips.length; cIdx++) {
      const clip = clips[cIdx];
      await new Promise((resolve) => {
        const v = document.createElement('video');
        v.muted = true; v.crossOrigin = 'anonymous'; v.playsInline = true; v.src = clip.url;
        v.onloadedmetadata = async () => {
          const dur = v.duration || 10;
          clip.durationSec = dur;
          clipsInfo.push({ clipIndex: cIdx, name: clip.name, durationSec: Number(dur.toFixed(1)) });

          const count = cIdx === 0 ? Math.min(maxTotalFrames - (clips.length - 1), Math.max(perClip, clips.length === 1 ? 8 : 2)) : perClip;
          const canvas = document.createElement('canvas');
          const tw = 400;
          const th = Math.max(180, Math.round((v.videoHeight / (v.videoWidth || 1)) * tw));
          canvas.width = tw; canvas.height = th;
          const ctx = canvas.getContext('2d');

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

  function normalizePlanV6(plan, clipsInfo, brandTag) {
    const p = plan && typeof plan === 'object' ? { ...plan } : {};
    const maxClipIdx = Math.max(0, clipsInfo.length - 1);
    if (!Array.isArray(p.segments) || !p.segments.length) {
      p.segments = clipsInfo.map((c, idx) => ({
        clipIndex: idx, startSec: 0, endSec: Math.min(3.0, c.durationSec || 3), speed: 1.0,
        zoomFrom: 1.0, zoomTo: 1.12, focalX: 0.5, focalY: 0.5, easing: 'easeOutExpo',
        transition: idx === 0 ? 'flash' : 'slide_left', sfx: idx === 0 ? 'boom' : 'whoosh', label: `Cảnh từ ${c.name}`
      }));
    }
    p.segments = p.segments.map((s) => {
      const ci = Math.min(maxClipIdx, Math.max(0, Number(s.clipIndex) || 0));
      const clipDur = Math.max(2, Number(clipsInfo[ci]?.durationSec) || 10);
      const st = Math.max(0, Math.min(clipDur - 0.5, Number(s.startSec) || 0));
      const en = Math.max(st + 0.6, Math.min(clipDur, Number(s.endSec) || st + 2.5));
      return {
        clipIndex: ci,
        startSec: Number(st.toFixed(2)),
        endSec: Number(en.toFixed(2)),
        speed: Math.min(1.6, Math.max(0.7, Number(s.speed) || 1.0)),
        zoomFrom: Number(s.zoomFrom) || 1.0,
        zoomTo: Number(s.zoomTo) || 1.12,
        focalX: Math.min(0.85, Math.max(0.15, Number(s.focalX ?? 0.5))),
        focalY: Math.min(0.85, Math.max(0.15, Number(s.focalY ?? 0.5))),
        easing: s.easing || 'easeOutExpo',
        transition: s.transition || 'flash',
        sfx: s.sfx || 'whoosh',
        label: s.label || `Cảnh Clip #${ci + 1}`
      };
    }).slice(0, 12);

    p.lutPreset = LUT_PRESETS[p.lutPreset] ? p.lutPreset : 'tiktok_commerce';
    p.aspectRatio = ['9:16', '16:9', '1:1'].includes(p.aspectRatio) ? p.aspectRatio : '9:16';
    p.textStyle = TEXT_STYLES.some((t) => t.id === p.textStyle && t.id !== 'auto') ? p.textStyle : 'hormozi';
    p.subtitles = Array.isArray(p.subtitles) ? p.subtitles : [];
    p.stickers = Array.isArray(p.stickers) ? p.stickers : [];
    p.titleCard = p.titleCard || { enabled: true, durationSec: 1.5, headline: brandTag || 'AUTOCUT PRO', subline: p.detectedGenre || 'Bản Dựng Chuyên Nghiệp' };
    p.lowerThird = p.lowerThird || { enabled: Boolean(brandTag), startSec: 2.0, endSec: 5.5, title: brandTag || 'Điểm Nhấn Nổi Bật', subtitle: 'Chất lượng chuẩn cao cấp' };
    p.endCard = p.endCard || { enabled: true, durationSec: 1.8, cta: 'Đặt Ngay Hôm Nay', subCta: brandTag || 'Cảm ơn bạn đã xem' };
    return p;
  }

  // ================= 5. CHẠY QUÉT ĐA CLIP, CHAT CO-PILOT & CHẤM ĐIỂM VIRAL =================
  function ensureClipsAvailable() {
    if (!loadedClips.length) {
      const extVid = Array.from(document.querySelectorAll('video')).find((v) => v.src && v.readyState >= 1);
      if (extVid) loadedClips.push({ file: null, url: extVid.src, name: 'Video trên màn hình chính', durationSec: extVid.duration || 10 });
    }
    return loadedClips.length > 0;
  }

  async function runAutoScanV6() {
    const statusEl = document.getElementById('ac-auto-status');
    if (!ensureClipsAvailable()) { alert('Hãy bấm chọn ít nhất 1 Video Thô (hoặc nhiều clip cùng lúc) trước!'); return; }

    const userHint = (document.getElementById('ac-auto-hint').value || '').trim();
    const brandTag = (document.getElementById('ac-brand-tag').value || '').trim();
    const reasoningMode = document.getElementById('ac-reasoning-mode').value;
    const preferredTextStyle = document.getElementById('ac-text-style-pref').value;
    const enableWebSearch = document.getElementById('ac-enable-search').checked;

    syncData.preferences.brandTag = brandTag;
    syncData.preferences.reasoningMode = reasoningMode;
    syncData.preferences.textStylePref = preferredTextStyle;
    syncData.preferences.enableSearch = enableWebSearch;

    try {
      statusEl.innerHTML = `<span style="color:#38bdf8;">⏳ Bước 1/3: Đang quét hình ảnh từ ${loadedClips.length} clip thô & đo sóng âm...</span>`;
      const [scanData, audioStats] = await Promise.all([
        scanMultiClipFrames(loadedClips),
        loadedClips[0]?.file ? analyzeAudioSilence(loadedClips[0].file) : Promise.resolve({ hasAudio: false })
      ]);

      statusEl.innerHTML = '<span style="color:#a78bfa;">🧠 Bước 2/3: Đạo Diễn AI đang sắp xếp đa clip, định vị tâm chủ thể (x,y) & khớp Beat-Sync...</span>';
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
          userHint,
          brandTag,
          reasoningMode,
          preferredTextStyle,
          activeSkills: Array.from(activeSkills),
          behaviorProfile: syncData.behavior,
          enableWebSearch
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      currentMasterPlan = normalizePlanV6(data.plan, scanData.clipsInfo, brandTag);
      if (preferredTextStyle !== 'auto') currentMasterPlan.textStyle = preferredTextStyle;
      if (activeSkills.has('beat_sync') && bgmBeatInfo) currentMasterPlan = snapSegmentsToBeats(currentMasterPlan, bgmBeatInfo);

      copilotHistory = [];
      currentCritic = null;
      syncData.behavior.totalActions += 1;
      if (currentMasterPlan.detectedGenre) {
        syncData.behavior.recentGenres = [currentMasterPlan.detectedGenre, ...syncData.behavior.recentGenres.filter((g) => g !== currentMasterPlan.detectedGenre)].slice(0, 6);
      }

      const ttsBox = document.getElementById('ac-tts-text');
      if (ttsBox && currentMasterPlan.voiceoverScript) ttsBox.value = currentMasterPlan.voiceoverScript;

      statusEl.innerHTML = `<span style="color:#4ade80;">✓ Đã dựng xong từ ${loadedClips.length} clip (${data.provider})! Bạn có thể Chat Co-Pilot tinh chỉnh hoặc Xuất ngay.</span>`;
      renderMasterWorkspace(currentMasterPlan, data.sources || []);
      archiveCurrentProjectToSync();
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi: ${err.message}</span>`;
    }
  }

  async function runCopilotChat() {
    const inp = document.getElementById('ac-copilot-input');
    const logEl = document.getElementById('ac-copilot-log');
    const cmd = (inp?.value || '').trim();
    if (!currentMasterPlan || !cmd) return;

    inp.value = '';
    copilotHistory.push({ role: 'user', text: cmd });
    renderCopilotLog();
    logEl.insertAdjacentHTML('beforeend', '<div id="ac-cp-wait" style="font-size:11px; color:#a78bfa; padding:4px 0;">🤖 Co-Pilot đang cập nhật đúng phần bạn yêu cầu...</div>');

    try {
      const clipsInfo = loadedClips.map((c, i) => ({ clipIndex: i, name: c.name, durationSec: c.durationSec || 10 }));
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'copilot_refine', currentPlan: currentMasterPlan, userCommand: cmd, clipsInfo, chatHistory: copilotHistory })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Lỗi Co-Pilot');

      currentMasterPlan = normalizePlanV6(data.plan, clipsInfo.length ? clipsInfo : [{ clipIndex: 0, name: 'Clip 1', durationSec: 15 }], syncData.preferences.brandTag);
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
      box.innerHTML = '<div style="color:#fbbf24; font-size:12px;">Hãy tạo hoặc khôi phục 1 bản dựng ở tab "Tự Dựng Pro" trước khi chấm điểm Viral!</div>';
      return;
    }
    box.innerHTML = `<div style="color:#38bdf8; font-size:12px; padding:8px;">${autoOptimize ? '🚀 AI đang tự nâng cấp kịch bản lên 95+ điểm và xuất lại bộ Đăng Bài...' : '📊 AI đang chấm điểm thuật toán giữ chân & soạn Ảnh bìa + Caption...'}</div>`;

    try {
      const clipsInfo = loadedClips.map((c, i) => ({ clipIndex: i, name: c.name, durationSec: c.durationSec || 10 }));
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'viral_critic', currentPlan: currentMasterPlan, autoOptimize, clipsInfo, brandTag: syncData.preferences.brandTag })
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.critic) throw new Error(data.error || 'Không nhận được kết quả chấm điểm');

      currentCritic = data.critic;
      if (autoOptimize && data.critic.optimizedPlan) {
        currentMasterPlan = normalizePlanV6(data.critic.optimizedPlan, clipsInfo.length ? clipsInfo : [{ clipIndex: 0, name: 'Clip 1', durationSec: 15 }], syncData.preferences.brandTag);
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
          ctx.save();
          ctx.filter = lut.filter;
          const sc = Math.max(720 / (v.videoWidth || 720), 1280 / (v.videoHeight || 1280));
          const dw = (v.videoWidth || 720) * sc;
          const dh = (v.videoHeight || 1280) * sc;
          const dx = Math.min(0, Math.max(720 - dw, 360 - (seg?.focalX ?? 0.5) * dw));
          const dy = Math.min(0, Math.max(1280 - dh, 640 - (seg?.focalY ?? 0.5) * dh));
          ctx.drawImage(v, dx, dy, dw, dh);
          ctx.restore();
          resolve();
        };
        v.onerror = resolve;
      });
    }

    // Lớp gradient tối dưới + trên giúp chữ Ảnh bìa cực nổi
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, 'rgba(0,0,0,0.62)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 720, 1280);

    // Badge góc trên
    if (kit.thumbnailBadge) {
      ctx.font = '800 32px system-ui, sans-serif';
      const bw = ctx.measureText(kit.thumbnailBadge).width + 44;
      ctx.fillStyle = '#ef4444';
      drawRoundedRect(ctx, 360 - bw / 2, 130, bw, 58, 999); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(kit.thumbnailBadge, 360, 160);
    }

    // Tiêu đề lớn Ảnh bìa
    const headline = (kit.thumbnailHeadline || 'VIDEO NỔI BẬT').toUpperCase();
    const words = headline.split(/\s+/);
    const lines = []; let cur = '';
    words.forEach((w) => { if ((cur + ' ' + w).trim().length > 14) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);

    ctx.font = '900 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    lines.forEach((ln, idx) => {
      const y = 920 + idx * 78;
      ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
      ctx.strokeText(ln, 360, y);
      ctx.fillStyle = idx === 0 ? '#fde047' : '#ffffff';
      ctx.fillText(ln, 360, y);
    });
  }

  function renderCriticAndPublishKit(c) {
    const box = document.getElementById('ac-critic-body');
    if (!box || !c) return;
    const scoreColor = c.score >= 90 ? '#4ade80' : c.score >= 75 ? '#fbbf24' : '#f87171';
    const b = c.breakdown || {};
    const kit = c.publishKit || {};

    box.innerHTML = `
      <div style="background:#090f1d; border:1px solid #334155; border-radius:10px; padding:12px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-size:11px; color:#94a3b8; font-weight:700;">ĐIỂM TIỀM NĂNG VIRAL</div>
            <div style="font-size:32px; font-weight:900; color:${scoreColor};">${c.score || 85}<span style="font-size:14px; color:#94a3b8;">/100</span></div>
          </div>
          <div style="font-size:11px; color:#cbd5e1; line-height:1.6;">
            🔥 Hook 3s: <b>${b.hook || 85}</b> • ✂️ Nhịp độ: <b>${b.pacing || 85}</b><br/>
            💬 Phụ đề: <b>${b.subtitles || 85}</b> • 🎯 Chốt đơn CTA: <b>${b.cta || 85}</b>
          </div>
        </div>
        ${(c.weaknesses || []).length ? `<div style="margin-top:8px; font-size:11.5px; color:#fca5a5;">⚠️ <b>Cần cải thiện:</b> ${c.weaknesses.join(' • ')}</div>` : ''}
        <button class="acp-btn acp-btn-main" id="ac-btn-optimize-95" style="width:100%; margin-top:10px;">🚀 Tự Động Tối Ưu Bản Dựng Lên 95+ Điểm</button>
      </div>

      <div style="background:#090f1d; border:1px solid #334155; border-radius:10px; padding:12px; margin-top:10px;">
        <div style="font-size:12px; font-weight:800; color:#fbbf24; margin-bottom:8px;">🖼️ ẢNH BÌA THUMBNAIL & BỘ ĐĂNG BÀI (PUBLISH KIT)</div>
        <div style="text-align:center;">
          <canvas id="ac-thumb-canvas" style="max-height:220px; border-radius:8px; border:1px solid #334155;"></canvas>
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
          ${kit.hashtags ? `
            <div style="background:#131c31; padding:8px; border-radius:8px; font-size:11.5px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <span style="color:#a78bfa;">${kit.hashtags}</span>
              <button class="acp-btn" id="ac-copy-tags" style="padding:3px 8px; font-size:10px;">Copy Tags</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('ac-btn-optimize-95').onclick = () => runViralCritic(true);
    document.getElementById('ac-dl-thumb').onclick = () => {
      const cnv = document.getElementById('ac-thumb-canvas');
      const a = document.createElement('a'); a.href = cnv.toDataURL('image/png'); a.download = `AutoCut-Thumbnail-${Date.now()}.png`; a.click();
    };
    box.querySelectorAll('[data-copy-cap]').forEach((btn) => {
      btn.onclick = () => {
        const cap = kit.captions[Number(btn.dataset.copyCap)];
        navigator.clipboard.writeText(`${cap.text}\n\n${kit.hashtags || ''}`);
        btn.textContent = 'Đã Copy ✓';
      };
    });
    const copyTagBtn = document.getElementById('ac-copy-tags');
    if (copyTagBtn) copyTagBtn.onclick = () => { navigator.clipboard.writeText(kit.hashtags); copyTagBtn.textContent = 'Đã Copy ✓'; };

    drawThumbnailCanvas(kit);
  }

  // ================= 6. HIỂN THỊ KẾT QUẢ BẢN DỰNG & CHAT CO-PILOT =================
  function renderMasterWorkspace(plan, sources) {
    const el = document.getElementById('ac-auto-result');
    if (!el || !plan) return;
    const lutInfo = LUT_PRESETS[plan.lutPreset] || LUT_PRESETS.tiktok_commerce;
    const totalOutSec = plan.segments.reduce((acc, s) => acc + (s.endSec - s.startSec) / s.speed, 0) + (activeSkills.has('end_card') && plan.endCard?.enabled ? Number(plan.endCard.durationSec || 1.8) : 0);

    const sourcesHtml = sources.length
      ? `<div style="margin-top:6px; font-size:11px; color:#94a3b8;">🌐 <b>Nguồn xu hướng:</b> ${sources.map((s) => `<a href="${s.url}" target="_blank" style="color:#38bdf8; margin-right:6px;">${s.title.slice(0, 32)}</a>`).join('')}</div>`
      : '';

    const segsHtml = plan.segments.map((s, idx) => `
      <div style="display:flex; justify-content:space-between; gap:6px; padding:5px 0; border-bottom:1px solid #1e293b; font-size:11px;">
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
        <div style="margin-top:6px; background:#131c31; padding:7px 9px; border-radius:8px; font-size:11px;">
          🎨 <b>${lutInfo.name}</b> • 💬 ${plan.subtitles.length} phụ đề • ✨ ${plan.stickers.length} sticker • 🎙️ ${attachedVoiceLabel || 'Chưa gắn giọng AI'}
        </div>
        ${sourcesHtml}
        <div style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:700; color:#fbbf24;">✂️ TIMELINE ĐA CLIP (${plan.segments.length} cảnh):</span>
            ${bgmBeatInfo ? '<button class="acp-btn" id="ac-btn-snap-beats" style="padding:3px 8px; font-size:10px; background:#0284c7;">🥁 Khóa Khớp Nhịp Nhạc</button>' : ''}
          </div>
          ${segsHtml}
        </div>

        <!-- CHAT CO-PILOT TINH CHỈNH TRỰC TIẾP -->
        <div style="margin-top:10px; background:#11192e; border:1px solid #3b2f6e; border-radius:10px; padding:9px;">
          <div style="font-size:11px; font-weight:800; color:#c4b5fd; margin-bottom:5px;">💬 CHAT CO-PILOT — Sửa từng cảnh không cần quét lại</div>
          <div id="ac-copilot-log" style="max-height:115px; overflow-y:auto; margin-bottom:6px;"></div>
          <div style="display:flex; gap:6px;">
            <input class="acp-inp" id="ac-copilot-input" placeholder="VD: Đổi cảnh 2 sang Glitch, sửa phụ đề câu 1 thành..." />
            <button class="acp-btn" id="ac-mic-copilot" data-default-label="🎙️" style="padding:0 10px;">🎙️</button>
            <button class="acp-btn acp-btn-main" id="ac-send-copilot">Sửa</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 82px; gap:6px; margin-top:10px;">
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
          <canvas id="ac-pro-preview-canvas" style="max-width:100%; max-height:280px; border-radius:10px; background:#000; border:1px solid #334155;"></canvas>
        </div>
        <div style="display:flex; gap:6px; margin-top:10px; flex-wrap:wrap;">
          <button class="acp-btn acp-btn-main" id="ac-btn-play-edl" style="flex:1;">▶️ Xem Thử</button>
          <button class="acp-btn acp-btn-green" id="ac-btn-export-edl" style="flex:1;">⬇️ Render & Xuất Video</button>
          <button class="acp-btn" id="ac-btn-goto-critic" style="background:#b45309;">🏆 Chấm Điểm & Đăng Bài</button>
        </div>
        <div id="ac-render-progress" style="font-size:12px; color:#fbbf24; margin-top:6px; text-align:center;"></div>
      </div>
    `;

    renderCopilotLog();
    preparePreviewCanvas();

    const snapBtn = document.getElementById('ac-btn-snap-beats');
    if (snapBtn) snapBtn.onclick = () => { currentMasterPlan = snapSegmentsToBeats(currentMasterPlan, bgmBeatInfo); renderMasterWorkspace(currentMasterPlan, []); archiveCurrentProjectToSync(); };
    document.getElementById('ac-send-copilot').onclick = runCopilotChat;
    document.getElementById('ac-copilot-input').onkeydown = (e) => { if (e.key === 'Enter') runCopilotChat(); };
    document.getElementById('ac-mic-copilot').onclick = function () { toggleMicDictation('ac-copilot-input', this); };
    document.getElementById('ac-lut-override').onchange = (e) => { currentMasterPlan.lutPreset = e.target.value; archiveCurrentProjectToSync(); };
    document.getElementById('ac-text-override').onchange = (e) => { currentMasterPlan.textStyle = e.target.value; archiveCurrentProjectToSync(); };
    document.getElementById('ac-ratio-override').onchange = (e) => { currentMasterPlan.aspectRatio = e.target.value; preparePreviewCanvas(); archiveCurrentProjectToSync(); };
    document.getElementById('ac-btn-play-edl').onclick = () => executeRenderPipeline(false);
    document.getElementById('ac-btn-export-edl').onclick = () => executeRenderPipeline(true);
    document.getElementById('ac-btn-goto-critic').onclick = () => { switchDrawerTab('critic'); runViralCritic(false); };
  }

  // ================= 7. BỘ VẼ CANVAS (SMART FOCAL TRACKING + 6 TEXT + STICKERS + CARDS) =================
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
    ctx.fillText('Sẵn sàng phát thử & xuất bản dựng Pro v6', w / 2, h / 2);
  }

  function drawKineticSubtitle(ctx, w, h, sub, prog, styleId) {
    if (!sub || !sub.text) return;
    ctx.save();
    const rawText = styleId === 'typewriter' ? sub.text.slice(0, Math.max(1, Math.ceil(sub.text.length * Math.min(1, prog * 1.45)))) : sub.text;
    const fontSize = Math.round(w * (styleId === 'minimal_lower' || styleId === 'cinematic_clean' ? 0.044 : 0.056));
    ctx.font = `${styleId === 'cinematic_clean' ? '700' : '900'} ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const lines = []; let cur = '';
    rawText.split(/\s+/).forEach((wd) => {
      if ((cur + ' ' + wd).trim().length > 22) { if (cur) lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim();
    });
    if (cur) lines.push(cur);

    const enter = applyEasing(Math.min(1, prog / 0.16), 'springPop');
    const baseY = h * (styleId === 'minimal_lower' ? 0.86 : 0.77) - ((lines.length - 1) * fontSize * 0.65) + (1 - enter) * 18;
    ctx.globalAlpha = Math.min(1, prog / 0.1);
    ctx.translate(w / 2, baseY);
    if (styleId === 'hormozi' || styleId === 'karaoke_box') { const sc = 0.88 + 0.12 * enter; ctx.scale(sc, sc); }

    const hl = (sub.highlight || '').toLowerCase();
    lines.forEach((line, idx) => {
      const y = idx * (fontSize * 1.3);
      const mw = ctx.measureText(line).width;
      const isHL = hl && line.toLowerCase().includes(hl);
      if (styleId === 'karaoke_box') {
        ctx.fillStyle = isHL ? '#7c3aed' : 'rgba(15,23,42,0.82)';
        drawRoundedRect(ctx, -mw / 2 - 22, y - fontSize / 2 - 10, mw + 44, fontSize + 20, 16); ctx.fill();
        ctx.fillStyle = isHL ? '#fde047' : '#ffffff'; ctx.fillText(line, 0, y);
      } else if (styleId === 'neon_glow') {
        ctx.shadowColor = isHL ? '#f43f5e' : '#38bdf8'; ctx.shadowBlur = 22;
        ctx.lineWidth = 4; ctx.strokeStyle = '#0f172a'; ctx.strokeText(line, 0, y);
        ctx.fillStyle = isHL ? '#fda4af' : '#e0f2fe'; ctx.fillText(line, 0, y);
      } else if (styleId === 'cinematic_clean' || styleId === 'minimal_lower') {
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        drawRoundedRect(ctx, -mw / 2 - 18, y - fontSize / 2 - 8, mw + 36, fontSize + 16, 10); ctx.fill();
        ctx.fillStyle = isHL ? '#fbbf24' : '#f8fafc'; ctx.fillText(line, 0, y);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        drawRoundedRect(ctx, -mw / 2 - 20, y - fontSize / 2 - 9, mw + 40, fontSize + 18, 14); ctx.fill();
        ctx.lineWidth = Math.max(5, Math.round(fontSize * 0.16)); ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y); ctx.fillStyle = isHL ? '#facc15' : '#ffffff'; ctx.fillText(line, 0, y);
      }
    });
    ctx.restore();
  }

  function drawOverlaysV6(ctx, w, h, plan, elapsed) {
    // Title Card
    if (activeSkills.has('hook_3s') && plan.titleCard?.enabled && elapsed <= (plan.titleCard.durationSec || 1.6)) {
      const p = elapsed / (plan.titleCard.durationSec || 1.6);
      const inE = applyEasing(Math.min(1, p / 0.3), 'easeOutExpo');
      ctx.save(); ctx.globalAlpha = inE * (p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : 1);
      const y = h * 0.2 + (1 - inE) * 26;
      const fm = Math.round(w * 0.064); ctx.font = `900 ${fm}px system-ui, sans-serif`; ctx.textAlign = 'center';
      const tw = Math.min(w * 0.88, Math.max(ctx.measureText(plan.titleCard.headline || '').width + 52, w * 0.54));
      const bh = fm * 2.1;
      const g = ctx.createLinearGradient(w / 2 - tw / 2, y - bh / 2, w / 2 + tw / 2, y + bh / 2);
      g.addColorStop(0, 'rgba(15,23,42,0.84)'); g.addColorStop(1, 'rgba(49,46,129,0.84)');
      ctx.fillStyle = g; drawRoundedRect(ctx, w / 2 - tw / 2, y - bh / 2, tw, bh, 18); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(plan.titleCard.headline || '', w / 2, y - fm * 0.15);
      if (plan.titleCard.subline) { ctx.font = `600 ${Math.round(w * 0.032)}px system-ui, sans-serif`; ctx.fillStyle = '#fde047'; ctx.fillText(plan.titleCard.subline, w / 2, y + fm * 0.55); }
      ctx.restore();
    }
    // Lower Third
    if (activeSkills.has('lower_third') && plan.lowerThird?.enabled && elapsed >= plan.lowerThird.startSec && elapsed <= plan.lowerThird.endSec) {
      const loc = (elapsed - plan.lowerThird.startSec) / Math.max(0.5, plan.lowerThird.endSec - plan.lowerThird.startSec);
      const sIn = applyEasing(Math.min(1, loc / 0.18), 'easeOutExpo');
      ctx.save(); ctx.globalAlpha = sIn * (loc > 0.85 ? Math.max(0, 1 - (loc - 0.85) / 0.15) : 1);
      const x = 28 - (1 - sIn) * 140; const y = h * 0.62; const bw = Math.min(w * 0.72, 430);
      ctx.fillStyle = 'rgba(10,15,30,0.82)'; drawRoundedRect(ctx, x, y, bw, 84, 14); ctx.fill();
      ctx.fillStyle = '#8b5cf6'; drawRoundedRect(ctx, x, y, 8, 84, 4); ctx.fill();
      ctx.textAlign = 'left'; ctx.fillStyle = '#f8fafc'; ctx.font = `800 ${Math.round(w * 0.036)}px system-ui, sans-serif`;
      ctx.fillText((plan.lowerThird.title || '').slice(0, 28), x + 22, y + 34);
      ctx.fillStyle = '#38bdf8'; ctx.font = `600 ${Math.round(w * 0.026)}px system-ui, sans-serif`;
      ctx.fillText((plan.lowerThird.subtitle || '').slice(0, 36), x + 22, y + 62);
      ctx.restore();
    }
    // Stickers
    if (activeSkills.has('stickers') && Array.isArray(plan.stickers)) {
      plan.stickers.forEach((st) => {
        if (elapsed < st.startSec || elapsed > st.endSec) return;
        const loc = (elapsed - st.startSec) / Math.max(0.2, st.endSec - st.startSec);
        const pop = applyEasing(Math.min(1, loc / 0.25), 'springPop');
        ctx.save(); ctx.globalAlpha = loc > 0.85 ? Math.max(0, 1 - (loc - 0.85) / 0.15) : 1;
        const px = st.position === 'top_left' ? w * 0.24 : w * 0.74;
        const py = (st.position === 'mid_right' ? h * 0.44 : h * 0.14) + Math.sin(elapsed * 5) * 5;
        ctx.translate(px, py); ctx.scale(pop, pop);
        const txt = `${st.icon || '✨'} ${st.label || ''}`.trim();
        const fs = Math.round(w * 0.035); ctx.font = `800 ${fs}px system-ui, sans-serif`;
        const tw = ctx.measureText(txt).width + 30; const th = fs + 22;
        const g = ctx.createLinearGradient(-tw / 2, -th / 2, tw / 2, th / 2); g.addColorStop(0, '#f59e0b'); g.addColorStop(1, '#ef4444');
        ctx.fillStyle = g; drawRoundedRect(ctx, -tw / 2, -th / 2, tw, th, 999); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 1);
        ctx.restore();
      });
    }
    // Subtitles
    if (activeSkills.has('kinetic_text') && plan.subtitles?.length) {
      const sub = plan.subtitles.find((s) => elapsed >= Number(s.startSec) && elapsed <= Number(s.endSec));
      if (sub) drawKineticSubtitle(ctx, w, h, sub, (elapsed - Number(sub.startSec)) / Math.max(0.2, Number(sub.endSec) - Number(sub.startSec)), plan.textStyle);
    }
  }

  function drawVideoFrameV6(ctx, video, w, h, seg, segProgress, lut, elapsedOut, plan) {
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const easedP = activeSkills.has('remotion_ease') ? applyEasing(segProgress, seg.easing) : segProgress;
    let zoom = seg.zoomFrom + (seg.zoomTo - seg.zoomFrom) * easedP;
    let offsetX = 0;

    const transActive = activeSkills.has('fx_trans') && segProgress < 0.16;
    const transP = transActive ? 1 - segProgress / 0.16 : 0;
    if (transActive && seg.transition === 'slide_left') offsetX = transP * w * 0.24;
    if (transActive && seg.transition === 'zoom_burst') zoom *= (1 + transP * 0.22);

    // SMART FOCAL TRACKING: khóa đúng tâm chủ thể (focalX, focalY) khi đóng khung 9:16 và phóng to
    const fx = activeSkills.has('smart_focal') ? (seg.focalX ?? 0.5) : 0.5;
    const fy = activeSkills.has('smart_focal') ? (seg.focalY ?? 0.5) : 0.5;
    const curFx = 0.5 + (fx - 0.5) * Math.min(1, easedP * 1.35 + 0.35);
    const curFy = 0.5 + (fy - 0.5) * Math.min(1, easedP * 1.35 + 0.35);

    const coverScale = Math.max(w / vw, h / vh) * Math.max(1, zoom);
    const dw = vw * coverScale;
    const dh = vh * coverScale;
    const dx = Math.min(0, Math.max(w - dw, w / 2 - curFx * dw)) + offsetX;
    const dy = Math.min(0, Math.max(h - dh, h / 2 - curFy * dh));

    ctx.save();
    ctx.filter = activeSkills.has('pro_lut') ? lut.filter : 'none';
    ctx.drawImage(video, dx, dy, dw, dh);
    ctx.restore();

    if (activeSkills.has('film_grain')) {
      const pat = ctx.createPattern(getGrainCanvas(), 'repeat');
      if (pat) {
        ctx.save(); ctx.globalAlpha = 0.25; ctx.translate((Math.random() * 40) | 0, (Math.random() * 40) | 0);
        ctx.fillStyle = pat; ctx.fillRect(-40, -40, w + 80, h + 80); ctx.restore();
      }
      if (lut.vignette > 0) {
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${lut.vignette})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
    }

    if (transActive) {
      if (seg.transition === 'flash') { ctx.fillStyle = `rgba(255,255,255,${(transP * 0.58).toFixed(2)})`; ctx.fillRect(0, 0, w, h); }
      else if (seg.transition === 'light_leak') {
        const lg = ctx.createLinearGradient(0, 0, w, h);
        lg.addColorStop(0, `rgba(251,146,60,${(transP * 0.52).toFixed(2)})`); lg.addColorStop(1, `rgba(168,85,247,${(transP * 0.35).toFixed(2)})`);
        ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      } else if (seg.transition === 'glitch') {
        ctx.fillStyle = `rgba(56,189,248,${(transP * 0.25).toFixed(2)})`; ctx.fillRect(0, Math.random() * h * 0.6, w, 28);
        ctx.fillStyle = `rgba(244,63,94,${(transP * 0.25).toFixed(2)})`; ctx.fillRect(0, Math.random() * h * 0.8, w, 18);
      } else if (seg.transition === 'fade') { ctx.fillStyle = `rgba(0,0,0,${(transP * 0.78).toFixed(2)})`; ctx.fillRect(0, 0, w, h); }
    }

    drawOverlaysV6(ctx, w, h, plan, elapsedOut);
    ctx.restore();
  }

  // ================= 8. ĐỘNG CƠ RENDER ĐA CLIP + TRỘN ÂM ĐA KÊNH =================
  async function executeRenderPipeline(exportFile = false) {
    if (!currentMasterPlan || !ensureClipsAvailable() || isRendering) return;
    isRendering = true;

    const progEl = document.getElementById('ac-render-progress');
    const canvas = document.getElementById('ac-pro-preview-canvas');
    const { w, h } = getCanvasDims(currentMasterPlan.aspectRatio);
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const lut = LUT_PRESETS[currentMasterPlan.lutPreset] || LUT_PRESETS.tiktok_commerce;

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

    // Nạp sẵn thẻ <video> cho từng clip được dùng
    const videoPool = new Map();
    const bgmAudio = bgmUrl ? new Audio(bgmUrl) : null;
    const voiceAudio = attachedVoiceUrl ? new Audio(attachedVoiceUrl) : null;
    if (bgmAudio) { bgmAudio.loop = true; bgmAudio.crossOrigin = 'anonymous'; }
    if (voiceAudio) voiceAudio.crossOrigin = 'anonymous';

    let mediaRecorder = null;
    const recordedChunks = [];

    try {
      const neededClips = [...new Set(currentMasterPlan.segments.map((s) => Math.min(loadedClips.length - 1, Math.max(0, Number(s.clipIndex) || 0))))];
      for (const ci of neededClips) {
        const v = document.createElement('video');
        v.src = loadedClips[ci].url; v.crossOrigin = 'anonymous'; v.playsInline = true; v.muted = false;
        await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error(`Lỗi nạp Clip #${ci + 1}`)); });
        try {
          const vSrc = audioCtx.createMediaElementSource(v);
          const vGain = audioCtx.createGain(); vGain.gain.value = origMute ? 0 : 1;
          vSrc.connect(vGain); vGain.connect(mixBus);
        } catch (_) {}
        videoPool.set(ci, v);
      }

      if (bgmAudio) {
        const bSrc = audioCtx.createMediaElementSource(bgmAudio);
        const bGain = audioCtx.createGain(); bGain.gain.value = (voiceAudio && autoDuck) ? bgmVol * 0.35 : bgmVol;
        bSrc.connect(bGain); bGain.connect(mixBus);
      }
      if (voiceAudio) {
        const voSrc = audioCtx.createMediaElementSource(voiceAudio);
        const voGain = audioCtx.createGain(); voGain.gain.value = 1.05;
        voSrc.connect(voGain); voGain.connect(mixBus);
      }

      let chosenMime = 'video/webm'; let fileExt = 'webm';
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
        const ci = Math.min(loadedClips.length - 1, Math.max(0, Number(seg.clipIndex) || 0));
        const v = videoPool.get(ci);
        progEl.textContent = exportFile
          ? `🎬 Đang Render cảnh ${i + 1}/${segs.length} (Clip #${ci + 1}): ${seg.label}...`
          : `▶️ Phát thử cảnh ${i + 1}/${segs.length} (Clip #${ci + 1}): ${seg.label}`;

        v.playbackRate = seg.speed;
        v.currentTime = seg.startSec;
        await new Promise((r) => { const d = () => { v.removeEventListener('seeked', d); r(); }; v.addEventListener('seeked', d); });
        if (activeSkills.has('sfx_synth') && seg.sfx && seg.sfx !== 'none') triggerSFX(audioCtx, mixBus, seg.sfx, sfxVol);

        await v.play();
        const segStartWall = performance.now();
        const segOutDur = (seg.endSec - seg.startSec) / seg.speed;

        await new Promise((resolveSeg) => {
          function tick() {
            const le = (performance.now() - segStartWall) / 1000;
            const curOut = elapsedOut + le;
            if (activeSkills.has('sfx_synth') && activeSkills.has('stickers')) {
              currentMasterPlan.stickers.forEach((st, idx) => {
                if (!triggeredStickers.has(idx) && curOut >= st.startSec) {
                  triggeredStickers.add(idx); triggerSFX(audioCtx, mixBus, st.sfx || 'pop', sfxVol * 0.75);
                }
              });
            }
            drawVideoFrameV6(ctx, v, w, h, seg, Math.min(1, le / Math.max(0.1, segOutDur)), lut, curOut, currentMasterPlan);
            if (v.currentTime >= seg.endSec || v.ended || le >= segOutDur + 0.08) {
              v.pause(); cancelAnimationFrame(previewAnimId); resolveSeg(); return;
            }
            previewAnimId = requestAnimationFrame(tick);
          }
          previewAnimId = requestAnimationFrame(tick);
        });
        elapsedOut += segOutDur;
      }

      if (activeSkills.has('end_card') && currentMasterPlan.endCard?.enabled) {
        const endDur = Number(currentMasterPlan.endCard.durationSec || 1.8);
        if (activeSkills.has('sfx_synth')) triggerSFX(audioCtx, mixBus, 'sparkle', sfxVol);
        const endStart = performance.now();
        await new Promise((resEnd) => {
          function tickEnd() {
            const le = (performance.now() - endStart) / 1000;
            const prog = Math.min(1, le / endDur);
            ctx.save();
            const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#090d1f'); g.addColorStop(0.5, '#1e1b4b'); g.addColorStop(1, '#090d1f');
            ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
            const ease = applyEasing(Math.min(1, prog / 0.35), 'springPop');
            ctx.translate(w / 2, h / 2); ctx.scale(0.8 + 0.2 * ease, 0.8 + 0.2 * ease); ctx.textAlign = 'center';
            ctx.font = `900 ${Math.round(w * 0.07)}px system-ui, sans-serif`; ctx.fillStyle = '#fde047';
            ctx.fillText(currentMasterPlan.endCard.cta || 'Đặt Ngay Hôm Nay', 0, -22);
            if (currentMasterPlan.endCard.subCta) { ctx.font = `700 ${Math.round(w * 0.038)}px system-ui, sans-serif`; ctx.fillStyle = '#e2e8f0'; ctx.fillText(currentMasterPlan.endCard.subCta, 0, 42); }
            ctx.restore();
            if (le >= endDur) { cancelAnimationFrame(previewAnimId); resEnd(); return; }
            previewAnimId = requestAnimationFrame(tickEnd);
          }
          previewAnimId = requestAnimationFrame(tickEnd);
        });
      }

      if (exportFile && mediaRecorder) {
        await new Promise((r) => { mediaRecorder.onstop = r; mediaRecorder.stop(); });
        const blob = new Blob(recordedChunks, { type: chosenMime });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `AutoCut-Pro-v6-${Date.now()}.${fileExt}`; document.body.appendChild(a); a.click(); a.remove();
        progEl.innerHTML = `<span style="color:#4ade80;">✓ Đã xuất xong video thành phẩm (.${fileExt})!</span>`;
      } else {
        progEl.innerHTML = `<span style="color:#4ade80;">✓ Phát thử xong! Bấm "Render & Xuất Video" để tải file về máy.</span>`;
      }
    } catch (err) {
      progEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi Render: ${err.message}</span>`;
    } finally {
      videoPool.forEach((v) => v.pause());
      if (bgmAudio) { bgmAudio.pause(); bgmAudio.currentTime = 0; }
      if (voiceAudio) { voiceAudio.pause(); voiceAudio.currentTime = 0; }
      audioCtx.close().catch(() => {});
      isRendering = false;
    }
  }

  // ================= 9. GIỌNG NÓI 2 CHIỀU & CẮT THEO LỜI THOẠI (TEXT-BASED EDIT) =================
  let recognition = null; let isListening = false;

  function toggleMicDictation(targetId, btnEl) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { alert('Hãy dùng Google Chrome hoặc Microsoft Edge để dùng Micro trực tiếp!'); return; }
    if (isListening && recognition) { recognition.stop(); return; }
    recognition = new SpeechRec();
    recognition.lang = 'vi-VN'; recognition.continuous = true; recognition.interimResults = true;
    const target = document.getElementById(targetId);
    const base = target ? target.value.trim() : '';
    recognition.onstart = () => { isListening = true; btnEl.textContent = '🔴 Dừng'; btnEl.style.background = '#dc2626'; };
    recognition.onresult = (e) => {
      let tr = ''; for (let i = 0; i < e.results.length; i++) tr += e.results[i][0].transcript;
      if (target) target.value = (base ? base + ' ' : '') + tr.trim();
    };
    recognition.onend = () => { isListening = false; btnEl.textContent = btnEl.dataset.defaultLabel; btnEl.style.background = ''; };
    recognition.start();
  }

  async function transcribeForTextEdit(file) {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { alert('File để bóc băng cần nhỏ hơn 12MB.'); return; }
    const st = document.getElementById('ac-stt-status');
    st.textContent = '⏳ AI đang bóc băng & tự phát hiện từ ngập ngừng ("à, ừm...")...';
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = String(reader.result).split(',')[1];
        const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
        const res = await fetch(proxy, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'transcribe', audioBase64: b64, audioMime: file.type || 'audio/mp3' })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Lỗi bóc băng');
        document.getElementById('ac-tts-text').value = data.fullText || '';
        sttTranscriptLines = (data.subtitles || []).map((s, idx) => ({ ...s, keep: !s.isFiller, idx }));
        st.innerHTML = `<span style="color:#4ade80;">✓ Đã bóc xong ${sttTranscriptLines.length} câu thoại (tự bỏ tick các câu ngập ngừng)!</span>`;
        renderTextEditBox();
      } catch (e) { st.innerHTML = `<span style="color:#f87171;">⚠️ ${e.message}</span>`; }
    };
    reader.readAsDataURL(file);
  }

  function renderTextEditBox() {
    const box = document.getElementById('ac-text-edit-box');
    if (!box || !sttTranscriptLines.length) return;
    box.innerHTML = `
      <div style="margin-top:8px; background:#0a0f1d; border:1px solid #2b3856; border-radius:8px; padding:8px;">
        <div style="font-size:11px; font-weight:700; color:#fbbf24; margin-bottom:6px;">✂️ DỰNG PHIM THEO LỜI THOẠI (Bỏ tick câu muốn cắt bỏ):</div>
        <div style="max-height:140px; overflow-y:auto;">
          ${sttTranscriptLines.map((l, i) => `
            <label style="display:flex; gap:6px; align-items:flex-start; font-size:11.5px; margin-bottom:5px; cursor:pointer; color:${l.keep ? '#e2e8f0' : '#64748b'};">
              <input type="checkbox" data-stt-keep="${i}" ${l.keep ? 'checked' : ''} />
              <span><b style="color:#38bdf8;">[${l.startSec}→${l.endSec}s]</b> ${l.text} ${l.isFiller ? '<em style="color:#f87171;">(ngập ngừng)</em>' : ''}</span>
            </label>
          `).join('')}
        </div>
        <button class="acp-btn acp-btn-main" id="ac-apply-text-cut" style="width:100%; margin-top:6px;">✂️ Áp Dụng Cắt Theo Văn Bản Vào Timeline</button>
      </div>
    `;
    box.querySelectorAll('[data-stt-keep]').forEach((cb) => {
      cb.onchange = () => { sttTranscriptLines[Number(cb.dataset.sttKeep)].keep = cb.checked; };
    });
    document.getElementById('ac-apply-text-cut').onclick = () => {
      const kept = sttTranscriptLines.filter((l) => l.keep);
      if (!kept.length) { alert('Cần giữ lại ít nhất 1 câu thoại!'); return; }
      let outCursor = 0;
      const newSegs = []; const newSubs = [];
      kept.forEach((l, i) => {
        const dur = Math.max(0.6, (Number(l.endSec) || 2) - (Number(l.startSec) || 0));
        newSegs.push({
          clipIndex: 0, startSec: Number(l.startSec) || 0, endSec: Number(l.endSec) || dur, speed: 1.0,
          zoomFrom: 1.0, zoomTo: i % 2 === 0 ? 1.08 : 1.0, focalX: 0.5, focalY: 0.45,
          easing: 'easeOutExpo', transition: i === 0 ? 'flash' : 'fade', sfx: i === 0 ? 'pop' : 'none', label: l.text.slice(0, 28)
        });
        newSubs.push({ startSec: Number(outCursor.toFixed(2)), endSec: Number((outCursor + dur).toFixed(2)), text: l.text, highlight: l.highlight || '' });
        outCursor += dur;
      });
      if (!currentMasterPlan) currentMasterPlan = normalizePlanV6({}, [{ clipIndex: 0, name: 'Video thoại', durationSec: 60 }], syncData.preferences.brandTag);
      currentMasterPlan.segments = newSegs;
      currentMasterPlan.subtitles = newSubs;
      renderMasterWorkspace(currentMasterPlan, []);
      archiveCurrentProjectToSync();
      switchDrawerTab('auto');
      alert(`Đã cắt gọn theo văn bản: giữ ${kept.length}/${sttTranscriptLines.length} câu thoại và đồng bộ phụ đề chuẩn từng giây!`);
    };
  }

  async function runTextToSpeech() {
    const text = (document.getElementById('ac-tts-text').value || '').trim();
    const voice = document.getElementById('ac-tts-voice').value;
    const speed = parseFloat(document.getElementById('ac-tts-speed').value || '1.0');
    const st = document.getElementById('ac-tts-status');
    const wrap = document.getElementById('ac-tts-player');
    if (!text) { alert('Chưa có văn bản cần đọc!'); return; }
    st.textContent = '⏳ Đang tạo giọng đọc AI Studio...'; wrap.innerHTML = '';
    try {
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'tts', text, voice, speed }) });
      const data = await res.json();
      if (data.audioBase64) {
        if (lastTtsBlobUrl) URL.revokeObjectURL(lastTtsBlobUrl);
        const bin = atob(data.audioBase64); const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const ext = (data.audioMime || '').includes('wav') ? 'wav' : 'mp3';
        lastTtsBlobUrl = URL.createObjectURL(new Blob([arr], { type: data.audioMime || 'audio/wav' }));
        st.innerHTML = `<span style="color:#4ade80;">✓ Tạo giọng thành công (${data.provider || 'AI Studio'})!</span>`;
        wrap.innerHTML = `
          <audio controls autoplay src="${lastTtsBlobUrl}" style="width:100%; height:36px; margin-top:6px;"></audio>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <button class="acp-btn acp-btn-main" id="ac-attach-tts" style="flex:1;">🎙️ Gắn Vào Video Render</button>
            <a href="${lastTtsBlobUrl}" download="autocut-voice.${ext}" class="acp-btn" style="text-decoration:none;">⬇️ Tải (.${ext})</a>
          </div>
        `;
        document.getElementById('ac-attach-tts').onclick = () => { attachedVoiceUrl = lastTtsBlobUrl; attachedVoiceLabel = `Giọng AI (${voice})`; updateAudioBadge(); alert('Đã gắn giọng đọc AI vào bộ trộn Render!'); };
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; u.rate = speed;
      const vi = window.speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().includes('vi'));
      if (vi) u.voice = vi;
      window.speechSynthesis.speak(u);
      st.innerHTML = '<span style="color:#4ade80;">🔊 Đang phát giọng đọc tiếng Việt trên trình duyệt!</span>';
    } catch (e) { st.innerHTML = `<span style="color:#f87171;">⚠️ ${e.message}</span>`; }
  }

  // ================= 10. QUẢN LÝ UI, CLIP LIST & DỰ ÁN ĐỒNG BỘ =================
  function renderBehaviorBanner() {
    const el = document.getElementById('ac-behavior-summary');
    if (!el) return;
    const g = (syncData.behavior.recentGenres || []).slice(0, 3).join(', ');
    el.innerHTML = `<b>🧠 Học Hành Vi:</b> ${syncData.behavior.totalActions} phiên dựng${g ? ' • Gu gần đây: ' + g : ' • Sẵn sàng phân tích đa clip'}`;
  }

  function renderClipsList() {
    const el = document.getElementById('ac-clips-list');
    if (!el) return;
    if (!loadedClips.length) { el.innerHTML = '<div style="font-size:11px; color:#94a3b8; margin-top:4px;">Hoặc tự nhận video đã nạp ngoài màn hình chính</div>'; return; }
    el.innerHTML = loadedClips.map((c, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#131c31; padding:5px 8px; border-radius:6px; margin-top:5px; font-size:11px;">
        <span style="color:#4ade80; font-weight:700;">Clip #${idx + 1}: ${c.name.slice(0, 26)} (${c.durationSec ? c.durationSec.toFixed(1) + 's' : '...'})</span>
        <button class="acp-btn" data-rm-clip="${idx}" style="padding:2px 6px; font-size:10px; background:#7f1d1d;">✕</button>
      </div>
    `).join('');
    el.querySelectorAll('[data-rm-clip]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const i = Number(b.dataset.rmClip);
        if (loadedClips[i]?.url && loadedClips[i].file) URL.revokeObjectURL(loadedClips[i].url);
        loadedClips.splice(i, 1);
        renderClipsList();
      };
    });
  }

  function renderSavedProjectsList() {
    const box = document.getElementById('ac-cloud-projects');
    if (!box) return;
    const list = syncData.savedProjects || [];
    if (!list.length) { box.innerHTML = '<div style="font-size:11.5px; color:#94a3b8;">Chưa có dự án nào được lưu trên Cloud.</div>'; return; }
    box.innerHTML = list.map((p, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; background:#0a0f1d; border:1px solid #1e293b; border-radius:8px; padding:7px 9px; margin-bottom:6px; font-size:11.5px;">
        <div>
          <b style="color:#f8fafc;">${p.genre}</b> ${p.score ? `<span style="color:#4ade80;">(${p.score}đ)</span>` : ''}<br/>
          <span style="font-size:10.5px; color:#94a3b8;">${p.style} • ${new Date(p.savedAt).toLocaleString('vi-VN')}</span>
        </div>
        <button class="acp-btn acp-btn-main" data-load-prj="${idx}" style="padding:4px 9px; font-size:11px;">Mở lại</button>
      </div>
    `).join('');
    box.querySelectorAll('[data-load-prj]').forEach((b) => {
      b.onclick = () => {
        const prj = list[Number(b.dataset.loadPrj)];
        if (!prj) return;
        currentMasterPlan = prj.plan;
        currentCritic = prj.critic || null;
        copilotHistory = Array.isArray(prj.copilotHistory) ? [...prj.copilotHistory] : [];
        renderMasterWorkspace(currentMasterPlan, []);
        if (currentCritic) renderCriticAndPublishKit(currentCritic);
        switchDrawerTab('auto');
      };
    });
  }

  function updateAudioBadge() {
    const el = document.getElementById('ac-audio-summary');
    if (!el) return;
    el.innerHTML = `🎵 BGM: <b>${bgmFile ? `${bgmFile.name}${bgmBeatInfo ? ` (${bgmBeatInfo.bpm} BPM ✓)` : ''}` : 'Chưa chọn'}</b> • 🎙️ Giọng AI: <b>${attachedVoiceLabel || 'Chưa gắn'}</b>`;
  }

  function applyPreferencesToUI() {
    const p = syncData.preferences;
    const setVal = (id, val) => { const e = document.getElementById(id); if (e && val !== undefined) e.value = val; };
    const setChk = (id, val) => { const e = document.getElementById(id); if (e && val !== undefined) e.checked = Boolean(val); };
    setVal('ac-brand-tag', p.brandTag);
    setVal('ac-reasoning-mode', p.reasoningMode);
    setVal('ac-text-style-pref', p.textStylePref);
    setVal('ac-bgm-vol', p.bgmVol);
    setVal('ac-sfx-vol', p.sfxVol);
    setChk('ac-auto-duck', p.autoDuck);
    setChk('ac-mute-orig', p.muteOrig);
    setChk('ac-enable-search', p.enableSearch);
    const bv = document.getElementById('ac-bgm-vol-lbl'); if (bv) bv.textContent = (p.bgmVol || 30) + '%';
    const sv = document.getElementById('ac-sfx-vol-lbl'); if (sv) sv.textContent = (p.sfxVol || 55) + '%';
    document.querySelectorAll('#ac-skills-wrap .acp-skill').forEach((el) => {
      el.classList.toggle('on', activeSkills.has(el.getAttribute('data-sid')));
    });
    renderBehaviorBanner();
  }

  function switchDrawerTab(tabKey) {
    document.querySelectorAll('#ac-pro-drawer .acp-tab').forEach((x) => x.classList.toggle('active', x.getAttribute('data-t') === tabKey));
    ['auto', 'audio', 'voice', 'critic'].forEach((k) => {
      const pane = document.getElementById('ac-tab-' + k);
      if (pane) pane.style.display = k === tabKey ? 'block' : 'none';
    });
  }

  function mountProStudioV6() {
    if (document.getElementById('ac-pro-fab')) return;

    const style = document.createElement('style');
    style.textContent = `
      #ac-pro-fab {
        position: fixed; left: 16px; bottom: 16px; z-index: 9995;
        background: linear-gradient(135deg, #f59e0b, #7c3aed, #0ea5e9); color: #fff;
        border: 1px solid rgba(255,255,255,0.28); border-radius: 999px;
        padding: 11px 18px; font-size: 13px; font-weight: 800; cursor: pointer;
        box-shadow: 0 10px 30px rgba(124, 58, 237, 0.58); font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer {
        position: fixed; top: 0; right: -530px; width: 510px; max-width: 96vw; height: 100vh;
        background: #0b1120; border-left: 1px solid #26324d; z-index: 9998;
        box-shadow: -16px 0 48px rgba(0,0,0,0.8); transition: right 0.25s ease;
        display: flex; flex-direction: column; color: #f1f5f9; font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer.open { right: 0; }
      .acp-head { padding: 13px 16px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
      .acp-tabs { display: flex; border-bottom: 1px solid #1e293b; background: #0f172a; }
      .acp-tab { flex: 1; padding: 9px 4px; border: none; background: transparent; color: #94a3b8; font-size: 11.5px; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; }
      .acp-tab.active { color: #fbbf24; border-bottom-color: #fbbf24; background: #131c31; }
      .acp-body { padding: 14px 16px; overflow-y: auto; flex: 1; }
      .acp-sec { background: #131b2e; border: 1px solid #23304d; border-radius: 12px; padding: 11px; margin-bottom: 11px; }
      .acp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; display: block; }
      .acp-inp, .acp-sel, .acp-ta { width: 100%; box-sizing: border-box; background: #0a0f1d; border: 1px solid #2b3856; color: #f8fafc; border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none; }
      .acp-ta { min-height: 54px; resize: vertical; }
      .acp-btn { border: none; border-radius: 8px; padding: 8px 11px; font-size: 12px; font-weight: 700; cursor: pointer; color: #fff; background: #334155; }
      .acp-btn-main { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      .acp-btn-green { background: #10b981; color: #052e16; }
      .acp-skill { display: inline-block; padding: 4px 8px; margin: 2px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #2e3b5b; background: #0b1120; color: #cbd5e1; }
      .acp-skill.on { background: #312e81; border-color: #a78bfa; color: #fff; }
      .acp-drop { border: 2px dashed #4f46e5; border-radius: 10px; padding: 11px; text-align: center; cursor: pointer; background: #0e1529; }
    `;
    document.head.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'ac-pro-fab';
    fab.textContent = '🚀 AutoCut AI Pro v6 (Sync)';
    document.body.appendChild(fab);

    const drawer = document.createElement('div');
    drawer.id = 'ac-pro-drawer';
    drawer.innerHTML = `
      <div class="acp-head">
        <div>
          <div style="font-size:15px; font-weight:800; color:#fbbf24;">🚀 AUTOCUT AI PRO v6.0</div>
          <div id="ac-sync-badge" style="font-size:11px; color:#38bdf8;">☁️ Đang kết nối đồng bộ Cloud...</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="acp-btn" id="ac-force-sync" title="Đồng bộ ngay với Firebase Cloud">↻ Sync</button>
          <button class="acp-btn" id="ac-pro-close">✕</button>
        </div>
      </div>
      <div class="acp-tabs">
        <button class="acp-tab active" data-t="auto">🎬 Đa Clip & Co-Pilot</button>
        <button class="acp-tab" data-t="audio">🥁 Beat & SFX</button>
        <button class="acp-tab" data-t="voice">🎙️ Thoại & TTS</button>
        <button class="acp-tab" data-t="critic">🏆 Viral & Cloud</button>
      </div>
      <div class="acp-body">
        <!-- TAB 1: ĐA CLIP + SMART FOCAL + CHAT CO-PILOT -->
        <div id="ac-tab-auto">
          <div class="acp-sec" style="border-color:#4c1d95;">
            <div id="ac-behavior-summary" style="font-size:12px; color:#ddd6fe;"></div>
          </div>
          <div class="acp-sec">
            <label class="acp-label">1. Chọn 1 Hoặc Nhiều Clip Thô Cùng Lúc (Multi-Clip AI)</label>
            <input type="file" id="ac-raw-input" accept="video/*" multiple style="display:none;" />
            <div class="acp-drop" id="ac-raw-drop">
              <div style="font-size:13px; font-weight:700; color:#a5b4fc;">📂 Bấm chọn 1 hoặc nhiều clip quay thô (tối đa 8 clip)</div>
              <div id="ac-clips-list"></div>
            </div>
            <input class="acp-inp" id="ac-brand-tag" style="margin-top:8px;" placeholder="Tên thương hiệu / Nhãn hàng (tự đồng bộ Cloud)..." />
          </div>
          <div class="acp-sec">
            <label class="acp-label">2. Chế Độ Đọc Hiểu Thông Minh & Kiểu Chữ</label>
            <select class="acp-sel" id="ac-reasoning-mode" style="margin-bottom:6px;">
              ${REASONING_MODES.map((m) => `<option value="${m.id}">${m.label}</option>`).join('')}
            </select>
            <select class="acp-sel" id="ac-text-style-pref">
              ${TEXT_STYLES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}
            </select>
          </div>
          <div class="acp-sec">
            <label class="acp-label">3. Kho 13 Pro Skills (Tự lưu Cloud)</label>
            <div id="ac-skills-wrap">
              ${PRO_SKILLS.map((s) => `<span class="acp-skill on" data-sid="${s.id}">${s.name}</span>`).join('')}
            </div>
            <label style="display:flex; align-items:center; gap:6px; margin-top:7px; font-size:12px; color:#cbd5e1; cursor:pointer;">
              <input type="checkbox" id="ac-enable-search" checked /> 🌐 Tìm xu hướng Viral mới nhất qua Google Search
            </label>
          </div>
          <div class="acp-sec">
            <label class="acp-label">4. Yêu Cầu Dựng Phim (Gõ hoặc Nói qua Mic)</label>
            <textarea class="acp-ta" id="ac-auto-hint" placeholder="Để trống nếu muốn AI tự lo 100%, hoặc mô tả ngắn gọn..."></textarea>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="acp-btn" id="ac-mic-hint" data-default-label="🎙️ Nói lệnh">🎙️ Nói lệnh</button>
              <button class="acp-btn acp-btn-main" id="ac-btn-auto-scan" style="flex:1;">🚀 Quét Đa Clip & Tự Edit v6</button>
            </div>
            <div id="ac-auto-status" style="font-size:12px; margin-top:8px;"></div>
            <div id="ac-auto-result"></div>
          </div>
        </div>

        <!-- TAB 2: REAL BEAT-SYNC, BGM & 6 SFX -->
        <div id="ac-tab-audio" style="display:none;">
          <div class="acp-sec">
            <div id="ac-audio-summary" style="font-size:12px; color:#38bdf8; margin-bottom:8px;"></div>
            <label class="acp-label">Nhạc Nền BGM (Tự đo BPM & Khớp Nhịp Beat Thật)</label>
            <input type="file" id="ac-bgm-input" accept="audio/*" style="display:none;" />
            <div style="display:flex; gap:8px;">
              <button class="acp-btn acp-btn-main" id="ac-btn-bgm" style="flex:1;">🎵 Chọn Nhạc Nền (.mp3/.wav)</button>
              <button class="acp-btn" id="ac-clear-bgm">Xóa</button>
            </div>
            <div id="ac-beat-info" style="font-size:11.5px; color:#4ade80; margin-top:6px;"></div>
            <div style="margin-top:8px; font-size:12px;">
              <label style="display:flex; justify-content:space-between;"><span>Âm lượng nhạc nền BGM:</span><b id="ac-bgm-vol-lbl">30%</b></label>
              <input type="range" id="ac-bgm-vol" min="5" max="100" value="30" style="width:100%;" />
              <label style="display:flex; justify-content:space-between; margin-top:6px;"><span>Âm lượng SFX tự động:</span><b id="ac-sfx-vol-lbl">55%</b></label>
              <input type="range" id="ac-sfx-vol" min="10" max="100" value="55" style="width:100%;" />
            </div>
            <label style="display:flex; align-items:center; gap:6px; margin-top:8px; font-size:12px; cursor:pointer;">
              <input type="checkbox" id="ac-auto-duck" checked /> 🎧 Auto-Ducking (Tự hạ nhạc nền khi có giọng nói)
            </label>
            <label style="display:flex; align-items:center; gap:6px; margin-top:6px; font-size:12px; cursor:pointer;">
              <input type="checkbox" id="ac-mute-orig" /> 🔇 Tắt tiếng gốc video thô
            </label>
          </div>
          <div class="acp-sec">
            <label class="acp-label">Kho 6 SFX Tự Tổng Hợp Miễn Phí (Bấm nghe thử)</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
              ${SFX_LIST.map((s) => `<button class="acp-btn" data-test-sfx="${s.id}" style="text-align:left;">${s.label}</button>`).join('')}
            </div>
          </div>
        </div>

        <!-- TAB 3: BÓC BĂNG CẮT THEO LỜI THOẠI & GIỌNG ĐỌC TTS -->
        <div id="ac-tab-voice" style="display:none;">
          <div class="acp-sec">
            <label class="acp-label">1. Bóc Băng & Dựng Phim Theo Văn Bản (Bỏ "à, ừm...")</label>
            <input type="file" id="ac-stt-file" accept="audio/*,video/*" style="display:none;" />
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="acp-btn acp-btn-main" id="ac-btn-stt-file">📂 Bóc Băng File Video/Audio</button>
              <button class="acp-btn" id="ac-mic-tts" data-default-label="🎙️ Đọc Micro → Chữ">🎙️ Đọc Micro → Chữ</button>
            </div>
            <div id="ac-stt-status" style="font-size:12px; margin-top:6px;"></div>
            <div id="ac-text-edit-box"></div>
          </div>
          <div class="acp-sec">
            <label class="acp-label">2. Văn Bản → Giọng Đọc AI Studio (TTS)</label>
            <textarea class="acp-ta" id="ac-tts-text" style="min-height:105px;" placeholder="Lời bình AI tự tạo hoặc văn bản cần đọc..."></textarea>
            <div style="display:flex; gap:6px; margin-top:8px;">
              <select class="acp-sel" id="ac-tts-voice" style="flex:1;">
                <option value="nova">Giọng Nữ Truyền Cảm</option>
                <option value="alloy">Giọng Tự Nhiên</option>
                <option value="onyx">Giọng Nam Trầm Ấm</option>
                <option value="shimmer">Giọng Nữ Năng Động</option>
              </select>
              <select class="acp-sel" id="ac-tts-speed" style="width:76px;">
                <option value="0.9">0.9x</option><option value="1.0" selected>1.0x</option><option value="1.15">1.15x</option><option value="1.25">1.25x</option>
              </select>
              <button class="acp-btn acp-btn-green" id="ac-run-tts">🔊 Tạo Giọng</button>
            </div>
            <div id="ac-tts-status" style="font-size:12px; margin-top:6px;"></div>
            <div id="ac-tts-player"></div>
          </div>
        </div>

        <!-- TAB 4: CHẤM ĐIỂM VIRAL, PUBLISH KIT & LỊCH SỬ ĐỒNG BỘ CLOUD -->
        <div id="ac-tab-critic" style="display:none;">
          <div class="acp-sec">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label class="acp-label" style="margin:0;">🏆 AI Chấm Điểm Viral & Bộ Đăng Bài</label>
              <button class="acp-btn acp-btn-main" id="ac-btn-run-critic" style="padding:5px 10px; font-size:11px;">📊 Chấm Điểm Ngay</button>
            </div>
            <div id="ac-critic-body"><div style="font-size:12px; color:#94a3b8;">Bấm "Chấm Điểm Ngay" sau khi dựng để xem điểm giữ chân 0–100, xuất Ảnh bìa Thumbnail và 3 mẫu Caption bán hàng.</div></div>
          </div>
          <div class="acp-sec">
            <label class="acp-label">☁️ Lịch Sử Dự Án Đã Đồng Bộ Trên Firebase Cloud</label>
            <div id="ac-cloud-projects"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    fab.onclick = () => drawer.classList.toggle('open');
    document.getElementById('ac-pro-close').onclick = () => drawer.classList.remove('open');
    document.getElementById('ac-force-sync').onclick = () => pullFromCloudSync();

    drawer.querySelectorAll('.acp-tab').forEach((tab) => {
      tab.onclick = () => switchDrawerTab(tab.getAttribute('data-t'));
    });

    // Multi-clip picker
    document.getElementById('ac-raw-drop').onclick = () => document.getElementById('ac-raw-input').click();
    document.getElementById('ac-raw-input').onchange = async (e) => {
      const files = Array.from(e.target.files || []).slice(0, 8 - loadedClips.length);
      for (const f of files) {
        const url = URL.createObjectURL(f);
        const dur = await getVideoDuration(url);
        loadedClips.push({ file: f, url, name: f.name, durationSec: dur });
      }
      renderClipsList();
      e.target.value = '';
    };

    // BGM + Beat detection
    document.getElementById('ac-btn-bgm').onclick = () => document.getElementById('ac-bgm-input').click();
    document.getElementById('ac-bgm-input').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (bgmUrl) URL.revokeObjectURL(bgmUrl);
      bgmFile = f; bgmUrl = URL.createObjectURL(f);
      document.getElementById('ac-beat-info').textContent = '⏳ Đang phân tích nhịp trống (BPM & Beats)...';
      bgmBeatInfo = await detectMusicBeats(f);
      document.getElementById('ac-beat-info').textContent = bgmBeatInfo
        ? `🥁 Phát hiện nhịp nhạc ~${bgmBeatInfo.bpm} BPM (${bgmBeatInfo.beats.length} điểm rơi beat sẵn sàng đồng bộ cắt cảnh!)`
        : '✓ Đã nạp nhạc nền BGM.';
      updateAudioBadge();
    };
    document.getElementById('ac-clear-bgm').onclick = () => {
      if (bgmUrl) URL.revokeObjectURL(bgmUrl);
      bgmFile = null; bgmUrl = null; bgmBeatInfo = null;
      document.getElementById('ac-beat-info').textContent = ''; updateAudioBadge();
    };

    // Sync preferences on change
    const bindPref = (id, key, isCheck = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        syncData.preferences[key] = isCheck ? el.checked : (el.type === 'range' ? Number(el.value) : el.value);
        saveLocalAndScheduleCloudSync(false);
      });
    };
    bindPref('ac-brand-tag', 'brandTag');
    bindPref('ac-reasoning-mode', 'reasoningMode');
    bindPref('ac-text-style-pref', 'textStylePref');
    bindPref('ac-bgm-vol', 'bgmVol');
    bindPref('ac-sfx-vol', 'sfxVol');
    bindPref('ac-auto-duck', 'autoDuck', true);
    bindPref('ac-mute-orig', 'muteOrig', true);
    bindPref('ac-enable-search', 'enableSearch', true);

    document.getElementById('ac-bgm-vol').oninput = (e) => { document.getElementById('ac-bgm-vol-lbl').textContent = e.target.value + '%'; };
    document.getElementById('ac-sfx-vol').oninput = (e) => { document.getElementById('ac-sfx-vol-lbl').textContent = e.target.value + '%'; };

    drawer.querySelectorAll('[data-test-sfx]').forEach((b) => {
      b.onclick = () => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const c = new AudioCtx(); triggerSFX(c, c.destination, b.getAttribute('data-test-sfx'), 0.65);
        setTimeout(() => c.close().catch(() => {}), 900);
      };
    });

    drawer.querySelectorAll('#ac-skills-wrap .acp-skill').forEach((el) => {
      el.onclick = () => {
        const sid = el.getAttribute('data-sid');
        if (activeSkills.has(sid)) { activeSkills.delete(sid); el.classList.remove('on'); }
        else { activeSkills.add(sid); el.classList.add('on'); }
        saveLocalAndScheduleCloudSync(false);
      };
    });

    document.getElementById('ac-btn-auto-scan').onclick = runAutoScanV6;
    document.getElementById('ac-btn-run-critic').onclick = () => runViralCritic(false);
    document.getElementById('ac-mic-hint').onclick = function () { toggleMicDictation('ac-auto-hint', this); };
    document.getElementById('ac-mic-tts').onclick = function () { toggleMicDictation('ac-tts-text', this); };
    document.getElementById('ac-btn-stt-file').onclick = () => document.getElementById('ac-stt-file').click();
    document.getElementById('ac-stt-file').onchange = (e) => transcribeForTextEdit(e.target.files[0]);
    document.getElementById('ac-run-tts').onclick = runTextToSpeech;

    applyPreferencesToUI();
    renderClipsList();
    renderSavedProjectsList();
    updateAudioBadge();
    pullFromCloudSync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountProStudioV6);
  else mountProStudioV6();
})();
