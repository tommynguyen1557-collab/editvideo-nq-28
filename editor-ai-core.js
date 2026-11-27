/**
 * AutoCut Studio AI — Pro Editor Skill Core, Dual-AI Director, Voice Studio (STT <-> TTS) & Behavior Learning
 */
(function () {
  'use strict';

  const PROXY_URL = 'https://autocut-ai-proxy.tommynguyen1557.workers.dev';
  const FIREBASE_URL = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const BEHAVIOR_KEY = 'autocut_user_behavior_v1';

  // ================= 1. BỘ 6 SKILL EDITOR CHUYÊN NGHIỆP =================
  const PRO_SKILLS = [
    {
      id: 'hook_3s',
      name: '🔥 Hook 3s Giữ Chân',
      desc: 'Cắt mở đầu cực nhanh trong 3 giây đầu, tạo điểm nhấn thị giác và câu mở bài hút người xem'
    },
    {
      id: 'jump_cut',
      name: '✂️ Nhịp Cắt Jump-Cut',
      desc: 'Loại bỏ toàn bộ khoảng lặng thừa, đổi nhịp cắt mỗi 1.5–2.5 giây đúng chuẩn video ngắn'
    },
    {
      id: 'true_color',
      name: '🎨 Chỉnh Màu Chuẩn & Khử Ám',
      desc: 'Cân bằng sáng, độ tương phản điện ảnh, khử ám vàng để giữ đúng màu sắc nguyên bản của sản phẩm'
    },
    {
      id: 'viral_sub',
      name: '💬 Phụ Đề Viral (4-6 chữ)',
      desc: 'Tự động ngắt câu phụ đề ngắn gọn dễ đọc trên điện thoại, làm nổi bật từ khóa chốt đơn'
    },
    {
      id: 'aida_sales',
      name: '🎯 Kịch Bản Bán Hàng AIDA',
      desc: 'Sắp xếp mạch nội dung theo 4 nhịp: Gây chú ý → Nêu điểm đắt giá → Chứng minh → Kêu gọi hành động'
    },
    {
      id: 'audio_pro',
      name: '🎧 Cân Âm & Giọng Thuyết Minh',
      desc: 'Viết lời bình tự nhiên theo nhịp cắt, giảm nhạc nền khi có giọng đọc (Auto-Ducking)'
    }
  ];

  // ================= 2. BỘ LÕI ĐỌC HIỂU & HỌC HÀNH VI NGƯỜI DÙNG =================
  function loadBehavior() {
    try {
      const saved = JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || 'null');
      if (saved) return saved;
    } catch (_) {}
    return {
      totalActions: 0,
      preferredEngine: 'auto',
      avgColor: { brightness: 102, contrast: 108, saturate: 100 },
      avgSpeed: 1.0,
      skillUsage: {},
      recentCommands: [],
      learnedStyleNote: 'Chưa đủ dữ liệu, đang học thói quen của bạn...'
    };
  }

  let behavior = loadBehavior();
  let activeSkills = new Set(['hook_3s', 'jump_cut', 'true_color', 'viral_sub']);
  let lastPlan = null;
  let lastTtsBlobUrl = null;

  function saveBehavior(syncCloud = false) {
    // Tổng hợp phong cách quen thuộc của người dùng
    const topSkills = Object.entries(behavior.skillUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => (PRO_SKILLS.find((s) => s.id === id) || {}).name || id);

    behavior.learnedStyleNote = behavior.totalActions > 0
      ? `Thích màu (Sáng ${Math.round(behavior.avgColor.brightness)}%, Tương phản ${Math.round(behavior.avgColor.contrast)}%, Bão hòa ${Math.round(behavior.avgColor.saturate)}%), tốc độ ${behavior.avgSpeed.toFixed(2)}x${topSkills.length ? ', hay dùng: ' + topSkills.join(', ') : ''}.`
      : 'Đang theo dõi thao tác để tự học phong cách dựng của bạn.';

    localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(behavior));
    updateBehaviorUI();

    if (syncCloud) {
      fetch(`${FIREBASE_URL}/autocut_saas/behavior_profile.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...behavior, updatedAt: Date.now() })
      }).catch(() => {});
    }
  }

  function recordCommandBehavior(cmdText, skillsArr) {
    behavior.totalActions += 1;
    if (cmdText && cmdText.trim()) {
      behavior.recentCommands = [cmdText.trim(), ...behavior.recentCommands.filter((c) => c !== cmdText.trim())].slice(0, 8);
    }
    skillsArr.forEach((id) => {
      behavior.skillUsage[id] = (behavior.skillUsage[id] || 0) + 1;
    });
    saveBehavior(true);
  }

  // Tự động lắng nghe người dùng kéo thanh chỉnh màu / tốc độ trên giao diện gốc để học gu chỉnh sửa
  function attachBehaviorListeners() {
    document.addEventListener('change', (e) => {
      const el = e.target;
      if (!el || (el.type !== 'range' && el.type !== 'number')) return;
      if (el.closest('#ac-pro-drawer')) return;
      const ctx = ((el.id || '') + ' ' + (el.name || '') + ' ' + (el.parentElement ? el.parentElement.textContent : '')).toLowerCase();
      const val = parseFloat(el.value);
      if (isNaN(val)) return;

      let learned = false;
      if (ctx.includes('sáng') || ctx.includes('bright')) {
        behavior.avgColor.brightness = behavior.avgColor.brightness * 0.7 + val * 0.3;
        learned = true;
      } else if (ctx.includes('tương phản') || ctx.includes('contrast')) {
        behavior.avgColor.contrast = behavior.avgColor.contrast * 0.7 + val * 0.3;
        learned = true;
      } else if (ctx.includes('bão hòa') || ctx.includes('saturat')) {
        behavior.avgColor.saturate = behavior.avgColor.saturate * 0.7 + val * 0.3;
        learned = true;
      } else if (ctx.includes('tốc độ') || ctx.includes('speed')) {
        behavior.avgSpeed = behavior.avgSpeed * 0.7 + val * 0.3;
        learned = true;
      }
      if (learned) {
        behavior.totalActions += 1;
        saveBehavior(false);
      }
    }, true);
  }

  // ================= 3. THỰC THI LỆNH TRỰC TIẾP LÊN GIAO DIỆN VIDEO =================
  function setSliderValue(keywords, value) {
    if (value == null || isNaN(Number(value))) return;
    const inputs = Array.from(document.querySelectorAll('input[type="range"], input[type="number"]'));
    inputs.forEach((input) => {
      if (input.closest('#ac-pro-drawer')) return;
      const ctx = ((input.id || '') + ' ' + (input.name || '') + ' ' + (input.parentElement ? input.parentElement.textContent : '')).toLowerCase();
      if (keywords.some((k) => ctx.includes(k))) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  function applyPlanToEditor(plan) {
    if (!plan) return;
    if (plan.color) {
      setSliderValue(['sáng', 'bright'], plan.color.brightness);
      setSliderValue(['tương phản', 'contrast'], plan.color.contrast);
      setSliderValue(['bão hòa', 'saturat'], plan.color.saturate);
    }
    if (plan.speed) {
      setSliderValue(['tốc độ', 'speed'], plan.speed);
    }
    // Áp dụng trực tiếp CSS filter & playbackRate lên thẻ <video> hiện tại để thấy ngay hiệu quả
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      if (plan.color) {
        v.style.filter = `brightness(${plan.color.brightness || 100}%) contrast(${plan.color.contrast || 100}%) saturate(${plan.color.saturate || 100}%)`;
      }
      if (plan.speed && !isNaN(Number(plan.speed))) {
        v.playbackRate = Math.min(2, Math.max(0.5, Number(plan.speed)));
      }
    });
    // Điền lời bình vào khung TTS
    const ttsBox = document.getElementById('ac-tts-text');
    if (ttsBox && plan.voiceoverScript) {
      ttsBox.value = plan.voiceoverScript;
    }
    // Đẩy yêu cầu vào textarea gốc của tool (nếu có)
    const mainPrompt = document.querySelector('textarea:not(#ac-pro-cmd):not(#ac-tts-text)');
    if (mainPrompt && plan.summary) {
      mainPrompt.value = plan.summary;
      mainPrompt.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Trích xuất khung hình hiện tại từ video trên trang để AI "nhìn" thấy video thật
  function captureActiveVideoFrames() {
    const frames = [];
    const videos = Array.from(document.querySelectorAll('video')).filter((v) => v.readyState >= 2 && v.videoWidth > 0);
    videos.slice(0, 2).forEach((v) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = Math.round((v.videoHeight / v.videoWidth) * 480) || 270;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL('image/jpeg', 0.72).split(',')[1];
        if (b64) frames.push(b64);
      } catch (_) {}
    });
    return frames;
  }

  // ================= 4. PHÒNG THU GIỌNG NÓI 2 CHIỀU (STT <-> TTS) =================
  let recognition = null;
  let isListening = false;

  function toggleMicDictation(targetId, btnEl) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Trình duyệt này chưa hỗ trợ nhận diện giọng nói trực tiếp. Bạn hãy mở bằng Google Chrome hoặc Microsoft Edge!');
      return;
    }
    if (isListening && recognition) {
      recognition.stop();
      return;
    }
    recognition = new SpeechRec();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;

    const target = document.getElementById(targetId);
    const baseText = target ? target.value.trim() : '';

    recognition.onstart = () => {
      isListening = true;
      btnEl.textContent = '🔴 Đang nghe... (Bấm dừng)';
      btnEl.style.background = '#dc2626';
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (target) target.value = (baseText ? baseText + ' ' : '') + transcript.trim();
    };
    recognition.onerror = (e) => {
      alert('Lỗi Micro: ' + e.error + '. Hãy kiểm tra quyền truy cập Micro trên trình duyệt.');
    };
    recognition.onend = () => {
      isListening = false;
      btnEl.textContent = btnEl.dataset.defaultLabel;
      btnEl.style.background = '';
    };
    recognition.start();
  }

  async function transcribeAudioFile(file) {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      alert('File âm thanh/video tải lên để bóc băng cần nhỏ hơn 12MB để truyền nhanh qua máy chủ AI.');
      return;
    }
    const statusEl = document.getElementById('ac-stt-status');
    statusEl.textContent = '⏳ AI đang nghe và chuyển giọng đọc sang văn bản + phụ đề...';

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = String(reader.result).split(',')[1];
        const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
        const res = await fetch(proxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'transcribe',
            audioBase64: b64,
            audioMime: file.type || 'audio/mp3'
          })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Lỗi bóc băng');

        document.getElementById('ac-tts-text').value = data.fullText || '';
        statusEl.innerHTML = `<span style="color:#4ade80;">✓ Đã chuyển xong sang văn bản (${data.subtitles?.length || 0} đoạn phụ đề)!</span>`;
        if (data.subtitles && data.subtitles.length) {
          renderSubtitlesPreview(data.subtitles);
        }
      } catch (err) {
        statusEl.innerHTML = `<span style="color:#f87171;">⚠️ ${err.message}</span>`;
      }
    };
    reader.readAsDataURL(file);
  }

  async function runTextToSpeech() {
    const text = (document.getElementById('ac-tts-text').value || '').trim();
    const voice = document.getElementById('ac-tts-voice').value;
    const speed = parseFloat(document.getElementById('ac-tts-speed').value || '1.0');
    const statusEl = document.getElementById('ac-tts-status');
    const playerWrap = document.getElementById('ac-tts-player');

    if (!text) {
      alert('Hãy nhập văn bản hoặc dùng nút Mic / Đạo Diễn AI để tạo lời bình trước!');
      return;
    }

    statusEl.textContent = '⏳ Đang tạo giọng đọc AI...';
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
        const blob = new Blob([arr], { type: data.audioMime || 'audio/mpeg' });
        lastTtsBlobUrl = URL.createObjectURL(blob);

        statusEl.innerHTML = '<span style="color:#4ade80;">✓ Đã xuất giọng đọc Studio MP3!</span>';
        playerWrap.innerHTML = `
          <audio controls autoplay src="${lastTtsBlobUrl}" style="width:100%; height:36px; margin-top:8px;"></audio>
          <a href="${lastTtsBlobUrl}" download="autocut-voiceover.mp3" style="display:inline-block; margin-top:6px; font-size:12px; color:#38bdf8; text-decoration:none; font-weight:600;">⬇️ Tải file giọng đọc (.mp3) về máy</a>
        `;
        return;
      }

      // Dự phòng mượt bằng giọng tiếng Việt tích hợp trên trình duyệt (Miễn phí, đọc ngay)
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.rate = speed;
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.toLowerCase().includes('vi'));
      if (viVoice) utter.voice = viVoice;
      window.speechSynthesis.speak(utter);

      statusEl.innerHTML = `<span style="color:#4ade80;">🔊 Đang phát giọng đọc tiếng Việt trực tiếp!</span> <span style="color:#94a3b8; font-size:11px;">(Thêm OPENAI_API_KEY vào Cloudflare để tải MP3 Studio)</span>`;
    } catch (err) {
      statusEl.innerHTML = `<span style="color:#f87171;">⚠️ ${err.message}</span>`;
    }
  }

  // ================= 5. CHẠY ĐẠO DIỄN AI XỬ LÝ LỆNH =================
  async function runAIDirector() {
    const cmd = (document.getElementById('ac-pro-cmd').value || '').trim();
    const engine = document.getElementById('ac-pro-engine').value;
    const out = document.getElementById('ac-pro-result');

    if (!cmd) {
      alert('Hãy nhập hoặc nói yêu cầu chỉnh sửa video của bạn!');
      return;
    }

    behavior.preferredEngine = engine;
    const selectedSkillIds = Array.from(activeSkills);
    const selectedSkillNames = selectedSkillIds.map((id) => {
      const s = PRO_SKILLS.find((x) => x.id === id);
      return s ? `${s.name}: ${s.desc}` : id;
    });

    recordCommandBehavior(cmd, selectedSkillIds);
    out.innerHTML = '<div style="color:#a78bfa; font-size:13px; padding:10px;">🧠 Đạo Diễn AI đang phân tích ý định, khung hình video và áp dụng bộ Skill chuyên nghiệp...</div>';

    try {
      const frames = captureActiveVideoFrames();
      const proxy = (window.AutoCutAuth && window.AutoCutAuth.getAIConfig().proxyUrl) || PROXY_URL;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct',
          engine,
          instruction: cmd,
          rawFrames: frames,
          activeSkills: selectedSkillNames,
          behaviorProfile: {
            avgColor: behavior.avgColor,
            avgSpeed: behavior.avgSpeed,
            recentCommands: behavior.recentCommands.slice(0, 4),
            learnedStyleNote: behavior.learnedStyleNote
          }
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      lastPlan = data.plan;
      if (lastPlan) applyPlanToEditor(lastPlan);

      const cutsHtml = (lastPlan?.cuts || []).map((c) => `
        <div style="display:flex; gap:8px; padding:6px 0; border-bottom:1px solid #1e293b; font-size:12px;">
          <span style="color:#38bdf8; font-weight:700; white-space:nowrap;">${c.start}–${c.end}</span>
          <div><b style="color:#f8fafc;">${c.action}</b> — <span style="color:#94a3b8;">${c.note || ''}</span></div>
        </div>
      `).join('');

      out.innerHTML = `
        <div style="background:#0b1120; border:1px solid #334155; border-radius:10px; padding:12px; margin-top:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#4ade80; font-size:12px; font-weight:700;">✓ ${data.provider || 'AI'} (${data.model || ''}) đã thực thi lệnh!</span>
            ${data.note ? `<span style="color:#fbbf24; font-size:11px;">${data.note}</span>` : ''}
          </div>
          <div style="font-size:13px; color:#e2e8f0; line-height:1.5;">${data.text || ''}</div>
          ${lastPlan?.color ? `
            <div style="margin-top:8px; font-size:11px; color:#a78bfa; background:#151d33; padding:6px 10px; border-radius:6px;">
              🎨 Đã áp dụng lên video: Sáng <b>${lastPlan.color.brightness}%</b> • Tương phản <b>${lastPlan.color.contrast}%</b> • Bão hòa <b>${lastPlan.color.saturate}%</b> • Tốc độ <b>${lastPlan.speed || 1}x</b>
            </div>
          ` : ''}
          ${cutsHtml ? `<div style="margin-top:8px;"><div style="font-size:11px; font-weight:700; color:#fbbf24; margin-bottom:4px;">✂️ KỊCH BẢN CẮT NHỊP TIMELINE:</div>${cutsHtml}</div>` : ''}
        </div>
      `;

      if (lastPlan?.subtitles?.length) renderSubtitlesPreview(lastPlan.subtitles);
    } catch (err) {
      out.innerHTML = `<div style="color:#f87171; font-size:12px; padding:8px;">⚠️ Lỗi kết nối AI: ${err.message}</div>`;
    }
  }

  function renderSubtitlesPreview(subs) {
    const box = document.getElementById('ac-sub-preview');
    if (!box) return;
    box.innerHTML = `
      <div style="margin-top:8px; background:#0b1120; border:1px solid #1e293b; border-radius:8px; padding:10px;">
        <div style="font-size:11px; font-weight:700; color:#38bdf8; margin-bottom:6px;">💬 PHỤ ĐỀ TỰ ĐỘNG (${subs.length} câu):</div>
        ${subs.map((s) => `<div style="font-size:12px; margin-bottom:4px;"><span style="color:#94a3b8;">[${s.start}–${s.end}]</span> <span style="color:#f1f5f9;">${s.text}</span></div>`).join('')}
      </div>
    `;
  }

  function updateBehaviorUI() {
    const badge = document.getElementById('ac-behavior-summary');
    if (badge) {
      badge.innerHTML = `<b>🧠 Bộ nhớ hành vi (${behavior.totalActions} thao tác):</b> ${behavior.learnedStyleNote}`;
    }
  }

  // ================= 6. DỰNG GIAO DIỆN NGĂN KÉO PRO STUDIO =================
  function mountProStudio() {
    if (document.getElementById('ac-pro-fab')) return;

    const style = document.createElement('style');
    style.textContent = `
      #ac-pro-fab {
        position: fixed; left: 16px; bottom: 16px; z-index: 9995;
        background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff;
        border: 1px solid rgba(255,255,255,0.2); border-radius: 999px;
        padding: 11px 18px; font-size: 13px; font-weight: 700; cursor: pointer;
        box-shadow: 0 10px 28px rgba(124, 58, 237, 0.5); font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer {
        position: fixed; top: 0; right: -460px; width: 440px; max-width: 95vw; height: 100vh;
        background: #0d1322; border-left: 1px solid #26324d; z-index: 9998;
        box-shadow: -16px 0 48px rgba(0,0,0,0.7); transition: right 0.25s ease;
        display: flex; flex-direction: column; color: #f1f5f9; font-family: system-ui, sans-serif;
      }
      #ac-pro-drawer.open { right: 0; }
      .acp-head { padding: 16px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
      .acp-body { padding: 16px; overflow-y: auto; flex: 1; }
      .acp-sec { background: #131b2e; border: 1px solid #23304d; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
      .acp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; display: block; }
      .acp-inp, .acp-sel, .acp-ta {
        width: 100%; box-sizing: border-box; background: #0a0f1d; border: 1px solid #2b3856;
        color: #f8fafc; border-radius: 8px; padding: 8px 10px; font-size: 13px; outline: none;
      }
      .acp-ta { min-height: 74px; resize: vertical; }
      .acp-btn {
        border: none; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 700;
        cursor: pointer; color: #fff; background: #334155;
      }
      .acp-btn-main { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      .acp-btn-green { background: #10b981; color: #052e16; }
      .acp-skill {
        display: inline-block; padding: 5px 9px; margin: 3px; border-radius: 999px;
        font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #2e3b5b;
        background: #0b1120; color: #cbd5e1;
      }
      .acp-skill.on { background: #312e81; border-color: #a78bfa; color: #fff; }
    `;
    document.head.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'ac-pro-fab';
    fab.textContent = '🎬 Đạo Diễn AI Pro & Giọng Nói';
    document.body.appendChild(fab);

    const drawer = document.createElement('div');
    drawer.id = 'ac-pro-drawer';
    drawer.innerHTML = `
      <div class="acp-head">
        <div>
          <div style="font-size:15px; font-weight:800; color:#fbbf24;">🎬 ĐẠO DIỄN AI PRO & VOICE STUDIO</div>
          <div style="font-size:11px; color:#94a3b8;">Gemini + ChatGPT • Giọng nói 2 chiều • Học hành vi</div>
        </div>
        <button class="acp-btn" id="ac-pro-close">✕</button>
      </div>
      <div class="acp-body">
        <div class="acp-sec" style="border-color:#4c1d95;">
          <div id="ac-behavior-summary" style="font-size:12px; color:#ddd6fe; line-height:1.45;"></div>
          <button class="acp-btn" id="ac-reset-behavior" style="margin-top:6px; padding:4px 8px; font-size:11px; background:#1e293b;">Đặt lại bộ nhớ hành vi</button>
        </div>

        <div class="acp-sec">
          <label class="acp-label">1. Chọn Lõi AI & Bộ Skill Editor Chuyên Nghiệp</label>
          <select class="acp-sel" id="ac-pro-engine" style="margin-bottom:8px;">
            <option value="auto">⚡ Tự động kết hợp (Gemini + ChatGPT dự phòng)</option>
            <option value="gemini">✨ Lõi Gemini 3.5 (Đa phương thức nhìn video cực nhanh)</option>
            <option value="openai">🤖 Lõi ChatGPT GPT-4o (Hiểu sâu kịch bản & lệnh khó)</option>
          </select>
          <div id="ac-skills-wrap">
            ${PRO_SKILLS.map((s) => `<span class="acp-skill ${activeSkills.has(s.id) ? 'on' : ''}" data-sid="${s.id}" title="${s.desc}">${s.name}</span>`).join('')}
          </div>
        </div>

        <div class="acp-sec">
          <label class="acp-label">2. Ra Lệnh Cho Đạo Diễn AI (Gõ hoặc Nói trực tiếp)</label>
          <textarea class="acp-ta" id="ac-pro-cmd" placeholder="Ví dụ: Cắt gọn khúc đầu 3 giây thật cuốn, giữ màu thật không ám vàng, thêm phụ đề ngắn chốt đơn và viết lời bình 20 giây..."></textarea>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="acp-btn" id="ac-mic-cmd" data-default-label="🎙️ Ra lệnh bằng giọng nói">🎙️ Ra lệnh bằng giọng nói</button>
            <button class="acp-btn acp-btn-main" id="ac-run-director" style="flex:1;">⚡ Thực Thi Lệnh Dựng</button>
          </div>
          <div id="ac-pro-result"></div>
        </div>

        <div class="acp-sec">
          <label class="acp-label">3. Phòng Thu Giọng Nói 2 Chiều (Giọng ↔ Văn bản)</label>
          <div style="margin-bottom:8px;">
            <input type="file" id="ac-stt-file" accept="audio/*,video/*" style="display:none;" />
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="acp-btn" id="ac-btn-stt-file">📂 Tách lời từ File Video/Audio → Chữ</button>
              <button class="acp-btn" id="ac-mic-tts" data-default-label="🎙️ Đọc trực tiếp → Chữ">🎙️ Đọc trực tiếp → Chữ</button>
            </div>
            <div id="ac-stt-status" style="font-size:12px; margin-top:6px; color:#94a3b8;"></div>
          </div>

          <textarea class="acp-ta" id="ac-tts-text" placeholder="Văn bản bóc băng từ giọng đọc hoặc kịch bản thuyết minh sẽ hiện ở đây..."></textarea>
          <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
            <select class="acp-sel" id="ac-tts-voice" style="flex:1;">
              <option value="nova">Giọng Nữ Truyền Cảm (Nova)</option>
              <option value="alloy">Giọng Trung Tính Tự Nhiên (Alloy)</option>
              <option value="onyx">Giọng Nam Trầm Ấm (Onyx)</option>
              <option value="shimmer">Giọng Nữ Sáng Năng Động (Shimmer)</option>
            </select>
            <select class="acp-sel" id="ac-tts-speed" style="width:86px;">
              <option value="0.9">0.9x</option>
              <option value="1.0" selected>1.0x</option>
              <option value="1.15">1.15x</option>
              <option value="1.25">1.25x</option>
            </select>
            <button class="acp-btn acp-btn-green" id="ac-run-tts">🔊 Đọc / Tạo Giọng</button>
          </div>
          <div id="ac-tts-status" style="font-size:12px; margin-top:6px;"></div>
          <div id="ac-tts-player"></div>
          <div id="ac-sub-preview"></div>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    fab.onclick = () => drawer.classList.toggle('open');
    document.getElementById('ac-pro-close').onclick = () => drawer.classList.remove('open');
    document.getElementById('ac-pro-engine').value = behavior.preferredEngine || 'auto';

    document.querySelectorAll('#ac-skills-wrap .acp-skill').forEach((el) => {
      el.onclick = () => {
        const sid = el.getAttribute('data-sid');
        if (activeSkills.has(sid)) {
          activeSkills.delete(sid);
          el.classList.remove('on');
        } else {
          activeSkills.add(sid);
          el.classList.add('on');
        }
      };
    });

    document.getElementById('ac-run-director').onclick = runAIDirector;
    document.getElementById('ac-mic-cmd').onclick = function () { toggleMicDictation('ac-pro-cmd', this); };
    document.getElementById('ac-mic-tts').onclick = function () { toggleMicDictation('ac-tts-text', this); };
    document.getElementById('ac-btn-stt-file').onclick = () => document.getElementById('ac-stt-file').click();
    document.getElementById('ac-stt-file').onchange = (e) => transcribeAudioFile(e.target.files[0]);
    document.getElementById('ac-run-tts').onclick = runTextToSpeech;

    document.getElementById('ac-reset-behavior').onclick = () => {
      localStorage.removeItem(BEHAVIOR_KEY);
      behavior = loadBehavior();
      saveBehavior(true);
    };

    updateBehaviorUI();
  }

  function init() {
    attachBehaviorListeners();
    mountProStudio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
