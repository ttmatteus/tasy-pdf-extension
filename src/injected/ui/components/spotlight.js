window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts, Navbar } = ctx;

    ctx.Spotlight = {
        setup: function () {
            const input = document.getElementById('tasy-nav-search');
            const refresh = document.getElementById('tasy-nav-refresh');
            const results = document.getElementById('tasy-nav-results');

            refresh.addEventListener('click', async (e) => {
                e.stopPropagation();
                refresh.style.transform = 'rotate(360deg)';
                refresh.style.color = '#3b82f6';
                if (ctx.prefetchAllReports) await ctx.prefetchAllReports(true);
                setTimeout(() => {
                    refresh.style.transform = 'rotate(0deg)';
                    refresh.style.color = '#64748b';
                    Toasts.show('Lista de relatórios atualizada!', 'success');
                }, 600);
            });

            window.addEventListener('message', (e) => {
                if (e.data && e.data.type === 'TASY_PDF_HISTORY_DATA') {
                    ctx.historyData = e.data.payload || [];
                    if (input.value.trim() === '' && state.level === 0) {
                        this.renderHistory();
                    }
                }
            });

            this.requestHistory();

            let debounceTimer;
            input.addEventListener('input', (e) => {
                const val = e.target.value.trim().toLowerCase();
                if (!val) { results.style.display = 'none'; return; }
                
                if (ctx.allReports && ctx.allReports.length > 0) {
                    const matches = ctx.allReports.filter(r =>
                        String(r.CD_RELATORIO).includes(val) ||
                        (r.DS_TITULO && String(r.DS_TITULO).toLowerCase().includes(val))
                    ).slice(0, 15);
                    this.renderResults(matches);
                    return;
                }

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    results.style.display = 'block';
                    this.renderLoading(results, "Buscando na rede");
                    ctx.checkExactReportFallback(val).then(res => this.renderResults(res));
                }, 500);
            });

            results.addEventListener('click', (e) => {
                this.handleResultsClick(e);
            });
        },

        requestHistory: function () {
            window.postMessage({ type: 'TASY_PDF_HISTORY_GET' }, '*');
        },

        renderLoading: function (target, msg) {
            target.innerHTML = `<div style="padding: 14px; color: #a0a0b0; font-size: 14px; text-align: center;">${msg}... aguarde</div>`;
        },

        renderResults: function (list) {
            const results = document.getElementById('tasy-nav-results');
            if (!list || list.length === 0) {
                results.style.display = 'block';
                results.innerHTML = `<div style="padding: 14px; color: #ef4444; font-size: 14px; text-align: center;">Nenhum relatório encontrado.</div>`;
                return;
            }
            results.style.display = 'block';
            results.innerHTML = list.map(r => `
                <div class="tasy-res-item" data-code="${r.CD_RELATORIO}" data-seq="${r.NR_SEQUENCIA}" style="padding: 12px 16px; border-bottom: 1px solid #3f3f5a; display: flex; align-items: center; justify-content: space-between; transition: background 0.1s;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: #f8fafc; font-size: 14px; font-weight: 500;">${r.CD_RELATORIO}</span>
                        <span style="color: #94a3b8; font-size: 12px; font-weight: 400;">${r.DS_TITULO || 'Relatório S/N'}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="tasy-btn-edit" style="border:none; background:rgba(245, 158, 11, 0.1); color:#f59e0b; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; transition:all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${Icons.edit} Editor UI</span></button>
                        <button class="tasy-btn-gen" style="border:none; background:rgba(59, 130, 246, 0.1); color:#3b82f6; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; transition:all 0.2s;"><span style="display:flex;align-items:center;gap:6px;">${Icons.print} Gerar Pdf</span></button>
                    </div>
                </div>
            `).join('');
        },

        renderHistory: function () {
            const results = document.getElementById('tasy-nav-results');
            results.style.display = 'block';

            let timeline = [];
            try { timeline = JSON.parse(localStorage.getItem('tasy_edit_timeline') || '[]'); } catch (e) { }

            let timelineHtml = '';
            if (timeline.length > 0) {
                const timelineItems = timeline.map(t => `
                    <div class="tasy-timeline-item"
                         data-code="${t.code}" data-seq="${t.seq || ''}"
                         data-band-seq="${t.bandSeq}" data-band-name="${t.bandName}"
                         data-field-seq="${t.fieldSeq}" data-field-name="${t.fieldName}"
                         style="padding:9px 16px; border-bottom:1px solid #1e1e2a; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.1s;"
                         onmouseover="this.style.background='rgba(96,165,250,0.05)'"
                         onmouseout="this.style.background='transparent'">
                        <div style="display:flex; flex-direction:column; gap:2px; min-width:0; overflow:hidden;">
                            <div style="display:flex; align-items:center; gap:5px; font-size:12px;">
                                <span style="color:#94a3b8; font-weight:600; flex-shrink:0;">${t.code}</span>
                                <span style="color:#334155;">›</span>
                                <span style="color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.bandName}</span>
                                <span style="color:#334155;">›</span>
                                <span style="color:#60a5fa; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.fieldName}</span>
                            </div>
                            <span style="color:#334155; font-size:10px;">${t.date}</span>
                        </div>
                        <button class="tasy-btn-resume" style="border:none; background:rgba(96,165,250,0.12); color:#60a5fa; padding:5px 12px; border-radius:6px; font-weight:600; font-size:11px; cursor:pointer; flex-shrink:0; margin-left:10px; transition:all 0.2s;"
                          onmouseover="this.style.background='rgba(96,165,250,0.22)'"
                          onmouseout="this.style.background='rgba(96,165,250,0.12)'">
                          Continuar →
                        </button>
                    </div>`).join('');

                timelineHtml = `
                    <div style="border-bottom:1px solid #2a2a38;">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 16px;">
                            <span style="color:#475569; font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;">Onde você parou</span>
                            <button id="tasy-btn-timeline-clear" style="background:none; border:none; color:#334155; font-size:10px; cursor:pointer; padding:2px 4px;">limpar</button>
                        </div>
                        ${timelineItems}
                    </div>`;
            }

            if (!ctx.historyData || ctx.historyData.length === 0) {
                if (!timelineHtml) {
                    results.innerHTML = `
                        <div style="padding:20px 16px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                            <div style="color:#475569; font-size:13px; text-align:center;">${Icons.history} Nenhuma atividade recente</div>
                            <div style="color:#334155; font-size:11px;">Abra um relatório para editar</div>
                        </div>`;
                } else {
                    results.innerHTML = timelineHtml;
                }
                return;
            }

            const headerHtml = `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 16px; border-bottom:1px solid #2a2a38;">
                    <span style="color:#475569; font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;">${Icons.history} PDFs Gerados</span>
                    <button id="tasy-btn-hist-clear" style="background:none; border:none; color:#334155; font-size:10px; cursor:pointer; padding:2px 4px;">limpar</button>
                </div>`;

            const itemsHtml = ctx.historyData.slice(0, 8).map(h => `
                <div class="tasy-res-item tasy-hist-item" data-code="${h.code}" data-seq="${h.seq || ''}"
                    style="padding:9px 16px; border-bottom:1px solid #1e1e2a; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.1s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.02)'"
                    onmouseout="this.style.background='transparent'">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="color:#f1f5f9; font-size:13px; font-weight:500;">${h.code}</span>
                        <span style="color:#334155; font-size:10px;">${h.date || ''}</span>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="tasy-btn-edit" style="border:none; background:rgba(245,158,11,0.08); color:#f59e0b; padding:5px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">${Icons.edit}</button>
                        <button class="tasy-btn-gen" style="border:none; background:rgba(59,130,246,0.08); color:#3b82f6; padding:5px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">${Icons.print}</button>
                    </div>
                </div>`).join('');

            results.innerHTML = timelineHtml + headerHtml + itemsHtml;
        },

        handleResultsClick: function (e) {
            const item = e.target.closest('.tasy-res-item');
            const results = document.getElementById('tasy-nav-results');
            const input = document.getElementById('tasy-nav-search');

            if (e.target.closest('.tasy-btn-resume')) {
                const el = e.target.closest('.tasy-timeline-item') || e.target.closest('.tasy-res-item');
                this.resumeFromHistory({
                    code: el.getAttribute('data-code'),
                    seq: el.getAttribute('data-seq'),
                    bandSeq: el.getAttribute('data-band-seq'),
                    bandName: el.getAttribute('data-band-name'),
                    fieldSeq: el.getAttribute('data-field-seq'),
                    fieldName: el.getAttribute('data-field-name'),
                });
                return;
            }

            if (e.target.closest('#tasy-btn-timeline-clear')) {
                localStorage.removeItem('tasy_edit_timeline');
                this.renderHistory();
                return;
            }

            if (e.target.closest('.tasy-timeline-item') && !e.target.closest('.tasy-btn-resume')) {
                const el = e.target.closest('.tasy-timeline-item');
                this.resumeFromHistory({
                    code: el.getAttribute('data-code'),
                    seq: el.getAttribute('data-seq'),
                    bandSeq: el.getAttribute('data-band-seq'),
                    bandName: el.getAttribute('data-band-name'),
                    fieldSeq: el.getAttribute('data-field-seq'),
                    fieldName: el.getAttribute('data-field-name'),
                });
                return;
            }

            if (e.target.closest('#tasy-btn-hist-clear')) {
                this.renderClearConfirm();
                return;
            }

            if (e.target.closest('#tasy-btn-confirm-clear-yes')) {
                window.postMessage({ type: 'TASY_PDF_HISTORY_CLEAR' }, '*');
                ctx.historyData = [];
                this.renderHistory();
                return;
            }

            if (e.target.closest('#tasy-btn-confirm-clear-no')) {
                this.renderHistory();
                return;
            }

            if (!item) return;

            const code = item.getAttribute('data-code');
            const seq = item.getAttribute('data-seq');
            if (e.target.closest('.tasy-btn-gen')) {
                input.value = ''; results.style.display = 'none'; input.blur();
                if (ctx.generateManualPdf) ctx.generateManualPdf(code);
            } else if (e.target.closest('.tasy-btn-edit')) {
                state.level = 1; state.reportCode = code; state.reportSeq = seq;
                if (ctx.Bands) ctx.Bands.load();
                return;
            }

            if (e.target.closest('.tasy-btn-gen') || item.classList.contains('tasy-hist-item')) {
                input.value = ''; results.style.display = 'none';
                if (ctx.generateManualPdf) ctx.generateManualPdf(code);
                return;
            }
        },

        renderClearConfirm: function () {
            const results = document.getElementById('tasy-nav-results');
            results.style.display = 'block';
            results.innerHTML = `
                <div style="padding: 20px 16px; display: flex; flex-direction: column; align-items: center; gap: 14px;">
                    <div style="color: #f1f5f9; font-size: 13px; font-weight: 500; text-align: center;">Limpar todo o histórico?</div>
                    <div style="display: flex; gap: 10px;">
                        <button id="tasy-btn-confirm-clear-yes" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 7px 18px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer;">Sim, limpar</button>
                        <button id="tasy-btn-confirm-clear-no" style="background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 7px 18px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer;">Cancelar</button>
                    </div>
                </div>`;
        },

        resumeFromHistory: async function (h) {
            state.reportCode = h.code;
            state.reportSeq = h.seq;
            state.bandSeq = h.bandSeq;
            state.bandName = h.bandName;

            const results = document.getElementById('tasy-nav-results');
            results.style.display = 'none';
            document.getElementById('tasy-nav-header').style.display = 'none';

            try {
                const fields = await ctx.fetchFields(h.bandSeq);
                state.rawFields = fields;
                const field = fields.find(f => String(f.NR_SEQUENCIA) === String(h.fieldSeq));
                if (!field) {
                    Toasts.show('Campo não encontrado — pode ter sido deletado.', 'error');
                    state.level = 2;
                    if (ctx.Fields) ctx.Fields.load();
                    return;
                }
                state.activeField = field;
                state.level = 3;
                if (ctx.FieldForm) ctx.FieldForm.open(field);
            } catch (err) {
                Toasts.show('Erro ao retomar edição: ' + err.message, 'error');
            }
        }
    };
})(window.TasyPdf);
