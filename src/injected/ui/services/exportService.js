window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    const { Icons, state, Toasts, Navbar } = ctx;

    ctx.ExportService = {
        openImportModal: function () {
            document.getElementById('tasy-modal-import-standalone')?.remove();
            const m = document.createElement('div');
            m.id = 'tasy-modal-import-standalone';
            Object.assign(m.style, {
                position: 'fixed', inset: '0', zIndex: '2000000000',
                background: 'rgba(0,0,0,0.72)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
            });
            m.innerHTML = `
                <div style="background:var(--tasy-bg-surface-solid);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-lg);padding:24px;width:380px;max-width:95vw;box-shadow:var(--tasy-shadow-lg);font-family:system-ui,sans-serif;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="color:var(--tasy-text-main);font-size:15px;font-weight:600;">↑ Importar Relatório XML</span>
                    <button id="imp-close" style="background:none;border:none;color:var(--tasy-text-muted);cursor:pointer;font-size:20px;line-height:1;transition:color 0.2s;" onmouseover="this.style.color='var(--tasy-text-main)'" onmouseout="this.style.color='var(--tasy-text-muted)'">✕</button>
                  </div>
                  <div style="color:var(--tasy-text-muted);font-size:12px;margin-bottom:24px;">Importa o relatório exatamente como exportado pelo Tasy Studio ou pelo Tasy nativo.</div>
                  <label id="imp-drop-zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:32px 20px;background:transparent;border:2px dashed var(--tasy-border);border-radius:var(--tasy-radius-md);cursor:pointer;transition:all 0.2s;text-align:center;">
                    <div style="width:48px;height:48px;background:var(--tasy-bg-hover);border-radius:var(--tasy-radius-md);display:flex;align-items:center;justify-content:center;color:var(--tasy-text-main);font-size:24px;font-weight:700;">↑</div>
                    <div>
                      <div style="color:var(--tasy-text-main);font-size:13px;font-weight:500;">Clique ou arraste o arquivo</div>
                      <div id="imp-hint" style="color:var(--tasy-text-muted);font-size:11px;margin-top:4px;">Aceita arquivos .xml exportados pelo Studio</div>
                    </div>
                    <input id="imp-file-input" type="file" accept=".xml" style="display:none;">
                  </label>
                </div>`;
            document.body.appendChild(m);

            const closeImp = () => m.remove();
            document.getElementById('imp-close').addEventListener('click', closeImp);
            m.addEventListener('mousedown', (e) => { if (e.target === m) closeImp(); });

            const dropZone = document.getElementById('imp-drop-zone');
            const fileInput = document.getElementById('imp-file-input');
            const hint = document.getElementById('imp-hint');

            fileInput.addEventListener('change', () => { if (fileInput.files?.[0]) this.runImport(fileInput.files[0], dropZone, hint, closeImp); });
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--tasy-text-muted)'; dropZone.style.background = 'var(--tasy-bg-hover)'; });
            dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--tasy-border)'; dropZone.style.background = 'transparent'; });
            dropZone.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) this.runImport(f, dropZone, hint, closeImp); });
        },

        openExportModal: function () {
            document.getElementById('tasy-modal-export')?.remove();
            const modal = document.createElement('div');
            modal.id = 'tasy-modal-export';
            Object.assign(modal.style, {
                position: 'fixed', inset: '0', zIndex: '2000000000',
                background: 'rgba(0,0,0,0.72)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
            });
            modal.innerHTML = `
                <div style="background:var(--tasy-bg-surface-solid);border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-lg);padding:32px;width:420px;max-width:95vw;box-shadow:var(--tasy-shadow-lg);font-family:system-ui,sans-serif;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="color:var(--tasy-text-main);font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;"><span style="color:var(--tasy-text-muted)">${Icons.exportIcon}</span> Exportar / Importar</span>
                    <button id="exp-close" style="background:none;border:none;color:var(--tasy-text-muted);cursor:pointer;font-size:20px;line-height:1;transition:color 0.2s;" onmouseover="this.style.color='var(--tasy-text-main)'" onmouseout="this.style.color='var(--tasy-text-muted)'">✕</button>
                  </div>
                  <div style="color:var(--tasy-text-muted);font-size:12px;margin-bottom:24px;">Relatório <span style="color:var(--tasy-text-main);font-weight:500;">${state.reportCode}</span></div>
                  <div style="display:flex;flex-direction:column;gap:12px;">
                    <button id="exp-xml" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">
                      <div style="width:38px;height:38px;background:var(--tasy-bg-hover);border-radius:var(--tasy-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--tasy-text-main);font-size:14px;font-weight:700;">XML</div>
                      <div><div style="color:var(--tasy-text-main);font-size:13px;font-weight:500;">Estrutura Completa</div><div style="color:var(--tasy-text-muted);font-size:11px;margin-top:2px;">Bandas, campos e parâmetros — compatível com importação</div></div>
                    </button>
                    <button id="exp-pdf" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.background='var(--tasy-danger-bg)';this.style.borderColor='var(--tasy-danger)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--tasy-border)'">
                      <div style="width:38px;height:38px;background:var(--tasy-bg-hover);border-radius:var(--tasy-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--tasy-danger);font-size:14px;font-weight:700;">PDF</div>
                      <div><div style="color:var(--tasy-text-main);font-size:13px;font-weight:500;">Gerar e Baixar PDF</div><div style="color:var(--tasy-text-muted);font-size:11px;margin-top:2px;">Gera o relatório e baixa o arquivo PDF gerado</div></div>
                    </button>
                    <button id="exp-json" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid var(--tasy-border);border-radius:var(--tasy-radius-sm);cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">
                      <div style="width:38px;height:38px;background:var(--tasy-bg-hover);border-radius:var(--tasy-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--tasy-text-main);font-size:12px;font-weight:700;">JSON</div>
                      <div><div style="color:var(--tasy-text-main);font-size:13px;font-weight:500;">Backup Legível</div><div style="color:var(--tasy-text-muted);font-size:11px;margin-top:2px;">Estrutura completa em JSON — fácil de ler e editar</div></div>
                    </button>
                    <div style="height:1px;background:var(--tasy-border);margin:4px 0;"></div>
                    <button id="exp-copy-json" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px dashed var(--tasy-border);border-radius:var(--tasy-radius-sm);cursor:pointer;transition:all 0.2s;text-align:left;width:100%;" onmouseover="this.style.background='var(--tasy-bg-hover)'" onmouseout="this.style.background='transparent'">
                      <div style="width:38px;height:38px;background:var(--tasy-bg-hover);border-radius:var(--tasy-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--tasy-text-main);font-size:16px;font-weight:500;">⎘</div>
                      <div><div style="color:var(--tasy-text-main);font-size:13px;font-weight:500;">Copiar JSON</div><div style="color:var(--tasy-text-muted);font-size:11px;margin-top:2px;">Copia estrutura completa para área de transferência</div></div>
                    </button>
                    <div style="height:1px;background:var(--tasy-border);margin:4px 0;"></div>
                    <label id="exp-import-label" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid var(--tasy-text-main);border-radius:var(--tasy-radius-sm);cursor:pointer;transition:all 0.2s;text-align:left;width:100%;box-sizing:border-box;" onmouseover="this.style.background='var(--tasy-text-main)';this.style.color='var(--tasy-bg-base)'" onmouseout="this.style.background='transparent';this.style.color='var(--tasy-text-main)'">
                      <div style="width:38px;height:38px;background:var(--tasy-bg-base);border-radius:var(--tasy-radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit;font-size:18px;font-weight:700;">↑</div>
                      <div style="flex:1;"><div style="color:inherit;font-size:13px;font-weight:600;">Importar XML</div><div id="exp-import-hint" style="color:inherit;opacity:0.8;font-size:11px;margin-top:2px;">Selecione ou arraste um arquivo .xml para importar</div></div>
                      <input id="exp-import-input" type="file" accept=".xml" style="display:none;">
                    </label>
                  </div>
                </div>`;
            document.body.appendChild(modal);

            const closeModal = () => modal.remove();
            document.getElementById('exp-close').addEventListener('click', closeModal);
            modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

            document.getElementById('exp-xml').addEventListener('click', () => this.exportXml());
            document.getElementById('exp-pdf').addEventListener('click', () => this.exportPdf());
            document.getElementById('exp-json').addEventListener('click', () => this.exportJson());
            document.getElementById('exp-copy-json').addEventListener('click', () => this.copyJson());
            
            const importInput = document.getElementById('exp-import-input');
            const importLabel = document.getElementById('exp-import-label');
            const importHint = document.getElementById('exp-import-hint');
            importInput.addEventListener('change', () => { if (importInput.files?.[0]) this.runImport(importInput.files[0], importLabel, importHint, closeModal); });
        },

        runImport: async function (file, dropZone, hint, onSuccess) {
            if (!file || !file.name.match(/\.xml$/i)) { Toasts.show('Selecione um arquivo .xml válido.', 'error'); return; }
            dropZone.style.borderColor = 'var(--tasy-text-main)';
            dropZone.style.background = 'var(--tasy-bg-hover)';
            dropZone.style.pointerEvents = 'none';
            hint.textContent = `Enviando "${file.name}"...`;
            try {
                const fd = new FormData();
                fd.append('file', file, file.name);
                const up = await fetch('/TasyAppServer/resources/files', { method: 'POST', body: fd, credentials: 'include' });
                if (!up.ok) throw new Error('Upload falhou: HTTP ' + up.status);
                const upResult = await up.json();
                const xmlPath = Array.isArray(upResult) ? upResult[0] : upResult;
                if (!xmlPath?.startsWith('tasy-storage://')) throw new Error('Path inválido: ' + JSON.stringify(xmlPath));
                
                hint.textContent = 'Registrando...';
                const http = ctx.getHttpService();
                if (!http) throw new Error('Angular não está pronto.');
                await http.post('/TasyAppServer/resources/service/CorSisFQ/importXMLReportAction', [{ tipo: 'HashMap', valor: { XML_PATH: xmlPath } }], { suppressError: true, ignoreError: true });
                
                hint.textContent = 'Aplicando...';
                let nrSeq = null;
                try {
                    const doc = new DOMParser().parseFromString(await file.text(), 'text/xml');
                    const reg = doc.querySelector('Tabela[nm_tabela="W_RELATORIO"] registros registro');
                    if (reg) nrSeq = parseInt(reg.getAttribute('NR_SEQUENCIA'));
                } catch (e) { }
                if (!nrSeq) throw new Error('Não foi possível extrair NR_SEQUENCIA do XML.');
                
                const r3 = await http.post('/TasyAppServer/resources/service/CorSisFQ/atualizarBaseRelatorioImp', [{ tipo: 'HashMap', valor: { NR_SEQUENCIA: nrSeq } }], { suppressError: true, ignoreError: true });
                const newSeq = r3?.data?.dados;
                
                Toasts.show(`Relatório importado! Abrindo editor...`, 'success');
                onSuccess();
                
                if (newSeq) {
                    let cdRelatorio = '';
                    try {
                        const doc2 = new DOMParser().parseFromString(await file.text(), 'text/xml');
                        const reg2 = doc2.querySelector('Tabela[nm_tabela="W_RELATORIO"] registros registro');
                        cdRelatorio = reg2?.getAttribute('CD_RELATORIO') || '';
                    } catch (e) { }
                    state.reportSeq = newSeq;
                    state.reportCode = cdRelatorio || String(newSeq);
                    state.level = 1;
                    ctx.Bands.load();
                }
            } catch (err) {
                Toasts.show('Erro ao importar: ' + err.message, 'error');
                dropZone.style.borderColor = 'var(--tasy-border)';
                dropZone.style.background = 'transparent';
                dropZone.style.pointerEvents = '';
                hint.textContent = 'Aceita arquivos .xml exportados pelo Studio';
            }
        },

        exportXml: async function () {
            const btn = document.getElementById('exp-xml');
            btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
            try {
                const http = ctx.getHttpService();
                const r = await http.post('/TasyAppServer/resources/service/CorSisFQ/exportatAction', [{ tipo: 'HashMap', valor: { NR_SEQ_RELAT: Number(state.reportSeq) } }], { suppressError: true, ignoreError: true });
                const xml = r?.data?.dados;
                if (!xml || !xml.includes('<?xml')) throw new Error('XML inválido na resposta');
                this.triggerDownload(xml, `relatorio_${state.reportCode}_${state.reportSeq}.xml`, 'application/xml');
                Toasts.show(`XML exportado!`, 'success');
                document.getElementById('tasy-modal-export')?.remove();
            } catch (err) {
                Toasts.show('Erro ao exportar XML: ' + err.message, 'error');
                btn.style.opacity = '1'; btn.style.pointerEvents = '';
            }
        },

        exportPdf: async function () {
            const btn = document.getElementById('exp-pdf');
            btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
            try {
                const http = ctx.getHttpService();
                const param = await (async () => {
                    const r1 = await http.post('/TasyAppServer/resources/service/Report/getReportsData', ctx.buildReportsDataBody(state.reportCode, ctx.prefs?.reportTypes?.[0] || 'CMCZ'), { suppressError: true, ignoreError: true });
                    return r1.data?.reports?.[0];
                })();
                if (!param) throw new Error('Parâmetros do relatório não encontrados');
                const r2 = await http.post('/TasyAppServer/resources/service/Report/generateReports', ctx.buildGenerateBody(param), { suppressError: true, ignoreError: true });
                const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
                if (!pdfFileName) throw new Error('PDF não gerado pelo servidor');
                const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;
                const resp = await fetch(pdfUrl, { credentials: 'include' });
                const blob = await resp.blob();
                this.triggerDownload(await blob.arrayBuffer(), `relatorio_${state.reportCode}.pdf`, 'application/pdf');
                Toasts.show('PDF baixado!', 'success');
                document.getElementById('tasy-modal-export')?.remove();
            } catch (err) {
                Toasts.show('Erro ao gerar PDF: ' + err.message, 'error');
                btn.style.opacity = '1'; btn.style.pointerEvents = '';
            }
        },

        copyJson: async function () {
            const btn = document.getElementById('exp-copy-json');
            if (btn) { btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none'; }
            try {
                const bands = await ctx.fetchBands(state.reportSeq);
                const fullData = { exportedAt: new Date().toISOString(), reportCode: state.reportCode, reportSeq: state.reportSeq, bands: [] };
                for (const band of bands) {
                    const fields = await ctx.fetchFields(band.NR_SEQUENCIA);
                    fullData.bands.push({ ...band, fields });
                }
                const json = JSON.stringify(fullData, null, 2);
                await navigator.clipboard.writeText(json);
                Toasts.show(`JSON copiado! (${bands.length} bandas)`, 'success');
                document.getElementById('tasy-modal-export')?.remove();
            } catch (err) {
                Toasts.show('Erro ao copiar JSON: ' + err.message, 'error');
                if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = ''; }
            }
        },

        exportJson: async function () {
            const btn = document.getElementById('exp-json');
            btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none';
            try {
                const bands = await ctx.fetchBands(state.reportSeq);
                const fullData = { exportedAt: new Date().toISOString(), reportCode: state.reportCode, reportSeq: state.reportSeq, bands: [] };
                for (const band of bands) {
                    const fields = await ctx.fetchFields(band.NR_SEQUENCIA);
                    fullData.bands.push({ ...band, fields });
                }
                const json = JSON.stringify(fullData, null, 2);
                this.triggerDownload(json, `relatorio_${state.reportCode}_${state.reportSeq}.json`, 'application/json');
                Toasts.show(`JSON exportado — ${bands.length} bandas!`, 'success');
                document.getElementById('tasy-modal-export')?.remove();
            } catch (err) {
                Toasts.show('Erro ao exportar JSON: ' + err.message, 'error');
                btn.style.opacity = '1'; btn.style.pointerEvents = '';
            }
        },

        triggerDownload: function (data, filename, mimeType) {
            const blob = data instanceof ArrayBuffer ? new Blob([data], { type: mimeType }) : new Blob([data], { type: mimeType + ';charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        }
    };
})(window.TasyPdf);
