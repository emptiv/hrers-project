/* =================================
   Reports and Analytics JavaScript
   ================================= */

// Initialize Dashboard on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    setupModalListeners();
});

let attendanceChartInstance = null;
let statusChartInstance = null;
let departmentChartInstance = null;

function initializeDashboard() {
    // Load dynamic data first to ensure filters are ready
    loadDepartments();

    // Initialize all charts
    initializeAttendanceChart();
    initializeStatusChart();
    initializeDepartmentChart();
    
    loadDashboardData();
    
    // Setup menu items
    setupMenuItems();
}

/* =================================
   SIDEBAR FUNCTIONALITY
   ================================= */

function setupMenuItems() {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Close button (only when expanded)
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
        });
    }
    
    // Open via logo click
    if (logoToggle) {
        logoToggle.addEventListener('click', () => {
            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
            }
        });
    }
    
    // Set menu item attributes for tooltips
    menuItems.forEach(item => {
        const text = item.querySelector('span');
        if (text) {
            item.setAttribute('data-text', text.innerText);
        }
    });
}

/* =================================
   EVENT LISTENERS
   ================================= */

function setupEventListeners() {
    // Filter controls
    const dateRangeSelect = document.getElementById('dateRange');
    const departmentSelect = document.getElementById('department');
    
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', () => {
            handleDateRangeChange(dateRangeSelect.value);
        });
    }
    
    if (departmentSelect) {
        departmentSelect.addEventListener('change', () => {
            handleDepartmentChange(departmentSelect.value);
        });
    }
}

/* =================================
   MODAL LISTENERS
   ================================= */

function setupModalListeners() {
    // Custom Report Modal
    const customReportBtn = document.getElementById('customReportBtn');
    const customReportModal = document.getElementById('customReportModal');
    const closeCustomReportModal = document.getElementById('closeCustomReportModal');
    const cancelCustomReportBtn = document.getElementById('cancelCustomReportBtn');
    const customReportOverlay = document.getElementById('customReportOverlay');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const previewExportBtn = document.getElementById('previewExportBtn');
    
    // Export Modal
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const cancelExportBtn = document.getElementById('cancelExportBtn');
    const exportOverlay = document.getElementById('exportOverlay');
    const confirmExportBtn = document.getElementById('confirmExportBtn');
    
    // Custom Report Modal Functions
    if (customReportBtn) {
        customReportBtn.addEventListener('click', () => {
            openModal(customReportModal);
        });
    }
    
    if (closeCustomReportModal) {
        closeCustomReportModal.addEventListener('click', () => {
            closeModal(customReportModal);
        });
    }
    
    if (cancelCustomReportBtn) {
        cancelCustomReportBtn.addEventListener('click', () => {
            closeModal(customReportModal);
        });
    }
    
    if (customReportOverlay) {
        customReportOverlay.addEventListener('click', () => {
            closeModal(customReportModal);
        });
    }
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', () => {
            handleGenerateReport();
        });
    }
    
    if (previewExportBtn) {
        previewExportBtn.addEventListener('click', () => {
            handlePreviewExport();
        });
    }
    
    // Export Modal Functions
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            openModal(exportModal);
        });
    }
    
    if (closeExportModal) {
        closeExportModal.addEventListener('click', () => {
            closeModal(exportModal);
        });
    }
    
    if (cancelExportBtn) {
        cancelExportBtn.addEventListener('click', () => {
            closeModal(exportModal);
        });
    }
    
    if (exportOverlay) {
        exportOverlay.addEventListener('click', () => {
            closeModal(exportModal);
        });
    }
    
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', () => {
            handleExport();
        });
    }
    
    // Report Type Selection
    const reportTypeOptions = document.querySelectorAll('.report-type-option');
    reportTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input[type="radio"]');
            radio.checked = true;
            updateReportPreview();
        });
    });
    
    // Report Form Fields
    const reportFormInputs = document.querySelectorAll('#customDepartment, #customDateStart, #customDateEnd');
    reportFormInputs.forEach(input => {
        input.addEventListener('change', () => {
            updateReportPreview();
        });
    });
    
    const checkboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateReportPreview();
        });
    });
}

/* =================================
   MODAL FUNCTIONS
   ================================= */

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
    }
}

/* =================================
   CUSTOM REPORT PREVIEW
   ================================= */

