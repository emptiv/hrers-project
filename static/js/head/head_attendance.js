/**
 * dept_attendance.js
 * Comprehensive logic for Department Head Attendance Log
 * ============================================================
 */

/* ── 1. ELEMENT SELECTORS ────────────────────────────────── */

// Sidebar & Navigation
const sidebar    = document.getElementById("sidebar");
const logoToggle = document.getElementById("logoToggle");
const closeBtn   = document.getElementById("closeBtn");
const menuItems  = document.querySelectorAll(".menu-item");

// Tab Switcher
const tabLog       = document.getElementById('tab-log');
const tabMonit     = document.getElementById('tab-monitoring');
const logContent   = document.getElementById('logContent'); 
const monitContent = document.getElementById('monitoringContent');

// Attendance clock elements
const clockBtn           = document.getElementById("clockBtn");
const workingTimeDisplay = document.getElementById("workingTime");
const timeInDisplay      = document.getElementById("timeInDisplay");

// History modal elements
const historyModal     = document.getElementById("historyModal");
const openHistoryBtn   = document.getElementById("openHistory");
const closeHistoryBtn  = document.getElementById("closeHistory");
const weeklyViewBtn    = document.getElementById("weeklyViewBtn");
const monthlyViewBtn   = document.getElementById("monthlyViewBtn");
const historyDateRange = document.getElementById("historyDateRange");
const weeklyTable      = document.getElementById("weeklyTable");
const weeklyTableBody  = document.getElementById("weeklyTableBody");
const monthlyGrid      = document.getElementById("monthlyGrid");
const totalHoursCount  = document.getElementById("totalHoursCount");
const prevPeriodBtn    = document.getElementById("prevPeriod");
const nextPeriodBtn    = document.getElementById("nextPeriod");

// Clock out confirmation overlay
const clockOutOverlay      = document.getElementById("clockOutOverlay");
const clockOutConfirmStep  = document.getElementById("clockOutConfirmStep");
const clockOutSuccessStep  = document.getElementById("clockOutSuccessStep");
const clockOutCancelBtn    = document.getElementById("clockOutCancel");
const clockOutConfirmBtn   = document.getElementById("clockOutConfirmBtn");
const clockOutDismissBtn   = document.getElementById("clockOutDismiss");
const clockOutDurationText = document.getElementById("clockOutDurationText");

// Inline Weekly Table (Dashboard)
const inlineWeekPickerSpan = document.querySelector('.week-picker span');
const inlinePrevWeekBtn    = document.querySelector('.week-nav[aria-label="Previous week"]');
const inlineNextWeekBtn    = document.querySelector('.week-nav[aria-label="Next week"]');
const inlineTableBody      = document.querySelector('.attendance-table tbody');


/* ── 2. SIDEBAR & NAVIGATION ─────────────────────────────── */

if (closeBtn) closeBtn.addEventListener("click", () => sidebar.classList.add("collapsed"));
if (logoToggle) logoToggle.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

menuItems.forEach(item => {
    const spanEl = item.querySelector("span");
    if (spanEl) item.setAttribute("data-text", spanEl.innerText);
    item.addEventListener("click", () => {
        document.querySelector(".menu-item.active")?.classList.remove("active");
        item.classList.add("active");
    });
});


/* ── 3. PROFILE & HEADER ─────────────────────────────────── */

function updateHeader() {
    const dateElement = document.querySelector(".date-now");
    if (dateElement) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        dateElement.innerText = `${dateStr} | ${timeStr}`;
    }
}
setInterval(updateHeader, 60000);

/**
 * Fetches the logged-in user's details to fill in the info cards.
 */
