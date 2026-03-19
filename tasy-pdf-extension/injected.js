(() => {
  // evita instalar o msm hook duas vezes
  if (window.__pdfAutoScriptInstalled) return;
  window.__pdfAutoScriptInstalled = true;

  let previewWindow = null;
  let running = false;

  function getReportCodeFromScope() {
    const seen = new Set();
    // varre os scopes da tela até achar algum lugar onde o CD_RELATORIO apareceu
    for (const el of document.querySelectorAll('*')) {
      try {
        const scope = angular.element(el).scope();
        if (!scope || seen.has(scope.$id)) continue;
        seen.add(scope.$id);

        // caso mais comum: wActivator ja carrega o codigo do relatorio
        const code = scope.wActivator?.dataSourceRequest?.paramsByName?.CD_RELATORIO;
        if (code) {
          return { code, type: 'CMCZ' };
        }

        // as vezes vem no registro de detalhe
        if (scope.detailRecord?.CD_RELATORIO) {
          return { code: scope.detailRecord.CD_RELATORIO, type: 'CMCZ' };
        }

        // fallback: registro selecionado da grid/lsita
        if (scope.selectedRecord?.CD_RELATORIO) {
          return { code: scope.selectedRecord.CD_RELATORIO, type: scope.selectedRecord.IE_TIPO_RELATORIO || 'CMCZ' };
        }
      } catch {}
    }
    return null;
  }

  function buildReportsDataBody(code, type) {
     // payload da primeira chamada, só pra Tasy devolver os metadados do relatório
    return [
      {
        '@class': 'br.com.philips.tasy.dto.shared.report.ReportsParam',
        reports: [{
          '@class': 'br.com.philips.tasy.dto.shared.report.ReportParam',
          type: type,
          code: code,
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
    // payload da geração de fato, reaproveitando o que voltou no getReportsData
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

  async function runAfterSave() {
    // trava simples pra não disparar duas gerações ao mesmo tempo
    if (running) return;
    running = true;
    try {
      const reportInfo = getReportCodeFromScope();
      if (!reportInfo) {
        return;
      }

      const injector = angular.element(document.body).injector();
      const $http = injector.get('$http');

      // 1) pega a definicao do relatorio
      const r1 = await $http.post(
        '/TasyAppServer/resources/service/Report/getReportsData',
        buildReportsDataBody(reportInfo.code, reportInfo.type)
      );
      const reportParam = r1.data?.reports?.[0];
      if (!reportParam) throw new Error('report não encontrado em getReportsData');

      // 2) manda gerar o PDF
      const r2 = await $http.post(
        '/TasyAppServer/resources/service/Report/generateReports',
        buildGenerateBody(reportParam)
      );
      const pdfFileName = r2.data?.reports?.[0]?.pdfFileName;
      if (!pdfFileName) throw new Error('pdfFileName não encontrado: ' + JSON.stringify(r2.data).slice(0, 200));

      // 3) atualizar a janela de preview se ela ja existir, se n abre uma nova
      const pdfUrl = '/TasyAppServer/resources/files/pdf/' + pdfFileName;
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.replace(pdfUrl);
        previewWindow.focus();
      } else {
        previewWindow = window.open(pdfUrl, '__pdf_preview__', 'width=1100,height=900');
      }

    } catch (e) {
    } finally {
      running = false;
    }
  }

  function onSaveDetected(url) {
    //endpoints q constuman indicar persistencia no tasy
    if (
      url.includes('WebNativeDataSource/performAction') ||
      url.includes('saveInlineEdit')
    ) {
      // pequeno delay pra garantir q o backend terminou de gravar antes de gerar
      setTimeout(() => runAfterSave(), 500);
    }
  }

  // hook em XHR pq boa parte do tasy ainda passa por aqui
  const _xhrOpen = XMLHttpRequest.prototype.open;
  const _xhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__m = method;
    this.__u = url;
    return _xhrOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function(body) {
    try {
      if ((this.__m || '').toUpperCase() === 'POST') onSaveDetected(this.__u || '');
    } catch {}
    // n deixa o hook quebrar a request original
    return _xhrSend.call(this, body);
  };

  // hook em fetch pro q estiver usando API mais nova
  const _oldFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    try {
      const url    = typeof input === 'string' ? input : (input?.url || '');
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'POST') onSaveDetected(url);
    } catch {}
    return _oldFetch(input, init);
  };

  // fallback horrivel kkkk, mas é util so é im clique no botao de salvar inline
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('button.datagrid-inline-edit-save');
    if (btn) {
      setTimeout(() => runAfterSave(), 500);
    }
  }, true);
})();
