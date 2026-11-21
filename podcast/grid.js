/* Preview /podcasts/ banner grid: open a player in place, share the richest file, never a generic link. */
(() => {
  'use strict';
  document.querySelectorAll('.pod-banner').forEach(btn => {
    btn.addEventListener('click', () => {
      const tile = btn.closest('.pod-tile');
      const panel = tile.querySelector('.pod-player');
      const opening = panel.hidden;
      document.querySelectorAll('.pod-tile').forEach(other => {
        if (other === tile) return;
        const p = other.querySelector('.pod-player');
        if (p && !p.hidden) {
          p.hidden = true;
          other.querySelectorAll('audio,video').forEach(m => { try { m.pause(); } catch (e) {} });
          const b = other.querySelector('.pod-banner');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
      panel.hidden = !opening;
      btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) {
        const media = panel.querySelector('video,audio');
        if (media && media.play) media.play();
        panel.scrollIntoView({block: 'nearest'});
      }
    });
  });
  document.querySelectorAll('.pod-grid .podcast').forEach(section => {
    const status = section.querySelector('.podcast-status');
    const say = text => { if (status) status.textContent = text; };
    section.querySelectorAll('.pod-grid-share').forEach(share => {
      let file = null, pending = null;
      const src = share.dataset.shareSrc;
      const download = () => {
        const a = document.createElement('a');
        a.href = src; a.download = src.split('/').pop();
        document.body.append(a); a.click(); a.remove();
        say('Download started. Save the file to your device.');
      };
      const prepare = () => {
        if (pending || file) return pending;
        pending = fetch(src).then(response => {
          if (!response.ok) throw new Error('Media unavailable');
          return response.blob();
        }).then(blob => {
          if (!blob.size) throw new Error('Empty media');
          file = new File([blob], src.split('/').pop(), {type: share.dataset.shareMime});
        }).catch(() => {}).finally(() => { pending = null; });
        return pending;
      };
      share.addEventListener('click', () => {
        if (!navigator.share || !navigator.canShare) { download(); return; }
        if (!file) {
          say('Preparing file. Tap Share again when ready.');
          Promise.resolve(prepare()).then(() => {
            if (file) say('Ready. Tap Share to send the file.');
            else say('File unavailable. Use the download button.');
          });
          return;
        }
        const page = new URL(section.dataset.link, location.origin).href;
        const text = section.dataset.shareText || ((section.dataset.title || '') + ' ' + page);
        const payload = {title: section.dataset.title, text: text, files: [file]};
        try {
          if (!navigator.canShare({files: [file]})) { download(); return; }
          Promise.resolve(navigator.share(payload))
            .catch(error => { if (error.name !== 'AbortError') download(); });
        } catch (error) { if (error.name !== 'AbortError') download(); }
      });
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          if (entries.some(e => e.isIntersecting)) { prepare(); observer.disconnect(); }
        }, {rootMargin: '200px'});
        observer.observe(share);
      }
      share.addEventListener('pointerenter', prepare, {once: true});
      share.addEventListener('focus', prepare, {once: true});
    });
  });
})();
