window.TasyPdf = window.TasyPdf || {};

(function (ctx) {

    ctx.init = function () {
        if (ctx._initialized) return;

        // Detecção do Tasy: procura por elementos específicos ou presença do Angular
        const hasTasyMarkers = !!document.querySelector('div.wdbpanel, div.wcpanel, [w-activator], [wactivator]');
        const isTasyUrl = location.href.toLowerCase().includes('tasy') || location.href.toLowerCase().includes('philips');

        if (!hasTasyMarkers && !isTasyUrl && !window.angular) {
            // Se não encontrou markers, tenta novamente em 2s (o Tasy pode demorar a carregar)
            if (!this._initAttempts) this._initAttempts = 0;
            if (this._initAttempts < 3) {
                this._initAttempts++;
                setTimeout(() => ctx.init(), 2000);
            }
            return;
        }


        // Iniciar estilos
        if (ctx.Styles) ctx.Styles.inject();

        // Injetar Navbar (o shell principal)
        if (ctx.Navbar) {
            ctx.Navbar.inject();
        }

        // Injetar Spotlight (lógica de busca)
        if (ctx.Spotlight) {
            ctx.Spotlight.setup();
        }

        // Registrar atalhos globais
        this.setupGlobalShortcuts();

        ctx._initialized = true;
    };

    ctx.setupGlobalShortcuts = function () {
        document.addEventListener('keydown', (e) => {

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
                // Ctrl+V para colar campo
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && ctx.fieldClipboard) {
                    e.preventDefault();
                    ctx.Fields.paste();
                }
            }

            // Atalhos de nível 1 (Bandas)
            if (ctx.state.level === 1) {
                // Ctrl+V para colar banda
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && ctx.bandClipboard) {
                    e.preventDefault();
                    ctx.Bands.paste();
                }
            }
        });

        // Delegação de eventos para botões dinâmicos
        document.addEventListener('click', (e) => {
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

            // Hover tracking para Ctrl+C/V
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

    // Auto-inicialização quando o script carregar

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        ctx.init();
    } else {
        window.addEventListener('DOMContentLoaded', () => ctx.init());
    }

})(window.TasyPdf);