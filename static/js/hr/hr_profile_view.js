function setupProfileViewPage() {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');

    if (sidebar && logoToggle) logoToggle.addEventListener('click', () => sidebar.classList.toggle('close'));
    if (sidebar && closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.add('close'));

    menuItems.forEach((item) => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach((content) => content.classList.remove('active'));

            const target = tab.getAttribute('data-tab');
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.classList.add('active');
        });
    });
}

function setInfoRowValue(labelNeedle, value) {
    const rows = document.querySelectorAll('.info-row');
    rows.forEach((row) => {
        const spans = row.querySelectorAll('span');
        if (spans.length < 2) return;
        if ((spans[0].textContent || '').toLowerCase().includes(labelNeedle.toLowerCase())) {
            spans[1].textContent = value || '--';
        }
    });
}

function applyProfileToView(profile) {
    const nameEl = document.querySelector('.profile-info h2');
    const roleEl = document.querySelector('.profile-info .role');
    const employeeIdEl = document.querySelector('.profile-info .employee-id');

    if (nameEl) nameEl.textContent = profile.fullName || 'Employee';
    if (roleEl) roleEl.textContent = profile.position || profile.roleLabel || 'Employee';
    if (employeeIdEl) employeeIdEl.textContent = `Employee ID: ${profile.employeeNo || profile.id || '--'}`;

    const details = document.querySelectorAll('.employment-details p');
    if (details[0]) details[0].innerHTML = `<strong>Status</strong> <span class="status-dot active-dot"></span> ${profile.isActive ? 'Active' : 'Inactive'}`;
    if (details[1]) details[1].innerHTML = `<strong>Department:</strong> ${profile.department || '--'}`;
    if (details[2]) details[2].innerHTML = `<strong>Employment Type:</strong> ${profile.employmentType || '--'}`;
    if (details[3]) details[3].innerHTML = `<strong>Date Hired:</strong> ${profile.dateHired || '--'}`;

    const contactLines = document.querySelectorAll('.contact-info p');
    if (contactLines[0]) contactLines[0].innerHTML = `<i class="fas fa-envelope"></i> ${profile.email || '--'}`;
    if (contactLines[1]) contactLines[1].innerHTML = `<i class="fas fa-phone"></i> ${profile.contactNumber || '--'}`;
    if (contactLines[2]) contactLines[2].innerHTML = `<i class="fas fa-location-dot"></i> ${profile.address || '--'}`;

    setInfoRowValue('Assigned Department', profile.department || '--');
}

async function loadProfileViewData() {
    try {
        const response = await fetch('/api/profile/me');
        if (!response.ok) return;
        const profile = await response.json();
        applyProfileToView(profile);
    } catch (error) {
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupProfileViewPage();
    loadProfileViewData();
});