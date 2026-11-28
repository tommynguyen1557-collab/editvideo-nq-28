/**
 * AutoCut Studio AI — Add-on #1: 10 Industry Playbooks (Bộ Kịch Bản 10 Ngành Nghề)
 * Plugin cắm rời độc lập: Không sửa auth.js, crm.html, editor-ai-core.js hay worker.js.
 * Đồng bộ nhánh riêng: autocut_saas/studio_addons/v7_playbooks
 */
(function () {
  'use strict';

  const FIREBASE_BASE = 'https://autocut-studio-30130-default-rtdb.asia-southeast1.firebasedatabase.app';
  const SYNC_NODE = 'autocut_saas/studio_addons/v7_playbooks';
  const LOCAL_KEY = 'autocut_v7_playbook_state';

  const PLAYBOOKS = [
    {
      id: 'none',
      icon: '⚙️',
      shortName: 'Tự do (v6 gốc)',
      name: 'Chế độ tự do mặc định (v6.0)',
      lut: '',
      lutLabel: 'AI tự quyết định',
      pacing: 'Tự động theo video thô',
      reasoningMode: 'deep_director',
      textStyle: 'auto',
      bgmVol: 30,
      skills: null,
      sampleHint: '',
      aiBlueprint: ''
    },
    {
      id: 'jewelry_silver',
      icon: '💎',
      shortName: 'Trang sức / Bạc',
      name: 'Trang Sức & Bạc Xi Bạch Kim',
      lut: 'silver_platinum',
      lutLabel: 'Bạc Xi Bạch Kim (Khử ám vàng)',
      pacing: 'Chậm sang 0.85x–0.95x • Tôn ánh kim',
      reasoningMode: 'brand_preserve',
      textStyle: 'cinematic_clean',
      bgmVol: 26,
      skills: ['hook_3s', 'smart_focal', 'remotion_ease', 'fx_trans', 'pro_lut', 'kinetic_text', 'lower_third', 'stickers', 'end_card', 'sfx_synth'],
      sampleHint: 'Giữ nguyên màu bạc trắng xi bạch kim không ám vàng, quay chậm tôn độ sáng bề mặt, phụ đề tinh tế chốt inbox.',
      aiBlueprint: 'CHUYÊN NGÀNH TRANG SỨC & BẠC XI BẠCH KIM: BẮT BUỘC dùng lutPreset = "silver_platinum" để khử ám vàng tuyệt đối và giữ nguyên sắc bạc trắng sáng nguyên bản. Dùng tốc độ hơi chậm (0.85x–0.95x) ở cảnh cận chi tiết, chuyển cảnh ưu tiên light_leak hoặc fade mềm, SFX sparkle tinh tế, khóa tiêu điểm (focalX, focalY) thẳng vào sản phẩm trang sức. Văn phong sang trọng, nhấn mạnh độ hoàn thiện sắc nét và cảm giác đeo lên tay.'
    },
    {
      id: 'fashion',
      icon: '👗',
      shortName: 'Thời trang / OOTD',
      name: 'Thời Trang, Quần Áo & OOTD',
      lut: 'tiktok_commerce',
      lutLabel: 'Thương Mại TikTok Sắc Nét',
      pacing: 'Nhanh 1.6s–2.2s/cảnh • Bắt Beat',
      reasoningMode: 'viral_hook',
      textStyle: 'karaoke_box',
      bgmVol: 38,
      skills: ['hook_3s', 'smart_focal', 'beat_sync', 'remotion_ease', 'fx_trans', 'pro_lut', 'kinetic_text', 'stickers', 'end_card', 'sfx_synth'],
      sampleHint: 'Cắt nhanh theo nhịp nhạc khoe form dáng và chất vải, mở đầu 3 giây bằng góc quay đẹp nhất, phụ đề nổi bật dễ chốt đơn.',
      aiBlueprint: 'CHUYÊN NGÀNH THỜI TRANG & OOTD: BẮT BUỘC dùng lutPreset = "tiktok_commerce". Nhịp cắt nhanh dứt khoát 1.6s–2.2s mỗi cảnh (Pattern Interrupt), chuyển cảnh flash / zoom_burst / slide_left kết hợp SFX whoosh & boom. Đưa cảnh mặc lên dáng đẹp nhất lên 3 giây đầu làm Hook, khóa tiêu điểm theo dáng người mẫu. Phụ đề ngắn 4–5 từ nhấn form dáng, chất liệu và lời mời xem giỏ hàng/nhắn tin.'
    },
    {
      id: 'beauty',
      icon: '🧴',
      shortName: 'Mỹ phẩm / Skincare',
      name: 'Mỹ Phẩm, Skincare & Làm Đẹp',
      lut: 'clean_studio',
      lutLabel: 'Studio Sáng Mịn',
      pacing: 'Rõ ràng 2.0s–2.8s/cảnh • AIDA',
      reasoningMode: 'sales_converter',
      textStyle: 'hormozi',
      bgmVol: 25,
      skills: ['auto_silence', 'hook_3s', 'smart_focal', 'remotion_ease', 'fx_trans', 'pro_lut', 'kinetic_text', 'lower_third', 'stickers', 'end_card', 'sfx_synth'],
      sampleHint: 'Làm nổi bật kết cấu sản phẩm và cảm giác trên da, ánh sáng trong mịn sạch sẽ, lời bình tự nhiên tránh từ cấm y tế.',
      aiBlueprint: 'CHUYÊN NGÀNH MỸ PHẨM & SKINCARE: BẮT BUỘC dùng lutPreset = "clean_studio" tạo cảm giác da sạch mịn, ánh sáng trong trẻo. Cấu trúc AIDA: mở đầu nêu nỗi lo làn da hoặc khoe kết cấu sản phẩm cận cảnh → demo thao tác thoa → nêu cảm nhận thực tế → CTA. Lưu ý ngôn từ an toàn nền tảng (dùng "hỗ trợ cải thiện", "làm dịu", không khẳng định chữa trị 100%).'
    },
    {
      id: 'spa',
      icon: '💆',
      shortName: 'Spa / Thẩm mỹ',
      name: 'Spa, Clinic & Dịch Vụ Làm Đẹp',
      lut: 'clean_studio',
      lutLabel: 'Studio Sáng Mịn Tin Cậy',
      pacing: 'Êm dịu 2.5s–3.2s • Trải nghiệm thật',
      reasoningMode: 'sales_converter',
      textStyle: 'cinematic_clean',
      bgmVol: 22,
      skills: ['auto_silence', 'hook_3s', 'smart_focal', 'remotion_ease', 'fx_trans', 'pro_lut', 'kinetic_text', 'lower_third', 'end_card', 'sfx_synth'],
      sampleHint: 'Nhịp êm chuyên nghiệp, nhấn mạnh không gian sạch sẽ, quy trình chăm sóc kỹ và lời mời đặt lịch trải nghiệm.',
      aiBlueprint: 'CHUYÊN NGÀNH SPA & THẨM MỸ: BẮT BUỘC dùng lutPreset = "clean_studio". Chuyển động mượt easeInOutCubic, chuyển cảnh fade / light_leak nhẹ nhàng, không dùng glitch giật mạnh. Tập trung làm nổi bật sự thư giãn, tay nghề chuyên viên và thay đổi tích cực của khách hàng. EndCard kêu gọi đặt lịch hẹn tư vấn.'
    },
    {
      id: 'realestate',
      icon: '🏠',
      shortName: 'Bất động sản',
      name: 'Bất Động Sản, Nhà Phố & Căn Hộ',
      lut: 'luxury_contrast',
      lutLabel: 'Luxury Tương Phản Cao',
      pacing: 'Điện ảnh chậm 2.8s–3.5s/cảnh',
      reasoningMode: 'storyteller',
      textStyle: 'cinematic_clean',
      bgmVol: 25,
      skills: ['hook_3s', 'smart_focal', 'remotion_ease', 'fx_trans', 'film_grain', 'pro_lut', 'kinetic_text', 'lower_third', 'end_card', 'sfx_synth'],
      sampleHint: 'Dựng phong cách sang trọng, mở đầu bằng góc toàn cảnh đắt giá nhất, chèn phụ đề nhấn vị trí, diện tích và tiện ích.',
      aiBlueprint: 'CHUYÊN NGÀNH BẤT ĐỘNG SẢN: BẮT BUỘC dùng lutPreset = "luxury_contrast". Nhịp quay điềm tĩnh sang trọng 2.8s–3.5s/cảnh, easing = "easeInOutCubic", chuyển cảnh fade hoặc slide_left mượt. Lower-Third hiển thị tên dự án/khu vực, phụ đề nhấn thông số quan trọng (vị trí, diện tích, pháp lý, kết nối tiện ích). Lời bình chuyên nghiệp, đáng tin cậy.'
    },
    {
      id: 'automotive',
      icon: '🚗',
      shortName: 'Ô tô / Xe cộ',
      name: 'Ô Tô, Xe Máy & Phụ Kiện Xe',
      lut: 'cinematic_teal',
      lutLabel: 'Điện Ảnh Teal & Orange',
      pacing: 'Mạnh mẽ 1.8s–2.5s • SFX Boom',
      reasoningMode: 'viral_hook',
      textStyle: 'hormozi',
      bgmVol: 36,
      skills: ['hook_3s', 'smart_focal', 'beat_sync', 'remotion_ease', 'fx_trans', 'film_grain', 'pro_lut', 'kinetic_text', 'lower_third', 'end_card', 'sfx_synth'],
      sampleHint: 'Mở đầu mạnh mẽ bằng góc cận ngoại thất hoặc khởi động xe, chuyển cảnh dứt khoát kèm tiếng Bass Boom/Whoosh, nêu điểm đắt giá.',
      aiBlueprint: 'CHUYÊN NGÀNH Ô TÔ & XE CỘ: BẮT BUỘC dùng lutPreset = "cinematic_teal". Mở đầu cực mạnh với zoom_burst + SFX boom, các cảnh tiếp theo cắt dứt khoát giữa ngoại thất, nội thất và chi tiết nổi bật kèm SFX whoosh/shutter. Phụ đề mạnh mẽ ngắn gọn nhấn đời xe, cảm giác lái, trang bị đáng tiền.'
    },
    {
      id: 'fnb',
      icon: '🍜',
      shortName: 'F&B / Đồ ăn',
      name: 'Ẩm Thực, Quán Ăn & Cà Phê',
      lut: 'food_rich',
      lutLabel: 'Ẩm Thực Rực Rỡ Ngon Mắt',
      pacing: 'Nhanh cuốn 1.5s–2.2s • Cận món',
      reasoningMode: 'viral_hook',
      textStyle: 'karaoke_box',
      bgmVol: 32,
      skills: ['hook_3s', 'smart_focal', 'beat_sync', 'remotion_ease', 'fx_trans', 'pro_lut', 'kinetic_text', 'stickers', 'end_card', 'sfx_synth'],
      sampleHint: 'Đưa cảnh món ăn hấp dẫn nhất lên 3 giây đầu, màu rực rỡ ngon mắt, nhịp cắt nhanh, cuối video mời khách ghé thưởng thức.',
      aiBlueprint: 'CHUYÊN NGÀNH F&B, ĐỒ ĂN & CÀ PHÊ: BẮT BUỘC dùng lutPreset = "food_rich" tăng sức hấp dẫn màu sắc món ăn. 3 giây đầu phải là cảnh cận món ăn nóng hổi/kéo phô mai/rót đồ uống đẹp nhất. Cắt nhanh 1.5s–2.2s/cảnh, SFX pop/shutter/whoosh tạo sự giòn rụm sinh động. Lời bình gợi vị giác, kết thúc kêu gọi lưu địa chỉ hoặc rủ bạn đi ăn.'
    },
    {
      id: 'interior',
      icon: '🛋️',
      shortName: 'Nội thất / Decor',
      name: 'Nội Thất, Kiến Trúc & Decor',
      lut: 'warm_vlog',
      lutLabel: 'Vlog Điện Ảnh Ấm Áp',
      pacing: 'Thư thái 2.5s–3.2s • Ấm cúng',
      reasoningMode: 'storyteller',
      textStyle: 'minimal_lower',
      bgmVol: 28,
      skills: ['hook_3s', 'smart_focal', 'remotion_ease', 'fx_trans', 'film_grain', 'pro_lut', 'kinetic_text', 'lower_third', 'end_card', 'sfx_synth'],
      sampleHint: 'Tông màu ấm cúng dễ chịu, chuyển cảnh mềm không che mất bố cục phòng, nêu bật công năng và phong cách thiết kế.',
      aiBlueprint: 'CHUYÊN NGÀNH NỘI THẤT & DECOR: BẮT BUỘC dùng lutPreset = "warm_vlog". Phụ đề kiểu minimal_lower gọn thấp để không che không gian phòng. Chuyển cảnh ưu tiên light_leak và fade mượt, nhịp 2.5s–3.2s/cảnh giúp người xem kịp ngắm chi tiết vật liệu và ánh sáng.'
    },
    {
      id: 'tech_home',
      icon: '📱',
      shortName: 'Công nghệ / Gia dụng',
      name: 'Đồ Công Nghệ & Gia Dụng Thông Minh',
      lut: 'natural_crisp',
      lutLabel: 'Tự Nhiên Siêu Nét',
      pacing: 'Gọn súc tích 2.0s–2.5s • Demo tính năng',
      reasoningMode: 'sales_converter',
      textStyle: 'hormozi',
      bgmVol: 26,
      skills: ['auto_silence', 'hook_3s', 'smart_focal', 'remotion_ease', 'fx_trans', 'pro_lut', 'kinetic_text', 'lower_third', 'stickers', 'end_card', 'sfx_synth'],
      sampleHint: 'Mở đầu bằng vấn đề thường gặp, cắt nhanh vào cảnh test tính năng thật, phụ đề rõ ràng từng ưu điểm để chốt đơn.',
      aiBlueprint: 'CHUYÊN NGÀNH CÔNG NGHỆ & GIA DỤNG: BẮT BUỘC dùng lutPreset = "natural_crisp" giữ độ nét chi tiết sản phẩm. Cấu trúc: Vấn đề thực tế (3s đầu) → Demo giải pháp trực quan → 2-3 tính năng nổi bật gắn Sticker/Pop SFX → Chốt đơn. Phụ đề rõ ràng, súc tích, tập trung lợi ích tiết kiệm thời gian/công sức.'
    },
    {
      id: 'expert_edu',
      icon: '🎓',
      shortName: 'Chuyên gia / B2B',
      name: 'Chuyên Gia, Giáo Dục & Chia Sẻ Kiến Thức',
      lut: 'natural_crisp',
      lutLabel: 'Tự Nhiên Sắc Nét',
      pacing: 'Cắt khoảng lặng • Khóa tâm khuôn mặt',
      reasoningMode: 'deep_director',
      textStyle: 'typewriter',
      bgmVol: 16,
      skills: ['auto_silence', 'hook_3s', 'smart_focal', 'remotion_ease', 'pro_lut', 'kinetic_text', 'lower_third', 'end_card'],
      sampleHint: 'Cắt gọn toàn bộ khoảng lặng thừa, giữ mặt người nói đúng giữa khung hình, phụ đề dễ đọc nhấn ý chính.',
      aiBlueprint: 'CHUYÊN NGÀNH CHUYÊN GIA, GIÁO DỤC & B2B: BẮT BUỘC dùng lutPreset = "natural_crisp". Tối ưu cắt bỏ khoảng lặng thừa (Jump-Cut gọn), khóa tiêu điểm (focalX, focalY) chính xác vào khuôn mặt người nói. Không lạm dụng hiệu ứng chớp nháy rối mắt; dùng Lower-Third giới thiệu tên/chức danh và phụ đề nhấn đúng từ khóa giá trị.'
    }
  ];

  // ================= TRẠNG THÁI & ĐỒNG BỘ CLOUD CÁCH LY =================
  function loadLocalState() {
    try {
      const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (s && s.selectedId) return s;
    } catch (_) {}
    return { selectedId: 'none', updatedAt: 0 };
  }

  let state = loadLocalState();

  function getPlaybook(id) {
    return PLAYBOOKS.find((p) => p.id === id) || PLAYBOOKS[0];
  }

  function saveState(syncCloud = true) {
    state.updatedAt = Date.now();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    if (syncCloud) {
      fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(() => {});
    }
  }

  async function pullStateFromCloud() {
    try {
      const res = await fetch(`${FIREBASE_BASE}/${SYNC_NODE}.json`);
      if (!res.ok) return;
      const remote = await res.json();
      if (remote && remote.selectedId && Number(remote.updatedAt || 0) > Number(state.updatedAt || 0)) {
        state = { selectedId: remote.selectedId, updatedAt: remote.updatedAt };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
        updatePlaybookUI(false);
      }
    } catch (_) {}
  }

  // ================= ÁP CẤU HÌNH NGÀNH VÀO BẢNG v6.0 HIỆN CÓ (KHÔNG SỬA CODE CŨ) =================
  function applyPlaybookToV6Controls(pb) {
    if (!pb || pb.id === 'none') return;

    const modeEl = document.getElementById('ac-reasoning-mode');
    if (modeEl && pb.reasoningMode) {
      modeEl.value = pb.reasoningMode;
      modeEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const txtEl = document.getElementById('ac-text-style-pref');
    if (txtEl && pb.textStyle) {
      txtEl.value = pb.textStyle;
      txtEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const bgmEl = document.getElementById('ac-bgm-vol');
    if (bgmEl && typeof pb.bgmVol === 'number') {
      bgmEl.value = String(pb.bgmVol);
      bgmEl.dispatchEvent(new Event('input', { bubbles: true }));
      bgmEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (Array.isArray(pb.skills)) {
      document.querySelectorAll('#ac-skills-wrap .acp-skill').forEach((pill) => {
        const sid = pill.getAttribute('data-sid');
        const shouldBeOn = pb.skills.includes(sid);
        const isCurrentlyOn = pill.classList.contains('on');
        if (shouldBeOn !== isCurrentlyOn) {
          pill.click();
        }
      });
    }
  }

  // ================= NẠP CHỈ ĐẠO CHUYÊN NGÀNH VÀO LỆNH AI (KHÔNG SỬA worker.js) =================
  function installSafeFetchEnricher() {
    if (window.__acPlaybookFetchInstalled) return;
    window.__acPlaybookFetchInstalled = true;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const isProxyPost = url.includes('autocut-ai-proxy') && init && String(init.method || 'GET').toUpperCase() === 'POST' && typeof init.body === 'string';
        if (isProxyPost && state.selectedId && state.selectedId !== 'none') {
          const payload = JSON.parse(init.body);
          if (payload && payload.action === 'auto_scan_and_edit') {
            const pb = getPlaybook(state.selectedId);
            if (pb && pb.aiBlueprint) {
              const userPart = (payload.userHint || '').trim();
              payload.userHint = `[BỘ KỊCH BẢN NGÀNH ĐANG KÍCH HOẠT: ${pb.name}]\n${pb.aiBlueprint}${userPart ? `\n\n[YÊU CẦU RIÊNG CỦA NGƯỜI DÙNG]: ${userPart}` : ''}`;
              const nextInit = { ...init, body: JSON.stringify(payload) };
              return nativeFetch(input, nextInit);
            }
          }
        }
      } catch (_) {}
      return nativeFetch(input, init);
    };
  }

  // ================= DỰNG THẺ CHỌN 10 NGÀNH NGHỀ TRONG NGĂN KÉO v6.0 =================
  function updatePlaybookUI(alsoSyncControls = false) {
    const pb = getPlaybook(state.selectedId);
    document.querySelectorAll('#acpb-grid .acpb-chip').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pbid') === pb.id);
    });

    const info = document.getElementById('acpb-detail');
    if (info) {
      if (pb.id === 'none') {
        info.innerHTML = '<span style="color:#94a3b8;">Đang dùng chế độ tự do mặc định của v6.0. Bấm chọn 1 ngành phía trên để AI tự cài màu, nhịp cắt và kịch bản chuẩn ngành.</span>';
      } else {
        info.innerHTML = `
          <div style="color:#fbbf24; font-weight:700; margin-bottom:3px;">${pb.icon} Đang khóa kịch bản: ${pb.name}</div>
          <div style="color:#cbd5e1;">🎨 <b>Màu LUT:</b> ${pb.lutLabel} • ✂️ <b>Nhịp:</b> ${pb.pacing}</div>
          <div style="margin-top:5px;">
            <button type="button" id="acpb-fill-sample" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:600; cursor:pointer;">✨ Điền gợi ý mẫu ngành này vào ô yêu cầu</button>
          </div>
        `;
        const fillBtn = document.getElementById('acpb-fill-sample');
        if (fillBtn) {
          fillBtn.onclick = () => {
            const ta = document.getElementById('ac-auto-hint');
            if (ta) {
              ta.value = pb.sampleHint;
              ta.focus();
            }
          };
        }
      }
    }

    if (alsoSyncControls) {
      applyPlaybookToV6Controls(pb);
    }
  }

  function mountPlaybooksCard() {
    const tabAuto = document.getElementById('ac-tab-auto');
    if (!tabAuto || document.getElementById('acpb-card')) return false;

    const style = document.createElement('style');
    style.textContent = `
      #acpb-card { background:#11192d; border:1px solid #3b2f6e; border-radius:12px; padding:11px; margin-bottom:11px; }
      #acpb-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-top:6px; }
      .acpb-chip {
        text-align:left; padding:6px 8px; border-radius:8px; font-size:11px; font-weight:600;
        cursor:pointer; border:1px solid #263452; background:#0a0f1d; color:#cbd5e1;
        transition:all .15s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .acpb-chip:hover { border-color:#818cf8; color:#fff; }
      .acpb-chip.active {
        background:linear-gradient(135deg,#4f46e5,#7c3aed); border-color:#c4b5fd; color:#fff;
        box-shadow:0 4px 12px rgba(99,102,241,0.35);
      }
      #acpb-detail {
        margin-top:8px; padding:8px 9px; border-radius:8px; background:#090e1a;
        border:1px solid #1e293b; font-size:11px; line-height:1.45;
      }
    `;
    document.head.appendChild(style);

    const card = document.createElement('div');
    card.id = 'acpb-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; font-weight:800; color:#fbbf24; text-transform:uppercase;">📚 Kịch Bản Chuyên Sâu 10 Ngành Nghề</span>
        <span style="font-size:10px; color:#4ade80; font-weight:700;">Add-on #1</span>
      </div>
      <div id="acpb-grid">
        ${PLAYBOOKS.map((p) => `<button type="button" class="acpb-chip" data-pbid="${p.id}" title="${p.name}">${p.icon} ${p.shortName}</button>`).join('')}
      </div>
      <div id="acpb-detail"></div>
    `;

    // Gắn gọn ngay dưới khung Học Hành Vi (đầu Tab 1)
    const firstSection = tabAuto.querySelector('.acp-sec');
    if (firstSection && firstSection.nextSibling) {
      tabAuto.insertBefore(card, firstSection.nextSibling);
    } else {
      tabAuto.prepend(card);
    }

    card.querySelectorAll('.acpb-chip').forEach((btn) => {
      btn.onclick = () => {
        state.selectedId = btn.getAttribute('data-pbid');
        saveState(true);
        updatePlaybookUI(true);
      };
    });

    updatePlaybookUI(false);
    pullStateFromCloud();
    return true;
  }

  installSafeFetchEnricher();

  let tries = 0;
  const bootTimer = setInterval(() => {
    tries += 1;
    if (mountPlaybooksCard() || tries > 60) {
      clearInterval(bootTimer);
    }
  }, 250);
})();
