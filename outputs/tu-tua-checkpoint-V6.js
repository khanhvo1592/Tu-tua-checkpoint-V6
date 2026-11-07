(async () => {
  console.log('[CHECKPOINT V6] Tự dò checkpoint; hỗ trợ bài không có checkpoint.');
  var checkpointMessageTypeV4 = 'VIDEO_CHECKPOINT_V6';
  const SITE = 'https://binhdanhocvuso.gov.vn';
  const normalize = map => Object.entries(map).map(([time, id]) => ({ time: Number(time), id })).sort((a,b) => a.time-b.time);

  if (window === top) {
    window.dungDoCheckpoint?.();
    const sourceURL = location.href;
    let sourceConfigs = {};
    function parseConfigTexts(texts) {
      const found = {};
      for (let text of texts) {
        // Source của hệ thống có thể chứa HTML lồng nhau đã encode.
        for (let depth = 0; depth < 4; depth++) {
          if (text.includes('InVideoQuizXBlockV2.config')) {
            const pattern = /(?:var|let|const)\s+videoId\s*=\s*['"]([^'"]+)['"][\s\S]*?JSON\.parse\(\s*`([^`]+)`\s*\)/g;
            for (const match of text.matchAll(pattern)) {
              let raw = match[2];
              for (let attempt = 0; attempt < 3; attempt++) {
                try {
                  const points = normalize(JSON.parse(raw));
                  if (points.every(p => Number.isFinite(p.time) && p.time >= 0 && typeof p.id === 'string')) found[match[1]] = points;
                  break;
                } catch { raw = raw.replace(/\\(["\\])/g, '$1'); }
              }
            }
          }
          const textarea = document.createElement('textarea');
          textarea.innerHTML = text;
          const decoded = textarea.value;
          if (decoded === text) break;
          text = decoded;
        }
      }
      return found;
    }
    function readHTMLConfig() {
      const found = location.href === sourceURL ? {...sourceConfigs} : {};
      Object.assign(found, parseConfigTexts([...document.scripts].map(s=>s.textContent || '')));
      // Dự phòng khi hệ thống đã đánh giá và gỡ script khỏi DOM.
      const runtimeConfig = window.InVideoQuizXBlockV2?.config;
      if (runtimeConfig && typeof runtimeConfig === 'object') {
        for (const [id,map] of Object.entries(runtimeConfig)) {
          try {
            const points = normalize(map);
            if (!Object.hasOwn(found,id) && points.every(p=>Number.isFinite(p.time) && p.time>=0 && typeof p.id==='string')) found[id]=points;
          } catch {}
        }
      }
      return found;
    }
    if (!Object.keys(readHTMLConfig()).length) {
      console.log('Đang đọc source HTML từ URL hiện tại…');
      try {
        const response = await fetch(sourceURL, {credentials:'same-origin', cache:'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        sourceConfigs = parseConfigTexts([await response.text()]);
      } catch (error) { console.warn('Không tải được source HTML:', error.message); }
    }
    function noCheckpointBlocks() {
      return document.readyState === 'complete' &&
        !!document.querySelector('[data-block-type="video"], [id^="video_"]') &&
        !document.querySelector('[data-block-type="invideoquiz_v2"], .in-video-quiz-block, .in-video-problem, .problems-wrapper');
    }
    const visible = element => !!element && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    function respond(event) {
      if (!['https://www.youtube.com', 'https://www.youtube-nocookie.com'].includes(event.origin)) return;
      if (event.data?.type !== checkpointMessageTypeV4 || event.data.action !== 'poll') return;
      const iframe = [...document.querySelectorAll('iframe')].find(f => f.contentWindow === event.source);
      if (!iframe) return;
      const configs = readHTMLConfig();
      const videoId = iframe.closest('[id^="video_"]')?.id?.replace(/^video_/, '') ||
        iframe.closest('[data-block-type="video"]')?.getAttribute('data-usage-id')?.split('@').at(-1);
      const keys = Object.keys(configs);
      const selectedId = videoId && configs[videoId] ? videoId : keys.length === 1 ? keys[0] : null;
      const noCheckpoint = !keys.length && noCheckpointBlocks();
      const points = selectedId ? configs[selectedId] : noCheckpoint ? [] : null;
      const result = points?.map(point => {
        const wrapper = [...document.querySelectorAll('.vert[data-id]')].find(el => el.dataset.id.endsWith(`@${point.id}`));
        const problem = wrapper?.querySelector('.in-video-problem') ||
          document.querySelector(`[data-block-type="problem"][data-usage-id$="@${CSS.escape(point.id)}"]`) ||
          document.getElementById(`problem_${point.id}`);
        return { ...point, ready: !!problem, visible: visible(problem) };
      }) ?? null;
      event.source.postMessage({type: checkpointMessageTypeV4, action:'state', token:event.data.token, points:result, diagnostic: {videoId, sourceVideoIds:keys, reason: noCheckpoint ? 'Không phát hiện khối checkpoint/câu hỏi trên bài hiện tại; dùng chế độ tua thường.' : !keys.length ? 'Không tìm thấy cấu hình checkpoint trong script HTML.' : !selectedId ? 'Không ghép được video với cấu hình HTML.' : result?.some(p=>!p.ready) ? 'Có cấu hình nhưng chưa tìm thấy khối câu hỏi trong DOM.' : 'OK'}}, event.origin);
    }
    window.addEventListener('message', respond);
    window.dungDoCheckpoint = () => window.removeEventListener('message', respond);
    const configs = readHTMLConfig();
    for (const [id, list] of Object.entries(configs)) { console.log('Video:', id); console.table(list); }
    if (!Object.keys(configs).length && noCheckpointBlocks()) console.log('Bài hiện tại không có khối checkpoint/câu hỏi được phát hiện. Chọn frame YouTube và chạy lại script để tua thường.');
    else if (!Object.keys(configs).length) console.error('Có câu hỏi hoặc trang chưa tải xong nhưng không đọc được cấu hình. Không bật tự tua.');
    else console.log('Đã đọc cấu hình từ HTML. Chọn frame YouTube và chạy lại script này.');
    return;
  }

  window.dungTuaVideo?.();
  const video = document.querySelector('video');
  if (!video) return console.error('Hãy chọn frame YouTube có video.');
  const token = `${Date.now()}-${Math.random()}`;
  let diagnostic = null;
  let points = null, lastReply = 0, stopped = false, pending = null;
  const done = new Set();
  const random = (a,b) => a+Math.random()*(b-a);
  let target = random(2,4), played = 0, previous = null, savedRate = null;
  const reset = () => { target=random(2,4); played=0; previous=null; };
  const restoreRate = () => { if (savedRate !== null) { video.playbackRate=savedRate; savedRate=null; } };
  const receive = event => {
    if (event.source !== parent || event.origin !== SITE || event.data?.type !== checkpointMessageTypeV4 || event.data.token !== token || event.data.action !== 'state') return;
    points = event.data.points;
    diagnostic = event.data.diagnostic;
    lastReply = Date.now();
  };
  window.addEventListener('message', receive);
  const poll = () => parent.postMessage({type:checkpointMessageTypeV4,action:'poll',token}, SITE);
  poll();
  const pollTimer = setInterval(poll, 200);
  let timer;
  window.dungTuaVideo = () => {
    stopped=true; clearInterval(timer); clearInterval(pollTimer);
    window.removeEventListener('message', receive); restoreRate();
    console.log('Đã dừng tự tua.');
  };
  const deadline = Date.now() + 10000;
  while (!stopped && Date.now() < deadline) {
    if (Array.isArray(points) && points.every(p => p.ready)) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (stopped) return;
  if (!Array.isArray(points) || !points.every(p => p.ready)) {
    window.dungTuaVideo();
    return console.error('Chưa bật tự tua:', diagnostic || 'Không nhận được phản hồi từ top. Chạy bản mới ở top rồi chạy lại trong YouTube.', points);
  }
  console.table(points);
  if (!points.length) console.log('Chế độ tua thường: không phát hiện checkpoint trên bài này.');
  // Bắt đầu từ checkpoint đầu tiên, kể cả khi vị trí hiện tại đã vượt mốc.
  timer = setInterval(() => {
    if (stopped) return;
    if (Date.now()-lastReply > 1500 || !Array.isArray(points) || !points.every(p=>p.ready)) {
      previous=null;
      return; // Mất kết nối: không tự tua.
    }
    const current=video.currentTime;
    const next=points.find(p=>!done.has(p.id));
    if (pending) {
      const state=points.find(p=>p.id===pending.id);
      if (!state) return;
      if (state.visible) pending.seen=true;
      // Chỉ tiếp tục khi đã thấy câu hỏi, câu hỏi đóng và video phát vượt mốc.
      if (pending.seen && !state.visible && !video.paused && !video.seeking && current>pending.time+1.5) {
        done.add(pending.id); pending=null; restoreRate(); reset();
        console.log('Đã qua checkpoint, tự tua tiếp.');
      }
      return;
    }
    if (next && (next.visible || current>=next.time-3)) {
      pending={...next,seen:next.visible};
      savedRate=video.playbackRate; video.playbackRate=1;
      reset();
      if (current>next.time+1 && !next.visible) {
        video.currentTime=Math.max(0,next.time-3);
        console.warn('Vị trí hiện tại đã vượt checkpoint chưa kiểm tra; đã quay lại trước mốc.');
      }
      console.log(`Chờ checkpoint ${next.time}s. Trả lời, bấm Gửi rồi Continue/Tiếp tục trên trang; script sẽ tự tua tiếp.`);
      return;
    }
    if (video.ended) return window.dungTuaVideo();
    if (video.paused || video.seeking || video.readyState<3) {previous=null;return;}
    if (previous!==null) { const delta=current-previous; if(delta>0 && delta<1) played+=delta; }
    previous=current;
    if (played>=target) {
      const destination=Math.min(current+random(8,15), next ? next.time-3 : Infinity, Number.isFinite(video.duration)?video.duration:Infinity);
      if(destination>current) video.currentTime=destination;
      reset();
    }
  },100);
  video.play().catch(()=>console.log('Hãy bấm Phát trên video.'));
  console.log('Đã bật: tự dò từ HTML, giữ checkpoint và tự tua tiếp sau khi câu hỏi đóng/video phát lại.');
})();
