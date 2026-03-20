window.TasyPdf = window.TasyPdf || {};

(function(ctx) {
  if (window.__tasyPdfCoreRunning) return;
  window.__tasyPdfCoreRunning = true;

  ctx.prefs = window.__tasyPdfPrefs || { doubleBuffer: true, prefetch: true, spotlightSearch: true };

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