async function updateReportPreview() {
    const reportType = document.querySelector('input[name="reportType"]:checked');
    const department = document.getElementById('customDepartment').value;
    const startDate = document.getElementById('customDateStart').value;
    const endDate = document.getElementById('customDateEnd').value;
    const checkedFields = Array.from(document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked'))
        .map(cb => cb.nextElementSibling.innerText);
    
    const previewContainer = document.getElementById('reportPreview');
    
    if (!reportType) {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-eye"></i>
                <p>Select report options to see preview</p>
            </div>
        `;
        return;
    }
    
    let reportData = [];
    try {
        const response = await fetch(`/api/reports/preview?reportType=${encodeURIComponent(reportType.value)}&department=${encodeURIComponent(department)}`);
        if (response.ok) {
            const payload = await response.json();
            reportData = payload.items || [];
        }
    } catch (error) {
        reportData = [];
    }
    
    previewContainer.innerHTML = `
        <div class="preview-content">
            <h4>${reportType.nextElementSibling.innerText} Report</h4>
            <p style="color: #64748b; font-size: 0.85rem; margin: 0.5rem 0 1rem 0;">
                ${department !== 'all' ? `Department: ${department} | ` : ''}
                ${startDate ? `From: ${startDate} | ` : ''}
                ${endDate ? `To: ${endDate}` : ''}
            </p>
            <table class="preview-table">
                <thead>
                    <tr>
                        ${checkedFields.map(field => `<th>${field}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${reportData.map(row => `
                        <tr>
                            ${checkedFields.map(field => {
                                const key = field.toLowerCase().replace(/\s+/g, '-');
                                return `<td>${row[key] || 'N/A'}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}



function getSelectedReportConfig() {
    const reportType = document.querySelector('input[name="reportType"]:checked');
    const department = document.getElementById('customDepartment')?.value || 'all';
    const fields = Array.from(document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked'))
        .map(cb => cb.nextElementSibling.innerText.toLowerCase().replace(/\s+/g, '-'));

    return { reportType, department, fields };
}

async function downloadReportExport(triggerLabel) {
    const config = getSelectedReportConfig();
    if (!config.reportType) {
        showToast('warning', 'Please select a report type', 'No report type selected');
        return false;
    }
    
    const params = new URLSearchParams({
        reportType: config.reportType.value,
        department: config.department,
        fields: config.fields.join(','),
    });

    const response = await fetch(`/api/reports/export?${params.toString()}`);
    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ detail: 'Unable to export report.' }));
        throw new Error(errorPayload.detail || 'Unable to export report.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.reportType.value}_${config.department}_${triggerLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
}

async function handleGenerateReport() {
    const config = getSelectedReportConfig();
    if (!config.reportType) {
        showToast('warning', 'Please select a report type', 'No report type selected');
        return;
    }

    const toastId = showToast('info', 'Generating report...', 'Preparing a live CSV export', true);
    try {
        await downloadReportExport('generated');
        removeToast(toastId);
        showToast('success', 'Report generated successfully!', `Your ${config.reportType.nextElementSibling.innerText} report has been downloaded`, false, 3000);
    } catch (error) {
        removeToast(toastId);
        showToast('error', 'Report generation failed', error.message || 'Unable to export report', false, 3000);
    }
}

async function handlePreviewExport() {
    const config = getSelectedReportConfig();
    if (!config.reportType) {
        showToast('warning', 'Please select a report type', 'No report type selected');
        return;
    }

    const toastId = showToast('info', 'Downloading report...', 'Your report is being prepared for download', true);
    try {
        await downloadReportExport('preview');
        removeToast(toastId);
        showToast('success', 'Report downloaded!', 'Your report has been saved to downloads', false, 3000);
    } catch (error) {
        removeToast(toastId);
        showToast('error', 'Download failed', error.message || 'Unable to export report', false, 3000);
    }
}

/* =================================
   EXPORT FUNCTIONALITY
   ================================= */

async function handleExport() {
    const format = document.querySelector('input[name="exportFormat"]:checked')?.value || 'csv';
    const toastId = showToast('info', 'Exporting report...', 'Preparing a live CSV download', true);

    try {
        await downloadReportExport(format);
        removeToast(toastId);
        showToast('success', 'Export complete!', 'Report exported as CSV', false, 3000);
        closeModal(document.getElementById('exportModal'));
    } catch (error) {
        removeToast(toastId);
        showToast('error', 'Export failed', error.message || 'Unable to export report', false, 3000);
    }
}

/* =================================
   FILTER HANDLERS
   ================================= */

function handleDateRangeChange(range) {
    // Update charts and data based on date range
    updateChartsWithDateRange(range);
}

function handleDepartmentChange(department) {
    // Reload dashboard with department filter
    loadKPIData(department);
    loadChartData(department);
}

/* =================================
   CHART INITIALIZATION
   ================================= */

function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    attendanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
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
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13, weight: 600 },
                        color: '#1e293b',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                }
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
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#06b6d4',
                    '#ef4444'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 12, weight: 600 },
                        color: '#1e293b',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            }
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
            datasets: [{
                label: 'Number of Employees',
                data: [],
                backgroundColor: [
                    '#2563eb',
                    '#8b5cf6',
                    '#10b981',
                    '#f59e0b',
                    '#06b6d4'
                ],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13, weight: 600 },
                        color: '#1e293b',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.5)'
                    }
                }
            }
        }
    });
}

/* =================================
   DEPARTMENT DROPDOWN
   ================================= */

async function loadDepartments() {
    const departmentSelect = document.getElementById('department');
    const customDepartmentSelect = document.getElementById('customDepartment');
    
    try {
        const response = await fetch('/api/departments');
        if (response.ok) {
            const payload = await response.json();
            const departments = payload.items || [];
            
            departments.forEach(dept => {
                const opt1 = document.createElement('option');
                opt1.value = dept.name;
                opt1.textContent = dept.name;
                if (departmentSelect) departmentSelect.appendChild(opt1);
                
                const opt2 = document.createElement('option');
                opt2.value = dept.name;
                opt2.textContent = dept.name;
                if (customDepartmentSelect) customDepartmentSelect.appendChild(opt2);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

/* =================================
   CHART UPDATE HANDLERS
   ================================= */

function updateChartsWithDateRange(range) {
    // This function would update chart data based on selected date range
}

function updateChartsWithSchool(school) {
    // This function would update chart data based on selected school
}

/* =================================
   DATA LOADING
   ================================= */

function loadDashboardData() {
    const department = document.getElementById('department')?.value || 'all';
    loadKPIData(department);
    loadChartData(department);
}

async function loadKPIData(department = 'all') {
    const totalEmployees = document.getElementById('totalEmployees');
    const attendanceRate = document.getElementById('attendanceRate');
    const turnoverRate = document.getElementById('turnoverRate');


    try {
        const response = await fetch(`/api/reports/kpi?department=${encodeURIComponent(department)}`);
        if (!response.ok) {
            throw new Error('Failed to load KPI data');
        }

        const kpi = await response.json();
        if (totalEmployees) totalEmployees.textContent = String(kpi.totalEmployees ?? 0);
        if (attendanceRate) attendanceRate.textContent = `${Number(kpi.attendanceRate ?? 0).toFixed(1)}%`;
        if (turnoverRate) turnoverRate.textContent = `${Number(kpi.turnoverRate ?? 0).toFixed(2)}%`;

        // Update Summary Statistics
        if (kpi.summary) {
            const approvedLeaves = document.getElementById('statApprovedLeaves');
            const totalLeaves = document.getElementById('statTotalLeaves');
            const pendingChanges = document.getElementById('statPendingChanges');
            const activeDepts = document.getElementById('statActiveDepts');

            if (approvedLeaves) approvedLeaves.textContent = String(kpi.summary.approvedLeaves ?? 0);
            if (totalLeaves) totalLeaves.textContent = String(kpi.summary.totalLeaves ?? 0);
            if (pendingChanges) pendingChanges.textContent = String(kpi.summary.pendingPositionChanges ?? 0);
            if (activeDepts) activeDepts.textContent = String(kpi.summary.activeDepartments ?? 0);
        }

    } catch (error) {
        if (totalEmployees) totalEmployees.textContent = '0';
        if (attendanceRate) attendanceRate.textContent = '0.0%';
        if (turnoverRate) turnoverRate.textContent = '0.00%';

    }
}

async function loadChartData(department = 'all') {
    try {
        const response = await fetch(`/api/reports/charts?department=${encodeURIComponent(department)}`);
        if (!response.ok) {
            throw new Error('Failed to load chart data');
        }

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
    }
}

/* =================================
   TOAST NOTIFICATIONS
   ================================= */

function showToast(type, title, message, showSpinner = false, duration = 3000) {
    // Create or get toast container
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Generate unique toast ID
    const toastId = `toast-${Date.now()}`;
    
    // Determine icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;
    
    // Build HTML content
    let iconContent = icon;
    if (showSpinner) {
        iconContent = '<div class="toast-spinner"></div>';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            ${iconContent}
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Auto-dismiss if duration is specified (0 = no auto-dismiss)
    if (duration > 0 && !showSpinner) {
        setTimeout(() => {
            removeToast(toastId);
        }, duration);
    }
    
    return toastId;
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;
    
    // Add hide animation class
    toast.classList.add('hide');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        toast.remove();
    }, 300);
}
