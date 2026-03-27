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
            let iconText = type === 'error' ? '✕' : (type === 'success' ? '✓' : 'ℹ');
            let color = type === 'error' ? 'var(--tasy-danger)' : (type === 'success' ? 'var(--tasy-success)' : 'var(--tasy-text-main)');
            
            Object.assign(toast.style, {
                background: 'var(--tasy-bg-hover)', color: 'var(--tasy-text-main)', padding: '12px 16px', borderRadius: 'var(--tasy-radius-sm)',
                border: '1px solid var(--tasy-border)', fontSize: '13px', fontFamily: '"Inter", system-ui, sans-serif', fontWeight: '500',
                boxShadow: 'var(--tasy-shadow-sm)', opacity: '0', transform: 'translateY(10px) scale(0.95)', transition: 'all 0.35s var(--tasy-spring)',
                display: 'flex', alignItems: 'center', gap: '8px'
            });
            toast.innerHTML = `<span style="color:${color};font-weight:700;">${iconText}</span> <span>${msg}</span>`;
            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0) scale(1)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) scale(0.95)';
                setTimeout(() => toast.remove(), 350);
            }, 4000);
        }
    };
})(window.TasyPdf);
