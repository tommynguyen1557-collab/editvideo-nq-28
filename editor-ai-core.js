/**
 * AutoCut Studio AI v4.0 — Zero-Template Autonomous Pro Editor
 * Tích hợp: Quét toàn video thô (8 mốc hình + Sóng âm) -> Live Search tìm mẫu Viral
 * -> 10 Pro Skills thực thi thật trên Canvas (Jump-Cut, Zoom Punch-in, Flash Transition, 8 LUT Màu, Phụ đề động Hormozi, Auto-Reframe)
 * -> Xem trước & Xuất Video MP4/WebM trực tiếp + Phòng thu Giọng nói 2 chiều + Học hành vi người dùng
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://autocut-ai-proxy.tommynguyen1557.workers.dev';
  const FIREBASE_URL = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const BEHAVIOR_KEY = 'autocut_user_behavior_v1';

  // ================= 1. KHO 8 BỘ MÀU LUT CHUYÊN NGHIỆP =================
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

  // ================= 2. BỘ 10 SKILL EDITOR CHUYÊN NGHIỆP =================
  const PRO_SKILLS = [
    { id: 'auto_silence',  name: '🔇 Cắt Khoảng Lặng Tự Động', desc: 'Quét sóng âm loại bỏ đoạn im lặng thừa' },
    { id: 'hook_3s',       name: '🔥 Hook 3s Giữ Chân',        desc: 'Đẩy cảnh đắt giá nhất lên 3 giây đầu' },
    { id: 'jump_cut',      name: '✂️ Nhịp Cắt Jump-Cut',       desc: 'Ngắt nhịp mỗi 2-3 giây chống nhàm chán' },
    { id: 'punch_zoom',    name: '🎥 Zoom Punch-In 114%',      desc: 'Đẩy mượt ống kính theo từng cú cắt' },
    { id: 'flash_trans',   name: '⚡ Chuyển Cảnh Flash/Fade',  desc: 'Chớp sáng theo nhịp & hòa tan mượt' },
    { id: 'pro_lut',       name: '🎨 Chỉnh Màu LUT Chuẩn',     desc: 'Cân màu thương mại & khử ám màu sản phẩm' },
    { id: 'hormozi_sub',   name: '💬 Phụ Đề Động Hormozi',     desc: 'Phụ đề chữ lớn nổi từ khóa chuẩn TikTok' },
    { id: 'auto_reframe',  name: '📱 Tự Đóng Khung 9:16',      desc: 'Tự tạo khung dọc sắc nét kèm nền mờ' },
    { id: 'aida_sales',    name: '🎯 Kịch Bản Chốt Đơn AIDA',  desc: 'Cấu trúc nội dung dẫn dắt mua hàng' },
    { id: 'voice_studio',  name: '🎙️ Giọng Đọc & Lời Bình AI', desc: 'Tự viết lời thuyết minh và xuất giọng đọc' }
  ];

  // ================= 3. TRẠNG THÁI & BỘ NHỚ HÀNH VI =================
  function loadBehavior() {
    try {
      const saved = JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || 'null');
      if (saved) return saved;
    } catch (_) {}
    return {
      totalActions: 0,
      avgColor: { brightness: 103, contrast: 110, saturate: 100 },
      avgSpeed: 1.0,
      skillUsage: {},
      recentGenres: [],
      learnedStyleNote: 'Đang theo dõi thao tác để học gu dựng phim của bạn.'
    };
  }

  let behavior = loadBehavior();
  let activeSkills = new Set(PRO_SKILLS.map((s) => s.id));
  let rawVideoFile = null;
  let rawVideoUrl = null;
  let currentMasterPlan = null;
  let isRendering = false;
  let previewAnimId = null;
  let lastTtsBlobUrl = null;

  function saveBehavior(syncCloud = false) {
    const topGenres = behavior.recentGenres.slice(0, 3).join(', ');
    behavior.learnedStyleNote = behavior.totalActions > 0
      ? `Đã học từ ${behavior.totalActions} phiên dựng${topGenres ? ' • Thể loại hay làm: ' + topGenres : ''} • Màu chuẩn (${Math.round(behavior.avgColor.brightness)}%/${Math.round(behavior.avgColor.contrast)}\%).` : 'Sẵn sàng quét video thô và tự học phong cách dựng của bạn.'; localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior)); const el = document.getElementById('ac-behavior-summary'); if (el) el.innerHTML = `<b>🧠 Lõi Học Hành Vi:</b> ${behavior.learnedStyleNote}`;
    if (syncCloud) {
      fetch(`${FIREBASE_URL}/autocut_saas/behavior_profile.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...behavior, updatedAt: Date.now() }) }).catch(() => {}); } }  // ================= 4. QUÉT TOÀN BỘ VIDEO THÔ (8 MỐC HÌNH + SÓNG ÂM) ================= async function analyzeAudioTrack(file) { try { const arrBuf = await file.arrayBuffer(); const AudioCtx = window.AudioContext \vert{}\vert{} window.webkitAudioContext; const ctx = new AudioCtx(); const audioBuf = await ctx.decodeAudioData(arrBuf.slice(0)); const data = audioBuf.getChannelData(0); const sr = audioBuf.sampleRate; const winSec = 0.5; const winSize = Math.floor(sr * winSec); const silentRanges = []; const highEnergyPeaks = []; let silentStart = null;  for (let i = 0; i < data.length; i += winSize) { let sum = 0; const end = Math.min(i + winSize, data.length); for (let j = i; j < end; j++) sum += data[j] * data[j]; const rms = Math.sqrt(sum / (end - i)); const t = Number((i / sr).toFixed(1)); if (rms < 0.015) { if (silentStart === null) silentStart = t; } else { if (silentStart !== null && t - silentStart >= 1.0) { silentRanges.push({ from: silentStart, to: t }); } silentStart = null; if (rms > 0.14 && highEnergyPeaks.length < 10) highEnergyPeaks.push(t); } } ctx.close(); return { hasAudio: true, durationSec: Number(audioBuf.duration.toFixed(1)), silentRanges: silentRanges.slice(0, 8), highEnergyPeaks }; } catch (_) { return { hasAudio: false, note: 'Video không có âm thanh hoặc codec không giải mã trực tiếp' }; } }  async function scanFullVideoFrames(videoUrl, count = 8) { return new Promise((resolve, reject) => { const v = document.createElement('video'); v.muted = true; v.crossOrigin = 'anonymous'; v.playsInline = true; v.src = videoUrl;  v.onloadedmetadata = async () => { const dur = v.duration \vert{}\vert{} 10; const frames = []; const timestamps = []; const canvas = document.createElement('canvas'); const targetW = 420; const targetH = Math.max(200, Math.round((v.videoHeight / (v.videoWidth \vert{}\vert{} 1)) * targetW)); canvas.width = targetW; canvas.height = targetH; const ctx = canvas.getContext('2d');  for (let i = 0; i < count; i++) { const ratio = 0.05 + (0.90 * i) / Math.max(1, count - 1); const t = Math.min(dur - 0.1, Math.max(0.05, dur * ratio)); await new Promise((resSeek) => { const onSeeked = () => { v.removeEventListener('seeked', onSeeked); ctx.drawImage(v, 0, 0, targetW, targetH); const b64 = canvas.toDataURL('image/jpeg', 0.65).split(',')[1]; if (b64) { frames.push(b64); timestamps.push(Number(t.toFixed(1))); } resSeek(); }; v.addEventListener('seeked', onSeeked); v.currentTime = t; }); } resolve({ frames, timestamps, durationSec: dur, width: v.videoWidth, height: v.videoHeight }); }; v.onerror = () => reject(new Error('Không thể đọc file video thô này. Hãy chọn file MP4/MOV/WebM chuẩn.')); }); }  // Tạo kế hoạch dự phòng an toàn nếu AI không trả đủ mảng segments function normalizePlan(plan, durationSec) { const safeDur = Math.max(3, Number(durationSec) \vert{}\vert{} 12); const p = plan && typeof plan === 'object' ? { ...plan } : {}; if (!Array.isArray(p.segments) \vert{}\vert{} p.segments.length === 0) { const segLen = Math.min(3.5, safeDur / 3); p.segments = [ { startSec: 0, endSec: segLen, speed: 1.0, zoomFrom: 1.0, zoomTo: 1.12, transition: 'flash', label: 'Hook mở đầu' }, { startSec: Math.min(safeDur - segLen, safeDur * 0.38), endSec: Math.min(safeDur, safeDur * 0.38 + segLen), speed: 1.05, zoomFrom: 1.08, zoomTo: 1.0, transition: 'fade', label: 'Cận cảnh điểm nhấn' }, { startSec: Math.max(0, safeDur - segLen), endSec: safeDur, speed: 1.0, zoomFrom: 1.0, zoomTo: 1.10, transition: 'flash', label: 'Chốt thông điệp' } ]; } p.segments = p.segments .map((s) => { const st = Math.max(0, Math.min(safeDur - 0.5, Number(s.startSec) \vert{}\vert{} 0)); const en = Math.max(st + 0.6, Math.min(safeDur, Number(s.endSec) \vert{}\vert{} st + 2.5)); return { startSec: Number(st.toFixed(2)), endSec: Number(en.toFixed(2)), speed: Math.min(1.6, Math.max(0.7, Number(s.speed) \vert{}\vert{} 1.0)), zoomFrom: Number(s.zoomFrom) \vert{}\vert{} 1.0, zoomTo: Number(s.zoomTo) \vert{}\vert{} 1.1, transition: s.transition \vert{}\vert{} 'flash', label: s.label \vert{}\vert{} 'Phân đoạn' }; }) .slice(0, 10);  p.lutPreset = LUT_PRESETS[p.lutPreset] ? p.lutPreset : 'tiktok_commerce'; p.aspectRatio = ['9:16', '16:9', '1:1'].includes(p.aspectRatio) ? p.aspectRatio : '9:16'; p.subtitles = Array.isArray(p.subtitles) ? p.subtitles : []; return p; }  // ================= 5. CHẠY QUY TRÌNH TỰ QUÉT & DỰNG TỰ ĐỘNG (1 CLICK) ================= async function runAutonomousScanAndEdit() { const statusEl = document.getElementById('ac-auto-status'); const resultEl = document.getElementById('ac-auto-result');  // Tự động lấy file nếu người dùng đã tải Video Thô ở giao diện ngoài if (!rawVideoUrl) { const existingVid = Array.from(document.querySelectorAll('video')).find((v) => v.src && v.readyState >= 1); if (existingVid) rawVideoUrl = existingVid.src; }  if (!rawVideoUrl) { alert('Hãy bấm chọn 1 Video Thô trước để AI quét và tự dựng!'); return; }  const userHint = (document.getElementById('ac-auto-hint').value \vert{}\vert{} '').trim(); const enableWebSearch = document.getElementById('ac-enable-search').checked;  try { statusEl.innerHTML = '<span style="color:#38bdf8;">⏳ Bước 1/3: Đang quét 8 mốc hình toàn video thô & phân tích sóng âm...</span>'; const [scanData, audioStats] = await Promise.all([ scanFullVideoFrames(rawVideoUrl, 8), rawVideoFile ? analyzeAudioTrack(rawVideoFile) : Promise.resolve({ hasAudio: false }) ]);  statusEl.innerHTML = '<span style="color:#a78bfa;">🔎 Bước 2/3: AI đang nhận diện dạng video, tìm nguồn mẫu Viral & lập kịch bản Edit Pro...</span>';  const selectedSkillNames = Array.from(activeSkills).map((id) => { const s = PRO_SKILLS.find((x) => x.id === id); return s ? `${s.name} (${s.desc})` : id; });  const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) \vert{}\vert{} PROXY_URL; const res = await fetch(proxy, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'auto_scan_and_edit', rawFrames: scanData.frames, frameTimestamps: scanData.timestamps, durationSec: scanData.durationSec, audioStats, userHint, activeSkills: selectedSkillNames, behaviorProfile: behavior, enableWebSearch }) }); const data = await res.json(); if (!res.ok \vert{}\vert{} data.error) throw new Error(data.error \vert{}\vert{} `HTTP ${res.status}`);

      currentMasterPlan = normalizePlan(data.plan, scanData.durationSec);

      // Cập nhật bộ nhớ hành vi
      behavior.totalActions += 1;
      if (currentMasterPlan.detectedGenre) {
        behavior.recentGenres = [
          currentMasterPlan.detectedGenre,
          ...behavior.recentGenres.filter((g) => g !== currentMasterPlan.detectedGenre)
        ].slice(0, 6);
      }
      if (currentMasterPlan.color) {
        behavior.avgColor.brightness = behavior.avgColor.brightness * 0.7 + (currentMasterPlan.color.brightness || 103) * 0.3;
        behavior.avgColor.contrast = behavior.avgColor.contrast * 0.7 + (currentMasterPlan.color.contrast || 110) * 0.3;
      }
      saveBehavior(true);

      // Đồng bộ lời bình xuống Phòng Thu Giọng Nói
      const ttsBox = document.getElementById('ac-tts-text');
      if (ttsBox && currentMasterPlan.voiceoverScript) ttsBox.value = currentMasterPlan.voiceoverScript;

      // Đồng bộ thanh trượt giao diện ngoài
      syncSlidersToMainPage(currentMasterPlan);

      statusEl.innerHTML = `<span style="color:#4ade80;">✓ Hoàn tất phân tích (${data.provider} •${data.model})! Sẵn sàng Xem Trước & Xuất Video đã Edit.</span>`;
      renderMasterPlanReport(currentMasterPlan, data.sources || [], audioStats);
      preparePreviewCanvas();
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi: ${err.message}</span>`;
    }
  }

  function syncSlidersToMainPage(plan) {
    if (!plan.color) return;
    const inputs = Array.from(document.querySelectorAll('input[type="range"], input[type="number"]'));
    inputs.forEach((inp) => {
      if (inp.closest('#ac-pro-drawer')) return;
      const ctx = ((inp.id || '') + ' ' + (inp.parentElement ? inp.parentElement.textContent : '')).toLowerCase();
      if (ctx.includes('sáng') || ctx.includes('bright')) { inp.value = plan.color.brightness || 103; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      if (ctx.includes('tương phản') || ctx.includes('contrast')) { inp.value = plan.color.contrast || 110; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      if (ctx.includes('bão hòa') || ctx.includes('saturat')) { inp.value = plan.color.saturate || 100; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
  }

  function renderMasterPlanReport(plan, sources, audioStats) {
    const el = document.getElementById('ac-auto-result');
    const lutInfo = LUT_PRESETS[plan.lutPreset] || LUT_PRESETS.tiktok_commerce;
    const totalOutSec = plan.segments.reduce((acc, s) => acc + (s.endSec - s.startSec) / s.speed, 0);

    const sourcesHtml = sources.length
      ? `<div style="margin-top:6px; font-size:11px; color:#94a3b8;">🌐 <b>Nguồn xu hướng AI vừa tra cứu:</b> ${sources.map((s) => `<a href="${s.url}" target="_blank" style="color:#38bdf8; margin-right:8px;">${s.title.slice(0, 38)}</a>`).join('')}</div>`
      : '';

    const segsHtml = plan.segments.map((s, idx) => `
      <div style="display:flex; justify-content:space-between; gap:6px; padding:5px 0; border-bottom:1px solid #1e293b; font-size:11px;">
        <span style="color:#38bdf8; font-weight:700;">#${idx + 1} [${s.startSec}s→${s.endSec}s]</span>
        <span style="flex:1; color:#e2e8f0;">${s.label}</span>
        <span style="color:#a78bfa;">${s.speed}x • Zoom ${Math.round(s.zoomTo * 100)}\% •${s.transition}</span>
      </div>
    `).join('');

    el.innerHTML = `
      <div style="background:#0a1020; border:1px solid #334155; border-radius:10px; padding:12px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <span style="background:#312e81; color:#e0e7ff; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:700;">🎯 Thể loại: ${plan.detectedGenre || 'Video thương mại'}</span>
          <span style="color:#4ade80; font-size:11px; font-weight:700;">Thành phẩm: ~${totalOutSec.toFixed(1)}s • ${plan.aspectRatio}</span>
        </div>
        <div style="font-size:12px; color:#cbd5e1; margin-top:8px; line-height:1.5;">${plan.videoAnalysis || ''}</div>
        <div style="margin-top:8px; background:#131c31; padding:8px 10px; border-radius:8px; font-size:12px; line-height:1.5;">
          <div>🔥 <b>Mẫu Viral áp dụng:</b> <span
