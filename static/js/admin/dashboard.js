/* =================================
   Admin Dashboard JavaScript
   ================================= */

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

let adminAnalytics = {
    loginActivity: {
        labels: getLast7Days(),
        data: [12, 19, 8, 14, 11, 16, 18],
    },
    roleDistribution: {
        labels: ['Admin', 'HR', 'Department Head', 'Employee'],
        data: [2, 5, 8, 120],
    },
};

async function initializeDashboard() {
    await loadAdminAnalytics();

    // Initialize charts
    initializeLoginChart();
    initializeRoleChart();

    // Load live summary cards
    loadAdminSummaryCards();
    
    // Add event listeners
    addEventListeners();
}

async function loadAdminAnalytics() {
    try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) return;

        const payload = await response.json();
        if (payload.loginActivity && payload.roleDistribution) {
            adminAnalytics = payload;
        }
    } catch (error) {
    }
}

async function loadAdminSummaryCards() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const statChanges = document.querySelectorAll('.stat-change');
    if (statNumbers.length < 4) return;

    try {
        const response = await fetch('/api/reports/kpi');
        if (!response.ok) return;

        const payload = await response.json();
        const totalUsers = Number(payload.totalEmployees || 0);
        const leaveCount = Number((payload.summary && payload.summary.totalLeaves) || 0);
        const pendingActions = Number((payload.summary && payload.summary.pendingPositionChanges) || 0);
        const activeDepartments = Number((payload.summary && payload.summary.activeDepartments) || 0);

        statNumbers[0].innerText = String(totalUsers);
        statNumbers[1].innerText = String(activeDepartments);
        statNumbers[2].innerText = String(totalUsers);
        statNumbers[3].innerText = String(pendingActions);

        if (statChanges[0]) statChanges[0].innerText = `↑ ${Math.max(totalUsers - leaveCount, 0)} Active`;
        if (statChanges[1]) statChanges[1].innerText = `${activeDepartments} Departments Active`;
        if (statChanges[2]) statChanges[2].innerText = `Leave Requests: ${leaveCount}`;
        if (statChanges[3]) statChanges[3].innerText = pendingActions > 0 ? 'Require Attention' : 'All Clear';
    } catch (error) {
    }
}

// Initialize Login Activity Chart
function initializeLoginChart() {
    const ctx = document.getElementById('loginChart');
    if (!ctx) return;

    const data = {
        labels: adminAnalytics.loginActivity.labels,
        datasets: [{
            label: 'Logins',
            data: adminAnalytics.loginActivity.data,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Initialize Role Distribution Chart
function initializeRoleChart() {
    const ctx = document.getElementById('roleChart');
    if (!ctx) return;

    const data = {
        labels: adminAnalytics.roleDistribution.labels,
        datasets: [{
            data: adminAnalytics.roleDistribution.data,
            backgroundColor: [
                '#2563eb',
                '#8b5cf6',
                '#06b6d4',
                '#64748b'
            ],
            borderColor: '#fff',
            borderWidth: 2
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Get last 7 days
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

function addEventListeners() {
    // Add any additional event listeners for dashboard interactions
}
