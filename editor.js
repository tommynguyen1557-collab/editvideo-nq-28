/**
 * AutoCut Studio AI — CORE 2: CapCut-Style Video Editor & Audio-Mixed MP4 Exporter
 * Self-mounting module: Automatically injects Inspector Panel, Export Modal & Media Engine.
 * Works cleanly with frozen auth.js and exposes hooks for Phase 3 ai.js.
 */
(function (window, document) {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatTime(sec) {
    const s = Math.max(0, sec || 0);
    const m = Math.floor(s / 60);
    const rem = (s % 60).toFixed(1);
    return `${String(m).padStart(2, '0')}:${rem.padStart(4, '0')}`;
  }

  function formatSize(bytes) {
    if (!bytes) return '0 MB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // ===========================================================================
  // 1. SELF-MOUNTING UI (RIGHT INSPECTOR, EXPORT MODAL, EXTRA DOCK, MEDIA)
  // ===========================================================================
  function mountEditorUI() {
    // 1A. Hidden Media Elements
    if (!document.getElementById('editorVideoEl')) {
      const v = document.createElement('video');
      v.id = 'editorVideoEl';
      v.className = 'hidden';
      v.playsInline = true;
      v.preload = 'auto';
      document.body.appendChild(v);
    }
    if (!document.getElementById('editorBgmEl')) {
      const a = document.createElement('audio');
      a.id = 'editorBgmEl';
      a.className = 'hidden';
      a.loop = true;
      document.body.appendChild(a);
    }

    // 1B. Update left panel meta & center overlay for Phase 2
    const rawMeta = document.getElementById('rawVideoMeta');
    if (rawMeta) rawMeta.innerText = 'Sẵn sàng ghép nối, tách clip & xuất MP4 có âm thanh';

    const overlay = document.getElementById('emptyCanvasOverlay');
    if (overlay) {
      overlay.innerHTML = `
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-3 text-indigo-400">
          <i class="fa-solid fa-film text-xl"></i>
        </div>
        <h3 class="text-sm font-bold text-white mb-1">Chưa có video nào được nạp</h3>
        <p class="text-xs text-zinc-400 max-w-xs mb-4 leading-relaxed">Chọn 1 hoặc nhiều clip video thô ở cột trái để ghép nối, hoặc chạy thử ngay với Video Mẫu.</p>
        <div class="flex gap-2">
          <button type="button" onclick="document.getElementById('rawVideoInput').click()" class="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-white">Chọn Video Thô</button>
          <button type="button" onclick="EditorCore.loadDemoVideo()" class="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"><i class="fa-solid fa-play mr-1"></i>Chạy Video Mẫu</button>
        </div>
      `;
    }

    // 1C. Fix canvas wrapper sizing so 9:16, 16:9, 1:1, 4:5 scale accurately
    const canvasEl = document.getElementById('previewCanvas');
    if (canvasEl && canvasEl.parentElement) {
      canvasEl.parentElement.className = 'relative shadow-2xl shadow-black/90 rounded-lg overflow-hidden border border-zinc-800 bg-black flex items-center justify-center';
    }

    // 1D. Enhance CapCut Dock with Speed, Mute, Mark In/Out
    const dockContainer = document.querySelector('.dock-btn')?.parentElement;
    if (dockContainer && !document.getElementById('btnQuickSpeed')) {
      dockContainer.insertAdjacentHTML('beforeend', `
        <span class="w-px h-5 bg-zinc-800 mx-0.5"></span>
        <button type="button" id="btnQuickSpeed" onclick="EditorCore.cycleSpeed()" class="dock-btn" title="Đổi tốc độ nhanh"><i class="fa-solid fa-gauge-high text-emerald-400"></i><span id="dockSpeedLabel">1.0x</span></button>
        <button type="button" id="btnQuickMute" onclick="EditorCore.toggleMute()" class="dock-btn" title="Tắt/Bật tiếng video"><i class="fa-solid fa-volume-high text-zinc-300"></i></button>
        <span class="w-px h-5 bg-zinc-800 mx-0.5"></span>
        <button type="button" onclick="EditorCore.markIn()" class="dock-btn font-mono" title="Cắt điểm đầu (Phím I)">[ I</button>
        <button type="button" onclick="EditorCore.markOut()" class="dock-btn font-mono" title="Cắt điểm cuối (Phím O)">O ]</button>
        <button type="button" onclick="EditorCore.resetTrim()" class="dock-btn text-zinc-400" title="Bỏ vùng cắt">Reset</button>
      `);
    }

    // 1E. Upgrade Timeline Scrubber & Info
    const scrubber = document.getElementById('scrubberTrack');
    if (scrubber) {
      scrubber.className = 'relative h-9 bg-zinc-900 rounded-md border border-zinc-800 cursor-pointer flex items-center overflow-hidden';
      scrubber.innerHTML = `
        <div id="timelineClipBlocks" class="absolute inset-0 flex h-full w-full"></div>
        <div id="trimHighlight" class="absolute top-0 bottom-0 bg-indigo-500/15 border-x-2 border-indigo-400 pointer-events-none z-10" style="left:0%;width:100%"></div>
        <div id="playhead" class="absolute top-0 bottom-0 w-0.5 bg-pink-500 z-20 pointer-events-none" style="left:0%"><div class="w-2.5 h-2.5 rounded-full bg-pink-500 -ml-1 -mt-0.5 shadow"></div></div>
      `;
      const timelineBox = scrubber.parentElement;
      if (timelineBox && !document.getElementById('editorSubTimelineRows')) {
        timelineBox.className = 'h-44 border-t border-zinc-800 bg-zinc-950 p-3 flex flex-col justify-between gap-1.5';
        const trimInfoBar = timelineBox.firstElementChild;
        if (trimInfoBar && !document.getElementById('trimRangeLabel')) {
          const rightSpan = trimInfoBar.lastElementChild;
          if (rightSpan) {
            rightSpan.innerHTML = `
              <span class="text-[11px] text-zinc-400 mr-2">Vùng xuất: <b id="trimRangeLabel" class="text-indigo-400">0.0s - 10.0s</b></span>
              <button type="button" onclick="EditorCore.skipStart()" class="text-zinc-400 hover:text-white px-1.5" title="Về đầu"><i class="fa-solid fa-backward-step"></i></button>
              <button type="button" onclick="EditorCore.step(-0.5)" class="text-zinc-400 hover:text-white px-1.5" title="Lùi 0.5s"><i class="fa-solid fa-backward"></i></button>
              <button type="button" onclick="EditorCore.step(0.5)" class="text-zinc-400 hover:text-white px-1.5" title="Tiến 0.5s"><i class="fa-solid fa-forward"></i></button>
            `;
          }
        }
        timelineBox.insertAdjacentHTML('beforeend', `
          <div id="editorSubTimelineRows" class="grid grid-cols-3 gap-1.5">
            <div class="h-6 bg-zinc-900/80 rounded border border-zinc-800 flex items-center px-2 justify-between overflow-hidden">
              <span class="text-[10px] text-purple-400 truncate"><i class="fa-solid fa-font mr-1"></i><b id="tlTextPreview">AUTOCUT STUDIO AI</b></span>
            </div>
            <div class="h-6 bg-zinc-900/80 rounded border border-zinc-800 flex items-center px-2 justify-between overflow-hidden">
              <span class="text-[10px] text-amber-400 truncate"><i class="fa-solid fa-stamp mr-1"></i><b id="tlLogoPreview">Chưa gắn Logo</b></span>
              <span id="tlTransBadge" class="text-[9px] text-amber-300 bg-amber-500/20 px-1 rounded shrink-0">Fade: Tắt</span>
            </div>
            <div class="h-6 bg-zinc-900/80 rounded border border-zinc-800 flex items-center px-2 gap-1 overflow-x-auto">
              <span class="text-[10px] text-emerald-400 shrink-0"><i class="fa-solid fa-music mr-1"></i>SFX:</span>
              <div id="tlSfxList" class="flex items-center gap-1"><span class="text-[10px] text-zinc-600 italic">Trống</span></div>
            </div>
          </div>
        `);
      }
    }

    // 1F. Inject Right 5-Tab Inspector Panel into <main>
    const mainEl = document.querySelector('main');
    if (mainEl && !document.getElementById('editorInspectorAside')) {
      mainEl.insertAdjacentHTML('beforeend', `
        <aside id="editorInspectorAside" class="w-full lg:w-[320px] border-l border-zinc-800 bg-zinc-950/75 flex flex-col h-auto lg:h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div class="grid grid-cols-5 border-b border-zinc-800 bg-zinc-950 text-[10px] font-semibold">
            <button type="button" onclick="EditorCore.switchTab('transform')" id="ins-tab-transform" class="ins-tab py-2.5 text-indigo-400 border-b-2 border-indigo-500">Cắt/Hiệu Ứng</button>
            <button type="button" onclick="EditorCore.switchTab('color')" id="ins-tab-color" class="ins-tab py-2.5 text-zinc-400 hover:text-white">Màu Sắc</button>
            <button type="button" onclick="EditorCore.switchTab('text')" id="ins-tab-text" class="ins-tab py-2.5 text-zinc-400 hover:text-white">Phụ Đề</button>
            <button type="button" onclick="EditorCore.switchTab('logo')" id="ins-tab-logo" class="ins-tab py-2.5 text-zinc-400 hover:text-white">Logo</button>
            <button type="button" onclick="EditorCore.switchTab('audio')" id="ins-tab-audio" class="ins-tab py-2.5 text-zinc-400 hover:text-white">Âm/SFX</button>
          </div>
          <div class="p-4 space-y-4">
            <!-- TAB 1: TRANSFORM -->
            <div id="ins-panel-transform" class="ins-panel space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Điểm bắt đầu (Start)</span><span id="insTrimStartVal" class="font-mono text-indigo-400">0.0s</span></div>
                <input type="range" id="insTrimStartSlider" min="0" max="10" step="0.1" value="0" oninput="EditorCore.updateTrimFromSliders()" class="w-full accent-indigo-500" />
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Điểm kết thúc (End)</span><span id="insTrimEndVal" class="font-mono text-indigo-400">10.0s</span></div>
                <input type="range" id="insTrimEndSlider" min="0.5" max="10" step="0.1" value="10" oninput="EditorCore.updateTrimFromSliders()" class="w-full accent-indigo-500" />
              </div>
              <hr class="border-zinc-800" />
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Thu phóng (Zoom)</span><span id="insZoomVal" class="font-mono">100%</span></div>
                <input type="range" id="insZoomSlider" min="80" max="180" value="100" oninput="EditorCore.updateTransform()" class="w-full accent-indigo-500" />
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Tốc độ phát (Speed)</span><span id="insSpeedVal" class="font-mono">1.0x</span></div>
                <input type="range" id="insSpeedSlider" min="0.5" max="2.0" step="0.1" value="1.0" oninput="EditorCore.updateSpeed()" class="w-full accent-indigo-500" />
              </div>
              <label class="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-1">
                <span>Auto Dynamic Zoom (Nhịp động)</span>
                <input type="checkbox" id="insAutoZoom" onchange="EditorCore.setAutoZoom(this.checked)" class="w-4 h-4 accent-indigo-600" />
              </label>
              <div>
                <label class="text-[11px] font-semibold text-zinc-400 uppercase block mb-1.5">Chuyển cảnh Đầu / Cuối</label>
                <select id="insTransition" onchange="EditorCore.setTransition(this.value)" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-white">
                  <option value="none">Không dùng chuyển cảnh</option>
                  <option value="fade">Fade In / Out Mượt Mà (0.6s)</option>
                  <option value="flash">Flash Trắng Mở Đầu (0.3s)</option>
                </select>
              </div>
            </div>

            <!-- TAB 2: COLOR -->
            <div id="ins-panel-color" class="ins-panel hidden space-y-3">
              <div class="grid grid-cols-2 gap-1.5">
                <button type="button" onclick="EditorCore.applyColorPreset('original')" class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-left">Nguyên Bản</button>
                <button type="button" onclick="EditorCore.applyColorPreset('silver')" class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-indigo-500/40 text-xs text-left text-indigo-300">Sáng Nét Bạc</button>
                <button type="button" onclick="EditorCore.applyColorPreset('vivid')" class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-left text-pink-300">Rực Rỡ Trend</button>
                <button type="button" onclick="EditorCore.applyColorPreset('cinematic')" class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-left text-amber-300">Điện Ảnh Ấm</button>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Độ sáng (Brightness)</span><span id="insBrightVal" class="font-mono">100%</span></div>
                <input type="range" id="insBrightSlider" min="50" max="160" value="100" oninput="EditorCore.updateFilters()" class="w-full accent-indigo-500" />
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Tương phản (Contrast)</span><span id="insContrastVal" class="font-mono">100%</span></div>
                <input type="range" id="insContrastSlider" min="50" max="160" value="100" oninput="EditorCore.updateFilters()" class="w-full accent-indigo-500" />
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Độ bão hòa (Saturation)</span><span id="insSaturateVal" class="font-mono">100%</span></div>
                <input type="range" id="insSaturateSlider" min="0" max="180" value="100" oninput="EditorCore.updateFilters()" class="w-full accent-indigo-500" />
              </div>
            </div>

            <!-- TAB 3: SUBTITLES -->
            <div id="ins-panel-text" class="ins-panel hidden space-y-3">
              <label class="flex items-center justify-between text-xs cursor-pointer">
                <span class="font-semibold text-zinc-200">Hiển thị phụ đề</span>
                <input type="checkbox" id="insShowText" checked onchange="EditorCore.setTextVisible(this.checked)" class="w-4 h-4 accent-indigo-600" />
              </label>
              <label class="flex items-center justify-between text-xs cursor-pointer">
                <span class="text-zinc-300">Chạy chữ động (Kinetic)</span>
                <input type="checkbox" id="insKineticText" checked onchange="EditorCore.setTextKinetic(this.checked)" class="w-4 h-4 accent-pink-500" />
              </label>
              <div>
                <label class="text-xs text-zinc-400 block mb-1">Phụ đề nhiều dòng (Mỗi dòng = 1 đoạn)</label>
                <textarea id="insSubInput" rows="4" oninput="EditorCore.parseSubtitles()" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white leading-relaxed resize-none">AUTOCUT STUDIO AI
DỰNG VIDEO CHUẨN CAPCUT
XUẤT MP4 SẮC NÉT ✨</textarea>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><label class="text-xs text-zinc-400 block mb-1">Màu chữ</label><input type="color" id="insTextColor" value="#ffffff" oninput="EditorCore.updateTextStyle()" class="w-full h-8 bg-zinc-900 border border-zinc-700 rounded cursor-pointer" /></div>
                <div><label class="text-xs text-zinc-400 block mb-1">Màu nền nhãn</label><input type="color" id="insTextBg" value="#4f46e5" oninput="EditorCore.updateTextStyle()" class="w-full h-8 bg-zinc-900 border border-zinc-700 rounded cursor-pointer" /></div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Cỡ chữ</span><span id="insFontSizeVal" class="font-mono">24px</span></div>
                <input type="range" id="insFontSizeSlider" min="14" max="56" value="24" oninput="EditorCore.updateTextStyle()" class="w-full accent-indigo-500" />
              </div>
              <p class="text-[10px] text-zinc-500"><i class="fa-solid fa-hand-pointer mr-1 text-indigo-400"></i>Kéo thả trực tiếp phụ đề trên khung hình để đổi vị trí.</p>
            </div>

            <!-- TAB 4: BRAND LOGO -->
            <div id="ins-panel-logo" class="ins-panel hidden space-y-3">
              <label class="flex items-center justify-between text-xs cursor-pointer">
                <span class="font-semibold text-zinc-200">Hiển thị Logo Thương Hiệu</span>
                <input type="checkbox" id="insShowLogo" checked onchange="EditorCore.setLogoVisible(this.checked)" class="w-4 h-4 accent-amber-500" />
              </label>
              <button type="button" onclick="document.getElementById('logoInput').click()" class="w-full border border-dashed border-zinc-700 hover:border-amber-500 rounded-xl p-3 bg-zinc-900 text-center transition">
                <i class="fa-solid fa-cloud-arrow-up text-amber-400 text-base mb-1 block"></i>
                <span class="text-xs font-semibold text-zinc-200">Tải Ảnh Logo / Watermark (PNG)</span>
              </button>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Kích thước Logo</span><span id="insLogoScaleVal" class="font-mono text-amber-400">22%</span></div>
                <input type="range" id="insLogoScaleSlider" min="8" max="60" value="22" oninput="EditorCore.updateLogoStyle()" class="w-full accent-amber-500" />
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Độ rõ nét (Opacity)</span><span id="insLogoOpacityVal" class="font-mono">90%</span></div>
                <input type="range" id="insLogoOpacitySlider" min="10" max="100" value="90" oninput="EditorCore.updateLogoStyle()" class="w-full accent-amber-500" />
              </div>
              <div class="grid grid-cols-2 gap-1.5">
                <button type="button" onclick="EditorCore.snapLogo('tl')" class="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px]">Trái Trên</button>
                <button type="button" onclick="EditorCore.snapLogo('tr')" class="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px]">Phải Trên</button>
                <button type="button" onclick="EditorCore.snapLogo('bl')" class="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px]">Trái Dưới</button>
                <button type="button" onclick="EditorCore.snapLogo('br')" class="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px]">Phải Dưới</button>
              </div>
            </div>

            <!-- TAB 5: AUDIO & SFX -->
            <div id="ins-panel-audio" class="ins-panel hidden space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Âm lượng Video gốc</span><span id="insOrigVolVal" class="font-mono">100%</span></div>
                <input type="range" id="insOrigVolSlider" min="0" max="100" value="100" oninput="EditorCore.updateAudioVolumes()" class="w-full accent-emerald-500" />
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1"><span class="text-zinc-400">Âm lượng Nhạc nền (BGM)</span><span id="insBgmVolVal" class="font-mono">45%</span></div>
                <input type="range" id="insBgmVolSlider" min="0" max="100" value="45" oninput="EditorCore.updateAudioVolumes()" class="w-full accent-emerald-500" />
              </div>
              <hr class="border-zinc-800" />
              <div>
                <label class="text-[11px] font-semibold text-zinc-400 uppercase block mb-2">Chèn SFX Tại Vị Trí Kim Phát</label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" onclick="EditorCore.addSfx('whoosh')" class="p-2 rounded-lg bg-zinc-900 hover:bg-indigo-600/20 border border-zinc-800 text-xs"><i class="fa-solid fa-wind text-indigo-400 mr-1.5"></i>Whoosh</button>
                  <button type="button" onclick="EditorCore.addSfx('pop')" class="p-2 rounded-lg bg-zinc-900 hover:bg-pink-600/20 border border-zinc-800 text-xs"><i class="fa-solid fa-comment-dots text-pink-400 mr-1.5"></i>Pop!</button>
                  <button type="button" onclick="EditorCore.addSfx('ding')" class="p-2 rounded-lg bg-zinc-900 hover:bg-amber-600/20 border border-zinc-800 text-xs"><i class="fa-solid fa-bell text-amber-400 mr-1.5"></i>Ding ✨</button>
                  <button type="button" onclick="EditorCore.addSfx('bass')" class="p-2 rounded-lg bg-zinc-900 hover:bg-emerald-600/20 border border-zinc-800 text-xs"><i class="fa-solid fa-drum text-emerald-400 mr-1.5"></i>Bass Drop</button>
                </div>
              </div>
              <button type="button" onclick="EditorCore.clearSfx()" class="w-full py-1.5 rounded bg-zinc-900 hover:bg-red-950/50 text-xs text-zinc-400 hover:text-red-400 border border-zinc-800">Xóa toàn bộ SFX</button>
            </div>
          </div>
        </aside>
      `);
    }

    // 1G. Inject Export Modal into document.body
    if (!document.getElementById('exportModal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="exportModal" class="modal-backdrop">
          <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-sm font-bold text-white"><i class="fa-solid fa-film text-indigo-400 mr-1.5"></i>Xuất Video Thành Phẩm</h3>
                <p class="text-[11px] text-zinc-400">Ưu tiên MP4 • Tự động trộn tiếng video gốc + nhạc nền + SFX</p>
              </div>
              <button type="button" onclick="EditorCore.closeExportModal()" class="text-zinc-400 hover:text-white p-1"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" onclick="EditorCore.selectExportQuality('720p')" id="q-btn-720p" class="q-btn p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-left"><div class="text-xs font-bold text-white">720p HD</div><div class="text-[10px] text-zinc-500">1280×720 • Nhanh</div></button>
              <button type="button" onclick="EditorCore.selectExportQuality('1080p')" id="q-btn-1080p" class="q-btn p-3 rounded-xl bg-indigo-950/40 border-2 border-indigo-500 text-left"><div class="text-xs font-bold text-white">1080p Full HD</div><div class="text-[10px] text-zinc-400">1920×1080 • Chuẩn</div></button>
              <button type="button" onclick="EditorCore.selectExportQuality('2k')" id="q-btn-2k" class="q-btn p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-left"><div class="text-xs font-bold text-purple-300">2K QHD</div><div class="text-[10px] text-zinc-500">2560×1440 • Pro</div></button>
              <button type="button" onclick="EditorCore.selectExportQuality('4k')" id="q-btn-4k" class="q-btn p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-left"><div class="text-xs font-bold text-amber-400">4K Ultra HD</div><div class="text-[10px] text-zinc-500">3840×2160 • Master</div></button>
            </div>
            <div class="text-xs text-zinc-400 space-y-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div class="flex justify-between"><span>Độ phân giải thật:</span><b id="exportExactPixel" class="text-indigo-400 font-mono">1080 × 1920 px</b></div>
              <div class="flex justify-between"><span>Thời lượng đoạn xuất:</span><b id="exportDurationInfo" class="text-zinc-200 font-mono">10.0s</b></div>
            </div>
            <div id="exportProgressSection" class="hidden space-y-1.5">
              <div class="flex justify-between text-xs"><span class="text-indigo-400"><i class="fa-solid fa-gear fa-spin mr-1"></i>Đang kết xuất video & âm thanh...</span><span id="exportPercentText" class="font-mono text-white">0%</span></div>
              <div class="w-full bg-zinc-800 h-2 rounded-full overflow-hidden"><div id="exportProgressBar" class="bg-gradient-to-r from-indigo-500 to-pink-500 h-full w-0 transition-all"></div></div>
            </div>
            <button type="button" id="startRenderBtn" onclick="EditorCore.startExport()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg">Bắt Đầu Xuất & Tải Về Máy</button>
          </div>
        </div>
      `);
    }
  }

  mountEditorUI();

  // ===========================================================================
  // 2. CORE EDITOR STATE & AUDIO MIXER
  // ===========================================================================
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const videoEl = document.getElementById('editorVideoEl');
  const bgmEl = document.getElementById('editorBgmEl');

  const QUALITY_SPECS = {
    '720p':  { label: '720p HD', shortDim: 720, bitrate: 6000000 },
    '1080p': { label: '1080p Full HD', shortDim: 1080, bitrate: 12000000 },
    '2k':    { label: '2K QHD', shortDim: 1440, bitrate: 20000000 },
    '4k':    { label: '4K Ultra HD', shortDim: 2160, bitrate: 32000000 }
  };

  const state = {
    hasVideo: false,
    isPlaying: false,
    clips: [], // { id, name, url, size, isDemo, inPoint, outPoint, duration, startOffset }
    activeIdx: 0,
    duration: 10,
    currentTime: 0,
    trimStart: 0,
    trimEnd: 10,
    aspectRatio: '9:16',
    exportQuality: '1080p',
    zoom: 1.0,
    speed: 1.0,
    flipH: false,
    rotateDeg: 0,
    isMuted: false,
    autoZoom: false,
    transition: 'none',
    showSafeZones: false,
    filters: { brightness: 100, contrast: 100, saturate: 100 },
    text: {
      visible: true,
      kinetic: true,
      lines: ['AUTOCUT STUDIO AI', 'DỰNG VIDEO CHUẨN CAPCUT', 'XUẤT MP4 SẮC NÉT ✨'],
      color: '#ffffff',
      bgColor: '#4f46e5',
      size: 24,
      xRatio: 0.5,
      yRatio: 0.82
    },
    logo: {
      visible: true,
      img: null,
      scalePct: 22,
      opacity: 0.9,
      xRatio: 0.82,
      yRatio: 0.14
    },
    sfxEvents: [],
    lastTriggeredSfxIdx: -1,
    dragTarget: null,
    dragOffsetX: 0,
    dragOffsetY: 0
  };

  let loadedVideoUrl = '';
  let isExporting = false;

  // Web Audio Mixer (Video + BGM + SFX)
  let audioCtx = null;
  let audioDest = null;
  let audioConnected = false;
  let vidGainNode = null;
  let bgmGainNode = null;

  function initAudioGraph() {
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        audioDest = audioCtx.createMediaStreamDestination();
        // Silent keepalive oscillator so audio track is always active during export
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        g.gain.value = 0.00001;
        osc.connect(g);
        g.connect(audioDest);
        osc.start();
      }
      if (!audioConnected) {
        audioConnected = true;
        vidGainNode = audioCtx.createGain();
        bgmGainNode = audioCtx.createGain();
        vidGainNode.connect(audioCtx.destination);
        vidGainNode.connect(audioDest);
        bgmGainNode.connect(audioCtx.destination);
        bgmGainNode.connect(audioDest);
        try {
          const vSrc = audioCtx.createMediaElementSource(videoEl);
          vSrc.connect(vidGainNode);
        } catch {}
        try {
          const bSrc = audioCtx.createMediaElementSource(bgmEl);
          bSrc.connect(bgmGainNode);
        } catch {}
        updateAudioVolumes();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch {}
  }

  function playSynthSfx(type) {
    try {
      initAudioGraph();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (audioDest) gain.connect(audioDest);

      if (type === 'whoosh') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.34);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'ding') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now); osc.stop(now + 0.55);
      } else if (type === 'bass') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(34, now + 0.42);
        gain.gain.setValueAtTime(0.34, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now); osc.stop(now + 0.45);
      }
    } catch {}
  }

  // ===========================================================================
  // 3. UNDO / REDO HISTORY STACK
  // ===========================================================================
  const historyStack = [];
  const redoStack = [];

  function serializeHistory() {
    return JSON.stringify({
      clips: state.clips,
      flipH: state.flipH,
      rotateDeg: state.rotateDeg,
      zoom: state.zoom,
      speed: state.speed,
      autoZoom: state.autoZoom,
      transition: state.transition,
      filters: { ...state.filters },
      textLines: [...state.text.lines],
      trimStart: state.trimStart,
      trimEnd: state.trimEnd,
      sfxEvents: [...state.sfxEvents]
    });
  }

  function saveHistory() {
    historyStack.push(serializeHistory());
    if (historyStack.length > 30) historyStack.shift();
    redoStack.length = 0;
  }

  function restoreHistory(snap) {
    const d = JSON.parse(snap);
    state.clips = d.clips;
    state.flipH = d.flipH;
    state.rotateDeg = d.rotateDeg;
    state.zoom = d.zoom;
    state.speed = d.speed;
    state.autoZoom = d.autoZoom;
    state.transition = d.transition;
    state.filters = d.filters;
    state.text.lines = d.textLines;
    state.sfxEvents = d.sfxEvents || [];
    syncInspectorInputs();
    rebuildClips(false);
    state.trimStart = Math.min(d.trimStart, state.duration - 0.3);
    state.trimEnd = Math.min(d.trimEnd, state.duration);
    syncTrimUI();
  }

  function undo() {
    if (!historyStack.length) return;
    redoStack.push(serializeHistory());
    restoreHistory(historyStack.pop());
  }

  function redo() {
    if (!redoStack.length) return;
    historyStack.push(serializeHistory());
    restoreHistory(redoStack.pop());
  }

  // ===========================================================================
  // 4. MULTI-CLIP SEQUENCER & CAPCUT DOCK ACTIONS
  // ===========================================================================
  function probeDuration(url) {
    return new Promise((resolve) => {
      const tmp = document.createElement('video');
      tmp.preload = 'metadata';
      tmp.onloadedmetadata = () => resolve(tmp.duration || 5.0);
      tmp.onerror = () => resolve(5.0);
      tmp.src = url;
    });
  }

  async function handleMultiVideoUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    saveHistory();
    state.clips = state.clips.filter((c) => !c.isDemo);

    for (const file of files) {
      const url = URL.createObjectURL(file);
      const dur = await probeDuration(url);
      state.clips.push({
        id: 'C-' + Math.random().toString(36).slice(2, 7),
        name: file.name,
        url,
        size: file.size,
        isDemo: false,
        inPoint: 0,
        outPoint: dur,
        duration: dur,
        startOffset: 0
      });
    }
    e.target.value = '';
    rebuildClips(true);
  }

  function loadDemoVideo() {
    saveHistory();
    state.clips = [{
      id: 'DEMO-1',
      name: 'Demo_Silver_Ring_4K.mp4',
      url: '',
      size: 152000000,
      isDemo: true,
      inPoint: 0,
      outPoint: 12.0,
      duration: 12.0,
      startOffset: 0
    }];
    rebuildClips(true);
    if (!state.isPlaying) togglePlay();
  }

  function clearAllClips() {
    if (!state.clips.length) return;
    saveHistory();
    state.clips = [];
    loadedVideoUrl = '';
    videoEl.pause();
    videoEl.removeAttribute('src');
    rebuildClips(true);
  }

  function moveClip(idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= state.clips.length) return;
    saveHistory();
    const tmp = state.clips[idx];
    state.clips[idx] = state.clips[target];
    state.clips[target] = tmp;
    rebuildClips(false);
  }

  function removeClipAt(idx) {
    if (idx < 0 || idx >= state.clips.length) return;
    saveHistory();
    state.clips.splice(idx, 1);
    rebuildClips(false);
  }

  function rebuildClips(resetTime = true) {
    const seqBox = document.getElementById('clipSequenceContainer');
    const overlay = document.getElementById('emptyCanvasOverlay');
    const blocksEl = document.getElementById('timelineClipBlocks');

    if (!state.clips.length) {
      state.hasVideo = false;
      state.isPlaying = false;
      state.duration = 10;
      state.currentTime = 0;
      state.trimStart = 0;
      state.trimEnd = 10;
      if (seqBox) seqBox.classList.add('hidden');
      if (overlay) overlay.classList.remove('hidden');
      if (blocksEl) blocksEl.innerHTML = '';
      document.getElementById('rawVideoName').innerText = '+ Thêm 1 hoặc Nhiều Clip Video Thô';
      document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
      syncTrimUI();
      return;
    }

    state.hasVideo = true;
    if (seqBox) seqBox.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');

    let totalDur = 0;
    let totalSize = 0;
    state.clips.forEach((c) => {
      c.startOffset = totalDur;
      totalDur += c.duration;
      totalSize += (c.size || 0);
    });

    state.duration = Math.max(0.5, totalDur);
    if (resetTime) {
      state.trimStart = 0;
      state.trimEnd = state.duration;
      state.currentTime = 0;
      state.activeIdx = 0;
    } else {
      state.trimStart = Math.min(state.trimStart, Math.max(0, state.duration - 0.5));
      state.trimEnd = Math.min(state.duration, Math.max(state.trimStart + 0.5, state.duration));
      state.currentTime = Math.min(state.currentTime, state.duration - 0.05);
      state.activeIdx = Math.min(state.activeIdx, state.clips.length - 1);
    }

    document.getElementById('rawVideoName').innerText = `${state.clips.length} Đoạn Clip (${state.duration.toFixed(1)}s)`;
    const metaEl = document.getElementById('rawVideoMeta');
    if (metaEl) metaEl.innerText = `Tổng: ${formatSize(totalSize)} • Sẵn sàng tách/ghép & xuất MP4`;

    renderClipUI();
    syncTrimUI();
    resizeCanvas();
    switchClip(state.currentTime, state.isPlaying);
  }

  function renderClipUI() {
    const countEl = document.getElementById('clipCountBadge');
    const listEl = document.getElementById('clipListItems');
    const blocksEl = document.getElementById('timelineClipBlocks');
    if (countEl) countEl.innerText = state.clips.length;

    if (listEl) {
      listEl.innerHTML = state.clips.map((c, i) => `
        <div onclick="EditorCore.selectClip(${i})" class="flex items-center justify-between px-2 py-1 rounded text-[11px] cursor-pointer border ${i === state.activeIdx ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}">
          <span class="truncate flex-1"><b class="text-indigo-400">#${i + 1}</b> ${escapeHtml(c.name)} <span class="text-zinc-500">(${c.duration.toFixed(1)}s)</span></span>
          <div class="flex items-center gap-1 ml-1 shrink-0">
            <button type="button" onclick="event.stopPropagation();EditorCore.moveClip(${i},-1)" class="px-1 text-zinc-400 hover:text-white" title="Lên">↑</button>
            <button type="button" onclick="event.stopPropagation();EditorCore.moveClip(${i},1)" class="px-1 text-zinc-400 hover:text-white" title="Xuống">↓</button>
            <button type="button" onclick="event.stopPropagation();EditorCore.removeClipAt(${i})" class="px-1 text-zinc-500 hover:text-red-400" title="Xóa">✕</button>
          </div>
        </div>
      `).join('');
    }

    if (blocksEl) {
      const palette = [
        'bg-indigo-600/45 border-indigo-400/70',
        'bg-purple-600/45 border-purple-400/70',
        'bg-pink-600/45 border-pink-400/70',
        'bg-sky-600/45 border-sky-400/70',
        'bg-emerald-600/45 border-emerald-400/70'
      ];
      blocksEl.innerHTML = state.clips.map((c, i) => {
        const wPct = (c.duration / state.duration) * 100;
        const activeRing = i === state.activeIdx ? 'ring-2 ring-inset ring-white z-10' : '';
        return `<div onclick="event.stopPropagation();EditorCore.selectClip(${i})" style="width:${wPct}%" class="h-full border-r border-zinc-950 px-1.5 flex items-center text-[10px] font-semibold text-white truncate ${palette[i % palette.length]} ${activeRing}">#${i + 1} ${escapeHtml(c.name)}</div>`;
      }).join('');
    }
  }

  function selectClip(idx) {
    if (!state.clips[idx]) return;
    state.activeIdx = idx;
    state.currentTime = state.clips[idx].startOffset + 0.02;
    renderClipUI();
    switchClip(state.currentTime, state.isPlaying);
  }

  function switchClip(globalTime, shouldPlay = false) {
    if (!state.clips.length) return;
    let idx = state.clips.findIndex((c) => globalTime >= c.startOffset && globalTime < c.startOffset + c.duration);
    if (idx === -1) idx = state.clips.length - 1;

    const clip = state.clips[idx];
    const idxChanged = state.activeIdx !== idx;
    state.activeIdx = idx;
    if (idxChanged) renderClipUI();

    if (clip.isDemo) {
      videoEl.pause();
      return;
    }

    const localTarget = clip.inPoint + Math.max(0, Math.min(clip.duration - 0.04, globalTime - clip.startOffset));
    if (loadedVideoUrl !== clip.url) {
      loadedVideoUrl = clip.url;
      videoEl.src = clip.url;
      videoEl.playbackRate = state.speed;
      videoEl.muted = state.isMuted;
      videoEl.onloadeddata = () => {
        videoEl.currentTime = localTarget;
        if (shouldPlay) videoEl.play().catch(() => {});
        else drawFrame(ctx, canvas.width, canvas.height, false);
      };
    } else {
      if (Math.abs(videoEl.currentTime - localTarget) > 0.2 && !videoEl.seeking) {
        videoEl.currentTime = localTarget;
      }
      videoEl.playbackRate = state.speed;
      videoEl.muted = state.isMuted;
      if (shouldPlay && videoEl.paused) videoEl.play().catch(() => {});
    }
  }

  // CapCut Dock Actions
  function split() {
    if (!state.clips.length) return alert('Hãy nạp video hoặc bật Video Mẫu trước khi tách!');
    const idx = state.clips.findIndex((c) => state.currentTime >= c.startOffset && state.currentTime < c.startOffset + c.duration);
    if (idx === -1) return;
    const clip = state.clips[idx];
    const rel = state.currentTime - clip.startOffset;
    if (rel < 0.25 || clip.duration - rel < 0.25) {
      return alert('Hãy di chuyển kim phát vào khoảng giữa đoạn clip (cách mép ít nhất 0.3s) để tách!');
    }
    saveHistory();
    const part1 = { ...clip, id: 'C-' + Math.random().toString(36).slice(2, 7), outPoint: clip.inPoint + rel, duration: rel };
    const part2 = { ...clip, id: 'C-' + Math.random().toString(36).slice(2, 7), name: clip.name + ' (P2)', inPoint: clip.inPoint + rel, duration: clip.duration - rel };
    state.clips.splice(idx, 1, part1, part2);
    rebuildClips(false);
  }

  function splitByTimestamps(cutTimesSec) {
    if (!state.clips.length || !Array.isArray(cutTimesSec) || !cutTimesSec.length) return;
    saveHistory();
    const sorted = [...cutTimesSec].filter((t) => t > 0.3 && t < state.duration - 0.3).sort((a, b) => b - a);
    sorted.forEach((t) => {
      const idx = state.clips.findIndex((c) => t > c.startOffset + 0.25 && t < c.startOffset + c.duration - 0.25);
      if (idx === -1) return;
      const c = state.clips[idx];
      const rel = t - c.startOffset;
      const p1 = { ...c, id: 'C-' + Math.random().toString(36).slice(2, 7), outPoint: c.inPoint + rel, duration: rel };
      const p2 = { ...c, id: 'C-' + Math.random().toString(36).slice(2, 7), name: c.name + ' (Cut)', inPoint: c.inPoint + rel, duration: c.duration - rel };
      state.clips.splice(idx, 1, p1, p2);
      // Recompute offsets for remaining cuts
      let acc = 0;
      state.clips.forEach((x) => { x.startOffset = acc; acc += x.duration; });
    });
    rebuildClips(false);
  }

  function duplicate() {
    if (!state.clips.length) return;
    saveHistory();
    const idx = Math.max(0, Math.min(state.activeIdx, state.clips.length - 1));
    const clone = { ...state.clips[idx], id: 'C-' + Math.random().toString(36).slice(2, 7), name: state.clips[idx].name + ' (Copy)' };
    state.clips.splice(idx + 1, 0, clone);
    rebuildClips(false);
  }

  function remove() {
    if (!state.clips.length) return;
    removeClipAt(Math.max(0, Math.min(state.activeIdx, state.clips.length - 1)));
  }

  function flip() {
    saveHistory();
    state.flipH = !state.flipH;
  }

  function rotate() {
    saveHistory();
    state.rotateDeg = (state.rotateDeg + 90) % 360;
  }

  function cycleSpeed() {
    saveHistory();
    const steps = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const cur = steps.indexOf(state.speed);
    const next = steps[(cur + 1) % steps.length] || 1.0;
    const slider = document.getElementById('insSpeedSlider');
    if (slider) slider.value = next;
    state.speed = next;
    videoEl.playbackRate = next;
    syncInspectorInputs();
  }

  function toggleMute() {
    state.isMuted = !state.isMuted;
    videoEl.muted = state.isMuted;
    const btn = document.getElementById('btnQuickMute');
    if (btn) btn.innerHTML = state.isMuted ? '<i class="fa-solid fa-volume-xmark text-red-400"></i>' : '<i class="fa-solid fa-volume-high text-zinc-300"></i>';
  }

  function snapshot() {
    if (!state.hasVideo) return alert('Hãy nạp video trước khi chụp khung hình!');
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `AutoCut_Frame_${Date.now()}.png`;
    a.click();
  }

  // ===========================================================================
  // 5. INSPECTOR CONTROLS (TRIM, COLOR, SUBTITLES, LOGO, AUDIO/SFX)
  // ===========================================================================
  function switchTab(tab) {
    document.querySelectorAll('.ins-tab').forEach((b) => {
      b.className = 'ins-tab py-2.5 text-zinc-400 hover:text-white';
    });
    const activeBtn = document.getElementById('ins-tab-' + tab);
    if (activeBtn) activeBtn.className = 'ins-tab py-2.5 text-indigo-400 border-b-2 border-indigo-500';
    document.querySelectorAll('.ins-panel').forEach((p) => p.classList.add('hidden'));
    const panel = document.getElementById('ins-panel-' + tab);
    if (panel) panel.classList.remove('hidden');
  }

  function syncInspectorInputs() {
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    setVal('insZoomSlider', Math.round(state.zoom * 100));
    setTxt('insZoomVal', Math.round(state.zoom * 100) + '%');
    setVal('insSpeedSlider', state.speed);
    setTxt('insSpeedVal', state.speed.toFixed(1) + 'x');
    setTxt('dockSpeedLabel', state.speed.toFixed(1) + 'x');
    const az = document.getElementById('insAutoZoom');
    if (az) az.checked = state.autoZoom;
    setVal('insTransition', state.transition);
    setTxt('tlTransBadge', state.transition === 'none' ? 'Fade: Tắt' : state.transition.toUpperCase());
    setVal('insBrightSlider', state.filters.brightness);
    setTxt('insBrightVal', state.filters.brightness + '%');
    setVal('insContrastSlider', state.filters.contrast);
    setTxt('insContrastVal', state.filters.contrast + '%');
    setVal('insSaturateSlider', state.filters.saturate);
    setTxt('insSaturateVal', state.filters.saturate + '%');
    setVal('insSubInput', state.text.lines.join('\n'));
    setVal('insTextColor', state.text.color);
    setVal('insTextBg', state.text.bgColor);
    setVal('insFontSizeSlider', state.text.size);
    setTxt('insFontSizeVal', state.text.size + 'px');
    renderSfxList();
  }

  function syncTrimUI() {
    const s = document.getElementById('insTrimStartSlider');
    const e = document.getElementById('insTrimEndSlider');
    if (s && e) {
      s.max = state.duration; e.max = state.duration;
      s.value = state.trimStart; e.value = state.trimEnd;
    }
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    setTxt('insTrimStartVal', state.trimStart.toFixed(1) + 's');
    setTxt('insTrimEndVal', state.trimEnd.toFixed(1) + 's');
    setTxt('trimRangeLabel', `${state.trimStart.toFixed(1)}s - ${state.trimEnd.toFixed(1)}s`);
    setTxt('totalDurationDisplay', formatTime(state.duration));

    const hl = document.getElementById('trimHighlight');
    if (hl && state.duration > 0) {
      hl.style.left = ((state.trimStart / state.duration) * 100) + '%';
      hl.style.width = (((state.trimEnd - state.trimStart) / state.duration) * 100) + '%';
    }
  }

  function updateTrimFromSliders() {
    let s = parseFloat(document.getElementById('insTrimStartSlider').value);
    let e = parseFloat(document.getElementById('insTrimEndSlider').value);
    if (s >= e - 0.3) s = Math.max(0, e - 0.3);
    state.trimStart = s;
    state.trimEnd = e;
    syncTrimUI();
  }

  function markIn() {
    if (state.currentTime < state.trimEnd - 0.3) {
      state.trimStart = Number(state.currentTime.toFixed(1));
      syncTrimUI();
    }
  }

  function markOut() {
    if (state.currentTime > state.trimStart + 0.3) {
      state.trimEnd = Number(state.currentTime.toFixed(1));
      syncTrimUI();
    }
  }

  function resetTrim() {
    state.trimStart = 0;
    state.trimEnd = state.duration;
    syncTrimUI();
  }

  function updateTransform() {
    const z = parseInt(document.getElementById('insZoomSlider').value, 10);
    state.zoom = z / 100;
    document.getElementById('insZoomVal').innerText = z + '%';
  }

  function updateSpeed() {
    const sp = parseFloat(document.getElementById('insSpeedSlider').value);
    state.speed = sp;
    videoEl.playbackRate = sp;
    document.getElementById('insSpeedVal').innerText = sp.toFixed(1) + 'x';
    const dl = document.getElementById('dockSpeedLabel');
    if (dl) dl.innerText = sp.toFixed(1) + 'x';
  }

  function setAutoZoom(val) { state.autoZoom = Boolean(val); }
  function setTransition(val) {
    state.transition = val;
    const badge = document.getElementById('tlTransBadge');
    if (badge) badge.innerText = val === 'none' ? 'Fade: Tắt' : val.toUpperCase();
  }

  function applyColorPreset(preset) {
    let b = 100, c = 100, s = 100;
    if (preset === 'silver') { b = 108; c = 114; s = 96; }
    else if (preset === 'vivid') { b = 105; c = 116; s = 135; }
    else if (preset === 'cinematic') { b = 95; c = 122; s = 88; }
    state.filters = { brightness: b, contrast: c, saturate: s };
    syncInspectorInputs();
  }

  function updateFilters() {
    state.filters.brightness = parseInt(document.getElementById('insBrightSlider').value, 10);
    state.filters.contrast = parseInt(document.getElementById('insContrastSlider').value, 10);
    state.filters.saturate = parseInt(document.getElementById('insSaturateSlider').value, 10);
    document.getElementById('insBrightVal').innerText = state.filters.brightness + '%';
    document.getElementById('insContrastVal').innerText = state.filters.contrast + '%';
    document.getElementById('insSaturateVal').innerText = state.filters.saturate + '%';
  }

  function setTextVisible(v) { state.text.visible = Boolean(v); }
  function setTextKinetic(v) { state.text.kinetic = Boolean(v); }
  function parseSubtitles() {
    const raw = document.getElementById('insSubInput').value;
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    state.text.lines = lines.length ? lines : [''];
  }
  function updateTextStyle() {
    state.text.color = document.getElementById('insTextColor').value;
    state.text.bgColor = document.getElementById('insTextBg').value;
    state.text.size = parseInt(document.getElementById('insFontSizeSlider').value, 10);
    document.getElementById('insFontSizeVal').innerText = state.text.size + 'px';
  }

  function handleBgmUpload(e) {
    const f = e.target.files[0];
    if (!f) return;
    document.getElementById('bgmName').innerText = f.name;
    bgmEl.src = URL.createObjectURL(f);
    updateAudioVolumes();
    if (state.isPlaying) bgmEl.play().catch(() => {});
  }

  function handleLogoUpload(e) {
    const f = e.target.files[0];
    if (!f) return;
    document.getElementById('logoName').innerText = f.name;
    const tl = document.getElementById('tlLogoPreview');
    if (tl) tl.innerText = f.name;
    const img = new Image();
    img.onload = () => {
      state.logo.img = img;
      state.logo.visible = true;
      const chk = document.getElementById('insShowLogo');
      if (chk) chk.checked = true;
    };
    img.src = URL.createObjectURL(f);
  }

  function setLogoVisible(v) { state.logo.visible = Boolean(v); }
  function updateLogoStyle() {
    state.logo.scalePct = parseInt(document.getElementById('insLogoScaleSlider').value, 10);
    state.logo.opacity = parseInt(document.getElementById('insLogoOpacitySlider').value, 10) / 100;
    document.getElementById('insLogoScaleVal').innerText = state.logo.scalePct + '%';
    document.getElementById('insLogoOpacityVal').innerText = Math.round(state.logo.opacity * 100) + '%';
  }
  function snapLogo(corner) {
    if (corner === 'tl') { state.logo.xRatio = 0.16; state.logo.yRatio = 0.10; }
    if (corner === 'tr') { state.logo.xRatio = 0.84; state.logo.yRatio = 0.10; }
    if (corner === 'bl') { state.logo.xRatio = 0.16; state.logo.yRatio = 0.88; }
    if (corner === 'br') { state.logo.xRatio = 0.84; state.logo.yRatio = 0.88; }
  }

  function updateAudioVolumes() {
    const ov = parseInt(document.getElementById('insOrigVolSlider').value, 10) / 100;
    const bv = parseInt(document.getElementById('insBgmVolSlider').value, 10) / 100;
    videoEl.volume = ov;
    bgmEl.volume = bv;
    if (vidGainNode) vidGainNode.gain.value = ov;
    if (bgmGainNode) bgmGainNode.gain.value = bv;
    document.getElementById('insOrigVolVal').innerText = Math.round(ov * 100) + '%';
    document.getElementById('insBgmVolVal').innerText = Math.round(bv * 100) + '%';
  }

  function addSfx(type) {
    playSynthSfx(type);
    const labels = { whoosh: 'Whoosh', pop: 'Pop!', ding: 'Ding ✨', bass: 'Bass' };
    state.sfxEvents.push({ time: Number(state.currentTime.toFixed(1)), type, label: labels[type] || type });
    renderSfxList();
  }

  function clearSfx() {
    state.sfxEvents = [];
    renderSfxList();
  }

  function renderSfxList() {
    const box = document.getElementById('tlSfxList');
    if (!box) return;
    if (!state.sfxEvents.length) {
      box.innerHTML = '<span class="text-[10px] text-zinc-600 italic">Trống</span>';
      return;
    }
    box.innerHTML = state.sfxEvents.map((s) =>
      `<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] shrink-0">${s.label}@${s.time}s</span>`
    ).join('');
  }

  // ===========================================================================
  // 6. CANVAS RENDERING, WORD-WRAPPED SUBTITLES, DRAG & PLAYBACK LOOP
  // ===========================================================================
  function setAspectRatio(ratio) {
    if (!['9:16', '16:9', '1:1', '4:5'].includes(ratio)) ratio = '9:16';
    state.aspectRatio = ratio;
    document.querySelectorAll('.ratio-btn').forEach((btn) => {
      const active = btn.dataset.ratio === ratio;
      btn.className = active
        ? 'ratio-btn px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-600 text-white'
        : 'ratio-btn px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 hover:text-white';
    });
    resizeCanvas();
    updateExportPixelLabel();
  }

  function toggleSafeZones() {
    state.showSafeZones = !state.showSafeZones;
    const btn = document.getElementById('safeZoneBtn');
    if (btn) {
      btn.className = state.showSafeZones
        ? 'px-2.5 py-1 rounded-lg bg-pink-600/20 text-pink-300 border border-pink-500/40 font-semibold transition'
        : 'px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white transition';
    }
  }

  function resizeCanvas() {
    const container = document.getElementById('viewportContainer');
    if (!container) return;
    const maxH = Math.max(260, container.clientHeight - 28);
    const maxW = Math.max(220, container.clientWidth - 28);
    const rv = state.aspectRatio === '16:9' ? 16 / 9 : state.aspectRatio === '1:1' ? 1 : state.aspectRatio === '4:5' ? 4 / 5 : 9 / 16;
    let h = maxH;
    let w = h * rv;
    if (w > maxW) { w = maxW; h = w / rv; }
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
  }

  function togglePlay() {
    if (!state.hasVideo) return;
    initAudioGraph();
    state.isPlaying = !state.isPlaying;
    document.getElementById('playPauseBtn').innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    if (state.isPlaying) {
      if (state.currentTime < state.trimStart || state.currentTime >= state.trimEnd) state.currentTime = state.trimStart;
      switchClip(state.currentTime, true);
      if (bgmEl.src) bgmEl.play().catch(() => {});
    } else {
      videoEl.pause();
      if (bgmEl.src) bgmEl.pause();
    }
  }

  function skipStart() {
    state.currentTime = state.trimStart;
    state.lastTriggeredSfxIdx = -1;
    switchClip(state.trimStart, state.isPlaying);
  }

  function step(delta) {
    if (!state.hasVideo) return;
    state.currentTime = Math.max(0, Math.min(state.duration - 0.05, state.currentTime + delta));
    switchClip(state.currentTime, state.isPlaying);
  }

  function getActiveSubtitle() {
    const lines = state.text.lines;
    if (!lines || !lines.length) return '';
    if (lines.length === 1) return lines[0];
    const dur = Math.max(0.5, state.trimEnd - state.trimStart);
    const el = Math.max(0, state.currentTime - state.trimStart);
    return lines[Math.min(lines.length - 1, Math.floor((el / dur) * lines.length))];
  }

  function drawRoundedRect(c, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  function drawWrappedSubtitle(tc, textStr, cx, cy, maxW, fontSize, bgColor, textColor, sr) {
    tc.font = `800 ${fontSize}px Inter, sans-serif`;
    tc.textAlign = 'center';
    tc.textBaseline = 'middle';

    const words = textStr.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (tc.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);

    let widest = 0;
    lines.forEach((l) => { const m = tc.measureText(l).width; if (m > widest) widest = m; });

    const lh = fontSize * 1.28;
    const padX = 14 * sr;
    const padY = 8 * sr;
    const bw = Math.min(maxW + padX * 2, widest + padX * 2);
    const bh = lines.length * lh + padY * 1.6;

    tc.fillStyle = bgColor;
    drawRoundedRect(tc, cx - bw / 2, cy - bh / 2, bw, bh, 8 * sr);
    tc.fill();

    tc.fillStyle = textColor;
    const startY = cy - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => tc.fillText(l, cx, startY + i * lh));
  }

  function drawFrame(tc, w, h, isExportOrCapture = false) {
    tc.save();
    tc.fillStyle = '#000';
    tc.fillRect(0, 0, w, h);

    tc.filter = `brightness(${state.filters.brightness}%) contrast(${state.filters.contrast}%) saturate(${state.filters.saturate}%)`;
    const pulse = state.autoZoom ? (1 + Math.sin(state.currentTime * 3) * 0.04) : 1;
    const z = state.zoom * pulse;

    tc.translate(w / 2, h / 2);
    if (state.rotateDeg) tc.rotate((state.rotateDeg * Math.PI) / 180);
    tc.scale(state.flipH ? -z : z, z);
    tc.translate(-w / 2, -h / 2);

    const curClip = state.clips[state.activeIdx];
    if (curClip && curClip.isDemo) {
      const grad = tc.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#18181b');
      grad.addColorStop(0.5, '#27272a');
      grad.addColorStop(1, '#09090b');
      tc.fillStyle = grad;
      tc.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.44 + Math.sin(state.currentTime * 2) * 8;
      const rad = Math.min(w, h) * 0.22;
      const rg = tc.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad);
      rg.addColorStop(0, '#f4f4f5');
      rg.addColorStop(0.4, '#a1a1aa');
      rg.addColorStop(0.6, '#ffffff');
      rg.addColorStop(1, '#71717a');
      tc.strokeStyle = rg;
      tc.lineWidth = rad * 0.24;
      tc.beginPath();
      tc.arc(cx, cy, rad, 0, Math.PI * 2);
      tc.stroke();
    } else if (videoEl.readyState >= 2) {
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      const scale = Math.max(w / vw, h / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      tc.drawImage(videoEl, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
    tc.restore();

    // Transitions
    const elapsed = state.currentTime - state.trimStart;
    const remain = state.trimEnd - state.currentTime;
    if (state.transition === 'fade') {
      let a = 0;
      if (elapsed < 0.6) a = 1 - elapsed / 0.6;
      else if (remain < 0.6) a = 1 - remain / 0.6;
      if (a > 0) {
        tc.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, a))})`;
        tc.fillRect(0, 0, w, h);
      }
    } else if (state.transition === 'flash' && elapsed < 0.3) {
      const fa = Math.max(0, (1 - elapsed / 0.3) * 0.85);
      tc.fillStyle = `rgba(255,255,255,${fa})`;
      tc.fillRect(0, 0, w, h);
    }

    // Logo Layer
    if (state.logo.visible && state.logo.img) {
      tc.save();
      tc.globalAlpha = state.logo.opacity;
      const lw = w * (state.logo.scalePct / 100);
      const lh = lw * (state.logo.img.height / state.logo.img.width);
      tc.drawImage(state.logo.img, w * state.logo.xRatio - lw / 2, h * state.logo.yRatio - lh / 2, lw, lh);
      tc.restore();
    }

    // Wrapped Multi-Line Subtitle Layer
    const activeSub = getActiveSubtitle();
    if (state.text.visible && activeSub.trim()) {
      tc.save();
      const sr = w / 360;
      const fs = Math.round(state.text.size * sr);
      let str = activeSub;
      if (state.text.kinetic) {
        const ws = str.split(' ');
        const ai = Math.floor(state.currentTime * 3) % ws.length;
        str = ws.map((wd, i) => (i === ai ? `[ ${wd} ]` : wd)).join(' ');
      }
      drawWrappedSubtitle(tc, str, w * state.text.xRatio, h * state.text.yRatio, w * 0.82, fs, state.text.bgColor, state.text.color, sr);
      tc.restore();
    }

    // Safe Zone Guides
    if (state.showSafeZones && !isExportOrCapture) {
      tc.save();
      tc.strokeStyle = 'rgba(236, 72, 153, 0.65)';
      tc.setLineDash([5, 5]);
      tc.lineWidth = 1;
      tc.strokeRect(w * 0.06, h * 0.12, w * 0.78, h * 0.68);
      tc.fillStyle = 'rgba(236, 72, 153, 0.9)';
      tc.font = '10px Inter, sans-serif';
      tc.fillText('Vùng An Toàn TikTok/Reels', w * 0.08, h * 0.11);
      tc.restore();
    }
  }

  // Timeline Scrubbing & Canvas Dragging
  let isScrubbing = false;
  function moveScrub(e) {
    const track = document.getElementById('scrubberTrack');
    if (!track || !state.hasVideo) return;
    const r = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    state.currentTime = pct * state.duration;
    state.lastTriggeredSfxIdx = -1;
    switchClip(state.currentTime, state.isPlaying);
  }

  document.getElementById('scrubberTrack')?.addEventListener('mousedown', (e) => {
    isScrubbing = true;
    moveScrub(e);
  });

  function onPointerDown(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const x = (cx - r.left) / r.width;
    const y = (cy - r.top) / r.height;
    if (state.logo.visible && state.logo.img && Math.abs(x - state.logo.xRatio) < 0.18 && Math.abs(y - state.logo.yRatio) < 0.18) {
      state.dragTarget = 'logo';
      state.dragOffsetX = x - state.logo.xRatio;
      state.dragOffsetY = y - state.logo.yRatio;
      return;
    }
    if (state.text.visible && Math.abs(x - state.text.xRatio) < 0.42 && Math.abs(y - state.text.yRatio) < 0.18) {
      state.dragTarget = 'text';
      state.dragOffsetX = x - state.text.xRatio;
      state.dragOffsetY = y - state.text.yRatio;
    }
  }

  function onPointerMove(cx, cy) {
    if (!state.dragTarget) return;
    const r = canvas.getBoundingClientRect();
    const nx = Math.max(0.06, Math.min(0.94, (cx - r.left) / r.width - state.dragOffsetX));
    const ny = Math.max(0.06, Math.min(0.94, (cy - r.top) / r.height - state.dragOffsetY));
    if (state.dragTarget === 'logo') { state.logo.xRatio = nx; state.logo.yRatio = ny; }
    else if (state.dragTarget === 'text') { state.text.xRatio = nx; state.text.yRatio = ny; }
  }

  canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', (e) => { if (e.touches[0]) onPointerDown(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('mousemove', (e) => {
    if (isScrubbing) moveScrub(e);
    if (state.dragTarget) onPointerMove(e.clientX, e.clientY);
  });
  window.addEventListener('touchmove', (e) => { if (state.dragTarget && e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('mouseup', () => { isScrubbing = false; state.dragTarget = null; });
  window.addEventListener('touchend', () => { isScrubbing = false; state.dragTarget = null; });
  window.addEventListener('resize', resizeCanvas);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
   if (!e.key) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key.toLowerCase() === 's') { e.preventDefault(); split(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (e.key.toLowerCase() === 'i') markIn();
    else if (e.key.toLowerCase() === 'o') markOut();
    else if (e.key === 'ArrowLeft') step(-0.5);
    else if (e.key === 'ArrowRight') step(0.5);
  });

  // Main Animation Loop
  let lastNow = performance.now();
  function renderLoop(now) {
    const dt = (now - lastNow) / 1000;
    lastNow = now;

    if (state.hasVideo && state.clips.length) {
      if (state.isPlaying) {
        const curClip = state.clips[state.activeIdx] || state.clips[0];
        if (curClip.isDemo) {
          state.currentTime += dt * state.speed;
          if (state.currentTime >= curClip.startOffset + curClip.duration) {
            const nx = state.activeIdx + 1;
            if (nx < state.clips.length && state.clips[nx].startOffset < state.trimEnd) {
              switchClip(state.clips[nx].startOffset, true);
            } else if (!isExporting) {
              state.currentTime = state.trimStart;
              state.lastTriggeredSfxIdx = -1;
              switchClip(state.trimStart, true);
            }
          }
        } else {
          const rel = videoEl.currentTime - curClip.inPoint;
          state.currentTime = curClip.startOffset + Math.max(0, rel);
          if (videoEl.ended || videoEl.currentTime >= curClip.outPoint - 0.05) {
            const nx = state.activeIdx + 1;
            if (nx < state.clips.length && state.clips[nx].startOffset < state.trimEnd) {
              switchClip(state.clips[nx].startOffset, true);
            } else if (!isExporting) {
              state.currentTime = state.trimStart;
              state.lastTriggeredSfxIdx = -1;
              switchClip(state.trimStart, true);
            }
          }
        }

        if (!isExporting && state.currentTime >= state.trimEnd) {
          state.currentTime = state.trimStart;
          state.lastTriggeredSfxIdx = -1;
          switchClip(state.trimStart, true);
        }

        // Trigger SFX events
        state.sfxEvents.forEach((ev, idx) => {
          if (Math.abs(state.currentTime - ev.time) < 0.08 && state.lastTriggeredSfxIdx !== idx) {
            playSynthSfx(ev.type);
            state.lastTriggeredSfxIdx = idx;
          }
        });
      }

      const tlText = document.getElementById('tlTextPreview');
      if (tlText) tlText.innerText = getActiveSubtitle() || 'AUTOCUT';
      const curDisp = document.getElementById('currentTimeDisplay');
      if (curDisp) curDisp.innerText = formatTime(state.currentTime);
      const ph = document.getElementById('playhead');
      if (ph && state.duration > 0) ph.style.left = Math.min(100, (state.currentTime / state.duration) * 100) + '%';

      drawFrame(ctx, canvas.width, canvas.height, false);
    }
    requestAnimationFrame(renderLoop);
  }

  // ===========================================================================
  // 7. HIGH-RES AUDIO-MIXED MP4 EXPORT ENGINE (AUTH-INTEGRATED)
  // ===========================================================================
  function getExportDims() {
    const s = QUALITY_SPECS[state.exportQuality].shortDim;
    if (state.aspectRatio === '16:9') return { w: Math.round(s * 16 / 9), h: s };
    if (state.aspectRatio === '1:1') return { w: s, h: s };
    if (state.aspectRatio === '4:5') return { w: s, h: Math.round(s * 5 / 4) };
    return { w: s, h: Math.round(s * 16 / 9) };
  }

  function updateExportPixelLabel() {
    const d = getExportDims();
    const el = document.getElementById('exportExactPixel');
    if (el) el.innerText = `${d.w} × ${d.h} px (${state.aspectRatio})`;
  }

  function openExportModal() {
    if (!state.hasVideo) return alert('Vui lòng nạp video trước khi xuất!');
    const durEl = document.getElementById('exportDurationInfo');
    if (durEl) durEl.innerText = (state.trimEnd - state.trimStart).toFixed(1) + 's';
    selectExportQuality(state.exportQuality);
    window.AuthCore.openModal('exportModal');
  }

  function closeExportModal() {
    if (!isExporting) window.AuthCore.closeModal('exportModal');
  }

  function selectExportQuality(q) {
    const perms = window.AuthCore ? window.AuthCore.getPerms() : { export4k: false };
    if ((q === '2k' || q === '4k') && !perms.export4k) {
      alert('Xuất 2K / 4K yêu cầu Gói Pro / Studio hoặc quyền Chủ Sở Hữu!');
      q = '1080p';
    }
    state.exportQuality = q;
    document.querySelectorAll('.q-btn').forEach((b) => {
      b.className = 'q-btn p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500 text-left transition';
    });
    const active = document.getElementById('q-btn-' + q);
    if (active) active.className = 'q-btn p-3 rounded-xl bg-indigo-950/40 border-2 border-indigo-500 text-left transition';
    const ind = document.getElementById('outputResIndicator');
    if (ind) ind.innerText = QUALITY_SPECS[q].label;
    updateExportPixelLabel();
  }

  function buildRecorder(stream, bitrate) {
    const opts = [
      { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
      { mimeType: 'video/mp4', ext: 'mp4' },
      { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
      { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
      { mimeType: 'video/webm', ext: 'webm' }
    ];
    for (const c of opts) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
        try {
          return { recorder: new MediaRecorder(stream, { mimeType: c.mimeType, videoBitsPerSecond: bitrate }), mimeType: c.mimeType, ext: c.ext };
        } catch {}
      }
    }
    return { recorder: new MediaRecorder(stream), mimeType: 'video/webm', ext: 'webm' };
  }

  async function startExport() {
    if (isExporting) return;
    const progSec = document.getElementById('exportProgressSection');
    const progBar = document.getElementById('exportProgressBar');
    const progTxt = document.getElementById('exportPercentText');
    const renderBtn = document.getElementById('startRenderBtn');

    try {
      initAudioGraph();
      isExporting = true;
      progSec.classList.remove('hidden');
      renderBtn.disabled = true;

      const dims = getExportDims();
      const ec = document.createElement('canvas');
      ec.width = dims.width || dims.w;
      ec.height = dims.height || dims.h;
      const ectx = ec.getContext('2d');

      state.currentTime = state.trimStart;
      state.lastTriggeredSfxIdx = -1;
      switchClip(state.trimStart, true);
      if (!state.isPlaying) togglePlay();

      drawFrame(ectx, ec.width, ec.height, true);

      const vStream = ec.captureStream(30);
      const mixed = new MediaStream();
      vStream.getVideoTracks().forEach((t) => mixed.addTrack(t));
      if (audioDest && audioDest.stream) {
        audioDest.stream.getAudioTracks().forEach((t) => mixed.addTrack(t));
      }

      let recBundle;
      try {
        recBundle = buildRecorder(mixed, QUALITY_SPECS[state.exportQuality].bitrate);
      } catch {
        // Safe fallback to pure video stream if browser rejects mixed tracks
        recBundle = buildRecorder(vStream, QUALITY_SPECS[state.exportQuality].bitrate);
      }

      const { recorder, mimeType, ext } = recBundle;
      const chunks = [];
      recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };

      const drawIv = setInterval(() => drawFrame(ectx, ec.width, ec.height, true), 33);
      recorder.onstop = () => {
        clearInterval(drawIv);
        isExporting = false;
        const blob = new Blob(chunks, { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `AutoCut_${state.exportQuality.toUpperCase()}_${ec.width}x${ec.height}_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        progSec.classList.add('hidden');
        renderBtn.disabled = false;
        closeExportModal();
      };

      const exactMs = Math.max(1500, ((state.trimEnd - state.trimStart) / state.speed) * 1000);
      recorder.start(250);
      const t0 = performance.now();
      const poll = setInterval(() => {
        const pct = Math.min(100, Math.round(((performance.now() - t0) / exactMs) * 100));
        progBar.style.width = pct + '%';
        progTxt.innerText = pct + '%';
        if (pct >= 100) {
          clearInterval(poll);
          if (recorder.state !== 'inactive') recorder.stop();
        }
      }, 80);
    } catch (err) {
      isExporting = false;
      alert('Lỗi xuất video: ' + err.message);
      progSec.classList.add('hidden');
      renderBtn.disabled = false;
    }
  }

  // ===========================================================================
  // 8. PHASE 3 AI BRIDGE API (CLEAN HOOKS FOR ai.js)
  // ===========================================================================
  function applyAIPlan(plan) {
    if (!plan) return;
    saveHistory();
    if (plan.aspectRatio) setAspectRatio(plan.aspectRatio);
    if (plan.filters) {
      state.filters = {
        brightness: Math.max(50, Math.min(160, Math.round(plan.filters.brightness || 100))),
        contrast: Math.max(50, Math.min(160, Math.round(plan.filters.contrast || 100))),
        saturate: Math.max(0, Math.min(180, Math.round(plan.filters.saturate || 100)))
      };
    } else if (plan.colorPreset) {
      applyColorPreset(plan.colorPreset);
    }
    if (Array.isArray(plan.subtitleLines) && plan.subtitleLines.length) {
      state.text.lines = plan.subtitleLines;
    }
    if (plan.textColor) state.text.color = plan.textColor;
    if (plan.bgColor) state.text.bgColor = plan.bgColor;
    if (typeof plan.speed === 'number') {
      state.speed = Math.max(0.5, Math.min(2.0, plan.speed));
      videoEl.playbackRate = state.speed;
    }
    if (typeof plan.autoZoom === 'boolean') state.autoZoom = plan.autoZoom;
    if (plan.transition) setTransition(plan.transition);
    if (Array.isArray(plan.cutTimes) && plan.cutTimes.length) {
      splitByTimestamps(plan.cutTimes);
    }
    if (Array.isArray(plan.sfxEvents)) {
      state.sfxEvents = plan.sfxEvents;
    }
    syncInspectorInputs();
    state.currentTime = state.trimStart;
    switchClip(state.trimStart, true);
    if (!state.isPlaying) togglePlay();
  }

  function getState() {
    return state;
  }

  function getVideoElement() {
    return videoEl;
  }

  // Expose Public API
  window.EditorCore = {
    loadDemoVideo, handleMultiVideoUpload, clearAllClips,
    moveClip, removeClipAt, selectClip,
    handleBgmUpload, handleLogoUpload,
    setAspectRatio, toggleSafeZones,
    togglePlay, skipStart, step, markIn, markOut, resetTrim,
    undo, redo, split, splitByTimestamps, duplicate, remove, flip, rotate, cycleSpeed, toggleMute, snapshot,
    switchTab, updateTrimFromSliders, updateTransform, updateSpeed, setAutoZoom, setTransition,
    applyColorPreset, updateFilters,
    setTextVisible, setTextKinetic, parseSubtitles, updateTextStyle,
    setLogoVisible, updateLogoStyle, snapLogo,
    updateAudioVolumes, addSfx, clearSfx,
    openExportModal, closeExportModal, selectExportQuality, startExport,
    // Phase 3 AI hooks
    applyAIPlan, getState, getVideoElement, drawFrame
  };

  // Boot EditorCore
  syncInspectorInputs();
  syncTrimUI();
  resizeCanvas();
  requestAnimationFrame(renderLoop);
})(window, document);