async function loadEmployeeDetails() {
    try {
        const response = await fetch('/api/profile/me');
        if (!response.ok) return;
        const profile = await response.json();

        // Update UI Name
        const employeeTab = document.querySelector('.employee-tab');
        if (employeeTab) employeeTab.textContent = profile.fullName || 'Department Head';

        // Update Info Grid (Employee ID, Position, Dept, Type)
        const detailItems = document.querySelectorAll('.details-rows .detail-item span');
        if (detailItems.length >= 4) {
            detailItems[0].textContent = profile.employeeNo || profile.id || '--';
            detailItems[1].textContent = profile.position || profile.roleLabel || '--';
            detailItems[2].textContent = profile.department || '--';
            detailItems[3].textContent = profile.employmentType || '--';
        }
    } catch (err) {
        console.error("Error fetching profile details:", err);
    }
}


/* ── 4. CLOCK LOGIC (TIMER & ACTIONS) ───────────────────── */

let timerInterval = null;
let totalSeconds  = 0;
let isClockedIn   = false;

async function refreshAttendanceState() {
    try {
        const response = await fetch('/api/attendance/today');
        if (!response.ok) return;
        const payload = await response.json();
        
        isClockedIn = !!payload.clockedIn;
        totalSeconds = Number(payload.workedSeconds || 0);

        if (clockBtn) {
            clockBtn.innerText = isClockedIn ? 'Clock out' : 'Clock in';
            clockBtn.classList.toggle('is-clocked-in', isClockedIn);
        }
        if (timeInDisplay) {
            timeInDisplay.innerText = payload.timeIn
                ? `Time In: ${new Date(payload.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Time In: --';
        }
        if (workingTimeDisplay) {
            workingTimeDisplay.innerText = `Working for: ${formatDuration(totalSeconds)}`;
        }
        if (isClockedIn && !timerInterval) startTimer();
    } catch (error) { console.error("Error refreshing state:", error); }
}

function startTimer() {
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        totalSeconds++;
        if (workingTimeDisplay) {
            workingTimeDisplay.innerText = `Working for: ${formatDuration(totalSeconds)}`;
        }
    }, 1000);
}

async function handleClockIn() {
    const response = await fetch('/api/attendance/clock-in', { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.detail) alert(errorData.detail);
        return;
    }
    
    isClockedIn = true;
    clockBtn.innerText = 'Clock out';
    clockBtn.classList.add('is-clocked-in');
    
    const now = new Date();
    timeInDisplay.innerText = `Time In: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    startTimer();
    loadInlineWeeklySummary(inlineWeekOffset);
}

async function handleClockOut() {
    const response = await fetch('/api/attendance/clock-out', { method: 'POST' });
    if (!response.ok) return;
    
    const payload = await response.json();
    const durationLabel = formatDuration(Number(payload.attendance?.workedSeconds || totalSeconds));
    
    isClockedIn = false;
    clearInterval(timerInterval);
    timerInterval = null;
    totalSeconds = 0;
    
    clockBtn.innerText = 'Clock in';
    clockBtn.classList.remove('is-clocked-in');
    workingTimeDisplay.innerText = 'Working for: 0h 00m';
    timeInDisplay.innerText = 'Time In: --';
    
    showClockOutSuccess(durationLabel);
    loadInlineWeeklySummary(inlineWeekOffset);
}

function showClockOutOverlay() {
    clockOutConfirmStep.classList.remove("clock-out-step--hidden");
    clockOutSuccessStep.classList.add("clock-out-step--hidden");
    clockOutOverlay.classList.add("clock-out-overlay--visible");
}

function showClockOutSuccess(durationLabel) {
    clockOutDurationText.innerText = `Total time: ${durationLabel}`;
    clockOutConfirmStep.classList.add("clock-out-step--hidden");
    clockOutSuccessStep.classList.remove("clock-out-step--hidden");
}

function hideClockOutOverlay() {
    clockOutOverlay.classList.remove("clock-out-overlay--visible");
}

if (clockBtn) clockBtn.addEventListener("click", () => isClockedIn ? showClockOutOverlay() : handleClockIn());
if (clockOutCancelBtn) clockOutCancelBtn.addEventListener("click", hideClockOutOverlay);
if (clockOutConfirmBtn) clockOutConfirmBtn.addEventListener("click", handleClockOut);
if (clockOutDismissBtn) clockOutDismissBtn.addEventListener("click", hideClockOutOverlay);


/* ── 5. DASHBOARD SUMMARY (INLINE TABLE) ────────────────── */

let inlineWeekOffset = 0;

async function loadInlineWeeklySummary(offset = 0) {
    const data = await fetchAttendanceData('weekly', offset);
    if (!data || !inlineTableBody) return;
    
    const rows = data.rows || [];
    let rowHtml = `<tr><td class="week-label">${escapeHtml(data.label || '')}</td>`;
    
    for (let i = 0; i < 7; i++) {
        const r = rows[i] || { hours: '--', status: '' };
        const statusHtml = r.status ? `<div class="muted">${escapeHtml(capitalize(r.status))}</div>` : '';
        const otHtml = r.overtime ? `<div style="color: #059669; font-size: 0.75rem; font-weight: 600;">+${r.overtime} OT</div>` : '';
        const utHtml = r.undertime ? `<div style="color: #dc2626; font-size: 0.75rem; font-weight: 600;">-${r.undertime} UT</div>` : '';
        rowHtml += `<td>${escapeHtml(r.hours || '--')}${statusHtml}${otHtml}${utHtml}</td>`;
    }
    rowHtml += `</tr>`;
    inlineTableBody.innerHTML = rowHtml;

    if (inlineWeekPickerSpan) {
        inlineWeekPickerSpan.textContent = (rows.length > 0 && rows[0].date) 
            ? `Week ${getSundayWeekNumber(new Date(rows[0].date))}`
            : data.label || 'Current Week';
    }
}

if (inlinePrevWeekBtn) inlinePrevWeekBtn.addEventListener('click', () => { inlineWeekOffset++; loadInlineWeeklySummary(inlineWeekOffset); });
if (inlineNextWeekBtn) inlineNextWeekBtn.addEventListener('click', () => { if (inlineWeekOffset > 0) { inlineWeekOffset--; loadInlineWeeklySummary(inlineWeekOffset); } });


/* ── 6. HISTORY MODAL LOGIC ─────────────────────────────── */

let currentModalView = "weekly";
let modalWeekOffset  = 0;
let modalMonthOffset = 0;

async function fetchAttendanceData(view, offset) {
    try {
        const response = await fetch(`/api/attendance/summary?view=${encodeURIComponent(view)}&offset=${encodeURIComponent(offset)}`);
        return response.ok ? await response.json() : null;
    } catch (err) { return null; }
}

async function refreshModalUI() {
    const data = await fetchAttendanceData(currentModalView, currentModalView === "weekly" ? modalWeekOffset : modalMonthOffset);
    
    if (!data) return;

    // --- FIX 1: Update the Date Range and Total Hours Display ---
    if (historyDateRange) {
        // This shows the "March 1 - March 7" or "October 2023" label
        historyDateRange.textContent = data.label || "--"; 
    }

    if (totalHoursCount) {
        // This updates the sidebar box with the actual hours from the API
        totalHoursCount.textContent = data.total || "0h 00m";
    }

    const labelEl = document.getElementById("hoursSummaryLabel");
    if (labelEl) {
        labelEl.textContent = (currentModalView === "weekly") 
            ? "Total Hours This Week" 
            : "Total Hours This Month";
    }
    // -----------------------------------------------------------

    if (currentModalView === "weekly") {
        weeklyTable.style.display = "table";
        monthlyGrid.style.display = "none";
        
        // Render table rows
        const rowsHtml = data.rows.map(r => `
            <tr>
                <td>${r.date}</td>
                <td>${r.day}</td>
                <td>${r.timeIn || '--'}</td>
                <td>${r.timeOut || '--'}</td>
                <td>
                    ${r.hours || '--'}
                    ${r.overtime ? `<br><small style="color: #059669; font-weight: 600;">+${r.overtime} OT</small>` : ""}
                    ${r.undertime ? `<br><small style="color: #dc2626; font-weight: 600;">-${r.undertime} UT</small>` : ""}
                </td>
                <td>
                    <span class="status-badge ${r.status}">${capitalize(r.status)}</span>
                    ${r.notes ? `<br><small style="color:#6a1b9a;font-style:italic;font-size:0.72rem;">${escapeHtml(r.notes)}</small>` : ""}
                </td>
            </tr>
        `).join("");

        // Note: Colspan is 4 for labels + 2 for hours/status to match the 6 columns
        weeklyTableBody.innerHTML = rowsHtml + `<tr class="total-row"><td colspan="4">Total</td><td colspan="2">${data.total}</td></tr>`;
    } else {
        weeklyTable.style.display = "none";
        monthlyGrid.style.display = "grid";
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let gridHtml = dayNames.map(d => `<div class="month-day-header">${d}</div>`).join("");
        
        for (let i = 0; i < data.firstDayOfWeek; i++) gridHtml += `<div class="month-day-cell empty"></div>`;
        
        for (let d = 1; d <= data.daysInMonth; d++) {
            const att = data.attendance[d];
            const isWeekend = (data.firstDayOfWeek + d - 1) % 7 === 0 || (data.firstDayOfWeek + d - 1) % 7 === 6;
            const statusClass = att ? att.status : (isWeekend ? "weekend" : "");
            gridHtml += `
                <div class="month-day-cell">
                    <span class="day-num">${d}</span>
                    ${statusClass ? `<span class="day-status ${statusClass}">${att ? capitalize(att.status) : "Off"}</span>` : ""}
                    ${att && att.notes ? `<span style="display:block;font-size:0.65rem;color:#6a1b9a;font-style:italic;margin-top:2px;line-height:1.2;">${escapeHtml(att.notes)}</span>` : ""}
                    ${att ? `<span class="day-hours">${att.hours}</span>` : ""}
                </div>`;
        }
        monthlyGrid.innerHTML = gridHtml;
    }
}

if (openHistoryBtn) openHistoryBtn.addEventListener("click", () => { historyModal.classList.add("open"); refreshModalUI(); });
if (closeHistoryBtn) closeHistoryBtn.addEventListener("click", () => historyModal.classList.remove("open"));

if (weeklyViewBtn) weeklyViewBtn.addEventListener("click", () => { currentModalView = "weekly"; weeklyViewBtn.classList.add("active"); monthlyViewBtn.classList.remove("active"); refreshModalUI(); });
if (monthlyViewBtn) monthlyViewBtn.addEventListener("click", () => { currentModalView = "monthly"; monthlyViewBtn.classList.add("active"); weeklyViewBtn.classList.remove("active"); refreshModalUI(); });

if (prevPeriodBtn) prevPeriodBtn.addEventListener("click", () => { 
    if (currentModalView === "weekly") modalWeekOffset++; else modalMonthOffset++; 
    refreshModalUI(); 
});
if (nextPeriodBtn) nextPeriodBtn.addEventListener("click", () => { 
    if (currentModalView === "weekly") { if (modalWeekOffset > 0) modalWeekOffset--; } 
    else { if (modalMonthOffset > 0) modalMonthOffset--; }
    refreshModalUI(); 
});


/* ── 7. TABS & HELPERS ──────────────────────────────────── */

if (tabLog && tabMonit) {
    tabLog.addEventListener('click', () => {
        tabLog.classList.add('active'); tabMonit.classList.remove('active');
        logContent.style.display = 'block'; monitContent.style.display = 'none';
    });
    tabMonit.addEventListener('click', () => {
        window.location.href = '/templates/head/head_attendancemonitoring.html';
    });
}

function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }
function formatDuration(s) { return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60).toString().padStart(2,"0")}m`; }
function getSundayWeekNumber(d) {
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.floor((Math.floor((d - start) / 86400000) + start.getDay()) / 7) + 1;
}

// Global Modal Close
window.addEventListener("click", (e) => { if (e.target === historyModal) historyModal.classList.remove("open"); });

/* ── 8. INITIALIZATION ───────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
    updateHeader();
    refreshAttendanceState();
    loadInlineWeeklySummary(0);
    loadEmployeeDetails();
});