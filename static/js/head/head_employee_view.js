document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');

    // 1. Tooltip Fix: Automatically set labels
    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) {
            item.setAttribute('data-text', span.innerText.trim());
        }
    });

    // 2. Sidebar Toggle Logic
    if (logoToggle) {
        logoToggle.onclick = () => sidebar.classList.toggle('close');
    }
    if (closeBtn) {
        closeBtn.onclick = () => sidebar.classList.add('close');
    }

    // 3. Tabs Logic
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(c => c.classList.remove('active'));
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // 4. Action Cell Logic (View & Download)
    const actionCells = document.querySelectorAll('.action-cell');

    function isPlaceholderHref(hrefValue) {
        if (!hrefValue) return true;
        const normalized = hrefValue.trim().toLowerCase();
        return normalized === '#' || normalized === 'javascript:void(0)' || normalized === 'javascript:;';
    }

    function showFileUnavailableMessage(docName) {
        const message = `No uploaded file is available yet for "${docName}".`;
        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                icon: 'info',
                title: 'File Unavailable',
                text: message,
                confirmButtonColor: '#4a1d1d',
            });
            return;
        }
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        toast.style.background = '#4a1d1d';
        toast.style.color = '#fff';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '0.9rem';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.remove();
        }, 2200);
    }

    actionCells.forEach(cell => {
        const links = cell.querySelectorAll('a');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const isDownload = link.hasAttribute('download') || link.querySelector('.fa-download');
                const isView = link.querySelector('.fa-eye');
                
                // Get document details from the current row.
                const row = link.closest('tr');
                const docName = row ? row.cells[0].innerText.trim() : "Document";
                const href = link.getAttribute('href') || '';
                const isPlaceholderLink = isPlaceholderHref(href);

                if (isDownload) {
                    if (isPlaceholderLink) {
                        e.preventDefault();
                        showFileUnavailableMessage(docName);
                    }
                } 
                
                else if (isView) {
                    if (isPlaceholderLink) {
                        e.preventDefault();
                        showFileUnavailableMessage(docName);
                    }
                }
            });
        });
    });
});