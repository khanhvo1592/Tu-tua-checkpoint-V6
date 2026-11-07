from pathlib import Path
src=Path('outputs/tu-tua-checkpoint-V6.js').read_text()
header='''// ==UserScript==
// @name         Bình dân học vụ số - Tự tua giữ checkpoint V6
// @namespace    local.binhdanhocvuso.checkpoint
// @version      6.1.0
// @description  Phát 2–4 giây, tua 8–15 giây; chờ trả lời checkpoint rồi tiếp tục.
// @match        https://binhdanhocvuso.gov.vn/*
// @match        https://www.youtube.com/embed/*
// @match        https://www.youtube-nocookie.com/embed/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

'''
src=src.replace("  console.log('[CHECKPOINT V6]", "  if (window.__checkpointV6Userscript) return;\n  window.__checkpointV6Userscript = true;\n  console.log('[CHECKPOINT V6]")
src=src.replace("  if (window === top) {", """  if (window === top) {
    if (location.origin !== SITE) return;
    let enabled = true;
    const panel = document.createElement('button');
    panel.type = 'button';
    panel.textContent = 'Tự tua V6: BẬT · Bấm để tắt';
    panel.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:2147483647;padding:12px 16px;background:#166534;color:white;border:0;border-radius:10px;font:14px system-ui;cursor:pointer;box-shadow:0 3px 12px #0004';
    panel.onclick = () => {
      enabled = !enabled;
      panel.textContent = enabled ? 'Tự tua V6: BẬT · Bấm để tắt' : 'Tự tua V6: TẮT · Bấm để bật';
      panel.style.background = enabled ? '#166534' : '#475569';
    };
    document.body.appendChild(panel);""")
src=src.replace("const points = selectedId ? configs[selectedId] : noCheckpoint ? [] : null;", "const points = !enabled ? null : selectedId ? configs[selectedId] : noCheckpoint ? [] : null;")
src=src.replace("Chọn frame YouTube và chạy lại script để tua thường.", "Userscript sẽ tự kết nối frame YouTube để tua thường.")
src=src.replace("Chọn frame YouTube và chạy lại script này.", "Đang chờ frame YouTube tự kết nối.")
src=src.replace("  const video = document.querySelector('video');\n  if (!video) return console.error('Hãy chọn frame YouTube có video.');", """  if (!['https://www.youtube.com', 'https://www.youtube-nocookie.com'].includes(location.origin)) return;
  let video;
  while (!(video = document.querySelector('video'))) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }""")
a=src.index('  const deadline = Date.now() + 10000;')
b=src.index('  console.table(points);',a)
src=src[:a]+'''  // Trang và frame có thể tải theo thứ tự khác nhau; chờ kết nối tự động.
  while (!stopped) {
    if (Array.isArray(points) && points.every(p => p.ready)) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (stopped) return;
'''+src[b:]
src=src.replace('      previous=null;\n      return; // Mất kết nối: không tự tua.', '      restoreRate(); previous=null;\n      return; // Mất kết nối hoặc đã tắt: không tự tua.')
Path('outputs/tu-tua-checkpoint-V6.user.js').write_text(header+src)
