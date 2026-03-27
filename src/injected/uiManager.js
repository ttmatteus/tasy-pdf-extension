window.TasyPdf = window.TasyPdf || {};

(function (ctx) {

    ctx.init = function () {
        if (ctx._initialized) return;

        const hasTasyMarkers = !!document.querySelector('div.wdbpanel, div.wcpanel, [w-activator], [wactivator]');
        const isTasyUrl = location.href.toLowerCase().includes('unimedmaceio.com.br');
        const isLoginPage = location.href.toLowerCase().includes('/login');

        if (isLoginPage) return;

        if (!hasTasyMarkers && !window.angular) {
            if (isTasyUrl) {
                if (!this._initAttempts) this._initAttempts = 0;
                if (this._initAttempts < 5) {
                    this._initAttempts++;
                    setTimeout(() => ctx.init(), 2000);
                }
            }
            return;
        }

        if (ctx.Styles) ctx.Styles.inject();
        if (ctx.Navbar) ctx.Navbar.inject();
        if (ctx.Spotlight) ctx.Spotlight.setup();

        this.setupGlobalShortcuts();
        ctx._initialized = true;
    };

    ctx.setupGlobalShortcuts = function () {
        // Registro de atalho de teclado
        window.addEventListener('keydown', (e) => {
            // Ctrl+C para copiar (Campo ou Banda baseado no hover)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (ctx.state.level === 2 && ctx.state.hoveredField) {
                    e.preventDefault();
                    ctx.fieldClipboard = ctx.state.hoveredField;
                    ctx.Toasts.show(`Copiado: ${ctx.fieldClipboard.DS_CAMPO}`, 'info');
                    ctx.Fields.render();
                } else if (ctx.state.level === 1 && ctx.state.hoveredBand) {
                    e.preventDefault();
                    ctx.bandClipboard = { bandObj: ctx.state.hoveredBand, fieldCount: '?' };
                    ctx.Toasts.show(`Copiado: ${ctx.state.hoveredBand.DS_BANDA}`, 'info');
                    ctx.Bands.render();
                }
            }

            // Atalhos de nível 2 (Campos)
            if (ctx.state.level === 2) {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && ctx.fieldClipboard) {
                    e.preventDefault();
                    ctx.Fields.paste();
                }
            }

            // Atalhos de nível 1 (Bandas)
            if (ctx.state.level === 1) {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && ctx.bandClipboard) {
                    e.preventDefault();
                    ctx.Bands.paste();
                }
            }

            // Esc: navega para o nível anterior ou minimiza
            if (e.key === 'Escape') {
                if (ctx.state.level === 3) {
                    ctx.EventBus?.emit('ui:closeFieldForm');
                } else if (ctx.state.level === 2) {
                    e.preventDefault();
                    ctx.state.level = 1;
                    if (ctx.Bands) ctx.Bands.load();
                } else if (ctx.state.level === 1) {
                    e.preventDefault();
                    ctx.state.level = 0;
                    if (ctx.Navbar) ctx.Navbar.switchView('search');
                } else {
                    if (ctx.Navbar) ctx.Navbar.minimize();
                }
            }
        });

        // Hover tracking (separado do clique)
        document.addEventListener('mouseover', (e) => {
            const fieldItem = e.target.closest('.tasy-field-item');
            if (fieldItem) {
                const seq = fieldItem.getAttribute('data-seq');
                ctx.state.hoveredField = ctx.state.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
            }
            const bandItem = e.target.closest('.tasy-band-item');
            if (bandItem) {
                const seq = bandItem.getAttribute('data-seq');
                ctx.state.hoveredBand = ctx.state.rawBands.find(b => String(b.NR_SEQUENCIA) === String(seq));
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.tasy-field-item')) ctx.state.hoveredField = null;
            if (e.target.closest('.tasy-band-item')) ctx.state.hoveredBand = null;
        });

        // Eventos Globais de Clique e Visibilidade
        document.addEventListener('mousedown', (e) => {
            const nav = document.getElementById('tasy-pdf-navbar');
            const pill = document.getElementById('tasy-pdf-pill');
            
            // Clique Fora do Studio (Minimizar)
            if (nav && !nav.contains(e.target) && pill && !pill.contains(e.target)) {
                if (ctx.state.level !== 3 && ctx.Navbar && nav.style.display !== 'none') {
                    ctx.Navbar.minimize();
                }
            }
        });

        document.addEventListener('click', (e) => {
            // Botão Voltar (Navbar)
            const btnBack = e.target.closest('#tasy-ed-btn-back');
            if (btnBack) {
                e.stopPropagation();
                if (ctx.state.level === 2) {
                    ctx.state.level = 1;
                    if (ctx.Bands) ctx.Bands.load();
                } else if (ctx.state.level === 1) {
                    ctx.state.level = 0;
                    if (ctx.Navbar) ctx.Navbar.switchView('search');
                }
                return;
            }

            const btnDeleteField = e.target.closest('.tasy-btn-delete-field');
            if (btnDeleteField) {
                const seq = btnDeleteField.getAttribute('data-seq');
                const field = ctx.state.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
                if (field) ctx.Fields.openDeleteModal(field);
                return;
            }

            const btnCloneField = e.target.closest('.tasy-btn-clone-field');
            if (btnCloneField) {
                const seq = btnCloneField.getAttribute('data-seq');
                const field = ctx.state.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
                if (field) {
                    ctx.fieldClipboard = field;
                    ctx.Fields.render();
                    ctx.Toasts.show(`Copiado: ${field.DS_CAMPO}`, 'info');
                }
                return;
            }

            const btnEditField = e.target.closest('.tasy-field-item');
            if (btnEditField && !e.target.closest('button')) {
                const seq = btnEditField.getAttribute('data-seq');
                const field = ctx.state.rawFields.find(f => String(f.NR_SEQUENCIA) === String(seq));
                if (field) {
                    ctx.state.activeField = field;
                    ctx.Fields.render();
                    ctx.FieldForm.open(field);
                }
                return;
            }

            const btnDeleteBand = e.target.closest('.tasy-btn-delete-band');
            if (btnDeleteBand) {
                const seq = btnDeleteBand.getAttribute('data-seq');
                const band = ctx.state.rawBands.find(b => String(b.NR_SEQUENCIA) === String(seq));
                if (band) ctx.Bands.openDeleteModal(band);
                return;
            }

            const btnEditBand = e.target.closest('.tasy-band-item');
            if (btnEditBand && !e.target.closest('button')) {
                const seq = btnEditBand.getAttribute('data-seq');
                const band = ctx.state.rawBands.find(b => String(b.NR_SEQUENCIA) === String(seq));
                if (band) {
                    ctx.state.level = 2;
                    ctx.state.bandSeq = band.NR_SEQUENCIA;
                    ctx.state.bandName = band.DS_BANDA;
                    ctx.Fields.load();
                }
                return;
            }

        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        ctx.init();
    } else {
        window.addEventListener('DOMContentLoaded', () => ctx.init());
    }

})(window.TasyPdf);