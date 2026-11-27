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
      ? `Đã học từ ${behavior.totalActions} phiên dựng${topGenres ? ' • Thể loại hay làm: ' + topGenres : ''} • Màu chuẩn (${Math.round(behavior.avgColor.brightness)}%/${Math.round(behavior.avgColor.contrast)}%).`
      : 'Sẵn sàng quét video thô và tự học phong cách dựng của bạn.';
    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior));
    const el = document.getElementById('ac-behavior-summary');
    if (el) el.innerHTML = `<b>🧠 Lõi Học Hành Vi:</b> ${behavior.learnedStyleNote}`;
    if (syncCloud) {
      fetch(`${FIREBASE_URL}/autocut_saas/behavior_profile.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...behavior, updatedAt: Date.now() })
      }).catch(() => {});
    }
  }

  // ================= 4. QUÉT TOÀN BỘ VIDEO THÔ (8 MỐC HÌNH + SÓNG ÂM) =================
  async function analyzeAudioTrack(file) {
    try {
      const arrBuf = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuf = await ctx.decodeAudioData(arrBuf.slice(0));
      const data = audioBuf.getChannelData(0);
      const sr = audioBuf.sampleRate;
      const winSec = 0.5;
      const winSize = Math.floor(sr * winSec);
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
          if (silentStart !== null && t - silentStart >= 1.0) {
            silentRanges.push({ from: silentStart, to: t });
          }
          silentStart = null;
          if (rms > 0.14 && highEnergyPeaks.length < 10) highEnergyPeaks.push(t);
        }
      }
      ctx.close();
      return {
        hasAudio: true,
        durationSec: Number(audioBuf.duration.toFixed(1)),
        silentRanges: silentRanges.slice(0, 8),
        highEnergyPeaks
      };
    } catch (_) {
      return { hasAudio: false, note: 'Video không có âm thanh hoặc codec không giải mã trực tiếp' };
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
              if (b64) {
                frames.push(b64);
                timestamps.push(Number(t.toFixed(1)));
              }
              resSeek();
            };
            v.addEventListener('seeked', onSeeked);
            v.currentTime = t;
          });
        }
        resolve({ frames, timestamps, durationSec: dur, width: v.videoWidth, height: v.videoHeight });
      };
      v.onerror = () => reject(new Error('Không thể đọc file video thô này. Hãy chọn file MP4/MOV/WebM chuẩn.'));
    });
  }

  // Tạo kế hoạch dự phòng an toàn nếu AI không trả đủ mảng segments
  function normalizePlan(plan, durationSec) {
    const safeDur = Math.max(3, Number(durationSec) || 12);
    const p = plan && typeof plan === 'object' ? { ...plan } : {};
    if (!Array.isArray(p.segments) || p.segments.length === 0) {
      const segLen = Math.min(3.5, safeDur / 3);
      p.segments = [
        { startSec: 0, endSec: segLen, speed: 1.0, zoomFrom: 1.0, zoomTo: 1.12, transition: 'flash', label: 'Hook mở đầu' },
        { startSec: Math.min(safeDur - segLen, safeDur * 0.38), endSec: Math.min(safeDur, safeDur * 0.38 + segLen), speed: 1.05, zoomFrom: 1.08, zoomTo: 1.0, transition: 'fade', label: 'Cận cảnh điểm nhấn' },
        { startSec: Math.max(0, safeDur - segLen), endSec: safeDur, speed: 1.0, zoomFrom: 1.0, zoomTo: 1.10, transition: 'flash', label: 'Chốt thông điệp' }
      ];
    }
    p.segments = p.segments
      .map((s) => {
        const st = Math.max(0, Math.min(safeDur - 0.5, Number(s.startSec) || 0));
        const en = Math.max(st + 0.6, Math.min(safeDur, Number(s.endSec) || st + 2.5));
        return {
          startSec: Number(st.toFixed(2)),
          endSec: Number(en.toFixed(2)),
          speed: Math.min(1.6, Math.max(0.7, Number(s.speed) || 1.0)),
          zoomFrom: Number(s.zoomFrom) || 1.0,
          zoomTo: Number(s.zoomTo) || 1.1,
          transition: s.transition || 'flash',
          label: s.label || 'Phân đoạn'
        };
      })
      .slice(0, 10);

    p.lutPreset = LUT_PRESETS[p.lutPreset] ? p.lutPreset : 'tiktok_commerce';
    p.aspectRatio = ['9:16', '16:9', '1:1'].includes(p.aspectRatio) ? p.aspectRatio : '9:16';
    p.subtitles = Array.isArray(p.subtitles) ? p.subtitles : [];
    return p;
  }

  // ================= 5. CHẠY QUY TRÌNH TỰ QUÉT & DỰNG TỰ ĐỘNG (1 CLICK) =================
  async function runAutonomousScanAndEdit() {
    const statusEl = document.getElementById('ac-auto-status');
    const resultEl = document.getElementById('ac-auto-result');

    // Tự động lấy file nếu người dùng đã tải Video Thô ở giao diện ngoài
    if (!rawVideoUrl) {
      const existingVid = Array.from(document.querySelectorAll('video')).find((v) => v.src && v.readyState >= 1);
      if (existingVid) rawVideoUrl = existingVid.src;
    }

    if (!rawVideoUrl) {
      alert('Hãy bấm chọn 1 Video Thô trước để AI quét và tự dựng!');
      return;
    }

    const userHint = (document.getElementById('ac-auto-hint').value || '').trim();
    const enableWebSearch = document.getElementById('ac-enable-search').checked;

    try {
      statusEl.innerHTML = '<span style="color:#38bdf8;">⏳ Bước 1/3: Đang quét 8 mốc hình toàn video thô & phân tích sóng âm...</span>';
      const [scanData, audioStats] = await Promise.all([
        scanFullVideoFrames(rawVideoUrl, 8),
        rawVideoFile ? analyzeAudioTrack(rawVideoFile) : Promise.resolve({ hasAudio: false })
      ]);

      statusEl.innerHTML = '<span style="color:#a78bfa;">🔎 Bước 2/3: AI đang nhận diện dạng video, tìm nguồn mẫu Viral & lập kịch bản Edit Pro...</span>';

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
          activeSkills: selectedSkillNames,
          behaviorProfile: behavior,
          enableWebSearch
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

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

      statusEl.innerHTML = `<span style="color:#4ade80;">✓ Hoàn tất phân tích (${data.provider} • ${data.model})! Sẵn sàng Xem Trước & Xuất Video đã Edit.</span>`;
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
        <span style="color:#a78bfa;">${s.speed}x • Zoom ${Math.round(s.zoomTo * 100)}% • ${s.transition}</span>
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
          <div>🔥 <b>Mẫu Viral áp dụng:</b> <span style="color:#fbbf24;">${plan.matchedReference?.styleName || 'Viral Short-Form Pro'}</span></div>
          <div>🎬 <b>Hook 3s:</b> ${plan.matchedReference?.hookFormula || 'Mở cảnh đắt giá + Zoom nhanh'}</div>
          <div>🎨 <b>Bộ màu LUT:</b> <span style="color:#4ade80;">${lutInfo.name}</span></div>
          ${audioStats?.silentRanges?.length ? `<div>🔇 <b>Đã dọn khoảng lặng:</b> phát hiện ${audioStats.silentRanges.length} đoạn im lặng thừa</div>` : ''}
        </div>
        ${sourcesHtml}
        <div style="margin-top:8px;">
          <div style="font-size:11px; font-weight:700; color:#fbbf24; margin-bottom:4px;">✂️ KỊCH BẢN CẮT THỰC THI (${plan.segments.length} cảnh):</div>
          ${segsHtml}
        </div>
        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
          <select id="ac-lut-override" class="acp-sel" style="flex:1; min-width:150px;">
            ${Object.entries(LUT_PRESETS).map(([k, v]) => `<option value="${k}" ${k === plan.lutPreset ? 'selected' : ''}>🎨 ${v.name}</option>`).join('')}
          </select>
          <select id="ac-ratio-override" class="acp-sel" style="width:95px;">
            <option value="9:16" ${plan.aspectRatio === '9:16' ? 'selected' : ''}>9:16 Dọc</option>
            <option value="16:9" ${plan.aspectRatio === '16:9' ? 'selected' : ''}>16:9 Ngang</option>
            <option value="1:1" ${plan.aspectRatio === '1:1' ? 'selected' : ''}>1:1 Vuông</option>
          </select>
        </div>
        <div style="margin-top:10px; text-align:center;">
          <canvas id="ac-pro-preview-canvas" style="max-width:100%; max-height:280px; border-radius:10px; background:#000; border:1px solid #334155;"></canvas>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="acp-btn acp-btn-main" id="ac-btn-play-edl" style="flex:1;">▶️ Xem Thử Bản Đã Edit</button>
          <button class="acp-btn acp-btn-green" id="ac-btn-export-edl" style="flex:1;">⬇️ Render & Xuất Video</button>
        </div>
        <div id="ac-render-progress" style="font-size:12px; color:#fbbf24; margin-top:6px; text-align:center;"></div>
      </div>
    `;

    document.getElementById('ac-lut-override').onchange = (e) => { currentMasterPlan.lutPreset = e.target.value; };
    document.getElementById('ac-ratio-override').onchange = (e) => { currentMasterPlan.aspectRatio = e.target.value; preparePreviewCanvas(); };
    document.getElementById('ac-btn-play-edl').onclick = () => executeRenderPipeline(false);
    document.getElementById('ac-btn-export-edl').onclick = () => executeRenderPipeline(true);
  }

  // ================= 6. ĐỘNG CƠ RENDER CANVAS THỰC THI THẬT (CẮT + ZOOM + LUT + PHỤ ĐỀ + XUẤT VIDEO) =================
  function getCanvasDims(ratio) {
    if (ratio === '16:9') return { w: 1280, h: 720 };
    if (ratio === '1:1') return { w: 720, h: 720 };
    return { w: 720, h: 1280 }; // 9:16 TikTok/Reels chuẩn HD
  }

  function preparePreviewCanvas() {
    const canvas = document.getElementById('ac-pro-preview-canvas');
    if (!canvas || !currentMasterPlan) return;
    const { w, h } = getCanvasDims(currentMasterPlan.aspectRatio);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bấm "Xem Thử" hoặc "Render & Xuất Video"', w / 2, h / 2);
  }

  function drawHormoziCaption(ctx, w, h, sub, progress) {
    if (!sub || !sub.text) return;
    const fontSize = Math.round(w * 0.058);
    ctx.save();
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Tự động xuống dòng đẹp (tối đa 22 ký tự/dòng)
    const words = sub.text.split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach((wd) => {
      if ((cur + ' ' + wd).trim().length > 22) {
        if (cur) lines.push(cur);
        cur = wd;
      } else {
        cur = (cur + ' ' + wd).trim();
      }
    });
    if (cur) lines.push(cur);

    const scalePop = progress < 0.12 ? 0.88 + (progress / 0.12) * 0.16 : 1.0;
    const baseY = h * 0.78 - ((lines.length - 1) * fontSize * 0.65);

    ctx.translate(w / 2, baseY);
    ctx.scale(scalePop, scalePop);

    const hl = (sub.highlight || '').toLowerCase();
    lines.forEach((line, idx) => {
      const y = idx * (fontSize * 1.28);
      const metrics = ctx.measureText(line);
      const padX = 20;
      const padY = 12;

      // Nền bán trong suốt chống lẫn màu video
      ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
      ctx.beginPath();
      ctx.roundRect(-metrics.width / 2 - padX, y - fontSize / 2 - padY / 2, metrics.width + padX * 2, fontSize + padY, 14);
      ctx.fill();

      // Viền đen đậm kiểu CapCut/Hormozi
      ctx.lineWidth = Math.max(5, Math.round(fontSize * 0.16));
      ctx.strokeStyle = '#000000';
      ctx.lineJoin = 'round';
      ctx.strokeText(line, 0, y);

      // Màu chữ vàng nổi bật nếu dòng chứa từ khóa highlight
      const isHighlightLine = hl && line.toLowerCase().includes(hl);
      ctx.fillStyle = isHighlightLine ? '#facc15' : '#ffffff';
      ctx.fillText(line, 0, y);
    });
    ctx.restore();
  }

  function drawVideoFramePro(ctx, video, w, h, seg, segProgress, lut, elapsedOutSec, subtitles) {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // 1. Tính tỉ lệ phủ khung & Auto-Reframe nền mờ
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const canvasRatio = w / h;
    const videoRatio = vw / vh;

    // 2. Dynamic Punch-In Zoom
    const useZoom = activeSkills.has('punch_zoom');
    const zoom = useZoom ? (seg.zoomFrom + (seg.zoomTo - seg.zoomFrom) * segProgress) : 1.0;

    // 3. Áp bộ màu LUT
    const filterStr = activeSkills.has('pro_lut') ? lut.filter : 'none';

    if (activeSkills.has('auto_reframe') && Math.abs(canvasRatio - videoRatio) > 0.35) {
      // Vẽ nền mờ điện ảnh lấp đầy 9:16 khi video gốc nằm ngang
      ctx.save();
      ctx.filter = `blur(24px) brightness(55%) ${filterStr !== 'none' ? filterStr : ''}`;
      const bgScale = Math.max(w / vw, h / vh) * 1.1;
      ctx.drawImage(video, (w - vw * bgScale) / 2, (h - vh * bgScale) / 2, vw * bgScale, vh * bgScale);
      ctx.restore();

      // Vẽ video chính sắc nét ở giữa có Zoom
      ctx.save();
      ctx.filter = filterStr;
      const fgScale = Math.min(w / vw, h / vh) * zoom * 1.06;
      ctx.drawImage(video, (w - vw * fgScale) / 2, (h - vh * fgScale) / 2, vw * fgScale, vh * fgScale);
      ctx.restore();
    } else {
      ctx.save();
      ctx.filter = filterStr;
      const coverScale = Math.max(w / vw, h / vh) * zoom;
      ctx.drawImage(video, (w - vw * coverScale) / 2, (h - vh * coverScale) / 2, vw * coverScale, vh * coverScale);
      ctx.restore();
    }

    // 4. Vignette điện ảnh nhẹ quanh 4 góc
    if (activeSkills.has('pro_lut') && lut.vignette > 0) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${lut.vignette})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 5. Hiệu ứng chuyển cảnh đầu mỗi cú cắt (Flash Beat hoặc Fade)
    if (activeSkills.has('flash_trans') && segProgress < 0.14) {
      const alpha = (1 - segProgress / 0.14);
      if (seg.transition === 'flash') {
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.55).toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = `rgba(0, 0, 0, ${(alpha * 0.7).toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // 6. Vẽ phụ đề động Hormozi khớp thời gian thành phẩm
    if (activeSkills.has('hormozi_sub') && subtitles.length) {
      const activeSub = subtitles.find((s) => elapsedOutSec >= Number(s.startSec) && elapsedOutSec <= Number(s.endSec));
      if (activeSub) {
        const subDur = Math.max(0.2, Number(activeSub.endSec) - Number(activeSub.startSec));
        const subProg = (elapsedOutSec - Number(activeSub.startSec)) / subDur;
        drawHormoziCaption(ctx, w, h, activeSub, subProg);
      }
    }

    ctx.restore();
  }

  async function executeRenderPipeline(exportFile = false) {
    if (!currentMasterPlan || !rawVideoUrl) return;
    if (isRendering) return;
    isRendering = true;

    const progEl = document.getElementById('ac-render-progress');
    const canvas = document.getElementById('ac-pro-preview-canvas');
    const { w, h } = getCanvasDims(currentMasterPlan.aspectRatio);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const lut = LUT_PRESETS[currentMasterPlan.lutPreset] || LUT_PRESETS.tiktok_commerce;

    const v = document.createElement('video');
    v.src = rawVideoUrl;
    v.crossOrigin = 'anonymous';
    v.playsInline = true;
    v.muted = false;

    let mediaRecorder = null;
    let recordedChunks = [];
    let audioCtx = null;

    try {
      await new Promise((res, rej) => {
        v.onloadedmetadata = res;
        v.onerror = () => rej(new Error('Không thể nạp video để render'));
      });

      let chosenMime = 'video/webm';
      let fileExt = 'webm';

      if (exportFile) {
        const stream = canvas.captureStream(30);
        // Thu thêm âm thanh gốc của video thô vào bản xuất
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioCtx();
          const srcNode = audioCtx.createMediaElementSource(v);
          const destNode = audioCtx.createMediaStreamDestination();
          srcNode.connect(destNode);
          srcNode.connect(audioCtx.destination);
          destNode.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        } catch (_) {}

        const mimeCandidates = [
          { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
          { mime: 'video/mp4', ext: 'mp4' },
          { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
          { mime: 'video/webm', ext: 'webm' }
        ];
        const found = mimeCandidates.find((c) => window.MediaRecorder && MediaRecorder.isTypeSupported(c.mime));
        if (found) {
          chosenMime = found.mime;
          fileExt = found.ext;
        }
        mediaRecorder = new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: 5000000 });
        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.start(250);
      }

      const segs = currentMasterPlan.segments;
      let elapsedOut = 0;

      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        progEl.textContent = exportFile
          ? `🎬 Đang Render & Xuất cảnh ${i + 1}/${segs.length}: ${seg.label}...`
          : `▶️ Đang phát thử cảnh ${i + 1}/${segs.length}: ${seg.label}`;

        v.playbackRate = seg.speed;
        v.currentTime = seg.startSec;
        await new Promise((r) => {
          const done = () => { v.removeEventListener('seeked', done); r(); };
          v.addEventListener('seeked', done);
        });

        await v.play();
        const segStartWall = performance.now();
        const segOutDur = (seg.endSec - seg.startSec) / seg.speed;

        await new Promise((resolveSeg) => {
          function tick() {
            const localElapsed = (performance.now() - segStartWall) / 1000;
            const prog = Math.min(1, localElapsed / Math.max(0.1, segOutDur));
            drawVideoFramePro(ctx, v, w, h, seg, prog, lut, elapsedOut + localElapsed, currentMasterPlan.subtitles);

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

      if (exportFile && mediaRecorder) {
        await new Promise((resStop) => {
          mediaRecorder.onstop = resStop;
          mediaRecorder.stop();
        });
        const blob = new Blob(recordedChunks, { type: chosenMime });
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `AutoCut-Pro-Edit-${Date.now()}.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        progEl.innerHTML = `<span style="color:#4ade80;">✓ Đã xuất xong video thành phẩm (.${fileExt})! Kiểm tra thư mục Tải xuống.</span>`;
      } else {
        progEl.innerHTML = `<span style="color:#4ade80;">✓ Phát thử xong! Nếu ưng ý, bấm "Render & Xuất Video" để tải file về.</span>`;
      }
    } catch (err) {
      progEl.innerHTML = `<span style="color:#f87171;">⚠️ Lỗi Render: ${err.message}</span>`;
    } finally {
      v.pause();
      if (audioCtx) audioCtx.close().catch(() => {});
      isRendering = false;
    }
  }

  // ================= 7. PHÒNG THU GIỌNG NÓI 2 CHIỀU (STT <-> TTS) =================
  let recognition = null;
  let isListening = false;

  function toggleMicDictation(targetId, btnEl) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Trình duyệt này chưa hỗ trợ Micro trực tiếp. Hãy dùng Google Chrome hoặc Microsoft Edge!');
      return;
    }
    if (isListening && recognition) { recognition.stop(); return; }
    recognition = new SpeechRec();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
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
    if (file.size > 12 * 1024 * 1024) { alert('File để bóc băng nên nhỏ hơn 12MB.'); return; }
    const st = document.getElementById('ac-stt-status');
    st.textContent = '⏳ AI đang nghe và chuyển giọng đọc sang văn bản...';
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
        st.innerHTML = `<span style="color:#4ade80;">✓ Đã chuyển sang chữ thành công!</span>`;
      } catch (e) {
        st.innerHTML = `<span style="color:#f87171;">⚠️ ${e.message}</span>`;
      }
    };
    reader.readAsDataURL(file);
  }

  async function runTextToSpeech() {
    const text = (document.getElementById('ac-tts-text').value || '').trim();
    const voice = document.getElementById('ac-tts-voice').value;
    const speed = parseFloat(document.getElementById('ac-tts-speed').value || '1.0');
    const st = document.getElementById('ac-tts-status');
    const playerWrap = document.getElementById('ac-tts-player');
    if (!text) { alert('Chưa có văn bản cần đọc!'); return; }

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
          <a href="${lastTtsBlobUrl}" download="autocut-voice.${ext}" style="display:inline-block; margin-top:4px; font-size:12px; color:#38bdf8; font-weight:600; text-decoration:none;">⬇️ Tải file giọng đọc (.${ext})</a>
        `;
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.rate = speed;
      const vi = window.speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().includes('vi'));
      if (vi) u.voice = vi;
      window.speechSynthesis.speak(u);
      st.innerHTML = '<span style="color:#4ade80;">🔊 Đang phát giọng đọc tiếng Việt trực tiếp!</span>';
    } catch (e) {
      st.innerHTML = `<span style="color:#f87171;">⚠️ ${e.message}</span>`;
    }
  }

  // ================= 8. DỰNG GIAO DIỆN NGĂN KÉO PRO STUDIO v4.0 =================
  function mountProStudio() {
    if (document.getElementById('ac-pro-fab')) return;

    const style = document.createElement('style');
    style.textContent = `
      #ac-pro-fab {
        position: fixed; left: 16px; bottom: 16px; z-index: 9995;
        background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff;
        border: 1px solid rgba(255,255,255,0.22); border-radius: 999px;
        padding: 11px 18px; font-size: 13px; font-weight: 700; cursor: pointer;
        box-shadow: 0 10px 28px rgba(124, 58, 237, 0.55); font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer {
        position: fixed; top: 0; right: -490px; width: 470px; max-width: 96vw; height: 100vh;
        background: #0b1120; border-left: 1px solid #26324d; z-index: 9998;
        box-shadow: -16px 0 48px rgba(0,0,0,0.75); transition: right 0.25s ease;
        display: flex; flex-direction: column; color: #f1f5f9; font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer.open { right: 0; }
      .acp-head { padding: 15px 16px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
      .acp-tabs { display: flex; border-bottom: 1px solid #1e293b; background: #0f172a; }
      .acp-tab { flex: 1; padding: 10px; border: none; background: transparent; color: #94a3b8; font-size: 12px; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; }
      .acp-tab.active { color: #fbbf24; border-bottom-color: #fbbf24; background: #131c31; }
      .acp-body { padding: 14px 16px; overflow-y: auto; flex: 1; }
      .acp-sec { background: #131b2e; border: 1px solid #23304d; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
      .acp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; display: block; }
      .acp-sel, .acp-ta { width: 100%; box-sizing: border-box; background: #0a0f1d; border: 1px solid #2b3856; color: #f8fafc; border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none; }
      .acp-ta { min-height: 62px; resize: vertical; }
      .acp-btn { border: none; border-radius: 8px; padding: 9px 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: #fff; background: #334155; }
      .acp-btn-main { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      .acp-btn-green { background: #10b981; color: #052e16; }
      .acp-skill { display: inline-block; padding: 4px 8px; margin: 2px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #2e3b5b; background: #0b1120; color: #cbd5e1; }
      .acp-skill.on { background: #312e81; border-color: #a78bfa; color: #fff; }
      .acp-drop { border: 2px dashed #4f46e5; border-radius: 10px; padding: 14px; text-align: center; cursor: pointer; background: #0e1529; transition: background 0.15s; }
      .acp-drop:hover { background: #161f3a; }
    `;
    document.head.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'ac-pro-fab';
    fab.textContent = '🚀 AI Tự Dựng Video Thô (Pro v4)';
    document.body.appendChild(fab);

    const drawer = document.createElement('div');
    drawer.id = 'ac-pro-drawer';
    drawer.innerHTML = `
      <div class="acp-head">
        <div>
          <div style="font-size:15px; font-weight:800; color:#fbbf24;">🚀 AUTOCUT PRO EDITOR v4.0</div>
          <div style="font-size:11px; color:#94a3b8;">Không cần Video Mẫu • Tự tìm nguồn Viral • 10 Pro Skills</div>
        </div>
        <button class="acp-btn" id="ac-pro-close">✕</button>
      </div>
      <div class="acp-tabs">
        <button class="acp-tab active" data-t="auto">✨ Tự Dựng 1 Video Thô</button>
        <button class="acp-tab" data-t="voice">🎙️ Phòng Thu Giọng Nói</button>
      </div>
      <div class="acp-body">
        <div id="ac-tab-auto">
          <div class="acp-sec" style="border-color:#4c1d95;">
            <div id="ac-behavior-summary" style="font-size:12px; color:#ddd6fe; line-height:1.45;"></div>
          </div>

          <div class="acp-sec">
            <label class="acp-label">1. Nạp 1 Video Thô Duy Nhất (Không cần Video Mẫu)</label>
            <input type="file" id="ac-raw-input" accept="video/*" style="display:none;" />
            <div class="acp-drop" id="ac-raw-drop">
              <div style="font-size:13px; font-weight:700; color:#a5b4fc;">📂 Bấm chọn Video Thô từ máy tính</div>
              <div id="ac-raw-filename" style="font-size:11px; color:#94a3b8; margin-top:4px;">Hoặc tự nhận video bạn đã nạp sẵn ngoài màn hình chính</div>
            </div>
          </div>

          <div class="acp-sec">
            <label class="acp-label">2. Bộ 10 Skill Editor Chuyên Nghiệp (Bấm bật/tắt)</label>
            <div id="ac-skills-wrap">
              ${PRO_SKILLS.map((s) => `<span class="acp-skill on" data-sid="${s.id}" title="${s.desc}">${s.name}</span>`).join('')}
            </div>
            <label style="display:flex; align-items:center; gap:6px; margin-top:8px; font-size:12px; color:#cbd5e1; cursor:pointer;">
              <input type="checkbox" id="ac-enable-search" checked />
              🌐 Bật Google Search thời gian thực để tìm mẫu Viral mới nhất
            </label>
          </div>

          <div class="acp-sec">
            <label class="acp-label">3. Ghi chú thêm (Không bắt buộc — Có thể nói bằng Mic)</label>
            <textarea class="acp-ta" id="ac-auto-hint" placeholder="Để trống nếu muốn AI tự lo 100%, hoặc gõ ngắn gọn: 'Làm clip chốt đơn 15 giây', 'Giữ nguyên màu bạc xi bạch kim'..."></textarea>
            <div style="display:flex; gap:8px; margin-top:8px;">
              <button class="acp-btn" id="ac-mic-hint" data-default-label="🎙️ Nói yêu cầu">🎙️ Nói yêu cầu</button>
              <button class="acp-btn acp-btn-main" id="ac-btn-auto-scan" style="flex:1;">🚀 Quét Toàn Video & Tự Edit Pro</button>
            </div>
            <div id="ac-auto-status" style="font-size:12px; margin-top:8px;"></div>
            <div id="ac-auto-result"></div>
          </div>
        </div>

        <div id="ac-tab-voice" style="display:none;">
          <div class="acp-sec">
            <label class="acp-label">Chuyển Giọng Đọc Sang Văn Bản (STT)</label>
            <input type="file" id="ac-stt-file" accept="audio/*,video/*" style="display:none;" />
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="acp-btn" id="ac-btn-stt-file">📂 Tách lời từ File Video/Audio</button>
              <button class="acp-btn" id="ac-mic-tts" data-default-label="🎙️ Nói trực tiếp → Chữ">🎙️ Nói trực tiếp → Chữ</button>
            </div>
            <div id="ac-stt-status" style="font-size:12px; margin-top:6px;"></div>
          </div>
          <div class="acp-sec">
            <label class="acp-label">Chuyển Văn Bản Thành Giọng Đọc AI Studio (TTS)</label>
            <textarea class="acp-ta" id="ac-tts-text" style="min-height:110px;" placeholder="Lời bình AI tự tạo sau khi quét video hoặc văn bản bạn nhập sẽ ở đây..."></textarea>
            <div style="display:flex; gap:6px; margin-top:8px;">
              <select class="acp-sel" id="ac-tts-voice" style="flex:1;">
                <option value="nova">Giọng Nữ Truyền Cảm</option>
                <option value="alloy">Giọng Tự Nhiên</option>
                <option value="onyx">Giọng Nam Trầm Ấm</option>
                <option value="shimmer">Giọng Nữ Năng Động</option>
              </select>
              <select class="acp-sel" id="ac-tts-speed" style="width:80px;">
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

    drawer.querySelectorAll('.acp-tab').forEach((tab) => {
      tab.onclick = () => {
        drawer.querySelectorAll('.acp-tab').forEach((x) => x.classList.remove('active'));
        tab.classList.add('active');
        const t = tab.getAttribute('data-t');
        document.getElementById('ac-tab-auto').style.display = t === 'auto' ? 'block' : 'none';
        document.getElementById('ac-tab-voice').style.display = t === 'voice' ? 'block' : 'none';
      };
    });

    const rawDrop = document.getElementById('ac-raw-drop');
    const rawInp = document.getElementById('ac-raw-input');
    rawDrop.onclick = () => rawInp.click();
    rawInp.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (rawVideoUrl) URL.revokeObjectURL(rawVideoUrl);
      rawVideoFile = f;
      rawVideoUrl = URL.createObjectURL(f);
      document.getElementById('ac-raw-filename').innerHTML = `<span style="color:#4ade80; font-weight:700;">✓ Đã nạp: ${f.name} (${(f.size / 1048576).toFixed(1)} MB)</span>`;
    };

    drawer.querySelectorAll('#ac-skills-wrap .acp-skill').forEach((el) => {
      el.onclick = () => {
        const sid = el.getAttribute('data-sid');
        if (activeSkills.has(sid)) { activeSkills.delete(sid); el.classList.remove('on'); }
        else { activeSkills.add(sid); el.classList.add('on'); }
      };
    });

    document.getElementById('ac-btn-auto-scan').onclick = runAutonomousScanAndEdit;
    document.getElementById('ac-mic-hint').onclick = function () { toggleMicDictation('ac-auto-hint', this); };
    document.getElementById('ac-mic-tts').onclick = function () { toggleMicDictation('ac-tts-text', this); };
    document.getElementById('ac-btn-stt-file').onclick = () => document.getElementById('ac-stt-file').click();
    document.getElementById('ac-stt-file').onchange = (e) => transcribeAudioFile(e.target.files[0]);
    document.getElementById('ac-run-tts').onclick = runTextToSpeech;

    saveBehavior(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountProStudio);
  } else {
    mountProStudio();
  }
})();
