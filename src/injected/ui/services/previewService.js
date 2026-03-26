window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    let previewWindow = null;

    ctx.PreviewService = {
        updateOrOpenPreview: function (pdfUrl) {
            const iframeA = document.getElementById('tasy-pdf-iframe-A');
            const iframeB = document.getElementById('tasy-pdf-iframe-B');

            if (iframeA && iframeB && iframeA.offsetParent !== null) {
                const isAVisible = iframeA.style.opacity !== '0';
                const activeIframe = isAVisible ? iframeA : iframeB;
                const hiddenIframe = isAVisible ? iframeB : iframeA;

                const loader = document.getElementById('tasy-pdf-loading');
                const badge = document.getElementById('tasy-sync-badge');

                if (badge && (!loader || loader.style.display === 'none')) {
                    badge.style.opacity = '1';
                    badge.style.transform = 'translateY(0)';
                }

                hiddenIframe.onload = () => {
                    hiddenIframe.style.opacity = '1';
                    hiddenIframe.style.zIndex = '2';
                    activeIframe.style.opacity = '0';
                    activeIframe.style.zIndex = '1';

                    if (loader) loader.style.display = 'none';
                    if (badge) {
                        badge.style.opacity = '0';
                        badge.style.transform = 'translateY(-10px)';
                    }
                };
                hiddenIframe.src = pdfUrl + (pdfUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                return;
            }

            const windowName = '__pdf_preview__';

            const isWindowUsable = () => {
                try {
                    return previewWindow && !previewWindow.closed && previewWindow.document;
                } catch (e) {
                    return false;
                }
            };

            if (!ctx.prefs || !ctx.prefs.doubleBuffer) {
                if (!isWindowUsable()) {
                    previewWindow = window.open(pdfUrl, windowName, 'width=1100,height=900');
                } else {
                    try {
                        previewWindow.location.replace(pdfUrl);
                        previewWindow.focus();
                    } catch (e) {
                        previewWindow = window.open(pdfUrl, windowName, 'width=1100,height=900');
                    }
                }
                return;
            }

            if (!isWindowUsable()) {
                previewWindow = window.open('', windowName, 'width=1100,height=900');

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

                try {
                    previewWindow.document.open();
                    previewWindow.document.write(html);
                    previewWindow.document.close();
                    previewWindow.activeFrame = 1;
                } catch (e) {
                    previewWindow.location.replace(pdfUrl);
                }
                return;
            }

            try {
                const doc = previewWindow.document;
                const nextFrameNo = previewWindow.activeFrame === 1 ? 2 : 1;
                const currentFrameNo = previewWindow.activeFrame;

                const nextFrame = doc.getElementById('frame' + nextFrameNo);
                const currentFrame = doc.getElementById('frame' + currentFrameNo);

                if (!nextFrame || !currentFrame) {
                    previewWindow.location.replace(pdfUrl);
                    return;
                }

                nextFrame.onload = function () {
                    nextFrame.style.zIndex = 2;
                    currentFrame.style.zIndex = 1;
                    previewWindow.activeFrame = nextFrameNo;
                    nextFrame.onload = null;
                };

                nextFrame.src = pdfUrl;
                previewWindow.focus();
            } catch (e) {
                previewWindow.location.replace(pdfUrl);
            }
        }
    };
    
    // Manter compatibilidade global de outras partes do sistema
    ctx.updateOrOpenPreview = ctx.PreviewService.updateOrOpenPreview.bind(ctx.PreviewService);

})(window.TasyPdf);
