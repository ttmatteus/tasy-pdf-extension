window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts, Navbar } = ctx;

    // ===== FUZZY SEARCH (Bitap Algorithm) =====
    // Busca aproximada: tolera erros de digitação e correspondências parciais.
    // score: 0 (match direto) → maior (menos relevante)
    function _fuzzyScore(pattern, text) {
        if (!pattern || !text) return Infinity;
        const p = pattern.toLowerCase();
        const t = text.toLowerCase();
        if (t.includes(p)) return 0; // match exato tem prioridade
        const m = p.length;
        if (m > 32) return t.includes(p) ? 0 : Infinity;
        const patternMask = {};
        for (let i = 0; i < m; i++) {
            patternMask[p[i]] = patternMask[p[i]] || 0;
            patternMask[p[i]] |= (1 << i);
        }
        let R = ~1;
        let bestScore = Infinity;
        for (let i = 0; i < t.length; i++) {
            R = ((R | ~(patternMask[t[i]] || 0)) << 1) & ~1;
            if ((R & (1 << (m - 1))) === 0) { bestScore = 0; break; }
        }
        if (bestScore === Infinity) {
            // Fallback: conta quantos chars do padrão estão no texto em ordem
            let lastIdx = -1, found = 0;
            for (const c of p) { const i = t.indexOf(c, lastIdx + 1); if (i > -1) { lastIdx = i; found++; } }
            bestScore = found >= Math.ceil(m * 0.7) ? (m - found) + 1 : Infinity;
        }
        return bestScore;
    }

    function _fuzzySearch(query, reports) {
        if (!query) return reports;
        return reports
            .map(r => ({
                r,
                score: Math.min(
                    _fuzzyScore(query, String(r.CD_RELATORIO)),
                    _fuzzyScore(query, r.DS_TITULO || '')
                )
            }))
            .filter(x => x.score < Infinity)
            .sort((a, b) => a.score - b.score)
            .map(x => x.r);
    }
    // ==========================================

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
                    // Usa fuzzy search para tolerar erros de digitação
                    const matches = _fuzzySearch(val, ctx.allReports).slice(0, 15);
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

            // Esc fecha os resultados do spotlight
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    results.style.display = 'none';
                    input.blur();
                }
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
                results.innerHTML = `<div style="padding: 14px; color: var(--tasy-text-muted); font-size: 14px; text-align: center;">Nenhum relatório encontrado.</div>`;
                return;
            }
            results.style.display = 'block';
            results.innerHTML = list.map(r => `
                <div class="tasy-res-item" data-code="${r.CD_RELATORIO}" data-seq="${r.NR_SEQUENCIA}" style="padding: 12px 18px; border-bottom: 1px solid var(--tasy-border); display: flex; align-items: center; justify-content: space-between; transition: background 0.1s; cursor: pointer;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: var(--tasy-text-main); font-size: 14px; font-weight: 500;">${r.CD_RELATORIO}</span>
                        <span style="color: var(--tasy-text-muted); font-size: 12px; font-weight: 400; margin-top:2px;">${r.DS_TITULO || 'Relatório S/N'}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="tasy-btn-edit tasy-btn-ghost" style="display:flex;align-items:center;gap:6px;"><span style="color:var(--tasy-text-muted);display:flex;">${Icons.edit}</span> UI</button>
                        <button class="tasy-btn-gen tasy-btn-ghost" style="display:flex;align-items:center;gap:6px;"><span style="color:var(--tasy-text-muted);display:flex;">${Icons.print}</span> PDF</button>
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
                         style="padding:12px 18px; border-bottom:1px solid var(--tasy-border); display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.1s;"
                         onmouseover="this.style.background='var(--tasy-bg-hover)'"
                         onmouseout="this.style.background='transparent'">
                        <div style="display:flex; flex-direction:column; gap:4px; min-width:0; overflow:hidden;">
                            <div style="display:flex; align-items:center; gap:6px; font-size:12px;">
                                <span style="color:var(--tasy-text-main); font-weight:500; flex-shrink:0;">${t.code}</span>
                                <span style="color:var(--tasy-text-muted);">/</span>
                                <span style="color:var(--tasy-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.bandName}</span>
                                <span style="color:var(--tasy-text-muted);">/</span>
                                <span style="color:var(--tasy-text-main); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.fieldName}</span>
                            </div>
                            <span style="color:var(--tasy-text-muted); font-size:10px;">${t.date}</span>
                        </div>
                        <button class="tasy-btn-resume" style="border:none; background:var(--tasy-text-main); color:var(--tasy-bg-base); padding:6px 12px; border-radius:var(--tasy-radius-sm); font-weight:600; font-size:11px; cursor:pointer; flex-shrink:0; margin-left:10px; transition:all 0.2s; box-shadow:0 2px 8px rgba(255,255,255,0.1);"
                          onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(255,255,255,0.15)'"
                          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(255,255,255,0.1)'">
                          Continuar →
                        </button>
                    </div>`).join('');

                timelineHtml = `
                    <div style="border-bottom:1px solid var(--tasy-border);">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 18px;">
                            <span style="color:var(--tasy-text-muted); font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase;">Atividade Recente</span>
                            <button id="tasy-btn-timeline-clear" style="background:none; border:none; color:var(--tasy-text-muted); font-size:10px; font-weight:500; cursor:pointer; padding:2px 4px; transition:color 0.2s;" onmouseover="this.style.color='var(--tasy-text-main)'" onmouseout="this.style.color='var(--tasy-text-muted)'">limpar</button>
                        </div>
                        ${timelineItems}
                    </div>`;
            }

            if (!ctx.historyData || ctx.historyData.length === 0) {
                if (!timelineHtml) {
                    results.innerHTML = `
                        <div style="padding:32px 16px; display:flex; flex-direction:column; align-items:center; gap:8px;">
                            <div style="color:var(--tasy-text-muted); display:flex; align-items:center; justify-content:center; width:40px;height:40px;border-radius:50%;background:var(--tasy-bg-hover);margin-bottom:8px;">${Icons.history}</div>
                            <div style="color:var(--tasy-text-main); font-size:13px; font-weight:500; text-align:center;">Nenhuma atividade recente</div>
                            <div style="color:var(--tasy-text-muted); font-size:12px;">Busque e abra um relatório para editar</div>
                        </div>`;
                } else {
                    results.innerHTML = timelineHtml;
                }
                return;
            }

            const headerHtml = `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 18px; border-bottom:1px solid var(--tasy-border);">
                    <span style="color:var(--tasy-text-muted); font-size:10px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase; display:flex; align-items:center; gap:6px;">${Icons.history} PDFs Gerados</span>
                    <button id="tasy-btn-hist-clear" style="background:none; border:none; color:var(--tasy-text-muted); font-size:10px; font-weight:500; cursor:pointer; padding:2px 4px; transition:color 0.2s;" onmouseover="this.style.color='var(--tasy-text-main)'" onmouseout="this.style.color='var(--tasy-text-muted)'">limpar</button>
                </div>`;

            const itemsHtml = ctx.historyData.slice(0, 8).map(h => `
                <div class="tasy-res-item tasy-hist-item" data-code="${h.code}" data-seq="${h.seq || ''}"
                    style="padding:12px 18px; border-bottom:1px solid var(--tasy-border); display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.1s;"
                    onmouseover="this.style.background='var(--tasy-bg-hover)'"
                    onmouseout="this.style.background='transparent'">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span style="color:var(--tasy-text-main); font-size:13px; font-weight:500;">${h.code}</span>
                        <span style="color:var(--tasy-text-muted); font-size:11px;">${h.date || ''}</span>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="tasy-btn-edit tasy-btn-ghost" style="padding:5px;display:flex;">${Icons.edit}</button>
                        <button class="tasy-btn-gen tasy-btn-ghost" style="padding:5px;display:flex;">${Icons.print}</button>
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
                <div style="padding: 24px 18px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
                    <div style="color: var(--tasy-text-main); font-size: 14px; font-weight: 500; text-align: center;">Limpar todo o histórico?</div>
                    <div style="display: flex; gap: 12px; width:100%;">
                        <button id="tasy-btn-confirm-clear-no" style="flex:1; background: transparent; color: var(--tasy-text-main); border: 1px solid var(--tasy-border); padding: 8px 16px; border-radius: var(--tasy-radius-sm); font-size: 13px; font-weight: 500; cursor: pointer; transition:all 0.2s;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">Cancelar</button>
                        <button id="tasy-btn-confirm-clear-yes" style="flex:1; background: var(--tasy-danger); color: white; border: none; padding: 8px 16px; border-radius: var(--tasy-radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition:all 0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'">Sim, limpar</button>
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
