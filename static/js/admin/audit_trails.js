/* =================================
   Audit Trails JavaScript
   ================================= */

let renderedLoginLogs = [];
let renderedActivityLogs = [];
const loginLogById = new Map();
let currentPage = 1;
let totalPages = 1;
const pageSize = 10;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuditTrails();
});

function initializeAuditTrails() {
    setupDatePickers();
    setupEventListeners();
    loadAuditData();
}

function setupEventListeners() {
    document.getElementById('exportBtn')?.addEventListener('click', openExportModal);
    document.getElementById('filterBtn')?.addEventListener('click', applyFilters);
    document.getElementById('clearFilterBtn')?.addEventListener('click', clearFilters);
    document.getElementById('exportForm')?.addEventListener('submit', handleExport);

    document.querySelectorAll('.modal .close').forEach((btn) => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });

    document.getElementById('loginLogsBody')?.addEventListener('click', function(e) {
        const button = e.target.closest('.view-details');
        if (!button) return;
        e.preventDefault();
        viewLogDetails(button.dataset.logId);
    });

    document.getElementById('auditSearch')?.addEventListener('keyup', debounce(applyFilters, 300));

    document.getElementById('pageFirst')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage === 1) return;
        currentPage = 1;
        loadAuditData();
    });

    document.getElementById('pagePrev')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage <= 1) return;
        currentPage -= 1;
        loadAuditData();
    });

    document.getElementById('pageNext')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage >= totalPages) return;
        currentPage += 1;
        loadAuditData();
    });

    document.getElementById('pageLast')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage === totalPages) return;
        currentPage = totalPages;
        loadAuditData();
    });
}

function setupDatePickers() {
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (fromDateInput && !fromDateInput.value) {
        fromDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
    if (toDateInput && !toDateInput.value) {
        toDateInput.value = today.toISOString().split('T')[0];
    }
}

function readFilters() {
    return {
        search: (document.getElementById('auditSearch')?.value || '').trim(),
        from_date: (document.getElementById('fromDate')?.value || '').trim(),
        to_date: (document.getElementById('toDate')?.value || '').trim(),
        action_type: (document.getElementById('activityFilter')?.value || '').trim(),
        status: (document.getElementById('statusFilter')?.value || '').trim(),
    };
}

async function loadAuditData() {
    const filters = readFilters();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    params.set('page', String(currentPage));
    params.set('page_size', String(pageSize));

    try {
        const response = await fetch(`/api/admin/audit-trails?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Failed to load audit logs (${response.status})`);
        }

        const payload = await response.json();
        renderedLoginLogs = Array.isArray(payload.loginLogs) ? payload.loginLogs : [];
        renderedActivityLogs = Array.isArray(payload.activityLogs) ? payload.activityLogs : [];

        const pagination = payload.pagination || {};
        currentPage = Number(pagination.page) > 0 ? Number(pagination.page) : currentPage;
        totalPages = Number(pagination.totalPages) > 0 ? Number(pagination.totalPages) : 1;

        loginLogById.clear();
        renderedLoginLogs.forEach((item) => loginLogById.set(String(item.id), item));

        renderLoginLogs(renderedLoginLogs);
        renderActivityLogs(renderedActivityLogs);
        renderPagination();
    } catch (error) {
        renderLoginLogs([]);
        renderActivityLogs([]);
        totalPages = 1;
        renderPagination();
        showAlert('Failed to load audit data from database.', 'danger');
    }
}

function renderPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    if (pageNumbers) {
        pageNumbers.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    setPaginationDisabled('pageFirst', currentPage <= 1);
    setPaginationDisabled('pagePrev', currentPage <= 1);
    setPaginationDisabled('pageNext', currentPage >= totalPages);
    setPaginationDisabled('pageLast', currentPage >= totalPages);
}

function setPaginationDisabled(elementId, disabled) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.style.pointerEvents = disabled ? 'none' : 'auto';
    element.style.opacity = disabled ? '0.45' : '1';
    element.setAttribute('aria-disabled', disabled ? 'true' : 'false');
}

