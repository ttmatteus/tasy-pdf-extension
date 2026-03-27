window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts } = ctx;

    ctx.Navbar = {
        inject: function () {
            if (document.getElementById('tasy-pdf-navbar')) return;

            const nav = document.createElement('div');
            nav.id = 'tasy-pdf-navbar';
            Object.assign(nav.style, {
                position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '650px',
                backgroundColor: 'var(--tasy-bg-surface)', zIndex: '999999', borderRadius: 'var(--tasy-radius-lg)', border: '1px solid var(--tasy-border)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'var(--tasy-shadow-lg)', transition: 'all 0.35s var(--tasy-spring)'
            });

            nav.innerHTML = `
                <div id="tasy-nav-header" style="position: relative; width: 100%; display: flex; align-items: center;">
                    <div style="position: absolute; left: 18px; color: var(--tasy-text-muted); display: flex;">${Icons.search}</div>
                    <input type="text" id="tasy-nav-search" placeholder="Buscar Relatórios..." autocomplete="off" style="width: 100%; padding: 16px 44px 16px 48px; border-radius: var(--tasy-radius-lg); border: none; background: transparent; color: var(--tasy-text-main); font-size: 15px; outline: none;">
                    <div style="position:absolute;right:48px;display:flex;align-items:center;">
                        <button id="tasy-spotlight-import-btn" title="Importar XML" style="border:none;background:var(--tasy-bg-hover);color:var(--tasy-text-main);padding:6px 10px;border-radius:var(--tasy-radius-sm);cursor:pointer;font-size:11px;font-weight:500;display:flex;align-items:center;gap:4px;transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-border-hover)'" onmouseout="this.style.background='var(--tasy-bg-hover)'">↑ Importar</button>
                    </div>
                    <div id="tasy-nav-refresh" title="Atualizar Cache" style="position: absolute; right: 18px; color: var(--tasy-text-muted); cursor: pointer; transition: all 0.2s; display: flex;" onmouseover="this.style.color='var(--tasy-text-main)'" onmouseout="this.style.color='var(--tasy-text-muted)'">${Icons.refresh}</div>
                </div>
                <div id="tasy-nav-results" style="display: none; border-top: 1px solid var(--tasy-border); max-height: 350px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; background: var(--tasy-bg-surface-solid); border-radius: 0 0 var(--tasy-radius-lg) var(--tasy-radius-lg);"></div>

                <div id="tasy-nav-editor" style="display: none; padding: 18px; border-top: 1px solid var(--tasy-border); background: var(--tasy-bg-surface-solid); border-radius: 0 0 var(--tasy-radius-lg) var(--tasy-radius-lg); flex-direction: column;">
                    <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button id="tasy-ed-btn-back" style="border:1px solid var(--tasy-border); background:transparent; color:var(--tasy-text-muted); padding:6px 10px; border-radius:var(--tasy-radius-sm); cursor:pointer; font-weight:500; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:4px;">${Icons.arrowLeft} Voltar</span></button>
                            <span id="tasy-ed-title" style="color:var(--tasy-text-main); font-weight:600; font-size:14px; letter-spacing: 0.3px; display:flex; align-items:center; gap:6px;">Studio</span>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button id="tasy-studio-import-btn" class="tasy-btn-ghost" title="Importar relatório XML"><span style="display:flex;align-items:center;gap:4px;">↑ Importar</span></button>
                            <button id="tasy-ed-btn-export" class="tasy-btn-ghost" title="Exportar relatório como XML"><span style="display:flex;align-items:center;gap:6px;">${Icons.exportIcon} Exportar</span></button>
                            <button id="tasy-ed-btn-preview" style="border:none; background:var(--tasy-text-main); color:var(--tasy-bg-base); padding:6px 12px; border-radius:var(--tasy-radius-sm); font-weight:600; font-size:12px; cursor:pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(255,255,255,0.1);"><span style="display:flex;align-items:center;gap:6px;">${Icons.print} PDF Preview</span></button>
                            <div style="position:relative;">
                              <button id="tasy-ed-btn-shortcuts" title="Atalhos de teclado" style="border:1px solid var(--tasy-border);background:transparent;color:var(--tasy-text-muted);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-bg-hover)';this.style.color='var(--tasy-text-main)'" onmouseout="this.style.background='transparent';this.style.color='var(--tasy-text-muted)'">?</button>
                              <div id="tasy-shortcuts-popover" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:var(--tasy-bg-surface-solid);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-md);padding:14px 16px;width:260px;box-shadow:var(--tasy-shadow-lg);z-index:10;">
                                <div style="color:var(--tasy-text-muted);font-size:10px;font-weight:600;letter-spacing:0.08em;margin-bottom:10px;">ATALHOS DO STUDIO</div>
                                <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Minimizar Studio</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">ESC</kbd></div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Copiar campo (hover)</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">Ctrl+C</kbd></div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Colar campo/banda</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">Ctrl+V</kbd></div>
                                  <div style="height:1px;background:var(--tasy-border);margin:2px 0;"></div>
                                  <div style="color:var(--tasy-text-muted);font-size:10px;font-weight:600;letter-spacing:0.08em;margin-top:2px;">NO EDITOR DE CAMPO</div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Salvar imediatamente</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">Enter</kbd></div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Ajustar valor numérico</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">↑ / ↓</kbd></div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Passo 10 (numérico)</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">Shift+↑↓</kbd></div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Desfazer</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">Ctrl+Z</kbd></div>
                                  <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:var(--tasy-text-main);">Refazer</span><kbd style="background:var(--tasy-bg-hover);border:1px solid var(--tasy-border);border-radius:4px;padding:2px 7px;font-size:10px;color:var(--tasy-text-muted);font-family:monospace;">Ctrl+Y</kbd></div>
                                </div>
                              </div>
                            </div>
                        </div>
                    </div>
                    <div id="tasy-editor-body" style="max-height: 520px; overflow-y: auto; padding-right: 4px;"></div>
                </div>
            `;

            document.body.appendChild(nav);
            this.injectPill(nav);
            this.setupEvents(nav);
        },

        injectPill: function (nav) {
            if (document.getElementById('tasy-pdf-pill')) return;
            const pill = document.createElement('div');
            pill.id = 'tasy-pdf-pill';
            pill.title = 'Minimizar / Reabrir Studio';
            pill.innerHTML = Icons.search;
            Object.assign(pill.style, {
                position: 'fixed', top: '22px', left: 'calc(50% + 348px)',
                width: '32px', height: '32px',
                background: 'var(--tasy-bg-surface-solid)', border: '1px solid var(--tasy-border)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                color: 'var(--tasy-text-muted)', borderRadius: '50%', cursor: 'pointer',
                zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--tasy-shadow-sm)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            });

            pill.addEventListener('mouseenter', () => {
                pill.style.color = 'var(--tasy-text-main)';
                pill.style.borderColor = 'var(--tasy-border-hover)';
                pill.style.background = 'var(--tasy-bg-hover)';
                pill.style.transform = 'scale(1.05)';
            });
            pill.addEventListener('mouseleave', () => {
                const isHidden = nav.style.display === 'none';
                pill.style.color = isHidden ? 'var(--tasy-text-main)' : 'var(--tasy-text-muted)';
                pill.style.borderColor = 'var(--tasy-border)';
                pill.style.background = 'var(--tasy-bg-surface-solid)';
                pill.style.transform = 'scale(1)';
            });

            pill.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne que o uiManager trate como clique fora
                const isHidden = nav.style.display === 'none';
                if (isHidden) ctx.Navbar.restore();
                else ctx.Navbar.minimize();
            });

            // Drag logic
            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;
            let hasMoved = false;

            pill.addEventListener('mousedown', (e) => {
                isDragging = true;
                hasMoved = false;
                const rect = pill.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                pill.style.transition = 'none';
                pill.style.cursor = 'grabbing';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                hasMoved = true;
                const x = e.clientX - dragOffsetX;
                const y = e.clientY - dragOffsetY;
                const maxX = window.innerWidth - pill.offsetWidth;
                const maxY = window.innerHeight - pill.offsetHeight;
                pill.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
                pill.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
                pill.style.transform = 'none';
            });

            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                pill.style.cursor = 'pointer';
                pill.style.transition = 'all 0.2s';
            });

            pill.addEventListener('click', (e) => {
                if (hasMoved) { hasMoved = false; e.stopImmediatePropagation(); }
            }, true);

            document.body.appendChild(pill);
        },

        setupEvents: function (nav) {
            const input = document.getElementById('tasy-nav-search');
            const results = document.getElementById('tasy-nav-results');
            const editor = document.getElementById('tasy-nav-editor');

            this.collapseSearch = () => {
                if (ctx.removeGhostField) ctx.removeGhostField();
                results.style.display = 'none';
                editor.style.display = 'none';
                document.getElementById('tasy-nav-header').style.display = 'flex';
                nav.style.opacity = '0.7';
                nav.style.transform = 'translateX(-50%) scale(0.98)';
            };

            this.expandSearch = () => {
                const isSearchOpen = nav.style.opacity === '1';
                const isNavIdle = ctx.state.level === 0 && input.value.trim() === '';

                if (isSearchOpen) {
                    nav.style.transform = 'translateX(-50%) scale(1)';
                    if (isNavIdle && results.innerHTML === '') {
                        if (ctx.Spotlight) ctx.Spotlight.renderHistory();
                    }
                    return;
                }

                nav.style.opacity = '1';
                nav.style.transform = 'translateX(-50%) scale(1)';
                if (ctx.state.level > 0) {
                    editor.style.display = 'flex';
                    results.style.display = 'none';
                    document.getElementById('tasy-nav-header').style.display = 'none';
                } else if (input.value.trim() !== '') {
                    results.style.display = 'block';
                    document.getElementById('tasy-nav-header').style.display = 'flex';
                } else {
                    if (ctx.Spotlight) {
                        ctx.Spotlight.requestHistory();
                        ctx.Spotlight.renderHistory();
                    }
                }
            };

            input.addEventListener('focus', this.expandSearch);

            const previewBtn = document.getElementById('tasy-ed-btn-preview');
            if (previewBtn) {
                previewBtn.addEventListener('click', () => {
                    if (ctx.state.reportCode && ctx.generateManualPdf) {
                        if (ctx.Toasts) ctx.Toasts.show('Gerando Preview PDF...', 'info');
                        ctx.generateManualPdf(ctx.state.reportCode);
                    }
                });
            }

            const exportBtn = document.getElementById('tasy-ed-btn-export');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    if (ctx.ExportService) ctx.ExportService.openExportModal();
                });
            }

            const studioImportBtn = document.getElementById('tasy-studio-import-btn');
            if (studioImportBtn) {
                studioImportBtn.addEventListener('click', () => {
                    if (ctx.ExportService) ctx.ExportService.openImportModal();
                });
            }

            const spotlightImportBtn = document.getElementById('tasy-spotlight-import-btn');
            if (spotlightImportBtn) {
                spotlightImportBtn.addEventListener('click', () => {
                    if (ctx.ExportService) ctx.ExportService.openImportModal();
                });
            }

            const shortcutsBtn = document.getElementById('tasy-ed-btn-shortcuts');
            const shortcutsPopover = document.getElementById('tasy-shortcuts-popover');
            if (shortcutsBtn && shortcutsPopover) {
                shortcutsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = shortcutsPopover.style.display !== 'none';
                    shortcutsPopover.style.display = isOpen ? 'none' : 'block';
                });
                document.addEventListener('click', () => {
                    if (shortcutsPopover) shortcutsPopover.style.display = 'none';
                });
            }
        },

        switchView: function (mode) {
            const nav = document.getElementById('tasy-pdf-navbar');
            const editor = document.getElementById('tasy-nav-editor');
            const results = document.getElementById('tasy-nav-results');
            const input = document.getElementById('tasy-nav-search');
            const edBody = document.getElementById('tasy-editor-body');

            if (!nav) return;
            if (mode === 'search') {
                Object.assign(nav.style, {
                    width: '650px', height: 'auto', top: '20px', left: '50%',
                    transform: 'translateX(-50%)', borderRadius: 'var(--tasy-radius-lg)',
                    position: 'fixed'
                });
                const pill = document.getElementById('tasy-pdf-pill');
                if (pill) pill.style.left = 'calc(50% + 348px)';
                document.getElementById('tasy-nav-header').style.display = 'flex';
                editor.style.display = 'none';
                if (input.value.trim() !== '') results.style.display = 'block';
            } else {
                Object.assign(nav.style, {
                    width: '850px', height: 'auto', top: '20px', left: '50%',
                    transform: 'translateX(-50%)', borderRadius: 'var(--tasy-radius-lg)',
                    position: 'fixed'
                });
                const pill = document.getElementById('tasy-pdf-pill');
                if (pill) pill.style.left = 'calc(50% + 448px)';
                editor.style.padding = '18px';
                edBody.style.maxHeight = '420px';
                edBody.style.height = 'auto';
                document.getElementById('tasy-nav-header').style.display = 'none';
                results.style.display = 'none';
                editor.style.display = 'flex';
            }
        },

        minimize: function () {
            const nav = document.getElementById('tasy-pdf-navbar');
            const pill = document.getElementById('tasy-pdf-pill');
            if (!nav || nav.style.display === 'none') return;
            nav.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
            nav.style.opacity = '0';
            nav.style.transform = 'translateX(-50%) scale(0.95)';
            setTimeout(() => { nav.style.display = 'none'; }, 150);
            if (pill) {
                pill.innerHTML = Icons.eye;
                pill.style.color = 'var(--tasy-text-main)';
            }
        },

        restore: function () {
            const nav = document.getElementById('tasy-pdf-navbar');
            const pill = document.getElementById('tasy-pdf-pill');
            if (!nav || nav.style.display !== 'none') return;
            nav.style.display = '';
            nav.style.opacity = '0';
            nav.style.transform = 'translateX(-50%) scale(0.96)';
            requestAnimationFrame(() => {
                nav.style.transition = 'opacity 0.2s ease, transform 0.35s var(--tasy-spring)';
                nav.style.opacity = '1';
                nav.style.transform = 'translateX(-50%) scale(1)';
            });
            if (pill) {
                pill.innerHTML = Icons.search;
                pill.style.color = 'var(--tasy-text-muted)';
            }
        }
    };
})(window.TasyPdf);
