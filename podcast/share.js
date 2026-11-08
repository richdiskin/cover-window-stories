/* Share the selected media file, never substitute a page link. */
(() => {
  'use strict';
  document.querySelectorAll('.podcast').forEach(section => {
    const status = section.querySelector('.podcast-status');
    const say = text => { status.textContent = text; };
    const copy = section.querySelector('.podcast-copy');
    if (copy) copy.addEventListener('click', async () => {
      const url = new URL(section.dataset.link, location.origin).href;
      try { await navigator.clipboard.writeText(url); say('Link copied'); }
      catch (_) { say('Copy this link: ' + url); }
    });
    section.querySelectorAll('.podcast-share').forEach(share => {
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
            else { say('File unavailable. Use the download button.'); }
          });
          return;
        }
        try {
          if (!navigator.canShare({files: [file]})) { download(); return; }
          Promise.resolve(navigator.share({title: section.dataset.title, files: [file]}))
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
