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
                backgroundColor: 'rgba(43, 43, 54, 0.8)', zIndex: '999999', borderRadius: '12px', border: '1px solid rgba(63, 63, 90, 0.5)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            });

            nav.innerHTML = `
                <div id="tasy-nav-header" style="position: relative; width: 100%; display: flex; align-items: center;">
                    <div style="position: absolute; left: 16px; color: #3b82f6; display: flex;">${Icons.search}</div>
                    <input type="text" id="tasy-nav-search" placeholder="Buscar Relatórios..." autocomplete="off" style="width: 100%; padding: 14px 44px; border-radius: 12px; border: none; background: transparent; color: white; font-size: 15px; outline: none; font-family: 'Inter', system-ui, sans-serif;">
                    <div style="position:absolute;right:44px;display:flex;align-items:center;">
                        <button id="tasy-spotlight-import-btn" title="Importar XML" style="border:none;background:rgba(34,197,94,0.12);color:#22c55e;padding:4px 9px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;transition:all 0.2s;">↑ Importar</button>
                    </div>
                    <div id="tasy-nav-refresh" title="Atualizar Cache" style="position: absolute; right: 16px; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex;">${Icons.refresh}</div>
                </div>
                <div id="tasy-nav-results" style="display: none; border-top: 1px solid rgba(63, 63, 90, 0.5); max-height: 350px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; background: rgba(34, 34, 43, 0.7); border-radius: 0 0 12px 12px;"></div>

                <div id="tasy-nav-editor" style="display: none; padding: 16px; border-top: 1px solid #3f3f5a; background: #22222b; border-radius: 0 0 12px 12px; flex-direction: column;">
                    <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button id="tasy-ed-btn-back" style="border:1px solid #3f3f5a; background:transparent; color:#e2e8f0; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:4px;">${Icons.arrowLeft} Voltar</span></button>
                            <span id="tasy-ed-title" style="color:#e2e8f0; font-weight:600; font-size:14px; letter-spacing: 0.3px; display:flex; align-items:center; gap:6px;">Studio</span>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button id="tasy-studio-import-btn" style="border:none;background:rgba(34,197,94,0.12);color:#22c55e;padding:6px 12px;border-radius:6px;font-weight:600;font-size:12px;transition:all 0.2s;" title="Importar relatório XML"><span style="display:flex;align-items:center;gap:4px;">↑ Importar</span></button>
                            <button id="tasy-ed-btn-export" style="border:none; background:rgba(59,130,246,0.15); color:#60a5fa; padding:6px 12px; border-radius:6px; font-weight:600; font-size:12px; transition: all 0.2s;" title="Exportar relatório como XML"><span style="display:flex;align-items:center;gap:6px;">${Icons.exportIcon} Exportar</span></button>
                            <button id="tasy-ed-btn-preview" style="border:none; background:rgba(16, 185, 129, 0.15); color:#34d399; padding:6px 12px; border-radius:6px; font-weight:600; font-size:12px; transition: all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${Icons.print} PDF Preview</span></button>
                        </div>
                    </div>
                    <div id="tasy-editor-body" style="max-height: 520px; overflow-y: auto; scrollbar-width: thin; padding-right: 4px;"></div>
                </div>
            `;

            document.body.appendChild(nav);
            this.injectPill(nav);
            this.setupEvents(nav);
        },

        injectPill: function (nav) {
            const pill = document.createElement('div');
            pill.id = 'tasy-pdf-pill';
            pill.title = 'Minimizar / Reabrir Studio';
            pill.innerHTML = Icons.search;
            Object.assign(pill.style, {
                position: 'fixed', top: '22px', left: 'calc(50% + 318px)',
                width: '28px', height: '28px',
                background: 'rgba(43,43,54,0.75)', border: '1px solid rgba(63,63,90,0.5)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                color: '#475569', borderRadius: '50%', cursor: 'pointer',
                zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                transition: 'all 0.2s', fontFamily: 'system-ui,sans-serif'
            });

            pill.addEventListener('mouseenter', () => {
                pill.style.color = '#f1f5f9';
                pill.style.borderColor = 'rgba(96,165,250,0.5)';
                pill.style.background = 'rgba(59,130,246,0.15)';
            });
            pill.addEventListener('mouseleave', () => {
                const isHidden = nav.style.display === 'none';
                pill.style.color = isHidden ? '#60a5fa' : '#475569';
                pill.style.borderColor = isHidden ? 'rgba(96,165,250,0.4)' : 'rgba(63,63,90,0.5)';
                pill.style.background = isHidden ? 'rgba(59,130,246,0.1)' : 'rgba(43,43,54,0.75)';
            });

            pill.addEventListener('click', () => {
                const isHidden = nav.style.display === 'none';
                if (isHidden) {
                    nav.style.display = '';
                    nav.style.opacity = '0';
                    nav.style.transform = 'translateX(-50%) scale(0.96)';
                    requestAnimationFrame(() => {
                        nav.style.transition = 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275)';
                        nav.style.opacity = '0.7';
                        nav.style.transform = 'translateX(-50%) scale(0.98)';
                    });
                    pill.innerHTML = Icons.search;
                    pill.style.color = '#475569';
                    pill.style.borderColor = 'rgba(63,63,90,0.5)';
                    pill.style.background = 'rgba(43,43,54,0.75)';
                } else {
                    nav.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
                    nav.style.opacity = '0';
                    nav.style.transform = 'translateX(-50%) scale(0.95)';
                    setTimeout(() => { nav.style.display = 'none'; }, 150);
                    pill.innerHTML = Icons.eye;
                    pill.style.color = '#60a5fa';
                    pill.style.borderColor = 'rgba(96,165,250,0.4)';
                    pill.style.background = 'rgba(59,130,246,0.1)';
                }
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

            const collapseSearch = () => {
                if (ctx.removeGhostField) ctx.removeGhostField();
                results.style.display = 'none';
                editor.style.display = 'none';
                document.getElementById('tasy-nav-header').style.display = 'flex';
                nav.style.opacity = '0.7';
                nav.style.transform = 'translateX(-50%) scale(0.98)';
            };

            const expandSearch = () => {
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

            document.addEventListener('mousedown', (e) => {
                if (ctx.state.level === 3) return;
                if (!nav.contains(e.target)) collapseSearch();
                else expandSearch();
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (ctx.state.level === 3) return;
                    collapseSearch();
                }
            });

            input.addEventListener('focus', expandSearch);

            const backBtn = document.getElementById('tasy-ed-btn-back');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    if (ctx.state.level === 2) {
                        ctx.state.level = 1;
                        if (ctx.Bands) ctx.Bands.load();
                    }
                });
            }

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
                    transform: 'translateX(-50%)', borderRadius: '12px',
                    position: 'fixed', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                });
                const pill = document.getElementById('tasy-pdf-pill');
                if (pill) pill.style.left = 'calc(50% + 318px)';
                document.getElementById('tasy-nav-header').style.display = 'flex';
                editor.style.display = 'none';
                if (input.value.trim() !== '') results.style.display = 'block';
            } else {
                Object.assign(nav.style, {
                    width: '850px', height: 'auto', top: '20px', left: '50%',
                    transform: 'translateX(-50%)', borderRadius: '12px',
                    position: 'fixed', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                });
                const pill = document.getElementById('tasy-pdf-pill');
                if (pill) pill.style.left = 'calc(50% + 418px)';
                editor.style.padding = '16px';
                edBody.style.maxHeight = '420px';
                edBody.style.height = 'auto';
                document.getElementById('tasy-nav-header').style.display = 'none';
                results.style.display = 'none';
                editor.style.display = 'flex';
            }
        }
    };
})(window.TasyPdf);
