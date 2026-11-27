/**
 * AutoCut Studio AI — Bộ Preset Dựng Nhanh Theo Ngành Hàng
 */
(function () {
  'use strict';

  const INDUSTRY_PRESETS = [
    {
      id: 'silver_jewelry',
      label: '✨ Bạc / Xi Bạch Kim',
      title: 'Giữ nguyên màu bạc trắng sáng chuẩn xi bạch kim, khử ám vàng, slow-motion tôn độ lấp lánh',
      prompt: 'Dựng video giới thiệu trang sức bạc xi bạch kim sang trọng, giữ nguyên sắc bạc trắng sáng tự nhiên tuyệt đối không ám vàng, bắt cận cảnh độ lấp lánh của bề mặt kim loại và đá, chuyển cảnh mượt mà nhịp nhàng theo nhạc nền tinh tế, chèn phụ đề giới thiệu chất liệu bạc cao cấp rõ nét.',
      brightness: 104,
      contrast: 112,
      saturate: 92,
      speed: 0.9
    },
    {
      id: 'fashion_lookbook',
      label: '👗 Thời Trang',
      title: 'Cắt theo nhịp beat, tôn chất liệu vải và form dáng',
      prompt: 'Dựng video lookbook thời trang hiện đại, cắt nhanh đúng nhịp beat ở các góc toàn cảnh và cận chất liệu vải, giữ màu sắc tươi tắn chuẩn màu trang phục, hiệu ứng chuyển cảnh năng động kèm phụ đề ngắn gọn bắt trend.',
      brightness: 103,
      contrast: 108,
      saturate: 112,
      speed: 1.0
    },
    {
      id: 'sales_review',
      label: '🛍️ Review Chốt Đơn',
      title: 'Hook 3 giây đầu mạnh, cắt gọn khoảng lặng, chữ lớn dễ đọc',
      prompt: 'Dựng video review sản phẩm nhịp độ nhanh 3 giây đầu gây chú ý mạnh, cắt gọn toàn bộ khoảng lặng, tập trung vào công dụng thực tế và góc cận chi tiết sản phẩm, chèn phụ đề chữ lớn nổi bật dễ đọc để tăng tỷ lệ chốt đơn.',
      brightness: 102,
      contrast: 110,
      saturate: 115,
      speed: 1.1
    },
    {
      id: 'cinematic_vlog',
      label: '🎬 Vlog Điện Ảnh',
      title: 'Chuyển cảnh mượt, màu ấm tự nhiên, phụ đề kể chuyện',
      prompt: 'Dựng video phong cách điện ảnh nhẹ nhàng, giữ các cú máy ổn định có chiều sâu cảm xúc, chuyển cảnh hòa tan mượt mà, cân chỉnh ánh sáng ấm áp tự nhiên và chèn phụ đề kể chuyện tinh tế.',
      brightness: 98,
      contrast: 106,
      saturate: 105,
      speed: 0.95
    }
  ];

  function findPromptBox() {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    if (textareas.length > 0) return textareas[0];
    return document.querySelector('input[placeholder*="mô tả"], input[placeholder*="yêu cầu"], input[placeholder*="dựng"]');
  }

  function applySliderByKeywords(keywords, value) {
    const inputs = Array.from(document.querySelectorAll('input[type="range"], input[type="number"]'));
    for (const input of inputs) {
      const context = (
        (input.id || '') + ' ' +
        (input.name || '') + ' ' +
        (input.parentElement ? input.parentElement.textContent : '')
      ).toLowerCase();

      if (keywords.some((kw) => context.includes(kw))) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  function applyPreset(preset) {
    const promptBox = findPromptBox();
    if (promptBox) {
      promptBox.value = preset.prompt;
      promptBox.dispatchEvent(new Event('input', { bubbles: true }));
      promptBox.dispatchEvent(new Event('change', { bubbles: true }));
      promptBox.focus();
    }

    // Tự động đồng bộ thanh trượt màu sắc & tốc độ nếu đang hiển thị trên giao diện
    applySliderByKeywords(['sáng', 'bright'], preset.brightness);
    applySliderByKeywords(['tương phản', 'contrast'], preset.contrast);
    applySliderByKeywords(['bão hòa', 'saturat'], preset.saturate);
    applySliderByKeywords(['tốc độ', 'speed'], preset.speed);

    window.__AUTOCUT_ACTIVE_PRESET__ = preset;
  }

  function mountPresetBar() {
    if (document.getElementById('ac-industry-preset-bar')) return;
    const promptBox = findPromptBox();
    if (!promptBox || !promptBox.parentElement) return;

    const bar = document.createElement('div');
    bar.id = 'ac-industry-preset-bar';
    bar.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; align-items:center;';

    const tag = document.createElement('span');
    tag.textContent = 'Mẫu nhanh:';
    tag.style.cssText = 'font-size:11px; font-weight:600; color:#94a3b8; margin-right:2px;';
    bar.appendChild(tag);

    INDUSTRY_PRESETS.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = p.label;
      btn.title = p.title;
      btn.style.cssText = [
        'background:#1a2236',
        'border:1px solid #2e3b5b',
        'color:#e2e8f0',
        'font-size:11px',
        'font-weight:600',
        'padding:4px 9px',
        'border-radius:999px',
        'cursor:pointer',
        'transition:all 0.15s'
      ].join(';');

      btn.onmouseenter = () => {
        btn.style.borderColor = '#8b5cf6';
        btn.style.background = '#252f4a';
      };
      btn.onmouseleave = () => {
        if (!btn.dataset.active) {
          btn.style.borderColor = '#2e3b5b';
          btn.style.background = '#1a2236';
        }
      };
      btn.onclick = () => {
        bar.querySelectorAll('button').forEach((b) => {
          delete b.dataset.active;
          b.style.borderColor = '#2e3b5b';
          b.style.background = '#1a2236';
          b.style.color = '#e2e8f0';
        });
        btn.dataset.active = '1';
        btn.style.borderColor = '#a78bfa';
        btn.style.background = '#312e81';
        btn.style.color = '#fff';
        applyPreset(p);
      };

      bar.appendChild(btn);
    });

    promptBox.parentElement.insertBefore(bar, promptBox);
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountPresetBar();
    setTimeout(mountPresetBar, 800);
  });
})();
