/* =================================
   Audit Trails JavaScript
   ================================= */

let currentAction = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeAuditTrails();
});

function initializeAuditTrails() {
    setupEventListeners();
    setupSearch();
    setupDatePickers();
}

function setupEventListeners() {
    // Export Button
    document.getElementById('exportBtn')?.addEventListener('click', openExportModal);

    // View Details Buttons
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const logId = this.dataset.logId;
            viewLogDetails(logId);
        });
    });

    // Filter Button
    document.getElementById('filterBtn')?.addEventListener('click', applyFilters);
    document.getElementById('clearFilterBtn')?.addEventListener('click', clearFilters);

    // Modal Close Buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });

    // Form Submissions
    document.getElementById('exportForm')?.addEventListener('submit', handleExport);

    // Confirm Modal Button
    document.getElementById('confirmBtn')?.addEventListener('click', executeConfirmedAction);
}

function setupSearch() {
    document.getElementById('auditSearch')?.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        filterLogs(searchTerm);
    });
}

function setupDatePickers() {
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');

    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (fromDateInput && !fromDateInput.value) {
        fromDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
    if (toDateInput && !toDateInput.value) {
        toDateInput.value = today.toISOString().split('T')[0];
    }
}

function filterLogs(searchTerm) {
    // Filter login logs
    document.querySelectorAll('#loginLogsBody tr').forEach(row => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });

    // Filter activity logs
    document.querySelectorAll('.activity-log-item').forEach(item => {
        const itemText = item.textContent.toLowerCase();
        item.style.display = itemText.includes(searchTerm) ? '' : 'none';
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('auditSearch').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const activity = document.getElementById('activityFilter').value;
    const status = document.getElementById('statusFilter').value;

    const url = new URL(window.location.href);
    
    if (searchTerm) url.searchParams.set('search', searchTerm);
    else url.searchParams.delete('search');

    if (fromDate) url.searchParams.set('from_date', fromDate);
    else url.searchParams.delete('from_date');

    if (toDate) url.searchParams.set('to_date', toDate);
    else url.searchParams.delete('to_date');

    if (activity) url.searchParams.set('action_type', activity);
    else url.searchParams.delete('action_type');

    if (status) url.searchParams.set('status', status);
    else url.searchParams.delete('status');

    window.location.href = url.toString();
}

function clearFilters() {
    window.location.href = window.location.pathname;
}

function viewLogDetails(logId) {
    const row = document.querySelector(`tr[data-log-id="${logId}"]`);
    if (!row) return;

    const cells = row.querySelectorAll('td');
    
    // Populate modal with log details
    document.getElementById('detailUsername').textContent = cells[0].textContent.trim();
    document.getElementById('detailEmail').textContent = cells[1].textContent.trim();
    document.getElementById('detailLoginTime').textContent = cells[2].textContent.trim();
    document.getElementById('detailLogoutTime').textContent = cells[3].textContent.trim();
    document.getElementById('detailIp').textContent = cells[4].textContent.trim();
    document.getElementById('detailUserAgent').textContent = cells[5].textContent.trim();
    document.getElementById('detailStatus').textContent = cells[6].textContent.trim();

    // Calculate session duration
    const sessionDuration = calculateSessionDuration(cells[2].textContent, cells[3].textContent);
    document.getElementById('detailDuration').textContent = sessionDuration;

    document.getElementById('logDetailsModal').classList.add('show');
}

function closeLogDetailsModal() {
    document.getElementById('logDetailsModal').classList.remove('show');
}

function calculateSessionDuration(loginTime, logoutTime) {
    if (!logoutTime || logoutTime.includes('Currently')) {
        return 'Still Active';
    }

    const login = parseAuditDateTime(loginTime);
    const logout = parseAuditDateTime(logoutTime);
    if (!login || !logout) {
        return 'Unavailable';
    }

    const diffMs = logout.getTime() - login.getTime();
    if (diffMs <= 0) {
        return 'Unavailable';
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function parseAuditDateTime(value) {
    if (!value) return null;

    const normalized = String(value)
        .replace(/\bat\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const timeMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;

    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const fallback = new Date();
    fallback.setHours(hour, minute, 0, 0);
    return fallback;
}

function openExportModal() {
    document.getElementById('exportModal').classList.add('show');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('show');
}

function handleExport(e) {
    e.preventDefault();

    const format = document.querySelector('input[name="format"]:checked').value;
    const fromDate = document.getElementById('exportFromDate').value;
    const logTypes = Array.from(document.querySelectorAll('input[name="log_types"]:checked'))
        .map(el => el.value);

    if (logTypes.length === 0) {
        showAlert('Please select at least one log type!', 'danger');
        return;
    }

    const exportRows = collectExportRows(logTypes, fromDate);
    if (!exportRows.length) {
        showAlert('No matching records found for export.', 'warning');
        return;
    }

    // Export as CSV for now even when Excel/PDF is selected.
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(filename, exportRows);

    showAlert(`Exported ${exportRows.length} row(s) as CSV.`, 'success');
    closeExportModal();
}

function collectExportRows(logTypes, fromDate) {
    const rows = [];
    const includeLogin = logTypes.includes('login');
    const includeActivity = logTypes.includes('activity');

    if (includeLogin) {
        document.querySelectorAll('#loginLogsBody tr').forEach(function (tr) {
            if (tr.style.display === 'none') return;
            const cells = tr.querySelectorAll('td');
            if (cells.length < 7) return;

            rows.push({
                logType: 'login',
                user: cells[0].textContent.trim(),
                email: cells[1].textContent.trim(),
                dateTime: cells[2].textContent.trim(),
                action: 'Login Session',
                details: `Logout: ${cells[3].textContent.trim()}, IP: ${cells[4].textContent.trim()}, Device: ${cells[5].textContent.trim()}`,
                status: cells[6].textContent.trim(),
            });
        });
    }

    if (includeActivity) {
        document.querySelectorAll('.activity-log-item').forEach(function (item) {
            if (item.style.display === 'none') return;

            const action = item.querySelector('.action')?.textContent?.trim() || 'Activity';
            const user = item.querySelector('.user-name')?.textContent?.trim() || 'Unknown User';
            const dateTime = item.querySelector('.timestamp')?.textContent?.trim() || '';
            const status = item.querySelector('.status, .badge, .state')?.textContent?.trim() || 'N/A';
            const details = item.querySelector('.description, .details')?.textContent?.trim() || item.textContent.trim();

            rows.push({
                logType: 'activity',
                user: user,
                email: '',
                dateTime: dateTime,
                action: action,
                details: details,
                status: status,
            });
        });
    }

    if (!fromDate) {
        return rows;
    }

    const from = new Date(fromDate + 'T00:00:00');
    if (Number.isNaN(from.getTime())) {
        return rows;
    }

    return rows.filter(function (row) {
        const parsed = new Date(row.dateTime);
        if (Number.isNaN(parsed.getTime())) return true;
        return parsed >= from;
    });
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

    rows.forEach(function (row) {
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

function executeConfirmedAction() {
    // This is handled by individual action handlers
}

// Tooltip functionality for IP addresses and user agents
document.querySelectorAll('.ip-address, .device-info').forEach(el => {
    el.addEventListener('mouseenter', function() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = this.textContent;
        tooltip.style.position = 'absolute';
        tooltip.style.top = '-40px';
        tooltip.style.left = '0';
        tooltip.style.backgroundColor = '#1e293b';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.zIndex = '1000';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        
        this.parentElement.style.position = 'relative';
        this.parentElement.appendChild(tooltip);
    });

    el.addEventListener('mouseleave', function() {
        const tooltip = this.parentElement.querySelector('.tooltip');
        tooltip?.remove();
    });
});

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
