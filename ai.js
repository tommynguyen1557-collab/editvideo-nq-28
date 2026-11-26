/**
 * AutoCut Studio AI — UPGRADE MODULE (Phase 3): Reference Style Extractor & Real Multimodal AI
 * Self-mounting module: Injects Quick Presets & Reference Report Card into Step 2 panel.
 * Communicates strictly via frozen AuthCore & EditorCore public APIs.
 */
(function (window, document) {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  async function fetchTimed(url, opts = {}, ms = 15000) {
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

  // ===========================================================================
  // 1. PRESETS & SELF-MOUNTING AI UI ENHANCEMENTS
  // ===========================================================================
  const PRESETS = {
    jewelry: {
      label: '💎 Trang Sức / Bạc',
      prompt: 'Giữ nguyên màu bạc xi bạch kim sáng bóng tự nhiên, không ám vàng, tăng sắc nét chi tiết, chuyển cảnh fade mượt và viết phụ đề sang trọng.',
      ratio: '9:16', colorPreset: 'silver', speed: 1.0, autoZoom: true, transition: 'fade',
      textColor: '#ffffff', bgColor: '#27272a', sfxType: 'ding',
      subtitleLines: ['BẠC CAO CẤP XI BẠCH KIM ✨', 'SÁNG BÓNG NGUYÊN BẢN TỪNG GÓC CẠNH', 'CHẾ TÁC TINH XẢO ĐỘC BẢN']
    },
    tiktok: {
      label: '⚡ TikTok Viral',
      prompt: 'Dựng nhịp cắt nhanh theo video mẫu, mở đầu flash thu hút, tốc độ 1.1x năng động và tạo phụ đề hook giữ chân người xem.',
      ratio: '9:16', colorPreset: 'vivid', speed: 1.1, autoZoom: true, transition: 'flash',
      textColor: '#ffffff', bgColor: '#db2777', sfxType: 'whoosh',
      subtitleLines: ['ĐỪNG LƯỚT QUA VIDEO NÀY 🔥', 'BÍ MẬT ĐẰNG SAU THÀNH PHẨM', 'XEM NGAY ĐẾN GIÂY CUỐI 👇']
    },
    sales: {
      label: '🛍️ Chốt Đơn / Sale',
      prompt: 'Dựng video bán hàng chốt đơn tốc độ nhanh, tăng sáng rõ sản phẩm, chữ vàng nổi bật và chèn tiếng pop nhấn điểm.',
      ratio: '9:16', colorPreset: 'vivid', speed: 1.1, autoZoom: true, transition: 'flash',
      textColor: '#facc15', bgColor: '#b91c1c', sfxType: 'pop',
      subtitleLines: ['ƯU ĐÃI ĐỘC QUYỀN HÔM NAY ⚡', 'CHẤT LƯỢNG THẬT — GIÁ TẬN XƯỞNG', 'ĐẶT HÀNG NGAY KẺO HẾT 🛒']
    },
    cinematic: {
      label: '🎬 Cinematic 16:9',
      prompt: 'Khung ngang 16:9 điện ảnh, tông màu phim ấm sâu lắng, tốc độ chậm mượt 0.85x và chuyển cảnh fade êm ái.',
      ratio: '16:9', colorPreset: 'cinematic', speed: 0.85, autoZoom: true, transition: 'fade',
      textColor: '#f4f4f5', bgColor: '#18181b', sfxType: 'bass',
      subtitleLines: ['CINEMATIC STORYTELLING', 'MỖI KHOẢNH KHẮC LÀ MỘT TÁC PHẨM', 'STUDIO EDITION']
    },
    food: {
      label: '🍜 Review Ẩm Thực',
      prompt: 'Tăng rực rỡ màu món ăn hấp dẫn, nhịp cắt dứt khoát và viết phụ đề kích thích vị giác.',
      ratio: '9:16', colorPreset: 'vivid', speed: 1.05, autoZoom: true, transition: 'none',
      textColor: '#facc15', bgColor: '#c2410c', sfxType: 'pop',
      subtitleLines: ['NGON KHÓ CƯỠNG TỪ MIẾNG ĐẦU 🤤', 'HƯƠNG VỊ ĐẬM ĐÀ KHÓ QUÊN', 'LƯU LẠI ĐI THỬ NGAY NHÉ!']
    },
    fashion: {
      label: '👗 Thời Trang OOTD',
      prompt: 'Dựng lookbook thời trang sáng trong trẻo, flash mở đầu ấn tượng, nhịp chuyển cảnh theo video mẫu.',
      ratio: '9:16', colorPreset: 'silver', speed: 1.0, autoZoom: true, transition: 'flash',
      textColor: '#ffffff', bgColor: '#be185d', sfxType: 'whoosh',
      subtitleLines: ['OUTFIT CHUẨN GU MÙA MỚI ✨', 'TÔN DÁNG THANH LỊCH MỌI GÓC NHÌN', 'SẴN HÀNG FULL SIZE']
    }
  };

  let lastPresetKey = 'jewelry';
  let refAnalysis = null; // Stores extracted profile of the uploaded Reference Video
  let isAnalyzingRef = false;

  function mountAIUI() {
    const promptEl = document.getElementById('aiPromptInput');
    if (!promptEl || document.getElementById('aiPresetBar')) return;

    promptEl.placeholder = 'Mô tả ý tưởng tự nhiên (VD: "Cắt theo nhịp video mẫu, giữ màu bạc nguyên bản, thêm phụ đề: \\"Nhẫn bạc xi bạch kim cao cấp\\"")...';

    // Inject Reference Style Report Card + Quick Presets right above the prompt box
    const presetHtml = Object.entries(PRESETS).map(([key, p]) =>
      `<button type="button" onclick="AICore.applyPreset('${key}')" class="text-left px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-[10px] font-semibold text-zinc-200 transition truncate">${p.label}</button>`
    ).join('');

    promptEl.insertAdjacentHTML('beforebegin', `
      <div id="refAnalysisCard" class="hidden rounded-lg bg-pink-950/25 border border-pink-500/35 p-2.5 text-[10px] space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-pink-300"><i class="fa-solid fa-clapperboard mr-1"></i>Hồ Sơ Video Mẫu Đã Học:</span>
          <button type="button" onclick="AICore.clearRefVideo()" class="text-zinc-400 hover:text-red-400">Bỏ mẫu</button>
        </div>
        <div id="refAnalysisSummary" class="text-zinc-300 leading-relaxed"></div>
      </div>
      <div id="aiPresetBar" class="space-y-1">
        <div class="flex items-center justify-between text-[10px] text-zinc-400">
          <span>Mẫu kịch bản nhanh:</span>
          <label class="flex items-center gap-1 cursor-pointer text-pink-300">
            <input type="checkbox" id="aiMatchRefCuts" checked class="accent-pink-500" />
            <span>Cắt & khớp màu theo Video Mẫu</span>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-1">${presetHtml}</div>
      </div>
    `);
  }

  // ===========================================================================
  // 2. OFFSCREEN VIDEO PIXEL & SCENE CUT ANALYZER (REAL ANALYSIS)
  // ===========================================================================
  function detectAspectRatio(w, h) {
    if (!w || !h) return '9:16';
    const r = w / h;
    if (r < 0.72) return '9:16';
    if (r >= 0.72 && r <= 0.9) return '4:5';
    if (r > 0.9 && r <= 1.15) return '1:1';
    return '16:9';
  }

  function computeFrameStats(imageData) {
    const data = imageData.data;
    const n = data.length / 4;
    let rSum = 0, gSum = 0, bSum = 0, lumaSum = 0, satSum = 0;
    const lumas = new Float32Array(n);

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      lumas[p] = luma;
      rSum += r; gSum += g; bSum += b;
      lumaSum += luma;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      satSum += maxC > 0 ? ((maxC - minC) / maxC) * 100 : 0;
    }

    const avgLuma = lumaSum / n;
    let varSum = 0;
    for (let p = 0; p < n; p++) {
      const d = lumas[p] - avgLuma;
      varSum += d * d;
    }

    return {
      luma: avgLuma,
      contrast: Math.sqrt(varSum / n), // Luminance standard deviation
      saturation: satSum / n,
      warmth: (rSum - bSum) / n, // Positive = warm, negative = cool
      pixels: data
    };
  }

  function computeFrameMAD(prevData, currData) {
    if (!prevData || !currData || prevData.length !== currData.length) return 0;
    let diff = 0;
    const n = prevData.length / 4;
    for (let i = 0; i < prevData.length; i += 4) {
      diff += (Math.abs(prevData[i] - currData[i]) + Math.abs(prevData[i + 1] - currData[i + 1]) + Math.abs(prevData[i + 2] - currData[i + 2])) / 3;
    }
    return diff / n;
  }

  async function analyzeVideoUrl(url, options = {}) {
    const { detectCuts = true, maxSamples = 16, onProgress = null } = options;

    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.src = url;

      const cleanup = () => {
        v.pause();
        v.removeAttribute('src');
        v.load();
      };

      v.onerror = () => { cleanup(); reject(new Error('Không thể giải mã file video này')); };

      v.onloadedmetadata = async () => {
        try {
          const duration = Math.max(0.5, v.duration || 5);
          const vw = v.videoWidth || 720;
          const vh = v.videoHeight || 1280;
          const aspectRatio = detectAspectRatio(vw, vh);

          const tinyC = document.createElement('canvas');
          tinyC.width = 64; tinyC.height = 64;
          const tinyCtx = tinyC.getContext('2d', { willReadFrequently: true });

          const kfC = document.createElement('canvas');
          kfC.width = 320;
          kfC.height = Math.max(180, Math.round(320 * (vh / vw)));
          const kfCtx = kfC.getContext('2d');

          const sampleCount = detectCuts ? Math.min(maxSamples, Math.max(6, Math.ceil(duration * 1.5))) : 3;
          const keyframeIndices = new Set([
            Math.floor(sampleCount * 0.15),
            Math.floor(sampleCount * 0.5),
            Math.min(sampleCount - 1, Math.floor(sampleCount * 0.85))
          ]);

          const frameStats = [];
          const diffs = [];
          const keyframes = [];
          let prevPixels = null;

          for (let i = 0; i < sampleCount; i++) {
            const t = clamp(((i + 0.5) / sampleCount) * duration, 0.08, Math.max(0.1, duration - 0.08));
            await new Promise((resSeek) => {
              let done = false;
              const finish = () => {
                if (done) return;
                done = true;
                v.removeEventListener('seeked', finish);
                resSeek();
              };
              v.addEventListener('seeked', finish);
              v.currentTime = t;
              setTimeout(finish, 900);
            });

            if (v.readyState >= 2) {
              tinyCtx.drawImage(v, 0, 0, 64, 64);
              const imgData = tinyCtx.getImageData(0, 0, 64, 64);
              const st = computeFrameStats(imgData);
              frameStats.push({ time: t, luma: st.luma, contrast: st.contrast, saturation: st.saturation, warmth: st.warmth });

              if (prevPixels) {
                diffs.push({ time: t, mad: computeFrameMAD(prevPixels, st.pixels) });
              }
              prevPixels = new Uint8ClampedArray(st.pixels);

              if (keyframeIndices.has(i)) {
                kfCtx.drawImage(v, 0, 0, kfC.width, kfC.height);
                const b64 = kfC.toDataURL('image/jpeg', 0.65).split(',')[1];
                if (b64 && b64.length > 200) keyframes.push(b64);
              }
            }
            if (onProgress) onProgress(Math.round(((i + 1) / sampleCount) * 100));
          }

          cleanup();

          const avg = (arr, fn) => arr.length ? arr.reduce((s, x) => s + fn(x), 0) / arr.length : 0;
          const avgLuma = avg(frameStats, (x) => x.luma) || 120;
          const avgContrast = avg(frameStats, (x) => x.contrast) || 48;
          const avgSat = avg(frameStats, (x) => x.saturation) || 32;
          const avgWarmth = avg(frameStats, (x) => x.warmth);

          // Real Scene Cut Detection using adaptive MAD threshold
          const cutTimes = [];
          if (detectCuts && diffs.length >= 2) {
            const avgDiff = avg(diffs, (d) => d.mad);
            const cutThreshold = Math.max(22, avgDiff * 1.45);
            let lastCut = 0;
            diffs.forEach((d) => {
              if (d.mad >= cutThreshold && d.time - lastCut >= 0.7 && d.time < duration - 0.5) {
                cutTimes.push(Number(d.time.toFixed(2)));
                lastCut = d.time;
              }
            });
          }

          const avgCutInterval = cutTimes.length > 0 ? duration / (cutTimes.length + 1) : duration;
          const paceLabel = avgCutInterval <= 2.2 ? 'Nhanh (Viral)' : avgCutInterval <= 4.5 ? 'Trung bình (Mượt)' : 'Chậm (Điện ảnh)';
          const toneLabel = avgWarmth > 14 ? 'Ấm áp' : avgWarmth < -10 ? 'Lạnh / Sắc nét' : 'Trung tính / Tự nhiên';

          resolve({
            width: vw, height: vh, duration, aspectRatio,
            avgLuma: Math.round(avgLuma),
            avgContrast: Math.round(avgContrast),
            avgSat: Math.round(avgSat),
            avgWarmth: Math.round(avgWarmth),
            cutTimes, avgCutInterval: Number(avgCutInterval.toFixed(1)),
            paceLabel, toneLabel, keyframes
          });
        } catch (err) {
          cleanup();
          reject(err);
        }
      };
    });
  }

  async function analyzeRawTimeline() {
    const edState = window.EditorCore.getState();
    const firstReal = edState.clips.find((c) => !c.isDemo && c.url);

    if (firstReal) {
      return analyzeVideoUrl(firstReal.url, { detectCuts: false, maxSamples: 3 });
    }

    // Fallback for Demo mode: sample directly from canvas
    const c = document.createElement('canvas');
    c.width = 320; c.height = 568;
    const cctx = c.getContext('2d', { willReadFrequently: true });
    window.EditorCore.drawFrame(cctx, c.width, c.height, true);
    const b64 = c.toDataURL('image/jpeg', 0.65).split(',')[1];
    const tiny = document.createElement('canvas'); tiny.width = 64; tiny.height = 64;
    const tctx = tiny.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(c, 0, 0, 64, 64);
    const st = computeFrameStats(tctx.getImageData(0, 0, 64, 64));

    return {
      width: 1080, height: 1920, duration: edState.duration, aspectRatio: edState.aspectRatio,
      avgLuma: Math.round(st.luma), avgContrast: Math.round(st.contrast),
      avgSat: Math.round(st.saturation), avgWarmth: Math.round(st.warmth),
      cutTimes: [], avgCutInterval: edState.duration, paceLabel: 'Demo', toneLabel: 'Trung tính',
      keyframes: b64 ? [b64] : []
    };
  }

  // ===========================================================================
  // 3. REFERENCE VIDEO UPLOAD HANDLER
  // ===========================================================================
  async function handleRefVideoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (isAnalyzingRef) return;

    const nameEl = document.getElementById('refVideoName');
    const card = document.getElementById('refAnalysisCard');
    const summary = document.getElementById('refAnalysisSummary');

    if (nameEl) nameEl.innerText = file.name;
    if (card) card.classList.remove('hidden');
    if (summary) summary.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1 text-pink-400"></i>Đang quét nhịp cắt cảnh & bảng màu Video Mẫu... <b id="refScanPct">0%</b>';

    isAnalyzingRef = true;
    const url = URL.createObjectURL(file);

    try {
      const result = await analyzeVideoUrl(url, {
        detectCuts: true,
        maxSamples: 16,
        onProgress: (p) => {
          const pctEl = document.getElementById('refScanPct');
          if (pctEl) pctEl.innerText = p + '%';
        }
      });
      refAnalysis = { ...result, fileName: file.name };

      const cutsText = result.cutTimes.length
        ? `${result.cutTimes.length} điểm cắt (${result.cutTimes.slice(0, 5).map((t) => t + 's').join(', ')}${result.cutTimes.length > 5 ? '...' : ''})`
        : '1 cảnh liền mạch (không cắt nhanh)';

      if (summary) {
        summary.innerHTML = `
          <div>• <b>Khung hình:</b> ${result.aspectRatio} (${result.width}×${result.height}) • <b>Dài:</b> ${result.duration.toFixed(1)}s</div>
          <div>• <b>Nhịp dựng:</b> ${result.paceLabel} — ${cutsText}</div>
          <div>• <b>Ánh sáng & Màu:</b> Sáng ${result.avgLuma}/255 • Tương phản ${result.avgContrast} • Tông ${result.toneLabel}</div>
        `;
      }

      // Immediately match canvas aspect ratio to Reference Video
      if (window.EditorCore && window.EditorCore.setAspectRatio) {
        window.EditorCore.setAspectRatio(result.aspectRatio);
      }
    } catch (err) {
      refAnalysis = null;
      if (summary) summary.innerHTML = `<span class="text-red-400">Không đọc được Video Mẫu: ${escapeHtml(err.message)}</span>`;
    } finally {
      isAnalyzingRef = false;
      URL.revokeObjectURL(url);
      e.target.value = '';
    }
  }

  function clearRefVideo() {
    refAnalysis = null;
    const nameEl = document.getElementById('refVideoName');
    const card = document.getElementById('refAnalysisCard');
    if (nameEl) nameEl.innerText = 'Video Mẫu';
    if (card) card.classList.add('hidden');
  }

  function applyPreset(key) {
    if (!PRESETS[key]) return;
    lastPresetKey = key;
    const promptEl = document.getElementById('aiPromptInput');
    if (promptEl) promptEl.value = PRESETS[key].prompt;
  }

  // ===========================================================================
  // 4. VIETNAMESE NATURAL INTENT PARSER + REFERENCE STYLE MATCHING
  // ===========================================================================
  function parseVietnameseIntent(promptText, rawAnalysis, refData, matchRef) {
    const text = (promptText || '').trim();
    const lower = text.toLowerCase();
    const basePreset = PRESETS[lastPresetKey] || PRESETS.jewelry;

    // 1. Aspect Ratio (Explicit prompt > Reference Video > Preset)
    let aspectRatio = (matchRef && refData) ? refData.aspectRatio : basePreset.ratio;
    if (lower.includes('16:9') || lower.includes('ngang') || lower.includes('youtube')) aspectRatio = '16:9';
    else if (lower.includes('1:1') || lower.includes('vuông')) aspectRatio = '1:1';
    else if (lower.includes('4:5')) aspectRatio = '4:5';
    else if (lower.includes('9:16') || lower.includes('dọc') || lower.includes('tiktok') || lower.includes('reels')) aspectRatio = '9:16';

    // 2. Color Grading (Protect original silver/metallic color if requested; otherwise match Reference Video histogram)
    const isSilverProtect = /(bạc|xi bạch kim|bạch kim|không ám vàng|giữ màu gốc|trang sức|nhẫn|lắc tay)/i.test(lower);
    let filters = { brightness: 100, contrast: 100, saturate: 100 };
    let colorNote = '';

    if (isSilverProtect) {
      // Crisp bright silver without yellow tint or oversaturation
      const brightBoost = rawAnalysis.avgLuma < 95 ? 114 : 107;
      filters = { brightness: brightBoost, contrast: 113, saturate: 95 };
      colorNote = 'Khóa màu bạc xi bạch kim nguyên bản (trung tính, không ám vàng)';
    } else if (matchRef && refData) {
      // Real histogram matching between Reference Video & Raw Video
      const lumaDelta = (refData.avgLuma - rawAnalysis.avgLuma) * 0.55;
      const contrastDelta = (refData.avgContrast - rawAnalysis.avgContrast) * 0.6;
      const satDelta = (refData.avgSat - rawAnalysis.avgSat) * 0.9;
      filters = {
        brightness: clamp(Math.round(100 + lumaDelta), 78, 132),
        contrast: clamp(Math.round(100 + contrastDelta), 85, 132),
        saturate: clamp(Math.round(100 + satDelta), 70, 145)
      };
      colorNote = `Khớp màu Video Mẫu (Sáng ${filters.brightness}%, Tương phản ${filters.contrast}%, Bão hòa ${filters.saturate}%)`;
    } else if (lower.includes('điện ảnh') || lower.includes('cinematic') || lower.includes('trầm')) {
      filters = { brightness: 95, contrast: 122, saturate: 88 };
      colorNote = 'Tông điện ảnh sâu lắng';
    } else if (lower.includes('rực rỡ') || lower.includes('tươi') || lower.includes('món ăn')) {
      filters = { brightness: 106, contrast: 115, saturate: 134 };
      colorNote = 'Tông rực rỡ nổi bật';
    } else {
      // Auto-compensate dark raw videos
      filters = rawAnalysis.avgLuma < 85
        ? { brightness: 118, contrast: 110, saturate: 104 }
        : { brightness: 104, contrast: 108, saturate: 104 };
      colorNote = rawAnalysis.avgLuma < 85 ? 'Tự động bù sáng video quay tối (+18%)' : 'Cân bằng sáng nét tự nhiên';
    }

    // Explicit user brightness tweaks
    if (lower.includes('tăng sáng') || lower.includes('sáng hơn') || lower.includes('sáng thêm')) {
      filters.brightness = clamp(filters.brightness + 14, 100, 145);
    } else if (lower.includes('giảm sáng') || lower.includes('tối hơn')) {
      filters.brightness = clamp(filters.brightness - 14, 65, 100);
    }

    // 3. Speed & Pacing
    let speed = basePreset.speed;
    if (matchRef && refData) {
      speed = refData.avgCutInterval <= 2.0 ? 1.1 : refData.avgCutInterval >= 5.0 ? 0.9 : 1.0;
    }
    if (lower.includes('chậm') || lower.includes('slow') || lower.includes('êm')) speed = 0.85;
    else if (lower.includes('nhanh') || lower.includes('dồn dập') || lower.includes('viral')) speed = 1.15;

    // 4. Cut Rhythm Mapping (Map Reference Video cuts onto Raw Video timeline)
    let cutTimes = [];
    const allowCuts = !/(không cắt|giữ nguyên đoạn|đừng cắt)/i.test(lower);
    if (allowCuts && matchRef && refData && refData.cutTimes.length > 0 && rawAnalysis.duration > 2) {
      const scale = rawAnalysis.duration / Math.max(0.5, refData.duration);
      cutTimes = refData.cutTimes
        .map((t) => Number((t * scale).toFixed(2)))
        .filter((t) => t > 0.4 && t < rawAnalysis.duration - 0.4);
    } else if (allowCuts && /(cắt nhanh|tách đoạn|cắt theo nhịp|nhiều cảnh)/i.test(lower) && rawAnalysis.duration >= 4) {
      const step = Math.max(1.8, rawAnalysis.duration / 4);
      for (let t = step; t < rawAnalysis.duration - 0.6; t += step) {
        cutTimes.push(Number(t.toFixed(2)));
      }
    }

    // 5. Transition & Zoom
    let transition = basePreset.transition;
    if (lower.includes('flash') || lower.includes('chớp')) transition = 'flash';
    else if (lower.includes('fade') || lower.includes('mờ')) transition = 'fade';
    else if (lower.includes('không chuyển cảnh')) transition = 'none';

    const autoZoom = !/(không zoom|đừng zoom|tắt zoom)/i.test(lower);

    // 6. Smart Subtitle Generation
    let subtitleLines = [...basePreset.subtitleLines];
    // Extract quoted text if user gave explicit captions e.g. "Nhẫn bạc đẹp"
    const quoted = [...text.matchAll(/["“”'‘’]([^"“”'‘’]{3,80})["“”'‘’]/g)].map((m) => m[1].trim().toUpperCase());
    if (quoted.length > 0) {
      subtitleLines = quoted.slice(0, 5);
    } else if (text.length > 6 && !Object.values(PRESETS).some((p) => p.prompt === text)) {
      // Remove technical command keywords to keep only the core content idea
      const cleaned = text
        .replace(/(cắt theo nhịp video mẫu|giữ màu bạc nguyên bản|không ám vàng|tăng sáng|chữ vàng|chữ trắng|khung ngang|khung dọc|thêm fade|thêm flash|16:9|9:16)/gi, '')
        .split(/[,.!?;:\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 4);
      if (cleaned.length >= 1) {
        subtitleLines = cleaned.slice(0, 4).map((s) => s.toUpperCase());
      }
    }

    let textColor = basePreset.textColor;
    let bgColor = basePreset.bgColor;
    if (lower.includes('chữ vàng') || lower.includes('màu vàng')) textColor = '#facc15';
    else if (lower.includes('chữ trắng')) textColor = '#ffffff';
    if (lower.includes('nền đen')) bgColor = '#18181b';
    else if (lower.includes('nền đỏ')) bgColor = '#b91c1c';
    else if (lower.includes('nền hồng')) bgColor = '#db2777';

    // 7. Beat-Synced SFX aligned to actual cut timestamps
    const sfxType = isSilverProtect ? 'ding' : (lower.includes('bass') ? 'bass' : basePreset.sfxType);
    const sfxEvents = [{ time: 0.2, type: sfxType, label: sfxType.toUpperCase() }];
    cutTimes.slice(0, 4).forEach((ct, i) => {
      const tType = i % 2 === 0 ? 'whoosh' : 'pop';
      sfxEvents.push({ time: Number(ct.toFixed(1)), type: tType, label: tType.toUpperCase() });
    });

    return {
      source: 'Phân tích cục bộ (Reference + Intent)',
      sceneSummary: refData && matchRef
        ? `Đã khớp phong cách Video Mẫu "${refData.fileName}" (${refData.paceLabel}, ${refData.toneLabel}) lên Video Thô (${rawAnalysis.duration.toFixed(1)}s).`
        : `Đã phân tích ánh sáng Video Thô (${rawAnalysis.avgLuma}/255) và diễn giải yêu cầu của bạn.`,
      editStrategy: `${colorNote}${cutTimes.length ? ` • Tự động tách ${cutTimes.length} điểm cắt khớp nhịp` : ''} • Tốc độ ${speed.toFixed(2)}x.`,
      aspectRatio, filters, speed, autoZoom, transition,
      subtitleLines, textColor, bgColor, cutTimes, sfxEvents
    };
  }

  // ===========================================================================
  // 5. REAL MULTIMODAL AI CALLER (PROXY WORKER OR DIRECT GEMINI API)
  // ===========================================================================
  async function callExternalMultimodalAI(aiConfig, promptText, rawData, refData) {
    const refDesc = refData
      ? `VIDEO MẪU: tỷ lệ ${refData.aspectRatio}, dài ${refData.duration.toFixed(1)}s, nhịp ${refData.paceLabel} (${refData.cutTimes.length} điểm cắt tại ${refData.cutTimes.join('s, ')}s), độ sáng ${refData.avgLuma}/255, tông ${refData.toneLabel}. (${refData.keyframes.length} ảnh đầu tiên đính kèm là Video Mẫu).`
      : 'Không có Video Mẫu.';

    const rawDesc = `VIDEO THÔ: tỷ lệ ${rawData.aspectRatio}, dài ${rawData.duration.toFixed(1)}s, độ sáng ${rawData.avgLuma}/255, tương phản ${rawData.avgContrast}, bão hòa ${rawData.avgSat}. (${rawData.keyframes.length} ảnh tiếp theo đính kèm là Video Thô).`;

    const instruction = `Bạn là đạo diễn dựng phim AI chuyên nghiệp. Hãy quan sát kỹ các khung hình đính kèm và đọc chính xác ý tưởng của người dùng: "${promptText || 'Dựng video chuyên nghiệp theo phong cách video mẫu'}".
${refDesc}
${rawDesc}
Lưu ý quan trọng: Nếu sản phẩm trong video là trang sức bạc / xi bạch kim, tuyệt đối giữ màu bạc trung tính sáng nét (saturate khoảng 92-98, không ám vàng).
Hãy trả về DUY NHẤT một đối tượng JSON hợp lệ (không bọc markdown) theo đúng cấu trúc:
{
  "sceneSummary": "Mô tả 1-2 câu chính xác những gì AI thấy trong Video Thô và điểm nổi bật học được từ Video Mẫu",
  "editStrategy": "Giải thích ngắn gọn cách AI cắt nhịp, chỉnh màu và viết phụ đề cho video này",
  "subtitleLines": ["Câu phụ đề 1 tiếng Việt tự nhiên đúng nội dung video", "Câu phụ đề 2 thu hút", "Câu phụ đề 3 kêu gọi hành động"],
  "aspectRatio": "9:16" hoặc "16:9" hoặc "1:1" hoặc "4:5",
  "filters": { "brightness": 108, "contrast": 112, "saturate": 100 },
  "speed": 1.0,
  "autoZoom": true,
  "transition": "fade" hoặc "flash" hoặc "none",
  "textColor": "#ffffff" hoặc "#facc15",
  "bgColor": "#4f46e5" hoặc "#27272a" hoặc "#db2777",
  "sfxType": "whoosh" hoặc "ding" hoặc "pop" hoặc "bass"
}`;

    // Mode A: Cloudflare Worker Proxy (Zero-Key for end users)
    if (aiConfig.provider === 'proxy' && aiConfig.proxyUrl) {
      const res = await fetchTimed(aiConfig.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          refFrames: refData ? refData.keyframes : [],
          rawFrames: rawData.keyframes
        })
      }, 20000);
      if (!res.ok) throw new Error('Proxy HTTP ' + res.status);
      const data = await res.json();
      const parsed = data.plan || (typeof data.text === 'string' ? JSON.parse((data.text.match(/\{[\s\S]*\}/) || [''])[0]) : null);
      if (!parsed) throw new Error('Proxy không trả về JSON hợp lệ');
      return { plan: parsed, engineName: 'AI Proxy Server' };
    }

    // Mode B: Direct Gemini Vision API
    if (aiConfig.provider === 'gemini' && aiConfig.apiKey) {
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
      const parts = [{ text: instruction }];
      if (refData) {
        refData.keyframes.forEach((b64) => parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } }));
      }
      rawData.keyframes.forEach((b64) => parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } }));

      let lastErr = '';
      for (const model of models) {
        try {
          const res = await fetchTimed(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
          }, 18000);
          const data = await res.json();
          if (!res.ok) {
            lastErr = data?.error?.message || ('HTTP ' + res.status);
            continue;
          }
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            return { plan: JSON.parse(match[0]), engineName: `Gemini Vision (${model})` };
          }
        } catch (err) {
          lastErr = err.message;
        }
      }
      throw new Error(lastErr || 'Không nhận được phản hồi từ Gemini');
    }

    return null;
  }

  // ===========================================================================
  // 6. MAIN AUTO-EDIT ORCHESTRATOR
  // ===========================================================================
  function setStatus(html) {
    const box = document.getElementById('aiStatusBox');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = html;
  }

  async function runAutoEdit() {
    const perms = window.AuthCore ? window.AuthCore.getPerms() : { autoEdit: true };
    if (!perms.autoEdit) {
      return alert('Tài khoản của bạn chưa được Chủ Sở Hữu bật quyền AI Dựng Tự Động!');
    }

    const edState = window.EditorCore.getState();
    if (!edState.hasVideo) {
      window.EditorCore.loadDemoVideo();
    }

    const promptText = (document.getElementById('aiPromptInput')?.value || '').trim();
    const matchRef = document.getElementById('aiMatchRefCuts') ? document.getElementById('aiMatchRefCuts').checked : true;
    const aiConfig = window.AuthCore ? window.AuthCore.getAiConfig() : { provider: 'builtin' };

    setStatus(`<div class="flex items-center gap-2"><i class="fa-solid fa-circle-notch fa-spin text-pink-400"></i><span>Bước 1/3: Đang quét khung hình & ánh sáng Video Thô...</span></div>`);

    try {
      const rawData = await analyzeRawTimeline();
      const basePlan = parseVietnameseIntent(promptText, rawData, refAnalysis, matchRef);

      let finalPlan = basePlan;
      let warningMsg = '';

      if ((aiConfig.provider === 'proxy' && aiConfig.proxyUrl) || (aiConfig.provider === 'gemini' && aiConfig.apiKey)) {
        setStatus(`<div class="flex items-center gap-2"><i class="fa-solid fa-brain fa-beat text-indigo-400"></i><span>Bước 2/3: Đang gửi Video Mẫu + Video Thô tới AI Đa Phương Thức...</span></div>`);
        try {
          const ext = await callExternalMultimodalAI(aiConfig, promptText, rawData, matchRef ? refAnalysis : null);
          if (ext && ext.plan) {
            const p = ext.plan;
            finalPlan = {
              ...basePlan,
              source: ext.engineName,
              sceneSummary: p.sceneSummary || basePlan.sceneSummary,
              editStrategy: p.editStrategy || basePlan.editStrategy,
              aspectRatio: p.aspectRatio || basePlan.aspectRatio,
              filters: p.filters || basePlan.filters,
              speed: typeof p.speed === 'number' ? p.speed : basePlan.speed,
              autoZoom: typeof p.autoZoom === 'boolean' ? p.autoZoom : basePlan.autoZoom,
              transition: p.transition || basePlan.transition,
              subtitleLines: Array.isArray(p.subtitleLines) && p.subtitleLines.length ? p.subtitleLines : basePlan.subtitleLines,
              textColor: p.textColor || basePlan.textColor,
              bgColor: p.bgColor || basePlan.bgColor
            };
          }
        } catch (apiErr) {
          warningMsg = `<div class="text-amber-300 text-[10px] mt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>AI ngoài phản hồi lỗi (${escapeHtml(apiErr.message)}) → Đã tự động dùng Bộ Phân Tích Video Mẫu cục bộ.</div>`;
        }
      }

      setStatus(`<div class="flex items-center gap-2"><i class="fa-solid fa-wand-magic-sparkles text-emerald-400"></i><span>Bước 3/3: Đang áp dụng cắt nhịp, màu sắc & phụ đề lên Timeline...</span></div>`);
      await new Promise((r) => setTimeout(r, 180));

      window.EditorCore.applyAIPlan(finalPlan);

      setStatus(`
        <div class="space-y-1.5 text-[10px] leading-relaxed">
          <div class="flex items-center justify-between text-emerald-400 font-bold">
            <span><i class="fa-solid fa-check-circle mr-1"></i>Hoàn tất dựng tự động!</span>
            <span class="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">${escapeHtml(finalPlan.source)}</span>
          </div>
          <div class="text-zinc-200"><b>Phân tích:</b> ${escapeHtml(finalPlan.sceneSummary)}</div>
          <div class="text-indigo-200"><b>Đã áp dụng:</b> ${escapeHtml(finalPlan.editStrategy)}</div>
          ${warningMsg}
        </div>
      `);
    } catch (err) {
      setStatus(`<div class="text-red-400 text-[11px]"><i class="fa-solid fa-circle-xmark mr-1"></i>Lỗi phân tích video: ${escapeHtml(err.message)}</div>`);
    }
  }

  // Expose Public API
  window.AICore = {
    handleRefVideoUpload,
    clearRefVideo,
    applyPreset,
    runAutoEdit,
    getRefAnalysis: () => refAnalysis
  };

  // Boot AICore
  mountAIUI();
})(window, document);
