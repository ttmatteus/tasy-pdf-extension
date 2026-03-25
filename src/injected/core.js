window.TasyPdf = window.TasyPdf || {};

(function(ctx) {
  if (window.__tasyPdfCoreRunning) return;
  window.__tasyPdfCoreRunning = true;

  // ===== BLOB SAFETY NET =====
  // Evita loops de aberturas de abas por blob urls forçadas
  const _origWindowOpen = window.open;
  window.open = function(url, name, features) {
    if (typeof url === 'string' && url.startsWith('blob:') && url.includes('tasy_extension=1')) {
      console.log('Bloqueando window.open indesejado de blob URL');
      return null;
    }
    return _origWindowOpen.apply(this, arguments);
  };

  document.addEventListener('click', function(e) {
    let t = e.target;
    while(t && t.tagName !== 'A') t = t.parentElement;
    if (t && typeof t.href === 'string' && t.href.startsWith('blob:') && t.href.includes('tasy_extension=1')) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Bloqueando clique de link indesejado para blob URL');
    }
  }, true);
  // ===========================

  ctx.prefs = window.__tasyPdfPrefs || { doubleBuffer: true, prefetch: true, spotlightSearch: true, reportTypes: ['CMCZ', 'WCTB', 'WMAN', 'W', 'WFIN', 'WPLS'] };

  ctx.initAngularDependencies();

  // Listener para previews encomendados na mão no painel
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'TASY_MANUAL_PREVIEW') {
      const code = e.data.code;
      console.log('[Tasy PDF] Gerando manual por código:', code);
      if (ctx.generateManualPdf) ctx.generateManualPdf(code);
    }
  });

  console.log('[Tasy PDF] Extensão v3 - Módulos Carregados ✔️');

})(window.TasyPdf);