function renderLoginLogs(items) {
    const body = document.getElementById('loginLogsBody');
    if (!body) return;

    if (!items.length) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px;">No login/access logs found.</td></tr>`;
        return;
    }

    body.innerHTML = items.map((item) => {
        const loginTime = formatDateTime(item.loginTime || item.recordDate);
        const logoutTime = formatDateTime(item.logoutTime) || 'Currently Active';
        const badgeClass = statusBadgeClass(item.statusType || item.status);
        return `
            <tr class="log-row" data-log-id="${item.id}">
                <td><strong>${escapeHtml(item.username || '--')}</strong></td>
                <td>${escapeHtml(item.email || '--')}</td>
                <td><span class="timestamp">${escapeHtml(loginTime || '--')}</span></td>
                <td><span class="timestamp">${escapeHtml(logoutTime)}</span></td>
                <td><code class="ip-address">${escapeHtml(item.ipAddress || 'N/A')}</code></td>
                <td><span class="device-info">${escapeHtml(item.userAgent || 'N/A')}</span></td>
                <td><span class="status-badge ${badgeClass}">${escapeHtml(item.status || '--')}</span></td>
                <td>
                    <button class="btn-icon view-details" data-log-id="${item.id}" title="View Details">
                        <i class="fas fa-circle-info"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderActivityLogs(items) {
    const container = document.getElementById('activityLogsList');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color: var(--admin-text-light);">No activity logs found.</div>`;
        return;
    }

    container.innerHTML = items.map((item) => {
        const badgeClass = statusBadgeClass(item.statusType || item.status);
        const icon = iconForActivity(item.activityType);
        return `
            <div class="activity-log-item">
                <div class="log-icon"><i class="fas ${icon}"></i></div>
                <div class="log-content">
                    <div class="log-header">
                        <p class="log-activity">${escapeHtml(item.activityLabel || 'Activity')}</p>
                        <span class="log-time">${escapeHtml(formatDateTime(item.timestamp) || '--')}</span>
                    </div>
                    <div class="log-details">
                        <p class="log-user"><strong>User:</strong> ${escapeHtml(item.user || '--')}${item.email ? ` (${escapeHtml(item.email)})` : ''}</p>
                        <p class="log-ip"><strong>IP Address:</strong> <code>${escapeHtml(item.ipAddress || 'N/A')}</code></p>
                        <p class="log-description"><strong>Details:</strong> ${escapeHtml(item.description || 'No details available.')}</p>
                    </div>
                </div>
                <div class="log-status"><span class="status-badge ${badgeClass}">${escapeHtml(item.status || '--')}</span></div>
            </div>
        `;
    }).join('');
}

function statusBadgeClass(status) {
    const value = String(status || '').toLowerCase();
    if (value.includes('fail')) return 'failed';
    if (value.includes('warn')) return 'warning';
    return 'success';
}

function iconForActivity(activityType) {
    const value = String(activityType || '').toLowerCase();
    if (value === 'user_created') return 'fa-user-plus';
    if (value === 'role_changed') return 'fa-user-tie';
    if (value === 'account_deactivated') return 'fa-user-slash';
    if (value === 'account_activated') return 'fa-user-check';
    return 'fa-list-check';
}

function applyFilters() {
    currentPage = 1;
    loadAuditData();
}

