function setupProfileViewPage() {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeBtn');
    const logoToggle = document.getElementById('logoToggle');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item) => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    if (sidebar && closeBtn) {
        closeBtn.onclick = () => sidebar.classList.toggle('close');
    }

    if (sidebar && logoToggle) {
        logoToggle.onclick = () => sidebar.classList.toggle('close');
    }

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabs.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            tabs.forEach((t) => t.classList.remove('active'));
            tabContents.forEach((c) => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');
        });
    });
}

/* =========================
   PROFILE FILL (FIXED IDs)
   ========================= */
function applyProfileToView(profile) {
    document.getElementById('employeeName').textContent =
        profile.fullName || 'School Director';

    document.getElementById('employeeRole').textContent =
        profile.position || profile.roleLabel || 'School Director';

    document.getElementById('employeeId').textContent =
        `Employee ID: ${profile.employeeNo || profile.id || '--'}`;

    document.getElementById('employeeStatus').textContent =
        profile.isActive ? 'Active' : 'Inactive';

    document.getElementById('statusDot').style.background =
        profile.isActive ? '#8ddf9b' : '#f08d8d';

    document.getElementById('employeePosition').textContent =
        profile.position || '--';

    document.getElementById('employeeDepartment').textContent =
        profile.department || '--';

    document.getElementById('employeeType').textContent =
        profile.employmentType || '--';

    document.getElementById('employeeDateHired').textContent =
        profile.dateHired || '--';

    document.getElementById('contactEmail').textContent =
        profile.email || '--';

    document.getElementById('contactPhone').textContent =
        profile.contactNumber || '--';

    document.getElementById('contactLocation').textContent =
        profile.address || '--';

    document.getElementById('deptName').textContent =
        profile.department || '--';
}

/* =========================
   HARD CODED EMPLOYMENT HISTORY (FORCED DISPLAY)
   ========================= */
function loadEmploymentHistory() {
    const container = document.getElementById('timelineContainer');

    container.innerHTML = `
        <div class="timeline-item">
            <div class="timeline-date">2026</div>
            <div class="timeline-content">
                <h4>Joined as a School Director</h4>
                <p>Account successfully created and assigned role</p>
            </div>
        </div>

        <div class="timeline-item">
            <div class="timeline-date">2026</div>
            <div class="timeline-content">
                <h4>Account Created</h4>
                <p>User account was created in the system</p>
            </div>
        </div>
    `;
}

/* =========================
   LOAD PROFILE (OPTIONAL BACKEND)
   ========================= */
async function loadProfileViewData() {
    try {
        const response = await fetch('/api/profile/me', {
            credentials: 'include'
        });

        if (!response.ok) return;

        const profile = await response.json();
        applyProfileToView(profile);

    } catch (err) {
        console.error(err);
    }
}

/* =========================
   INIT
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
    setupProfileViewPage();
    loadProfileViewData();
    loadEmploymentHistory(); // IMPORTANT
});