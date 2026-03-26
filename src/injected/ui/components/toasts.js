window.TasyPdf = window.TasyPdf || {};

(function (ctx) {
    ctx.Toasts = {
        show: function (msg, type = 'info') {
            let container = document.getElementById('tasy-pdf-toasts');
            if (!container) {
                container = document.createElement('div');
                container.id = 'tasy-pdf-toasts';
                Object.assign(container.style, {
                    position: 'fixed', bottom: '90px', right: '24px', zIndex: '9999999', display: 'flex', flexDirection: 'column', gap: '8px'
                });
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            const bg = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#3b82f6');
            Object.assign(toast.style, {
                background: bg, color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'sans-serif',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', opacity: '0', transform: 'translateX(20px)', transition: 'all 0.3s ease-out'
            });
            toast.innerText = msg;
            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    };
})(window.TasyPdf);
