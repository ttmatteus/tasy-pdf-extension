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
        if (code) return { code, type: 'CMCZ' };

        if (scope.detailRecord?.CD_RELATORIO) {
          return { code: scope.detailRecord.CD_RELATORIO, type: 'CMCZ' };
        }

        if (scope.selectedRecord?.CD_RELATORIO) {
          return {
            code: scope.selectedRecord.CD_RELATORIO,
            type: scope.selectedRecord.IE_TIPO_RELATORIO || 'CMCZ'
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
          code,
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

  ctx.startPrefetchRoutine = function() {
    if (!ctx.prefs.prefetch) return;
    
    if (prefetchTimer) clearInterval(prefetchTimer);

    prefetchTimer = setInterval(async () => {
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
          }
        }
      } catch (e) {
      }
    }, 2000);
  };

  ctx.getCachedReportParam = () => cachedReportParam;
  ctx.setCachedReportParam = (p) => { cachedReportParam = p; };

})(window.TasyPdf);
