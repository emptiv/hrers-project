/* =================================
   Employee Dashboard JavaScript
   ================================= */

// Daily Quotes Array
const inspirationalQuotes = [
    "Success is the sum of small efforts repeated day in and day out.",
    "The only way to do great work is to love what you do.",
    "Your work is going to fill a large part of your life.",
    "Great things never come from comfort zones.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
    "Success doesn't just find you. You have to go out and get it.",
    "Opportunities don't happen. You create them.",
    "Believe you can and you're halfway there.",
    "Excellence is not a skill, it's an attitude."
];

// Initialize Dashboard on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadDailyQuote();
});

let attendanceChartInstance = null;

async function initializeDashboard() {
    // Initialize charts
    await initializeAttendanceChart();
    
    // Load dynamic data
    await loadDashboardData();
    await loadDashboardNotifications();
    
    // Setup quote rotation
    setDailyQuote();
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
    
    // Evaluation card click
    setupEvaluationCard();
    
    // Notification clear button
    setupNotificationPanel();
}

/* =================================
   EVALUATION CARD
   ================================= */

function setupEvaluationCard() {
    const evaluationCard = document.getElementById('evaluationCard');
    
    if (evaluationCard) {
        evaluationCard.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to evaluation page
            window.location.href = evaluationCard.getAttribute('href');
        });
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
                    <p class="notification-message" style="margin: 0; font-weight: bold;">${item.message || 'Notification'}</p>
                    <p class="notification-time" style="margin: 0; font-size: 0.8rem; color: #888;">${item.time || 'Unknown'}</p>
                </div>
            `;
            notificationsList.appendChild(node);
        });
    } catch (error) {
    }
}

/* =================================
   ATTENDANCE CHART (EMPLOYEE-SPECIFIC)
   ================================= */

async function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    const labels = getLast7Days();
    const workedHours = await loadAttendanceHours(labels);

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Hours Worked',
                data: workedHours,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: '#2563eb',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }
        ]
    };
    
    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
    }

    attendanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 12, weight: '500' },
                        color: '#1e293b'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 12 }
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

async function loadAttendanceHours(labels) {
    try {
        const response = await fetch('/api/attendance/history');
        if (!response.ok) return [0, 0, 0, 0, 0, 0, 0];

        const payload = await response.json();
        const items = payload.items || [];
        const byDate = {};

        items.forEach(function (item) {
            if (!item.recordDate) return;
            byDate[item.recordDate] = Number(item.workedSeconds || 0) / 3600;
        });

        const values = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            values.push(Number((byDate[key] || 0).toFixed(2)));
        }

        return values;
    } catch (error) {
        return [0, 0, 0, 0, 0, 0, 0];
    }
}

/* =================================
   DATE & QUOTE UTILITIES
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

function setDailyQuote() {
    const quoteElement = document.getElementById('dailyQuote');
    if (quoteElement) {
        // Get quote based on day of year for consistency
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const quoteIndex = dayOfYear % inspirationalQuotes.length;
        
        quoteElement.textContent = inspirationalQuotes[quoteIndex];
    }
}

function loadDailyQuote() {
    setDailyQuote();
    
    // Refresh quote at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        setDailyQuote();
        // Then refresh every 24 hours
        setInterval(setDailyQuote, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
}

/* =================================
   DASHBOARD DATA
   ================================= */

async function loadDashboardData() {
    await loadEmployeeSummary();
    await loadEvaluationData();
}

async function loadEvaluationData() {
    const scoreEl = document.getElementById('evaluationScore');
    const starsEl = document.getElementById('evaluationStars');
    const dateEl = document.getElementById('evaluationDate');

    let score = 4.0;
    let evaluatedDate = new Date().toLocaleDateString();

    try {
        const response = await fetch('/api/attendance/history');
        if (response.ok) {
            const payload = await response.json();
            const items = payload.items || [];
            const counted = items.filter(function (item) {
                return Number(item.workedSeconds || 0) > 0;
            });
            const totalHours = counted.reduce(function (acc, item) {
                return acc + (Number(item.workedSeconds || 0) / 3600);
            }, 0);
            const avgHours = counted.length ? totalHours / counted.length : 0;
            score = Math.max(3.0, Math.min(5.0, 3.0 + (avgHours / 8) * 2));
            if (items[0] && items[0].recordDate) {
                evaluatedDate = new Date(items[0].recordDate).toLocaleDateString();
            }
        }
    } catch (error) {
    }

    const roundedScore = Number(score.toFixed(1));
    const fullStars = Math.max(1, Math.min(5, Math.round(roundedScore)));
    const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    
    if (scoreEl) {
        animateScore(scoreEl, 0, roundedScore, 800);
    }
    
    if (starsEl) {
        setTimeout(() => {
            starsEl.textContent = stars;
        }, 800);
    }
    
    if (dateEl) {
        dateEl.textContent = `Last evaluated: ${evaluatedDate}`;
    }
}

async function loadEmployeeSummary() {
    const latestTimeInEl = document.getElementById('latestTimeIn');
    const leaveCreditsEl = document.getElementById('leaveCredits');

    let latestTimeInText = 'No recent login';
    let remainingCredits = 15;

    try {
        const todayResponse = await fetch('/api/attendance/today');
        if (todayResponse.ok) {
            const todayPayload = await todayResponse.json();
            if (todayPayload.timeIn) {
                latestTimeInText = new Date(todayPayload.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        }
    } catch (error) {
    }

    try {
        const leaveResponse = await fetch('/api/leave-requests?mode=history');
        if (leaveResponse.ok) {
            const leavePayload = await leaveResponse.json();
            const approvedSickDays = (leavePayload.items || []).reduce(function (acc, item) {
                const isApproved = String(item.status || '').toLowerCase() === 'approved';
                const isSick = String(item.leaveType || '').toLowerCase().includes('sick');
                return acc + (isApproved && isSick ? Number(item.numDays || 0) : 0);
            }, 0);
            remainingCredits = Math.max(0, 15 - approvedSickDays);
        }
    } catch (error) {
    }

    if (latestTimeInEl) {
        latestTimeInEl.textContent = latestTimeInText;
    }
    if (leaveCreditsEl) {
        leaveCreditsEl.textContent = `Remaining: ${remainingCredits} Days`;
    }
}

function animateScore(element, start, end, duration) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = (progress * (end - start) + start).toFixed(1);
        element.textContent = value;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    
    requestAnimationFrame(step);
}