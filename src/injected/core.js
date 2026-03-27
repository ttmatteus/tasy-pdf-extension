window.TasyPdf = window.TasyPdf || {};

(function(ctx) {
  if (window.__tasyPdfCoreRunning) return;
  window.__tasyPdfCoreRunning = true;

  // ===== BLOB SAFETY NET =====
  const _origWindowOpen = window.open;
  window.open = function(url, name, features) {
    if (typeof url === 'string' && url.startsWith('blob:') && url.includes('tasy_extension=1')) {
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
    }
  }, true);
  // ===========================

  // ===== EVENT BUS =====
  // Sistema de eventos desacoplado para comunicação entre componentes
  // Uso: ctx.EventBus.on('state:levelChanged', fn) | ctx.EventBus.emit('...', data) | ctx.EventBus.off('...', fn)
  const _listeners = {};
  ctx.EventBus = {
    on(event, fn) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(fn);
    },
    off(event, fn) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      (_listeners[event] || []).forEach(fn => { try { fn(data); } catch(e) { ctx.log('EventBus error on ' + event, e); } });
    }
  };
  // =====================

  // ===== SET STATE =====
  // Centraliza atualizações de estado e notifica listeners via EventBus
  // Emite 'state:changed' com { prev, next, changed } e também 'state:<key>Changed' para cada campo alterado
  ctx.setState = function(newState) {
    const prev = { ...ctx.state };
    ctx.state = { ...ctx.state, ...newState };
    const changedKeys = Object.keys(newState).filter(k => prev[k] !== ctx.state[k]);
    if (changedKeys.length > 0) {
      ctx.EventBus.emit('state:changed', { prev, next: ctx.state, changed: changedKeys });
      changedKeys.forEach(k => ctx.EventBus.emit(`state:${k}Changed`, { prev: prev[k], next: ctx.state[k] }));
    }
  };
  // =====================

  // ===== LOG UTIL =====
  ctx.log = function(...args) {
    if (ctx.prefs?.debug) console.log('[TasyPDF]', ...args);
  };
  // ====================

  ctx.prefs = window.__tasyPdfPrefs || { doubleBuffer: true, prefetch: true, spotlightSearch: true, reportTypes: ['CMCZ', 'WCTB', 'WMAN', 'W', 'WFIN', 'WPLS'] };

  ctx.initAngularDependencies();

  // Listener para previews encomendados manualmente no painel
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'TASY_MANUAL_PREVIEW') {
      const code = e.data.code;
      ctx.log('Gerando manual por código:', code);
      if (ctx.generateManualPdf) ctx.generateManualPdf(code);
    }
  });

  console.log('[Tasy PDF] Extensão v3 - Módulos Carregados ✔️');

})(window.TasyPdf);
