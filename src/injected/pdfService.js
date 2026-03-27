window.TasyPdf = window.TasyPdf || {};

(function(ctx) {
  let cachedReportParam = null;
  let prefetchTimer = null;

  ctx.getReportCodeFromScope = function() {
    for (const el of document.querySelectorAll('div.wdbpanel, div.wcpanel, [w-activator], [wactivator]')) {
      try {
        const scope = angular.element(el).scope();
        if (!scope) continue;

        const code = scope.wActivator?.dataSourceRequest?.paramsByName?.CD_RELATORIO;
        if (code) return { code, type: ctx.prefs?.reportTypes?.[0] || 'CMCZ' };

        if (scope.detailRecord?.CD_RELATORIO) {
          return { code: scope.detailRecord.CD_RELATORIO, type: ctx.prefs?.reportTypes?.[0] || 'CMCZ' };
        }

        if (scope.selectedRecord?.CD_RELATORIO) {
          return {
            code: scope.selectedRecord.CD_RELATORIO,
            type: scope.selectedRecord.IE_TIPO_RELATORIO || ctx.prefs?.reportTypes?.[0] || 'CMCZ'
          };
        }
      } catch {}
    }
    return null;
  };

  ctx.buildReportsDataBody = function(code, type) {
    return [
      {
        '@class': 'br.com.philips.tasy.dto.shared.report.ReportsParam',
        reports: [{
          '@class': 'br.com.philips.tasy.dto.shared.report.ReportParam',
          type,
          code: Number(code),
          parameters: { ADVF_DIMENSIONS: [] },
          customGenerate: false,
          printedCopies: 1,
          duplexPrinting: 'N'
        }]
      },
      { tipo: 'String', valor: '' }
    ];
  };

  ctx.buildGenerateBody = function(r) {
    return [
      {
        '@class': 'br.com.philips.tasy.dto.shared.report.ReportsParam',
        reports: [{
          '@class': r['@class'],
          title: r.title,
          type: r.type,
          code: r.code,
          parameters: r.parameters,
          customGenerate: r.customGenerate,
          kind: r.kind,
          sequenceId: r.sequenceId,
          printedCopies: 1,
          duplexPrinting: 'N',
          usingSectorPrinters: false,
          printSetup: false,
          showParameters: false,
          tray: 0,
          sharedParameter: false,
          useDigitalSign: false,
          internalUseDigitalSign: false,
          paperSize: r.paperSize || 'A4'
        }],
        printersAvailable: [],
        defaultPrinter: null,
        fileList: [],
        localStoragePrinterName: null
      },
      { tipo: 'Boolean', valor: false },
      { tipo: 'Integer', valor: 260 },
      { tipo: 'String' },
      { tipo: 'String', valor: '' },
      { tipo: 'boolean', valor: true },
      { tipo: 'HashMap', valor: {} },
      { tipo: 'String', valor: '' }
    ];
  };

  // Executa o prefetch dos parâmetros de um relatório ao detectar mudança de painel
  async function _runPrefetch() {
    if (ctx.running || !ctx.$httpGlobal) return;
    try {
      const reportInfo = ctx.getReportCodeFromScope();
      if (!reportInfo) return;
      if (!cachedReportParam || cachedReportParam.code !== reportInfo.code) {
        const r1 = await ctx.$httpGlobal.post(
          '/TasyAppServer/resources/service/Report/getReportsData',
          ctx.buildReportsDataBody(reportInfo.code, reportInfo.type)
        );
        if (r1.data?.reports?.[0]) {
          cachedReportParam = r1.data.reports[0];
          ctx.log?.('Prefetch concluído para:', reportInfo.code);
        }
      }
    } catch (e) {}
  }

  ctx.startPrefetchRoutine = function() {
    if (!ctx.prefs.prefetch) return;

    // Para qualquer rotina anterior
    if (prefetchTimer) { clearInterval(prefetchTimer); prefetchTimer = null; }
    if (ctx._prefetchObserver) { ctx._prefetchObserver.disconnect(); ctx._prefetchObserver = null; }

    // Tenta usar MutationObserver para reagir a mudanças de painel no Tasy
    // É muito mais eficiente que polling: só dispara quando o DOM realmente muda
    const tasyRoot = document.querySelector('body'); // observa o body pois os painéis são inseridos dinamicamente
    if (tasyRoot) {
      let debounceTimer = null;
      ctx._prefetchObserver = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(_runPrefetch, 600);
      });
      ctx._prefetchObserver.observe(tasyRoot, { childList: true, subtree: true, attributes: false, characterData: false });
      ctx.log?.('Prefetch via MutationObserver ativo');
    }

    // Fallback: setInterval a cada 5s para casos onde o MutationObserver não pega a mudança
    prefetchTimer = setInterval(_runPrefetch, 5000);
  };

  ctx.getCachedReportParam = () => cachedReportParam;
  ctx.setCachedReportParam = (p) => { cachedReportParam = p; };

})(window.TasyPdf);
