/* =================================
   Reports and Analytics JavaScript
   ================================= */

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    setupExportModal();
});

let attendanceChartInstance = null;
let statusChartInstance = null;
let departmentChartInstance = null;

function getActiveDays() {
    return parseInt(document.getElementById('dateRange')?.value || '30', 10);
}

function getActiveDepartment() {
    return document.getElementById('department')?.value || 'all';
}

/* ────────────────────────────────
   INIT
──────────────────────────────── */
function initializeDashboard() {
    loadDepartments();
    initializeAttendanceChart();
    initializeStatusChart();
    initializeDepartmentChart();
    loadDashboardData();
    setupMenuItems();
}

function setupMenuItems() {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.add('collapsed'));
    if (logoToggle) logoToggle.addEventListener('click', () => sidebar.classList.remove('collapsed'));

    document.querySelectorAll('.menu-item').forEach(item => {
        const text = item.querySelector('span');
        if (text) item.setAttribute('data-text', text.innerText);
    });
}

/* ────────────────────────────────
   EVENT LISTENERS
──────────────────────────────── */
function setupEventListeners() {
    const dateRangeSelect = document.getElementById('dateRange');
    const departmentSelect = document.getElementById('department');

    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', () => {
            loadDashboardData();
        });
    }

    if (departmentSelect) {
        departmentSelect.addEventListener('change', () => {
            loadDashboardData();
        });
    }
}

/* ────────────────────────────────
   EXPORT — print page as PDF
──────────────────────────────── */
function setupExportModal() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => window.print());
    }
}

/* ────────────────────────────────
   CHART INIT
──────────────────────────────── */
function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    attendanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Attendance Rate (%)',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top', labels: { font: { size: 13, weight: 600 }, color: '#1e293b', usePointStyle: true, padding: 15 } } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(226,232,240,0.5)' } },
                x: { ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(226,232,240,0.5)' } }
            }
        }
    });
}

function initializeStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'On Leave', 'Inactive', 'Department Heads'],
            datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#10b981', '#f59e0b', '#06b6d4', '#ef4444'], borderColor: '#fff', borderWidth: 2 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 12, weight: 600 }, color: '#1e293b', usePointStyle: true, padding: 15 } } }
        }
    });
}

function initializeDepartmentChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    departmentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{ label: 'Number of Employees', data: [], backgroundColor: ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'], borderRadius: 6, borderSkipped: false }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top', labels: { font: { size: 13, weight: 600 }, color: '#1e293b', usePointStyle: true, padding: 15 } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(226,232,240,0.5)' } },
                x: { ticks: { color: '#64748b', font: { size: 12 } }, grid: { color: 'rgba(226,232,240,0.5)' } }
            }
        }
    });
}

/* ────────────────────────────────
   DEPARTMENTS DROPDOWN
──────────────────────────────── */
async function loadDepartments() {
    const departmentSelect = document.getElementById('department');
    try {
        const response = await fetch('/api/departments');
        if (response.ok) {
            const payload = await response.json();
            (payload.items || []).forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept.name;
                opt.textContent = dept.name;
                if (departmentSelect) departmentSelect.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

/* ────────────────────────────────
   DATA LOADING
──────────────────────────────── */
function loadDashboardData() {
    const department = getActiveDepartment();
    const days       = getActiveDays();
    loadKPIData(department, days);
    loadChartData(department, days);
}

async function loadKPIData(department = 'all', days = 30) {
    const totalEmployees = document.getElementById('totalEmployees');
    const attendanceRate = document.getElementById('attendanceRate');
    const turnoverRate   = document.getElementById('turnoverRate');

    try {
        const params = new URLSearchParams({ department, days });
        const response = await fetch(`/api/reports/kpi?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load KPI data');

        const kpi = await response.json();
        if (totalEmployees) totalEmployees.textContent = String(kpi.totalEmployees ?? 0);
        if (attendanceRate) attendanceRate.textContent = `${Number(kpi.attendanceRate ?? 0).toFixed(1)}%`;
        if (turnoverRate)   turnoverRate.textContent   = `${Number(kpi.turnoverRate ?? 0).toFixed(2)}%`;

        if (kpi.summary) {
            const el = id => document.getElementById(id);
            if (el('statApprovedLeaves')) el('statApprovedLeaves').textContent = String(kpi.summary.approvedLeaves ?? 0);
            if (el('statTotalLeaves'))    el('statTotalLeaves').textContent    = String(kpi.summary.totalLeaves ?? 0);
            if (el('statPendingChanges')) el('statPendingChanges').textContent = String(kpi.summary.pendingPositionChanges ?? 0);
            if (el('statActiveDepts'))    el('statActiveDepts').textContent    = String(kpi.summary.activeDepartments ?? 0);
        }
    } catch (error) {
        if (totalEmployees) totalEmployees.textContent = '0';
        if (attendanceRate) attendanceRate.textContent = '0.0%';
        if (turnoverRate)   turnoverRate.textContent   = '0.00%';
    }
}

async function loadChartData(department = 'all', days = 30) {
    try {
        const params = new URLSearchParams({ department, days });
        const response = await fetch(`/api/reports/charts?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load chart data');

        const payload = await response.json();

        if (attendanceChartInstance && payload.attendanceTrend) {
            attendanceChartInstance.data.labels = payload.attendanceTrend.labels || [];
            attendanceChartInstance.data.datasets[0].data = payload.attendanceTrend.data || [];
            attendanceChartInstance.update();
        }

        if (statusChartInstance && payload.statusBreakdown) {
            statusChartInstance.data.labels = payload.statusBreakdown.labels || [];
            statusChartInstance.data.datasets[0].data = payload.statusBreakdown.data || [];
            statusChartInstance.update();
        }

        if (departmentChartInstance && payload.departmentDistribution) {
            departmentChartInstance.data.labels = payload.departmentDistribution.labels || [];
            departmentChartInstance.data.datasets[0].data = payload.departmentDistribution.data || [];
            departmentChartInstance.update();
        }
    } catch (error) {
        console.error('Failed to load chart data:', error);
    }
}

/* ────────────────────────────────
   TOAST NOTIFICATIONS
──────────────────────────────── */
function showToast(type, title, message, showSpinner = false, duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toastId = `toast-${Date.now()}`;
    const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const iconHtml = showSpinner ? '<div class="toast-spinner"></div>' : `<i class="fas ${icons[type] || icons.info}"></i>`;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="toast-icon">${iconHtml}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>`;

    container.appendChild(toast);
    if (duration > 0 && !showSpinner) setTimeout(() => removeToast(toastId), duration);
    return toastId;
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
}
