(() => {
  if (window.__pdfAutoScriptInstalled) return;
  window.__pdfAutoScriptInstalled = true;

  let previewWindow = null;
  let running = false;
  let pendingRun = false;
  let cachedReportParam = null;
  let saveDebounceTimer = null;
  let prefetchTimer = null;
  let $httpGlobal = null;
  // Lê a preferência injetada pelo background.js (fallback para "tudo ligado" caso não exista)
  const prefs = window.__tasyPdfPrefs || { doubleBuffer: true, prefetch: true };

  function initAngularDependencies() {
    // espera o Angular/injector ficar disponível antes de plugar no $http
    if (typeof angular === 'undefined') {
      setTimeout(initAngularDependencies, 500);
      return;
    }

    const injector = angular.element(document.body).injector();
    if (!injector) {
      setTimeout(initAngularDependencies, 500);
      return;
    }

    $httpGlobal = injector.get('$http');
    const _oldPost = $httpGlobal.post.bind($httpGlobal);

    // intercepta post do Angular pra reagir só quando o save realmente voltar ok
    $httpGlobal.post = function(url, data, config) {
      const promise = _oldPost(url, data, config);

      if (url.includes('WebNativeDataSource/performAction')) {
        promise.then(res => {
          const acao = res.data?.dados?.acao;

          if (acao === 'UPDATE' || acao === 'INSERT') {
            triggerDebounced();
          }
        }).catch(() => {
        });
      }

      return promise;
    };

    startPrefetchRoutine();
  }

  function getReportCodeFromScope() {
    // tenta achar o CD_RELATORIO em pontos mais prováveis da tela
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
      } catch {
      }
    }

    return null;
  }

  function buildReportsDataBody(code, type) {
    // payload mínimo pra buscar metadados do relatório
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
  }

  function buildGenerateBody(r) {
    // payload de geração reaproveitando os dados resolvidos no getReportsData
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
  }

  function startPrefetchRoutine() {
    // se o usuário desligou via UI, não prefetchamos
    if (!prefs.prefetch) return;
    
    // mantém um cache quente do relatório atual pra reduzir tempo no pós-save
    if (prefetchTimer) clearInterval(prefetchTimer);

    prefetchTimer = setInterval(async () => {
      // não disputa request enquanto estiver gerando ou sem $http pronto
      if (running || !$httpGlobal) return;

      try {
        const reportInfo = getReportCodeFromScope();
        if (!reportInfo) return;

        // atualiza cache só quando ainda não existe ou mudou o relatório da tela
        if (!cachedReportParam || cachedReportParam.code !== reportInfo.code) {
          const r1 = await $httpGlobal.post(
            '/TasyAppServer/resources/service/Report/getReportsData',
            buildReportsDataBody(reportInfo.code, reportInfo.type)
          );

          if (r1.data?.reports?.[0]) {
            cachedReportParam = r1.data.reports[0];
          }
        }
      } catch (e) {
        // prefetch é opportunistic: errou, tenta de novo no próximo ciclo
      }
    }, 2000);
  }

  function updateOrOpenPreview(pdfUrl) {
    // Se a opção doubleBuffer estiver DESLIGADA nas configs:
    if (!prefs.doubleBuffer) {
      if (!previewWindow || previewWindow.closed) {
        previewWindow = window.open(pdfUrl, '__pdf_preview__', 'width=1100,height=900');
        console.log('[Auto] PDF aberto inicial (Sem buffer)');
      } else {
        previewWindow.location.replace(pdfUrl);
        try { previewWindow.focus(); } catch (e) {}
        console.log('[Auto] PDF atualizado (Sem buffer - location replace via config)');
      }
      return;
    }

    // primeira execução: abre janela própria com dois iframes pra swap
    if (!previewWindow || previewWindow.closed) {
      previewWindow = window.open('', '__pdf_preview__', 'width=1100,height=900');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Live Preview Tasy</title>
          <style>
            body { margin: 0; overflow: hidden; background: #525659; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe id="frame1" style="z-index: 2;" src="${pdfUrl}"></iframe>
          <iframe id="frame2" style="z-index: 1;"></iframe>
        </body>
        </html>
      `;

      previewWindow.document.open();
      previewWindow.document.write(html);
      previewWindow.document.close();
      previewWindow.activeFrame = 1;
      return;
    }

    const doc = previewWindow.document;
    const nextFrameNo = previewWindow.activeFrame === 1 ? 2 : 1;
    const currentFrameNo = previewWindow.activeFrame;

    const nextFrame = doc.getElementById('frame' + nextFrameNo);
    const currentFrame = doc.getElementById('frame' + currentFrameNo);

    // se perdeu a estrutura da janela, cai pro replace direto
    if (!nextFrame || !currentFrame) {
      previewWindow.location.replace(pdfUrl);
      return;
    }

    // carrega no iframe de trás e só troca quando terminar de renderizar
    nextFrame.onload = function() {
      nextFrame.style.zIndex = 2;
      currentFrame.style.zIndex = 1;
      previewWindow.activeFrame = nextFrameNo;
      nextFrame.onload = null;
    };

    nextFrame.src = pdfUrl;

    try {
      previewWindow.focus();
    } catch (e) {
    }
  }

  async function runAfterSave() {
    // se já estiver processando, marca pendência pra rodar de novo no final
    if (running) {
      pendingRun = true;
      return;
    }

    running = true;

    try {
      const reportInfo = getReportCodeFromScope();
      if (!reportInfo) {
        console.log('[Auto] relatório não encontrado no scope');
        return;
      }

      // fallback: se o cache ainda não esquentou, resolve na hora
      if (!cachedReportParam || cachedReportParam.code !== reportInfo.code) {
        const r1 = await $httpGlobal.post(
          '/TasyAppServer/resources/service/Report/getReportsData',
          buildReportsDataBody(reportInfo.code, reportInfo.type)
        );

        cachedReportParam = r1.data?.reports?.[0];
        if (!cachedReportParam) {
          throw new Error('relatório não encontrado em getReportsData');
        }
      }

      const r2 = await $httpGlobal.post(
        '/TasyAppServer/resources/service/Report/generateReports',
        buildGenerateBody(cachedReportParam)
      );

      const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
      if (!pdfFileName) throw new Error('pdfFileName não encontrado');

      const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;

      updateOrOpenPreview(pdfUrl);
    } catch (e) {
      console.log('[Erro]', e.message);
    } finally {
      running = false;

      // descarrega execução pendente caso tenha entrado save no meio da geração
      if (pendingRun) {
        pendingRun = false;
        setTimeout(() => runAfterSave(), 0);
      }
    }
  }

  function triggerDebounced() {
    // agrupa saves muito próximos pra não gerar PDF em cascata
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => runAfterSave(), 0);
  }

  // fallback de clique mantém o ponto de extensão caso precise reagir por UI
  document.addEventListener('click', function(e) {
    if (e.target.closest('button.datagrid-inline-edit-save')) {
      // clique do botão fica só como apoio o gatilho principal é a resposta do backend
    }
  }, true);

  initAngularDependencies();
})();