function clearFilters() {
    const auditSearch = document.getElementById('auditSearch');
    const activityFilter = document.getElementById('activityFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (auditSearch) auditSearch.value = '';
    if (activityFilter) activityFilter.value = '';
    if (statusFilter) statusFilter.value = '';

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    if (fromDate) fromDate.value = thirtyDaysAgo.toISOString().split('T')[0];
    if (toDate) toDate.value = today.toISOString().split('T')[0];

    currentPage = 1;
    loadAuditData();
}

function viewLogDetails(logId) {
    const item = loginLogById.get(String(logId));
    if (!item) return;

    const loginText = formatDateTime(item.loginTime || item.recordDate) || '--';
    const logoutText = formatDateTime(item.logoutTime) || 'Currently Active';

    document.getElementById('detailUsername').textContent = item.username || '--';
    document.getElementById('detailEmail').textContent = item.email || '--';
    document.getElementById('detailLoginTime').textContent = loginText;
    document.getElementById('detailLogoutTime').textContent = logoutText;
    document.getElementById('detailIp').textContent = item.ipAddress || 'N/A';
    document.getElementById('detailUserAgent').textContent = item.userAgent || 'N/A';
    document.getElementById('detailStatus').textContent = item.status || '--';
    document.getElementById('detailDuration').textContent = calculateSessionDuration(item.loginTime, item.logoutTime);
    document.getElementById('detailNotes').textContent = item.notes || 'No additional notes available.';

    document.getElementById('logDetailsModal').classList.add('show');
}

function closeLogDetailsModal() {
    document.getElementById('logDetailsModal').classList.remove('show');
}
window.closeLogDetailsModal = closeLogDetailsModal;

function calculateSessionDuration(loginTimeIso, logoutTimeIso) {
    if (!loginTimeIso || !logoutTimeIso) {
        return 'Still Active';
    }
    const login = new Date(loginTimeIso);
    const logout = new Date(logoutTimeIso);
    if (Number.isNaN(login.getTime()) || Number.isNaN(logout.getTime()) || logout <= login) {
        return 'Unavailable';
    }

    const totalMinutes = Math.floor((logout.getTime() - login.getTime()) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function openExportModal() {
    document.getElementById('exportModal').classList.add('show');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('show');
}
window.closeExportModal = closeExportModal;

function handleExport(e) {
    e.preventDefault();

    const logTypes = Array.from(document.querySelectorAll('input[name="log_types"]:checked')).map((el) => el.value);
    const range = document.getElementById('exportFromDate')?.value || '1m';
    if (!logTypes.length) {
        showAlert('Please select at least one log type!', 'danger');
        return;
    }

    const rows = collectExportRows(logTypes, range);
    if (!rows.length) {
        showAlert('No matching records found for export.', 'warning');
        return;
    }

    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(filename, rows);
    showAlert(`Exported ${rows.length} row(s) as CSV.`, 'success');
    closeExportModal();
}

function collectExportRows(logTypes, range) {
    const result = [];
    const cutoffDate = rangeCutoff(range);

    if (logTypes.includes('login')) {
        renderedLoginLogs.forEach((item) => {
            const dt = new Date(item.loginTime || item.recordDate || '');
            if (cutoffDate && !Number.isNaN(dt.getTime()) && dt < cutoffDate) return;
            result.push({
                logType: 'login',
                user: item.username || '',
                email: item.email || '',
                dateTime: formatDateTime(item.loginTime || item.recordDate) || '',
                action: 'Login Session',
                details: `Logout: ${formatDateTime(item.logoutTime) || 'Currently Active'}, IP: ${item.ipAddress || 'N/A'}, Device: ${item.userAgent || 'N/A'}`,
                status: item.status || '',
            });
        });
    }

    if (logTypes.includes('activity')) {
        renderedActivityLogs.forEach((item) => {
            const dt = new Date(item.timestamp || '');
            if (cutoffDate && !Number.isNaN(dt.getTime()) && dt < cutoffDate) return;
            result.push({
                logType: 'activity',
                user: item.user || '',
                email: item.email || '',
                dateTime: formatDateTime(item.timestamp) || '',
                action: item.activityLabel || 'Activity',
                details: item.description || '',
                status: item.status || '',
            });
        });
    }

    return result;
}

function rangeCutoff(range) {
    const now = new Date();
    const map = { '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
    const days = map[range];
    if (!days) return null;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function csvEscape(value) {
    const text = String(value == null ? '' : value);
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
}

function downloadCsv(filename, rows) {
    const headers = ['Log Type', 'User', 'Email', 'Date/Time', 'Action', 'Details', 'Status'];
    const lines = [headers.map(csvEscape).join(',')];
    rows.forEach((row) => {
        lines.push([
            row.logType,
            row.user,
            row.email,
            row.dateTime,
            row.action,
            row.details,
            row.status,
        ].map(csvEscape).join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function executeConfirmedAction() {
    // Reserved for parity with other admin scripts.
}

function showAlert(message, type = 'info') {
    // Create (or reuse) a toast container so multiple alerts stack without overlap.
    let alertContainer = document.getElementById('toastContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'toastContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '32px';
        alertContainer.style.right = '32px';
        alertContainer.style.zIndex = '2000';
        alertContainer.style.display = 'flex';
        alertContainer.style.flexDirection = 'column';
        alertContainer.style.gap = '12px';
        alertContainer.style.maxWidth = '420px';
        alertContainer.style.width = 'min(420px, calc(100vw - 40px))';
        alertContainer.style.pointerEvents = 'none';
        document.body.appendChild(alertContainer);
    }

    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    alert.style.maxWidth = '400px';
    alert.style.margin = '0';
    alert.style.pointerEvents = 'auto';
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();

        // Remove empty container so we do not keep unused fixed elements in DOM.
        if (alertContainer && !alertContainer.children.length) {
            alertContainer.remove();
        }
    }, 3000);
}
