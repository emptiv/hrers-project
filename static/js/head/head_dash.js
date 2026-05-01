/* =================================
   HEAD Dashboard JavaScript
   ================================= */

// Initialize Dashboard on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
});

let attendanceChartInstance = null;

function initializeDashboard() {
    // Chart must exist before data loads so the update call finds it
    initializeAttendanceChart();

    Promise.all([
        loadProfileSummary(),
        loadDashboardNotifications(),
        loadDashboardData(),
    ]);
}

/* =================================
   SIDEBAR FUNCTIONALITY
   ================================= */

function setupEventListeners() {
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
        
        item.addEventListener('click', () => {
            document.querySelector('.menu-item.active')?.classList.remove('active');
            item.classList.add('active');
        });
    });
    
    // Quick action buttons
    setupQuickActionButtons();
    
    // Notification clear button
    setupNotificationPanel();
}

/* =================================
   QUICK ACTIONS
   ================================= */

function setupQuickActionButtons() {
    const actionCards = document.querySelectorAll('.action-card');
    
    actionCards.forEach((card) => {
        card.addEventListener('click', () => {
            const actionText = card.innerText.trim();
            handleQuickAction(actionText);
        });
    });
}

function handleQuickAction(action) {
    switch(action) {
        case 'Add Employee':
            window.location.href = '/templates/head/head_employeelist.html';
            break;
        case 'Approve Leave':
            window.location.href = '/templates/head/head_leaverequest.html';
            break;
        case 'Generate Report':
            window.location.href = '/templates/head/head_appmanagement.html';
            break;
    }
}

/* =================================
   NOTIFICATION PANEL
   ================================= */

function setupNotificationPanel() {
    const clearBtn = document.querySelector('.notification-clear');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllNotifications();
        });
    }
}

function clearAllNotifications() {
    const notificationsList = document.querySelector('.notifications-list');
    if (notificationsList) {
        notificationsList.innerHTML = '';
        const emptyMessage = document.createElement('div');
        emptyMessage.style.cssText = 'padding: 2rem 1.5rem; text-align: center; color: var(--hr-text-light); font-size: 0.9rem;';
        emptyMessage.innerText = 'No notifications';
        notificationsList.appendChild(emptyMessage);
    }
}

async function loadProfileSummary() {
    try {
        const response = await fetch('/api/profile/me');
        if (!response.ok) return;

        const profile = await response.json();
        const userNameEl = document.getElementById('userName');
        const quoteEl = document.getElementById('dailyQuote');

        if (userNameEl) {
            userNameEl.textContent = profile.firstName || profile.fullName || 'User';
        }

        if (quoteEl) {
            quoteEl.textContent = `${profile.roleLabel || 'Head'} | ${profile.department || 'Department'}`;
        }
    } catch (error) {
    }
}

async function loadDashboardNotifications() {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;

    try {
        const response = await fetch('/api/dashboard/notifications');
        if (!response.ok) return;

        const payload = await response.json();
        const items = payload.items || [];

        if (!items.length) {
            clearAllNotifications();
            return;
        }

        notificationsList.innerHTML = '';
        items.forEach(function (item) {
            const node = document.createElement('div');
            node.className = 'notification-item';
            node.innerHTML = `
                <div class="notification-icon ${item.type || 'info'}">
                    <i class="fas ${item.type === 'success' ? 'fa-check-circle' : (item.type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle')}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-message">${item.message || 'Notification'}</p>
                    <p class="notification-time">${item.time || 'Unknown'}</p>
                </div>
            `;
            notificationsList.appendChild(node);
        });
    } catch (error) {
    }
}

/* =================================
   ATTENDANCE CHART
   ================================= */

function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;

    // Destroy previous instance if re-initializing
    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
        attendanceChartInstance = null;
    }

    attendanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLast7Days(),
            datasets: [
                {
                    label: 'Attendance Rate (%)',
                    data: [],
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 800, easing: 'easeInOutQuart' },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 12, weight: '500' },
                        color: '#1e293b',
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                },
                // "No data" empty state
                emptyState: false,
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 },
                        callback: function(value) { return value + '%'; }
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}


/* =================================
    DATE UTILITIES
    ================================= */

function getLast7Days() {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayIndex = date.getDay();
        const day = dayNames[dayIndex];
        const dateNum = date.getDate();
        days.push(`${day} ${dateNum}`);
    }
    
    return days;
}

/* =================================
   DASHBOARD DATA
   ================================= */

async function loadDashboardData() {
    const totalEmployeesEl  = document.getElementById('totalEmployees');
    const activeEmployeesEl = document.getElementById('activeEmployees');
    const onLeaveEl         = document.getElementById('onLeave');
    const attendanceRateEl  = document.getElementById('attendanceRate');

    try {
        const [kpiResponse, chartResponse] = await Promise.all([
            fetch('/api/reports/kpi'),
            fetch('/api/reports/charts'),
        ]);

        if (kpiResponse.ok) {
            const payload = await kpiResponse.json();
            const total      = Number(payload.totalEmployees  || 0);
            const onLeave    = Number(payload.onLeaveToday    !== undefined ? payload.onLeaveToday    : 0);
            const present    = Number(payload.presentToday    !== undefined ? payload.presentToday    : Math.max(total - onLeave, 0));
            const rate       = Number(payload.attendanceRate  || 0);

            if (totalEmployeesEl)  animateNumber(totalEmployeesEl,  0, total,   1000);
            if (activeEmployeesEl) animateNumber(activeEmployeesEl, 0, present, 1000);
            if (onLeaveEl)         animateNumber(onLeaveEl,         0, onLeave, 800);
            if (attendanceRateEl)  {
                // animate then append %
                let start = null;
                const step = (ts) => {
                    if (!start) start = ts;
                    const p = Math.min((ts - start) / 1000, 1);
                    attendanceRateEl.textContent = (p * rate).toFixed(1) + '%';
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }
        }

        if (chartResponse.ok) {
            const chartPayload = await chartResponse.json();
            if (attendanceChartInstance && chartPayload.attendanceTrend) {
                attendanceChartInstance.data.labels = chartPayload.attendanceTrend.labels || getLast7Days();
                attendanceChartInstance.data.datasets[0].data = chartPayload.attendanceTrend.data || [];
                attendanceChartInstance.update();
            }
            // Hide loading overlay
            const overlay = document.getElementById('chartLoadingOverlay');
            if (overlay) overlay.style.display = 'none';
        }
    } catch (error) {
        // Hide overlay even on error so chart is visible
        const overlay = document.getElementById('chartLoadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

function animateNumber(element, start, end, duration) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    
    requestAnimationFrame(step);
}